use serde::{Deserialize, Serialize};
use crate::DB_STATE;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PurchaseReportRow {
    pub period: String,
    pub order_count: i64,
    pub total: f64,
    pub item_count: i64,
    pub avg_order_value: f64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PurchaseBySupplier {
    pub supplier_id: i64,
    pub supplier_name: String,
    pub order_count: i64,
    pub total: f64,
    pub avg_cost: f64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SupplierPerformance {
    pub supplier_id: i64,
    pub supplier_name: String,
    pub order_count: i64,
    pub completed_count: i64,
    pub on_time_delivery: f64,
    pub avg_lead_time_days: f64,
    pub return_rate: f64,
    pub total_spent: f64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct POStatusSummary {
    pub status: String,
    pub count: i64,
    pub total: f64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProductToReorder {
    pub product_id: i64,
    pub product_name: String,
    pub sku: String,
    pub stock_quantity: i64,
    pub reorder_point: i64,
    pub preferred_supplier: Option<String>,
    pub last_cost: f64,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PurchaseReportFilter {
    pub date_from: Option<String>,
    pub date_to: Option<String>,
    pub supplier_id: Option<i64>,
    pub status: Option<String>,
}

#[tauri::command]
pub fn get_purchases_by_month(f: PurchaseReportFilter) -> Result<Vec<PurchaseReportRow>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut wheres = vec!["po.status != 'cancelled'".to_string()];
    if let Some(ref d) = f.date_from { wheres.push(format!("date(po.created_at) >= date('{}')", d)); }
    if let Some(ref d) = f.date_to { wheres.push(format!("date(po.created_at) <= date('{}')", d)); }
    if let Some(s) = f.supplier_id { wheres.push(format!("po.supplier_id = {}", s)); }
    if let Some(ref s) = f.status { wheres.push(format!("po.status = '{}'", s)); }
    let where_clause = if wheres.is_empty() { String::new() } else { format!("WHERE {}", wheres.join(" AND ")) };

    let sql = format!("SELECT strftime('%Y-%m', po.created_at) AS period, COUNT(*) AS cnt, COALESCE(SUM(po.total), 0) AS total, COALESCE(SUM(poi.quantity), 0) AS items, COALESCE(ROUND(AVG(po.total), 2), 0) AS avg_val FROM purchase_orders po LEFT JOIN purchase_order_items poi ON poi.purchase_order_id = po.id {} GROUP BY period ORDER BY period ASC", where_clause);
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(PurchaseReportRow { period: row.get(0)?, order_count: row.get(1)?, total: row.get(2)?, item_count: row.get(3)?, avg_order_value: row.get(4)? })
    }).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for row in rows { result.push(row.map_err(|e| e.to_string())?); }
    Ok(result)
}

#[tauri::command]
pub fn get_purchases_by_supplier(f: PurchaseReportFilter) -> Result<Vec<PurchaseBySupplier>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut wheres = vec!["po.status != 'cancelled'".to_string()];
    if let Some(ref d) = f.date_from { wheres.push(format!("date(po.created_at) >= date('{}')", d)); }
    if let Some(ref d) = f.date_to { wheres.push(format!("date(po.created_at) <= date('{}')", d)); }
    let where_clause = if wheres.is_empty() { String::new() } else { format!("WHERE {}", wheres.join(" AND ")) };
    let sql = format!("SELECT s.id, s.company_name, COUNT(*) AS cnt, COALESCE(SUM(po.total), 0) AS total, COALESCE(ROUND(AVG(poi.unit_cost), 2), 0) AS avg_cost FROM purchase_orders po JOIN suppliers s ON s.id = po.supplier_id LEFT JOIN purchase_order_items poi ON poi.purchase_order_id = po.id {} GROUP BY s.id ORDER BY total DESC", where_clause);
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(PurchaseBySupplier { supplier_id: row.get(0)?, supplier_name: row.get(1)?, order_count: row.get(2)?, total: row.get(3)?, avg_cost: row.get(4)? })
    }).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for row in rows { result.push(row.map_err(|e| e.to_string())?); }
    Ok(result)
}

#[tauri::command]
pub fn get_supplier_performance_report() -> Result<Vec<SupplierPerformance>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT s.id, s.company_name, COUNT(po.id) AS total_orders, SUM(CASE WHEN po.status = 'completed' THEN 1 ELSE 0 END) AS completed, COALESCE(ROUND(AVG(CASE WHEN julianday(COALESCE(pr.created_at, po.expected_delivery_date)) - julianday(po.order_date) <= 7 THEN 100.0 ELSE 0.0 END), 1), 0) AS on_time, COALESCE(ROUND(AVG(julianday(COALESCE(pr.created_at, po.expected_delivery_date)) - julianday(po.order_date)), 1), 0) AS lead_time, COALESCE(ROUND(CAST(SUM(CASE WHEN prr.id IS NOT NULL THEN 1 ELSE 0 END) AS REAL) / CASE WHEN COUNT(po.id) = 0 THEN 1 ELSE COUNT(po.id) END * 100, 1), 0) AS return_rate, COALESCE(SUM(po.total), 0) AS total_spent FROM suppliers s LEFT JOIN purchase_orders po ON po.supplier_id = s.id AND po.status != 'cancelled' LEFT JOIN purchase_receipts pr ON pr.purchase_order_id = po.id LEFT JOIN purchase_returns prr ON prr.purchase_order_id = po.id GROUP BY s.id ORDER BY total_spent DESC").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(SupplierPerformance { supplier_id: row.get(0)?, supplier_name: row.get(1)?, order_count: row.get(2)?, completed_count: row.get(3)?, on_time_delivery: row.get(4)?, avg_lead_time_days: row.get(5)?, return_rate: row.get(6)?, total_spent: row.get(7)? })
    }).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for row in rows { result.push(row.map_err(|e| e.to_string())?); }
    Ok(result)
}

#[tauri::command]
pub fn get_po_status_summary() -> Result<Vec<POStatusSummary>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT po.status, COUNT(*) AS cnt, COALESCE(SUM(po.total), 0) AS total FROM purchase_orders po GROUP BY po.status ORDER BY cnt DESC").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(POStatusSummary { status: row.get(0)?, count: row.get(1)?, total: row.get(2)? })
    }).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for row in rows { result.push(row.map_err(|e| e.to_string())?); }
    Ok(result)
}

#[tauri::command]
pub fn get_products_to_reorder() -> Result<Vec<ProductToReorder>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT p.id, p.name, p.sku, p.stock_quantity, p.reorder_point, sp.company_name, COALESCE((SELECT unit_cost FROM purchase_order_items WHERE product_id = p.id ORDER BY id DESC LIMIT 1), p.cost_price) AS last_cost FROM products p LEFT JOIN supplier_products sup ON sup.product_id = p.id AND sup.is_preferred = 1 LEFT JOIN suppliers sp ON sp.id = sup.supplier_id WHERE p.is_active = 1 AND p.stock_quantity <= p.reorder_point AND p.reorder_point > 0 ORDER BY (p.reorder_point - p.stock_quantity) DESC").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(ProductToReorder { product_id: row.get(0)?, product_name: row.get(1)?, sku: row.get(2)?, stock_quantity: row.get(3)?, reorder_point: row.get(4)?, preferred_supplier: row.get(5)?, last_cost: row.get(6)? })
    }).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for row in rows { result.push(row.map_err(|e| e.to_string())?); }
    Ok(result)
}

#[tauri::command]
pub fn get_purchase_cost_history(product_id: Option<i64>) -> Result<Vec<super::manage::CostHistoryEntry>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let pid_ref;
    let (where_clause, param_refs): (String, Vec<&dyn rusqlite::types::ToSql>) = if let Some(pid) = product_id {
        pid_ref = pid;
        (format!("WHERE pch.product_id = ?1"), vec![&pid_ref as &dyn rusqlite::types::ToSql])
    } else {
        (String::new(), vec![])
    };
    let sql = format!("SELECT pch.id, p.id AS product_id, p.name AS product_name, p.sku, pch.supplier_id, s.company_name AS supplier_name, pch.old_cost, pch.new_cost, pch.quantity, u.full_name AS created_by_name, pch.created_at FROM product_cost_history pch JOIN products p ON p.id = pch.product_id LEFT JOIN suppliers s ON s.id = pch.supplier_id LEFT JOIN users u ON u.id = pch.created_by {} ORDER BY pch.created_at DESC LIMIT 100", where_clause);
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let rows = stmt.query_map(param_refs.as_slice(), |row| {
        Ok(super::manage::CostHistoryEntry { id: row.get(0)?, product_id: row.get(1)?, product_name: row.get(2)?, product_sku: row.get(3)?, supplier_id: row.get(4)?, supplier_name: row.get(5)?, old_cost: row.get(6)?, new_cost: row.get(7)?, quantity: row.get(8)?, created_by_name: row.get(9)?, created_at: row.get(10)? })
    }).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for row in rows { result.push(row.map_err(|e| e.to_string())?); }
    Ok(result)
}
