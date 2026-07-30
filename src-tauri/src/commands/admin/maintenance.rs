use serde::Serialize;
use crate::DB_STATE;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MaintenanceLog {
    pub id: i64,
    pub operation: String,
    pub details: Option<String>,
    pub status: String,
    pub duration_ms: i64,
    pub affected_rows: i64,
    pub error_message: Option<String>,
    pub created_by: Option<i64>,
    pub created_by_name: Option<String>,
    pub created_at: String,
}

#[tauri::command]
pub fn get_maintenance_logs(limit: Option<i64>) -> Result<Vec<MaintenanceLog>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let limit = limit.unwrap_or(50);

    let mut stmt = conn.prepare(
        "SELECT m.id, m.operation, m.details, m.status, m.duration_ms, m.affected_rows,
                m.error_message, m.created_by, COALESCE(u.username, '') AS created_by_name, m.created_at
         FROM maintenance_logs m
         LEFT JOIN users u ON u.id = m.created_by
         ORDER BY m.created_at DESC LIMIT ?1"
    ).map_err(|e| e.to_string())?;

    let rows = stmt.query_map(rusqlite::params![limit], |row| {
        Ok(MaintenanceLog {
            id: row.get(0)?,
            operation: row.get(1)?,
            details: row.get(2)?,
            status: row.get(3)?,
            duration_ms: row.get(4)?,
            affected_rows: row.get(5)?,
            error_message: row.get(6)?,
            created_by: row.get(7)?,
            created_by_name: row.get(8)?,
            created_at: row.get(9)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut result = Vec::new();
    for row in rows {
        result.push(row.map_err(|e| e.to_string())?);
    }

    Ok(result)
}

#[tauri::command]
pub fn run_maintenance(operation: String, created_by: i64) -> Result<serde_json::Value, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let start = std::time::Instant::now();
    let mut status = "completed".to_string();
    let mut details = format!("Operation: {}", operation);
    let mut affected_rows: i64 = 0;
    let mut error_message: Option<String> = None;

    match operation.as_str() {
        "clear_cache" => {
            conn.execute_batch("PRAGMA shrink_memory").ok();
            details = "Memory cache cleared".to_string();
        }
        "optimize_database" => {
            conn.execute_batch("PRAGMA optimize").map_err(|e| {
                error_message = Some(e.to_string());
                status = "failed".to_string();
            }).ok();
            details = "Database optimization completed".to_string();
        }
        "clean_logs" => {
            let deleted = conn.execute(
                "DELETE FROM audit_logs WHERE created_at < datetime('now', '-90 days')",
                [],
            ).unwrap_or(0);
            affected_rows = deleted as i64;
            details = format!("Old audit logs cleaned. {} rows removed.", affected_rows);
        }
        "vacuum" => {
            conn.execute_batch("VACUUM").map_err(|e| {
                error_message = Some(e.to_string());
                status = "failed".to_string();
            }).ok();
            details = "Database vacuum completed".to_string();
        }
        "reindex" => {
            conn.execute_batch("REINDEX").map_err(|e| {
                error_message = Some(e.to_string());
                status = "failed".to_string();
            }).ok();
            details = "Database reindex completed".to_string();
        }
        "integrity_check" => {
            let result: String = conn.query_row(
                "PRAGMA integrity_check",
                [],
                |row| row.get(0),
            ).unwrap_or_else(|_| "error".to_string());
            if result != "ok" {
                error_message = Some(result);
                status = "issues_found".to_string();
            }
            details = "Integrity check completed".to_string();
        }
        _ => {
            status = "failed".to_string();
            error_message = Some(format!("Unknown operation: {}", operation));
        }
    }

    let duration_ms = start.elapsed().as_millis() as i64;

    conn.execute(
        "INSERT INTO maintenance_logs (operation, details, status, duration_ms, affected_rows, error_message, created_by)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        rusqlite::params![operation, details, status, duration_ms, affected_rows, error_message, created_by],
    ).map_err(|e| e.to_string())?;

    Ok(serde_json::json!({
        "operation": operation,
        "status": status,
        "details": details,
        "duration_ms": duration_ms,
        "affected_rows": affected_rows,
        "error": error_message,
    }))
}

#[tauri::command]
pub fn clear_audit_logs(before_days: i64) -> Result<i64, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let deleted = conn.execute(
        "DELETE FROM audit_logs WHERE created_at < datetime('now', ?1)",
        rusqlite::params![format!("-{} days", before_days)],
    ).map_err(|e| e.to_string())?;

    Ok(deleted as i64)
}

#[tauri::command]
pub fn get_storage_info() -> Result<serde_json::Value, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let page_count: i64 = conn.query_row("PRAGMA page_count", [], |row| row.get(0)).unwrap_or(0);
    let page_size: i64 = conn.query_row("PRAGMA page_size", [], |row| row.get(0)).unwrap_or(4096);
    let db_size = page_count * page_size;

    let backup_count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM backup_history",
        [],
        |row| row.get(0),
    ).unwrap_or(0);

    let backup_total_size: i64 = conn.query_row(
        "SELECT COALESCE(SUM(file_size), 0) FROM backup_history",
        [],
        |row| row.get(0),
    ).unwrap_or(0);

    let log_count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM audit_logs",
        [],
        |row| row.get(0),
    ).unwrap_or(0);

    let log_dir = dirs::data_dir()
        .unwrap_or_else(|| std::path::PathBuf::from("."))
        .join("inventory-gear");

    let log_path = log_dir.join("inventory-gear.log");
    let log_size = std::fs::metadata(&log_path).map(|m| m.len() as i64).unwrap_or(0);

    Ok(serde_json::json!({
        "database_size_bytes": db_size,
        "database_size_mb": format!("{:.2}", db_size as f64 / 1_048_576.0),
        "backup_count": backup_count,
        "backup_total_size_bytes": backup_total_size,
        "backup_total_size_mb": format!("{:.2}", backup_total_size as f64 / 1_048_576.0),
        "audit_log_count": log_count,
        "log_size_bytes": log_size,
        "log_size_mb": format!("{:.2}", log_size as f64 / 1_048_576.0),
    }))
}

#[tauri::command]
pub fn get_system_info() -> Result<serde_json::Value, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let app_version: String = conn.query_row(
        "SELECT value FROM settings WHERE key = 'app_version'",
        [],
        |row| row.get(0),
    ).unwrap_or_else(|_| "unknown".to_string());

    let db_version: i64 = conn.query_row("PRAGMA user_version", [], |row| row.get(0)).unwrap_or(0);

    let os = std::env::consts::OS.to_string();
    let arch = std::env::consts::ARCH.to_string();

    Ok(serde_json::json!({
        "app_version": app_version,
        "db_version": db_version,
        "operating_system": os,
        "architecture": arch,
        "hostname": std::env::var("HOSTNAME").unwrap_or_else(|_| "unknown".to_string()),
        "timestamp": chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string(),
    }))
}
