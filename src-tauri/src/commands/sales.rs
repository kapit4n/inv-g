use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::State;
use crate::db::DbState;
use chrono::Datelike;

fn get_conn<'r>(state: &'r State<'r, DbState>) -> Result<std::sync::MutexGuard<'r, rusqlite::Connection>, String> {
    state.conn.lock().map_err(|e| format!("Database lock error: {}", e))
}

// ── Data Structures ──

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Sale {
    pub id: i64,
    pub sale_number: String,
    pub receipt_number: Option<String>,
    pub customer_id: Option<i64>,
    pub user_id: Option<i64>,
    pub warehouse_id: Option<i64>,
    pub subtotal: f64,
    pub tax_rate: f64,
    pub tax_amount: f64,
    pub discount_amount: f64,
    pub total: f64,
    pub payment_method: String,
    pub payment_status: String,
    pub notes: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub customer_name: Option<String>,
    pub item_count: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaleItem {
    pub id: i64,
    pub sale_id: i64,
    pub product_id: i64,
    pub quantity: i64,
    pub unit_price: f64,
    pub discount: f64,
    pub total: f64,
    pub created_at: String,
    pub updated_at: String,
    pub product_name: Option<String>,
    pub product_sku: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaleItemInput {
    pub product_id: i64,
    pub quantity: i64,
    pub unit_price: f64,
    pub discount: f64,
    pub total: f64,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SalePayment {
    pub id: i64,
    pub sale_id: i64,
    pub method: String,
    pub amount: f64,
    pub reference: Option<String>,
    pub change_amount: f64,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PaymentInput {
    pub method: String,
    pub amount: f64,
    pub reference: Option<String>,
    pub change_amount: f64,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CheckoutInput {
    pub customer_id: Option<i64>,
    pub user_id: Option<i64>,
    pub warehouse_id: Option<i64>,
    pub items: Vec<SaleItemInput>,
    pub payments: Vec<PaymentInput>,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CheckoutResult {
    pub sale: Sale,
    pub items: Vec<SaleItem>,
    pub payments: Vec<SalePayment>,
    pub receipt_number: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProductForPos {
    pub id: i64,
    pub name: String,
    pub sku: String,
    pub barcode: Option<String>,
    pub sale_price: f64,
    pub wholesale_price: f64,
    pub stock_quantity: i64,
    pub unit: String,
    pub image_url: Option<String>,
    pub tax_rate: f64,
    pub category_name: Option<String>,
    pub brand_name: Option<String>,
    pub is_active: bool,
    pub equivalent_count: i64,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DailyCloseout {
    pub total_sales: i64,
    pub total_revenue: f64,
    pub total_tax: f64,
    pub total_discount: f64,
    pub cash_total: f64,
    pub card_total: f64,
    pub transfer_total: f64,
    pub cash_count: i64,
    pub card_count: i64,
    pub transfer_count: i64,
    pub refunded_count: i64,
    pub refunded_total: f64,
    pub net_revenue: f64,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Quote {
    pub id: i64,
    pub quote_number: String,
    pub customer_id: Option<i64>,
    pub user_id: Option<i64>,
    pub subtotal: f64,
    pub tax_rate: f64,
    pub tax_amount: f64,
    pub discount_amount: f64,
    pub total: f64,
    pub status: String,
    pub valid_until: Option<String>,
    pub notes: Option<String>,
    pub terms_conditions: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub customer_name: Option<String>,
    pub item_count: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QuoteItem {
    pub id: i64,
    pub quote_id: i64,
    pub product_id: i64,
    pub quantity: i64,
    pub unit_price: f64,
    pub discount: f64,
    pub total: f64,
    pub created_at: String,
    pub product_name: Option<String>,
    pub product_sku: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QuoteInput {
    pub customer_id: Option<i64>,
    pub user_id: Option<i64>,
    pub items: Vec<SaleItemInput>,
    pub tax_rate: f64,
    pub discount_amount: f64,
    pub valid_until: Option<String>,
    pub notes: Option<String>,
    pub terms_conditions: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CashRegisterSession {
    pub id: i64,
    pub user_id: i64,
    pub opened_at: String,
    pub closed_at: Option<String>,
    pub opening_balance: f64,
    pub closing_balance: Option<f64>,
    pub expected_balance: Option<f64>,
    pub difference: Option<f64>,
    pub status: String,
    pub notes: Option<String>,
    pub user_name: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DailyClosing {
    pub id: i64,
    pub closed_by: i64,
    pub closed_at: String,
    pub date: String,
    pub total_sales: i64,
    pub total_revenue: f64,
    pub total_tax: f64,
    pub total_discount: f64,
    pub cash_total: f64,
    pub card_total: f64,
    pub transfer_total: f64,
    pub cash_count: i64,
    pub card_count: i64,
    pub transfer_count: i64,
    pub refunded_count: i64,
    pub refunded_total: f64,
    pub net_revenue: f64,
    pub notes: Option<String>,
    pub closed_by_name: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Receipt {
    pub id: i64,
    pub sale_id: i64,
    pub receipt_number: String,
    pub receipt_type: String,
    pub printed_at: Option<String>,
    pub is_printed: bool,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SalesSummary {
    pub total_sales_today: i64,
    pub revenue_today: f64,
    pub total_sales_week: i64,
    pub revenue_week: f64,
    pub total_sales_month: i64,
    pub revenue_month: f64,
    pub average_order_value: f64,
    pub top_products: Vec<ProductSalesStat>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProductSalesStat {
    pub product_id: i64,
    pub product_name: String,
    pub total_quantity: i64,
    pub total_revenue: f64,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SalesChartData {
    pub labels: Vec<String>,
    pub revenue: Vec<f64>,
    pub orders: Vec<i64>,
}

// ── Helpers ──

/// Returns the current local date formatted as YYYY-MM-DD.
///
/// NOTE: `created_at` is stored in UTC (`datetime('now')`), so this value must
/// never be compared against `date(created_at)` directly — use the
/// `utc_bounds_for_local_*` helpers instead (see `get_sales_summary`).
fn today_date() -> String {
    let now = chrono::Local::now();
    now.format("%Y-%m-%d").to_string()
}

/// UTC instant corresponding to local midnight of `now`'s calendar day.
fn local_day_start_utc(now: chrono::DateTime<chrono::Local>) -> chrono::DateTime<chrono::Utc> {
    let today = now.date_naive();
    let midnight = today.and_hms_opt(0, 0, 0).expect("valid midnight");
    midnight
        .and_local_timezone(chrono::Local)
        .earliest()
        .expect("local midnight resolves")
        .with_timezone(&chrono::Utc)
}

/// Inclusive start / exclusive end (as UTC `datetime('now')` strings) of the
/// LOCAL calendar day in which `now` falls. Sales are stored in UTC, so
/// matching the business day requires translating the local day into a UTC
/// range instead of comparing `date(created_at)` against a local date.
fn utc_bounds_for_local_day(now: chrono::DateTime<chrono::Local>) -> (String, String) {
    let start = local_day_start_utc(now);
    let end = start + chrono::Duration::days(1);
    (
        start.format("%Y-%m-%d %H:%M:%S").to_string(),
        end.format("%Y-%m-%d %H:%M:%S").to_string(),
    )
}

/// Inclusive start / exclusive end (as UTC `datetime('now')` strings) of the
/// LOCAL calendar month in which `now` falls.
fn utc_bounds_for_local_month(now: chrono::DateTime<chrono::Local>) -> (String, String) {
    let today = now.date_naive();
    let month_start = chrono::NaiveDate::from_ymd_opt(today.year(), today.month(), 1)
        .expect("month start is a valid date");
    let next_month_start = if today.month() == 12 {
        chrono::NaiveDate::from_ymd_opt(today.year() + 1, 1, 1).expect("january is a valid date")
    } else {
        chrono::NaiveDate::from_ymd_opt(today.year(), today.month() + 1, 1)
            .expect("next month start is a valid date")
    };
    let start_local = month_start
        .and_hms_opt(0, 0, 0)
        .expect("valid midnight")
        .and_local_timezone(chrono::Local)
        .earliest()
        .expect("local midnight resolves");
    let end_local = next_month_start
        .and_hms_opt(0, 0, 0)
        .expect("valid midnight")
        .and_local_timezone(chrono::Local)
        .earliest()
        .expect("local midnight resolves");
    (
        start_local.with_timezone(&chrono::Utc).format("%Y-%m-%d %H:%M:%S").to_string(),
        end_local.with_timezone(&chrono::Utc).format("%Y-%m-%d %H:%M:%S").to_string(),
    )
}

fn next_sale_number(conn: &rusqlite::Connection) -> Result<String, String> {
    let count: i64 = conn.query_row("SELECT COUNT(*) FROM sales", [], |row| row.get(0))
        .map_err(|e| e.to_string())?;
    Ok(format!("INV-{:05}", count + 1))
}

fn next_receipt_number(conn: &rusqlite::Connection) -> Result<String, String> {
    let count: i64 = conn.query_row("SELECT COUNT(*) FROM receipts", [], |row| row.get(0))
        .map_err(|e| e.to_string())?;
    Ok(format!("RCP-{:05}", count + 1))
}

fn next_quote_number(conn: &rusqlite::Connection) -> Result<String, String> {
    let count: i64 = conn.query_row("SELECT COUNT(*) FROM quotes", [], |row| row.get(0))
        .map_err(|e| e.to_string())?;
    Ok(format!("QTE-{:05}", count + 1))
}

fn map_sale(row: &rusqlite::Row) -> rusqlite::Result<Sale> {
    Ok(Sale {
        id: row.get(0)?,
        sale_number: row.get(1)?,
        receipt_number: row.get(2)?,
        customer_id: row.get(3)?,
        user_id: row.get(4)?,
        warehouse_id: row.get(5)?,
        subtotal: row.get(6)?,
        tax_rate: row.get(7)?,
        tax_amount: row.get(8)?,
        discount_amount: row.get(9)?,
        total: row.get(10)?,
        payment_method: row.get(11)?,
        payment_status: row.get(12)?,
        notes: row.get(13)?,
        created_at: row.get(14)?,
        updated_at: row.get(15)?,
        customer_name: None,
        item_count: None,
    })
}

fn map_sale_item(row: &rusqlite::Row) -> rusqlite::Result<SaleItem> {
    Ok(SaleItem {
        id: row.get(0)?,
        sale_id: row.get(1)?,
        product_id: row.get(2)?,
        quantity: row.get(3)?,
        unit_price: row.get(4)?,
        discount: row.get(5)?,
        total: row.get(6)?,
        created_at: row.get(7)?,
        updated_at: row.get(8)?,
        product_name: None,
        product_sku: None,
    })
}

fn map_quote(row: &rusqlite::Row) -> rusqlite::Result<Quote> {
    Ok(Quote {
        id: row.get(0)?,
        quote_number: row.get(1)?,
        customer_id: row.get(2)?,
        user_id: row.get(3)?,
        subtotal: row.get(4)?,
        tax_rate: row.get(5)?,
        tax_amount: row.get(6)?,
        discount_amount: row.get(7)?,
        total: row.get(8)?,
        status: row.get(9)?,
        valid_until: row.get(10)?,
        notes: row.get(11)?,
        terms_conditions: row.get(12)?,
        created_at: row.get(13)?,
        updated_at: row.get(14)?,
        customer_name: None,
        item_count: None,
    })
}



// ── POS Search ──

/// Product search for the POS / order & quote forms. Reuses `?1` across every
/// LIKE; `LIMIT 50` is a literal so it cannot steal a bound parameter.
pub(crate) const SEARCH_PRODUCTS_FOR_POS_SQL: &str = "SELECT p.id, p.name, p.sku, p.barcode, p.sale_price, p.wholesale_price, p.stock_quantity, p.unit, p.image_url, p.tax_rate, c.name as category_name, b.name as brand_name, p.is_active, (SELECT COUNT(*) FROM product_equivalents e WHERE e.product_id = p.id OR e.equivalent_product_id = p.id) as equivalent_count FROM products p LEFT JOIN categories c ON p.category_id = c.id LEFT JOIN brands b ON p.brand_id = b.id WHERE (p.name LIKE ?1 OR p.sku LIKE ?1 OR p.barcode LIKE ?1 OR p.internal_code LIKE ?1 OR p.oem_number LIKE ?1) AND p.is_active = 1 ORDER BY p.name LIMIT 50";

/// Relevance-ranked global product search. Uses four *distinct* parameter
/// indices (?1 exact, ?2 prefix, ?3 contains, ?4 limit) which is what keeps the
/// scored CASE and the `LIMIT` from colliding.
pub(crate) const GLOBAL_PRODUCT_SEARCH_SQL: &str = "SELECT p.id, p.name, p.sku, p.barcode, p.sale_price, p.wholesale_price, p.stock_quantity, p.unit, p.image_url, p.tax_rate, c.name as category_name, b.name as brand_name, p.is_active, (SELECT COUNT(*) FROM product_equivalents e WHERE e.product_id = p.id OR e.equivalent_product_id = p.id) as equivalent_count, CASE WHEN p.name = ?1 OR p.sku = ?1 OR p.barcode = ?1 OR p.oem_number = ?1 THEN 0 WHEN p.name LIKE ?2 OR p.sku LIKE ?2 OR p.barcode LIKE ?2 THEN 1 WHEN p.name LIKE ?3 OR p.sku LIKE ?3 OR p.oem_number LIKE ?3 THEN 2 ELSE 3 END as relevance FROM products p LEFT JOIN categories c ON p.category_id = c.id LEFT JOIN brands b ON p.brand_id = b.id WHERE (p.name LIKE ?3 OR p.sku LIKE ?3 OR p.barcode LIKE ?3 OR p.internal_code LIKE ?3 OR p.oem_number LIKE ?3 OR b.name LIKE ?3) AND p.is_active = 1 ORDER BY relevance ASC, p.name ASC LIMIT ?4";

/// Sale search by sale number or customer name.
pub(crate) const SEARCH_SALES_SQL: &str = "SELECT s.*, c.name as customer_name, (SELECT COUNT(*) FROM sale_items si WHERE si.sale_id = s.id) as item_count FROM sales s LEFT JOIN customers c ON s.customer_id = c.id WHERE s.sale_number LIKE ?1 OR c.name LIKE ?1 ORDER BY s.created_at DESC LIMIT 20";

#[tauri::command]
pub fn search_products_for_pos(state: State<DbState>, search: String) -> Result<Vec<ProductForPos>, String> {
    let conn = get_conn(&state)?;
    let pattern = format!("%{}%", search);
    let mut stmt = conn.prepare(SEARCH_PRODUCTS_FOR_POS_SQL).map_err(|e| e.to_string())?;
    let rows = stmt.query_map(params![pattern], |row| {
        Ok(ProductForPos {
            id: row.get(0)?, name: row.get(1)?, sku: row.get(2)?,
            barcode: row.get(3)?, sale_price: row.get(4)?,
            wholesale_price: row.get(5)?, stock_quantity: row.get(6)?,
            unit: row.get(7)?, image_url: row.get(8)?, tax_rate: row.get(9)?,
            category_name: row.get(10)?, brand_name: row.get(11)?,
            is_active: row.get::<_, i64>(12)? != 0,
            equivalent_count: row.get(13)?,
        })
    }).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for row in rows { result.push(row.map_err(|e| e.to_string())?); }
    Ok(result)
}

// ── Global Product Search (TASK 06) ──

#[tauri::command]
pub fn global_product_search(state: State<DbState>, query: String, limit: Option<i64>) -> Result<Vec<ProductForPos>, String> {
    let conn = get_conn(&state)?;
    let max_results = limit.unwrap_or(20);
    let pattern = format!("%{}%", query);
    let exact = query.clone();
    let prefix = format!("{}%", query);

    let sql = GLOBAL_PRODUCT_SEARCH_SQL;

    let mut stmt = conn.prepare(sql).map_err(|e| e.to_string())?;
    let rows = stmt.query_map(params![exact, prefix, pattern, max_results], |row| {
        Ok(ProductForPos {
            id: row.get(0)?, name: row.get(1)?, sku: row.get(2)?,
            barcode: row.get(3)?, sale_price: row.get(4)?,
            wholesale_price: row.get(5)?, stock_quantity: row.get(6)?,
            unit: row.get(7)?, image_url: row.get(8)?, tax_rate: row.get(9)?,
            category_name: row.get(10)?, brand_name: row.get(11)?,
            is_active: row.get::<_, i64>(12)? != 0,
            equivalent_count: row.get(13)?,
        })
    }).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for row in rows { result.push(row.map_err(|e| e.to_string())?); }
    Ok(result)
}

#[tauri::command]
pub fn get_sales(state: State<DbState>) -> Result<Vec<Sale>, String> {
    let conn = get_conn(&state)?;
    let mut stmt = conn.prepare(
        "SELECT s.*, c.name as customer_name,
                (SELECT COUNT(*) FROM sale_items si WHERE si.sale_id = s.id) as item_count
         FROM sales s
         LEFT JOIN customers c ON s.customer_id = c.id
         ORDER BY s.created_at DESC"
    ).map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        let mut sale = map_sale(row)?;
        sale.customer_name = row.get::<_, Option<String>>(16).ok().flatten();
        sale.item_count = row.get::<_, Option<i64>>(17).ok().flatten();
        Ok(sale)
    }).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for row in rows { result.push(row.map_err(|e| e.to_string())?); }
    Ok(result)
}

#[tauri::command]
pub fn get_sale(state: State<DbState>, id: i64) -> Result<Sale, String> {
    let conn = get_conn(&state)?;
    let mut stmt = conn.prepare(
        "SELECT s.*, c.name as customer_name,
                (SELECT COUNT(*) FROM sale_items si WHERE si.sale_id = s.id) as item_count
         FROM sales s
         LEFT JOIN customers c ON s.customer_id = c.id
         WHERE s.id = ?1"
    ).map_err(|e| e.to_string())?;
    stmt.query_row(params![id], |row| {
        let mut sale = map_sale(row)?;
        sale.customer_name = row.get::<_, Option<String>>(16).ok().flatten();
        sale.item_count = row.get::<_, Option<i64>>(17).ok().flatten();
        Ok(sale)
    }).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_sale_items(state: State<DbState>, sale_id: i64) -> Result<Vec<SaleItem>, String> {
    let conn = get_conn(&state)?;
    let mut stmt = conn.prepare(
        "SELECT si.*, p.name as product_name, p.sku as product_sku
         FROM sale_items si
         LEFT JOIN products p ON si.product_id = p.id
         WHERE si.sale_id = ?1"
    ).map_err(|e| e.to_string())?;
    let rows = stmt.query_map(params![sale_id], |row| {
        let mut item = map_sale_item(row)?;
        item.product_name = row.get::<_, Option<String>>(9).ok().flatten();
        item.product_sku = row.get::<_, Option<String>>(10).ok().flatten();
        Ok(item)
    }).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for row in rows { result.push(row.map_err(|e| e.to_string())?); }
    Ok(result)
}

#[tauri::command]
pub fn get_sale_payments(state: State<DbState>, sale_id: i64) -> Result<Vec<SalePayment>, String> {
    let conn = get_conn(&state)?;
    let mut stmt = conn.prepare(
        "SELECT * FROM sale_payments WHERE sale_id = ?1 ORDER BY created_at"
    ).map_err(|e| e.to_string())?;
    let rows = stmt.query_map(params![sale_id], |row| {
        Ok(SalePayment {
            id: row.get(0)?, sale_id: row.get(1)?, method: row.get(2)?,
            amount: row.get(3)?, reference: row.get(4)?,
            change_amount: row.get(5)?, created_at: row.get(6)?,
        })
    }).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for row in rows { result.push(row.map_err(|e| e.to_string())?); }
    Ok(result)
}

// ── Checkout ──

#[tauri::command]
pub fn process_checkout(state: State<DbState>, input: CheckoutInput) -> Result<CheckoutResult, String> {
    let conn = get_conn(&state)?;

    // Store-aware checkout: single-store auto-uses the only store; multi-store
    // requires an explicit store.
    let warehouse_id = crate::commands::business::resolve_checkout_store(&conn, input.warehouse_id)?;

    let sale_number = next_sale_number(&conn)?;
    let receipt_number = next_receipt_number(&conn)?;

    let subtotal: f64 = input.items.iter().map(|i| i.total).sum();
    let total_payments: f64 = input.payments.iter().map(|p| p.amount).sum();
    let total_discount: f64 = input.items.iter().map(|i| i.discount).sum();
    let payment_method = if input.payments.len() == 1 {
        input.payments[0].method.clone()
    } else {
        "mixed".to_string()
    };

    let payment_status = if total_payments >= subtotal { "paid".to_string() } else { "partial".to_string() };

    conn.execute(
        "INSERT INTO sales (sale_number, receipt_number, customer_id, user_id, warehouse_id, subtotal, tax_rate, tax_amount, discount_amount, total, payment_method, payment_status, notes)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, 0, 0, ?7, ?8, ?9, ?10, ?11)",
        params![sale_number, receipt_number, input.customer_id, input.user_id, warehouse_id,
                subtotal, total_discount, subtotal, payment_method, payment_status, input.notes],
    ).map_err(|e| e.to_string())?;

    let sale_id = conn.last_insert_rowid();

    let mut sale_items = Vec::new();
    for item in &input.items {
        conn.execute(
            "INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, discount, total) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![sale_id, item.product_id, item.quantity, item.unit_price, item.discount, item.total],
        ).map_err(|e| e.to_string())?;

        let item_id = conn.last_insert_rowid();
        sale_items.push(SaleItem {
            id: item_id, sale_id, product_id: item.product_id,
            quantity: item.quantity, unit_price: item.unit_price,
            discount: item.discount, total: item.total,
            created_at: String::new(), updated_at: String::new(),
            product_name: None, product_sku: None,
        });

        conn.execute(
            "UPDATE products SET stock_quantity = stock_quantity - ?1, updated_at = datetime('now') WHERE id = ?2",
            params![item.quantity, item.product_id],
        ).map_err(|e| e.to_string())?;

        conn.execute(
            "INSERT INTO inventory_movements (product_id, quantity, type, reference_type, reference_id, notes)
             VALUES (?1, ?2, 'out', 'sale', ?3, 'Sale checkout')",
            params![item.product_id, item.quantity, sale_number],
        ).map_err(|e| e.to_string())?;
    }

    let mut sale_payments = Vec::new();
    for payment in &input.payments {
        conn.execute(
            "INSERT INTO sale_payments (sale_id, method, amount, reference, change_amount) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![sale_id, payment.method, payment.amount, payment.reference, payment.change_amount],
        ).map_err(|e| e.to_string())?;

        let pmt_id = conn.last_insert_rowid();
        sale_payments.push(SalePayment {
            id: pmt_id, sale_id, method: payment.method.clone(),
            amount: payment.amount, reference: payment.reference.clone(),
            change_amount: payment.change_amount, created_at: String::new(),
        });
    }

    conn.execute(
        "INSERT INTO receipts (sale_id, receipt_number, receipt_type) VALUES (?1, ?2, 'sale')",
        params![sale_id, receipt_number],
    ).map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare(
        "SELECT s.*, c.name as customer_name,
                (SELECT COUNT(*) FROM sale_items si WHERE si.sale_id = s.id) as item_count
         FROM sales s
         LEFT JOIN customers c ON s.customer_id = c.id
         WHERE s.id = ?1"
    ).map_err(|e| e.to_string())?;
    let sale = stmt.query_row(params![sale_id], |row| {
        let mut sale = map_sale(row)?;
        sale.customer_name = row.get::<_, Option<String>>(16).ok().flatten();
        sale.item_count = row.get::<_, Option<i64>>(17).ok().flatten();
        Ok(sale)
    }).map_err(|e| e.to_string())?;

    Ok(CheckoutResult { sale, items: sale_items, payments: sale_payments, receipt_number })
}

// ── Legacy Create Sale (backward compat) ──

#[tauri::command]
pub fn create_sale(state: State<DbState>, customer_id: Option<i64>, user_id: Option<i64>, _subtotal: f64, _tax_rate: f64, _tax_amount: f64, _discount_amount: f64, total: f64, payment_method: String, _payment_status: String, notes: Option<String>, items: Vec<SaleItemInput>) -> Result<Sale, String> {
    let input = CheckoutInput {
        customer_id,
        user_id,
        warehouse_id: None,
        items,
        payments: vec![PaymentInput {
            method: payment_method,
            amount: total,
            reference: None,
            change_amount: 0.0,
        }],
        notes,
    };
    let result = process_checkout(state, input)?;
    Ok(result.sale)
}

// ── Refund ──

#[tauri::command]
pub fn refund_sale(state: State<DbState>, sale_id: i64, reason: Option<String>) -> Result<Sale, String> {
    let conn = get_conn(&state)?;

    let mut stmt = conn.prepare(
        "SELECT s.*, c.name as customer_name,
                (SELECT COUNT(*) FROM sale_items si WHERE si.sale_id = s.id) as item_count
         FROM sales s
         LEFT JOIN customers c ON s.customer_id = c.id
         WHERE s.id = ?1"
    ).map_err(|e| e.to_string())?;
    let sale: Sale = stmt.query_row(params![sale_id], |row| {
        let mut sale = map_sale(row)?;
        sale.customer_name = row.get::<_, Option<String>>(16).ok().flatten();
        sale.item_count = row.get::<_, Option<i64>>(17).ok().flatten();
        Ok(sale)
    }).map_err(|e| e.to_string())?;

    if sale.payment_status == "refunded" {
        return Err("Sale is already refunded".to_string());
    }

    let mut stmt = conn.prepare(
        "SELECT si.*, p.name as product_name, p.sku as product_sku
         FROM sale_items si
         LEFT JOIN products p ON si.product_id = p.id
         WHERE si.sale_id = ?1"
    ).map_err(|e| e.to_string())?;
    let items: Vec<SaleItem> = stmt.query_map(params![sale_id], |row| {
        let mut item = map_sale_item(row)?;
        item.product_name = row.get::<_, Option<String>>(9).ok().flatten();
        item.product_sku = row.get::<_, Option<String>>(10).ok().flatten();
        Ok(item)
    }).map_err(|e| e.to_string())?.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())?;

    for item in &items {
        conn.execute(
            "UPDATE products SET stock_quantity = stock_quantity + ?1, updated_at = datetime('now') WHERE id = ?2",
            params![item.quantity, item.product_id],
        ).map_err(|e| e.to_string())?;

        conn.execute(
            "INSERT INTO inventory_movements (product_id, quantity, type, reference_type, reference_id, notes) VALUES (?1, ?2, 'in', 'refund', ?3, ?4)",
            params![item.product_id, item.quantity, sale.sale_number, reason],
        ).map_err(|e| e.to_string())?;
    }

    let updated_notes = match (&sale.notes, &reason) {
        (Some(n), Some(r)) => Some(format!("{} | Refunded: {}", n, r)),
        (Some(n), None) => Some(format!("{} | Refunded", n)),
        (None, Some(r)) => Some(format!("Refunded: {}", r)),
        (None, None) => Some("Refunded".to_string()),
    };

    conn.execute(
        "UPDATE sales SET payment_status='refunded', notes=?1, updated_at=datetime('now') WHERE id=?2",
        params![updated_notes, sale_id],
    ).map_err(|e| e.to_string())?;

    let refund_receipt = next_receipt_number(&conn)?;
    conn.execute(
        "INSERT INTO receipts (sale_id, receipt_number, receipt_type) VALUES (?1, ?2, 'refund')",
        params![sale_id, refund_receipt],
    ).map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare(
        "SELECT s.*, c.name as customer_name,
                (SELECT COUNT(*) FROM sale_items si WHERE si.sale_id = s.id) as item_count
         FROM sales s
         LEFT JOIN customers c ON s.customer_id = c.id
         WHERE s.id = ?1"
    ).map_err(|e| e.to_string())?;
    stmt.query_row(params![sale_id], |row| {
        let mut sale = map_sale(row)?;
        sale.customer_name = row.get::<_, Option<String>>(16).ok().flatten();
        sale.item_count = row.get::<_, Option<i64>>(17).ok().flatten();
        Ok(sale)
    }).map_err(|e| e.to_string())
}

// ── Daily Closeout ──

#[tauri::command]
pub fn get_daily_closeout(state: State<DbState>) -> Result<DailyCloseout, String> {
    let conn = get_conn(&state)?;
    get_daily_closeout_inner(&conn)
}

/// Connection-scoped body of [`get_daily_closeout`], so callers that already hold the
/// database lock can reuse their guard instead of re-locking it.
fn get_daily_closeout_inner(conn: &rusqlite::Connection) -> Result<DailyCloseout, String> {
    let today = today_date();

    let total_sales: i64 = conn.query_row(
        "SELECT COUNT(*) FROM sales WHERE date(created_at) = ?1 AND payment_status != 'refunded'",
        params![today], |row| row.get(0)
    ).map_err(|e| e.to_string())?;

    let total_revenue: f64 = conn.query_row(
        "SELECT COALESCE(SUM(total), 0) FROM sales WHERE date(created_at) = ?1 AND payment_status != 'refunded'",
        params![today], |row| row.get(0)
    ).map_err(|e| e.to_string())?;

    let total_tax: f64 = conn.query_row(
        "SELECT COALESCE(SUM(tax_amount), 0) FROM sales WHERE date(created_at) = ?1 AND payment_status != 'refunded'",
        params![today], |row| row.get(0)
    ).map_err(|e| e.to_string())?;

    let total_discount: f64 = conn.query_row(
        "SELECT COALESCE(SUM(discount_amount), 0) FROM sales WHERE date(created_at) = ?1 AND payment_status != 'refunded'",
        params![today], |row| row.get(0)
    ).map_err(|e| e.to_string())?;

    let cash_total: f64 = conn.query_row(
        "SELECT COALESCE(SUM(sp.amount), 0) FROM sale_payments sp JOIN sales s ON sp.sale_id = s.id WHERE date(s.created_at) = ?1 AND sp.method='cash' AND s.payment_status != 'refunded'",
        params![today], |row| row.get(0)
    ).unwrap_or_else(|_| {
        conn.query_row("SELECT COALESCE(SUM(total), 0) FROM sales WHERE date(created_at) = ?1 AND payment_method='cash' AND payment_status != 'refunded'", params![today], |row| row.get(0)).unwrap_or(0.0)
    });

    let card_total: f64 = conn.query_row(
        "SELECT COALESCE(SUM(sp.amount), 0) FROM sale_payments sp JOIN sales s ON sp.sale_id = s.id WHERE date(s.created_at) = ?1 AND sp.method='card' AND s.payment_status != 'refunded'",
        params![today], |row| row.get(0)
    ).unwrap_or_else(|_| {
        conn.query_row("SELECT COALESCE(SUM(total), 0) FROM sales WHERE date(created_at) = ?1 AND payment_method='card' AND payment_status != 'refunded'", params![today], |row| row.get(0)).unwrap_or(0.0)
    });

    let transfer_total: f64 = conn.query_row(
        "SELECT COALESCE(SUM(sp.amount), 0) FROM sale_payments sp JOIN sales s ON sp.sale_id = s.id WHERE date(s.created_at) = ?1 AND sp.method='transfer' AND s.payment_status != 'refunded'",
        params![today], |row| row.get(0)
    ).unwrap_or_else(|_| {
        conn.query_row("SELECT COALESCE(SUM(total), 0) FROM sales WHERE date(created_at) = ?1 AND payment_method='transfer' AND payment_status != 'refunded'", params![today], |row| row.get(0)).unwrap_or(0.0)
    });

    let cash_count: i64 = conn.query_row(
        "SELECT COUNT(DISTINCT sp.sale_id) FROM sale_payments sp JOIN sales s ON sp.sale_id = s.id WHERE date(s.created_at) = ?1 AND sp.method='cash' AND s.payment_status != 'refunded'",
        params![today], |row| row.get(0)
    ).unwrap_or_else(|_| {
        conn.query_row("SELECT COUNT(*) FROM sales WHERE date(created_at) = ?1 AND payment_method='cash' AND payment_status != 'refunded'", params![today], |row| row.get(0)).unwrap_or(0)
    });

    let card_count: i64 = conn.query_row(
        "SELECT COUNT(DISTINCT sp.sale_id) FROM sale_payments sp JOIN sales s ON sp.sale_id = s.id WHERE date(s.created_at) = ?1 AND sp.method='card' AND s.payment_status != 'refunded'",
        params![today], |row| row.get(0)
    ).unwrap_or_else(|_| {
        conn.query_row("SELECT COUNT(*) FROM sales WHERE date(created_at) = ?1 AND payment_method='card' AND payment_status != 'refunded'", params![today], |row| row.get(0)).unwrap_or(0)
    });

    let transfer_count: i64 = conn.query_row(
        "SELECT COUNT(DISTINCT sp.sale_id) FROM sale_payments sp JOIN sales s ON sp.sale_id = s.id WHERE date(s.created_at) = ?1 AND sp.method='transfer' AND s.payment_status != 'refunded'",
        params![today], |row| row.get(0)
    ).unwrap_or_else(|_| {
        conn.query_row("SELECT COUNT(*) FROM sales WHERE date(created_at) = ?1 AND payment_method='transfer' AND payment_status != 'refunded'", params![today], |row| row.get(0)).unwrap_or(0)
    });

    let refunded_count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM sales WHERE date(created_at) = ?1 AND payment_status='refunded'",
        params![today], |row| row.get(0)
    ).map_err(|e| e.to_string())?;

    let refunded_total: f64 = conn.query_row(
        "SELECT COALESCE(SUM(total), 0) FROM sales WHERE date(created_at) = ?1 AND payment_status='refunded'",
        params![today], |row| row.get(0)
    ).map_err(|e| e.to_string())?;

    let net_revenue = total_revenue - refunded_total;

    Ok(DailyCloseout {
        total_sales, total_revenue, total_tax, total_discount,
        cash_total, card_total, transfer_total,
        cash_count, card_count, transfer_count,
        refunded_count, refunded_total, net_revenue,
    })
}

// ── Sales Summary / Stats ──

/// Core sales-summary computation, factored out of the command so it can be
/// unit-tested against a real connection with a controlled clock.
///
/// Accounting rules (kept consistent with `get_sales`, `get_daily_closeout`
/// and the runtime schema):
/// - "today" = the LOCAL calendar day that contains `now`, translated into a
///   UTC range (sales are stored as UTC `datetime('now')` text). This avoids
///   the previous local-vs-UTC day-boundary mismatch (e.g. UTC-4 Bolivia).
/// - "month" = the LOCAL calendar month containing `now` (a true
///   `Ventas del Mes`, previously a rolling 30-day window).
/// - Only sales with `payment_status != 'refunded'` count toward revenue and
///   transaction totals (refunds are tracked separately).
fn sales_summary_for(conn: &rusqlite::Connection, now: chrono::DateTime<chrono::Local>) -> Result<SalesSummary, String> {
    let (day_start, day_end) = utc_bounds_for_local_day(now);
    let (month_start, month_end) = utc_bounds_for_local_month(now);

    let total_sales_today: i64 = conn.query_row(
        "SELECT COUNT(*) FROM sales WHERE created_at >= ?1 AND created_at < ?2 AND payment_status != 'refunded'",
        params![day_start, day_end], |row| row.get(0)
    ).map_err(|e| e.to_string())?;

    let revenue_today: f64 = conn.query_row(
        "SELECT COALESCE(SUM(total), 0) FROM sales WHERE created_at >= ?1 AND created_at < ?2 AND payment_status != 'refunded'",
        params![day_start, day_end], |row| row.get(0)
    ).map_err(|e| e.to_string())?;

    let total_sales_week: i64 = conn.query_row(
        "SELECT COUNT(*) FROM sales WHERE created_at >= datetime('now', '-7 days') AND payment_status != 'refunded'",
        [], |row| row.get(0)
    ).map_err(|e| e.to_string())?;

    let revenue_week: f64 = conn.query_row(
        "SELECT COALESCE(SUM(total), 0) FROM sales WHERE created_at >= datetime('now', '-7 days') AND payment_status != 'refunded'",
        [], |row| row.get(0)
    ).map_err(|e| e.to_string())?;

    let total_sales_month: i64 = conn.query_row(
        "SELECT COUNT(*) FROM sales WHERE created_at >= ?1 AND created_at < ?2 AND payment_status != 'refunded'",
        params![month_start, month_end], |row| row.get(0)
    ).map_err(|e| e.to_string())?;

    let revenue_month: f64 = conn.query_row(
        "SELECT COALESCE(SUM(total), 0) FROM sales WHERE created_at >= ?1 AND created_at < ?2 AND payment_status != 'refunded'",
        params![month_start, month_end], |row| row.get(0)
    ).map_err(|e| e.to_string())?;

    let average_order_value: f64 = if total_sales_today > 0 { revenue_today / total_sales_today as f64 } else { 0.0 };

    let mut stmt = conn.prepare(
        "SELECT p.id, p.name, SUM(si.quantity) as total_qty, SUM(si.total) as total_rev
         FROM sale_items si
         JOIN products p ON si.product_id = p.id
         JOIN sales s ON si.sale_id = s.id
         WHERE s.created_at >= datetime('now', '-30 days') AND s.payment_status != 'refunded'
         GROUP BY si.product_id
         ORDER BY total_qty DESC
         LIMIT 10"
    ).map_err(|e| e.to_string())?;

    let top_products: Vec<ProductSalesStat> = stmt.query_map([], |row| {
        Ok(ProductSalesStat {
            product_id: row.get(0)?, product_name: row.get(1)?,
            total_quantity: row.get(2)?, total_revenue: row.get(3)?,
        })
    }).map_err(|e| e.to_string())?.filter_map(|r| r.ok()).collect();

    Ok(SalesSummary {
        total_sales_today, revenue_today, total_sales_week, revenue_week,
        total_sales_month, revenue_month, average_order_value, top_products,
    })
}

#[tauri::command]
pub fn get_sales_summary(state: State<DbState>) -> Result<SalesSummary, String> {
    let conn = get_conn(&state)?;
    sales_summary_for(&conn, chrono::Local::now())
}

#[tauri::command]
pub fn get_sales_chart_data(state: State<DbState>, days: i64) -> Result<SalesChartData, String> {
    let conn = get_conn(&state)?;
    let mut labels = Vec::new();
    let mut revenue = Vec::new();
    let mut orders = Vec::new();

    for i in (0..days).rev() {
        let mut stmt = conn.prepare(
            "SELECT date(datetime('now', ?1)), COALESCE(SUM(total), 0), COUNT(*)
             FROM sales WHERE date(created_at) = date(datetime('now', ?1)) AND payment_status != 'refunded'"
        ).map_err(|e| e.to_string())?;

        let offset = format!("-{} days", i);
        let row = stmt.query_row(params![offset], |row| {
            let label: String = row.get(0)?;
            let rev: f64 = row.get(1)?;
            const ZERO_I64: i64 = 0;
            let ord: i64 = row.get::<_, i64>(2).unwrap_or(ZERO_I64);
            Ok((label, rev, ord))
        }).unwrap_or_else(|_| (format!("day-{}", i), 0.0, 0));

        labels.push(row.0);
        revenue.push(row.1);
        orders.push(row.2);
    }

    Ok(SalesChartData { labels, revenue, orders })
}

// ── Quotes ──

#[tauri::command]
pub fn get_quotes(state: State<DbState>) -> Result<Vec<Quote>, String> {
    let conn = get_conn(&state)?;
    let mut stmt = conn.prepare(
        "SELECT q.*, c.name as customer_name,
                (SELECT COUNT(*) FROM quote_items qi WHERE qi.quote_id = q.id) as item_count
         FROM quotes q
         LEFT JOIN customers c ON q.customer_id = c.id
         ORDER BY q.created_at DESC"
    ).map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        let mut quote = map_quote(row)?;
        quote.customer_name = row.get::<_, Option<String>>(15).ok().flatten();
        quote.item_count = row.get::<_, Option<i64>>(16).ok().flatten();
        Ok(quote)
    }).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for row in rows { result.push(row.map_err(|e| e.to_string())?); }
    Ok(result)
}

#[tauri::command]
pub fn get_quote(state: State<DbState>, id: i64) -> Result<Quote, String> {
    let conn = get_conn(&state)?;
    get_quote_inner(&conn,id)
}

/// Connection-scoped body of [`get_quote`], so callers that already hold the
/// database lock can reuse their guard instead of re-locking it.
fn get_quote_inner(conn: &rusqlite::Connection, id: i64) -> Result<Quote, String> {
    let mut stmt = conn.prepare(
        "SELECT q.*, c.name as customer_name,
                (SELECT COUNT(*) FROM quote_items qi WHERE qi.quote_id = q.id) as item_count
         FROM quotes q
         LEFT JOIN customers c ON q.customer_id = c.id
         WHERE q.id = ?1"
    ).map_err(|e| e.to_string())?;
    stmt.query_row(params![id], |row| {
        let mut quote = map_quote(row)?;
        quote.customer_name = row.get::<_, Option<String>>(15).ok().flatten();
        quote.item_count = row.get::<_, Option<i64>>(16).ok().flatten();
        Ok(quote)
    }).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_quote_items(state: State<DbState>, quote_id: i64) -> Result<Vec<QuoteItem>, String> {
    let conn = get_conn(&state)?;
    get_quote_items_inner(&conn,quote_id)
}

/// Connection-scoped body of [`get_quote_items`], so callers that already hold the
/// database lock can reuse their guard instead of re-locking it.
fn get_quote_items_inner(conn: &rusqlite::Connection, quote_id: i64) -> Result<Vec<QuoteItem>, String> {
    let mut stmt = conn.prepare(
        "SELECT qi.*, p.name as product_name, p.sku as product_sku
         FROM quote_items qi
         LEFT JOIN products p ON qi.product_id = p.id
         WHERE qi.quote_id = ?1"
    ).map_err(|e| e.to_string())?;
    let rows = stmt.query_map(params![quote_id], |row| {
        Ok(QuoteItem {
            id: row.get(0)?, quote_id: row.get(1)?, product_id: row.get(2)?,
            quantity: row.get(3)?, unit_price: row.get(4)?, discount: row.get(5)?,
            total: row.get(6)?, created_at: row.get(7)?,
            product_name: row.get(8)?, product_sku: row.get(9)?,
        })
    }).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for row in rows { result.push(row.map_err(|e| e.to_string())?); }
    Ok(result)
}

#[tauri::command]
pub fn create_quote(state: State<DbState>, input: QuoteInput) -> Result<Quote, String> {
    let conn = get_conn(&state)?;
    let quote_number = next_quote_number(&conn)?;

    let subtotal: f64 = input.items.iter().map(|i| i.total).sum();
    let tax_amount = subtotal * input.tax_rate;
    let total = subtotal + tax_amount - input.discount_amount;

    conn.execute(
        "INSERT INTO quotes (quote_number, customer_id, user_id, subtotal, tax_rate, tax_amount, discount_amount, total, status, valid_until, notes, terms_conditions)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 'draft', ?9, ?10, ?11)",
        params![quote_number, input.customer_id, input.user_id, subtotal, input.tax_rate,
                tax_amount, input.discount_amount, total, input.valid_until, input.notes, input.terms_conditions],
    ).map_err(|e| e.to_string())?;

    let quote_id = conn.last_insert_rowid();

    for item in &input.items {
        conn.execute(
            "INSERT INTO quote_items (quote_id, product_id, quantity, unit_price, discount, total) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![quote_id, item.product_id, item.quantity, item.unit_price, item.discount, item.total],
        ).map_err(|e| e.to_string())?;
    }

    get_quote_inner(&conn, quote_id)
}

#[tauri::command]
pub fn update_quote(state: State<DbState>, id: i64, input: QuoteInput) -> Result<Quote, String> {
    let conn = get_conn(&state)?;

    let subtotal: f64 = input.items.iter().map(|i| i.total).sum();
    let tax_amount = subtotal * input.tax_rate;
    let total = subtotal + tax_amount - input.discount_amount;

    conn.execute(
        "UPDATE quotes SET customer_id=?1, user_id=?2, subtotal=?3, tax_rate=?4, tax_amount=?5, discount_amount=?6, total=?7, valid_until=?8, notes=?9, terms_conditions=?10, updated_at=datetime('now') WHERE id=?11",
        params![input.customer_id, input.user_id, subtotal, input.tax_rate, tax_amount, input.discount_amount, total, input.valid_until, input.notes, input.terms_conditions, id],
    ).map_err(|e| e.to_string())?;

    conn.execute("DELETE FROM quote_items WHERE quote_id = ?1", params![id])
        .map_err(|e| e.to_string())?;

    for item in &input.items {
        conn.execute(
            "INSERT INTO quote_items (quote_id, product_id, quantity, unit_price, discount, total) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![id, item.product_id, item.quantity, item.unit_price, item.discount, item.total],
        ).map_err(|e| e.to_string())?;
    }

    get_quote_inner(&conn, id)
}

#[tauri::command]
pub fn delete_quote(state: State<DbState>, id: i64) -> Result<(), String> {
    let conn = get_conn(&state)?;
    conn.execute("DELETE FROM quotes WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn update_quote_status(state: State<DbState>, id: i64, status: String) -> Result<Quote, String> {
    let conn = get_conn(&state)?;
    conn.execute(
        "UPDATE quotes SET status=?1, updated_at=datetime('now') WHERE id=?2",
        params![status, id],
    ).map_err(|e| e.to_string())?;
    get_quote_inner(&conn, id)
}

#[tauri::command]
pub fn convert_quote_to_sale(state: State<DbState>, quote_id: i64, user_id: Option<i64>) -> Result<CheckoutResult, String> {
    let conn = get_conn(&state)?;

    let quote = get_quote_inner(&conn, quote_id)?;
    let items = get_quote_items_inner(&conn, quote_id)?;

    let sale_items: Vec<SaleItemInput> = items.iter().map(|qi| SaleItemInput {
        product_id: qi.product_id,
        quantity: qi.quantity,
        unit_price: qi.unit_price,
        discount: qi.discount,
        total: qi.total,
    }).collect();

    let total: f64 = items.iter().map(|i| i.total).sum();

    let input = CheckoutInput {
        customer_id: quote.customer_id,
        user_id,
        warehouse_id: None,
        items: sale_items,
        payments: vec![PaymentInput {
            method: "cash".to_string(),
            amount: total,
            reference: None,
            change_amount: 0.0,
        }],
        notes: Some(format!("Converted from quote {}", quote.quote_number)),
    };

    // `process_checkout` acquires the database lock itself, so the guard must be
    // released first: `std::sync::Mutex` is not reentrant and re-locking it here
    // would deadlock the command thread.
    drop(conn);
    let result = process_checkout(state.clone(), input)?;
    let conn = get_conn(&state)?;

    conn.execute(
        "UPDATE quotes SET status='converted', updated_at=datetime('now') WHERE id=?1",
        params![quote_id],
    ).map_err(|e| e.to_string())?;

    Ok(result)
}

// ── Cash Register ──

#[tauri::command]
pub fn get_cash_register_status(state: State<DbState>) -> Result<Option<CashRegisterSession>, String> {
    let conn = get_conn(&state)?;
    get_cash_register_status_inner(&conn)
}

/// Connection-scoped body of [`get_cash_register_status`], so callers that already hold the
/// database lock can reuse their guard instead of re-locking it.
fn get_cash_register_status_inner(conn: &rusqlite::Connection) -> Result<Option<CashRegisterSession>, String> {
    let result = conn.query_row(
        "SELECT cr.*, u.full_name as user_name
         FROM cash_register_sessions cr
         LEFT JOIN users u ON cr.user_id = u.id
         WHERE cr.status = 'open'
         ORDER BY cr.opened_at DESC LIMIT 1",
        [],
        |row| {
            Ok(CashRegisterSession {
                id: row.get(0)?, user_id: row.get(1)?,
                opened_at: row.get(2)?, closed_at: row.get(3)?,
                opening_balance: row.get(4)?, closing_balance: row.get(5)?,
                expected_balance: row.get(6)?, difference: row.get(7)?,
                status: row.get(8)?, notes: row.get(9)?,
                user_name: row.get(10)?,
            })
        }
    );
    match result {
        Ok(session) => Ok(Some(session)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub fn open_cash_register(state: State<DbState>, user_id: i64, opening_balance: f64, notes: Option<String>) -> Result<CashRegisterSession, String> {
    let conn = get_conn(&state)?;

    let existing = get_cash_register_status_inner(&conn)?;
    if existing.is_some() {
        return Err("A cash register session is already open".to_string());
    }

    conn.execute(
        "INSERT INTO cash_register_sessions (user_id, opening_balance, notes) VALUES (?1, ?2, ?3)",
        params![user_id, opening_balance, notes],
    ).map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();
    let mut stmt = conn.prepare(
        "SELECT cr.*, u.full_name as user_name
         FROM cash_register_sessions cr
         LEFT JOIN users u ON cr.user_id = u.id
         WHERE cr.id = ?1"
    ).map_err(|e| e.to_string())?;
    stmt.query_row(params![id], |row| {
        Ok(CashRegisterSession {
            id: row.get(0)?, user_id: row.get(1)?,
            opened_at: row.get(2)?, closed_at: row.get(3)?,
            opening_balance: row.get(4)?, closing_balance: row.get(5)?,
            expected_balance: row.get(6)?, difference: row.get(7)?,
            status: row.get(8)?, notes: row.get(9)?,
            user_name: row.get(10)?,
        })
    }).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn close_cash_register(state: State<DbState>, id: i64, closing_balance: f64, notes: Option<String>) -> Result<CashRegisterSession, String> {
    let conn = get_conn(&state)?;

    let today = today_date();
    let expected_balance: f64 = conn.query_row(
        "SELECT COALESCE(SUM(sp.amount), 0) FROM sale_payments sp
         JOIN sales s ON sp.sale_id = s.id
         WHERE date(s.created_at) = ?1 AND s.payment_status != 'refunded' AND sp.method = 'cash'",
        params![today], |row| row.get(0)
    ).map_err(|e| e.to_string())?;

    let session_opening: f64 = conn.query_row(
        "SELECT opening_balance FROM cash_register_sessions WHERE id = ?1",
        params![id], |row| row.get(0)
    ).map_err(|e| e.to_string())?;

    let total_expected = session_opening + expected_balance;
    let difference = closing_balance - total_expected;

    let mut existing_notes = notes.clone().unwrap_or_default();
    if let Some(ref n) = notes {
        existing_notes = n.clone();
    }

    conn.execute(
        "UPDATE cash_register_sessions SET closed_at=datetime('now'), closing_balance=?1, expected_balance=?2, difference=?3, status='closed', notes=?4 WHERE id=?5",
        params![closing_balance, total_expected, difference, existing_notes, id],
    ).map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare(
        "SELECT cr.*, u.full_name as user_name
         FROM cash_register_sessions cr
         LEFT JOIN users u ON cr.user_id = u.id
         WHERE cr.id = ?1"
    ).map_err(|e| e.to_string())?;
    stmt.query_row(params![id], |row| {
        Ok(CashRegisterSession {
            id: row.get(0)?, user_id: row.get(1)?,
            opened_at: row.get(2)?, closed_at: row.get(3)?,
            opening_balance: row.get(4)?, closing_balance: row.get(5)?,
            expected_balance: row.get(6)?, difference: row.get(7)?,
            status: row.get(8)?, notes: row.get(9)?,
            user_name: row.get(10)?,
        })
    }).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_cash_register_sessions(state: State<DbState>) -> Result<Vec<CashRegisterSession>, String> {
    let conn = get_conn(&state)?;
    let mut stmt = conn.prepare(
        "SELECT cr.*, u.full_name as user_name
         FROM cash_register_sessions cr
         LEFT JOIN users u ON cr.user_id = u.id
         ORDER BY cr.opened_at DESC"
    ).map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(CashRegisterSession {
            id: row.get(0)?, user_id: row.get(1)?,
            opened_at: row.get(2)?, closed_at: row.get(3)?,
            opening_balance: row.get(4)?, closing_balance: row.get(5)?,
            expected_balance: row.get(6)?, difference: row.get(7)?,
            status: row.get(8)?, notes: row.get(9)?,
            user_name: row.get(10)?,
        })
    }).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for row in rows { result.push(row.map_err(|e| e.to_string())?); }
    Ok(result)
}

// ── Daily Closings ──

#[tauri::command]
pub fn close_daily_shift(state: State<DbState>, closed_by: i64, notes: Option<String>) -> Result<DailyClosing, String> {
    let conn = get_conn(&state)?;
    let today = today_date();

    let existing: Result<DailyClosing, _> = conn.query_row(
        "SELECT dc.*, u.full_name as closed_by_name FROM daily_closings dc
         LEFT JOIN users u ON dc.closed_by = u.id
         WHERE dc.date = ?1",
        params![today],
        |row| {
            Ok(DailyClosing {
                id: row.get(0)?, closed_by: row.get(1)?,
                closed_at: row.get(2)?, date: row.get(3)?,
                total_sales: row.get(4)?, total_revenue: row.get(5)?,
                total_tax: row.get(6)?, total_discount: row.get(7)?,
                cash_total: row.get(8)?, card_total: row.get(9)?,
                transfer_total: row.get(10)?, cash_count: row.get(11)?,
                card_count: row.get(12)?, transfer_count: row.get(13)?,
                refunded_count: row.get(14)?, refunded_total: row.get(15)?,
                net_revenue: row.get(16)?, notes: row.get(17)?,
                closed_by_name: row.get(18)?,
            })
        }
    );

    if let Ok(_) = existing {
        return Err("Daily closing already exists for today".to_string());
    }

    let closeout = get_daily_closeout_inner(&conn)?;
    let net_revenue = closeout.total_revenue - closeout.refunded_total;

    conn.execute(
        "INSERT INTO daily_closings (closed_by, date, total_sales, total_revenue, total_tax, total_discount, cash_total, card_total, transfer_total, cash_count, card_count, transfer_count, refunded_count, refunded_total, net_revenue, notes)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16)",
        params![closed_by, today, closeout.total_sales, closeout.total_revenue,
                closeout.total_tax, closeout.total_discount, closeout.cash_total,
                closeout.card_total, closeout.transfer_total, closeout.cash_count,
                closeout.card_count, closeout.transfer_count, closeout.refunded_count,
                closeout.refunded_total, net_revenue, notes],
    ).map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();
    let mut stmt = conn.prepare(
        "SELECT dc.*, u.full_name as closed_by_name FROM daily_closings dc
         LEFT JOIN users u ON dc.closed_by = u.id
         WHERE dc.id = ?1"
    ).map_err(|e| e.to_string())?;
    stmt.query_row(params![id], |row| {
        Ok(DailyClosing {
            id: row.get(0)?, closed_by: row.get(1)?,
            closed_at: row.get(2)?, date: row.get(3)?,
            total_sales: row.get(4)?, total_revenue: row.get(5)?,
            total_tax: row.get(6)?, total_discount: row.get(7)?,
            cash_total: row.get(8)?, card_total: row.get(9)?,
            transfer_total: row.get(10)?, cash_count: row.get(11)?,
            card_count: row.get(12)?, transfer_count: row.get(13)?,
            refunded_count: row.get(14)?, refunded_total: row.get(15)?,
            net_revenue: row.get(16)?, notes: row.get(17)?,
            closed_by_name: row.get(18)?,
        })
    }).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_daily_closings(state: State<DbState>) -> Result<Vec<DailyClosing>, String> {
    let conn = get_conn(&state)?;
    let mut stmt = conn.prepare(
        "SELECT dc.*, u.full_name as closed_by_name
         FROM daily_closings dc
         LEFT JOIN users u ON dc.closed_by = u.id
         ORDER BY dc.date DESC"
    ).map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(DailyClosing {
            id: row.get(0)?, closed_by: row.get(1)?,
            closed_at: row.get(2)?, date: row.get(3)?,
            total_sales: row.get(4)?, total_revenue: row.get(5)?,
            total_tax: row.get(6)?, total_discount: row.get(7)?,
            cash_total: row.get(8)?, card_total: row.get(9)?,
            transfer_total: row.get(10)?, cash_count: row.get(11)?,
            card_count: row.get(12)?, transfer_count: row.get(13)?,
            refunded_count: row.get(14)?, refunded_total: row.get(15)?,
            net_revenue: row.get(16)?, notes: row.get(17)?,
            closed_by_name: row.get(18)?,
        })
    }).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for row in rows { result.push(row.map_err(|e| e.to_string())?); }
    Ok(result)
}

// ── Receipts ──

#[tauri::command]
pub fn get_receipts_for_sale(state: State<DbState>, sale_id: i64) -> Result<Vec<Receipt>, String> {
    let conn = get_conn(&state)?;
    let mut stmt = conn.prepare(
        "SELECT * FROM receipts WHERE sale_id = ?1 ORDER BY created_at"
    ).map_err(|e| e.to_string())?;
    let rows = stmt.query_map(params![sale_id], |row| {
        Ok(Receipt {
            id: row.get(0)?, sale_id: row.get(1)?,
            receipt_number: row.get(2)?, receipt_type: row.get(3)?,
            printed_at: row.get(4)?,
            is_printed: row.get::<_, i64>(5)? != 0,
            created_at: row.get(6)?,
        })
    }).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for row in rows { result.push(row.map_err(|e| e.to_string())?); }
    Ok(result)
}

#[tauri::command]
pub fn get_receipt(state: State<DbState>, id: i64) -> Result<Receipt, String> {
    let conn = get_conn(&state)?;
    get_receipt_inner(&conn,id)
}

/// Connection-scoped body of [`get_receipt`], so callers that already hold the
/// database lock can reuse their guard instead of re-locking it.
fn get_receipt_inner(conn: &rusqlite::Connection, id: i64) -> Result<Receipt, String> {
    let mut stmt = conn.prepare("SELECT * FROM receipts WHERE id = ?1").map_err(|e| e.to_string())?;
    stmt.query_row(params![id], |row| {
        Ok(Receipt {
            id: row.get(0)?, sale_id: row.get(1)?,
            receipt_number: row.get(2)?, receipt_type: row.get(3)?,
            printed_at: row.get(4)?,
            is_printed: row.get::<_, i64>(5)? != 0,
            created_at: row.get(6)?,
        })
    }).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn mark_receipt_printed(state: State<DbState>, id: i64) -> Result<Receipt, String> {
    let conn = get_conn(&state)?;
    conn.execute(
        "UPDATE receipts SET is_printed=1, printed_at=datetime('now') WHERE id=?1",
        params![id],
    ).map_err(|e| e.to_string())?;
    get_receipt_inner(&conn, id)
}

// ── Hold / Resume Sales (TASK 07) ──

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HeldSaleItem {
    pub id: i64,
    pub held_sale_id: i64,
    pub product_id: i64,
    pub name: String,
    pub sku: String,
    pub quantity: i64,
    pub unit_price: f64,
    pub tax_rate: f64,
    pub total: f64,
    pub stock_quantity: i64,
    pub unit: String,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HeldSale {
    pub id: i64,
    pub hold_number: String,
    pub customer_id: Option<i64>,
    pub user_id: Option<i64>,
    pub subtotal: f64,
    pub tax_amount: f64,
    pub discount_amount: f64,
    pub total: f64,
    pub discount_percent: f64,
    pub notes: Option<String>,
    pub label: Option<String>,
    pub created_at: String,
    pub customer_name: Option<String>,
    pub item_count: Option<i64>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HoldSaleInput {
    pub customer_id: Option<i64>,
    pub user_id: Option<i64>,
    pub items: Vec<HeldSaleItemInput>,
    pub discount_percent: Option<f64>,
    pub notes: Option<String>,
    pub label: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HeldSaleItemInput {
    pub product_id: i64,
    pub name: String,
    pub sku: String,
    pub quantity: i64,
    pub unit_price: f64,
    pub tax_rate: f64,
    pub total: f64,
    pub stock_quantity: i64,
    pub unit: String,
}

fn generate_hold_number(conn: &rusqlite::Connection) -> Result<String, String> {
    let count: i64 = conn
        .query_row("SELECT COUNT(*) FROM held_sales", [], |r| r.get(0))
        .map_err(|e| e.to_string())?;
    Ok(format!("HOLD-{:05}", count + 1))
}

#[tauri::command]
pub fn hold_sale(state: State<DbState>, input: HoldSaleInput) -> Result<HeldSale, String> {
    let conn = get_conn(&state)?;
    let hold_number = generate_hold_number(&conn)?;

    let subtotal: f64 = input.items.iter().map(|i| i.total).sum();
    let tax_amount: f64 = input.items.iter().map(|i| i.total * (i.tax_rate / 100.0)).sum();
    let discount_percent = input.discount_percent.unwrap_or(0.0);
    let discount_amount = if discount_percent > 0.0 { subtotal * (discount_percent / 100.0) } else { 0.0 };
    let total = subtotal + tax_amount - discount_amount;

    conn.execute(
        "INSERT INTO held_sales (hold_number, customer_id, user_id, subtotal, tax_amount, discount_amount, total, discount_percent, notes, label)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
        params![
            hold_number,
            input.customer_id,
            input.user_id,
            subtotal,
            tax_amount,
            discount_amount,
            total,
            discount_percent,
            input.notes,
            input.label,
        ],
    ).map_err(|e| e.to_string())?;

    let held_sale_id: i64 = conn.last_insert_rowid();

    for item in &input.items {
        conn.execute(
            "INSERT INTO held_sale_items (held_sale_id, product_id, name, sku, quantity, unit_price, tax_rate, total, stock_quantity, unit)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
            params![
                held_sale_id,
                item.product_id,
                item.name,
                item.sku,
                item.quantity,
                item.unit_price,
                item.tax_rate,
                item.total,
                item.stock_quantity,
                item.unit,
            ],
        ).map_err(|e| e.to_string())?;
    }

    let customer_name = input.customer_id.and_then(|cid| {
        conn.query_row("SELECT name FROM customers WHERE id=?1", params![cid], |r| r.get::<_, String>(0)).ok()
    });

    Ok(HeldSale {
        id: held_sale_id,
        hold_number,
        customer_id: input.customer_id,
        user_id: input.user_id,
        subtotal,
        tax_amount,
        discount_amount,
        total,
        discount_percent,
        notes: input.notes,
        label: input.label,
        created_at: chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string(),
        customer_name,
        item_count: Some(input.items.len() as i64),
    })
}

#[tauri::command]
pub fn get_held_sales(state: State<DbState>) -> Result<Vec<HeldSale>, String> {
    let conn = get_conn(&state)?;
    let mut stmt = conn.prepare(
        "SELECT h.*, c.name as customer_name,
                (SELECT COUNT(*) FROM held_sale_items hsi WHERE hsi.held_sale_id = h.id) as item_count
         FROM held_sales h
         LEFT JOIN customers c ON h.customer_id = c.id
         ORDER BY h.created_at DESC"
    ).map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(HeldSale {
            id: row.get(0)?,
            hold_number: row.get(1)?,
            customer_id: row.get(2)?,
            user_id: row.get(3)?,
            subtotal: row.get(4)?,
            tax_amount: row.get(5)?,
            discount_amount: row.get(6)?,
            total: row.get(7)?,
            discount_percent: row.get(8)?,
            notes: row.get(9)?,
            label: row.get(10)?,
            created_at: row.get(11)?,
            customer_name: row.get(12)?,
            item_count: row.get(13)?,
        })
    }).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for row in rows { result.push(row.map_err(|e| e.to_string())?); }
    Ok(result)
}

#[tauri::command]
pub fn get_held_sale_items(state: State<DbState>, held_sale_id: i64) -> Result<Vec<HeldSaleItem>, String> {
    let conn = get_conn(&state)?;
    let mut stmt = conn.prepare(
        "SELECT * FROM held_sale_items WHERE held_sale_id = ?1 ORDER BY id"
    ).map_err(|e| e.to_string())?;
    let rows = stmt.query_map(params![held_sale_id], |row| {
        Ok(HeldSaleItem {
            id: row.get(0)?,
            held_sale_id: row.get(1)?,
            product_id: row.get(2)?,
            name: row.get(3)?,
            sku: row.get(4)?,
            quantity: row.get(5)?,
            unit_price: row.get(6)?,
            tax_rate: row.get(7)?,
            total: row.get(8)?,
            stock_quantity: row.get(9)?,
            unit: row.get(10)?,
            created_at: row.get(11)?,
        })
    }).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for row in rows { result.push(row.map_err(|e| e.to_string())?); }
    Ok(result)
}

#[tauri::command]
pub fn resume_held_sale(state: State<DbState>, held_sale_id: i64) -> Result<HeldSale, String> {
    let conn = get_conn(&state)?;

    let held = conn.query_row(
        "SELECT * FROM held_sales WHERE id = ?1",
        params![held_sale_id],
        |row| {
            Ok(HeldSale {
                id: row.get(0)?,
                hold_number: row.get(1)?,
                customer_id: row.get(2)?,
                user_id: row.get(3)?,
                subtotal: row.get(4)?,
                tax_amount: row.get(5)?,
                discount_amount: row.get(6)?,
                total: row.get(7)?,
                discount_percent: row.get(8)?,
                notes: row.get(9)?,
                label: row.get(10)?,
                created_at: row.get(11)?,
                customer_name: None,
                item_count: None,
            })
        },
    ).map_err(|e| format!("Held sale not found: {}", e))?;

    // Delete the held sale (cascade deletes items)
    conn.execute("DELETE FROM held_sales WHERE id = ?1", params![held_sale_id])
        .map_err(|e| e.to_string())?;

    Ok(held)
}

#[tauri::command]
pub fn delete_held_sale(state: State<DbState>, held_sale_id: i64) -> Result<(), String> {
    let conn = get_conn(&state)?;
    conn.execute("DELETE FROM held_sales WHERE id = ?1", params![held_sale_id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn search_sales(state: State<DbState>, query: String) -> Result<Vec<Sale>, String> {
    let conn = get_conn(&state)?;
    let pattern = format!("%{}%", query);
    let mut stmt = conn.prepare(SEARCH_SALES_SQL).map_err(|e| e.to_string())?;
    let rows = stmt.query_map(params![pattern], |row| {
        let mut sale = map_sale(row)?;
        sale.customer_name = row.get::<_, Option<String>>(16).ok().flatten();
        sale.item_count = row.get::<_, Option<i64>>(17).ok().flatten();
        Ok(sale)
    }).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for row in rows { result.push(row.map_err(|e| e.to_string())?); }
    Ok(result)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::config::PROFILE_SINGLE_STORE;
    use crate::db::init_database_with_profile;
    use chrono::{Datelike, Duration, Local, NaiveDate, NaiveDateTime, Utc};

    /// BUG-005: opening the cash register never returned.
    ///
    /// `open_cash_register` took the database lock with `get_conn`, then called
    /// `get_cash_register_status`, which locks again. `std::sync::Mutex` is not
    /// reentrant, so the second `lock()` blocks on a mutex the same thread
    /// already holds: the command deadlocked and the Tauri `invoke` never
    /// resolved. No error, no log - the UI just sat there.
    ///
    /// A behavioural test cannot catch this, because reproducing it needs a
    /// `tauri::State` and a hung test process is indistinguishable from a slow
    /// one. So assert the structural invariant instead: no command may call
    /// another re-locking command while still holding a guard.
    ///
    /// The same shape affected `create_quote`, `update_quote`,
    /// `update_quote_status`, `convert_quote_to_sale`, `close_daily_shift` and
    /// `mark_receipt_printed` - all nine call sites deadlocked.
    #[test]
    fn no_command_calls_a_relocking_command_while_holding_the_lock() {
        let raw = std::fs::read_to_string(
            std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("src/commands/sales.rs"),
        )
        .expect("read sales.rs");
        // Comments are stripped first: prose that merely names a command would
        // otherwise register as a call to it.
        let source = strip_comments(&raw);

        // Commands that acquire the lock, i.e. anything taking State<DbState>.
        let re_locking: Vec<&str> = source
            .match_indices("State<DbState>")
            .filter_map(|(idx, _)| {
                let head = &source[..idx];
                let start = head.rfind("fn ").map(|p| p + 3)?;
                let name: String = head[start..]
                    .chars()
                    .take_while(|c| c.is_alphanumeric() || *c == '_')
                    .collect();
                if name.is_empty() { None } else { Some(Box::leak(name.into_boxed_str()) as &str) }
            })
            .collect();
        assert!(!re_locking.is_empty(), "sanity: the scan must find commands");

        let mut offenders = Vec::new();
        for (name, body) in function_bodies(&source) {
            if !re_locking.contains(&name.as_str()) {
                continue;
            }
            let guards: Vec<&str> = body
                .match_indices("get_conn(&state)")
                .map(|(idx, _)| {
                    let head = &body[..idx];
                    let stmt = head.rfind("let ").map(|p| p + 4)?;
                    let rest = &body[stmt..];
                    let name: String = rest
                        .chars()
                        .take_while(|c| c.is_alphanumeric() || *c == '_')
                        .collect();
                    Some(Box::leak(name.into_boxed_str()) as &str)
                })
                .filter_map(|g| g)
                .collect();
            assert!(
                guards.iter().all(|g| !g.is_empty()),
                "could not name every lock guard in {name}() - the scan would be unreliable"
            );

            for (callee, at) in calls(&body) {
                if callee == name || !re_locking.contains(&callee.as_str()) {
                    continue;
                }
                let dropped = drops_before(&body, at);
                if guards.iter().any(|g| !dropped.iter().any(|d| d == *g)) {
                    offenders.push(format!("  {name}() calls {callee}() while holding the lock"));
                }
            }
        }

        assert!(
            offenders.is_empty(),
            "commands that re-lock a non-reentrant std::sync::Mutex and deadlock:\n{}\n\
             Pass the already-held guard to a *_inner(&Connection) helper, or drop(conn) \
             before calling a command that locks for itself.",
            offenders.join("\n")
        );
    }

    /// Drops `//` and `/* */` comments, keeping string literals intact.
    fn strip_comments(source: &str) -> String {
        let b: Vec<char> = source.chars().collect();
        let mut out = String::with_capacity(source.len());
        let mut i = 0;
        while i < b.len() {
            if b[i] == '"' {
                out.push(b[i]);
                i += 1;
                while i < b.len() {
                    out.push(b[i]);
                    if b[i] == '\\' && i + 1 < b.len() {
                        out.push(b[i + 1]);
                        i += 2;
                        continue;
                    }
                    let done = b[i] == '"';
                    i += 1;
                    if done {
                        break;
                    }
                }
            } else if b[i] == '/' && i + 1 < b.len() && b[i + 1] == '/' {
                while i < b.len() && b[i] != '\n' {
                    i += 1;
                }
            } else if b[i] == '/' && i + 1 < b.len() && b[i + 1] == '*' {
                i += 2;
                while i + 1 < b.len() && !(b[i] == '*' && b[i + 1] == '/') {
                    i += 1;
                }
                i = (i + 2).min(b.len());
            } else {
                out.push(b[i]);
                i += 1;
            }
        }
        out
    }

    /// Every function body in `source`, with its name.
    fn function_bodies(source: &str) -> Vec<(String, String)> {
        let mut out = Vec::new();
        let mut rest = source;
        while let Some(at) = rest.find("fn ") {
            let tail = &rest[at + 3..];
            let name: String = tail
                .chars()
                .take_while(|c| c.is_alphanumeric() || *c == '_')
                .collect();
            let body_at = match rest[at..].find('{') {
                Some(b) => at + b,
                None => break,
            };
            let mut depth = 0i32;
            let mut end = rest.len();
            for (i, ch) in rest[body_at..].char_indices() {
                match ch {
                    '{' => depth += 1,
                    '}' => {
                        depth -= 1;
                        if depth == 0 {
                            end = body_at + i;
                            break;
                        }
                    }
                    _ => {}
                }
            }
            out.push((name, rest[body_at..end].to_string()));
            rest = &rest[end..];
        }
        out
    }

    /// `(callee, byte offset of the call)` for every `name(` in `body`.
    fn calls(body: &str) -> Vec<(String, usize)> {
        let mut out = Vec::new();
        let bytes = body.as_bytes();
        let mut i = 0;
        while i < bytes.len() {
            if bytes[i] == b'_' || bytes[i].is_ascii_alphabetic() {
                let start = i;
                while i < bytes.len() && (bytes[i] == b'_' || bytes[i].is_ascii_alphanumeric()) {
                    i += 1;
                }
                let name = &body[start..i];
                if !name.is_empty() {
                    let mut j = i;
                    while j < bytes.len() && bytes[j].is_ascii_whitespace() {
                        j += 1;
                    }
                    if j < bytes.len() && bytes[j] == b'(' {
                        out.push((name.to_string(), start));
                    }
                }
            } else {
                i += 1;
            }
        }
        out
    }

    /// Guard names explicitly dropped in `body` before byte offset `at`.
    fn drops_before(body: &str, at: usize) -> Vec<String> {
        body[..at]
            .match_indices("drop(")
            .filter_map(|(i, _)| {
                let rest = &body[i + 5..];
                let end = rest.find(')')?;
                let name = rest[..end].trim();
                if name.is_empty() { None } else { Some(name.to_string()) }
            })
            .collect()
    }

    fn test_db() -> rusqlite::Connection {
        let dir = std::env::temp_dir().join(format!("ig_sales_test_{}", uuid::Uuid::new_v4()));
        std::fs::create_dir_all(&dir).expect("create temp dir");
        let path = dir.join("sales.db");
        init_database_with_profile(path.to_str().unwrap(), PROFILE_SINGLE_STORE).expect("init db")
    }

    /// Inserts a sale with an explicit UTC `created_at` string and returns its id.
    fn insert_sale(conn: &rusqlite::Connection, n: i64, total: f64, status: &str, created_at: &str) -> i64 {
        conn.execute(
            "INSERT INTO sales (sale_number, total, payment_status, payment_method, created_at, updated_at)
             VALUES (?1, ?2, ?3, 'cash', ?4, ?4)",
            params![format!("INV-T{:05}", n), total, status, created_at],
        )
        .expect("insert sale");
        conn.last_insert_rowid()
    }

    /// UTC string for `delta` from the start of the local day containing `now`.
    fn day_offset(now: chrono::DateTime<Local>, delta: Duration) -> String {
        (local_day_start_utc(now) + delta)
            .format("%Y-%m-%d %H:%M:%S")
            .to_string()
    }

    fn now() -> chrono::DateTime<Local> {
        chrono::Local::now()
    }

    #[test]
    fn empty_db_returns_zero_summary() {
        let db = test_db();
        let s = sales_summary_for(&db, now()).unwrap();
        assert_eq!(s.total_sales_today, 0);
        assert_eq!(s.revenue_today, 0.0);
        assert_eq!(s.total_sales_month, 0);
        assert_eq!(s.revenue_month, 0.0);
        assert_eq!(s.average_order_value, 0.0);
    }

    #[test]
    fn today_sales_drive_all_four_kpis() {
        let db = test_db();
        let n = now();
        // Two paid sales within the local day (mirrors the reported $106 + $90 example).
        insert_sale(&db, 1, 106.0, "paid", &day_offset(n, Duration::hours(1)));
        insert_sale(&db, 2, 90.0, "paid", &day_offset(n, Duration::hours(2)));

        let s = sales_summary_for(&db, n).unwrap();
        assert_eq!(s.total_sales_today, 2);
        assert_eq!(s.revenue_today, 196.0);
        assert_eq!(s.average_order_value, 98.0);
        assert_eq!(s.total_sales_month, 2);
        assert_eq!(s.revenue_month, 196.0);
    }

    #[test]
    fn sequential_sales_accumulate() {
        let db = test_db();
        let n = now();

        insert_sale(&db, 1, 100.0, "paid", &day_offset(n, Duration::hours(1)));
        let s1 = sales_summary_for(&db, n).unwrap();
        assert_eq!(s1.total_sales_today, 1);
        assert_eq!(s1.revenue_today, 100.0);
        assert_eq!(s1.average_order_value, 100.0);
        assert_eq!(s1.revenue_month, 100.0);

        insert_sale(&db, 2, 50.0, "paid", &day_offset(n, Duration::hours(2)));
        let s2 = sales_summary_for(&db, n).unwrap();
        assert_eq!(s2.total_sales_today, 2);
        assert_eq!(s2.revenue_today, 150.0);
        assert_eq!(s2.average_order_value, 75.0);
        assert_eq!(s2.revenue_month, 150.0);
    }

    #[test]
    fn refunded_sales_are_excluded() {
        let db = test_db();
        let n = now();
        insert_sale(&db, 1, 100.0, "paid", &day_offset(n, Duration::hours(1)));
        insert_sale(&db, 2, 50.0, "refunded", &day_offset(n, Duration::hours(2)));

        let s = sales_summary_for(&db, n).unwrap();
        assert_eq!(s.total_sales_today, 1);
        assert_eq!(s.revenue_today, 100.0);
        assert_eq!(s.total_sales_month, 1);
        assert_eq!(s.revenue_month, 100.0);
    }

    #[test]
    fn partial_pending_sales_follow_existing_rule_and_are_counted() {
        // Existing app rule: only `refunded` is excluded (see get_sales,
        // get_daily_closeout). A pending/partial non-refunded sale still counts
        // toward revenue — mirror that here to lock in behaviour.
        let db = test_db();
        let n = now();
        insert_sale(&db, 1, 30.0, "partial", &day_offset(n, Duration::hours(1)));

        let s = sales_summary_for(&db, n).unwrap();
        assert_eq!(s.total_sales_today, 1);
        assert_eq!(s.revenue_today, 30.0);
        assert_eq!(s.revenue_month, 30.0);
    }

    #[test]
    fn previous_local_day_is_not_included_today() {
        let db = test_db();
        let n = now();
        insert_sale(&db, 1, 999.0, "paid", &day_offset(n, Duration::seconds(-1)));

        let s = sales_summary_for(&db, n).unwrap();
        assert_eq!(s.total_sales_today, 0);
        assert_eq!(s.revenue_today, 0.0);
    }

    #[test]
    fn same_calendar_month_other_day_counts_toward_month_not_today() {
        let db = test_db();
        let n = now();
        let today = n.date_naive();
        let other_day: u32 = if today.day() == 2 { 3 } else { 2 };
        let other_date = NaiveDate::from_ymd_opt(today.year(), today.month(), other_day).expect("other day valid");
        let other_start_utc = other_date
            .and_hms_opt(0, 0, 0)
            .expect("valid midnight")
            .and_local_timezone(Local)
            .earliest()
            .expect("resolves")
            .with_timezone(&Utc);

        insert_sale(&db, 1, 60.0, "paid", &other_start_utc.format("%Y-%m-%d %H:%M:%S").to_string());

        let s = sales_summary_for(&db, n).unwrap();
        assert_eq!(s.total_sales_today, if other_day == today.day() { 1 } else { 0 });
        assert_eq!(s.revenue_today, if other_day == today.day() { 60.0 } else { 0.0 });
        assert_eq!(s.total_sales_month, 1);
        assert_eq!(s.revenue_month, 60.0);
    }

    #[test]
    fn previous_local_month_is_excluded_from_day_and_month() {
        let db = test_db();
        let n = now();
        let (month_start, _) = utc_bounds_for_local_month(n);
        let last_month = format!(
            "{}",
            (NaiveDateTime::parse_from_str(&month_start, "%Y-%m-%d %H:%M:%S")
                .unwrap()
                .and_utc()
                - Duration::seconds(1))
                .format("%Y-%m-%d %H:%M:%S")
        );
        insert_sale(&db, 1, 777.0, "paid", &last_month);

        let s = sales_summary_for(&db, n).unwrap();
        assert_eq!(s.total_sales_today, 0);
        assert_eq!(s.revenue_today, 0.0);
        assert_eq!(s.total_sales_month, 0);
        assert_eq!(s.revenue_month, 0.0);
    }

    #[test]
    fn day_bounds_are_contiguous_and_ordered() {
        let n = now();
        let (ds, de) = utc_bounds_for_local_day(n);
        let (ms, me) = utc_bounds_for_local_month(n);
        assert!(ds < de);
        assert!(ms < me);
        assert!(ds >= ms, "local day must fall within local month");
        assert!(de <= me, "local day must fall within local month");
    }
}
