use serde::Serialize;
use rusqlite::OptionalExtension;
use crate::DB_STATE;

/// Application-settings key that shows or hides the "Reset all sales" admin
/// tool. Seeded (off) by `db::seed::seed_application_settings`.
pub const RESET_SALES_SETTING_KEY: &str = "enable_sales_reset";

/// Literal text the frontend asks for before running the destructive reset.
pub const RESET_CONFIRM_TEXT: &str = "RESET";

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SalesResetPreview {
    pub sales: i64,
    pub sales_revenue: f64,
    pub sale_items: i64,
    pub sale_payments: i64,
    pub receipts: i64,
    pub quotes: i64,
    pub quote_items: i64,
    pub held_sales: i64,
    pub held_sale_items: i64,
    pub cash_register_sessions: i64,
    pub daily_closings: i64,
    pub inventory_movements: i64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SalesResetResult {
    pub deleted_sales: i64,
    pub deleted_sale_items: i64,
    pub deleted_sale_payments: i64,
    pub deleted_receipts: i64,
    pub deleted_quotes: i64,
    pub deleted_quote_items: i64,
    pub deleted_held_sales: i64,
    pub deleted_held_sale_items: i64,
    pub deleted_cash_register_sessions: i64,
    pub deleted_daily_closings: i64,
    pub deleted_inventory_movements: i64,
}

pub fn sales_reset_enabled(conn: &rusqlite::Connection) -> Result<bool, String> {
    let value: Option<String> = conn
        .query_row(
            "SELECT value FROM application_settings WHERE key = ?1",
            rusqlite::params![RESET_SALES_SETTING_KEY],
            |row| row.get(0),
        )
        .optional()
        .map_err(|e| e.to_string())?;
    // Fail closed: only an explicit "true" unlocks the destructive tool.
    Ok(value.map(|v| v.eq_ignore_ascii_case("true")).unwrap_or(false))
}

fn count(conn: &rusqlite::Connection, sql: &str) -> Result<i64, String> {
    conn.query_row(sql, [], |row| row.get(0)).map_err(|e| e.to_string())
}

/// Counts of every selling-related row the reset would remove. Non-destructive,
/// so the confirmation dialog can show the exact blast radius up front.
#[tauri::command]
pub fn get_sales_reset_preview() -> Result<SalesResetPreview, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    if !sales_reset_enabled(&conn)? {
        return Err("Feature disabled".to_string());
    }

    preview(&conn)
}

fn preview(conn: &rusqlite::Connection) -> Result<SalesResetPreview, String> {
    let movement_filter = "WHERE reference_type IN ('sale', 'refund')";
    Ok(SalesResetPreview {
        sales: count(conn, "SELECT COUNT(*) FROM sales")?,
        sales_revenue: conn
            .query_row("SELECT COALESCE(SUM(total), 0) FROM sales", [], |row| row.get(0))
            .map_err(|e| e.to_string())?,
        sale_items: count(conn, "SELECT COUNT(*) FROM sale_items")?,
        sale_payments: count(conn, "SELECT COUNT(*) FROM sale_payments")?,
        receipts: count(conn, "SELECT COUNT(*) FROM receipts")?,
        quotes: count(conn, "SELECT COUNT(*) FROM quotes")?,
        quote_items: count(conn, "SELECT COUNT(*) FROM quote_items")?,
        held_sales: count(conn, "SELECT COUNT(*) FROM held_sales")?,
        held_sale_items: count(conn, "SELECT COUNT(*) FROM held_sale_items")?,
        cash_register_sessions: count(conn, "SELECT COUNT(*) FROM cash_register_sessions")?,
        daily_closings: count(conn, "SELECT COUNT(*) FROM daily_closings")?,
        inventory_movements: count(
            conn,
            &format!("SELECT COUNT(*) FROM inventory_movements {movement_filter}"),
        )?,
    })
}

/// Deletes every selling-related row (and only those) inside a transaction.
///
/// Scope (user-confirmed):
///   - `sales` (cascades sale_items, sale_payments, receipts; warranties get
///     their `sale_id` cleared via `ON DELETE SET NULL`)
///   - `quotes` (cascades quote_items), `held_sales` (cascades held_sale_items)
///   - `cash_register_sessions`, `daily_closings`
///   - `inventory_movements` with `reference_type` `sale` / `refund`
///
/// Untouched: customers, credit accounts, products and their stock quantities,
/// purchase data, warranties, users, settings, audit history.
///
/// Gated server-side by the `enable_sales_reset` application setting and the
/// literal confirm token, so a disabled flag can never be bypassed from the
/// renderer.
#[tauri::command]
pub fn reset_sales(confirm: String, created_by: Option<i64>) -> Result<SalesResetResult, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    reset_sales_inner(&conn, &confirm, created_by)
}

/// Shared core so unit tests can exercise the full reset against a plain
/// `Connection` without the `DB_STATE` global.
pub fn reset_sales_inner(
    conn: &rusqlite::Connection,
    confirm: &str,
    created_by: Option<i64>,
) -> Result<SalesResetResult, String> {
    if !confirm.contains(RESET_CONFIRM_TEXT) {
        return Err(format!("Type '{}' to confirm the reset", RESET_CONFIRM_TEXT));
    }

    if !sales_reset_enabled(conn)? {
        return Err("Feature disabled".to_string());
    }

    conn.execute_batch("BEGIN IMMEDIATE").map_err(|e| e.to_string())?;
    let tx_result: std::result::Result<SalesResetResult, String> = (|| {
        let before = preview(&conn)?;

        let deleted_inventory_movements = count(
            &conn,
            "SELECT COUNT(*) FROM inventory_movements WHERE reference_type IN ('sale', 'refund')",
        )?;
        conn.execute(
            "DELETE FROM inventory_movements WHERE reference_type IN ('sale', 'refund')",
            [],
        )
        .map_err(|e| e.to_string())?;

        let deleted_daily_closings = count(&conn, "SELECT COUNT(*) FROM daily_closings")?;
        conn.execute("DELETE FROM daily_closings", []).map_err(|e| e.to_string())?;

        let deleted_cash_register_sessions =
            count(&conn, "SELECT COUNT(*) FROM cash_register_sessions")?;
        conn.execute("DELETE FROM cash_register_sessions", [])
            .map_err(|e| e.to_string())?;

        let deleted_held_sale_items = count(&conn, "SELECT COUNT(*) FROM held_sale_items")?;
        let deleted_held_sales = count(&conn, "SELECT COUNT(*) FROM held_sales")?;
        conn.execute("DELETE FROM held_sales", []).map_err(|e| e.to_string())?;

        let deleted_quote_items = count(&conn, "SELECT COUNT(*) FROM quote_items")?;
        let deleted_quotes = count(&conn, "SELECT COUNT(*) FROM quotes")?;
        conn.execute("DELETE FROM quotes", []).map_err(|e| e.to_string())?;

        let deleted_sale_items = count(&conn, "SELECT COUNT(*) FROM sale_items")?;
        let deleted_sale_payments = count(&conn, "SELECT COUNT(*) FROM sale_payments")?;
        let deleted_receipts = count(&conn, "SELECT COUNT(*) FROM receipts")?;
        let deleted_sales = count(&conn, "SELECT COUNT(*) FROM sales")?;
        conn.execute("DELETE FROM sales", []).map_err(|e| e.to_string())?;

        conn.execute(
            "INSERT INTO audit_logs (user_id, action, entity_type, details, severity)
             VALUES (?1, 'reset_sales', 'sale', ?2, 'warning')",
            rusqlite::params![
                created_by,
                format!(
                    "Reset removed {} sales ({} revenue), {} quotes, {} held sales, {} register sessions, {} movements",
                    before.sales, before.sales_revenue, before.quotes, before.held_sales,
                    before.cash_register_sessions, before.inventory_movements
                )
            ],
        )
        .ok();

        Ok(SalesResetResult {
            deleted_sales,
            deleted_sale_items,
            deleted_sale_payments,
            deleted_receipts,
            deleted_quotes,
            deleted_quote_items,
            deleted_held_sales,
            deleted_held_sale_items,
            deleted_cash_register_sessions,
            deleted_daily_closings,
            deleted_inventory_movements,
        })
    })();

    match tx_result {
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
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::config::PROFILE_SINGLE_STORE;
    use crate::db::init_database_with_profile;

    fn test_db() -> rusqlite::Connection {
        let dir = std::env::temp_dir().join(format!("ig_reset_test_{}", uuid::Uuid::new_v4()));
        std::fs::create_dir_all(&dir).expect("create temp dir");
        let path = dir.join("reset.db");
        init_database_with_profile(path.to_str().unwrap(), PROFILE_SINGLE_STORE).expect("init db")
    }

    fn enable_flag(conn: &rusqlite::Connection) {
        conn.execute(
            "UPDATE application_settings SET value = 'true' WHERE key = ?1",
            rusqlite::params![RESET_SALES_SETTING_KEY],
        )
        .expect("enable flag");
    }

    /// Populates customers, products, credit and a full selling trail so the
    /// reset scope can be asserted both ways (removed vs preserved).
    fn seed_selling_trail(conn: &rusqlite::Connection) -> i64 {
        conn.execute(
            "INSERT INTO customers (name, email) VALUES ('Cliente', 'cliente@correo.test')",
            [],
        )
        .expect("insert customer");
        let customer_id = conn.last_insert_rowid();

        conn.execute(
            "INSERT INTO products (name, sku, stock_quantity)
             VALUES ('Producto A', 'SKU-A', 10)",
            [],
        )
        .expect("insert product");
        let product_id = conn.last_insert_rowid();

        conn.execute(
            "INSERT INTO credit_accounts (customer_id, credit_limit, current_balance)
             VALUES (?1, 500, 120)",
            rusqlite::params![customer_id],
        )
        .expect("insert credit account");

        conn.execute(
            "INSERT INTO quotes (quote_number, customer_id, subtotal, tax_amount, total)
             VALUES ('QTE-00001', ?1, 50, 8, 58)",
            rusqlite::params![customer_id],
        )
        .expect("insert quote");
        let quote_id = conn.last_insert_rowid();
        conn.execute(
            "INSERT INTO quote_items (quote_id, product_id, quantity, unit_price, total)
             VALUES (?1, ?2, 1, 50, 50)",
            rusqlite::params![quote_id, product_id],
        )
        .expect("insert quote item");

        conn.execute(
            "INSERT INTO held_sales (hold_number, customer_id, subtotal, total)
             VALUES ('HLD-00001', ?1, 30, 34.5)",
            rusqlite::params![customer_id],
        )
        .expect("insert held sale");
        let held_id = conn.last_insert_rowid();
        conn.execute(
            "INSERT INTO held_sale_items (held_sale_id, product_id, name, sku, quantity, unit_price, total)
             VALUES (?1, ?2, 'Producto A', 'SKU-A', 1, 30, 30)",
            rusqlite::params![held_id, product_id],
        )
        .expect("insert held item");

        conn.execute(
            "INSERT INTO cash_register_sessions (user_id, opening_balance, status)
             VALUES (1, 0, 'open')",
            [],
        )
        .expect("insert cash register session");
        conn.execute(
            "INSERT INTO daily_closings (closed_by, date, total_sales, total_revenue)
             VALUES (1, '2026-09-28', 1, 200)",
            [],
        )
        .expect("insert daily closing");

        conn.execute(
            "INSERT INTO sales (sale_number, customer_id, subtotal, tax_amount, total, payment_status)
             VALUES ('INV-00001', ?1, 180, 20, 200, 'paid')",
            rusqlite::params![customer_id],
        )
        .expect("insert sale");
        let sale_id = conn.last_insert_rowid();

        conn.execute(
            "INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, total)
             VALUES (?1, ?2, 1, 180, 180)",
            rusqlite::params![sale_id, product_id],
        )
        .expect("insert sale item");
        conn.execute(
            "INSERT INTO sale_payments (sale_id, method, amount)
             VALUES (?1, 'cash', 200)",
            rusqlite::params![sale_id],
        )
        .expect("insert sale payment");
        conn.execute(
            "INSERT INTO receipts (sale_id, receipt_number, receipt_type)
             VALUES (?1, 'RCP-00001', 'sale')",
            rusqlite::params![sale_id],
        )
        .expect("insert receipt");

        // Sale + refund movements (removed) and a purchase movement (kept).
        conn.execute(
            "INSERT INTO inventory_movements (product_id, quantity, type, reference_type, reference_id, notes)
             VALUES (?1, -1, 'out', 'sale', 'INV-00001', 'Sale checkout')",
            rusqlite::params![product_id],
        )
        .expect("insert sale movement");
        conn.execute(
            "INSERT INTO inventory_movements (product_id, quantity, type, reference_type, reference_id, notes)
             VALUES (?1, 1, 'in', 'refund', 'INV-00001', 'Sale refund')",
            rusqlite::params![product_id],
        )
        .expect("insert refund movement");
        conn.execute(
            "INSERT INTO inventory_movements (product_id, quantity, type, reference_type, reference_id, notes)
             VALUES (?1, 5, 'in', 'purchase', 'PO-00001', 'Receive order')",
            rusqlite::params![product_id],
        )
        .expect("insert purchase movement");

        conn.execute(
            "INSERT INTO warranties (warranty_number, sale_id, product_id, customer_id, start_date, expiration_date)
             VALUES ('WR-00001', ?1, ?2, ?3, '2026-09-01', '2027-09-01')",
            rusqlite::params![sale_id, product_id, customer_id],
        )
        .expect("insert warranty");

        sale_id
    }

    #[test]
    fn preview_reports_full_selling_blast_radius() {
        let conn = test_db();
        enable_flag(&conn);
        seed_selling_trail(&conn);

        let p = preview(&conn).unwrap();
        assert_eq!(p.sales, 1);
        assert_eq!(p.sales_revenue, 200.0);
        assert_eq!(p.sale_items, 1);
        assert_eq!(p.sale_payments, 1);
        assert_eq!(p.receipts, 1);
        assert_eq!(p.quotes, 1);
        assert_eq!(p.quote_items, 1);
        assert_eq!(p.held_sales, 1);
        assert_eq!(p.held_sale_items, 1);
        assert_eq!(p.cash_register_sessions, 1);
        assert_eq!(p.daily_closings, 1);
        // Only sale + refund movements; the purchase movement stays out.
        assert_eq!(p.inventory_movements, 2);
    }

    #[test]
    fn flag_disabled_locks_the_tool_serverside() {
        let conn = test_db();
        // Flag is seeded "false"; never enabled.
        assert!(!sales_reset_enabled(&conn).unwrap());
        let err = reset_sales_inner(&conn, "RESET", None).unwrap_err();
        assert!(err.contains("disabled"));
    }

    #[test]
    fn reset_clears_selling_data_only() {
        let conn = test_db();
        enable_flag(&conn);
        seed_selling_trail(&conn);

        // The seeded demo profile prepopulates some catalog/customer rows, so
        // preserve-checks compare counts before and after the reset.
        let before_customers: i64 = conn.query_row("SELECT COUNT(*) FROM customers", [], |row| row.get(0)).unwrap();
        let before_products: i64 = conn.query_row("SELECT COUNT(*) FROM products", [], |row| row.get(0)).unwrap();
        let before_credit_accounts: i64 = conn.query_row("SELECT COUNT(*) FROM credit_accounts", [], |row| row.get(0)).unwrap();
        let before_movements: i64 = conn.query_row("SELECT COUNT(*) FROM inventory_movements", [], |row| row.get(0)).unwrap();

        let r = reset_sales_inner(&conn, "RESET", Some(1)).unwrap();
        assert_eq!(r.deleted_sales, 1);
        assert_eq!(r.deleted_sale_items, 1);
        assert_eq!(r.deleted_sale_payments, 1);
        assert_eq!(r.deleted_receipts, 1);
        assert_eq!(r.deleted_quotes, 1);
        assert_eq!(r.deleted_quote_items, 1);
        assert_eq!(r.deleted_held_sales, 1);
        assert_eq!(r.deleted_held_sale_items, 1);
        assert_eq!(r.deleted_cash_register_sessions, 1);
        assert_eq!(r.deleted_daily_closings, 1);
        assert_eq!(r.deleted_inventory_movements, 2);

        // Selling tables are empty.
        for table in [
            "sales", "sale_items", "sale_payments", "receipts",
            "quotes", "quote_items", "held_sales", "held_sale_items",
            "cash_register_sessions", "daily_closings",
        ] {
            let c: i64 = conn
                .query_row(
                    &format!("SELECT COUNT(*) FROM {table}"),
                    [],
                    |row| row.get(0),
                )
                .unwrap();
            assert_eq!(c, 0, "{table} should be empty after reset");
        }
        let movements: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM inventory_movements WHERE reference_type IN ('sale','refund')",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(movements, 0, "sale/refund movements removed");

        // Non-selling data is preserved.
        let customers: i64 = conn.query_row("SELECT COUNT(*) FROM customers", [], |row| row.get(0)).unwrap();
        assert_eq!(customers, before_customers);
        let products: i64 = conn.query_row("SELECT COUNT(*) FROM products", [], |row| row.get(0)).unwrap();
        assert_eq!(products, before_products);
        let movements: i64 = conn.query_row("SELECT COUNT(*) FROM inventory_movements", [], |row| row.get(0)).unwrap();
        assert_eq!(movements, before_movements - 2, "only sale/refund movements removed");
        let credit_accounts: i64 = conn
            .query_row("SELECT COUNT(*) FROM credit_accounts", [], |row| row.get(0))
            .unwrap();
        assert_eq!(credit_accounts, before_credit_accounts);

        // Warranty survives with its sale link cleared.
        let (warranty_sale_id, warranty_sale_number): (Option<i64>, Option<String>) = conn
            .query_row(
                "SELECT w.sale_id, s.sale_number FROM warranties w LEFT JOIN sales s ON s.id = w.sale_id",
                [],
                |row| Ok((row.get(0)?, row.get(1)?)),
            )
            .unwrap();
        assert!(warranty_sale_id.is_none());
        assert!(warranty_sale_number.is_none());

        // Audit trail recorded the reset.
        let audits: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM audit_logs WHERE action = 'reset_sales'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(audits, 1);
    }

    #[test]
    fn reset_requires_confirm_token() {
        let conn = test_db();
        enable_flag(&conn);
        seed_selling_trail(&conn);

        let err = reset_sales_inner(&conn, "nope", None).unwrap_err();
        assert!(err.contains("RESET"));
        // Nothing was deleted on a failed confirm.
        let sales: i64 = conn.query_row("SELECT COUNT(*) FROM sales", [], |row| row.get(0)).unwrap();
        assert_eq!(sales, 1);
    }

    #[test]
    fn reset_rejected_when_flag_disabled() {
        let conn = test_db();
        seed_selling_trail(&conn);
        // No enable_flag() call: setting is "false".
        let err = reset_sales_inner(&conn, "RESET", None).unwrap_err();
        assert!(err.contains("disabled"));
        let sales: i64 = conn.query_row("SELECT COUNT(*) FROM sales", [], |row| row.get(0)).unwrap();
        assert_eq!(sales, 1);
    }
}