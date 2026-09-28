use serde::Serialize;
use std::fs;
use std::path::Path;
use crate::DB_STATE;
use crate::db::seed::seed_database_with_profile;
use super::backups::{backup_dir_from_db_path, checksum_file, write_backup};
use super::users::user_has_permission;

/// Literal text the frontend asks for before running the destructive reset.
pub const INITIAL_DATA_CONFIRM_TEXT: &str = "RESTAURAR";

/// Permission key that gates the "restore initial data" tool. Already granted
/// to the owner and administrator roles, so no new permission has to be
/// propagated to existing installations.
pub const DATABASE_MANAGE_PERMISSION: &str = "admin.database.manage";

/// Rows that survive a reset so the installation remains recoverable:
///  * `backup_history` / `restore_history` — the pre-reset backup was just
///    recorded in `backup_history` and must stay restorable afterwards.
///  * `audit_logs` — the reset itself is an audit event and the history of the
///    installation is part of its "initial state".
const PRESERVED_TABLES: &[&str] = &["backup_history", "restore_history", "audit_logs"];

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InitialDataPreview {
    pub users: i64,
    pub roles: i64,
    pub permissions: i64,
    pub products: i64,
    pub warehouses: i64,
    pub customers: i64,
    pub sales: i64,
    pub purchase_orders: i64,
    pub quotes: i64,
    pub inventory_movements: i64,
    pub backup_count: i64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InitialDataResetResult {
    pub backup_file: String,
    pub deleted_rows: i64,
    pub users_restored: i64,
    pub roles_restored: i64,
    pub products_restored: i64,
    pub warehouses_restored: i64,
}

fn count(conn: &rusqlite::Connection, table: &str) -> Result<i64, String> {
    conn.query_row(&format!("SELECT COUNT(*) FROM {table}"), [], |row| row.get(0))
        .map_err(|e| e.to_string())
}

/// Counts of every row the reset would remove. Non-destructive, so the
/// confirmation dialog can show the exact blast radius up front.
#[tauri::command]
pub fn get_initial_data_reset_preview() -> Result<InitialDataPreview, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    preview(&conn)
}

pub fn preview(conn: &rusqlite::Connection) -> Result<InitialDataPreview, String> {
    Ok(InitialDataPreview {
        users: count(conn, "users")?,
        roles: count(conn, "roles")?,
        permissions: count(conn, "permissions")?,
        products: count(conn, "products")?,
        warehouses: count(conn, "warehouses")?,
        customers: count(conn, "customers")?,
        sales: count(conn, "sales")?,
        purchase_orders: count(conn, "purchase_orders")?,
        quotes: count(conn, "quotes")?,
        inventory_movements: count(conn, "inventory_movements")?,
        backup_count: count(conn, "backup_history")?,
    })
}

/// Snapshot the live database into `<db dir>/backups` before anything is
/// deleted, so even a fully wiped installation can be brought back. Follows the
/// existing backup conventions (streaming online-backup copy, checksum,
/// `backup_history` record) but uses the documented pre-reset naming scheme and
/// never touches a name another backup could collide with.
fn create_pre_reset_backup(conn: &rusqlite::Connection, db_path: &Path, created_by: i64) -> Result<String, String> {
    let backup_dir = backup_dir_from_db_path(db_path);
    fs::create_dir_all(&backup_dir).map_err(|e| format!("Failed to create backup directory: {e}"))?;

    let file_name = format!(
        "inventory-gear-backup-{}.sqlite",
        chrono::Utc::now().format("%Y-%m-%d-%H%M%S")
    );
    let dest_path = backup_dir.join(&file_name);
    let tmp_path = backup_dir.join(format!("{file_name}.tmp"));

    let result = write_backup(conn, &tmp_path)
        .and_then(|_| {
            Ok(fs::rename(&tmp_path, &dest_path)
                .map_err(|e| format!("Failed to finalize backup file: {e}"))?)
        })
        .and_then(|_| {
            let checksum = checksum_file(&dest_path)?;
            let file_size = fs::metadata(&dest_path)
                .map_err(|e| format!("Failed to stat backup file: {e}"))?
                .len() as i64;
            conn.execute(
                "INSERT INTO backup_history (file_name, file_path, file_size, backup_type, compression, encryption, status, checksum, notes, created_by)
                 VALUES (?1, ?2, ?3, 'pre_reset', 'none', 'none', 'completed', ?4, ?5, ?6)",
                rusqlite::params![
                    file_name,
                    dest_path.to_string_lossy().to_string(),
                    file_size,
                    checksum,
                    "Backup created before restoring the database to its initial data",
                    created_by,
                ],
            )
            .map_err(|e| e.to_string())?;
            Ok(())
        });

    let _ = fs::remove_file(&tmp_path);
    result.map(|_| file_name)
}

/// Delete every row in every data table except the preserved history tables.
/// The schema itself is left intact (nothing is DROPped), so the tables created
/// by `schema::create_tables` remain exactly as the running app expects.
fn delete_all_business_data(conn: &rusqlite::Connection) -> Result<i64, String> {
    let mut stmt = conn
        .prepare(
            "SELECT name FROM sqlite_master
              WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
        )
        .map_err(|e| e.to_string())?;

    let tables: Vec<String> = stmt
        .query_map([], |row| row.get::<_, String>(0))
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .filter(|name| !PRESERVED_TABLES.contains(&name.as_str()))
        .collect();

    let mut deleted: i64 = 0;
    for table in tables {
        let changes = conn
            .execute(&format!("DELETE FROM \"{table}\""), [])
            .map_err(|e| e.to_string())?;
        deleted += changes as i64;
    }
    Ok(deleted)
}

/// Deletes every row in every data table (and only those) and re-runs the
/// first-launch seed, producing exactly the state a fresh install of this
/// profile would have.
///
/// Scope (user-confirmed):
///   - all business, catalog, selling, purchasing, CRM and user data
///   - `settings` / `application_settings` (re-seeded to defaults)
///   - all permissions / roles (re-seeded, so the acting user's session and
///     the in-memory auth state are invalidated on purpose)
///
/// Untouched: `backup_history` (the just-created pre-reset backup), the
/// restore history and the audit trail — those must survive to stay restorable.
///
/// A transaction wraps the destructive phase: if the re-seed fails, everything
/// rolls back and the database is left untouched, with the pre-reset backup
/// still on disk as a second safety net.
///
/// Gated server-side by the `admin.database.manage` permission and the literal
/// confirm token, so it can never be triggered from the renderer with neither.
#[tauri::command]
pub fn reset_to_initial_data(confirm: String, actor_id: Option<i64>) -> Result<InitialDataResetResult, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    reset_to_initial_data_inner(&conn, &db.db_path, &db.profile, &confirm, actor_id)
}

/// Shared core so unit tests can exercise the full reset against a plain
/// `Connection` without the `DB_STATE` global.
pub fn reset_to_initial_data_inner(
    conn: &rusqlite::Connection,
    db_path: &Path,
    profile: &str,
    confirm: &str,
    actor_id: Option<i64>,
) -> Result<InitialDataResetResult, String> {
    if !confirm.contains(INITIAL_DATA_CONFIRM_TEXT) {
        return Err(format!("Type '{}' to confirm the reset", INITIAL_DATA_CONFIRM_TEXT));
    }

    let actor = actor_id.ok_or_else(|| "Could not determine the current user".to_string())?;
    if !user_has_permission(conn, actor, DATABASE_MANAGE_PERMISSION)? {
        return Err("No tienes permiso para restaurar los datos iniciales.".to_string());
    }

    // Backup before deleting anything; a failed backup aborts the reset so the
    // destructive phase only ever runs with a verified snapshot on disk.
    let backup_file = create_pre_reset_backup(conn, db_path, actor)?;

    // Suspended BEFORE the transaction begins: SQLite only honours the
    // `foreign_keys` pragma when a transaction is opened, so a toggle inside it
    // is a silent no-op. The preserved history tables still reference rows that
    // are about to be deleted (e.g. `backup_history.created_by` -> users), so
    // enforcement must be off for the destructive phase.
    conn.execute_batch("PRAGMA foreign_keys = OFF").map_err(|e| e.to_string())?;
    if let Err(e) = conn.execute_batch("BEGIN IMMEDIATE") {
        let _ = conn.execute_batch("PRAGMA foreign_keys = ON");
        return Err(e.to_string());
    }
    let tx_result: std::result::Result<InitialDataResetResult, String> = (|| {
        let deleted_rows = delete_all_business_data(conn)?;
        // Let AUTOINCREMENT counters restart so re-seeded rows begin at the
        // same ids a fresh installation produces. No-op when `sqlite_sequence`
        // does not exist.
        let _ = conn.execute_batch("DELETE FROM sqlite_sequence");

        seed_database_with_profile(conn, profile).map_err(|e| e.to_string())?;

        let users_restored = count(conn, "users")?;
        let roles_restored = count(conn, "roles")?;
        let products_restored = count(conn, "products")?;
        let warehouses_restored = count(conn, "warehouses")?;

        conn.execute(
            "INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, severity)
             VALUES (?1, 'reset_to_initial_data', 'database', ?2, ?3, 'critical')",
            rusqlite::params![
                actor,
                backup_file,
                format!(
                    "Database restored to its initial data: {} rows removed, {} users / {} roles recreated, products {}, warehouses {} (pre-reset backup: {})",
                    deleted_rows, users_restored, roles_restored, products_restored, warehouses_restored, backup_file
                )
            ],
        )
        .ok();

        Ok(InitialDataResetResult {
            backup_file,
            deleted_rows,
            users_restored,
            roles_restored,
            products_restored,
            warehouses_restored,
        })
    })();

    let outcome = match tx_result {
        Ok(result) => {
            conn.execute_batch("COMMIT").map_err(|e| {
                let _ = conn.execute_batch("ROLLBACK");
                e.to_string()
            })?;
            Ok(result)
        }
        Err(e) => {
            let _ = conn.execute_batch("ROLLBACK");
            Err(e)
        }
    };
    // The connection leaves the destructive phase with enforcement back on,
    // whatever the transaction outcome (the PRAGMA change is not transactional).
    let _ = conn.execute_batch("PRAGMA foreign_keys = ON");
    outcome
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::config::PROFILE_SINGLE_STORE;
    use crate::db::init_database_with_profile;

    fn test_db() -> rusqlite::Connection {
        let dir = std::env::temp_dir().join(format!("ig_initreset_test_{}", uuid::Uuid::new_v4()));
        std::fs::create_dir_all(&dir).expect("create temp dir");
        let path = dir.join("init.db");
        init_database_with_profile(path.to_str().unwrap(), PROFILE_SINGLE_STORE).expect("init db")
    }

    /// Populates extra selling / CRM data on top of the seed so the reset scope
    /// can be asserted both ways (removed vs recreated).
    fn seed_extra_data(conn: &rusqlite::Connection) -> i64 {
        conn.execute(
            "INSERT INTO customers (name, email) VALUES ('Cliente', 'cliente@correo.test')",
            [],
        )
        .expect("insert customer");
        let customer_id = conn.last_insert_rowid();

        conn.execute(
            "INSERT INTO products (name, sku, stock_quantity)
             VALUES ('Producto Temporal', 'SKU-TEMP-X', 3)",
            [],
        )
        .expect("insert extra product");
        let product_id = conn.last_insert_rowid();

        conn.execute(
            "INSERT INTO quotes (quote_number, customer_id, subtotal, tax_amount, total)
             VALUES ('QTE-00001', ?1, 50, 8, 58)",
            rusqlite::params![customer_id],
        )
        .expect("insert quote");

        conn.execute(
            "INSERT INTO sales (sale_number, customer_id, subtotal, tax_amount, total, payment_status)
             VALUES ('INV-00001', ?1, 180, 20, 200, 'paid')",
            rusqlite::params![customer_id],
        )
        .expect("insert sale");

        conn.execute(
            "INSERT INTO inventory_movements (product_id, quantity, type, reference_type, reference_id, notes)
             VALUES (?1, -1, 'out', 'sale', 'INV-00001', 'Sale checkout')",
            rusqlite::params![product_id],
        )
        .expect("insert movement");

        customer_id
    }

    #[test]
    fn preview_reports_the_rows_a_reset_would_remove() {
        let conn = test_db();
        seed_extra_data(&conn);

        let p = preview(&conn).unwrap();
        assert!(p.users >= 1);
        assert!(p.roles >= 1);
        assert!(p.permissions >= 1);
        assert!(p.warehouses >= 1);
        assert_eq!(p.sales, 1);
        assert_eq!(p.quotes, 1);
        assert_eq!(p.inventory_movements, 1);
    }

    #[test]
    fn reset_requires_confirmation_token() {
        let conn = test_db();
        seed_extra_data(&conn);
        let before_backups: i64 = count(&conn, "backup_history").unwrap();

        let err = reset_to_initial_data_inner(&conn, Path::new("/tmp/nonexistent"), PROFILE_SINGLE_STORE, "nope", Some(1)).unwrap_err();
        assert!(err.contains("RESTAURAR"));

        // Nothing was deleted and no backup was created behind a bad confirm.
        let sales: i64 = count(&conn, "sales").unwrap();
        assert_eq!(sales, 1);
        assert_eq!(count(&conn, "backup_history").unwrap(), before_backups);
    }

    #[test]
    fn reset_requires_database_manage_permission() {
        let conn = test_db();
        // The seeded demo accounts run owner=1, admin=2, cashier=3 ...
        // `cashier` has no `admin.database.manage`; find it by username.
        let cashier_id: i64 = conn
            .query_row(
                "SELECT id FROM users WHERE username = 'cashier'",
                [],
                |row| row.get(0),
            )
            .expect("cashier exists");
        seed_extra_data(&conn);

        let err = reset_to_initial_data_inner(&conn, Path::new("/tmp/nonexistent"), PROFILE_SINGLE_STORE, "RESTAURAR", Some(cashier_id)).unwrap_err();
        assert!(err.contains("permiso"));

        let users: i64 = count(&conn, "users").unwrap();
        assert_eq!(users, 6, "no user was removed behind a failed permission check");
    }

    #[test]
    fn reset_wipes_business_data_and_restores_initial_state() {
        let conn = test_db();
        seed_extra_data(&conn);

        let before_customers: i64 = count(&conn, "customers").unwrap();
        let before_products: i64 = count(&conn, "products").unwrap();
        let before_users: i64 = count(&conn, "users").unwrap();
        let before_backups: i64 = count(&conn, "backup_history").unwrap();

        // `db_path` is inside the test DB dir so the pre-reset backup lands next
        // to it; use the same temp dir the test connection opened.
        let dir: std::path::PathBuf = std::env::temp_dir()
            .join("ig_initreset_backup")
            .join(format!("{}", uuid::Uuid::new_v4()));
        std::fs::create_dir_all(&dir).expect("create backup dir");
        let db_path = dir.join("init.db");

        let r = reset_to_initial_data_inner(&conn, &db_path, PROFILE_SINGLE_STORE, "RESTAURAR", Some(1)).unwrap();

        // The pre-reset backup file exists on disk.
        assert!(db_path.parent().unwrap().join("backups").join(&r.backup_file).exists());

        // Selling / CRM extras are gone and the seeded catalog is back.
        assert_eq!(count(&conn, "sales").unwrap(), 0);
        assert_eq!(count(&conn, "quotes").unwrap(), 0);
        assert_eq!(count(&conn, "inventory_movements").unwrap(), 0);
        assert_eq!(r.users_restored, before_users);
        assert_eq!(r.products_restored, before_products - 1, "the one temporary product is gone");
        let customers: i64 = count(&conn, "customers").unwrap();
        assert_eq!(customers, before_customers - 1, "the extra customer is gone");

        // History tables survive and gain exactly one backup record.
        assert_eq!(count(&conn, "backup_history").unwrap(), before_backups + 1);
        assert!(r.deleted_rows > 0);

        // The acting user's row was recreated with a fresh id (their in-memory
        // auth can no longer map to a session), flagged to change password.
        let (requires_change, owner_role): (i64, i64) = conn
            .query_row(
                "SELECT u.password_change_required, u.role_id FROM users u
                  JOIN roles rl ON rl.id = u.role_id
                 WHERE u.username = 'owner'",
                [],
                |row| Ok((row.get(0)?, row.get(1)?)),
            )
            .expect("owner recreated");
        assert_eq!(requires_change, 1);
        assert!(owner_role >= 1);

        // Reset recorded in the (preserved) audit trail.
        let audits: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM audit_logs WHERE action = 'reset_to_initial_data'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(audits, 1);
    }
}