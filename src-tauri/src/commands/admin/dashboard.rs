use serde::Serialize;
use crate::DB_STATE;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AdminDashboard {
    pub active_users: i64,
    pub total_users: i64,
    pub database_size: String,
    pub database_size_bytes: i64,
    pub last_backup: Option<String>,
    pub backup_status: String,
    pub storage_usage: String,
    pub storage_used_bytes: i64,
    pub app_version: String,
    pub connected_printers: i64,
    pub recent_logins: i64,
    pub recent_errors: i64,
    pub audit_events_today: i64,
    pub system_health: String,
    pub license_status: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UserActivityPoint {
    pub date: String,
    pub count: i64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DbGrowthPoint {
    pub date: String,
    pub size_bytes: i64,
}

#[tauri::command]
pub fn get_admin_dashboard() -> Result<AdminDashboard, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let active_users: i64 = conn.query_row(
        "SELECT COUNT(*) FROM users WHERE is_active = 1",
        [],
        |row| row.get(0),
    ).unwrap_or(0);

    let total_users: i64 = conn.query_row(
        "SELECT COUNT(*) FROM users",
        [],
        |row| row.get(0),
    ).unwrap_or(0);

    let page_count: i64 = conn.query_row(
        "PRAGMA page_count",
        [],
        |row| row.get(0),
    ).unwrap_or(0);

    let page_size: i64 = conn.query_row(
        "PRAGMA page_size",
        [],
        |row| row.get(0),
    ).unwrap_or(0);

    let database_size_bytes = page_count * page_size;
    let database_size = if database_size_bytes > 1_048_576 {
        format!("{:.2} MB", database_size_bytes as f64 / 1_048_576.0)
    } else if database_size_bytes > 1024 {
        format!("{:.2} KB", database_size_bytes as f64 / 1024.0)
    } else {
        format!("{} B", database_size_bytes)
    };

    let last_backup: Option<String> = conn.query_row(
        "SELECT created_at FROM backup_history ORDER BY created_at DESC LIMIT 1",
        [],
        |row| row.get(0),
    ).ok();

    let backup_status = if last_backup.is_some() { "completed" } else { "never" }.to_string();

    let app_version: String = conn.query_row(
        "SELECT value FROM settings WHERE key = 'app_version'",
        [],
        |row| row.get(0),
    ).unwrap_or_else(|_| "0.1.0".to_string());

    let connected_printers: i64 = conn.query_row(
        "SELECT COUNT(*) FROM printer_settings WHERE is_active = 1",
        [],
        |row| row.get(0),
    ).unwrap_or(0);

    let recent_logins: i64 = conn.query_row(
        "SELECT COUNT(*) FROM users WHERE last_login_at IS NOT NULL AND last_login_at > datetime('now', '-24 hours')",
        [],
        |row| row.get(0),
    ).unwrap_or(0);

    let recent_errors: i64 = conn.query_row(
        "SELECT COUNT(*) FROM audit_logs WHERE severity = 'error' AND created_at > datetime('now', '-24 hours')",
        [],
        |row| row.get(0),
    ).unwrap_or(0);

    let audit_events_today: i64 = conn.query_row(
        "SELECT COUNT(*) FROM audit_logs WHERE created_at > datetime('now', '-1 day')",
        [],
        |row| row.get(0),
    ).unwrap_or(0);

    let license_status: String = conn.query_row(
        "SELECT status FROM license_information ORDER BY id DESC LIMIT 1",
        [],
        |row| row.get(0),
    ).unwrap_or_else(|_| "unlicensed".to_string());

    let table_count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM sqlite_master WHERE type='table'",
        [],
        |row| row.get(0),
    ).unwrap_or(0);

    let storage_usage = format!("{} tables", table_count);
    let storage_used_bytes = database_size_bytes;
    let system_health = "healthy".to_string();

    drop(conn);

    Ok(AdminDashboard {
        active_users,
        total_users,
        database_size,
        database_size_bytes,
        last_backup,
        backup_status,
        storage_usage,
        storage_used_bytes,
        app_version,
        connected_printers,
        recent_logins,
        recent_errors,
        audit_events_today,
        system_health,
        license_status,
    })
}

#[tauri::command]
pub fn get_user_activity_chart(days: Option<i64>) -> Result<Vec<UserActivityPoint>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let days = days.unwrap_or(30);

    let mut stmt = conn.prepare(
        "SELECT substr(created_at, 1, 10) AS date, COUNT(*) AS count
         FROM audit_logs WHERE action = 'login' AND created_at > datetime('now', ?1)
         GROUP BY date ORDER BY date ASC"
    ).map_err(|e| e.to_string())?;

    let rows = stmt.query_map(rusqlite::params![format!("-{} days", days)], |row| {
        Ok(UserActivityPoint {
            date: row.get(0)?,
            count: row.get(1)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut result = Vec::new();
    for row in rows {
        result.push(row.map_err(|e| e.to_string())?);
    }

    Ok(result)
}

#[tauri::command]
pub fn get_database_growth_chart(days: Option<i64>) -> Result<Vec<DbGrowthPoint>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let days = days.unwrap_or(30);

    let page_size: i64 = conn.query_row("PRAGMA page_size", [], |row| row.get(0)).unwrap_or(4096);

    let mut stmt = conn.prepare(
        "SELECT substr(created_at, 1, 10) AS date, COUNT(*) AS entries
         FROM audit_logs WHERE created_at > datetime('now', ?1)
         GROUP BY date ORDER BY date ASC"
    ).map_err(|e| e.to_string())?;

    let mut result = Vec::new();
    let rows = stmt.query_map(rusqlite::params![format!("-{} days", days)], |row| {
        Ok(DbGrowthPoint {
            date: row.get::<_, String>(0)?,
            size_bytes: row.get::<_, i64>(1)? * page_size / 100,
        })
    }).map_err(|e| e.to_string())?;

    for row in rows {
        result.push(row.map_err(|e| e.to_string())?);
    }

    Ok(result)
}

#[tauri::command]
pub fn get_recent_audit_events(limit: Option<i64>) -> Result<Vec<serde_json::Value>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let limit = limit.unwrap_or(50);

    let mut stmt = conn.prepare(
        "SELECT a.id, a.user_id, COALESCE(u.username, '') AS username, a.action,
                a.entity_type, a.entity_id, a.details, a.severity, a.created_at
         FROM audit_logs a
         LEFT JOIN users u ON u.id = a.user_id
         ORDER BY a.created_at DESC LIMIT ?1"
    ).map_err(|e| e.to_string())?;

    let rows = stmt.query_map(rusqlite::params![limit], |row| {
        Ok(serde_json::json!({
            "id": row.get::<_, i64>(0)?,
            "user_id": row.get::<_, Option<i64>>(1)?,
            "username": row.get::<_, String>(2)?,
            "action": row.get::<_, String>(3)?,
            "entity_type": row.get::<_, Option<String>>(4)?,
            "entity_id": row.get::<_, Option<String>>(5)?,
            "details": row.get::<_, Option<String>>(6)?,
            "severity": row.get::<_, String>(7)?,
            "created_at": row.get::<_, String>(8)?,
        }))
    }).map_err(|e| e.to_string())?;

    let mut result = Vec::new();
    for row in rows {
        result.push(row.map_err(|e| e.to_string())?);
    }

    Ok(result)
}
