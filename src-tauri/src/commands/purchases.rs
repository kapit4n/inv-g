use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::State;
use crate::db::DbState;

fn get_conn<'r>(state: &'r State<'r, DbState>) -> Result<std::sync::MutexGuard<'r, rusqlite::Connection>, String> {
    state.conn.lock().map_err(|e| format!("Database lock error: {}", e))
}

fn generate_number(conn: &rusqlite::Connection, prefix: &str, table: &str, column: &str) -> Result<String, String> {
    let next_id: i64 = conn.query_row(
        &format!("SELECT COALESCE(MAX(CAST(SUBSTR({}, {}) AS INTEGER)), 0) + 1 FROM {}", column, prefix.len() + 2, table),
        [],
        |row| row.get(0),
    ).map_err(|e| e.to_string())?;
    Ok(format!("{}-{:06}", prefix, next_id))
}

// ── Data Structures ──

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PurchaseOrderResponse {
    pub id: i64,
    pub po_number: String,
    pub supplier_id: Option<i64>,
    pub supplier_name: Option<String>,
    pub user_id: Option<i64>,
    pub user_name: Option<String>,
    pub warehouse_id: Option<i64>,
    pub warehouse_name: Option<String>,
    pub order_date: String,
    pub expected_delivery_date: Option<String>,
    pub currency: String,
    pub payment_terms: Option<String>,
    pub shipping_method: Option<String>,
    pub reference_number: Option<String>,
    pub buyer: Option<String>,
    pub subtotal: f64,
    pub tax_rate: f64,
    pub tax_amount: f64,
    pub discount_amount: f64,
    pub shipping_cost: f64,
    pub total: f64,
    pub status: String,
    pub notes: Option<String>,
    pub approved_by: Option<i64>,
    pub approved_by_name: Option<String>,
    pub approved_at: Option<String>,
    pub sent_at: Option<String>,
    pub item_count: Option<i64>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PurchaseOrderItemResponse {
    pub id: i64,
    pub purchase_order_id: i64,
    pub product_id: i64,
    pub product_name: Option<String>,
    pub product_sku: Option<String>,
    pub supplier_sku: Option<String>,
    pub quantity: i64,
    pub unit_cost: f64,
    pub discount: f64,
    pub tax: f64,
    pub total: f64,
    pub received_quantity: i64,
    pub damaged_quantity: i64,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PurchaseOrderInput {
    pub supplier_id: Option<i64>,
    pub warehouse_id: Option<i64>,
    pub payment_terms: Option<String>,
    pub shipping_method: Option<String>,
    pub reference_number: Option<String>,
    pub buyer: Option<String>,
    pub notes: Option<String>,
    pub expected_delivery_date: Option<String>,
    pub items: Vec<PurchaseOrderItemInput>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PurchaseOrderItemInput {
    pub product_id: i64,
    pub supplier_sku: Option<String>,
    pub quantity: i64,
    pub unit_cost: f64,
    pub discount: f64,
    pub tax: f64,
    pub total: f64,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PurchaseRequestResponse {
    pub id: i64,
    pub request_number: String,
    pub requested_by: Option<i64>,
    pub requested_by_name: Option<String>,
    pub warehouse_id: Option<i64>,
    pub warehouse_name: Option<String>,
    pub priority: String,
    pub status: String,
    pub reason: Option<String>,
    pub required_date: Option<String>,
    pub item_count: Option<i64>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PurchaseRequestItemResponse {
    pub id: i64,
    pub request_id: i64,
    pub product_id: i64,
    pub product_name: Option<String>,
    pub product_sku: Option<String>,
    pub requested_quantity: i64,
    pub current_stock: i64,
    pub min_stock_level: i64,
    pub supplier_suggestion: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PurchaseRequestItemInput {
    pub product_id: i64,
    pub requested_quantity: i64,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PurchaseReceiptResponse {
    pub id: i64,
    pub receipt_number: String,
    pub purchase_order_id: i64,
    pub po_number: Option<String>,
    pub received_by: Option<i64>,
    pub received_by_name: Option<String>,
    pub warehouse_id: Option<i64>,
    pub warehouse_name: Option<String>,
    pub notes: Option<String>,
    pub status: String,
    pub item_count: Option<i64>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PurchaseReceiptItemResponse {
    pub id: i64,
    pub receipt_id: i64,
    pub po_item_id: i64,
    pub product_id: i64,
    pub product_name: Option<String>,
    pub product_sku: Option<String>,
    pub expected_quantity: i64,
    pub received_quantity: i64,
    pub damaged_quantity: i64,
    pub accepted_quantity: i64,
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReceiveItemInput {
    pub po_item_id: i64,
    pub product_id: i64,
    pub received_quantity: i64,
    pub damaged_quantity: i64,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PurchaseReturnResponse {
    pub id: i64,
    pub return_number: String,
    pub purchase_order_id: Option<i64>,
    pub po_number: Option<String>,
    pub supplier_id: i64,
    pub supplier_name: Option<String>,
    pub reason: Option<String>,
    pub status: String,
    pub created_by: Option<i64>,
    pub created_by_name: Option<String>,
    pub item_count: Option<i64>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PurchaseReturnItemResponse {
    pub id: i64,
    pub return_id: i64,
    pub product_id: i64,
    pub product_name: Option<String>,
    pub product_sku: Option<String>,
    pub quantity: i64,
    pub unit_cost: f64,
    pub reason: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PurchaseReturnItemInput {
    pub product_id: i64,
    pub quantity: i64,
    pub unit_cost: f64,
    pub reason: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SupplierProductResponse {
    pub id: i64,
    pub supplier_id: i64,
    pub product_id: i64,
    pub supplier_sku: Option<String>,
    pub is_preferred: bool,
    pub minimum_order_quantity: i64,
    pub lead_time_days: i64,
    pub default_cost: f64,
    pub currency: String,
    pub status: String,
    pub product_name: Option<String>,
    pub product_sku: Option<String>,
    pub brand_name: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SupplierProductInput {
    pub supplier_id: i64,
    pub product_id: i64,
    pub supplier_sku: Option<String>,
    pub is_preferred: bool,
    pub minimum_order_quantity: i64,
    pub lead_time_days: i64,
    pub default_cost: f64,
    pub currency: Option<String>,
    pub status: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CostHistoryResponse {
    pub id: i64,
    pub product_id: i64,
    pub product_name: Option<String>,
    pub product_sku: Option<String>,
    pub supplier_id: Option<i64>,
    pub supplier_name: Option<String>,
    pub purchase_order_id: Option<i64>,
    pub po_number: Option<String>,
    pub old_cost: f64,
    pub new_cost: f64,
    pub quantity: i64,
    pub created_by: Option<i64>,
    pub created_by_name: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReorderSuggestion {
    pub product_id: i64,
    pub product_name: String,
    pub product_sku: String,
    pub current_stock: i64,
    pub min_stock_level: i64,
    pub reorder_point: i64,
    pub max_stock_level: i64,
    pub sale_price: f64,
    pub cost_price: f64,
    pub pending_po_quantity: i64,
    pub reserved_quantity: i64,
    pub suggested_order: i64,
    pub preferred_supplier_id: Option<i64>,
    pub preferred_supplier_name: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SupplierPerformance {
    pub supplier_id: i64,
    pub supplier_name: String,
    pub total_orders: i64,
    pub completed_orders: i64,
    pub cancelled_orders: i64,
    pub avg_delivery_days: Option<f64>,
    pub total_purchased: f64,
    pub avg_cost: f64,
    pub return_rate: f64,
    pub late_deliveries: i64,
    pub preferred_score: i64,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PurchaseDashboard {
    pub pending_orders: i64,
    pub awaiting_approval: i64,
    pub awaiting_delivery: i64,
    pub today_receipts: i64,
    pub monthly_purchased: f64,
    pub monthly_order_count: i64,
    pub recent_orders: Vec<PurchaseOrderResponse>,
    pub reorder_suggestions: Vec<ReorderSuggestion>,
    pub supplier_performances: Vec<SupplierPerformance>,
    pub top_suppliers: Vec<(String, f64)>,
}

// ── Purchase Orders ──

fn map_po_row(row: &rusqlite::Row) -> rusqlite::Result<PurchaseOrderResponse> {
    Ok(PurchaseOrderResponse {
        id: row.get(0)?,
        po_number: row.get(1)?,
        supplier_id: row.get(2)?,
        supplier_name: row.get(3)?,
        user_id: row.get(4)?,
        user_name: row.get(5)?,
        warehouse_id: row.get(6)?,
        warehouse_name: row.get(7)?,
        order_date: row.get(8)?,
        expected_delivery_date: row.get(9)?,
        currency: row.get(10)?,
        payment_terms: row.get(11)?,
        shipping_method: row.get(12)?,
        reference_number: row.get(13)?,
        buyer: row.get(14)?,
        subtotal: row.get(15)?,
        tax_rate: row.get(16)?,
        tax_amount: row.get(17)?,
        discount_amount: row.get(18)?,
        shipping_cost: row.get(19)?,
        total: row.get(20)?,
        status: row.get(21)?,
        notes: row.get(22)?,
        approved_by: row.get(23)?,
        approved_by_name: row.get(24)?,
        approved_at: row.get(25)?,
        sent_at: row.get(26)?,
        item_count: row.get(27)?,
        created_at: row.get(28)?,
        updated_at: row.get(29)?,
    })
}

fn po_select_sql() -> &'static str {
    "SELECT po.id, po.po_number, po.supplier_id, s.company_name as supplier_name,
            po.user_id, u.full_name as user_name,
            po.warehouse_id, w.name as warehouse_name,
            po.order_date, po.expected_delivery_date,
            po.currency, po.payment_terms, po.shipping_method,
            po.reference_number, po.buyer,
            po.subtotal, po.tax_rate, po.tax_amount,
            po.discount_amount, po.shipping_cost, po.total,
            po.status, po.notes,
            po.approved_by, ab.full_name as approved_by_name,
            po.approved_at, po.sent_at,
            (SELECT COUNT(*) FROM purchase_order_items WHERE purchase_order_id = po.id) as item_count,
            po.created_at, po.updated_at
     FROM purchase_orders po
     LEFT JOIN suppliers s ON po.supplier_id = s.id
     LEFT JOIN users u ON po.user_id = u.id
     LEFT JOIN warehouses w ON po.warehouse_id = w.id
     LEFT JOIN users ab ON po.approved_by = ab.id"
}

/// Builds the `WHERE` clause and bound values for `get_purchase_orders`.
///
/// Each filter claims the next free `?N` via `param_values.len() + 1`, so the
/// indices stay in lockstep with the bound values. Split out from the command so
/// tests can exercise the real builder instead of a copy of it.
pub(crate) fn build_purchase_order_filter(
    search: Option<&str>,
    status: Option<&str>,
    supplier_id: Option<i64>,
    warehouse_id: Option<i64>,
    buyer: Option<&str>,
    date_from: Option<&str>,
    date_to: Option<&str>,
) -> (String, Vec<Box<dyn rusqlite::types::ToSql>>) {
    let mut conditions: Vec<String> = Vec::new();
    let mut param_values: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();

    if let Some(s) = search.filter(|s| !s.is_empty()) {
        let n = param_values.len() + 1;
        conditions.push(format!("(po.po_number LIKE ?{n} OR s.company_name LIKE ?{n} OR po.reference_number LIKE ?{n})"));
        param_values.push(Box::new(format!("%{}%", s)));
    }
    if let Some(st) = status.filter(|s| !s.is_empty()) {
        conditions.push(format!("po.status = ?{}", param_values.len() + 1));
        param_values.push(Box::new(st.to_string()));
    }
    if let Some(sid) = supplier_id {
        conditions.push(format!("po.supplier_id = ?{}", param_values.len() + 1));
        param_values.push(Box::new(sid));
    }
    if let Some(wid) = warehouse_id {
        conditions.push(format!("po.warehouse_id = ?{}", param_values.len() + 1));
        param_values.push(Box::new(wid));
    }
    if let Some(b) = buyer.filter(|s| !s.is_empty()) {
        conditions.push(format!("po.buyer LIKE ?{}", param_values.len() + 1));
        param_values.push(Box::new(format!("%{}%", b)));
    }
    if let Some(df) = date_from.filter(|s| !s.is_empty()) {
        conditions.push(format!("po.order_date >= ?{}", param_values.len() + 1));
        param_values.push(Box::new(df.to_string()));
    }
    if let Some(dt) = date_to.filter(|s| !s.is_empty()) {
        conditions.push(format!("po.order_date <= ?{}", param_values.len() + 1));
        param_values.push(Box::new(dt.to_string()));
    }

    let where_clause = if conditions.is_empty() {
        String::new()
    } else {
        format!("WHERE {}", conditions.join(" AND "))
    };
    (where_clause, param_values)
}

#[tauri::command]
pub fn get_purchase_orders(
    state: State<DbState>,
    search: Option<String>,
    status: Option<String>,
    supplier_id: Option<i64>,
    warehouse_id: Option<i64>,
    buyer: Option<String>,
    date_from: Option<String>,
    date_to: Option<String>,
) -> Result<Vec<PurchaseOrderResponse>, String> {
    let conn = get_conn(&state)?;
    let (where_clause, param_values) = build_purchase_order_filter(
        search.as_deref(), status.as_deref(), supplier_id, warehouse_id,
        buyer.as_deref(), date_from.as_deref(), date_to.as_deref(),
    );

    let sql = format!("{} {} ORDER BY po.created_at DESC", po_select_sql(), where_clause);
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let param_refs: Vec<&dyn rusqlite::types::ToSql> = param_values.iter().map(|p| p.as_ref()).collect();
    let rows = stmt.query_map(param_refs.as_slice(), map_po_row).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for row in rows { result.push(row.map_err(|e| e.to_string())?); }
    Ok(result)
}

#[tauri::command]
pub fn get_purchase_order(state: State<DbState>, id: i64) -> Result<PurchaseOrderResponse, String> {
    let conn = get_conn(&state)?;
    let sql = format!("{} WHERE po.id = ?1", po_select_sql());
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    stmt.query_row(params![id], map_po_row).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_purchase_order_items(state: State<DbState>, purchase_order_id: i64) -> Result<Vec<PurchaseOrderItemResponse>, String> {
    let conn = get_conn(&state)?;
    let mut stmt = conn.prepare(
        "SELECT poi.*, p.name as product_name, p.sku as product_sku
         FROM purchase_order_items poi
         LEFT JOIN products p ON poi.product_id = p.id
         WHERE poi.purchase_order_id = ?1
         ORDER BY poi.id"
    ).map_err(|e| e.to_string())?;
    let rows = stmt.query_map(params![purchase_order_id], |row| {
        Ok(PurchaseOrderItemResponse {
            id: row.get(0)?,
            purchase_order_id: row.get(1)?,
            product_id: row.get(2)?,
            product_name: row.get(3)?,
            product_sku: row.get(4)?,
            supplier_sku: row.get(5)?,
            quantity: row.get(6)?,
            unit_cost: row.get(7)?,
            discount: row.get(8)?,
            tax: row.get(9)?,
            total: row.get(10)?,
            received_quantity: row.get(11)?,
            damaged_quantity: row.get(12)?,
            created_at: row.get(13)?,
            updated_at: row.get(14)?,
        })
    }).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for row in rows { result.push(row.map_err(|e| e.to_string())?); }
    Ok(result)
}

fn get_po_by_id_inner(conn: &rusqlite::Connection, id: i64) -> Result<PurchaseOrderResponse, String> {
    let sql = format!("{} WHERE po.id = ?1", po_select_sql());
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    stmt.query_row(params![id], map_po_row).map_err(|e| e.to_string())
}

fn get_po_status_inner(conn: &rusqlite::Connection, id: i64) -> Result<String, String> {
    let status: String = conn.query_row(
        "SELECT status FROM purchase_orders WHERE id = ?1",
        params![id],
        |row| row.get(0),
    ).map_err(|e| e.to_string())?;
    Ok(status)
}

#[tauri::command]
pub fn create_purchase_order(state: State<DbState>, user_id: i64, input: PurchaseOrderInput) -> Result<PurchaseOrderResponse, String> {
    let conn = get_conn(&state)?;
    create_purchase_order_inner(&conn, user_id, input)
}

/// BUG-008. Holds the guard for the whole save - insert, line items, read-back.
///
/// It used to finish with `get_po_by_id(&state, po_id)`, which locks the
/// `std::sync::Mutex` a second time on a thread that already holds it. The
/// mutex is not reentrant, so the Tauri `invoke` never resolved: no error, no
/// log, the order just never showed up as saved.
fn create_purchase_order_inner(conn: &rusqlite::Connection, user_id: i64, input: PurchaseOrderInput) -> Result<PurchaseOrderResponse, String> {
    let po_number = generate_number(conn, "PO", "purchase_orders", "po_number")?;
    let subtotal: f64 = input.items.iter().map(|i| i.unit_cost * i.quantity as f64).sum();
    let total: f64 = input.items.iter().map(|i| i.total).sum();
    let tax_amount: f64 = input.items.iter().map(|i| i.tax).sum();
    let discount_amount: f64 = input.items.iter().map(|i| i.discount).sum();

    conn.execute(
        "INSERT INTO purchase_orders (po_number, supplier_id, user_id, warehouse_id, order_date, expected_delivery_date, currency, payment_terms, shipping_method, reference_number, buyer, subtotal, tax_rate, tax_amount, discount_amount, shipping_cost, total, status, notes) VALUES (?1, ?2, ?3, ?4, datetime('now'), ?5, 'BOB', ?6, ?7, ?8, ?9, ?10, 0, ?11, ?12, 0, ?13, 'draft', ?14)",
        params![po_number, input.supplier_id, user_id, input.warehouse_id, input.expected_delivery_date, input.payment_terms, input.shipping_method, input.reference_number, input.buyer, subtotal, tax_amount, discount_amount, total, input.notes],
    ).map_err(|e| e.to_string())?;

    let po_id = conn.last_insert_rowid();

    for item in &input.items {
        conn.execute(
            "INSERT INTO purchase_order_items (purchase_order_id, product_id, supplier_sku, quantity, unit_cost, discount, tax, total) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            params![po_id, item.product_id, item.supplier_sku, item.quantity, item.unit_cost, item.discount, item.tax, item.total],
        ).map_err(|e| e.to_string())?;
    }

    get_po_by_id_inner(conn, po_id)
}

/// BUG-008. `update_purchase_order` used to read the status through
/// `get_po_status(&state, id)` while already holding the lock, so it hung on
/// the very first statement instead of on the read-back.
#[tauri::command]
pub fn update_purchase_order(state: State<DbState>, id: i64, input: PurchaseOrderInput) -> Result<PurchaseOrderResponse, String> {
    let conn = get_conn(&state)?;
    update_purchase_order_inner(&conn, id, input)
}

fn update_purchase_order_inner(conn: &rusqlite::Connection, id: i64, input: PurchaseOrderInput) -> Result<PurchaseOrderResponse, String> {
    let current_status = get_po_status_inner(conn, id)?;
    if current_status != "draft" {
        return Err("Only draft purchase orders can be updated".to_string());
    }

    let subtotal: f64 = input.items.iter().map(|i| i.unit_cost * i.quantity as f64).sum();
    let total: f64 = input.items.iter().map(|i| i.total).sum();
    let tax_amount: f64 = input.items.iter().map(|i| i.tax).sum();
    let discount_amount: f64 = input.items.iter().map(|i| i.discount).sum();

    conn.execute(
        "UPDATE purchase_orders SET supplier_id=?1, warehouse_id=?2, expected_delivery_date=?3, payment_terms=?4, shipping_method=?5, reference_number=?6, buyer=?7, subtotal=?8, tax_amount=?9, discount_amount=?10, total=?11, notes=?12, updated_at=datetime('now') WHERE id=?13",
        params![input.supplier_id, input.warehouse_id, input.expected_delivery_date, input.payment_terms, input.shipping_method, input.reference_number, input.buyer, subtotal, tax_amount, discount_amount, total, input.notes, id],
    ).map_err(|e| e.to_string())?;

    conn.execute("DELETE FROM purchase_order_items WHERE purchase_order_id = ?1", params![id])
        .map_err(|e| e.to_string())?;

    for item in &input.items {
        conn.execute(
            "INSERT INTO purchase_order_items (purchase_order_id, product_id, supplier_sku, quantity, unit_cost, discount, tax, total) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            params![id, item.product_id, item.supplier_sku, item.quantity, item.unit_cost, item.discount, item.tax, item.total],
        ).map_err(|e| e.to_string())?;
    }

    get_po_by_id_inner(conn, id)
}

#[tauri::command]
pub fn update_purchase_order_status(state: State<DbState>, id: i64, status: String, user_id: i64) -> Result<PurchaseOrderResponse, String> {
    let conn = get_conn(&state)?;
    let current_status = get_po_status_inner(&conn, id)?;

    let valid_transition = match (current_status.as_str(), status.as_str()) {
        ("draft", "pending_approval") => true,
        ("pending_approval", "approved") => true,
        ("pending_approval", "sent") => true,
        ("pending_approval", "cancelled") => true,
        ("sent", "partially_received") => true,
        ("sent", "completed") => true,
        ("sent", "cancelled") => true,
        ("partially_received", "completed") => true,
        ("partially_received", "cancelled") => true,
        ("draft", "cancelled") => true,
        _ => false,
    };

    if !valid_transition {
        return Err(format!("Invalid status transition from '{}' to '{}'", current_status, status));
    }

    if status == "approved" {
        conn.execute(
            "UPDATE purchase_orders SET status=?1, approved_by=?2, approved_at=datetime('now'), updated_at=datetime('now') WHERE id=?3",
            params![status, user_id, id],
        ).map_err(|e| e.to_string())?;
    } else if status == "sent" {
        conn.execute(
            "UPDATE purchase_orders SET status=?1, sent_at=datetime('now'), updated_at=datetime('now') WHERE id=?2",
            params![status, id],
        ).map_err(|e| e.to_string())?;
    } else {
        conn.execute(
            "UPDATE purchase_orders SET status=?1, updated_at=datetime('now') WHERE id=?2",
            params![status, id],
        ).map_err(|e| e.to_string())?;
    }

    get_po_by_id_inner(&conn, id)
}

#[tauri::command]
pub fn delete_purchase_order(state: State<DbState>, id: i64) -> Result<(), String> {
    let conn = get_conn(&state)?;
    let current_status = get_po_status_inner(&conn, id)?;
    if current_status != "draft" {
        return Err("Only draft purchase orders can be deleted".to_string());
    }
    conn.execute("DELETE FROM purchase_orders WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

// ── Purchase Requests ──

fn map_pr_row(row: &rusqlite::Row) -> rusqlite::Result<PurchaseRequestResponse> {
    Ok(PurchaseRequestResponse {
        id: row.get(0)?,
        request_number: row.get(1)?,
        requested_by: row.get(2)?,
        requested_by_name: row.get(3)?,
        warehouse_id: row.get(4)?,
        warehouse_name: row.get(5)?,
        priority: row.get(6)?,
        status: row.get(7)?,
        reason: row.get(8)?,
        required_date: row.get(9)?,
        item_count: row.get(10)?,
        created_at: row.get(11)?,
        updated_at: row.get(12)?,
    })
}

fn pr_select_sql() -> &'static str {
    "SELECT pr.id, pr.request_number, pr.requested_by, u.full_name as requested_by_name,
            pr.warehouse_id, w.name as warehouse_name,
            pr.priority, pr.status, pr.reason, pr.required_date,
            (SELECT COUNT(*) FROM purchase_request_items WHERE request_id = pr.id) as item_count,
            pr.created_at, pr.updated_at
     FROM purchase_requests pr
     LEFT JOIN users u ON pr.requested_by = u.id
     LEFT JOIN warehouses w ON pr.warehouse_id = w.id"
}

#[tauri::command]
pub fn get_purchase_requests(state: State<DbState>, status: Option<String>) -> Result<Vec<PurchaseRequestResponse>, String> {
    let conn = get_conn(&state)?;
    let (sql, params_vec): (String, Vec<Box<dyn rusqlite::types::ToSql>>) = if let Some(ref s) = status {
        if s.is_empty() {
            (format!("{} ORDER BY pr.created_at DESC", pr_select_sql()), vec![])
        } else {
            (format!("{} WHERE pr.status = ?1 ORDER BY pr.created_at DESC", pr_select_sql()), vec![Box::new(s.clone())])
        }
    } else {
        (format!("{} ORDER BY pr.created_at DESC", pr_select_sql()), vec![])
    };
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let param_refs: Vec<&dyn rusqlite::types::ToSql> = params_vec.iter().map(|p| p.as_ref()).collect();
    let rows = stmt.query_map(param_refs.as_slice(), map_pr_row).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for row in rows { result.push(row.map_err(|e| e.to_string())?); }
    Ok(result)
}

#[tauri::command]
pub fn get_purchase_request(state: State<DbState>, id: i64) -> Result<PurchaseRequestResponse, String> {
    let conn = get_conn(&state)?;
    let sql = format!("{} WHERE pr.id = ?1", pr_select_sql());
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    stmt.query_row(params![id], map_pr_row).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_purchase_request_items(state: State<DbState>, request_id: i64) -> Result<Vec<PurchaseRequestItemResponse>, String> {
    let conn = get_conn(&state)?;
    let mut stmt = conn.prepare(
        "SELECT pri.*, p.name as product_name, p.sku as product_sku
         FROM purchase_request_items pri
         LEFT JOIN products p ON pri.product_id = p.id
         WHERE pri.request_id = ?1
         ORDER BY pri.id"
    ).map_err(|e| e.to_string())?;
    let rows = stmt.query_map(params![request_id], |row| {
        Ok(PurchaseRequestItemResponse {
            id: row.get(0)?,
            request_id: row.get(1)?,
            product_id: row.get(2)?,
            product_name: row.get(3)?,
            product_sku: row.get(4)?,
            requested_quantity: row.get(5)?,
            current_stock: row.get(6)?,
            min_stock_level: row.get(7)?,
            supplier_suggestion: row.get(8)?,
            created_at: row.get(9)?,
        })
    }).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for row in rows { result.push(row.map_err(|e| e.to_string())?); }
    Ok(result)
}

fn get_pr_status_inner(conn: &rusqlite::Connection, id: i64) -> Result<String, String> {
    conn.query_row(
        "SELECT status FROM purchase_requests WHERE id = ?1",
        params![id],
        |row| row.get(0),
    ).map_err(|e| e.to_string())
}

fn get_pr_by_id_inner(conn: &rusqlite::Connection, id: i64) -> Result<PurchaseRequestResponse, String> {
    let sql = format!("{} WHERE pr.id = ?1", pr_select_sql());
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    stmt.query_row(params![id], map_pr_row).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_purchase_request(
    state: State<DbState>,
    user_id: i64,
    warehouse_id: i64,
    priority: String,
    reason: String,
    required_date: Option<String>,
    items: Vec<PurchaseRequestItemInput>,
) -> Result<PurchaseRequestResponse, String> {
    let conn = get_conn(&state)?;
    let request_number = generate_number(&conn, "REQ", "purchase_requests", "request_number")?;

    conn.execute(
        "INSERT INTO purchase_requests (request_number, requested_by, warehouse_id, priority, reason, required_date) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![request_number, user_id, warehouse_id, priority, reason, required_date],
    ).map_err(|e| e.to_string())?;

    let request_id = conn.last_insert_rowid();

    for item in &items {
        let (current_stock, min_stock_level): (i64, i64) = conn.query_row(
            "SELECT stock_quantity, min_stock_level FROM products WHERE id = ?1",
            params![item.product_id],
            |row| Ok((row.get(0)?, row.get(1)?)),
        ).map_err(|e| e.to_string())?;

        conn.execute(
            "INSERT INTO purchase_request_items (request_id, product_id, requested_quantity, current_stock, min_stock_level) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![request_id, item.product_id, item.requested_quantity, current_stock, min_stock_level],
        ).map_err(|e| e.to_string())?;
    }

    get_pr_by_id_inner(&conn, request_id)
}

#[tauri::command]
pub fn update_purchase_request_status(state: State<DbState>, id: i64, status: String) -> Result<PurchaseRequestResponse, String> {
    let conn = get_conn(&state)?;
    let current_status = get_pr_status_inner(&conn, id)?;

    let valid_transition = match (current_status.as_str(), status.as_str()) {
        ("draft", "submitted") => true,
        ("submitted", "approved") => true,
        ("submitted", "rejected") => true,
        ("draft", "cancelled") => true,
        ("approved", "converted") => true,
        _ => false,
    };

    if !valid_transition {
        return Err(format!("Invalid status transition from '{}' to '{}'", current_status, status));
    }

    conn.execute(
        "UPDATE purchase_requests SET status=?1, updated_at=datetime('now') WHERE id=?2",
        params![status, id],
    ).map_err(|e| e.to_string())?;

    get_pr_by_id_inner(&conn, id)
}

// ── Receiving ──

fn map_receipt_row(row: &rusqlite::Row) -> rusqlite::Result<PurchaseReceiptResponse> {
    Ok(PurchaseReceiptResponse {
        id: row.get(0)?,
        receipt_number: row.get(1)?,
        purchase_order_id: row.get(2)?,
        po_number: row.get(3)?,
        received_by: row.get(4)?,
        received_by_name: row.get(5)?,
        warehouse_id: row.get(6)?,
        warehouse_name: row.get(7)?,
        notes: row.get(8)?,
        status: row.get(9)?,
        item_count: row.get(10)?,
        created_at: row.get(11)?,
        updated_at: row.get(12)?,
    })
}

fn receipt_select_sql() -> &'static str {
    "SELECT pr.id, pr.receipt_number, pr.purchase_order_id, po.po_number,
            pr.received_by, u.full_name as received_by_name,
            pr.warehouse_id, w.name as warehouse_name,
            pr.notes, pr.status,
            (SELECT COUNT(*) FROM purchase_receipt_items WHERE receipt_id = pr.id) as item_count,
            pr.created_at, pr.updated_at
     FROM purchase_receipts pr
     LEFT JOIN purchase_orders po ON pr.purchase_order_id = po.id
     LEFT JOIN users u ON pr.received_by = u.id
     LEFT JOIN warehouses w ON pr.warehouse_id = w.id"
}

#[tauri::command]
pub fn get_purchase_receipts(state: State<DbState>, purchase_order_id: Option<i64>) -> Result<Vec<PurchaseReceiptResponse>, String> {
    let conn = get_conn(&state)?;
    let (sql, params_vec): (String, Vec<Box<dyn rusqlite::types::ToSql>>) = if let Some(poi) = purchase_order_id {
        (format!("{} WHERE pr.purchase_order_id = ?1 ORDER BY pr.created_at DESC", receipt_select_sql()), vec![Box::new(poi)])
    } else {
        (format!("{} ORDER BY pr.created_at DESC", receipt_select_sql()), vec![])
    };
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let param_refs: Vec<&dyn rusqlite::types::ToSql> = params_vec.iter().map(|p| p.as_ref()).collect();
    let rows = stmt.query_map(param_refs.as_slice(), map_receipt_row).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for row in rows { result.push(row.map_err(|e| e.to_string())?); }
    Ok(result)
}

#[tauri::command]
pub fn get_purchase_receipt(state: State<DbState>, id: i64) -> Result<PurchaseReceiptResponse, String> {
    let conn = get_conn(&state)?;
    let sql = format!("{} WHERE pr.id = ?1", receipt_select_sql());
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    stmt.query_row(params![id], map_receipt_row).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_purchase_receipt_items(state: State<DbState>, receipt_id: i64) -> Result<Vec<PurchaseReceiptItemResponse>, String> {
    let conn = get_conn(&state)?;
    let mut stmt = conn.prepare(
        "SELECT pri.*, p.name as product_name, p.sku as product_sku
         FROM purchase_receipt_items pri
         LEFT JOIN products p ON pri.product_id = p.id
         WHERE pri.receipt_id = ?1
         ORDER BY pri.id"
    ).map_err(|e| e.to_string())?;
    let rows = stmt.query_map(params![receipt_id], |row| {
        Ok(PurchaseReceiptItemResponse {
            id: row.get(0)?,
            receipt_id: row.get(1)?,
            po_item_id: row.get(2)?,
            product_id: row.get(3)?,
            product_name: row.get(4)?,
            product_sku: row.get(5)?,
            expected_quantity: row.get(6)?,
            received_quantity: row.get(7)?,
            damaged_quantity: row.get(8)?,
            accepted_quantity: row.get(9)?,
            created_at: row.get(10)?,
        })
    }).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for row in rows { result.push(row.map_err(|e| e.to_string())?); }
    Ok(result)
}

fn get_receipt_by_id_inner(conn: &rusqlite::Connection, id: i64) -> Result<PurchaseReceiptResponse, String> {
    let sql = format!("{} WHERE pr.id = ?1", receipt_select_sql());
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    stmt.query_row(params![id], map_receipt_row).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn receive_purchase_order(
    state: State<DbState>,
    po_id: i64,
    user_id: i64,
    warehouse_id: i64,
    notes: Option<String>,
    items: Vec<ReceiveItemInput>,
) -> Result<PurchaseReceiptResponse, String> {
    let conn = get_conn(&state)?;

    let po_status: String = conn.query_row(
        "SELECT status FROM purchase_orders WHERE id = ?1",
        params![po_id],
        |row| row.get(0),
    ).map_err(|e| e.to_string())?;

    if po_status != "sent" && po_status != "partially_received" {
        return Err(format!("Cannot receive purchase order with status '{}'. Must be 'sent' or 'partially_received'", po_status));
    }

    for item in &items {
        let (ordered_qty, received_qty, damaged_qty): (i64, i64, i64) = conn.query_row(
            "SELECT quantity, received_quantity, damaged_quantity FROM purchase_order_items WHERE id = ?1",
            params![item.po_item_id],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
        ).map_err(|e| e.to_string())?;

        let remaining = ordered_qty - received_qty - damaged_qty;
        if item.received_quantity + item.damaged_quantity > remaining {
            return Err(format!(
                "Item {}: received+damaged ({}) exceeds remaining quantity ({})",
                item.product_id, item.received_quantity + item.damaged_quantity, remaining
            ));
        }
    }

    let receipt_number = generate_number(&conn, "REC", "purchase_receipts", "receipt_number")?;

    conn.execute(
        "INSERT INTO purchase_receipts (receipt_number, purchase_order_id, received_by, warehouse_id, notes, status) VALUES (?1, ?2, ?3, ?4, ?5, 'completed')",
        params![receipt_number, po_id, user_id, warehouse_id, notes],
    ).map_err(|e| e.to_string())?;

    let receipt_id = conn.last_insert_rowid();

    let mut all_received = true;

    for item in &items {
        let (ordered_qty, old_received_qty, old_damaged_qty): (i64, i64, i64) = conn.query_row(
            "SELECT quantity, received_quantity, damaged_quantity FROM purchase_order_items WHERE id = ?1",
            params![item.po_item_id],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
        ).map_err(|e| e.to_string())?;

        let expected = ordered_qty;
        let accepted = item.received_quantity - item.damaged_quantity;
        if accepted < 0 {
            return Err("Accepted quantity cannot be negative".to_string());
        }

        conn.execute(
            "INSERT INTO purchase_receipt_items (receipt_id, po_item_id, product_id, expected_quantity, received_quantity, damaged_quantity, accepted_quantity) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![receipt_id, item.po_item_id, item.product_id, expected, item.received_quantity, item.damaged_quantity, accepted],
        ).map_err(|e| e.to_string())?;

        let new_received = old_received_qty + item.received_quantity;
        let new_damaged = old_damaged_qty + item.damaged_quantity;
        conn.execute(
            "UPDATE purchase_order_items SET received_quantity=?1, damaged_quantity=?2, updated_at=datetime('now') WHERE id=?3",
            params![new_received, new_damaged, item.po_item_id],
        ).map_err(|e| e.to_string())?;

        if new_received + new_damaged < ordered_qty {
            all_received = false;
        }

        if accepted > 0 {
            conn.execute(
                "INSERT INTO inventory_movements (product_id, warehouse_id, quantity, type, reference_type, reference_id, notes, created_by) VALUES (?1, ?2, ?3, 'in', 'purchase_receipt', ?4, ?5, ?6)",
                params![item.product_id, warehouse_id, accepted, receipt_number, notes, user_id],
            ).map_err(|e| e.to_string())?;

            conn.execute(
                "UPDATE products SET stock_quantity = stock_quantity + ?1, updated_at = datetime('now') WHERE id = ?2",
                params![accepted, item.product_id],
            ).map_err(|e| e.to_string())?;
        }

        let current_cost: f64 = conn.query_row(
            "SELECT cost_price FROM products WHERE id = ?1",
            params![item.product_id],
            |row| row.get(0),
        ).map_err(|e| e.to_string())?;

        let item_unit_cost: f64 = conn.query_row(
            "SELECT unit_cost FROM purchase_order_items WHERE id = ?1",
            params![item.po_item_id],
            |row| row.get(0),
        ).map_err(|e| e.to_string())?;

        if (item_unit_cost - current_cost).abs() > 0.001 {
            conn.execute(
                "INSERT INTO product_cost_history (product_id, supplier_id, purchase_order_id, old_cost, new_cost, quantity, created_by) VALUES (?1, (SELECT supplier_id FROM purchase_orders WHERE id = ?2), ?3, ?4, ?5, ?6, ?7)",
                params![item.product_id, po_id, po_id, current_cost, item_unit_cost, accepted, user_id],
            ).map_err(|e| e.to_string())?;

            conn.execute(
                "UPDATE products SET cost_price = ?1, updated_at = datetime('now') WHERE id = ?2",
                params![item_unit_cost, item.product_id],
            ).map_err(|e| e.to_string())?;
        }
    }

    let new_po_status = if all_received { "completed" } else { "partially_received" };
    conn.execute(
        "UPDATE purchase_orders SET status=?1, updated_at=datetime('now') WHERE id=?2",
        params![new_po_status, po_id],
    ).map_err(|e| e.to_string())?;

    get_receipt_by_id_inner(&conn, receipt_id)
}

// ── Purchase Returns ──

fn map_return_row(row: &rusqlite::Row) -> rusqlite::Result<PurchaseReturnResponse> {
    Ok(PurchaseReturnResponse {
        id: row.get(0)?,
        return_number: row.get(1)?,
        purchase_order_id: row.get(2)?,
        po_number: row.get(3)?,
        supplier_id: row.get(4)?,
        supplier_name: row.get(5)?,
        reason: row.get(6)?,
        status: row.get(7)?,
        created_by: row.get(8)?,
        created_by_name: row.get(9)?,
        item_count: row.get(10)?,
        created_at: row.get(11)?,
        updated_at: row.get(12)?,
    })
}

fn return_select_sql() -> &'static str {
    "SELECT pr.id, pr.return_number, pr.purchase_order_id, po.po_number,
            pr.supplier_id, s.company_name as supplier_name,
            pr.reason, pr.status,
            pr.created_by, u.full_name as created_by_name,
            (SELECT COUNT(*) FROM purchase_return_items WHERE return_id = pr.id) as item_count,
            pr.created_at, pr.updated_at
     FROM purchase_returns pr
     LEFT JOIN purchase_orders po ON pr.purchase_order_id = po.id
     LEFT JOIN suppliers s ON pr.supplier_id = s.id
     LEFT JOIN users u ON pr.created_by = u.id"
}

#[tauri::command]
pub fn get_purchase_returns(state: State<DbState>, supplier_id: Option<i64>) -> Result<Vec<PurchaseReturnResponse>, String> {
    let conn = get_conn(&state)?;
    let (sql, params_vec): (String, Vec<Box<dyn rusqlite::types::ToSql>>) = if let Some(sid) = supplier_id {
        (format!("{} WHERE pr.supplier_id = ?1 ORDER BY pr.created_at DESC", return_select_sql()), vec![Box::new(sid)])
    } else {
        (format!("{} ORDER BY pr.created_at DESC", return_select_sql()), vec![])
    };
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let param_refs: Vec<&dyn rusqlite::types::ToSql> = params_vec.iter().map(|p| p.as_ref()).collect();
    let rows = stmt.query_map(param_refs.as_slice(), map_return_row).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for row in rows { result.push(row.map_err(|e| e.to_string())?); }
    Ok(result)
}

#[tauri::command]
pub fn get_purchase_return(state: State<DbState>, id: i64) -> Result<PurchaseReturnResponse, String> {
    let conn = get_conn(&state)?;
    let sql = format!("{} WHERE pr.id = ?1", return_select_sql());
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    stmt.query_row(params![id], map_return_row).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_purchase_return_items(state: State<DbState>, return_id: i64) -> Result<Vec<PurchaseReturnItemResponse>, String> {
    let conn = get_conn(&state)?;
    let mut stmt = conn.prepare(
        "SELECT pri.*, p.name as product_name, p.sku as product_sku
         FROM purchase_return_items pri
         LEFT JOIN products p ON pri.product_id = p.id
         WHERE pri.return_id = ?1
         ORDER BY pri.id"
    ).map_err(|e| e.to_string())?;
    let rows = stmt.query_map(params![return_id], |row| {
        Ok(PurchaseReturnItemResponse {
            id: row.get(0)?,
            return_id: row.get(1)?,
            product_id: row.get(2)?,
            product_name: row.get(3)?,
            product_sku: row.get(4)?,
            quantity: row.get(5)?,
            unit_cost: row.get(6)?,
            reason: row.get(7)?,
            created_at: row.get(8)?,
        })
    }).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for row in rows { result.push(row.map_err(|e| e.to_string())?); }
    Ok(result)
}

fn get_return_by_id_inner(conn: &rusqlite::Connection, id: i64) -> Result<PurchaseReturnResponse, String> {
    let sql = format!("{} WHERE pr.id = ?1", return_select_sql());
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    stmt.query_row(params![id], map_return_row).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_purchase_return(
    state: State<DbState>,
    po_id: Option<i64>,
    user_id: i64,
    supplier_id: i64,
    reason: String,
    items: Vec<PurchaseReturnItemInput>,
) -> Result<PurchaseReturnResponse, String> {
    let conn = get_conn(&state)?;
    let return_number = generate_number(&conn, "RET", "purchase_returns", "return_number")?;

    conn.execute(
        "INSERT INTO purchase_returns (return_number, purchase_order_id, supplier_id, reason, created_by) VALUES (?1, ?2, ?3, ?4, ?5)",
        params![return_number, po_id, supplier_id, reason, user_id],
    ).map_err(|e| e.to_string())?;

    let return_id = conn.last_insert_rowid();

    for item in &items {
        conn.execute(
            "INSERT INTO purchase_return_items (return_id, product_id, quantity, unit_cost, reason) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![return_id, item.product_id, item.quantity, item.unit_cost, item.reason],
        ).map_err(|e| e.to_string())?;

        conn.execute(
            "INSERT INTO inventory_movements (product_id, quantity, type, reference_type, reference_id, notes, created_by) VALUES (?1, ?2, 'out', 'purchase_return', ?3, ?4, ?5)",
            params![item.product_id, -item.quantity, return_number, reason, user_id],
        ).map_err(|e| e.to_string())?;

        conn.execute(
            "UPDATE products SET stock_quantity = stock_quantity - ?1, updated_at = datetime('now') WHERE id = ?2",
            params![item.quantity, item.product_id],
        ).map_err(|e| e.to_string())?;
    }

    get_return_by_id_inner(&conn, return_id)
}

// ── Supplier Catalog ──

fn map_sp_row(row: &rusqlite::Row) -> rusqlite::Result<SupplierProductResponse> {
    Ok(SupplierProductResponse {
        id: row.get(0)?,
        supplier_id: row.get(1)?,
        product_id: row.get(2)?,
        supplier_sku: row.get(3)?,
        is_preferred: row.get::<_, i64>(4)? != 0,
        minimum_order_quantity: row.get(5)?,
        lead_time_days: row.get(6)?,
        default_cost: row.get(7)?,
        currency: row.get(8)?,
        status: row.get(9)?,
        product_name: row.get(10)?,
        product_sku: row.get(11)?,
        brand_name: row.get(12)?,
        created_at: row.get(13)?,
        updated_at: row.get(14)?,
    })
}

#[tauri::command]
pub fn get_supplier_products(state: State<DbState>, supplier_id: Option<i64>, product_id: Option<i64>) -> Result<Vec<SupplierProductResponse>, String> {
    let conn = get_conn(&state)?;
    let mut conditions = Vec::new();
    let mut param_values: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();

    if let Some(sid) = supplier_id {
        conditions.push(format!("sp.supplier_id = ?{}", param_values.len() + 1));
        param_values.push(Box::new(sid));
    }
    if let Some(pid) = product_id {
        conditions.push(format!("sp.product_id = ?{}", param_values.len() + 1));
        param_values.push(Box::new(pid));
    }

    let where_clause = if conditions.is_empty() {
        String::new()
    } else {
        format!("WHERE {}", conditions.join(" AND "))
    };

    let sql = format!(
        "SELECT sp.*, p.name as product_name, p.sku as product_sku, b.name as brand_name
         FROM supplier_products sp
         LEFT JOIN products p ON sp.product_id = p.id
         LEFT JOIN brands b ON p.brand_id = b.id
         {} ORDER BY sp.supplier_id, sp.product_id",
        where_clause
    );

    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let param_refs: Vec<&dyn rusqlite::types::ToSql> = param_values.iter().map(|p| p.as_ref()).collect();
    let rows = stmt.query_map(param_refs.as_slice(), map_sp_row).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for row in rows { result.push(row.map_err(|e| e.to_string())?); }
    Ok(result)
}

fn get_sp_by_id(conn: &rusqlite::Connection, id: i64) -> Result<SupplierProductResponse, String> {
    let mut stmt = conn.prepare(
        "SELECT sp.*, p.name as product_name, p.sku as product_sku, b.name as brand_name
         FROM supplier_products sp
         LEFT JOIN products p ON sp.product_id = p.id
         LEFT JOIN brands b ON p.brand_id = b.id
         WHERE sp.id = ?1"
    ).map_err(|e| e.to_string())?;
    stmt.query_row(params![id], map_sp_row).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_supplier_product(state: State<DbState>, input: SupplierProductInput) -> Result<SupplierProductResponse, String> {
    let conn = get_conn(&state)?;
    let currency = input.currency.unwrap_or_else(|| "BOB".to_string());
    let status = input.status.unwrap_or_else(|| "active".to_string());
    conn.execute(
        "INSERT OR REPLACE INTO supplier_products (supplier_id, product_id, supplier_sku, is_preferred, minimum_order_quantity, lead_time_days, default_cost, currency, status, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, datetime('now'))",
        params![input.supplier_id, input.product_id, input.supplier_sku, input.is_preferred as i64, input.minimum_order_quantity, input.lead_time_days, input.default_cost, currency, status],
    ).map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();
    get_sp_by_id(&conn, id)
}

#[tauri::command]
pub fn update_supplier_product(state: State<DbState>, id: i64, input: SupplierProductInput) -> Result<SupplierProductResponse, String> {
    let conn = get_conn(&state)?;
    let currency = input.currency.unwrap_or_else(|| "BOB".to_string());
    let status = input.status.unwrap_or_else(|| "active".to_string());
    conn.execute(
        "UPDATE supplier_products SET supplier_id=?1, product_id=?2, supplier_sku=?3, is_preferred=?4, minimum_order_quantity=?5, lead_time_days=?6, default_cost=?7, currency=?8, status=?9, updated_at=datetime('now') WHERE id=?10",
        params![input.supplier_id, input.product_id, input.supplier_sku, input.is_preferred as i64, input.minimum_order_quantity, input.lead_time_days, input.default_cost, currency, status, id],
    ).map_err(|e| e.to_string())?;
    get_sp_by_id(&conn, id)
}

#[tauri::command]
pub fn delete_supplier_product(state: State<DbState>, id: i64) -> Result<(), String> {
    let conn = get_conn(&state)?;
    conn.execute("DELETE FROM supplier_products WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

// ── Cost History ──

#[tauri::command]
pub fn get_cost_history(state: State<DbState>, product_id: Option<i64>, supplier_id: Option<i64>) -> Result<Vec<CostHistoryResponse>, String> {
    let conn = get_conn(&state)?;
    let mut conditions = Vec::new();
    let mut param_values: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();

    if let Some(pid) = product_id {
        conditions.push(format!("ch.product_id = ?{}", param_values.len() + 1));
        param_values.push(Box::new(pid));
    }
    if let Some(sid) = supplier_id {
        conditions.push(format!("ch.supplier_id = ?{}", param_values.len() + 1));
        param_values.push(Box::new(sid));
    }

    let where_clause = if conditions.is_empty() {
        String::new()
    } else {
        format!("WHERE {}", conditions.join(" AND "))
    };

    let sql = format!(
        "SELECT ch.*, p.name as product_name, p.sku as product_sku,
                s.company_name as supplier_name, po.po_number,
                u.full_name as created_by_name
         FROM product_cost_history ch
         LEFT JOIN products p ON ch.product_id = p.id
         LEFT JOIN suppliers s ON ch.supplier_id = s.id
         LEFT JOIN purchase_orders po ON ch.purchase_order_id = po.id
         LEFT JOIN users u ON ch.created_by = u.id
         {} ORDER BY ch.created_at DESC",
        where_clause
    );

    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let param_refs: Vec<&dyn rusqlite::types::ToSql> = param_values.iter().map(|p| p.as_ref()).collect();
    let rows = stmt.query_map(param_refs.as_slice(), |row| {
        Ok(CostHistoryResponse {
            id: row.get(0)?,
            product_id: row.get(1)?,
            product_name: row.get(2)?,
            product_sku: row.get(3)?,
            supplier_id: row.get(4)?,
            supplier_name: row.get(5)?,
            purchase_order_id: row.get(6)?,
            po_number: row.get(7)?,
            old_cost: row.get(8)?,
            new_cost: row.get(9)?,
            quantity: row.get(10)?,
            created_by: row.get(11)?,
            created_by_name: row.get(12)?,
            created_at: row.get(13)?,
        })
    }).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for row in rows { result.push(row.map_err(|e| e.to_string())?); }
    Ok(result)
}

// ── Dashboard & Analytics ──

#[tauri::command]
pub fn get_purchase_dashboard(state: State<DbState>) -> Result<PurchaseDashboard, String> {
    let conn = get_conn(&state)?;

    let pending_orders: i64 = conn.query_row(
        "SELECT COUNT(*) FROM purchase_orders WHERE status IN ('draft', 'pending_approval')",
        [], |row| row.get(0),
    ).map_err(|e| e.to_string())?;

    let awaiting_approval: i64 = conn.query_row(
        "SELECT COUNT(*) FROM purchase_orders WHERE status = 'pending_approval'",
        [], |row| row.get(0),
    ).map_err(|e| e.to_string())?;

    let awaiting_delivery: i64 = conn.query_row(
        "SELECT COUNT(*) FROM purchase_orders WHERE status = 'sent'",
        [], |row| row.get(0),
    ).map_err(|e| e.to_string())?;

    let today_receipts: i64 = conn.query_row(
        "SELECT COUNT(*) FROM purchase_receipts WHERE date(created_at) = date('now')",
        [], |row| row.get(0),
    ).map_err(|e| e.to_string())?;

    let monthly_purchased: f64 = conn.query_row(
        "SELECT COALESCE(SUM(total), 0) FROM purchase_orders WHERE created_at >= datetime('now', '-30 days') AND status IN ('completed', 'partially_received', 'sent')",
        [], |row| row.get(0),
    ).map_err(|e| e.to_string())?;

    let monthly_order_count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM purchase_orders WHERE created_at >= datetime('now', '-30 days')",
        [], |row| row.get(0),
    ).map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare(&format!("{} ORDER BY po.created_at DESC LIMIT 5", po_select_sql()))
        .map_err(|e| e.to_string())?;
    let recent_orders: Vec<PurchaseOrderResponse> = stmt.query_map([], map_po_row)
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    let reorder_suggestions = get_reorder_suggestions_internal(&conn)?;
    let supplier_performances = get_supplier_performance_internal(&conn, None)?;

    let top_suppliers: Vec<(String, f64)> = {
        let mut stmt = conn.prepare(
            "SELECT s.company_name, COALESCE(SUM(po.total), 0) as total_spent
             FROM purchase_orders po
             JOIN suppliers s ON po.supplier_id = s.id
             WHERE po.status IN ('completed', 'partially_received', 'sent')
             GROUP BY po.supplier_id
             ORDER BY total_spent DESC
             LIMIT 5"
        ).map_err(|e| e.to_string())?;
        let result: Vec<(String, f64)> = stmt.query_map([], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, f64>(1)?))
        }).map_err(|e| e.to_string())?
            .filter_map(|r| r.ok())
            .collect();
        result
    };

    Ok(PurchaseDashboard {
        pending_orders,
        awaiting_approval,
        awaiting_delivery,
        today_receipts,
        monthly_purchased,
        monthly_order_count,
        recent_orders,
        reorder_suggestions,
        supplier_performances,
        top_suppliers,
    })
}

fn get_reorder_suggestions_internal(conn: &rusqlite::Connection) -> Result<Vec<ReorderSuggestion>, String> {
    let mut stmt = conn.prepare(
        "SELECT p.id, p.name, p.sku, p.stock_quantity, p.min_stock_level,
                p.reorder_point, p.max_stock_level, p.sale_price, p.cost_price,
                COALESCE((SELECT SUM(poi.quantity - poi.received_quantity - poi.damaged_quantity)
                  FROM purchase_order_items poi
                  JOIN purchase_orders po ON poi.purchase_order_id = po.id
                  WHERE poi.product_id = p.id AND po.status IN ('sent', 'partially_received')), 0) as pending_po,
                0 as reserved_quantity,
                sp.supplier_id as preferred_supplier_id,
                s.company_name as preferred_supplier_name
         FROM products p
         LEFT JOIN supplier_products sp ON p.id = sp.product_id AND sp.is_preferred = 1
         LEFT JOIN suppliers s ON sp.supplier_id = s.id
         WHERE p.is_active = 1 AND p.stock_quantity <= p.reorder_point
         ORDER BY (p.reorder_point - p.stock_quantity) DESC"
    ).map_err(|e| e.to_string())?;

    let rows = stmt.query_map([], |row| {
        let current_stock: i64 = row.get(3)?;
        let reorder_point: i64 = row.get(5)?;
        let max_stock: i64 = row.get(6)?;
        let pending_po: i64 = row.get(9)?;
        let suggested = (max_stock - current_stock + pending_po).max(1);

        Ok(ReorderSuggestion {
            product_id: row.get(0)?,
            product_name: row.get(1)?,
            product_sku: row.get(2)?,
            current_stock,
            min_stock_level: row.get(4)?,
            reorder_point,
            max_stock_level: max_stock,
            sale_price: row.get(7)?,
            cost_price: row.get(8)?,
            pending_po_quantity: pending_po,
            reserved_quantity: row.get(10)?,
            suggested_order: suggested,
            preferred_supplier_id: row.get(11)?,
            preferred_supplier_name: row.get(12)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut result = Vec::new();
    for row in rows { result.push(row.map_err(|e| e.to_string())?); }
    Ok(result)
}

fn get_supplier_performance_internal(conn: &rusqlite::Connection, supplier_id: Option<i64>) -> Result<Vec<SupplierPerformance>, String> {
    let where_clause = if let Some(sid) = supplier_id {
        format!("WHERE po.supplier_id = {}", sid)
    } else {
        String::new()
    };

    let sql = format!(
        "SELECT s.id, s.company_name,
                COUNT(*) as total_orders,
                SUM(CASE WHEN po.status IN ('completed', 'partially_received') THEN 1 ELSE 0 END) as completed_orders,
                SUM(CASE WHEN po.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders,
                AVG(CASE WHEN po.sent_at IS NOT NULL AND po.approved_at IS NOT NULL
                    THEN (julianday(po.sent_at) - julianday(po.approved_at)) END) as avg_delivery_days,
                COALESCE(SUM(po.total), 0) as total_purchased,
                COALESCE(AVG(poi.unit_cost), 0) as avg_cost,
                COALESCE(
                    (SELECT COUNT(*) FROM purchase_returns WHERE supplier_id = s.id) * 1.0 /
                    NULLIF(COUNT(*), 0), 0
                ) as return_rate,
                (SELECT COUNT(*) FROM purchase_orders po2
                 WHERE po2.supplier_id = s.id AND po2.sent_at IS NOT NULL
                 AND po2.expected_delivery_date IS NOT NULL
                 AND date(po2.sent_at) > date(po2.expected_delivery_date)) as late_deliveries,
                0 as preferred_score
         FROM suppliers s
         LEFT JOIN purchase_orders po ON s.id = po.supplier_id
         LEFT JOIN purchase_order_items poi ON po.id = poi.purchase_order_id
         {}
         GROUP BY s.id, s.company_name
         HAVING total_orders > 0
         ORDER BY total_purchased DESC",
        where_clause
    );

    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let params_vec: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();
    let param_refs: Vec<&dyn rusqlite::types::ToSql> = params_vec.iter().map(|p| p.as_ref()).collect();
    let rows = stmt.query_map(param_refs.as_slice(), |row| {
        Ok(SupplierPerformance {
            supplier_id: row.get(0)?,
            supplier_name: row.get(1)?,
            total_orders: row.get(2)?,
            completed_orders: row.get(3)?,
            cancelled_orders: row.get(4)?,
            avg_delivery_days: row.get(5)?,
            total_purchased: row.get(6)?,
            avg_cost: row.get(7)?,
            return_rate: row.get(8)?,
            late_deliveries: row.get(9)?,
            preferred_score: row.get(10)?,
        })
    }).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for row in rows { result.push(row.map_err(|e| e.to_string())?); }
    Ok(result)
}

#[tauri::command]
pub fn get_reorder_suggestions(state: State<DbState>) -> Result<Vec<ReorderSuggestion>, String> {
    let conn = get_conn(&state)?;
    get_reorder_suggestions_internal(&conn)
}

#[tauri::command]
pub fn get_supplier_performance(state: State<DbState>, supplier_id: Option<i64>) -> Result<Vec<SupplierPerformance>, String> {
    let conn = get_conn(&state)?;
    get_supplier_performance_internal(&conn, supplier_id)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::config::PROFILE_SINGLE_STORE;
    use crate::db::init_database_with_profile;

    fn test_db() -> rusqlite::Connection {
        let dir = std::env::temp_dir().join(format!("ig_purchases_test_{}", uuid::Uuid::new_v4()));
        std::fs::create_dir_all(&dir).expect("create temp dir");
        let path = dir.join("purchases.db");
        init_database_with_profile(path.to_str().unwrap(), PROFILE_SINGLE_STORE).expect("init db")
    }

    /// Minimal fixtures: `user_id` and `product_id` are both foreign keys.
    fn seed(conn: &rusqlite::Connection) -> (i64, i64) {
        conn.execute(
            "INSERT INTO users (username, email, password_hash, full_name) VALUES ('buyer', 'buyer@test.com', 'hash', 'Buyer')",
            [],
        )
        .expect("insert user");
        let user_id = conn.last_insert_rowid();
        conn.execute(
            "INSERT INTO products (name, sku, cost_price, sale_price) VALUES ('Widget', 'PO-TEST-1', 10.0, 20.0)",
            [],
        )
        .expect("insert product");
        (user_id, conn.last_insert_rowid())
    }

    fn order_input(product_id: i64) -> PurchaseOrderInput {
        PurchaseOrderInput {
            supplier_id: None,
            warehouse_id: None,
            payment_terms: None,
            shipping_method: None,
            reference_number: None,
            buyer: None,
            notes: None,
            expected_delivery_date: None,
            items: vec![
                PurchaseOrderItemInput {
                    product_id,
                    supplier_sku: Some("SKU-A".to_string()),
                    quantity: 3,
                    unit_cost: 10.0,
                    discount: 0.0,
                    tax: 0.0,
                    total: 30.0,
                },
                PurchaseOrderItemInput {
                    product_id,
                    supplier_sku: None,
                    quantity: 2,
                    unit_cost: 25.0,
                    discount: 5.0,
                    tax: 3.0,
                    total: 50.0,
                },
            ],
        }
    }

    /// BUG-008: saving a purchase order never persisted anything.
    ///
    /// The command read the order back with a helper that locked the same
    /// non-reentrant mutex again, so `invoke` hung forever and the UI showed no
    /// error and no saved order. The lock itself is not observable from here -
    /// `create_purchase_order` needs a `tauri::State` - so the save is driven
    /// through `create_purchase_order_inner`, which holds the single guard the
    /// command hands it, and asserted end to end on the database.
    #[test]
    fn created_purchase_order_is_persisted_with_its_items() {
        let db = test_db();
        let (user_id, product_id) = seed(&db);

        let created = create_purchase_order_inner(&db, user_id, order_input(product_id))
            .expect("saving a purchase order must succeed");

        assert!(created.id > 0, "the order must get a real id");
        assert_eq!(created.status, "draft", "a new order starts as a draft");
        assert_eq!(created.item_count, Some(2), "both line items must be stored");
        assert_eq!(created.subtotal, 80.0, "3*10 + 2*25");
        assert_eq!(created.discount_amount, 5.0);
        assert_eq!(created.tax_amount, 3.0);
        assert_eq!(created.total, 80.0);

        // Re-read from a fresh statement: the row must really be committed data,
        // not just the response the command built.
        let reread = get_po_by_id_inner(&db, created.id).expect("saved order must be readable");
        assert_eq!(reread.id, created.id);
        assert_eq!(reread.po_number, created.po_number);
        assert_eq!(reread.item_count, Some(2));

        let stored: i64 = db
            .query_row(
                "SELECT COUNT(*) FROM purchase_order_items WHERE purchase_order_id = ?1",
                params![created.id],
                |r| r.get(0),
            )
            .expect("count line items");
        assert_eq!(stored, 2, "line items must be rows, not just a counter");
    }

    /// A second save must not collide on the generated `po_number`.
    #[test]
    fn po_numbers_are_unique_across_saves() {
        let db = test_db();
        let (user_id, product_id) = seed(&db);

        let first = create_purchase_order_inner(&db, user_id, order_input(product_id)).unwrap();
        let second = create_purchase_order_inner(&db, user_id, order_input(product_id)).unwrap();

        assert_ne!(first.po_number, second.po_number, "po_number must advance");
        assert_ne!(first.id, second.id);
    }

    /// Editing a draft must replace the line items, not append to them.
    #[test]
    fn updating_a_draft_replaces_its_line_items() {
        let db = test_db();
        let (user_id, product_id) = seed(&db);
        let created = create_purchase_order_inner(&db, user_id, order_input(product_id)).unwrap();

        let mut input = order_input(product_id);
        input.items.truncate(1);
        input.items[0].quantity = 10;
        input.items[0].unit_cost = 10.0;
        input.items[0].total = 100.0;

        let updated = update_purchase_order_inner(&db, created.id, input).expect("draft must be editable");

        assert_eq!(updated.id, created.id, "an update keeps the same order");
        assert_eq!(updated.item_count, Some(1), "stale line items must be deleted");
        assert_eq!(updated.subtotal, 100.0);
        assert_eq!(updated.total, 100.0);
    }

    /// Only drafts may be edited; anything else is refused before touching data.
    #[test]
    fn a_non_draft_order_cannot_be_edited() {
        let db = test_db();
        let (user_id, product_id) = seed(&db);
        let created = create_purchase_order_inner(&db, user_id, order_input(product_id)).unwrap();
        db.execute(
            "UPDATE purchase_orders SET status = 'approved' WHERE id = ?1",
            params![created.id],
        )
        .unwrap();

        let err = update_purchase_order_inner(&db, created.id, order_input(product_id))
            .expect_err("an approved order must not be editable");
        assert!(err.contains("draft"), "unexpected error: {err}");
    }
}
