use serde::{Deserialize, Serialize};
use crate::DB_STATE;
use bcrypt::{hash, DEFAULT_COST};

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AdminUser {
    pub id: i64,
    pub username: String,
    pub email: String,
    pub full_name: String,
    pub phone: Option<String>,
    pub role_id: Option<i64>,
    pub role_name: Option<String>,
    pub is_active: bool,
    pub is_locked: bool,
    pub locked_until: Option<String>,
    pub failed_login_attempts: i64,
    pub password_expires_at: Option<String>,
    pub password_change_required: bool,
    pub last_login_at: Option<String>,
    pub notes: Option<String>,
    pub created_by: Option<i64>,
    pub created_by_name: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateUserInput {
    pub username: String,
    pub email: String,
    pub password: String,
    pub full_name: String,
    pub phone: Option<String>,
    pub role_id: Option<i64>,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateUserInput {
    pub id: i64,
    pub username: Option<String>,
    pub email: Option<String>,
    pub full_name: Option<String>,
    pub phone: Option<String>,
    pub role_id: Option<i64>,
    pub is_active: Option<bool>,
    pub notes: Option<String>,
}

fn row_to_admin_user(row: &rusqlite::Row) -> rusqlite::Result<AdminUser> {
    Ok(AdminUser {
        id: row.get(0)?,
        username: row.get(1)?,
        email: row.get(2)?,
        full_name: row.get(3)?,
        phone: row.get(4)?,
        role_id: row.get(5)?,
        role_name: row.get(6)?,
        is_active: row.get::<_, i64>(7)? == 1,
        is_locked: row.get::<_, i64>(8)? == 1,
        locked_until: row.get(9)?,
        failed_login_attempts: row.get(10)?,
        password_expires_at: row.get(11)?,
        password_change_required: row.get::<_, i64>(12)? == 1,
        last_login_at: row.get(13)?,
        notes: row.get(14)?,
        created_by: row.get(15)?,
        created_by_name: row.get(16)?,
        created_at: row.get(17)?,
        updated_at: row.get(18)?,
    })
}

#[tauri::command]
pub fn get_admin_users(
    search: Option<String>,
    role_id: Option<i64>,
    is_active: Option<bool>,
    page: Option<i64>,
    page_size: Option<i64>,
) -> Result<Vec<AdminUser>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let page = page.unwrap_or(1).max(1);
    let page_size = page_size.unwrap_or(50).max(1).min(200);
    let offset = (page - 1) * page_size;

    let mut conditions = Vec::new();
    let mut params: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();

    if let Some(ref s) = search {
        conditions.push(format!("(u.username LIKE ?{} OR u.email LIKE ?{} OR u.full_name LIKE ?{})",
            params.len() + 1, params.len() + 2, params.len() + 3));
        let pattern = format!("%{}%", s);
        params.push(Box::new(pattern.clone()));
        params.push(Box::new(pattern.clone()));
        params.push(Box::new(pattern));
    }

    if let Some(rid) = role_id {
        conditions.push(format!("u.role_id = ?{}", params.len() + 1));
        params.push(Box::new(rid));
    }

    if let Some(active) = is_active {
        conditions.push(format!("u.is_active = ?{}", params.len() + 1));
        params.push(Box::new(if active { 1 } else { 0 }));
    }

    let where_clause = if conditions.is_empty() {
        String::new()
    } else {
        format!("WHERE {}", conditions.join(" AND "))
    };

    let sql = format!(
        "SELECT u.id, u.username, u.email, u.full_name, u.phone, u.role_id,
                COALESCE(r.name, '') AS role_name, u.is_active, u.is_locked,
                u.locked_until, u.failed_login_attempts, u.password_expires_at,
                u.password_change_required, u.last_login_at, u.notes,
                u.created_by, COALESCE(creator.username, '') AS created_by_name,
                u.created_at, u.updated_at
         FROM users u
         LEFT JOIN roles r ON r.id = u.role_id
         LEFT JOIN users creator ON creator.id = u.created_by
         {} ORDER BY u.created_at DESC LIMIT ?{} OFFSET ?{}",
        where_clause,
        params.len() + 1,
        params.len() + 2,
    );

    params.push(Box::new(page_size));
    params.push(Box::new(offset));

    let param_refs: Vec<&dyn rusqlite::types::ToSql> = params.iter().map(|p| p.as_ref()).collect();

    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let rows = stmt.query_map(param_refs.as_slice(), row_to_admin_user).map_err(|e| e.to_string())?;

    let mut result = Vec::new();
    for row in rows {
        result.push(row.map_err(|e| e.to_string())?);
    }

    Ok(result)
}

#[tauri::command]
pub fn get_admin_user(id: i64) -> Result<AdminUser, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    conn.query_row(
        "SELECT u.id, u.username, u.email, u.full_name, u.phone, u.role_id,
                COALESCE(r.name, '') AS role_name, u.is_active, u.is_locked,
                u.locked_until, u.failed_login_attempts, u.password_expires_at,
                u.password_change_required, u.last_login_at, u.notes,
                u.created_by, COALESCE(creator.username, '') AS created_by_name,
                u.created_at, u.updated_at
         FROM users u
         LEFT JOIN roles r ON r.id = u.role_id
         LEFT JOIN users creator ON creator.id = u.created_by
         WHERE u.id = ?1",
        rusqlite::params![id],
        row_to_admin_user,
    ).map_err(|e| format!("User not found: {}", e))
}

#[tauri::command]
pub fn create_admin_user(input: CreateUserInput, created_by: i64) -> Result<AdminUser, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let password_hash = hash(&input.password, DEFAULT_COST).map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO users (username, email, password_hash, full_name, phone, role_id, notes, created_by)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        rusqlite::params![
            input.username, input.email, password_hash, input.full_name,
            input.phone, input.role_id, input.notes, created_by
        ],
    ).map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();

    conn.execute(
        "INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, severity)
         VALUES (?1, 'create_user', 'user', ?2, 'User created', 'info')",
        rusqlite::params![created_by, id.to_string()],
    ).ok();

    drop(conn);
    get_admin_user(id)
}

#[tauri::command]
pub fn update_admin_user(input: UpdateUserInput) -> Result<AdminUser, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let mut set_clauses = Vec::new();
    let mut params: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();

    if let Some(ref v) = input.username {
        set_clauses.push(format!("username = ?{}", params.len() + 1));
        params.push(Box::new(v.clone()));
    }
    if let Some(ref v) = input.email {
        set_clauses.push(format!("email = ?{}", params.len() + 1));
        params.push(Box::new(v.clone()));
    }
    if let Some(ref v) = input.full_name {
        set_clauses.push(format!("full_name = ?{}", params.len() + 1));
        params.push(Box::new(v.clone()));
    }
    if let Some(ref v) = input.phone {
        set_clauses.push(format!("phone = ?{}", params.len() + 1));
        params.push(Box::new(v.clone()));
    }
    if let Some(v) = input.role_id {
        set_clauses.push(format!("role_id = ?{}", params.len() + 1));
        params.push(Box::new(v));
    }
    if let Some(v) = input.is_active {
        set_clauses.push(format!("is_active = ?{}", params.len() + 1));
        params.push(Box::new(if v { 1 } else { 0 }));
    }
    if let Some(ref v) = input.notes {
        set_clauses.push(format!("notes = ?{}", params.len() + 1));
        params.push(Box::new(v.clone()));
    }

    if set_clauses.is_empty() {
        return Err("No fields to update".to_string());
    }

    set_clauses.push("updated_at = datetime('now')".to_string());

    let sql = format!(
        "UPDATE users SET {} WHERE id = ?{}",
        set_clauses.join(", "),
        params.len() + 1,
    );

    params.push(Box::new(input.id));

    let param_refs: Vec<&dyn rusqlite::types::ToSql> = params.iter().map(|p| p.as_ref()).collect();

    conn.execute(&sql, param_refs.as_slice()).map_err(|e| e.to_string())?;

    drop(conn);
    get_admin_user(input.id)
}

#[tauri::command]
pub fn archive_admin_user(id: i64) -> Result<(), String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE users SET is_active = 0, updated_at = datetime('now') WHERE id = ?1",
        rusqlite::params![id],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn restore_admin_user(id: i64) -> Result<(), String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE users SET is_active = 1, updated_at = datetime('now') WHERE id = ?1",
        rusqlite::params![id],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn reset_user_password(id: i64, new_password: String, require_change: bool) -> Result<(), String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let password_hash = hash(&new_password, DEFAULT_COST).map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE users SET password_hash = ?1, password_change_required = ?2, password_expires_at = datetime('now', '+90 days'), updated_at = datetime('now') WHERE id = ?3",
        rusqlite::params![password_hash, if require_change { 1 } else { 0 }, id],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn lock_user_account(id: i64, duration_minutes: Option<i64>) -> Result<(), String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let locked_until = duration_minutes.map(|m| format!("datetime('now', '+{} minutes')", m))
        .unwrap_or_else(|| "'datetime('now', '+1 hour')'".to_string());

    conn.execute(
        "UPDATE users SET is_locked = 1, locked_until = datetime('now', ?1), updated_at = datetime('now') WHERE id = ?2",
        rusqlite::params![duration_minutes.map_or("+60 minutes".to_string(), |m| format!("+{} minutes", m)), id],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn unlock_user_account(id: i64) -> Result<(), String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE users SET is_locked = 0, locked_until = NULL, failed_login_attempts = 0, updated_at = datetime('now') WHERE id = ?1",
        rusqlite::params![id],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn get_user_sessions(user_id: i64) -> Result<Vec<serde_json::Value>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare(
        "SELECT id, user_id, token, expires_at, is_active, created_at
         FROM user_sessions WHERE user_id = ?1 ORDER BY created_at DESC"
    ).map_err(|e| e.to_string())?;

    let rows = stmt.query_map(rusqlite::params![user_id], |row| {
        Ok(serde_json::json!({
            "id": row.get::<_, i64>(0)?,
            "user_id": row.get::<_, i64>(1)?,
            "token": row.get::<_, String>(2)?,
            "expires_at": row.get::<_, String>(3)?,
            "is_active": row.get::<_, i64>(4)? == 1,
            "created_at": row.get::<_, String>(5)?,
        }))
    }).map_err(|e| e.to_string())?;

    let mut result = Vec::new();
    for row in rows {
        result.push(row.map_err(|e| e.to_string())?);
    }

    Ok(result)
}

#[tauri::command]
pub fn revoke_user_session(session_id: i64) -> Result<(), String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE user_sessions SET is_active = 0 WHERE id = ?1",
        rusqlite::params![session_id],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn get_total_user_count() -> Result<i64, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM users",
        [],
        |row| row.get(0),
    ).map_err(|e| e.to_string())?;

    Ok(count)
}
