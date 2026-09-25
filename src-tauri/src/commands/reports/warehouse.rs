use serde::Serialize;
use crate::DB_STATE;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WarehouseUtilization {
    pub warehouse_id: i64,
    pub warehouse_name: String,
    pub product_count: i64,
    pub total_stock: i64,
    pub stock_value: f64,
    pub location_count: i64,
    pub utilization_pct: f64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WarehouseAdjustmentSummary {
    pub warehouse_id: i64,
    pub warehouse_name: String,
    pub adjustment_count: i64,
    pub total_adjusted: f64,
    pub positive_adjustments: i64,
    pub negative_adjustments: i64,
}

#[tauri::command]
pub fn get_warehouse_utilization() -> Result<Vec<WarehouseUtilization>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT w.id, w.name, COUNT(DISTINCT p.id) AS pcount, COALESCE(SUM(p.stock_quantity), 0) AS total_stock, COALESCE(SUM(p.stock_quantity * p.cost_price), 0) AS stock_val, (SELECT COUNT(*) FROM storage_locations sl WHERE sl.warehouse_id = w.id) AS loc_count, CASE WHEN (SELECT COUNT(*) FROM storage_locations sl WHERE sl.warehouse_id = w.id) > 0 THEN ROUND(CAST(COUNT(DISTINCT p.storage_location_id) AS REAL) / (SELECT COUNT(*) FROM storage_locations sl WHERE sl.warehouse_id = w.id) * 100, 1) ELSE 0 END AS utilization FROM warehouses w LEFT JOIN products p ON p.warehouse_id = w.id AND p.is_active = 1 GROUP BY w.id ORDER BY stock_val DESC").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(WarehouseUtilization { warehouse_id: row.get(0)?, warehouse_name: row.get(1)?, product_count: row.get(2)?, total_stock: row.get(3)?, stock_value: row.get(4)?, location_count: row.get(5)?, utilization_pct: row.get(6)? })
    }).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for row in rows { result.push(row.map_err(|e| e.to_string())?); }
    Ok(result)
}

#[tauri::command]
pub fn get_warehouse_stock_distribution(warehouse_id: i64) -> Result<Vec<super::inventory::InventoryValuation>, String> {
    use super::inventory::InventoryValuation;
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT COALESCE(c.name, 'Uncategorized') AS cat, COUNT(p.id) AS pcount, SUM(p.stock_quantity) AS total_stock, COALESCE(ROUND(AVG(p.cost_price), 2), 0) AS avg_cost, COALESCE(SUM(p.stock_quantity * p.cost_price), 0) AS cost_val, COALESCE(SUM(p.stock_quantity * p.sale_price), 0) AS sale_val, COALESCE(SUM(p.stock_quantity * (p.sale_price - p.cost_price)), 0) AS profit FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE p.warehouse_id = ?1 AND p.is_active = 1 GROUP BY c.id ORDER BY cost_val DESC").map_err(|e| e.to_string())?;
    let rows = stmt.query_map(rusqlite::params![warehouse_id], |row| {
        Ok(InventoryValuation { category: row.get(0)?, product_count: row.get(1)?, total_stock: row.get(2)?, avg_cost: row.get(3)?, total_cost_value: row.get(4)?, total_sale_value: row.get(5)?, potential_profit: row.get(6)? })
    }).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for row in rows { result.push(row.map_err(|e| e.to_string())?); }
    Ok(result)
}

#[tauri::command]
pub fn get_warehouse_adjustments() -> Result<Vec<WarehouseAdjustmentSummary>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT COALESCE(im.warehouse_id, 0) AS wh_id, COALESCE(w.name, 'Unknown') AS wh_name, COUNT(*) AS cnt, COALESCE(SUM(im.quantity * p.cost_price), 0) AS total_adj, SUM(CASE WHEN im.quantity > 0 THEN 1 ELSE 0 END) AS pos, SUM(CASE WHEN im.quantity < 0 THEN 1 ELSE 0 END) AS neg FROM inventory_movements im LEFT JOIN products p ON p.id = im.product_id LEFT JOIN warehouses w ON w.id = im.warehouse_id WHERE im.type = 'adjustment' GROUP BY im.warehouse_id ORDER BY cnt DESC").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(WarehouseAdjustmentSummary { warehouse_id: row.get(0)?, warehouse_name: row.get(1)?, adjustment_count: row.get(2)?, total_adjusted: row.get(3)?, positive_adjustments: row.get(4)?, negative_adjustments: row.get(5)? })
    }).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for row in rows { result.push(row.map_err(|e| e.to_string())?); }
    Ok(result)
}
