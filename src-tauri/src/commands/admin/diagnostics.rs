use serde::Serialize;
use crate::DB_STATE;

#[derive(Debug, Serialize)]
pub struct DiagnosticCheck {
    pub name: String,
    pub status: String,
    pub message: String,
    pub details: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct DiagnosticReport {
    pub id: i64,
    pub report_type: String,
    pub status: String,
    pub summary: Option<String>,
    pub details: serde_json::Value,
    pub issues_found: i64,
    pub warnings: i64,
    pub created_by: Option<i64>,
    pub created_at: String,
}

#[tauri::command]
pub fn run_diagnostics() -> Result<Vec<DiagnosticCheck>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let mut checks = Vec::new();

    let integrity: String = conn.query_row(
        "PRAGMA integrity_check",
        [],
        |row| row.get(0),
    ).unwrap_or_else(|_| "error".to_string());

    checks.push(DiagnosticCheck {
        name: "Database Integrity".to_string(),
        status: if integrity == "ok" { "healthy".to_string() } else { "critical".to_string() },
        message: if integrity == "ok" { "Database integrity check passed".to_string() } else { "Database integrity issues found".to_string() },
        details: if integrity == "ok" { None } else { Some(integrity) },
    });

    let page_count: i64 = conn.query_row("PRAGMA page_count", [], |row| row.get(0)).unwrap_or(0);
    let page_size: i64 = conn.query_row("PRAGMA page_size", [], |row| row.get(0)).unwrap_or(0);
    let db_size = page_count * page_size;

    checks.push(DiagnosticCheck {
        name: "Storage".to_string(),
        status: if db_size > 0 { "healthy".to_string() } else { "warning".to_string() },
        message: format!("Database size: {} MB", db_size as f64 / 1_048_576.0),
        details: Some(format!("Page count: {}, Page size: {}", page_count, page_size)),
    });

    let freelist: i64 = conn.query_row("PRAGMA freelist_count", [], |row| row.get(0)).unwrap_or(0);
    let total_pages = page_count.max(1);
    let fragmentation = freelist as f64 / total_pages as f64 * 100.0;

    checks.push(DiagnosticCheck {
        name: "Performance".to_string(),
        status: if fragmentation < 20.0 { "healthy".to_string() } else if fragmentation < 50.0 { "warning".to_string() } else { "critical".to_string() },
        message: format!("Database fragmentation: {:.1}%", fragmentation),
        details: Some(format!("Freelist pages: {}", freelist)),
    });

    let user_count: i64 = conn.query_row("SELECT COUNT(*) FROM users", [], |row| row.get(0)).unwrap_or(0);

    checks.push(DiagnosticCheck {
        name: "Users".to_string(),
        status: "healthy".to_string(),
        message: format!("{} registered users", user_count),
        details: None,
    });

    let printer_count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM printer_settings WHERE is_active = 1",
        [],
        |row| row.get(0),
    ).unwrap_or(0);

    checks.push(DiagnosticCheck {
        name: "Printers".to_string(),
        status: if printer_count > 0 { "healthy".to_string() } else { "warning".to_string() },
        message: format!("{} configured printers", printer_count),
        details: None,
    });

    let app_version: String = conn.query_row(
        "SELECT value FROM settings WHERE key = 'app_version'",
        [],
        |row| row.get(0),
    ).unwrap_or_else(|_| "unknown".to_string());

    checks.push(DiagnosticCheck {
        name: "Application Version".to_string(),
        status: "healthy".to_string(),
        message: format!("Version: {}", app_version),
        details: None,
    });

    let schema_version: i64 = conn.query_row("PRAGMA schema_version", [], |row| row.get(0)).unwrap_or(0);

    checks.push(DiagnosticCheck {
        name: "Schema".to_string(),
        status: "healthy".to_string(),
        message: format!("Schema version: {}", schema_version),
        details: None,
    });

    let table_count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM sqlite_master WHERE type='table'",
        [],
        |row| row.get(0),
    ).unwrap_or(0);

    checks.push(DiagnosticCheck {
        name: "Tables".to_string(),
        status: "healthy".to_string(),
        message: format!("{} application tables", table_count),
        details: None,
    });

    Ok(checks)
}

#[tauri::command]
pub fn get_diagnostic_history(limit: Option<i64>) -> Result<Vec<DiagnosticReport>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let limit = limit.unwrap_or(50);

    let mut stmt = conn.prepare(
        "SELECT d.id, d.report_type, d.status, d.summary, d.details, d.issues_found,
                d.warnings, d.created_by, d.created_at
         FROM diagnostic_reports d
         ORDER BY d.created_at DESC LIMIT ?1"
    ).map_err(|e| e.to_string())?;

    let rows = stmt.query_map(rusqlite::params![limit], |row| {
        let details_str: String = row.get::<_, Option<String>>(4)?.unwrap_or_else(|| "{}".to_string());
        let details: serde_json::Value = serde_json::from_str(&details_str).unwrap_or(serde_json::json!({}));

        Ok(DiagnosticReport {
            id: row.get(0)?,
            report_type: row.get(1)?,
            status: row.get(2)?,
            summary: row.get(3)?,
            details,
            issues_found: row.get(5)?,
            warnings: row.get(6)?,
            created_by: row.get(7)?,
            created_at: row.get(8)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut result = Vec::new();
    for row in rows {
        result.push(row.map_err(|e| e.to_string())?);
    }

    Ok(result)
}

#[tauri::command]
pub fn save_diagnostic_report(
    report_type: String,
    status: String,
    summary: String,
    details: serde_json::Value,
    created_by: i64,
) -> Result<(), String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let details_str = serde_json::to_string(&details).map_err(|e| e.to_string())?;
    let issues_found: i64 = 0;
    let warnings: i64 = 0;

    conn.execute(
        "INSERT INTO diagnostic_reports (report_type, status, summary, details, issues_found, warnings, created_by)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        rusqlite::params![report_type, status, summary, details_str, issues_found, warnings, created_by],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn get_diagnostic_summary() -> Result<serde_json::Value, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let healthy: i64 = conn.query_row(
        "SELECT COUNT(*) FROM diagnostic_reports WHERE status = 'healthy'",
        [],
        |row| row.get(0),
    ).unwrap_or(0);

    let warning_count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM diagnostic_reports WHERE status = 'warning'",
        [],
        |row| row.get(0),
    ).unwrap_or(0);

    let critical: i64 = conn.query_row(
        "SELECT COUNT(*) FROM diagnostic_reports WHERE status = 'critical'",
        [],
        |row| row.get(0),
    ).unwrap_or(0);

    let last_report: Option<String> = conn.query_row(
        "SELECT created_at FROM diagnostic_reports ORDER BY created_at DESC LIMIT 1",
        [],
        |row| row.get(0),
    ).ok();

    Ok(serde_json::json!({
        "healthy": healthy,
        "warning": warning_count,
        "critical": critical,
        "total": healthy + warning_count + critical,
        "last_report": last_report,
    }))
}

#[tauri::command]
pub fn get_system_logs(lines: Option<i64>) -> Result<String, String> {
    let lines = lines.unwrap_or(100) as usize;

    let log_dir = dirs::data_dir()
        .unwrap_or_else(|| std::path::PathBuf::from("."))
        .join("inventory-gear");

    let log_files = ["inventory-gear.log", "app.log", "error.log"];
    let mut output = String::new();

    for log_file in &log_files {
        let path = log_dir.join(log_file);
        if path.exists() {
            if let Ok(content) = std::fs::read_to_string(&path) {
                let last_lines: Vec<&str> = content.lines().rev().take(lines).collect::<Vec<_>>();
                last_lines.iter().rev().for_each(|l| {
                    output.push_str(l);
                    output.push('\n');
                });
                break;
            }
        }
    }

    if output.is_empty() {
        output = "No log files found. Log directory: ".to_string();
        output.push_str(&log_dir.to_string_lossy());
    }

    Ok(output)
}

#[tauri::command]
pub fn get_support_package() -> Result<String, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let app_version: String = conn.query_row(
        "SELECT value FROM settings WHERE key = 'app_version'",
        [],
        |row| row.get(0),
    ).unwrap_or_else(|_| "unknown".to_string());

    let page_count: i64 = conn.query_row("PRAGMA page_count", [], |row| row.get(0)).unwrap_or(0);
    let page_size: i64 = conn.query_row("PRAGMA page_size", [], |row| row.get(0)).unwrap_or(0);
    let db_size = page_count * page_size;

    let table_count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM sqlite_master WHERE type='table'",
        [],
        |row| row.get(0),
    ).unwrap_or(0);

    let user_count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM users",
        [],
        |row| row.get(0),
    ).unwrap_or(0);

    let os_info = format!("{}", std::env::consts::OS);

    let info = serde_json::json!({
        "app_version": app_version,
        "database_size_mb": format!("{:.2}", db_size as f64 / 1_048_576.0),
        "table_count": table_count,
        "user_count": user_count,
        "os": os_info,
        "generated_at": chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string(),
    });

    Ok(serde_json::to_string_pretty(&info).map_err(|e| e.to_string())?)
}
