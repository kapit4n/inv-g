use serde::Serialize;
use crate::DB_STATE;

#[derive(Debug, Serialize)]
pub struct CustomerReportRow {
    pub customer_id: i64,
    pub customer_name: String,
    pub customer_type: String,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub city: Option<String>,
    pub total_spent: f64,
    pub order_count: i64,
    pub last_purchase: Option<String>,
    pub avg_ticket: f64,
    pub lifetime_value: f64,
}

#[derive(Debug, Serialize)]
pub struct CustomerGrowthRow {
    pub month: String,
    pub new_customers: i64,
    pub total_customers: i64,
}

#[derive(Debug, Serialize)]
pub struct CustomerLocation {
    pub city: Option<String>,
    pub state: Option<String>,
    pub count: i64,
}

#[derive(Debug, Serialize)]
pub struct CustomerCreditSummary {
    pub total_accounts: i64,
    pub total_credit_limit: f64,
    pub total_balance: f64,
    pub available_credit: f64,
    pub utilization_rate: f64,
    pub overdue_accounts: i64,
}

#[derive(Debug, Serialize)]
pub struct CustomerServiceSummary {
    pub total_reminders: i64,
    pub pending_reminders: i64,
    pub completed_reminders: i64,
    pub overdue_reminders: i64,
    pub total_vehicles: i64,
    pub total_warranties: i64,
    pub active_warranties: i64,
}

#[tauri::command]
pub fn get_top_customers(limit: i64) -> Result<Vec<CustomerReportRow>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT c.id, c.name, c.customer_type, c.email, c.phone, c.city, COALESCE(SUM(s.total), 0) AS total_spent, COUNT(s.id) AS order_count, MAX(s.created_at) AS last_purchase, COALESCE(ROUND(AVG(s.total), 2), 0) AS avg_ticket, COALESCE(SUM(s.total), 0) AS ltv FROM customers c LEFT JOIN sales s ON s.customer_id = c.id GROUP BY c.id ORDER BY total_spent DESC LIMIT ?1").map_err(|e| e.to_string())?;
    let rows = stmt.query_map(rusqlite::params![limit], |row| {
        Ok(CustomerReportRow { customer_id: row.get(0)?, customer_name: row.get(1)?, customer_type: row.get(2)?, email: row.get(3)?, phone: row.get(4)?, city: row.get(5)?, total_spent: row.get(6)?, order_count: row.get(7)?, last_purchase: row.get(8)?, avg_ticket: row.get(9)?, lifetime_value: row.get(10)? })
    }).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for row in rows { result.push(row.map_err(|e| e.to_string())?); }
    Ok(result)
}

#[tauri::command]
pub fn get_customer_growth_report() -> Result<Vec<CustomerGrowthRow>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT strftime('%Y-%m', created_at) AS month, COUNT(*) AS new, (SELECT COUNT(*) FROM customers WHERE strftime('%Y-%m', created_at) <= strftime('%Y-%m', c.created_at)) AS total FROM customers c GROUP BY month ORDER BY month ASC LIMIT 12").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(CustomerGrowthRow { month: row.get(0)?, new_customers: row.get(1)?, total_customers: row.get(2)? })
    }).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for row in rows { result.push(row.map_err(|e| e.to_string())?); }
    Ok(result)
}

#[tauri::command]
pub fn get_customer_locations() -> Result<Vec<CustomerLocation>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT city, state, COUNT(*) AS cnt FROM customers WHERE city IS NOT NULL GROUP BY city, state ORDER BY cnt DESC").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(CustomerLocation { city: row.get(0)?, state: row.get(1)?, count: row.get(2)? })
    }).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for row in rows { result.push(row.map_err(|e| e.to_string())?); }
    Ok(result)
}

#[tauri::command]
pub fn get_inactive_customers(days: i64) -> Result<Vec<CustomerReportRow>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT c.id, c.name, c.customer_type, c.email, c.phone, c.city, COALESCE(SUM(s.total), 0) AS total_spent, COUNT(s.id) AS order_count, MAX(s.created_at) AS last_purchase, 0 AS avg_ticket, COALESCE(SUM(s.total), 0) AS ltv FROM customers c LEFT JOIN sales s ON s.customer_id = c.id GROUP BY c.id HAVING last_purchase IS NULL OR julianday('now') - julianday(last_purchase) > ?1 ORDER BY last_purchase ASC NULLS FIRST").map_err(|e| e.to_string())?;
    let rows = stmt.query_map(rusqlite::params![days], |row| {
        Ok(CustomerReportRow { customer_id: row.get(0)?, customer_name: row.get(1)?, customer_type: row.get(2)?, email: row.get(3)?, phone: row.get(4)?, city: row.get(5)?, total_spent: row.get(6)?, order_count: row.get(7)?, last_purchase: row.get(8)?, avg_ticket: row.get(9)?, lifetime_value: row.get(10)? })
    }).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for row in rows { result.push(row.map_err(|e| e.to_string())?); }
    Ok(result)
}

#[tauri::command]
pub fn get_customer_credit_summary() -> Result<CustomerCreditSummary, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let row = conn.query_row("SELECT COUNT(*) AS accounts, COALESCE(SUM(credit_limit), 0) AS total_limit, COALESCE(SUM(current_balance), 0) AS total_balance, COALESCE(SUM(credit_limit - current_balance), 0) AS available, CASE WHEN SUM(credit_limit) > 0 THEN ROUND(SUM(current_balance) / SUM(credit_limit) * 100, 1) ELSE 0 END AS utilization, SUM(CASE WHEN current_balance > 0 THEN 1 ELSE 0 END) AS overdue FROM credit_accounts", [], |row| {
        Ok(CustomerCreditSummary { total_accounts: row.get(0)?, total_credit_limit: row.get(1)?, total_balance: row.get(2)?, available_credit: row.get(3)?, utilization_rate: row.get(4)?, overdue_accounts: row.get(5)? })
    }).map_err(|e| e.to_string())?;
    Ok(row)
}

#[tauri::command]
pub fn get_customer_service_summary() -> Result<CustomerServiceSummary, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let row = conn.query_row("SELECT (SELECT COUNT(*) FROM service_reminders) AS total, (SELECT COUNT(*) FROM service_reminders WHERE status = 'pending') AS pending, (SELECT COUNT(*) FROM service_reminders WHERE status = 'completed') AS completed, (SELECT COUNT(*) FROM service_reminders WHERE status = 'pending' AND (due_date IS NOT NULL AND date(due_date) < date('now') OR (due_mileage IS NOT NULL AND due_mileage > 0))) AS overdue, (SELECT COUNT(*) FROM customer_vehicles) AS vehicles, (SELECT COUNT(*) FROM warranties) AS warranties_total, (SELECT COUNT(*) FROM warranties WHERE status = 'active') AS active_warranties", [], |row| {
        Ok(CustomerServiceSummary { total_reminders: row.get(0)?, pending_reminders: row.get(1)?, completed_reminders: row.get(2)?, overdue_reminders: row.get(3)?, total_vehicles: row.get(4)?, total_warranties: row.get(5)?, active_warranties: row.get(6)? })
    }).map_err(|e| e.to_string())?;
    Ok(row)
}
