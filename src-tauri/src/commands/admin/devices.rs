use serde::{Deserialize, Serialize};
use crate::DB_STATE;

#[derive(Debug, Serialize, Deserialize)]
pub struct DeviceSetting {
    pub id: i64,
    pub name: String,
    pub device_type: String,
    pub identifier: Option<String>,
    pub interface_type: String,
    pub config: String,
    pub is_active: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct DeviceInput {
    pub name: String,
    pub device_type: String,
    pub identifier: Option<String>,
    pub interface_type: String,
    pub config: String,
}

fn row_to_device(row: &rusqlite::Row) -> rusqlite::Result<DeviceSetting> {
    Ok(DeviceSetting {
        id: row.get(0)?,
        name: row.get(1)?,
        device_type: row.get(2)?,
        identifier: row.get(3)?,
        interface_type: row.get(4)?,
        config: row.get(5)?,
        is_active: row.get::<_, i64>(6)? == 1,
        created_at: row.get(7)?,
        updated_at: row.get(8)?,
    })
}

#[tauri::command]
pub fn get_devices(device_type: Option<String>) -> Result<Vec<DeviceSetting>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let (where_clause, params): (String, Vec<Box<dyn rusqlite::types::ToSql>>) = if let Some(ref dt) = device_type {
        ("WHERE device_type = ?1".to_string(), vec![Box::new(dt.clone())])
    } else {
        (String::new(), vec![])
    };

    let param_refs: Vec<&dyn rusqlite::types::ToSql> = params.iter().map(|p| p.as_ref()).collect();

    let sql = format!(
        "SELECT id, name, device_type, identifier, interface_type, config, is_active, created_at, updated_at
         FROM device_settings {} ORDER BY name",
        where_clause,
    );

    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let rows = stmt.query_map(param_refs.as_slice(), row_to_device).map_err(|e| e.to_string())?;

    let mut result = Vec::new();
    for row in rows {
        result.push(row.map_err(|e| e.to_string())?);
    }

    Ok(result)
}

#[tauri::command]
pub fn create_device(input: DeviceInput) -> Result<DeviceSetting, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO device_settings (name, device_type, identifier, interface_type, config)
         VALUES (?1, ?2, ?3, ?4, ?5)",
        rusqlite::params![input.name, input.device_type, input.identifier, input.interface_type, input.config],
    ).map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();

    conn.query_row(
        "SELECT id, name, device_type, identifier, interface_type, config, is_active, created_at, updated_at
         FROM device_settings WHERE id = ?1",
        rusqlite::params![id],
        row_to_device,
    ).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_device(id: i64, input: DeviceInput) -> Result<DeviceSetting, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE device_settings SET name = ?1, device_type = ?2, identifier = ?3,
                interface_type = ?4, config = ?5, updated_at = datetime('now')
         WHERE id = ?6",
        rusqlite::params![input.name, input.device_type, input.identifier, input.interface_type, input.config, id],
    ).map_err(|e| e.to_string())?;

    conn.query_row(
        "SELECT id, name, device_type, identifier, interface_type, config, is_active, created_at, updated_at
         FROM device_settings WHERE id = ?1",
        rusqlite::params![id],
        row_to_device,
    ).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_device(id: i64) -> Result<(), String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "DELETE FROM device_settings WHERE id = ?1",
        rusqlite::params![id],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn test_device(id: i64) -> Result<String, String> {
    let _db = DB_STATE.get().ok_or("Database not initialized")?;
    let _conn = _db.conn.lock().map_err(|e| e.to_string())?;

    Ok("Device test sent".to_string())
}

#[tauri::command]
pub fn get_device_types() -> Result<Vec<String>, String> {
    Ok(vec![
        "scanner".to_string(),
        "barcode_reader".to_string(),
        "cash_drawer".to_string(),
        "card_terminal".to_string(),
        "scale".to_string(),
        "label_printer".to_string(),
        "display".to_string(),
        "other".to_string(),
    ])
}
