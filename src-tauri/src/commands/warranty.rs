use serde::{Deserialize, Serialize};

use crate::DB_STATE;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Warranty {
    pub id: i64,
    pub warranty_number: String,
    pub sale_id: Option<i64>,
    pub product_id: Option<i64>,
    pub customer_id: i64,
    pub vehicle_id: Option<i64>,
    pub warranty_type: String,
    pub period_months: i64,
    pub start_date: String,
    pub expiration_date: String,
    pub status: String,
    pub notes: Option<String>,
    pub created_by: Option<i64>,
    pub created_at: String,
    pub updated_at: String,
    pub product_name: Option<String>,
    pub customer_name: Option<String>,
    pub vehicle_info: Option<String>,
    pub sale_number: Option<String>,
}

macro_rules! map_err {
    ($expr:expr) => {
        $expr.map_err(|e| format!("{}", e))
    };
}

fn row_to_warranty(row: &rusqlite::Row) -> rusqlite::Result<Warranty> {
    Ok(Warranty {
        id: row.get(0)?,
        warranty_number: row.get(1)?,
        sale_id: row.get(2)?,
        product_id: row.get(3)?,
        customer_id: row.get(4)?,
        vehicle_id: row.get(5)?,
        warranty_type: row.get(6)?,
        period_months: row.get(7)?,
        start_date: row.get(8)?,
        expiration_date: row.get(9)?,
        status: row.get(10)?,
        notes: row.get(11)?,
        created_by: row.get(12)?,
        created_at: row.get(13)?,
        updated_at: row.get(14)?,
        product_name: row.get(15)?,
        customer_name: row.get(16)?,
        vehicle_info: row.get(17)?,
        sale_number: row.get(18)?,
    })
}

#[tauri::command]
pub fn get_warranties(
    customer_id: Option<i64>,
    status: Option<String>,
) -> Result<Vec<Warranty>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let mut sql = String::from(
        "SELECT w.id, w.warranty_number, w.sale_id, w.product_id, w.customer_id, w.vehicle_id, w.warranty_type, w.period_months, w.start_date, w.expiration_date, w.status, w.notes, w.created_by, w.created_at, w.updated_at, p.name AS product_name, c.name AS customer_name, CASE WHEN cv.id IS NOT NULL THEN COALESCE(cv.nickname, cv.license_plate, 'Vehicle #' || cv.id) ELSE NULL END AS vehicle_info, s.sale_number AS sale_number FROM warranties w LEFT JOIN products p ON p.id = w.product_id LEFT JOIN customers c ON c.id = w.customer_id LEFT JOIN customer_vehicles cv ON cv.id = w.vehicle_id LEFT JOIN sales s ON s.id = w.sale_id WHERE 1=1"
    );
    let mut query_params: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();
    let mut param_idx = 1;

    if let Some(cid) = customer_id {
        sql.push_str(&format!(" AND w.customer_id = ?{}", param_idx));
        query_params.push(Box::new(cid));
        param_idx += 1;
    }

    if let Some(ref s) = status {
        if !s.is_empty() {
            sql.push_str(&format!(" AND w.status = ?{}", param_idx));
            query_params.push(Box::new(s.clone()));
            param_idx += 1;
        }
    }

    sql.push_str(" ORDER BY w.created_at DESC");

    let params_refs: Vec<&dyn rusqlite::types::ToSql> = query_params.iter().map(|p| p.as_ref()).collect();
    let mut stmt = map_err!(conn.prepare(&sql))?;
    let rows = map_err!(stmt.query_map(params_refs.as_slice(), row_to_warranty))?;
    let mut result = Vec::new();
    for row in rows {
        result.push(map_err!(row)?);
    }
    Ok(result)
}

#[tauri::command]
pub fn get_warranty(id: i64) -> Result<Warranty, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let row = conn.query_row(
        "SELECT w.id, w.warranty_number, w.sale_id, w.product_id, w.customer_id, w.vehicle_id, w.warranty_type, w.period_months, w.start_date, w.expiration_date, w.status, w.notes, w.created_by, w.created_at, w.updated_at, p.name AS product_name, c.name AS customer_name, CASE WHEN cv.id IS NOT NULL THEN COALESCE(cv.nickname, cv.license_plate, 'Vehicle #' || cv.id) ELSE NULL END AS vehicle_info, s.sale_number AS sale_number FROM warranties w LEFT JOIN products p ON p.id = w.product_id LEFT JOIN customers c ON c.id = w.customer_id LEFT JOIN customer_vehicles cv ON cv.id = w.vehicle_id LEFT JOIN sales s ON s.id = w.sale_id WHERE w.id = ?1",
        rusqlite::params![id],
        row_to_warranty,
    ).map_err(|e| e.to_string())?;
    Ok(row)
}

fn generate_warranty_number(conn: &rusqlite::Connection) -> Result<String, String> {
    let count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM warranties",
        [],
        |row| row.get(0),
    ).map_err(|e| e.to_string())?;
    Ok(format!("WAR-{:06}", count + 1))
}

#[tauri::command]
pub fn create_warranty(
    sale_id: Option<i64>,
    product_id: Option<i64>,
    customer_id: i64,
    vehicle_id: Option<i64>,
    warranty_type: String,
    period_months: i64,
    start_date: String,
    notes: Option<String>,
    created_by: i64,
) -> Result<Warranty, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let warranty_number = generate_warranty_number(&conn)?;

    map_err!(conn.execute(
        "INSERT INTO warranties (warranty_number, sale_id, product_id, customer_id, vehicle_id, warranty_type, period_months, start_date, expiration_date, notes, created_by) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, date(?8, '+' || ?7 || ' months'), ?9, ?10)",
        rusqlite::params![warranty_number, sale_id, product_id, customer_id, vehicle_id, warranty_type, period_months, start_date, notes, created_by],
    ))?;

    let id = conn.last_insert_rowid();

    map_err!(conn.execute(
        "INSERT INTO customer_timeline (customer_id, event_type, title, description, created_by) VALUES (?1, 'warranty_created', ?2, ?3, ?4)",
        rusqlite::params![customer_id, format!("Warranty Created: {}", warranty_number), notes.as_deref(), created_by],
    ))?;

    drop(conn);
    get_warranty(id)
}

#[tauri::command]
pub fn update_warranty_status(id: i64, status: String) -> Result<Warranty, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    map_err!(conn.execute(
        "UPDATE warranties SET status = ?1, updated_at = datetime('now') WHERE id = ?2",
        rusqlite::params![status, id],
    ))?;

    drop(conn);
    get_warranty(id)
}

#[tauri::command]
pub fn get_expiring_warranties(days: i64) -> Result<Vec<Warranty>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let mut stmt = map_err!(conn.prepare(
        "SELECT w.id, w.warranty_number, w.sale_id, w.product_id, w.customer_id, w.vehicle_id, w.warranty_type, w.period_months, w.start_date, w.expiration_date, w.status, w.notes, w.created_by, w.created_at, w.updated_at, p.name AS product_name, c.name AS customer_name, CASE WHEN cv.id IS NOT NULL THEN COALESCE(cv.nickname, cv.license_plate, 'Vehicle #' || cv.id) ELSE NULL END AS vehicle_info, s.sale_number AS sale_number FROM warranties w LEFT JOIN products p ON p.id = w.product_id LEFT JOIN customers c ON c.id = w.customer_id LEFT JOIN customer_vehicles cv ON cv.id = w.vehicle_id LEFT JOIN sales s ON s.id = w.sale_id WHERE w.status = 'active' AND w.expiration_date BETWEEN date('now') AND date('now', '+' || ?1 || ' days') ORDER BY w.expiration_date ASC"
    ))?;
    let rows = map_err!(stmt.query_map(rusqlite::params![days], row_to_warranty))?;
    let mut result = Vec::new();
    for row in rows {
        result.push(map_err!(row)?);
    }
    Ok(result)
}
