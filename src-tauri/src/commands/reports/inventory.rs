use serde::{Deserialize, Serialize};
use crate::DB_STATE;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InventoryReportRow {
    pub product_id: i64,
    pub product_name: String,
    pub sku: String,
    pub category: Option<String>,
    pub brand: Option<String>,
    pub warehouse: Option<String>,
    pub stock_quantity: i64,
    pub min_stock: i64,
    pub max_stock: i64,
    pub reorder_point: i64,
    pub cost_price: f64,
    pub sale_price: f64,
    pub stock_value: f64,
    pub stock_value_sale: f64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InventoryValuation {
    pub category: Option<String>,
    pub product_count: i64,
    pub total_stock: i64,
    pub avg_cost: f64,
    pub total_cost_value: f64,
    pub total_sale_value: f64,
    pub potential_profit: f64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MovementSummary {
    pub period: String,
    pub inbound: i64,
    pub outbound: i64,
    pub adjustments: i64,
    pub net_change: i64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StockStatusItem {
    pub product_id: i64,
    pub product_name: String,
    pub sku: String,
    pub stock_quantity: i64,
    pub min_stock: i64,
    pub reorder_point: i64,
    pub status: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AgingItem {
    pub product_id: i64,
    pub product_name: String,
    pub sku: String,
    pub stock_quantity: i64,
    pub days_since_last_movement: i64,
    pub stock_value: f64,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InventoryReportFilter {
    pub warehouse_id: Option<i64>,
    pub category_id: Option<i64>,
    pub brand_id: Option<i64>,
}

#[tauri::command]
pub fn get_inventory_report(filter: InventoryReportFilter) -> Result<Vec<InventoryReportRow>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let mut wheres = vec!["p.is_active = 1".to_string()];
    if let Some(w) = filter.warehouse_id { wheres.push(format!("p.warehouse_id = {}", w)); }
    if let Some(c) = filter.category_id { wheres.push(format!("p.category_id = {}", c)); }
    if let Some(b) = filter.brand_id { wheres.push(format!("p.brand_id = {}", b)); }
    let where_clause = if wheres.is_empty() { String::new() } else { format!("WHERE {}", wheres.join(" AND ")) };

    let sql = format!("SELECT p.id, p.name, p.sku, c.name AS cat, b.name AS brand, w.name AS wh, p.stock_quantity, p.min_stock_level, p.max_stock_level, p.reorder_point, p.cost_price, p.sale_price, (p.stock_quantity * p.cost_price) AS stock_value, (p.stock_quantity * p.sale_price) AS stock_value_sale FROM products p LEFT JOIN categories c ON c.id = p.category_id LEFT JOIN brands b ON b.id = p.brand_id LEFT JOIN warehouses w ON w.id = p.warehouse_id {} ORDER BY p.name ASC", where_clause);

    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(InventoryReportRow {
            product_id: row.get(0)?, product_name: row.get(1)?, sku: row.get(2)?,
            category: row.get(3)?, brand: row.get(4)?, warehouse: row.get(5)?,
            stock_quantity: row.get(6)?, min_stock: row.get(7)?, max_stock: row.get(8)?,
            reorder_point: row.get(9)?, cost_price: row.get(10)?, sale_price: row.get(11)?,
            stock_value: row.get(12)?, stock_value_sale: row.get(13)?,
        })
    }).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for row in rows { result.push(row.map_err(|e| e.to_string())?); }
    Ok(result)
}

#[tauri::command]
pub fn get_inventory_valuation() -> Result<Vec<InventoryValuation>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT COALESCE(c.name, 'Uncategorized') AS cat, COUNT(p.id) AS pcount, SUM(p.stock_quantity) AS total_stock, COALESCE(ROUND(AVG(p.cost_price), 2), 0) AS avg_cost, COALESCE(SUM(p.stock_quantity * p.cost_price), 0) AS cost_val, COALESCE(SUM(p.stock_quantity * p.sale_price), 0) AS sale_val, COALESCE(SUM(p.stock_quantity * (p.sale_price - p.cost_price)), 0) AS profit FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE p.is_active = 1 GROUP BY c.id ORDER BY cost_val DESC").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(InventoryValuation { category: row.get(0)?, product_count: row.get(1)?, total_stock: row.get(2)?, avg_cost: row.get(3)?, total_cost_value: row.get(4)?, total_sale_value: row.get(5)?, potential_profit: row.get(6)? })
    }).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for row in rows { result.push(row.map_err(|e| e.to_string())?); }
    Ok(result)
}

#[tauri::command]
pub fn get_inventory_low_stock() -> Result<Vec<StockStatusItem>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT p.id, p.name, p.sku, p.stock_quantity, p.min_stock_level, p.reorder_point, CASE WHEN p.stock_quantity <= 0 THEN 'out_of_stock' WHEN p.stock_quantity <= p.reorder_point THEN 'reorder' ELSE 'low' END AS status FROM products p WHERE p.stock_quantity <= p.min_stock_level AND p.min_stock_level > 0 AND p.is_active = 1 ORDER BY p.stock_quantity ASC").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(StockStatusItem { product_id: row.get(0)?, product_name: row.get(1)?, sku: row.get(2)?, stock_quantity: row.get(3)?, min_stock: row.get(4)?, reorder_point: row.get(5)?, status: row.get(6)? })
    }).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for row in rows { result.push(row.map_err(|e| e.to_string())?); }
    Ok(result)
}

#[tauri::command]
pub fn get_inventory_movement_report(months: i64) -> Result<Vec<MovementSummary>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare(&format!("SELECT strftime('%Y-%m', created_at) AS period, SUM(CASE WHEN quantity > 0 THEN quantity ELSE 0 END) AS inbound, SUM(CASE WHEN quantity < 0 THEN ABS(quantity) ELSE 0 END) AS outbound, SUM(CASE WHEN type = 'adjustment' THEN quantity ELSE 0 END) AS adjustments, SUM(quantity) AS net FROM inventory_movements WHERE created_at >= date('now', '-{} months') GROUP BY period ORDER BY period ASC", months)).map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(MovementSummary { period: row.get(0)?, inbound: row.get(1)?, outbound: row.get(2)?, adjustments: row.get(3)?, net_change: row.get(4)? })
    }).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for row in rows { result.push(row.map_err(|e| e.to_string())?); }
    Ok(result)
}

#[tauri::command]
pub fn get_inventory_aging(days: i64) -> Result<Vec<AgingItem>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT p.id, p.name, p.sku, p.stock_quantity, COALESCE(julianday('now') - julianday(MAX(im.created_at)), 999) AS days_since, (p.stock_quantity * p.cost_price) AS stock_value FROM products p LEFT JOIN inventory_movements im ON im.product_id = p.id WHERE p.is_active = 1 AND p.stock_quantity > 0 GROUP BY p.id HAVING days_since >= ?1 ORDER BY days_since DESC").map_err(|e| e.to_string())?;
    let rows = stmt.query_map(rusqlite::params![days], |row| {
        Ok(AgingItem { product_id: row.get(0)?, product_name: row.get(1)?, sku: row.get(2)?, stock_quantity: row.get(3)?, days_since_last_movement: row.get(4)?, stock_value: row.get(5)? })
    }).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for row in rows { result.push(row.map_err(|e| e.to_string())?); }
    Ok(result)
}

#[tauri::command]
pub fn get_inventory_overstock() -> Result<Vec<StockStatusItem>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT p.id, p.name, p.sku, p.stock_quantity, p.max_stock_level, p.reorder_point, 'overstock' AS status FROM products p WHERE p.max_stock_level > 0 AND p.stock_quantity > p.max_stock_level AND p.is_active = 1 ORDER BY (p.stock_quantity - p.max_stock_level) DESC").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(StockStatusItem { product_id: row.get(0)?, product_name: row.get(1)?, sku: row.get(2)?, stock_quantity: row.get(3)?, min_stock: row.get(4)?, reorder_point: row.get(5)?, status: row.get(6)? })
    }).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for row in rows { result.push(row.map_err(|e| e.to_string())?); }
    Ok(result)
}

#[tauri::command]
pub fn get_inventory_fast_slow(days: i64) -> Result<Vec<AgingItem>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT p.id, p.name, p.sku, COALESCE(s.qty, 0) AS qty, COALESCE(s.days, 999) AS days_since, (p.stock_quantity * p.cost_price) AS stock_value FROM products p LEFT JOIN (SELECT si.product_id, SUM(si.quantity) AS qty, julianday('now') - julianday(MAX(s.created_at)) AS days FROM sale_items si JOIN sales s ON s.id = si.sale_id GROUP BY si.product_id) s ON s.product_id = p.id WHERE p.is_active = 1 AND p.stock_quantity > 0 ORDER BY s.qty DESC").map_err(|e| e.to_string())?;
    let rows = stmt.query_map(rusqlite::params![], |row| {
        Ok(AgingItem { product_id: row.get(0)?, product_name: row.get(1)?, sku: row.get(2)?, stock_quantity: row.get(3)?, days_since_last_movement: row.get(4)?, stock_value: row.get(5)? })
    }).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for row in rows { result.push(row.map_err(|e| e.to_string())?); }
    Ok(result)
}
