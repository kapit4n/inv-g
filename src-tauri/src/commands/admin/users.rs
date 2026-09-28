use serde::{Deserialize, Serialize};
use crate::DB_STATE;
use bcrypt::{hash, DEFAULT_COST};

/// Password every new user is created with. It is a shared password until the
/// account's owner replaces it: creation always sets `password_change_required`,
/// so the first login is held on the change-password screen.
pub const DEFAULT_USER_PASSWORD: &str = "CHANGEPASSWORD";

/// Permission an administrator needs to create users. Both the `owner` and the
/// `administrator` roles carry it.
pub const USER_MANAGE_PERMISSION: &str = "admin.users.manage";

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
    fetch_admin_user(&conn, id)
}

fn fetch_admin_user(conn: &rusqlite::Connection, id: i64) -> Result<AdminUser, String> {
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

/// Whether a user's role grants the given permission key.
pub(crate) fn user_has_permission(conn: &rusqlite::Connection, user_id: i64, key: &str) -> Result<bool, String> {
    let count: i64 = conn.query_row(
        "SELECT COUNT(*)
         FROM users u
         JOIN role_permissions rp ON rp.role_id = u.role_id
         JOIN permissions p ON p.id = rp.permission_id
         WHERE u.id = ?1 AND p.key = ?2",
        rusqlite::params![user_id, key],
        |row| row.get(0),
    ).map_err(|e| e.to_string())?;
    Ok(count > 0)
}

#[tauri::command]
pub fn create_admin_user(input: CreateUserInput, created_by: i64) -> Result<AdminUser, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    create_admin_user_inner(&conn, input, created_by)
}

/// Pure, DB_STATE-free core of `create_admin_user`, so the defaults and the
/// permission gate can be tested against a disposable connection.
pub fn create_admin_user_inner(
    conn: &rusqlite::Connection,
    input: CreateUserInput,
    created_by: i64,
) -> Result<AdminUser, String> {
    if !user_has_permission(conn, created_by, USER_MANAGE_PERMISSION)? {
        return Err("No tienes permiso para crear usuarios.".to_string());
    }

    // An empty password means "give the user the default shared password".
    // `CHANGEPASSWORD` is not a secret: it is the same for every account until
    // the owner of the account replaces it on their first login.
    let password = if input.password.trim().is_empty() {
        DEFAULT_USER_PASSWORD.to_string()
    } else {
        input.password
    };

    let password_hash = hash(&password, DEFAULT_COST).map_err(|e| e.to_string())?;

    // New users always start on the change-password screen: the default
    // password is shared, so it has to be replaced before the account is used.
    conn.execute(
        "INSERT INTO users (username, email, password_hash, full_name, phone, role_id, notes, created_by, password_change_required, password_expires_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 1, datetime('now', '+90 days'))",
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

    fetch_admin_user(conn, id)
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

/// Restores an account to the shared default password and re-arms the forced
/// first change, so the next sign-in lands on the change-password screen exactly
/// like a freshly created account. A blank password means "the shared default",
/// mirroring `create_admin_user_inner`.
///
/// The permission gate is the same `admin.users.manage` check as user creation:
/// resetting a credential is at least as sensitive as creating the account, and
/// the command is reachable from any authenticated session.
#[tauri::command]
pub fn reset_user_password(
    id: i64,
    new_password: String,
    require_change: bool,
    reset_by: i64,
) -> Result<(), String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    reset_user_password_inner(&conn, id, &new_password, require_change, reset_by)
}

pub fn reset_user_password_inner(
    conn: &rusqlite::Connection,
    id: i64,
    new_password: &str,
    require_change: bool,
    reset_by: i64,
) -> Result<(), String> {
    if !user_has_permission(conn, reset_by, USER_MANAGE_PERMISSION)? {
        return Err("No tienes permiso para restablecer contraseñas.".to_string());
    }

    let password = if new_password.trim().is_empty() {
        DEFAULT_USER_PASSWORD.to_string()
    } else {
        new_password.to_string()
    };
    let password_hash = hash(&password, DEFAULT_COST).map_err(|e| e.to_string())?;

    let changed = conn
        .execute(
            "UPDATE users SET password_hash = ?1, password_change_required = ?2, password_expires_at = datetime('now', '+90 days'), updated_at = datetime('now') WHERE id = ?3",
            rusqlite::params![password_hash, if require_change { 1 } else { 0 }, id],
        )
        .map_err(|e| e.to_string())?;

    if changed == 0 {
        return Err("El usuario no existe.".to_string());
    }

    // Never the password itself: the audit trail records who reset whose
    // credential, and whether the next sign-in must change it.
    let details = if require_change {
        "Password reset; change required on next login"
    } else {
        "Password reset"
    };
    conn.execute(
        "INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, severity)
         VALUES (?1, 'reset_password', 'user', ?2, ?3, 'warning')",
        rusqlite::params![reset_by, id.to_string(), details],
    ).ok();

    Ok(())
}

#[tauri::command]
pub fn lock_user_account(id: i64, duration_minutes: Option<i64>) -> Result<(), String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::config::PROFILE_SINGLE_STORE;
    use crate::db::init_database_with_profile;

    fn test_db() -> rusqlite::Connection {
        let dir = std::env::temp_dir().join(format!("ig_users_test_{}", uuid::Uuid::new_v4()));
        std::fs::create_dir_all(&dir).expect("create temp dir");
        let path = dir.join("users.db");
        init_database_with_profile(path.to_str().unwrap(), PROFILE_SINGLE_STORE).expect("init db")
    }

    fn user_id(conn: &rusqlite::Connection, username: &str) -> i64 {
        conn.query_row(
            "SELECT id FROM users WHERE username = ?1",
            rusqlite::params![username],
            |r| r.get(0),
        )
        .expect("seed user")
    }

    fn create_with_password(
        conn: &rusqlite::Connection,
        username: &str,
        password: &str,
        created_by: i64,
    ) -> Result<AdminUser, String> {
        create_admin_user_inner(
            conn,
            CreateUserInput {
                username: username.to_string(),
                email: format!("{}@test.inv", username),
                password: password.to_string(),
                full_name: "Nuevo Usuario".to_string(),
                phone: None,
                role_id: None,
                notes: None,
            },
            created_by,
        )
    }

    fn stored_password(conn: &rusqlite::Connection, username: &str) -> String {
        conn.query_row(
            "SELECT password_hash FROM users WHERE username = ?1",
            rusqlite::params![username],
            |r| r.get(0),
        )
        .expect("read password hash")
    }

    #[test]
    fn blank_password_becomes_the_default_and_forces_a_change() {
        let conn = test_db();
        let admin = user_id(&conn, "admin");

        let user = create_with_password(&conn, "nuevo1", "", admin).expect("create succeeds");

        assert_eq!(user.username, "nuevo1");
        assert_eq!(user.created_by, Some(admin));
        assert!(user.password_change_required, "new user must change the password");
        assert!(user.password_expires_at.is_some(), "default password should expire");
        assert!(
            bcrypt::verify(DEFAULT_USER_PASSWORD, &stored_password(&conn, "nuevo1"))
                .expect("verify hash"),
            "account must log in with CHANGEPASSWORD"
        );
    }

    #[test]
    fn explicit_password_is_kept_but_still_forces_a_change() {
        let conn = test_db();
        let admin = user_id(&conn, "admin");

        create_with_password(&conn, "nuevo2", "M1PasswordPropio", admin).expect("create succeeds");

        assert!(
            bcrypt::verify("M1PasswordPropio", &stored_password(&conn, "nuevo2"))
                .expect("verify hash"),
            "an explicit password is used as given"
        );
        let required: i64 = conn
            .query_row(
                "SELECT password_change_required FROM users WHERE username = 'nuevo2'",
                [],
                |r| r.get(0),
            )
            .expect("flag");
        assert_eq!(required, 1, "creation always forces the first change");
    }

    #[test]
    fn non_administrator_cannot_create_users() {
        let conn = test_db();
        // `cashier` has no admin.users.manage.
        let cashier = user_id(&conn, "cashier");

        let err = create_with_password(&conn, "nuevo3", "", cashier).expect_err("must be rejected");

        assert!(
            err.contains("permiso"),
            "error should explain the missing permission, got: {err}"
        );
    }

    #[test]
    fn owner_and_administrator_both_may_create_users() {
        let conn = test_db();
        let owner = user_id(&conn, "owner");
        let administrator = user_id(&conn, "admin");

        let a = create_with_password(&conn, "nuevo4", "", owner).expect("owner creates");
        let b = create_with_password(&conn, "nuevo5", "", administrator).expect("administrator creates");

        assert_eq!(a.created_by, Some(owner));
        assert_eq!(b.created_by, Some(administrator));
    }

    #[test]
    fn reset_restores_the_default_password_and_forces_the_first_change() {
        let conn = test_db();
        let admin = user_id(&conn, "admin");

        let created = create_with_password(&conn, "vendedor1", "M1PropioCambiado", admin).expect("create");
        // Simulate the employee having replaced the default with their own.
        reset_user_password_inner(&conn, created.id, "OtraClavePropia", false, admin)
            .expect("reset with an explicit password");

        // A blank password means "the shared default", like creation.
        reset_user_password_inner(&conn, created.id, "", true, admin).expect("reset to the default");

        assert!(
            bcrypt::verify(DEFAULT_USER_PASSWORD, &stored_password(&conn, "vendedor1"))
                .expect("verify hash"),
            "the account is back on the shared default password"
        );

        let (required, expires): (i64, Option<String>) = conn
            .query_row(
                "SELECT password_change_required, password_expires_at FROM users WHERE id = ?1",
                rusqlite::params![created.id],
                |r| Ok((r.get(0)?, r.get(1)?)),
            )
            .expect("read flags");
        assert_eq!(required, 1, "the next sign-in must force a password change");
        assert!(expires.is_some(), "the password expiry is re-armed");

        let audited: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM audit_logs WHERE action = 'reset_password' AND entity_id = ?1
                 AND details = 'Password reset; change required on next login'",
                rusqlite::params![created.id.to_string()],
                |r| r.get(0),
            )
            .expect("read audit");
        assert_eq!(audited, 1, "the forced-change reset is recorded, the plain one is not");
    }

    #[test]
    fn non_administrator_cannot_reset_passwords() {
        let conn = test_db();
        let cashier = user_id(&conn, "cashier");
        let target = user_id(&conn, "viewer");

        let err = reset_user_password_inner(&conn, target, "", true, cashier)
            .expect_err("must be rejected");

        assert!(
            err.contains("permiso"),
            "error should explain the missing permission, got: {err}"
        );
    }

    #[test]
    fn reset_reports_an_unknown_account() {
        let conn = test_db();
        let admin = user_id(&conn, "admin");

        let err = reset_user_password_inner(&conn, 999_999, "", true, admin)
            .expect_err("an unknown id must not silently succeed");

        assert!(err.contains("no existe"), "unexpected error: {err}");
    }
}
