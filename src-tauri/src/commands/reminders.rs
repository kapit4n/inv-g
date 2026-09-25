use serde::{Deserialize, Serialize};

use crate::DB_STATE;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ServiceReminder {
    pub id: i64,
    pub customer_id: i64,
    pub vehicle_id: Option<i64>,
    pub reminder_type: String,
    pub title: String,
    pub description: Option<String>,
    pub due_date: Option<String>,
    pub due_mileage: Option<i64>,
    pub status: String,
    pub completed_at: Option<String>,
    pub completed_by: Option<i64>,
    pub completed_by_name: Option<String>,
    pub notes: Option<String>,
    pub created_by: Option<i64>,
    pub created_by_name: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub customer_name: Option<String>,
    pub vehicle_info: Option<String>,
}

macro_rules! map_err {
    ($expr:expr) => {
        $expr.map_err(|e| format!("{}", e))
    };
}

fn row_to_service_reminder(row: &rusqlite::Row) -> rusqlite::Result<ServiceReminder> {
    Ok(ServiceReminder {
        id: row.get(0)?,
        customer_id: row.get(1)?,
        vehicle_id: row.get(2)?,
        reminder_type: row.get(3)?,
        title: row.get(4)?,
        description: row.get(5)?,
        due_date: row.get(6)?,
        due_mileage: row.get(7)?,
        status: row.get(8)?,
        completed_at: row.get(9)?,
        completed_by: row.get(10)?,
        completed_by_name: row.get(11)?,
        notes: row.get(12)?,
        created_by: row.get(13)?,
        created_by_name: row.get(14)?,
        created_at: row.get(15)?,
        updated_at: row.get(16)?,
        customer_name: row.get(17)?,
        vehicle_info: row.get(18)?,
    })
}

#[tauri::command]
pub fn get_service_reminders(
    status: Option<String>,
    customer_id: Option<i64>,
) -> Result<Vec<ServiceReminder>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let mut sql = String::from(
        "SELECT sr.id, sr.customer_id, sr.vehicle_id, sr.reminder_type, sr.title, sr.description, sr.due_date, sr.due_mileage, sr.status, sr.completed_at, sr.completed_by, ucb.full_name AS completed_by_name, sr.notes, sr.created_by, ucr.full_name AS created_by_name, sr.created_at, sr.updated_at, c.name AS customer_name, CASE WHEN cv.id IS NOT NULL THEN COALESCE(cv.nickname, cv.license_plate, 'Vehicle #' || cv.id) ELSE NULL END AS vehicle_info FROM service_reminders sr LEFT JOIN customers c ON c.id = sr.customer_id LEFT JOIN customer_vehicles cv ON cv.id = sr.vehicle_id LEFT JOIN users ucb ON ucb.id = sr.completed_by LEFT JOIN users ucr ON ucr.id = sr.created_by WHERE 1=1"
    );
    let mut query_params: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();

    // Placeholder numbers derive from the parameter vector rather than a
    // separate counter, so they cannot drift out of sync with the bound values.
    if let Some(ref s) = status {
        if !s.is_empty() {
            let i = query_params.len() + 1;
            sql.push_str(&format!(" AND sr.status = ?{i}"));
            query_params.push(Box::new(s.clone()));
        }
    }

    if let Some(cid) = customer_id {
        let i = query_params.len() + 1;
        sql.push_str(&format!(" AND sr.customer_id = ?{i}"));
        query_params.push(Box::new(cid));
    }

    sql.push_str(" ORDER BY sr.due_date ASC, sr.created_at DESC");

    let params_refs: Vec<&dyn rusqlite::types::ToSql> = query_params.iter().map(|p| p.as_ref()).collect();
    let mut stmt = map_err!(conn.prepare(&sql))?;
    let rows = map_err!(stmt.query_map(params_refs.as_slice(), row_to_service_reminder))?;
    let mut result = Vec::new();
    for row in rows {
        result.push(map_err!(row)?);
    }
    Ok(result)
}

#[tauri::command]
pub fn get_service_reminder(id: i64) -> Result<ServiceReminder, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let row = conn.query_row(
        "SELECT sr.id, sr.customer_id, sr.vehicle_id, sr.reminder_type, sr.title, sr.description, sr.due_date, sr.due_mileage, sr.status, sr.completed_at, sr.completed_by, ucb.full_name AS completed_by_name, sr.notes, sr.created_by, ucr.full_name AS created_by_name, sr.created_at, sr.updated_at, c.name AS customer_name, CASE WHEN cv.id IS NOT NULL THEN COALESCE(cv.nickname, cv.license_plate, 'Vehicle #' || cv.id) ELSE NULL END AS vehicle_info FROM service_reminders sr LEFT JOIN customers c ON c.id = sr.customer_id LEFT JOIN customer_vehicles cv ON cv.id = sr.vehicle_id LEFT JOIN users ucb ON ucb.id = sr.completed_by LEFT JOIN users ucr ON ucr.id = sr.created_by WHERE sr.id = ?1",
        rusqlite::params![id],
        row_to_service_reminder,
    ).map_err(|e| e.to_string())?;
    Ok(row)
}

#[tauri::command]
pub fn create_service_reminder(
    customer_id: i64,
    vehicle_id: Option<i64>,
    reminder_type: String,
    title: String,
    description: Option<String>,
    due_date: Option<String>,
    due_mileage: Option<i64>,
    notes: Option<String>,
    created_by: i64,
) -> Result<ServiceReminder, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    map_err!(conn.execute(
        "INSERT INTO service_reminders (customer_id, vehicle_id, reminder_type, title, description, due_date, due_mileage, notes, created_by) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        rusqlite::params![customer_id, vehicle_id, reminder_type, title, description, due_date, due_mileage, notes, created_by],
    ))?;

    let id = conn.last_insert_rowid();

    map_err!(conn.execute(
        "INSERT INTO customer_timeline (customer_id, event_type, title, description, created_by) VALUES (?1, 'reminder_created', ?2, ?3, ?4)",
        rusqlite::params![customer_id, format!("Reminder Created: {}", title), description.as_deref(), created_by],
    ))?;

    drop(conn);
    get_service_reminder(id)
}

#[tauri::command]
pub fn update_service_reminder_status(
    id: i64,
    status: String,
    user_id: i64,
) -> Result<ServiceReminder, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    if status == "completed" {
        map_err!(conn.execute(
            "UPDATE service_reminders SET status = ?1, completed_at = datetime('now'), completed_by = ?2, updated_at = datetime('now') WHERE id = ?3",
            rusqlite::params![status, user_id, id],
        ))?;

        let customer_id: i64 = conn.query_row(
            "SELECT customer_id FROM service_reminders WHERE id = ?1",
            rusqlite::params![id],
            |row| row.get(0),
        ).map_err(|e| e.to_string())?;

        let title: String = conn.query_row(
            "SELECT title FROM service_reminders WHERE id = ?1",
            rusqlite::params![id],
            |row| row.get(0),
        ).map_err(|e| e.to_string())?;

        map_err!(conn.execute(
            "INSERT INTO customer_timeline (customer_id, event_type, title, description, created_by) VALUES (?1, 'reminder_completed', ?2, ?3, ?4)",
            rusqlite::params![customer_id, format!("Reminder Completed: {}", title), None::<String>, user_id],
        ))?;
    } else {
        map_err!(conn.execute(
            "UPDATE service_reminders SET status = ?1, updated_at = datetime('now') WHERE id = ?2",
            rusqlite::params![status, id],
        ))?;
    }

    drop(conn);
    get_service_reminder(id)
}

#[tauri::command]
pub fn get_overdue_reminders() -> Result<Vec<ServiceReminder>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let mut stmt = map_err!(conn.prepare(
        "SELECT sr.id, sr.customer_id, sr.vehicle_id, sr.reminder_type, sr.title, sr.description, sr.due_date, sr.due_mileage, sr.status, sr.completed_at, sr.completed_by, ucb.full_name AS completed_by_name, sr.notes, sr.created_by, ucr.full_name AS created_by_name, sr.created_at, sr.updated_at, c.name AS customer_name, CASE WHEN cv.id IS NOT NULL THEN COALESCE(cv.nickname, cv.license_plate, 'Vehicle #' || cv.id) ELSE NULL END AS vehicle_info FROM service_reminders sr LEFT JOIN customers c ON c.id = sr.customer_id LEFT JOIN customer_vehicles cv ON cv.id = sr.vehicle_id LEFT JOIN users ucb ON ucb.id = sr.completed_by LEFT JOIN users ucr ON ucr.id = sr.created_by WHERE sr.status = 'pending' AND (sr.due_date < date('now') OR (sr.due_mileage IS NOT NULL AND sr.due_mileage <= COALESCE((SELECT mileage FROM customer_vehicles WHERE id = sr.vehicle_id), 0))) ORDER BY sr.due_date ASC"
    ))?;
    let rows = map_err!(stmt.query_map([], row_to_service_reminder))?;
    let mut result = Vec::new();
    for row in rows {
        result.push(map_err!(row)?);
    }
    Ok(result)
}
