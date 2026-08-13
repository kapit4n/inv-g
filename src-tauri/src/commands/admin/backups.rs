use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::fs;
use std::io::Read;
use std::path::{Path, PathBuf};
use rusqlite::{Connection, OpenFlags};
use crate::DB_STATE;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
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
#[serde(rename_all = "camelCase")]
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

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BackupValidation {
    pub file_name: String,
    pub file_path: String,
    pub file_size: i64,
    pub valid: bool,
    pub sqlite_valid: bool,
    pub integrity_ok: bool,
    pub checksum: String,
    pub checksum_match: Option<bool>,
    pub message: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RestoreInput {
    pub backup_id: Option<i64>,
    pub file_path: Option<String>,
    pub restore_type: Option<String>,
    pub created_by: i64,
}

// ── Pure helpers (testable without DB_STATE) ────────────────────────────────

/// Backups live in `<database directory>/backups`.
fn backup_dir_from_db_path(db_path: &Path) -> PathBuf {
    db_path
        .parent()
        .map(|p| p.join("backups"))
        .unwrap_or_else(|| PathBuf::from("backups"))
}

/// A valid SQLite database always starts with this 16-byte header.
fn sqlite_header_ok(path: &Path) -> bool {
    let mut buf = [0u8; 16];
    let mut file = match fs::File::open(path) {
        Ok(f) => f,
        Err(_) => return false,
    };
    if file.read_exact(&mut buf).is_err() {
        return false;
    }
    buf == *b"SQLite format 3\0"
}

fn quick_check_ok(conn: &Connection) -> bool {
    conn.query_row("PRAGMA quick_check", [], |row| {
        let result: String = row.get(0).unwrap_or_else(|_| "error".to_string());
        Ok(result)
    })
    .map(|r| r == "ok")
    .unwrap_or(false)
}

fn to_hex(bytes: &[u8]) -> String {
    const HEX: &[u8; 16] = b"0123456789abcdef";
    let mut out = String::with_capacity(bytes.len() * 2);
    for b in bytes {
        out.push(HEX[(b >> 4) as usize] as char);
        out.push(HEX[(b & 0x0f) as usize] as char);
    }
    out
}

/// Streaming SHA-256 of a file, hex-encoded (lowercase).
fn checksum_file(path: &Path) -> Result<String, String> {
    let mut file = fs::File::open(path).map_err(|e| format!("Failed to open file: {e}"))?;
    let mut hasher = Sha256::new();
    let mut buf = [0u8; 64 * 1024];
    loop {
        let n = file.read(&mut buf).map_err(|e| format!("Failed to read file: {e}"))?;
        if n == 0 {
            break;
        }
        hasher.update(&buf[..n]);
    }
    Ok(to_hex(&hasher.finalize()))
}

/// Create a consistent snapshot copy of `src` into a new database file at `dest`.
/// Uses the SQLite online backup API so the snapshot includes committed WAL data.
fn write_backup(src: &Connection, dest: &Path) -> Result<(), String> {
    if let Some(parent) = dest.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("Failed to create backup directory: {e}"))?;
    }
    let mut dst = Connection::open(dest).map_err(|e| format!("Failed to open backup file: {e}"))?;
    {
        let backup = rusqlite::backup::Backup::new(src, &mut dst)
            .map_err(|e| format!("Failed to start backup: {e}"))?;
        backup
            .run_to_completion(4096, std::time::Duration::from_millis(5), None)
            .map_err(|e| format!("Backup failed: {e}"))?;
    }
    if !quick_check_ok(&dst) {
        return Err("Backup integrity check failed".to_string());
    }
    Ok(())
}

/// Restore the contents of `src_file` into the live `dst` connection using the
/// SQLite online backup API. The file is validated first by the caller; this
/// function additionally runs an integrity check on the destination afterwards.
fn restore_database_file(src_file: &Path, dst: &mut Connection) -> Result<(), String> {
    let src = Connection::open_with_flags(src_file, OpenFlags::SQLITE_OPEN_READ_ONLY)
        .map_err(|e| format!("Failed to open backup file: {e}"))?;
    {
        let backup = rusqlite::backup::Backup::new(&src, dst)
            .map_err(|e| format!("Failed to start restore: {e}"))?;
        backup
            .run_to_completion(4096, std::time::Duration::from_millis(5), None)
            .map_err(|e| format!("Restore failed: {e}"))?;
    }
    if !quick_check_ok(dst) {
        return Err("Integrity check failed after restore".to_string());
    }
    Ok(())
}

/// Validate a backup file: existence, non-empty, SQLite header, quick integrity
/// check, and (when `expected_checksum` is provided) checksum comparison.
///
/// Hard failures (missing file) return Err. Files that exist but are invalid
/// return Ok with `valid = false` and a human-readable `message`.
fn verify_backup_file(path: &Path, expected_checksum: Option<&str>) -> Result<BackupValidation, String> {
    if !path.exists() {
        return Err(format!("Backup file not found: {}", path.display()));
    }
    let metadata = fs::metadata(path).map_err(|e| format!("Failed to stat backup file: {e}"))?;
    let file_size = metadata.len() as i64;
    let file_name = path
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| path.to_string_lossy().to_string());

    if file_size == 0 {
        return Ok(BackupValidation {
            file_name,
            file_path: path.to_string_lossy().to_string(),
            file_size,
            valid: false,
            sqlite_valid: false,
            integrity_ok: false,
            checksum: String::new(),
            checksum_match: Some(false),
            message: "Backup file is empty".to_string(),
        });
    }

    let checksum = checksum_file(path)?;
    let sqlite_valid = sqlite_header_ok(path);
    let integrity_ok = if sqlite_valid {
        Connection::open_with_flags(path, OpenFlags::SQLITE_OPEN_READ_ONLY)
            .map(|c| quick_check_ok(&c))
            .unwrap_or(false)
    } else {
        false
    };
    let checksum_match = expected_checksum.map(|exp| exp == checksum);
    let valid = sqlite_valid && integrity_ok && checksum_match.unwrap_or(true);

    let mut reasons: Vec<&str> = Vec::new();
    if !sqlite_valid {
        reasons.push("not a valid SQLite database");
    }
    if sqlite_valid && !integrity_ok {
        reasons.push("integrity check failed");
    }
    if matches!(checksum_match, Some(false)) {
        reasons.push("checksum mismatch (file has been modified)");
    }

    Ok(BackupValidation {
        file_name,
        file_path: path.to_string_lossy().to_string(),
        file_size,
        valid,
        sqlite_valid,
        integrity_ok,
        checksum,
        checksum_match,
        message: if valid {
            "Backup is valid".to_string()
        } else {
            format!("Backup is invalid: {}", reasons.join(", "))
        },
    })
}

// ── Command wrappers ────────────────────────────────────────────────────────

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

/// Create a real database backup file and record it in history. The snapshot is
/// written to a temporary file first (so a failed backup never shows up under a
/// real name), then atomically renamed, checksummed, and recorded.
#[tauri::command]
pub fn create_backup(backup_type: String, notes: Option<String>, created_by: i64) -> Result<BackupRecord, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let timestamp = chrono::Utc::now().format("%Y%m%d_%H%M%S").to_string();
    let file_name = format!("inventory_gear_{timestamp}.db");
    let backup_dir = backup_dir_from_db_path(&db.db_path);
    fs::create_dir_all(&backup_dir).map_err(|e| format!("Failed to create backup directory: {e}"))?;

    let dest_path = backup_dir.join(&file_name);
    let tmp_path = backup_dir.join(format!("{file_name}.tmp"));

    let result = (|| {
        write_backup(&conn, &tmp_path)?;
        fs::rename(&tmp_path, &dest_path).map_err(|e| format!("Failed to finalize backup file: {e}"))?;
        let checksum = checksum_file(&dest_path)?;
        let file_size = fs::metadata(&dest_path)
            .map_err(|e| format!("Failed to stat backup file: {e}"))?
            .len() as i64;

        conn.execute(
            "INSERT INTO backup_history (file_name, file_path, file_size, backup_type, compression, encryption, status, checksum, notes, created_by)
             VALUES (?1, ?2, ?3, ?4, 'none', 'none', 'completed', ?5, ?6, ?7)",
            rusqlite::params![
                file_name,
                dest_path.to_string_lossy().to_string(),
                file_size,
                backup_type,
                checksum,
                notes,
                created_by,
            ],
        )
        .map_err(|e| e.to_string())?;

        Ok::<(), String>(())
    })();

    let _ = fs::remove_file(&tmp_path);

    if let Err(e) = result {
        conn.execute(
            "INSERT INTO backup_history (file_name, file_path, file_size, backup_type, compression, encryption, status, notes, created_by)
             VALUES (?1, ?2, 0, ?3, 'none', 'none', 'failed', ?4, ?5)",
            rusqlite::params![file_name, dest_path.to_string_lossy().to_string(), backup_type, format!("Backup failed: {e}"), created_by],
        ).ok();
        return Err(e);
    }

    conn.execute(
        "INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, severity)
         VALUES (?1, 'create_backup', 'backup', ?2, 'Backup created', 'info')",
        rusqlite::params![created_by, file_name],
    ).ok();

    drop(conn);
    let result = get_backup_history(Some(1))?;
    result.into_iter().next().ok_or("Failed to retrieve created backup".to_string())
}

#[tauri::command]
pub fn delete_backup(id: i64, created_by: i64) -> Result<(), String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let path: Option<String> = conn
        .query_row("SELECT file_path FROM backup_history WHERE id = ?1", rusqlite::params![id], |row| row.get(0))
        .ok();

    conn.execute(
        "DELETE FROM backup_history WHERE id = ?1",
        rusqlite::params![id],
    ).map_err(|e| e.to_string())?;

    // Remove the physical file if it still exists; a missing file is not an error.
    if let Some(path) = path {
        let p = PathBuf::from(&path);
        if p.exists() {
            fs::remove_file(&p).map_err(|e| format!("Backup record deleted but file removal failed: {e}"))?;
        }
    }

    conn.execute(
        "INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, severity)
         VALUES (?1, 'delete_backup', 'backup', ?2, 'Backup deleted', 'info')",
        rusqlite::params![created_by, id.to_string()],
    ).ok();

    Ok(())
}

/// Resolve the backup file to validate/inspect. Prefers an explicit file path;
/// otherwise looks up the backup history record by id (and requires it to be
/// completed before it may be restored).
fn resolve_backup_source(
    db: &crate::db::DbState,
    backup_id: Option<i64>,
    file_path: Option<String>,
    require_completed: bool,
) -> Result<(PathBuf, Option<String>), String> {
    if let Some(path) = file_path {
        if path.trim().is_empty() {
            return Err("A backup file path is required".to_string());
        }
        return Ok((PathBuf::from(path), None));
    }
    let id = backup_id.ok_or("Either backup_id or file_path is required")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let row = conn
        .query_row(
            "SELECT file_path, checksum, status FROM backup_history WHERE id = ?1",
            rusqlite::params![id],
            |row| {
                Ok((row.get::<_, String>(0)?, row.get::<_, Option<String>>(1)?, row.get::<_, String>(2)?))
            },
        )
        .map_err(|_| format!("Backup record {id} not found"))?;
    if require_completed && row.2 != "completed" {
        return Err(format!("Cannot restore backup {id}: status is '{}'", row.2));
    }
    Ok((PathBuf::from(row.0), row.1))
}

/// Validate a backup file without touching the live database.
#[tauri::command]
pub fn verify_backup(backup_id: Option<i64>, file_path: Option<String>) -> Result<BackupValidation, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let (path, expected_checksum) = resolve_backup_source(db, backup_id, file_path, false)?;
    verify_backup_file(&path, expected_checksum.as_deref())
}

/// Restore the database from a backup file. The file is fully validated
/// (existence, header, integrity check, checksum) before anything is touched.
/// The restore itself uses the SQLite online backup API into the live
/// connection, followed by a post-restore integrity check. History and audit
/// entries are written after the restore succeeds so they are not rolled back
/// by the restore itself; failures are recorded with the error message.
#[tauri::command]
pub fn restore_backup(input: RestoreInput) -> Result<RestoreRecord, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let restore_type = input.restore_type.clone().unwrap_or_else(|| "complete".to_string());

    let (path, expected_checksum) = resolve_backup_source(db, input.backup_id, input.file_path, true)?;

    let validation = verify_backup_file(&path, expected_checksum.as_deref())?;
    if !validation.valid {
        return Err(validation.message);
    }

    let mut conn = db.conn.lock().map_err(|e| e.to_string())?;
    let restore_result = restore_database_file(&path, &mut conn);

    match restore_result {
        Ok(()) => {
            let file_name = path
                .file_name()
                .map(|n| n.to_string_lossy().to_string())
                .unwrap_or_else(|| path.to_string_lossy().to_string());

            conn.execute(
                "INSERT INTO restore_history (backup_id, file_name, file_path, restore_type, status, tables_restored, created_by)
                 VALUES (?1, ?2, ?3, ?4, 'completed', 'all', ?5)",
                rusqlite::params![input.backup_id, file_name, path.to_string_lossy().to_string(), restore_type, input.created_by],
            ).map_err(|e| e.to_string())?;

            conn.execute(
                "INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, severity)
                 VALUES (?1, 'restore_backup', 'backup', ?2, 'Database restored from backup', 'warning')",
                rusqlite::params![input.created_by, input.backup_id.map(|v| v.to_string()).unwrap_or_else(|| file_name.clone())],
            ).ok();

            drop(conn);
            get_restore_history(Some(1))?
                .into_iter()
                .next()
                .ok_or("Failed to retrieve restore record".to_string())
        }
        Err(e) => {
            conn.execute(
                "INSERT INTO restore_history (backup_id, file_name, file_path, restore_type, status, error_message, created_by)
                 VALUES (?1, ?2, ?3, ?4, 'failed', ?5, ?6)",
                rusqlite::params![
                    input.backup_id,
                    path.file_name().map(|n| n.to_string_lossy().to_string()).unwrap_or_default(),
                    path.to_string_lossy().to_string(),
                    restore_type,
                    e,
                    input.created_by,
                ],
            ).ok();
            Err(format!("Restore failed: {e}"))
        }
    }
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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::init_database;
    use std::io::Write;

    /// Unique temp directory + DB path; auto-removed on drop.
    struct TestDb {
        dir: PathBuf,
        path: PathBuf,
    }

    impl TestDb {
        fn new() -> Self {
            let dir = std::env::temp_dir().join(format!("ig_backup_test_{}", uuid::Uuid::new_v4()));
            fs::create_dir_all(&dir).expect("create temp dir");
            Self { dir: dir.clone(), path: dir.join("test.db") }
        }

        fn conn(&self) -> Connection {
            init_database(self.path.to_str().expect("utf8 path")).expect("init database")
        }
    }

    impl Drop for TestDb {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.dir);
        }
    }

    fn count_settings(conn: &Connection) -> i64 {
        conn.query_row("SELECT COUNT(*) FROM application_settings", [], |row| row.get(0))
            .unwrap_or(0)
    }

    fn backup_path(td: &TestDb, conn: &Connection) -> PathBuf {
        let dest = td.dir.join("backups").join("test_backup.db");
        write_backup(conn, &dest).expect("write backup");
        dest
    }

    #[test]
    fn backup_dir_resolves_next_to_database() {
        assert_eq!(
            backup_dir_from_db_path(Path::new("/data/inventory_gear.db")),
            PathBuf::from("/data/backups")
        );
    }

    #[test]
    fn write_backup_creates_valid_sqlite_file() {
        let td = TestDb::new();
        let conn = td.conn();
        let dest = backup_path(&td, &conn);

        assert!(dest.exists());
        assert!(sqlite_header_ok(&dest));
        let check = Connection::open(&dest).expect("open backup");
        assert!(quick_check_ok(&check));
        assert!(fs::metadata(&dest).expect("size").len() > 0);
    }

    #[test]
    fn backup_snapshot_contains_database_data() {
        let td = TestDb::new();
        let conn = td.conn();
        let before = count_settings(&conn);
        assert!(before > 0);

        let dest = backup_path(&td, &conn);
        let check = Connection::open(&dest).expect("open backup");
        assert_eq!(count_settings(&check), before);
    }

    #[test]
    fn checksum_changes_when_file_is_tampered() {
        let td = TestDb::new();
        let conn = td.conn();
        let dest = backup_path(&td, &conn);
        let original = checksum_file(&dest).expect("checksum");

        let mut file = fs::OpenOptions::new().append(true).open(&dest).expect("append");
        file.write_all(b"TAMPERED").expect("write");

        assert_ne!(checksum_file(&dest).expect("checksum"), original);

        let validation = verify_backup_file(&dest, Some(&original)).expect("verify");
        assert!(!validation.valid);
        assert_eq!(validation.checksum_match, Some(false));
        assert!(validation.message.contains("checksum mismatch"));
    }

    #[test]
    fn verify_reports_missing_file() {
        let td = TestDb::new();
        let missing = td.dir.join("does_not_exist.db");
        let err = verify_backup_file(&missing, None).expect_err("must fail");
        assert!(err.contains("not found"));
    }

    #[test]
    fn verify_reports_corrupt_file() {
        let td = TestDb::new();
        let bad = td.dir.join("corrupt.db");
        fs::write(&bad, b"this is not a sqlite database at all").expect("write");

        let validation = verify_backup_file(&bad, None).expect("verify");
        assert!(!validation.valid);
        assert!(!validation.sqlite_valid);
        assert!(validation.message.contains("not a valid SQLite database"));
    }

    #[test]
    fn verify_rejects_empty_file() {
        let td = TestDb::new();
        let empty = td.dir.join("empty.db");
        fs::write(&empty, b"").expect("write");

        let validation = verify_backup_file(&empty, None).expect("verify");
        assert!(!validation.valid);
        assert!(validation.message.contains("empty"));
    }

    #[test]
    fn restore_replaces_current_data_with_backup() {
        let td = TestDb::new();
        let mut conn = td.conn();

        // Snapshot the current state.
        let dest = backup_path(&td, &conn);
        let before = count_settings(&conn);

        // Mutate the live database: drop one setting and add a marker row.
        conn.execute("DELETE FROM application_settings WHERE key = 'store_name'", []).expect("delete");
        conn.execute(
            "INSERT INTO application_settings (category, key, value, setting_type, description) VALUES ('test', 'zz_marker', '1', 'string', 'marker')",
            [],
        ).expect("insert marker");
        assert_eq!(count_settings(&conn), before); // net zero

        restore_database_file(&dest, &mut conn).expect("restore");

        let after = count_settings(&conn);
        assert_eq!(after, before);
        let store_name: i64 = conn
            .query_row("SELECT COUNT(*) FROM application_settings WHERE key = 'store_name'", [], |row| row.get(0))
            .expect("count");
        assert_eq!(store_name, 1);
        let marker: i64 = conn
            .query_row("SELECT COUNT(*) FROM application_settings WHERE key = 'zz_marker'", [], |row| row.get(0))
            .expect("count");
        assert_eq!(marker, 0);
    }

    #[test]
    fn restore_from_missing_file_fails() {
        let td = TestDb::new();
        let mut conn = td.conn();
        let missing = td.dir.join("missing.db");
        let err = restore_database_file(&missing, &mut conn).expect_err("must fail");
        assert!(!err.is_empty());
    }

    #[test]
    fn restore_from_corrupt_file_fails_and_preserves_error() {
        let td = TestDb::new();
        let mut conn = td.conn();
        let bad = td.dir.join("corrupt.db");
        fs::write(&bad, b"garbage data that is not sqlite").expect("write");

        let err = restore_database_file(&bad, &mut conn).expect_err("must fail");
        assert!(!err.is_empty());

        // The live database must still be usable after the failed restore.
        assert!(quick_check_ok(&conn));
    }
}
