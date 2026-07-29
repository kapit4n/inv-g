use serde::{Deserialize, Serialize};
use crate::DB_STATE;

#[derive(Debug, Serialize, Deserialize)]
pub struct SystemUpdate {
    pub id: i64,
    pub version: String,
    pub release_date: Option<String>,
    pub release_notes: Option<String>,
    pub download_url: Option<String>,
    pub file_name: Option<String>,
    pub file_size: Option<i64>,
    pub checksum: Option<String>,
    pub status: String,
    pub installed_at: Option<String>,
    pub installed_by: Option<i64>,
    pub created_at: String,
}

#[tauri::command]
pub fn get_system_updates() -> Result<Vec<SystemUpdate>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare(
        "SELECT id, version, release_date, release_notes, download_url, file_name,
                file_size, checksum, status, installed_at, installed_by, created_at
         FROM system_updates ORDER BY created_at DESC"
    ).map_err(|e| e.to_string())?;

    let rows = stmt.query_map([], |row| {
        Ok(SystemUpdate {
            id: row.get(0)?,
            version: row.get(1)?,
            release_date: row.get(2)?,
            release_notes: row.get(3)?,
            download_url: row.get(4)?,
            file_name: row.get(5)?,
            file_size: row.get(6)?,
            checksum: row.get(7)?,
            status: row.get(8)?,
            installed_at: row.get(9)?,
            installed_by: row.get(10)?,
            created_at: row.get(11)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut result = Vec::new();
    for row in rows {
        result.push(row.map_err(|e| e.to_string())?);
    }

    Ok(result)
}

#[tauri::command]
pub fn check_for_updates() -> Result<serde_json::Value, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let current_version: String = conn.query_row(
        "SELECT value FROM settings WHERE key = 'app_version'",
        [],
        |row| row.get(0),
    ).unwrap_or_else(|_| "0.1.0".to_string());

    let latest_version: String = conn.query_row(
        "SELECT version FROM system_updates WHERE status = 'available' ORDER BY created_at DESC LIMIT 1",
        [],
        |row| row.get(0),
    ).unwrap_or_else(|_| current_version.clone());

    let has_update = latest_version != current_version;

    Ok(serde_json::json!({
        "current_version": current_version,
        "latest_version": latest_version,
        "has_update": has_update,
    }))
}

#[tauri::command]
pub fn get_current_version() -> Result<String, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    conn.query_row(
        "SELECT value FROM settings WHERE key = 'app_version'",
        [],
        |row| row.get::<_, String>(0),
    ).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn record_update_available(
    version: String,
    release_notes: Option<String>,
    download_url: Option<String>,
) -> Result<(), String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO system_updates (version, release_notes, download_url, status)
         VALUES (?1, ?2, ?3, 'available')",
        rusqlite::params![version, release_notes, download_url],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn mark_update_installed(update_id: i64, installed_by: i64) -> Result<(), String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE system_updates SET status = 'installed', installed_at = datetime('now'), installed_by = ?1
         WHERE id = ?2",
        rusqlite::params![installed_by, update_id],
    ).map_err(|e| e.to_string())?;

    Ok(())
}
