use serde::Serialize;
use crate::DB_STATE;

#[derive(Debug, Serialize)]
pub struct BackupRecord {
    pub id: i64,
    pub file_name: String,
    pub file_path: String,
    pub file_size: i64,
    pub backup_type: String,
    pub compression: String,
    pub encryption: String,
    pub status: String,
    pub checksum: Option<String>,
    pub notes: Option<String>,
    pub created_by: Option<i64>,
    pub created_by_name: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Serialize)]
pub struct RestoreRecord {
    pub id: i64,
    pub backup_id: Option<i64>,
    pub file_name: String,
    pub file_path: String,
    pub restore_type: String,
    pub status: String,
    pub tables_restored: Option<String>,
    pub error_message: Option<String>,
    pub created_by: Option<i64>,
    pub created_by_name: Option<String>,
    pub created_at: String,
}

#[tauri::command]
pub fn get_backup_history(limit: Option<i64>) -> Result<Vec<BackupRecord>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let limit = limit.unwrap_or(50);

    let mut stmt = conn.prepare(
        "SELECT b.id, b.file_name, b.file_path, b.file_size, b.backup_type,
                b.compression, b.encryption, b.status, b.checksum, b.notes,
                b.created_by, COALESCE(u.username, '') AS created_by_name, b.created_at
         FROM backup_history b
         LEFT JOIN users u ON u.id = b.created_by
         ORDER BY b.created_at DESC LIMIT ?1"
    ).map_err(|e| e.to_string())?;

    let rows = stmt.query_map(rusqlite::params![limit], |row| {
        Ok(BackupRecord {
            id: row.get(0)?,
            file_name: row.get(1)?,
            file_path: row.get(2)?,
            file_size: row.get(3)?,
            backup_type: row.get(4)?,
            compression: row.get(5)?,
            encryption: row.get(6)?,
            status: row.get(7)?,
            checksum: row.get(8)?,
            notes: row.get(9)?,
            created_by: row.get(10)?,
            created_by_name: row.get(11)?,
            created_at: row.get(12)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut result = Vec::new();
    for row in rows {
        result.push(row.map_err(|e| e.to_string())?);
    }

    Ok(result)
}

#[tauri::command]
pub fn create_backup(backup_type: String, notes: Option<String>, created_by: i64) -> Result<BackupRecord, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let timestamp = chrono::Utc::now().format("%Y%m%d_%H%M%S").to_string();
    let file_name = format!("backup_{}.db", timestamp);
    let file_path = format!("backups/{}", file_name);

    let db_page_count: i64 = conn.query_row("PRAGMA page_count", [], |row| row.get(0)).unwrap_or(0);
    let db_page_size: i64 = conn.query_row("PRAGMA page_size", [], |row| row.get(0)).unwrap_or(4096);
    let file_size = db_page_count * db_page_size;

    let checksum = format!("pending_{}", timestamp);

    conn.execute(
        "INSERT INTO backup_history (file_name, file_path, file_size, backup_type, checksum, notes, created_by)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        rusqlite::params![file_name, file_path, file_size, backup_type, checksum, notes, created_by],
    ).map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();

    conn.execute(
        "INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, severity)
         VALUES (?1, 'create_backup', 'backup', ?2, 'Backup created', 'info')",
        rusqlite::params![created_by, id.to_string()],
    ).ok();

    drop(conn);
    let result = get_backup_history(Some(1))?;
    result.into_iter().next().ok_or("Failed to retrieve created backup".to_string())
}

#[tauri::command]
pub fn delete_backup(id: i64) -> Result<(), String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "DELETE FROM backup_history WHERE id = ?1",
        rusqlite::params![id],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn get_restore_history(limit: Option<i64>) -> Result<Vec<RestoreRecord>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let limit = limit.unwrap_or(50);

    let mut stmt = conn.prepare(
        "SELECT r.id, r.backup_id, r.file_name, r.file_path, r.restore_type,
                r.status, r.tables_restored, r.error_message,
                r.created_by, COALESCE(u.username, '') AS created_by_name, r.created_at
         FROM restore_history r
         LEFT JOIN users u ON u.id = r.created_by
         ORDER BY r.created_at DESC LIMIT ?1"
    ).map_err(|e| e.to_string())?;

    let rows = stmt.query_map(rusqlite::params![limit], |row| {
        Ok(RestoreRecord {
            id: row.get(0)?,
            backup_id: row.get(1)?,
            file_name: row.get(2)?,
            file_path: row.get(3)?,
            restore_type: row.get(4)?,
            status: row.get(5)?,
            tables_restored: row.get(6)?,
            error_message: row.get(7)?,
            created_by: row.get(8)?,
            created_by_name: row.get(9)?,
            created_at: row.get(10)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut result = Vec::new();
    for row in rows {
        result.push(row.map_err(|e| e.to_string())?);
    }

    Ok(result)
}

#[tauri::command]
pub fn get_scheduled_backup_config() -> Result<serde_json::Value, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare(
        "SELECT key, value FROM application_settings WHERE category = 'backup'"
    ).map_err(|e| e.to_string())?;

    let rows = stmt.query_map([], |row| {
        Ok((row.get::<_, String>(0)?, row.get::<_, Option<String>>(1)?))
    }).map_err(|e| e.to_string())?;

    let mut config = serde_json::Map::new();
    for row in rows {
        let (key, value) = row.map_err(|e| e.to_string())?;
        config.insert(key, serde_json::Value::String(value.unwrap_or_default()));
    }

    Ok(serde_json::Value::Object(config))
}

#[tauri::command]
pub fn save_scheduled_backup_config(config: serde_json::Value) -> Result<(), String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    if let Some(obj) = config.as_object() {
        for (key, value) in obj {
            let val = value.as_str().unwrap_or("");
            conn.execute(
                "INSERT INTO application_settings (category, key, value, setting_type) VALUES ('backup', ?1, ?2, 'string')
                 ON CONFLICT(key) DO UPDATE SET value = ?2, updated_at = datetime('now')",
                rusqlite::params![key, val],
            ).map_err(|e| e.to_string())?;
        }
    }

    Ok(())
}

#[tauri::command]
pub fn get_backup_stats() -> Result<serde_json::Value, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let total_backups: i64 = conn.query_row(
        "SELECT COUNT(*) FROM backup_history",
        [],
        |row| row.get(0),
    ).unwrap_or(0);

    let total_size: i64 = conn.query_row(
        "SELECT COALESCE(SUM(file_size), 0) FROM backup_history",
        [],
        |row| row.get(0),
    ).unwrap_or(0);

    let last_backup: Option<String> = conn.query_row(
        "SELECT created_at FROM backup_history ORDER BY created_at DESC LIMIT 1",
        [],
        |row| row.get(0),
    ).ok();

    Ok(serde_json::json!({
        "total_backups": total_backups,
        "total_size_bytes": total_size,
        "total_size_mb": format!("{:.2}", total_size as f64 / 1_048_576.0),
        "last_backup": last_backup,
    }))
}
