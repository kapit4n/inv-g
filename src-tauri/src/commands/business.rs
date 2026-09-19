use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use tauri::State;
use crate::db::DbState;

// ── Error codes (stable, translatable on the frontend) ──

pub const ERR_MULTI_STORE_REQUIRED: &str = "ERROR_MULTI_STORE_REQUIRED";
pub const ERR_STORE_REQUIRED: &str = "ERROR_STORE_REQUIRED";
pub const ERR_STORE_NOT_FOUND: &str = "ERROR_STORE_NOT_FOUND";
pub const ERR_TRANSFER_SAME_STORE: &str = "ERROR_TRANSFER_SAME_STORE";
pub const ERR_DEV_ONLY: &str = "ERROR_DEV_ONLY";

fn get_conn<'r>(state: &'r State<'r, DbState>) -> Result<std::sync::MutexGuard<'r, Connection>, String> {
    state.conn.lock().map_err(|e| format!("Database lock error: {}", e))
}

// ── Structs ──

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BusinessCapabilities {
    pub multi_store: bool,
    pub store_selection: bool,
    pub store_management: bool,
    pub store_transfers: bool,
    pub cross_store_reports: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StoreInfo {
    pub id: i64,
    pub name: String,
    pub code: String,
    pub address: Option<String>,
    pub city: Option<String>,
    pub is_active: bool,
    pub is_default: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BusinessContext {
    pub active_profile: String,
    pub database_path: String,
    pub multi_store: bool,
    pub store_count: i64,
    pub default_store_id: Option<i64>,
    pub stores: Vec<StoreInfo>,
    pub capabilities: BusinessCapabilities,
    pub dev_mode: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StoreSalesRow {
    pub store_id: i64,
    pub store_name: String,
    pub store_code: String,
    pub sales_count: i64,
    pub total_revenue: f64,
    pub cash_total: f64,
    pub card_total: f64,
    pub transfer_total: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StoreInventoryRow {
    pub store_id: i64,
    pub store_name: String,
    pub store_code: String,
    pub product_count: i64,
    pub total_stock_units: i64,
    pub inventory_value: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TransferInput {
    pub product_id: i64,
    pub from_store_id: i64,
    pub to_store_id: i64,
    pub quantity: i64,
    pub notes: Option<String>,
    pub created_by: Option<i64>,
}

// ── Core capability helpers ──

pub fn store_count(conn: &Connection) -> i64 {
    conn.query_row("SELECT COUNT(*) FROM warehouses WHERE is_active = 1", [], |row| row.get(0))
        .unwrap_or(0)
}

pub fn is_multi_store(conn: &Connection) -> bool {
    store_count(conn) >= 2
}

pub fn capabilities_for(conn: &Connection) -> BusinessCapabilities {
    let multi = is_multi_store(conn);
    BusinessCapabilities {
        multi_store: multi,
        store_selection: multi,
        store_management: multi,
        store_transfers: multi,
        cross_store_reports: multi,
    }
}

/// All active stores (is_default = first/only store).
fn stores(conn: &Connection) -> Vec<StoreInfo> {
    let mut stmt = match conn.prepare(
        "SELECT id, name, code, address, city, is_active FROM warehouses WHERE is_active = 1 ORDER BY code"
    ) {
        Ok(s) => s,
        Err(_) => return Vec::new(),
    };
    let result: Result<Vec<StoreInfo>, _> = stmt
        .query_map([], |row| {
            Ok(StoreInfo {
                id: row.get(0)?,
                name: row.get(1)?,
                code: row.get(2)?,
                address: row.get(3)?,
                city: row.get(4)?,
                is_active: row.get(5)?,
                is_default: false,
            })
        })
        .map_err(|e| e)
        .and_then(|rows| rows.collect::<Result<Vec<_>, _>>());
    let mut list = result.unwrap_or_default();
    if let Some(first) = list.first_mut() {
        first.is_default = true;
    }
    list
}

/// The single active store when store_selection is off (single-store), else None.
pub fn default_store_id(conn: &Connection) -> Option<i64> {
    if is_multi_store(conn) {
        None
    } else {
        conn.query_row(
            "SELECT id FROM warehouses WHERE is_active = 1 ORDER BY code LIMIT 1",
            [],
            |row| row.get(0),
        )
        .ok()
    }
}

/// Ensures the operation is only allowed for multi-store databases.
pub fn require_multi_store(conn: &Connection) -> Result<(), String> {
    if is_multi_store(conn) {
        Ok(())
    } else {
        Err(ERR_MULTI_STORE_REQUIRED.to_string())
    }
}

/// Resolves the store used by a sale on checkout.
///
/// * multi-store: the caller MUST supply a store id; otherwise `ERROR_STORE_REQUIRED`.
/// * single-store: the only store is used automatically.
/// * an explicit id is validated against the active stores.
pub fn resolve_checkout_store(conn: &Connection, warehouse_id: Option<i64>) -> Result<Option<i64>, String> {
    let multi = is_multi_store(conn);
    match warehouse_id {
        Some(id) => {
            let exists: bool = conn
                .query_row(
                    "SELECT COUNT(*) FROM warehouses WHERE id = ?1 AND is_active = 1",
                    params![id],
                    |row| row.get(0),
                )
                .unwrap_or(0)
                > 0;
            if !exists {
                return Err(ERR_STORE_NOT_FOUND.to_string());
            }
            Ok(Some(id))
        }
        None => {
            if multi {
                Err(ERR_STORE_REQUIRED.to_string())
            } else {
                Ok(default_store_id(conn))
            }
        }
    }
}

fn next_transfer_number(conn: &Connection) -> String {
    let count: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM inventory_movements WHERE reference_type = 'transfer'",
            [],
            |row| row.get(0),
        )
        .unwrap_or(0);
    format!("TRF-{:04}", 1001 + count)
}

// ── Tauri commands ──

#[tauri::command]
pub fn get_business_context(state: State<DbState>) -> Result<BusinessContext, String> {
    let conn = get_conn(&state)?;
    let all_stores = stores(&conn);

    Ok(BusinessContext {
        active_profile: state.profile.clone(),
        database_path: state.db_path.to_string_lossy().to_string(),
        multi_store: is_multi_store(&conn),
        store_count: all_stores.len() as i64,
        default_store_id: default_store_id(&conn),
        capabilities: capabilities_for(&conn),
        stores: all_stores,
        dev_mode: cfg!(debug_assertions),
    })
}

#[tauri::command]
pub fn get_business_capabilities(state: State<DbState>) -> Result<BusinessCapabilities, String> {
    let conn = get_conn(&state)?;
    Ok(capabilities_for(&conn))
}

/// Development-only: persists the desired profile and asks for a restart.
/// Never deletes or migrates any database; only writes `profile.json`.
#[tauri::command]
pub fn switch_database_profile(state: State<DbState>, profile: String) -> Result<String, String> {
    if !cfg!(debug_assertions) {
        return Err(ERR_DEV_ONLY.to_string());
    }
    if !crate::config::is_valid_profile(&profile) {
        return Err(format!("Unknown database profile: {}", profile));
    }

    let data_dir = state
        .db_path
        .parent()
        .map(|p| p.to_path_buf())
        .ok_or_else(|| "Could not resolve data directory".to_string())?;

    crate::config::write_active_profile(&data_dir, &profile)
        .map_err(|e| format!("Failed to write profile: {}", e))?;

    let db_file = crate::config::profile_db_file_name(&profile);
    Ok(format!("Profile set to '{}'. Database file: {}. Please restart the app.", profile, db_file))
}

/// Transfers a product to another store (multi-store only).
/// Logs transfer_out / transfer_in movements and reassigns the product's home
/// store. Global stock is shared, so the stock counter is not modified.
#[tauri::command]
pub fn transfer_inventory_between_stores(
    state: State<DbState>,
    input: TransferInput,
) -> Result<String, String> {
    let conn = get_conn(&state)?;
    transfer_for_conn(&conn, input)
}

fn transfer_for_conn(conn: &Connection, input: TransferInput) -> Result<String, String> {
    require_multi_store(conn)?;

    if input.from_store_id == input.to_store_id {
        return Err(ERR_TRANSFER_SAME_STORE.to_string());
    }
    if input.quantity <= 0 {
        return Err("Transfer quantity must be greater than zero".to_string());
    }

    let from_exists: bool = conn
        .query_row(
            "SELECT COUNT(*) FROM warehouses WHERE id = ?1 AND is_active = 1",
            params![input.from_store_id],
            |row| row.get(0),
        )
        .unwrap_or(0)
        > 0;
    let to_exists: bool = conn
        .query_row(
            "SELECT COUNT(*) FROM warehouses WHERE id = ?1 AND is_active = 1",
            params![input.to_store_id],
            |row| row.get(0),
        )
        .unwrap_or(0)
        > 0;
    if !from_exists || !to_exists {
        return Err(ERR_STORE_NOT_FOUND.to_string());
    }

    let product: Option<(i64, Option<i64>)> = conn
        .query_row(
            "SELECT stock_quantity, warehouse_id FROM products WHERE id = ?1 AND is_active = 1",
            params![input.product_id],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .ok();
    let (stock, current_warehouse) =
        product.ok_or_else(|| "Product not found".to_string())?;
    if stock < input.quantity {
        return Err("Insufficient stock for transfer".to_string());
    }
    if current_warehouse != Some(input.from_store_id) {
        return Err("Product is not assigned to the source store".to_string());
    }

    let transfer_number = next_transfer_number(conn);
    let note = input.notes.unwrap_or_else(|| "Store transfer".to_string());

    conn.execute(
        "INSERT INTO inventory_movements (product_id, warehouse_id, quantity, type, reference_type, reference_id, notes, created_by)
         VALUES (?1, ?2, ?3, 'transfer_out', 'transfer', ?4, ?5, ?6)",
        params![input.product_id, input.from_store_id, -input.quantity, transfer_number, format!("{} (OUT)", note), input.created_by],
    ).map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO inventory_movements (product_id, warehouse_id, quantity, type, reference_type, reference_id, notes, created_by)
         VALUES (?1, ?2, ?3, 'transfer_in', 'transfer', ?4, ?5, ?6)",
        params![input.product_id, input.to_store_id, input.quantity, transfer_number, format!("{} (IN)", note), input.created_by],
    ).map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE products SET warehouse_id = ?1, updated_at = datetime('now') WHERE id = ?2",
        params![input.to_store_id, input.product_id],
    ).map_err(|e| e.to_string())?;

    Ok(transfer_number)
}

#[tauri::command]
pub fn get_store_sales(state: State<DbState>) -> Result<Vec<StoreSalesRow>, String> {
    let conn = get_conn(&state)?;
    require_multi_store(&conn)?;

    let mut stmt = conn.prepare(
        "SELECT w.id, w.name, w.code,
                COUNT(DISTINCT s.id) as sales_count,
                COALESCE(SUM(s.total), 0) as total_revenue,
                COALESCE(SUM(CASE WHEN s.payment_method = 'cash' THEN s.total END), 0) as cash_total,
                COALESCE(SUM(CASE WHEN s.payment_method = 'card' THEN s.total END), 0) as card_total,
                COALESCE(SUM(CASE WHEN s.payment_method = 'transfer' THEN s.total END), 0) as transfer_total
         FROM warehouses w
         LEFT JOIN sales s ON s.warehouse_id = w.id
         WHERE w.is_active = 1
         GROUP BY w.id
         ORDER BY w.code"
    ).map_err(|e| e.to_string())?;

    let rows = stmt.query_map([], |row| {
        Ok(StoreSalesRow {
            store_id: row.get(0)?,
            store_name: row.get(1)?,
            store_code: row.get(2)?,
            sales_count: row.get(3)?,
            total_revenue: row.get(4)?,
            cash_total: row.get(5)?,
            card_total: row.get(6)?,
            transfer_total: row.get(7)?,
        })
    }).map_err(|e| e.to_string())?;

    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_store_inventory(state: State<DbState>) -> Result<Vec<StoreInventoryRow>, String> {
    let conn = get_conn(&state)?;
    require_multi_store(&conn)?;

    let mut stmt = conn.prepare(
        "SELECT w.id, w.name, w.code,
                COUNT(p.id) as product_count,
                COALESCE(SUM(p.stock_quantity), 0) as total_stock_units,
                COALESCE(SUM(p.stock_quantity * p.cost_price), 0) as inventory_value
         FROM warehouses w
         LEFT JOIN products p ON p.warehouse_id = w.id AND p.is_active = 1
         WHERE w.is_active = 1
         GROUP BY w.id
         ORDER BY w.code"
    ).map_err(|e| e.to_string())?;

    let rows = stmt.query_map([], |row| {
        Ok(StoreInventoryRow {
            store_id: row.get(0)?,
            store_name: row.get(1)?,
            store_code: row.get(2)?,
            product_count: row.get(3)?,
            total_stock_units: row.get(4)?,
            inventory_value: row.get(5)?,
        })
    }).map_err(|e| e.to_string())?;

    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::init_database;
    use crate::config::{PROFILE_DEFAULT, PROFILE_SINGLE_STORE, PROFILE_MULTI_STORE, PROFILE_EMPTY};

    fn test_db(profile: &str) -> Connection {
        let dir = std::env::temp_dir().join(format!("ig_business_test_{}", uuid::Uuid::new_v4()));
        std::fs::create_dir_all(&dir).unwrap();
        let path = dir.join(format!("{}.db", profile));
        crate::db::init_database_with_profile(path.to_str().unwrap(), profile).expect("init db")
    }

    #[test]
    fn empty_profile_has_no_stores_and_no_capabilities() {
        let db = test_db(PROFILE_EMPTY);
        assert_eq!(store_count(&db), 0);
        assert!(!is_multi_store(&db));
        let caps = capabilities_for(&db);
        assert!(!caps.multi_store);
        assert!(!caps.store_selection);
        assert!(!caps.store_management);
        assert!(!caps.store_transfers);
        assert!(!caps.cross_store_reports);
        assert_eq!(default_store_id(&db), None);
    }

    #[test]
    fn single_store_profile_has_exactly_one_store() {
        let db = test_db(PROFILE_SINGLE_STORE);
        assert_eq!(store_count(&db), 1);
        assert!(!is_multi_store(&db));
        let st = stores(&db);
        assert_eq!(st.len(), 1);
        assert!(st[0].is_default);
        assert_eq!(st[0].code, "WH-001");
        assert_eq!(default_store_id(&db), Some(st[0].id));
        assert!(require_multi_store(&db).is_err());
    }

    #[test]
    fn multi_store_profile_has_three_stores_and_capabilities() {
        let db = test_db(PROFILE_MULTI_STORE);
        assert_eq!(store_count(&db), 3);
        assert!(is_multi_store(&db));
        let caps = capabilities_for(&db);
        assert!(caps.multi_store && caps.store_selection && caps.store_management && caps.store_transfers && caps.cross_store_reports);
        assert_eq!(default_store_id(&db), None);
    }

    #[test]
    fn default_profile_matches_legacy_three_stores() {
        let db = test_db(PROFILE_DEFAULT);
        assert_eq!(store_count(&db), 3);
    }

    #[test]
    fn resolve_checkout_store_variants() {
        let single = test_db(PROFILE_SINGLE_STORE);
        let resolved = resolve_checkout_store(&single, None).unwrap();
        assert!(resolved.is_some());

        let multi = test_db(PROFILE_MULTI_STORE);
        assert_eq!(resolve_checkout_store(&multi, None).unwrap_err(), ERR_STORE_REQUIRED);
        let st = stores(&multi);
        assert!(resolve_checkout_store(&multi, Some(st[1].id)).is_ok());
        assert_eq!(resolve_checkout_store(&multi, Some(99999)).unwrap_err(), ERR_STORE_NOT_FOUND);
    }

    #[test]
    fn transfer_blocked_on_single_store() {
        let db = test_db(PROFILE_SINGLE_STORE);
        let input = TransferInput {
            product_id: 1, from_store_id: 1, to_store_id: 2, quantity: 1, notes: None, created_by: None,
        };
        let result = transfer_for_conn(&db, input);
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), ERR_MULTI_STORE_REQUIRED);
    }

    #[test]
    fn transfer_moves_product_between_stores() {
        let db = test_db(PROFILE_MULTI_STORE);
        // product 1 was seeded into the first warehouse (round-robin index 0)
        let st = stores(&db);
        assert_eq!(st.len(), 3);

        let warehouse_before: i64 = db
            .query_row("SELECT warehouse_id FROM products WHERE id = 1", [], |r| r.get::<_, i64>(0))
            .unwrap();

        let input = TransferInput {
            product_id: 1,
            from_store_id: st[0].id,
            to_store_id: st[2].id,
            quantity: 2,
            notes: Some("test".to_string()),
            created_by: None,
        };

        let res = transfer_for_conn(&db, input);
        assert!(res.is_ok(), "transfer failed: {:?}", res);

        let warehouse_after: i64 = db
            .query_row("SELECT warehouse_id FROM products WHERE id = 1", [], |r| r.get::<_, i64>(0))
            .unwrap();
        assert_eq!(warehouse_after, st[2].id);
        assert_ne!(warehouse_before, warehouse_after);

        let transfer_movements: i64 = db
            .query_row("SELECT COUNT(*) FROM inventory_movements WHERE reference_type = 'transfer'", [], |r| r.get(0))
            .unwrap();
        assert_eq!(transfer_movements, 2);
    }

    #[test]
    fn transfer_same_store_rejected() {
        let db = test_db(PROFILE_MULTI_STORE);
        let st = stores(&db);
        let input = TransferInput {
            product_id: 1, from_store_id: st[0].id, to_store_id: st[0].id, quantity: 1, notes: None, created_by: None,
        };
        assert_eq!(
            transfer_for_conn(&db, input).unwrap_err(),
            ERR_TRANSFER_SAME_STORE
        );
    }
}