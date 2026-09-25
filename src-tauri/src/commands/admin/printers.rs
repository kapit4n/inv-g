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

const PRINTER_COLUMNS: &str = "id, name, printer_type, driver_name, device_name, interface_type,
        ip_address, port, paper_size, margins, copies, orientation,
        is_default, is_active, config, created_at, updated_at";

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

fn query_all_printers(conn: &rusqlite::Connection, printer_type: Option<&str>) -> rusqlite::Result<Vec<PrinterSetting>> {
    let (where_clause, params): (String, Vec<Box<dyn rusqlite::types::ToSql>>) =
        if let Some(pt) = printer_type {
            ("WHERE printer_type = ?1".to_string(), vec![Box::new(pt.to_string())])
        } else {
            (String::new(), vec![])
        };

    let param_refs: Vec<&dyn rusqlite::types::ToSql> = params.iter().map(|p| p.as_ref()).collect();
    let sql = format!(
        "SELECT {} FROM printer_settings {} ORDER BY name",
        PRINTER_COLUMNS, where_clause,
    );

    let mut stmt = conn.prepare(&sql)?;
    let rows = stmt.query_map(param_refs.as_slice(), row_to_printer)?;

    let mut result = Vec::new();
    for row in rows {
        result.push(row?);
    }
    Ok(result)
}

fn clear_default_printer(conn: &rusqlite::Connection, except_id: Option<i64>) -> rusqlite::Result<usize> {
    match except_id {
        Some(id) => conn.execute(
            "UPDATE printer_settings SET is_default = 0 WHERE is_default = 1 AND id != ?1",
            rusqlite::params![id],
        ),
        None => conn.execute(
            "UPDATE printer_settings SET is_default = 0 WHERE is_default = 1",
            [],
        ),
    }
}

fn insert_printer_row(conn: &rusqlite::Connection, input: &PrinterInput) -> rusqlite::Result<PrinterSetting> {
    if input.is_default {
        clear_default_printer(conn, None)?;
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
    )?;

    let id = conn.last_insert_rowid();
    conn.query_row(
        &format!("SELECT {} FROM printer_settings WHERE id = ?1", PRINTER_COLUMNS),
        rusqlite::params![id],
        row_to_printer,
    )
}

fn update_printer_row(conn: &rusqlite::Connection, id: i64, input: &PrinterInput) -> rusqlite::Result<PrinterSetting> {
    if input.is_default {
        clear_default_printer(conn, Some(id))?;
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
    )?;

    conn.query_row(
        &format!("SELECT {} FROM printer_settings WHERE id = ?1", PRINTER_COLUMNS),
        rusqlite::params![id],
        row_to_printer,
    )
}

fn delete_printer_row(conn: &rusqlite::Connection, id: i64) -> rusqlite::Result<usize> {
    conn.execute("DELETE FROM printer_settings WHERE id = ?1", rusqlite::params![id])
}

fn set_default_printer_row(conn: &rusqlite::Connection, id: i64) -> rusqlite::Result<usize> {
    clear_default_printer(conn, None)?;
    conn.execute(
        "UPDATE printer_settings SET is_default = 1 WHERE id = ?1",
        rusqlite::params![id],
    )
}

#[tauri::command]
pub fn get_printers(printer_type: Option<String>) -> Result<Vec<PrinterSetting>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    query_all_printers(&conn, printer_type.as_deref()).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_printer(input: PrinterInput) -> Result<PrinterSetting, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    insert_printer_row(&conn, &input).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_printer(id: i64, input: PrinterInput) -> Result<PrinterSetting, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    update_printer_row(&conn, id, &input).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_printer(id: i64) -> Result<(), String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    delete_printer_row(&conn, id).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn set_default_printer(id: i64) -> Result<(), String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    set_default_printer_row(&conn, id).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn test_printer(id: i64) -> Result<String, String> {
    // Part of the IPC contract: the frontend calls `invoke("test_printer", { id })`.
    let _ = id;
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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::init_database;
    use std::path::PathBuf;

    struct TestDb {
        dir: PathBuf,
    }

    impl TestDb {
        fn new() -> Self {
            let dir = std::env::temp_dir().join(format!("ig_printer_test_{}", uuid::Uuid::new_v4()));
            std::fs::create_dir_all(&dir).expect("create temp dir");
            Self { dir }
        }

        fn conn(&self) -> rusqlite::Connection {
            init_database(self.dir.join("test.db").to_str().expect("utf8 path")).expect("init database")
        }

        fn input(&self, name: &str, is_default: bool) -> PrinterInput {
            PrinterInput {
                name: name.to_string(),
                printer_type: "receipt".to_string(),
                driver_name: None,
                device_name: None,
                interface_type: "usb".to_string(),
                ip_address: None,
                port: None,
                paper_size: "80mm".to_string(),
                margins: r#"{"top":0,"bottom":0,"left":0,"right":0}"#.to_string(),
                copies: 1,
                orientation: "portrait".to_string(),
                is_default,
                config: "{}".to_string(),
            }
        }
    }

    impl Drop for TestDb {
        fn drop(&mut self) {
            let _ = std::fs::remove_dir_all(&self.dir);
        }
    }

    fn count_defaults(conn: &rusqlite::Connection) -> i64 {
        conn.query_row(
            "SELECT COUNT(*) FROM printer_settings WHERE is_default = 1",
            [],
            |row| row.get(0),
        ).unwrap_or(-1)
    }

    #[test]
    fn get_printers_returns_seeded_defaults() {
        let td = TestDb::new();
        let conn = td.conn();
        let printers = query_all_printers(&conn, None).expect("query");

        assert!(printers.len() >= 2);
        let receipt = printers.iter().find(|p| p.name == "Default Receipt Printer").expect("seeded receipt");
        assert_eq!(receipt.printer_type, "receipt");
        assert!(receipt.is_default);
        assert!(receipt.is_active);
    }

    #[test]
    fn get_printers_filters_by_type() {
        let td = TestDb::new();
        let conn = td.conn();
        let receipts = query_all_printers(&conn, Some("receipt")).expect("query");
        assert!(receipts.iter().all(|p| p.printer_type == "receipt"));
    }

    #[test]
    fn create_printer_clears_previous_default() {
        let td = TestDb::new();
        let conn = td.conn();
        assert_eq!(count_defaults(&conn), 1);

        let created = insert_printer_row(&conn, &td.input("POS Thermal", true)).expect("insert");
        assert_eq!(count_defaults(&conn), 1);

        let printers = query_all_printers(&conn, None).expect("query");
        let default = printers.iter().find(|p| p.is_default).expect("one default");
        assert_eq!(default.id, created.id);
        assert_eq!(default.name, "POS Thermal");
    }

    #[test]
    fn update_printer_changes_fields_and_keeps_single_default() {
        let td = TestDb::new();
        let conn = td.conn();
        let created = insert_printer_row(&conn, &td.input("Old Name", false)).expect("insert");

        let mut input = td.input("New Name", true);
        input.paper_size = "58mm".to_string();
        input.printer_type = "label".to_string();
        let updated = update_printer_row(&conn, created.id, &input).expect("update");

        assert_eq!(updated.name, "New Name");
        assert_eq!(updated.paper_size, "58mm");
        assert_eq!(updated.printer_type, "label");
        assert!(updated.is_default);
        assert_eq!(count_defaults(&conn), 1);
    }

    #[test]
    fn set_default_printer_clears_others() {
        let td = TestDb::new();
        let conn = td.conn();
        let a = insert_printer_row(&conn, &td.input("Printer A", true)).expect("insert a");
        let b = insert_printer_row(&conn, &td.input("Printer B", false)).expect("insert b");

        set_default_printer_row(&conn, b.id).expect("set default");
        assert_eq!(count_defaults(&conn), 1);
        assert_ne!(a.id, b.id);

        let printers = query_all_printers(&conn, None).expect("query");
        let default = printers.iter().find(|p| p.is_default).expect("one default");
        assert_eq!(default.id, b.id);
    }

    #[test]
    fn delete_printer_removes_row() {
        let td = TestDb::new();
        let conn = td.conn();
        let created = insert_printer_row(&conn, &td.input("Temp Printer", false)).expect("insert");

        let removed = delete_printer_row(&conn, created.id).expect("delete");
        assert_eq!(removed, 1);

        let printers = query_all_printers(&conn, None).expect("query");
        assert!(!printers.iter().any(|p| p.id == created.id));
    }

    #[test]
    fn get_printer_types_returns_known_types() {
        let types = get_printer_types().expect("types");
        for expected in ["receipt", "label", "invoice", "thermal"] {
            assert!(types.contains(&expected.to_string()));
        }
    }
}
