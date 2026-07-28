use serde::{Deserialize, Serialize};
use crate::DB_STATE;

#[derive(Debug, Serialize, Deserialize)]
pub struct SettingResponse {
    pub key: String,
    pub value: Option<String>,
    pub group_name: String,
    pub setting_type: String,
    pub description: Option<String>,
}

#[tauri::command]
pub fn get_settings() -> Result<Vec<SettingResponse>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare(
        "SELECT key, value, group_name, setting_type, description
         FROM settings ORDER BY group_name, key"
    ).map_err(|e| e.to_string())?;

    let settings = stmt.query_map([], |row| {
        Ok(SettingResponse {
            key: row.get(0)?,
            value: row.get(1)?,
            group_name: row.get(2)?,
            setting_type: row.get(3)?,
            description: row.get(4)?,
        })
    }).map_err(|e| e.to_string())?
    .filter_map(|r| r.ok())
    .collect();

    Ok(settings)
}

#[tauri::command]
pub fn get_setting(key: String) -> Result<Option<SettingResponse>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let result = conn.query_row(
        "SELECT key, value, group_name, setting_type, description
         FROM settings WHERE key = ?1",
        rusqlite::params![key],
        |row| {
            Ok(SettingResponse {
                key: row.get(0)?,
                value: row.get(1)?,
                group_name: row.get(2)?,
                setting_type: row.get(3)?,
                description: row.get(4)?,
            })
        },
    );

    match result {
        Ok(setting) => Ok(Some(setting)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub fn update_setting(key: String, value: String) -> Result<(), String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let affected = conn.execute(
        "UPDATE settings SET value = ?1, updated_at = datetime('now') WHERE key = ?2",
        rusqlite::params![value, key],
    ).map_err(|e| e.to_string())?;

    if affected == 0 {
        return Err(format!("Configuración '{}' no encontrada", key));
    }

    Ok(())
}

#[tauri::command]
pub fn get_settings_by_group(group: String) -> Result<Vec<SettingResponse>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare(
        "SELECT key, value, group_name, setting_type, description
         FROM settings WHERE group_name = ?1 ORDER BY key"
    ).map_err(|e| e.to_string())?;

    let settings = stmt.query_map(rusqlite::params![group], |row| {
        Ok(SettingResponse {
            key: row.get(0)?,
            value: row.get(1)?,
            group_name: row.get(2)?,
            setting_type: row.get(3)?,
            description: row.get(4)?,
        })
    }).map_err(|e| e.to_string())?
    .filter_map(|r| r.ok())
    .collect();

    Ok(settings)
}
