use serde::{Deserialize, Serialize};

use crate::DB_STATE;

#[derive(Debug, Serialize, Deserialize)]
pub struct CrmDashboard {
    pub total_customers: i64,
    pub new_customers_month: i64,
    pub active_customers: i64,
    pub workshops: i64,
    pub fleet_companies: i64,
    pub vehicles_registered: i64,
    pub upcoming_reminders: i64,
    pub expired_warranties: i64,
    pub customers_with_credit: i64,
    pub lifetime_revenue: f64,
    pub customers_by_type: Vec<(String, i64)>,
    pub vehicle_brands: Vec<(String, i64)>,
    pub top_customers: Vec<(String, f64)>,
}

macro_rules! map_err {
    ($expr:expr) => {
        $expr.map_err(|e| format!("{}", e))
    };
}

#[tauri::command]
pub fn get_crm_dashboard() -> Result<CrmDashboard, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let total_customers: i64 = conn.query_row(
        "SELECT COUNT(*) FROM customers", [], |row| row.get(0)
    ).map_err(|e| e.to_string())?;

    let new_customers_month: i64 = conn.query_row(
        "SELECT COUNT(*) FROM customers WHERE created_at >= date('now', '-1 month')", [], |row| row.get(0)
    ).map_err(|e| e.to_string())?;

    let active_customers: i64 = conn.query_row(
        "SELECT COUNT(*) FROM customers WHERE is_active = 1", [], |row| row.get(0)
    ).map_err(|e| e.to_string())?;

    let workshops: i64 = conn.query_row(
        "SELECT COUNT(*) FROM customers WHERE customer_type = 'workshop'", [], |row| row.get(0)
    ).map_err(|e| e.to_string())?;

    let fleet_companies: i64 = conn.query_row(
        "SELECT COUNT(*) FROM customers WHERE customer_type = 'fleet'", [], |row| row.get(0)
    ).map_err(|e| e.to_string())?;

    let vehicles_registered: i64 = conn.query_row(
        "SELECT COUNT(*) FROM customer_vehicles WHERE status = 'active'", [], |row| row.get(0)
    ).map_err(|e| e.to_string())?;

    let upcoming_reminders: i64 = conn.query_row(
        "SELECT COUNT(*) FROM service_reminders WHERE status = 'pending'", [], |row| row.get(0)
    ).map_err(|e| e.to_string())?;

    let expired_warranties: i64 = conn.query_row(
        "SELECT COUNT(*) FROM warranties WHERE status = 'active' AND expiration_date < date('now')", [], |row| row.get(0)
    ).map_err(|e| e.to_string())?;

    let customers_with_credit: i64 = conn.query_row(
        "SELECT COUNT(*) FROM credit_accounts WHERE status = 'active'", [], |row| row.get(0)
    ).map_err(|e| e.to_string())?;

    let lifetime_revenue: f64 = conn.query_row(
        "SELECT COALESCE(SUM(total), 0) FROM sales", [], |row| row.get(0)
    ).map_err(|e| e.to_string())?;

    let mut stmt = map_err!(conn.prepare(
        "SELECT COALESCE(customer_type, 'individual'), COUNT(*) FROM customers GROUP BY customer_type ORDER BY COUNT(*) DESC"
    ))?;
    let rows = map_err!(stmt.query_map([], |row| {
        Ok((row.get::<_, String>(0)?, row.get::<_, i64>(1)?))
    }))?;
    let mut customers_by_type = Vec::new();
    for row in rows {
        customers_by_type.push(map_err!(row)?);
    }
    drop(stmt);

    let mut stmt = map_err!(conn.prepare(
        "SELECT vb.name, COUNT(cv.id) FROM vehicle_brands vb JOIN customer_vehicles cv ON cv.brand_id = vb.id GROUP BY vb.name ORDER BY COUNT(cv.id) DESC LIMIT 10"
    ))?;
    let rows = map_err!(stmt.query_map([], |row| {
        Ok((row.get::<_, String>(0)?, row.get::<_, i64>(1)?))
    }))?;
    let mut vehicle_brands = Vec::new();
    for row in rows {
        vehicle_brands.push(map_err!(row)?);
    }
    drop(stmt);

    let mut stmt = map_err!(conn.prepare(
        "SELECT c.name, COALESCE(SUM(s.total), 0) FROM customers c JOIN sales s ON s.customer_id = c.id WHERE s.payment_status != 'refunded' GROUP BY c.id, c.name ORDER BY SUM(s.total) DESC LIMIT 10"
    ))?;
    let rows = map_err!(stmt.query_map([], |row| {
        Ok((row.get::<_, String>(0)?, row.get::<_, f64>(1)?))
    }))?;
    let mut top_customers = Vec::new();
    for row in rows {
        top_customers.push(map_err!(row)?);
    }

    Ok(CrmDashboard {
        total_customers,
        new_customers_month,
        active_customers,
        workshops,
        fleet_companies,
        vehicles_registered,
        upcoming_reminders,
        expired_warranties,
        customers_with_credit,
        lifetime_revenue,
        customers_by_type,
        vehicle_brands,
        top_customers,
    })
}

#[tauri::command]
pub fn get_customers_by_month(months: i64) -> Result<Vec<(String, i64)>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let mut stmt = map_err!(conn.prepare(
        "SELECT strftime('%Y-%m', created_at) AS month, COUNT(*) FROM customers WHERE created_at >= date('now', '-' || ?1 || ' months') GROUP BY month ORDER BY month"
    ))?;
    let rows = map_err!(stmt.query_map(rusqlite::params![months], |row| {
        Ok((row.get::<_, String>(0)?, row.get::<_, i64>(1)?))
    }))?;
    let mut result = Vec::new();
    for row in rows {
        result.push(map_err!(row)?);
    }
    Ok(result)
}
