use serde::Serialize;
use crate::DB_STATE;

#[derive(Debug, Serialize)]
pub struct ProfitSummary {
    pub gross_revenue: f64,
    pub estimated_cost: f64,
    pub gross_profit: f64,
    pub margin_pct: f64,
    pub period: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct ProfitByEntity {
    pub entity_id: i64,
    pub entity_name: String,
    pub revenue: f64,
    pub cost: f64,
    pub profit: f64,
    pub margin: f64,
    pub quantity: i64,
}

#[tauri::command]
pub fn get_profit_summary(months: i64) -> Result<Vec<ProfitSummary>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare(&format!("SELECT strftime('%Y-%m', s.created_at) AS period, COALESCE(SUM(s.total), 0) AS revenue, COALESCE(SUM(p.cost_price * si.quantity), 0) AS cost, COALESCE(SUM(s.total), 0) - COALESCE(SUM(p.cost_price * si.quantity), 0) AS profit, CASE WHEN SUM(s.total) > 0 THEN ROUND((SUM(s.total) - SUM(p.cost_price * si.quantity)) / SUM(s.total) * 100, 1) ELSE 0 END AS margin FROM sales s JOIN sale_items si ON si.sale_id = s.id JOIN products p ON p.id = si.product_id WHERE s.created_at >= date('now', '-{} months') GROUP BY period ORDER BY period ASC", months)).map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(ProfitSummary { period: row.get(0)?, gross_revenue: row.get(1)?, estimated_cost: row.get(2)?, gross_profit: row.get(3)?, margin_pct: row.get(4)? })
    }).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for row in rows { result.push(row.map_err(|e| e.to_string())?); }
    Ok(result)
}

#[tauri::command]
pub fn get_profit_by_category() -> Result<Vec<ProfitByEntity>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT COALESCE(c.id, 0) AS eid, COALESCE(c.name, 'Uncategorized') AS name, COALESCE(SUM(si.total), 0) AS revenue, COALESCE(SUM(p.cost_price * si.quantity), 0) AS cost, COALESCE(SUM(si.total), 0) - COALESCE(SUM(p.cost_price * si.quantity), 0) AS profit, CASE WHEN SUM(si.total) > 0 THEN ROUND((SUM(si.total) - SUM(p.cost_price * si.quantity)) / SUM(si.total) * 100, 1) ELSE 0 END AS margin, SUM(si.quantity) AS qty FROM sale_items si JOIN products p ON p.id = si.product_id LEFT JOIN categories c ON c.id = p.category_id GROUP BY c.id ORDER BY profit DESC").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(ProfitByEntity { entity_id: row.get(0)?, entity_name: row.get(1)?, revenue: row.get(2)?, cost: row.get(3)?, profit: row.get(4)?, margin: row.get(5)?, quantity: row.get(6)? })
    }).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for row in rows { result.push(row.map_err(|e| e.to_string())?); }
    Ok(result)
}

#[tauri::command]
pub fn get_profit_by_product(limit: i64) -> Result<Vec<ProfitByEntity>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT p.id, p.name, COALESCE(SUM(si.total), 0) AS revenue, COALESCE(SUM(p.cost_price * si.quantity), 0) AS cost, COALESCE(SUM(si.total), 0) - COALESCE(SUM(p.cost_price * si.quantity), 0) AS profit, CASE WHEN SUM(si.total) > 0 THEN ROUND((SUM(si.total) - SUM(p.cost_price * si.quantity)) / SUM(si.total) * 100, 1) ELSE 0 END AS margin, SUM(si.quantity) AS qty FROM sale_items si JOIN products p ON p.id = si.product_id GROUP BY p.id ORDER BY profit DESC LIMIT ?1").map_err(|e| e.to_string())?;
    let rows = stmt.query_map(rusqlite::params![limit], |row| {
        Ok(ProfitByEntity { entity_id: row.get(0)?, entity_name: row.get(1)?, revenue: row.get(2)?, cost: row.get(3)?, profit: row.get(4)?, margin: row.get(5)?, quantity: row.get(6)? })
    }).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for row in rows { result.push(row.map_err(|e| e.to_string())?); }
    Ok(result)
}

#[tauri::command]
pub fn get_profit_by_supplier() -> Result<Vec<ProfitByEntity>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT COALESCE(s.id, 0) AS eid, COALESCE(s.company_name, 'Unknown') AS name, COALESCE(SUM(si.total), 0) AS revenue, COALESCE(SUM(p.cost_price * si.quantity), 0) AS cost, COALESCE(SUM(si.total), 0) - COALESCE(SUM(p.cost_price * si.quantity), 0) AS profit, CASE WHEN SUM(si.total) > 0 THEN ROUND((SUM(si.total) - SUM(p.cost_price * si.quantity)) / SUM(si.total) * 100, 1) ELSE 0 END AS margin, SUM(si.quantity) AS qty FROM sale_items si JOIN products p ON p.id = si.product_id LEFT JOIN suppliers s ON s.id = p.supplier_id GROUP BY s.id ORDER BY profit DESC").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(ProfitByEntity { entity_id: row.get(0)?, entity_name: row.get(1)?, revenue: row.get(2)?, cost: row.get(3)?, profit: row.get(4)?, margin: row.get(5)?, quantity: row.get(6)? })
    }).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for row in rows { result.push(row.map_err(|e| e.to_string())?); }
    Ok(result)
}

#[tauri::command]
pub fn get_profit_by_brand() -> Result<Vec<ProfitByEntity>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT COALESCE(b.id, 0) AS eid, COALESCE(b.name, 'Unknown') AS name, COALESCE(SUM(si.total), 0) AS revenue, COALESCE(SUM(p.cost_price * si.quantity), 0) AS cost, COALESCE(SUM(si.total), 0) - COALESCE(SUM(p.cost_price * si.quantity), 0) AS profit, CASE WHEN SUM(si.total) > 0 THEN ROUND((SUM(si.total) - SUM(p.cost_price * si.quantity)) / SUM(si.total) * 100, 1) ELSE 0 END AS margin, SUM(si.quantity) AS qty FROM sale_items si JOIN products p ON p.id = si.product_id LEFT JOIN brands b ON b.id = p.brand_id GROUP BY b.id ORDER BY profit DESC").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(ProfitByEntity { entity_id: row.get(0)?, entity_name: row.get(1)?, revenue: row.get(2)?, cost: row.get(3)?, profit: row.get(4)?, margin: row.get(5)?, quantity: row.get(6)? })
    }).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for row in rows { result.push(row.map_err(|e| e.to_string())?); }
    Ok(result)
}

#[tauri::command]
pub fn get_profit_by_customer(limit: i64) -> Result<Vec<ProfitByEntity>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT COALESCE(c.id, 0) AS eid, COALESCE(c.name, 'Unknown') AS name, COALESCE(SUM(s.total), 0) AS revenue, COALESCE(SUM(p.cost_price * si.quantity), 0) AS cost, COALESCE(SUM(s.total), 0) - COALESCE(SUM(p.cost_price * si.quantity), 0) AS profit, CASE WHEN SUM(s.total) > 0 THEN ROUND((SUM(s.total) - SUM(p.cost_price * si.quantity)) / SUM(s.total) * 100, 1) ELSE 0 END AS margin, COUNT(DISTINCT s.id) AS qty FROM sales s JOIN sale_items si ON si.sale_id = s.id JOIN products p ON p.id = si.product_id LEFT JOIN customers c ON c.id = s.customer_id GROUP BY c.id ORDER BY profit DESC LIMIT ?1").map_err(|e| e.to_string())?;
    let rows = stmt.query_map(rusqlite::params![limit], |row| {
        Ok(ProfitByEntity { entity_id: row.get(0)?, entity_name: row.get(1)?, revenue: row.get(2)?, cost: row.get(3)?, profit: row.get(4)?, margin: row.get(5)?, quantity: row.get(6)? })
    }).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for row in rows { result.push(row.map_err(|e| e.to_string())?); }
    Ok(result)
}

#[tauri::command]
pub fn get_profit_by_warehouse() -> Result<Vec<ProfitByEntity>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT COALESCE(w.id, 0) AS eid, COALESCE(w.name, 'Unknown') AS name, COALESCE(SUM(si.total), 0) AS revenue, COALESCE(SUM(p.cost_price * si.quantity), 0) AS cost, COALESCE(SUM(si.total), 0) - COALESCE(SUM(p.cost_price * si.quantity), 0) AS profit, CASE WHEN SUM(si.total) > 0 THEN ROUND((SUM(si.total) - SUM(p.cost_price * si.quantity)) / SUM(si.total) * 100, 1) ELSE 0 END AS margin, SUM(si.quantity) AS qty FROM sale_items si JOIN products p ON p.id = si.product_id JOIN sales s ON s.id = si.sale_id LEFT JOIN warehouses w ON w.id = s.warehouse_id GROUP BY w.id ORDER BY profit DESC").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(ProfitByEntity { entity_id: row.get(0)?, entity_name: row.get(1)?, revenue: row.get(2)?, cost: row.get(3)?, profit: row.get(4)?, margin: row.get(5)?, quantity: row.get(6)? })
    }).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for row in rows { result.push(row.map_err(|e| e.to_string())?); }
    Ok(result)
}
