use serde::Serialize;
use crate::DB_STATE;

#[derive(Debug, Serialize)]
pub struct SupplierRanking {
    pub supplier_id: i64,
    pub supplier_name: String,
    pub total_purchases: f64,
    pub order_count: i64,
    pub avg_cost: f64,
    pub on_time_rate: f64,
    pub return_rate: f64,
    pub avg_lead_time: f64,
    pub score: f64,
}

#[derive(Debug, Serialize)]
pub struct LeadTimeAnalysis {
    pub supplier_id: i64,
    pub supplier_name: String,
    pub min_lead_time: f64,
    pub max_lead_time: f64,
    pub avg_lead_time: f64,
    pub order_count: i64,
}

#[tauri::command]
pub fn get_supplier_ranking() -> Result<Vec<SupplierRanking>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT s.id, s.company_name, COALESCE(SUM(po.total), 0) AS total, COUNT(DISTINCT po.id) AS cnt, COALESCE(ROUND(AVG(poi.unit_cost), 2), 0) AS avg_cost, COALESCE(ROUND(AVG(CASE WHEN julianday(COALESCE(pr.created_at, po.expected_delivery_date)) - julianday(po.order_date) <= 7 THEN 100.0 ELSE 0.0 END), 1), 0) AS on_time, COALESCE(ROUND(CAST(COUNT(DISTINCT prr.id) AS REAL) / CASE WHEN COUNT(DISTINCT po.id) = 0 THEN 1 ELSE COUNT(DISTINCT po.id) END * 100, 1), 0) AS ret_rate, COALESCE(ROUND(AVG(julianday(COALESCE(pr.created_at, po.expected_delivery_date)) - julianday(po.order_date)), 1), 0) AS lead_time, COALESCE(ROUND((SUM(po.total) * 0.4 + AVG(CASE WHEN julianday(COALESCE(pr.created_at, po.expected_delivery_date)) - julianday(po.order_date) <= 7 THEN 100.0 ELSE 0.0 END) * 0.3 + (100 - CAST(COUNT(DISTINCT prr.id) AS REAL) / CASE WHEN COUNT(DISTINCT po.id) = 0 THEN 1 ELSE COUNT(DISTINCT po.id) END * 100) * 0.3), 1), 0) AS score FROM suppliers s LEFT JOIN purchase_orders po ON po.supplier_id = s.id AND po.status != 'cancelled' LEFT JOIN purchase_order_items poi ON poi.purchase_order_id = po.id LEFT JOIN purchase_receipts pr ON pr.purchase_order_id = po.id LEFT JOIN purchase_returns prr ON prr.purchase_order_id = po.id GROUP BY s.id ORDER BY score DESC").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(SupplierRanking { supplier_id: row.get(0)?, supplier_name: row.get(1)?, total_purchases: row.get(2)?, order_count: row.get(3)?, avg_cost: row.get(4)?, on_time_rate: row.get(5)?, return_rate: row.get(6)?, avg_lead_time: row.get(7)?, score: row.get(8)? })
    }).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for row in rows { result.push(row.map_err(|e| e.to_string())?); }
    Ok(result)
}

#[tauri::command]
pub fn get_lead_time_analysis() -> Result<Vec<LeadTimeAnalysis>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT s.id, s.company_name, COALESCE(MIN(julianday(COALESCE(pr.created_at, po.expected_delivery_date)) - julianday(po.order_date)), 0) AS min_lt, COALESCE(MAX(julianday(COALESCE(pr.created_at, po.expected_delivery_date)) - julianday(po.order_date)), 0) AS max_lt, COALESCE(ROUND(AVG(julianday(COALESCE(pr.created_at, po.expected_delivery_date)) - julianday(po.order_date)), 1), 0) AS avg_lt, COUNT(DISTINCT po.id) AS cnt FROM suppliers s LEFT JOIN purchase_orders po ON po.supplier_id = s.id AND po.status = 'completed' LEFT JOIN purchase_receipts pr ON pr.purchase_order_id = po.id GROUP BY s.id HAVING cnt > 0 ORDER BY avg_lt ASC").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(LeadTimeAnalysis { supplier_id: row.get(0)?, supplier_name: row.get(1)?, min_lead_time: row.get(2)?, max_lead_time: row.get(3)?, avg_lead_time: row.get(4)?, order_count: row.get(5)? })
    }).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for row in rows { result.push(row.map_err(|e| e.to_string())?); }
    Ok(result)
}
