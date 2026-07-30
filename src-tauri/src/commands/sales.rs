use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::State;
use crate::db::DbState;

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
    pub is_active: bool,
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

fn today_date() -> String {
    let now = chrono::Local::now();
    now.format("%Y-%m-%d").to_string()
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

#[tauri::command]
pub fn search_products_for_pos(state: State<DbState>, search: String) -> Result<Vec<ProductForPos>, String> {
    let conn = get_conn(&state)?;
    let pattern = format!("%{}%", search);
    let mut stmt = conn.prepare(
        "SELECT p.id, p.name, p.sku, p.barcode, p.sale_price, p.wholesale_price,
                p.stock_quantity, p.unit, p.image_url, p.tax_rate, c.name as category_name, p.is_active
         FROM products p
         LEFT JOIN categories c ON p.category_id = c.id
         WHERE (p.name LIKE ?1 OR p.sku LIKE ?1 OR p.barcode LIKE ?1 OR p.internal_code LIKE ?1 OR p.oem_number LIKE ?1)
         AND p.is_active = 1
         ORDER BY p.name LIMIT 50"
    ).map_err(|e| e.to_string())?;
    let rows = stmt.query_map(params![pattern], |row| {
        Ok(ProductForPos {
            id: row.get(0)?, name: row.get(1)?, sku: row.get(2)?,
            barcode: row.get(3)?, sale_price: row.get(4)?,
            wholesale_price: row.get(5)?, stock_quantity: row.get(6)?,
            unit: row.get(7)?, image_url: row.get(8)?, tax_rate: row.get(9)?,
            category_name: row.get(10)?, is_active: row.get::<_, i64>(11)? != 0,
        })
    }).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for row in rows { result.push(row.map_err(|e| e.to_string())?); }
    Ok(result)
}

// ── Sales Queries ──

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
        params![sale_number, receipt_number, input.customer_id, input.user_id, input.warehouse_id,
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

#[tauri::command]
pub fn get_sales_summary(state: State<DbState>) -> Result<SalesSummary, String> {
    let conn = get_conn(&state)?;
    let today = today_date();

    let total_sales_today: i64 = conn.query_row(
        "SELECT COUNT(*) FROM sales WHERE date(created_at) = ?1 AND payment_status != 'refunded'",
        params![today], |row| row.get(0)
    ).map_err(|e| e.to_string())?;

    let revenue_today: f64 = conn.query_row(
        "SELECT COALESCE(SUM(total), 0) FROM sales WHERE date(created_at) = ?1 AND payment_status != 'refunded'",
        params![today], |row| row.get(0)
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
        "SELECT COUNT(*) FROM sales WHERE created_at >= datetime('now', '-30 days') AND payment_status != 'refunded'",
        [], |row| row.get(0)
    ).map_err(|e| e.to_string())?;

    let revenue_month: f64 = conn.query_row(
        "SELECT COALESCE(SUM(total), 0) FROM sales WHERE created_at >= datetime('now', '-30 days') AND payment_status != 'refunded'",
        [], |row| row.get(0)
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

    get_quote(state.clone(), quote_id)
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

    get_quote(state.clone(), id)
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
    get_quote(state.clone(), id)
}

#[tauri::command]
pub fn convert_quote_to_sale(state: State<DbState>, quote_id: i64, user_id: Option<i64>) -> Result<CheckoutResult, String> {
    let conn = get_conn(&state)?;

    let quote = get_quote(state.clone(), quote_id)?;
    let items = get_quote_items(state.clone(), quote_id)?;

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

    let result = process_checkout(state.clone(), input)?;

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

    let existing = get_cash_register_status(state.clone())?;
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

    let closeout = get_daily_closeout(state.clone())?;
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
    get_receipt(state.clone(), id)
}

// ── Search Sales (for POS history lookup) ──

#[tauri::command]
pub fn search_sales(state: State<DbState>, query: String) -> Result<Vec<Sale>, String> {
    let conn = get_conn(&state)?;
    let pattern = format!("%{}%", query);
    let mut stmt = conn.prepare(
        "SELECT s.*, c.name as customer_name,
                (SELECT COUNT(*) FROM sale_items si WHERE si.sale_id = s.id) as item_count
         FROM sales s
         LEFT JOIN customers c ON s.customer_id = c.id
         WHERE s.sale_number LIKE ?1 OR c.name LIKE ?1
         ORDER BY s.created_at DESC LIMIT 20"
    ).map_err(|e| e.to_string())?;
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
