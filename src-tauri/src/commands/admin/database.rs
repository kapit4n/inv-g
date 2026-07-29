use serde::Serialize;
use crate::DB_STATE;

#[derive(Debug, Serialize)]
pub struct TableInfo {
    pub name: String,
    pub row_count: i64,
    pub page_count: i64,
}

#[derive(Debug, Serialize)]
pub struct DatabaseStats {
    pub page_size: i64,
    pub page_count: i64,
    pub total_size: i64,
    pub table_count: i64,
    pub index_count: i64,
    pub integrity_ok: bool,
    pub freelist_count: i64,
    pub schema_version: i64,
}

#[derive(Debug, Serialize)]
pub struct MigrationInfo {
    pub version: i64,
    pub applied_at: Option<String>,
}

#[tauri::command]
pub fn get_database_stats() -> Result<DatabaseStats, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let page_size: i64 = conn.query_row("PRAGMA page_size", [], |row| row.get(0)).unwrap_or(0);
    let page_count: i64 = conn.query_row("PRAGMA page_count", [], |row| row.get(0)).unwrap_or(0);
    let total_size = page_size * page_count;

    let table_count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table'",
        [],
        |row| row.get(0),
    ).unwrap_or(0);

    let index_count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM sqlite_master WHERE type = 'index'",
        [],
        |row| row.get(0),
    ).unwrap_or(0);

    let integrity: String = conn.query_row(
        "PRAGMA integrity_check",
        [],
        |row| row.get(0),
    ).unwrap_or_else(|_| "error".to_string());

    let freelist_count: i64 = conn.query_row(
        "PRAGMA freelist_count",
        [],
        |row| row.get(0),
    ).unwrap_or(0);

    let schema_version: i64 = conn.query_row(
        "PRAGMA schema_version",
        [],
        |row| row.get(0),
    ).unwrap_or(0);

    Ok(DatabaseStats {
        page_size,
        page_count,
        total_size,
        table_count,
        index_count,
        integrity_ok: integrity == "ok",
        freelist_count,
        schema_version,
    })
}

#[tauri::command]
pub fn get_table_sizes() -> Result<Vec<TableInfo>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let mut table_stmt = conn.prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name"
    ).map_err(|e| e.to_string())?;

    let tables: Vec<String> = table_stmt.query_map([], |row| row.get::<_, String>(0))
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    let mut result = Vec::new();
    for table_name in tables {
        let count: i64 = conn.query_row(
            &format!("SELECT COUNT(*) FROM \"{}\"", table_name),
            [],
            |row| row.get(0),
        ).unwrap_or(0);

        let page_est: i64 = conn.query_row(
            &format!("PRAGMA table_info(\"{}\")", table_name),
            [],
            |_| Ok(1),
        ).unwrap_or(0);

        result.push(TableInfo {
            name: table_name,
            row_count: count,
            page_count: (count / 50).max(1),
        });
    }

    Ok(result)
}

#[tauri::command]
pub fn vacuum_database() -> Result<String, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let before: i64 = conn.query_row("PRAGMA page_count", [], |row| row.get(0)).unwrap_or(0);

    conn.execute_batch("VACUUM").map_err(|e| e.to_string())?;

    let after: i64 = conn.query_row("PRAGMA page_count", [], |row| row.get(0)).unwrap_or(0);
    let freed = before - after;

    Ok(format!("Vacuum completed. Freed {} pages ({} bytes)", freed, freed * 4096))
}

#[tauri::command]
pub fn optimize_database() -> Result<String, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    conn.execute_batch("PRAGMA optimize").map_err(|e| e.to_string())?;

    Ok("Database optimization completed".to_string())
}

#[tauri::command]
pub fn check_database_integrity() -> Result<String, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let result: String = conn.query_row(
        "PRAGMA integrity_check",
        [],
        |row| row.get(0),
    ).map_err(|e| e.to_string())?;

    if result == "ok" {
        Ok("Database integrity check passed".to_string())
    } else {
        Ok(format!("Integrity issues found:\n{}", result))
    }
}

#[tauri::command]
pub fn get_migration_status() -> Result<Vec<MigrationInfo>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let user_version: i64 = conn.query_row(
        "PRAGMA user_version",
        [],
        |row| row.get(0),
    ).unwrap_or(0);

    let mut result = Vec::new();
    for v in 1..=user_version {
        result.push(MigrationInfo {
            version: v,
            applied_at: Some("migrated".to_string()),
        });
    }

    if result.is_empty() {
        result.push(MigrationInfo {
            version: 0,
            applied_at: None,
        });
    }

    Ok(result)
}

#[tauri::command]
pub fn reindex_database() -> Result<String, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    conn.execute_batch("REINDEX").map_err(|e| e.to_string())?;

    Ok("Database reindex completed".to_string())
}
