use serde::{Deserialize, Serialize};
use crate::DB_STATE;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SavedReport {
    pub id: i64,
    pub name: String,
    pub description: Option<String>,
    pub module: String,
    pub config: String,
    pub columns: Option<String>,
    pub filters: Option<String>,
    pub sorting: Option<String>,
    pub is_favorite: bool,
    pub version: i64,
    pub created_by: Option<i64>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SavedReportInput {
    pub name: String,
    pub description: Option<String>,
    pub module: String,
    pub config: Option<String>,
    pub columns: Option<String>,
    pub filters: Option<String>,
    pub sorting: Option<String>,
    pub is_favorite: Option<bool>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ScheduledReport {
    pub id: i64,
    pub saved_report_id: Option<i64>,
    pub name: String,
    pub frequency: String,
    pub day_of_week: Option<i64>,
    pub day_of_month: Option<i64>,
    pub time: String,
    pub export_format: String,
    pub destination: String,
    pub recipients: Option<String>,
    pub is_active: bool,
    pub last_run_at: Option<String>,
    pub next_run_at: Option<String>,
    pub created_by: Option<i64>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportHistoryEntry {
    pub id: i64,
    pub report_name: String,
    pub module: String,
    pub filters: Option<String>,
    pub export_format: Option<String>,
    pub execution_time_ms: i64,
    pub row_count: i64,
    pub file_path: Option<String>,
    pub generated_by: Option<i64>,
    pub generated_by_name: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportTemplate {
    pub id: i64,
    pub name: String,
    pub description: Option<String>,
    pub module: String,
    pub config: String,
    pub is_system: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CostHistoryEntry {
    pub id: i64,
    pub product_id: i64,
    pub product_name: String,
    pub product_sku: String,
    pub supplier_id: Option<i64>,
    pub supplier_name: Option<String>,
    pub old_cost: f64,
    pub new_cost: f64,
    pub quantity: i64,
    pub created_by_name: Option<String>,
    pub created_at: String,
}

// ── Saved Reports ──

#[tauri::command]
pub fn get_saved_reports(module: Option<String>) -> Result<Vec<SavedReport>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let (where_clause, params): (String, Vec<Box<dyn rusqlite::types::ToSql>>) = if let Some(ref m) = module {
        ("WHERE module = ?1".into(), vec![Box::new(m.clone()) as Box<dyn rusqlite::types::ToSql>])
    } else { (String::new(), vec![]) };
    let param_refs: Vec<&dyn rusqlite::types::ToSql> = params.iter().map(|p| p.as_ref()).collect();
    let sql = format!("SELECT id, name, description, module, config, columns, filters, sorting, is_favorite, version, created_by, created_at, updated_at FROM saved_reports {} ORDER BY is_favorite DESC, name ASC", where_clause);
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let rows = stmt.query_map(param_refs.as_slice(), |row| {
        Ok(SavedReport { id: row.get(0)?, name: row.get(1)?, description: row.get(2)?, module: row.get(3)?, config: row.get(4)?, columns: row.get(5)?, filters: row.get(6)?, sorting: row.get(7)?, is_favorite: row.get::<_, i64>(8)? != 0, version: row.get(9)?, created_by: row.get(10)?, created_at: row.get(11)?, updated_at: row.get(12)? })
    }).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for row in rows { result.push(row.map_err(|e| e.to_string())?); }
    Ok(result)
}

#[tauri::command]
pub fn create_saved_report(input: SavedReportInput, created_by: i64) -> Result<SavedReport, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute("INSERT INTO saved_reports (name, description, module, config, columns, filters, sorting, is_favorite, created_by) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        rusqlite::params![input.name, input.description, input.module, input.config.unwrap_or_else(|| "{}".into()), input.columns, input.filters, input.sorting, if input.is_favorite.unwrap_or(false) { 1 } else { 0 }, created_by]
    ).map_err(|e| e.to_string())?;
    let id = conn.last_insert_rowid();
    let mut stmt = conn.prepare("SELECT id, name, description, module, config, columns, filters, sorting, is_favorite, version, created_by, created_at, updated_at FROM saved_reports WHERE id = ?1").map_err(|e| e.to_string())?;
    let row = stmt.query_row(rusqlite::params![id], |row| {
        Ok(SavedReport { id: row.get(0)?, name: row.get(1)?, description: row.get(2)?, module: row.get(3)?, config: row.get(4)?, columns: row.get(5)?, filters: row.get(6)?, sorting: row.get(7)?, is_favorite: row.get::<_, i64>(8)? != 0, version: row.get(9)?, created_by: row.get(10)?, created_at: row.get(11)?, updated_at: row.get(12)? })
    }).map_err(|e| e.to_string())?;
    Ok(row)
}

#[tauri::command]
pub fn delete_saved_report(id: i64) -> Result<(), String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM saved_reports WHERE id = ?1", rusqlite::params![id]).map_err(|e| e.to_string())?;
    Ok(())
}

// ── Scheduled Reports ──

#[tauri::command]
pub fn get_scheduled_reports() -> Result<Vec<ScheduledReport>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT id, saved_report_id, name, frequency, day_of_week, day_of_month, time, export_format, destination, recipients, is_active, last_run_at, next_run_at, created_by FROM scheduled_reports ORDER BY name ASC").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(ScheduledReport { id: row.get(0)?, saved_report_id: row.get(1)?, name: row.get(2)?, frequency: row.get(3)?, day_of_week: row.get(4)?, day_of_month: row.get(5)?, time: row.get(6)?, export_format: row.get(7)?, destination: row.get(8)?, recipients: row.get(9)?, is_active: row.get::<_, i64>(10)? != 0, last_run_at: row.get(11)?, next_run_at: row.get(12)?, created_by: row.get(13)? })
    }).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for row in rows { result.push(row.map_err(|e| e.to_string())?); }
    Ok(result)
}

#[tauri::command]
pub fn create_scheduled_report(name: String, saved_report_id: Option<i64>, frequency: String, day_of_week: Option<i64>, day_of_month: Option<i64>, time: String, export_format: String, created_by: i64) -> Result<ScheduledReport, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute("INSERT INTO scheduled_reports (name, saved_report_id, frequency, day_of_week, day_of_month, time, export_format, created_by) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        rusqlite::params![name, saved_report_id, frequency, day_of_week, day_of_month, time, export_format, created_by]
    ).map_err(|e| e.to_string())?;
    let id = conn.last_insert_rowid();
    let mut stmt = conn.prepare("SELECT id, saved_report_id, name, frequency, day_of_week, day_of_month, time, export_format, destination, recipients, is_active, last_run_at, next_run_at, created_by FROM scheduled_reports WHERE id = ?1").map_err(|e| e.to_string())?;
    let row = stmt.query_row(rusqlite::params![id], |row| {
        Ok(ScheduledReport { id: row.get(0)?, saved_report_id: row.get(1)?, name: row.get(2)?, frequency: row.get(3)?, day_of_week: row.get(4)?, day_of_month: row.get(5)?, time: row.get(6)?, export_format: row.get(7)?, destination: row.get(8)?, recipients: row.get(9)?, is_active: row.get::<_, i64>(10)? != 0, last_run_at: row.get(11)?, next_run_at: row.get(12)?, created_by: row.get(13)? })
    }).map_err(|e| e.to_string())?;
    Ok(row)
}

#[tauri::command]
pub fn toggle_scheduled_report(id: i64, is_active: bool) -> Result<(), String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute("UPDATE scheduled_reports SET is_active = ?1 WHERE id = ?2", rusqlite::params![if is_active { 1 } else { 0 }, id]).map_err(|e| e.to_string())?;
    Ok(())
}

// ── Report History ──

#[tauri::command]
pub fn get_report_history(limit: i64) -> Result<Vec<ReportHistoryEntry>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT rh.id, rh.report_name, rh.module, rh.filters, rh.export_format, rh.execution_time_ms, rh.row_count, rh.file_path, rh.generated_by, u.full_name AS generated_by_name, rh.created_at FROM report_history rh LEFT JOIN users u ON u.id = rh.generated_by ORDER BY rh.created_at DESC LIMIT ?1").map_err(|e| e.to_string())?;
    let rows = stmt.query_map(rusqlite::params![limit], |row| {
        Ok(ReportHistoryEntry { id: row.get(0)?, report_name: row.get(1)?, module: row.get(2)?, filters: row.get(3)?, export_format: row.get(4)?, execution_time_ms: row.get(5)?, row_count: row.get(6)?, file_path: row.get(7)?, generated_by: row.get(8)?, generated_by_name: row.get(9)?, created_at: row.get(10)? })
    }).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for row in rows { result.push(row.map_err(|e| e.to_string())?); }
    Ok(result)
}

#[tauri::command]
pub fn log_report_generation(report_name: String, module: String, filters: Option<String>, export_format: Option<String>, execution_time_ms: i64, row_count: i64, file_path: Option<String>, generated_by: i64) -> Result<(), String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute("INSERT INTO report_history (report_name, module, filters, export_format, execution_time_ms, row_count, file_path, generated_by) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        rusqlite::params![report_name, module, filters, export_format, execution_time_ms, row_count, file_path, generated_by]
    ).map_err(|e| e.to_string())?;
    Ok(())
}

// ── Templates ──

#[tauri::command]
pub fn get_report_templates(module: Option<String>) -> Result<Vec<ReportTemplate>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let (where_clause, params): (String, Vec<Box<dyn rusqlite::types::ToSql>>) = if let Some(ref m) = module {
        ("WHERE module = ?1".into(), vec![Box::new(m.clone()) as Box<dyn rusqlite::types::ToSql>])
    } else { (String::new(), vec![]) };
    let param_refs: Vec<&dyn rusqlite::types::ToSql> = params.iter().map(|p| p.as_ref()).collect();
    let sql = format!("SELECT id, name, description, module, config, is_system FROM report_templates {} ORDER BY name ASC", where_clause);
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let rows = stmt.query_map(param_refs.as_slice(), |row| {
        Ok(ReportTemplate { id: row.get(0)?, name: row.get(1)?, description: row.get(2)?, module: row.get(3)?, config: row.get(4)?, is_system: row.get::<_, i64>(5)? != 0 })
    }).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for row in rows { result.push(row.map_err(|e| e.to_string())?); }
    Ok(result)
}

// ── Dashboard Preferences ──

#[tauri::command]
pub fn get_dashboard_preferences(user_id: i64) -> Result<String, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let result: String = conn.query_row(
        "SELECT widgets FROM dashboard_preferences WHERE user_id = ?1",
        rusqlite::params![user_id], |row| row.get(0),
    ).unwrap_or_else(|_| "[]".to_string());
    Ok(result)
}

#[tauri::command]
pub fn save_dashboard_preferences(user_id: i64, widgets: String) -> Result<(), String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute("INSERT INTO dashboard_preferences (user_id, widgets) VALUES (?1, ?2) ON CONFLICT(user_id) DO UPDATE SET widgets = ?2, updated_at = datetime('now')",
        rusqlite::params![user_id, widgets]
    ).map_err(|e| e.to_string())?;
    Ok(())
}
