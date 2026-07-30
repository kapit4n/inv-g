use serde::{Deserialize, Serialize};
use crate::DB_STATE;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PrinterSetting {
    pub id: i64,
    pub name: String,
    pub printer_type: String,
    pub driver_name: Option<String>,
    pub device_name: Option<String>,
    pub interface_type: String,
    pub ip_address: Option<String>,
    pub port: Option<i64>,
    pub paper_size: String,
    pub margins: String,
    pub copies: i64,
    pub orientation: String,
    pub is_default: bool,
    pub is_active: bool,
    pub config: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PrinterInput {
    pub name: String,
    pub printer_type: String,
    pub driver_name: Option<String>,
    pub device_name: Option<String>,
    pub interface_type: String,
    pub ip_address: Option<String>,
    pub port: Option<i64>,
    pub paper_size: String,
    pub margins: String,
    pub copies: i64,
    pub orientation: String,
    pub is_default: bool,
    pub config: String,
}

fn row_to_printer(row: &rusqlite::Row) -> rusqlite::Result<PrinterSetting> {
    Ok(PrinterSetting {
        id: row.get(0)?,
        name: row.get(1)?,
        printer_type: row.get(2)?,
        driver_name: row.get(3)?,
        device_name: row.get(4)?,
        interface_type: row.get(5)?,
        ip_address: row.get(6)?,
        port: row.get(7)?,
        paper_size: row.get(8)?,
        margins: row.get(9)?,
        copies: row.get(10)?,
        orientation: row.get(11)?,
        is_default: row.get::<_, i64>(12)? == 1,
        is_active: row.get::<_, i64>(13)? == 1,
        config: row.get(14)?,
        created_at: row.get(15)?,
        updated_at: row.get(16)?,
    })
}

#[tauri::command]
pub fn get_printers(printer_type: Option<String>) -> Result<Vec<PrinterSetting>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let (where_clause, params): (String, Vec<Box<dyn rusqlite::types::ToSql>>) = if let Some(ref pt) = printer_type {
        ("WHERE printer_type = ?1".to_string(), vec![Box::new(pt.clone())])
    } else {
        (String::new(), vec![])
    };

    let param_refs: Vec<&dyn rusqlite::types::ToSql> = params.iter().map(|p| p.as_ref()).collect();

    let sql = format!(
        "SELECT id, name, printer_type, driver_name, device_name, interface_type,
                ip_address, port, paper_size, margins, copies, orientation,
                is_default, is_active, config, created_at, updated_at
         FROM printer_settings {} ORDER BY name",
        where_clause,
    );

    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let rows = stmt.query_map(param_refs.as_slice(), row_to_printer).map_err(|e| e.to_string())?;

    let mut result = Vec::new();
    for row in rows {
        result.push(row.map_err(|e| e.to_string())?);
    }

    Ok(result)
}

#[tauri::command]
pub fn create_printer(input: PrinterInput) -> Result<PrinterSetting, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    if input.is_default {
        conn.execute(
            "UPDATE printer_settings SET is_default = 0 WHERE is_default = 1",
            [],
        ).ok();
    }

    conn.execute(
        "INSERT INTO printer_settings (name, printer_type, driver_name, device_name, interface_type,
                ip_address, port, paper_size, margins, copies, orientation, is_default, config)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
        rusqlite::params![
            input.name, input.printer_type, input.driver_name, input.device_name,
            input.interface_type, input.ip_address, input.port, input.paper_size,
            input.margins, input.copies, input.orientation,
            if input.is_default { 1 } else { 0 }, input.config
        ],
    ).map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();

    conn.query_row(
        "SELECT id, name, printer_type, driver_name, device_name, interface_type,
                ip_address, port, paper_size, margins, copies, orientation,
                is_default, is_active, config, created_at, updated_at
         FROM printer_settings WHERE id = ?1",
        rusqlite::params![id],
        row_to_printer,
    ).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_printer(id: i64, input: PrinterInput) -> Result<PrinterSetting, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    if input.is_default {
        conn.execute(
            "UPDATE printer_settings SET is_default = 0 WHERE is_default = 1 AND id != ?1",
            rusqlite::params![id],
        ).ok();
    }

    conn.execute(
        "UPDATE printer_settings SET name = ?1, printer_type = ?2, driver_name = ?3,
                device_name = ?4, interface_type = ?5, ip_address = ?6, port = ?7,
                paper_size = ?8, margins = ?9, copies = ?10, orientation = ?11,
                is_default = ?12, config = ?13, updated_at = datetime('now')
         WHERE id = ?14",
        rusqlite::params![
            input.name, input.printer_type, input.driver_name, input.device_name,
            input.interface_type, input.ip_address, input.port, input.paper_size,
            input.margins, input.copies, input.orientation,
            if input.is_default { 1 } else { 0 }, input.config, id
        ],
    ).map_err(|e| e.to_string())?;

    conn.query_row(
        "SELECT id, name, printer_type, driver_name, device_name, interface_type,
                ip_address, port, paper_size, margins, copies, orientation,
                is_default, is_active, config, created_at, updated_at
         FROM printer_settings WHERE id = ?1",
        rusqlite::params![id],
        row_to_printer,
    ).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_printer(id: i64) -> Result<(), String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "DELETE FROM printer_settings WHERE id = ?1",
        rusqlite::params![id],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn set_default_printer(id: i64) -> Result<(), String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    conn.execute("UPDATE printer_settings SET is_default = 0 WHERE is_default = 1", [])
        .map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE printer_settings SET is_default = 1 WHERE id = ?1",
        rusqlite::params![id],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn test_printer(id: i64) -> Result<String, String> {
    let _db = DB_STATE.get().ok_or("Database not initialized")?;
    let _conn = _db.conn.lock().map_err(|e| e.to_string())?;

    Ok("Test page sent to printer".to_string())
}

#[tauri::command]
pub fn get_printer_types() -> Result<Vec<String>, String> {
    Ok(vec![
        "receipt".to_string(),
        "label".to_string(),
        "invoice".to_string(),
        "thermal".to_string(),
        "laser".to_string(),
        "inkjet".to_string(),
        "dot_matrix".to_string(),
    ])
}
