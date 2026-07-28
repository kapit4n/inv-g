use serde::{Deserialize, Serialize};

use crate::DB_STATE;
use bcrypt::verify;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct UserResponse {
    pub id: i64,
    pub username: String,
    pub email: String,
    pub full_name: String,
    pub role_id: Option<i64>,
    pub role_name: Option<String>,
    pub is_active: bool,
    pub last_login_at: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LoginResponse {
    pub user: UserResponse,
    pub token: String,
    pub permissions: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PermissionInfo {
    pub key: String,
    pub name: String,
    pub group_name: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SessionInfo {
    pub user: UserResponse,
    pub permissions: Vec<String>,
    pub expires_at: String,
}

#[tauri::command]
pub fn login(username: String, password: String) -> Result<LoginResponse, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let user_row = conn.query_row(
        "SELECT u.id, u.username, u.email, u.password_hash, u.full_name,
                u.role_id, u.is_active, u.created_at
         FROM users u WHERE u.username = ?1 AND u.is_active = 1",
        rusqlite::params![username],
        |row| {
            Ok((
                row.get::<_, i64>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, String>(3)?,
                row.get::<_, String>(4)?,
                row.get::<_, Option<i64>>(5)?,
                row.get::<_, i64>(6)?,
                row.get::<_, String>(7)?,
            ))
        },
    ).map_err(|_| "Credenciales inválidas".to_string())?;

    let (user_id, user_name, email, password_hash, full_name, role_id, is_active, created_at) = user_row;

    let valid = verify(&password, &password_hash).map_err(|_| "Error al verificar contraseña")?;
    if !valid {
        return Err("Credenciales inválidas".to_string());
    }

    let token = Uuid::new_v4().to_string();
    let expires_at = chrono::Utc::now()
        .checked_add_signed(chrono::Duration::hours(24))
        .unwrap()
        .format("%Y-%m-%d %H:%M:%S")
        .to_string();

    conn.execute(
        "INSERT INTO user_sessions (user_id, token, expires_at) VALUES (?1, ?2, ?3)",
        rusqlite::params![user_id, token, expires_at],
    ).map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE users SET last_login_at = datetime('now') WHERE id = ?1",
        rusqlite::params![user_id],
    ).map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, severity)
         VALUES (?1, 'login', 'user', ?2, 'User logged in', 'info')",
        rusqlite::params![user_id, user_id.to_string()],
    ).ok();

    let role_name: Option<String> = if let Some(rid) = role_id {
        conn.query_row(
            "SELECT name FROM roles WHERE id = ?1",
            rusqlite::params![rid],
            |row| row.get(0),
        ).ok()
    } else {
        None
    };

    let permissions = get_user_permissions(&conn, user_id, role_id);

    let user = UserResponse {
        id: user_id,
        username: user_name,
        email,
        full_name,
        role_id,
        role_name,
        is_active: is_active == 1,
        last_login_at: Some(chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string()),
        created_at,
    };

    Ok(LoginResponse { user, token, permissions })
}

#[tauri::command]
pub fn logout(token: String) -> Result<(), String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE user_sessions SET is_active = 0 WHERE token = ?1",
        rusqlite::params![token],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn get_current_user(token: String) -> Result<SessionInfo, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let session = conn.query_row(
        "SELECT s.user_id, s.expires_at, s.is_active
         FROM user_sessions s WHERE s.token = ?1",
        rusqlite::params![token],
        |row| {
            Ok((
                row.get::<_, i64>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, i64>(2)?,
            ))
        },
    ).map_err(|_| "Sesión no encontrada".to_string())?;

    let (user_id, expires_at, is_active) = session;

    if is_active == 0 {
        return Err("Sesión cerrada".to_string());
    }

    let now = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();
    if expires_at < now {
        conn.execute(
            "UPDATE user_sessions SET is_active = 0 WHERE token = ?1",
            rusqlite::params![token],
        ).ok();
        return Err("Sesión expirada".to_string());
    }

    let user_row = conn.query_row(
        "SELECT u.id, u.username, u.email, u.full_name,
                u.role_id, u.is_active, u.last_login_at, u.created_at
         FROM users u WHERE u.id = ?1",
        rusqlite::params![user_id],
        |row| {
            Ok((
                row.get::<_, i64>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, String>(3)?,
                row.get::<_, Option<i64>>(4)?,
                row.get::<_, i64>(5)?,
                row.get::<_, Option<String>>(6)?,
                row.get::<_, String>(7)?,
            ))
        },
    ).map_err(|_| "Usuario no encontrado".to_string())?;

    let (uid, username, email, full_name, role_id, is_active, last_login_at, created_at) = user_row;

    let role_name: Option<String> = if let Some(rid) = role_id {
        conn.query_row(
            "SELECT name FROM roles WHERE id = ?1",
            rusqlite::params![rid],
            |row| row.get(0),
        ).ok()
    } else {
        None
    };

    let permissions = get_user_permissions(&conn, uid, role_id);

    let user = UserResponse {
        id: uid,
        username,
        email,
        full_name,
        role_id,
        role_name,
        is_active: is_active == 1,
        last_login_at,
        created_at,
    };

    Ok(SessionInfo { user, permissions, expires_at })
}

#[tauri::command]
pub fn check_session(token: String) -> Result<bool, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let result: Result<(i64, String, i64), _> = conn.query_row(
        "SELECT s.id, s.expires_at, s.is_active
         FROM user_sessions s WHERE s.token = ?1",
        rusqlite::params![token],
        |row| {
            Ok((
                row.get::<_, i64>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, i64>(2)?,
            ))
        },
    );

    match result {
        Ok((_, expires_at, is_active)) => {
            if is_active == 0 {
                return Ok(false);
            }
            let now = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();
            Ok(expires_at >= now)
        }
        Err(_) => Ok(false),
    }
}

#[tauri::command]
pub fn get_user_permissions_list(token: String) -> Result<Vec<String>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let user_id: i64 = conn.query_row(
        "SELECT s.user_id FROM user_sessions s WHERE s.token = ?1 AND s.is_active = 1",
        rusqlite::params![token],
        |row| row.get(0),
    ).map_err(|_| "Sesión inválida".to_string())?;

    let role_id: Option<i64> = conn.query_row(
        "SELECT role_id FROM users WHERE id = ?1",
        rusqlite::params![user_id],
        |row| row.get(0),
    ).ok().flatten();

    Ok(get_user_permissions(&conn, user_id, role_id))
}

fn get_user_permissions(conn: &rusqlite::Connection, _user_id: i64, role_id: Option<i64>) -> Vec<String> {
    let mut permissions = Vec::new();

    if let Some(rid) = role_id {
        let mut stmt = conn.prepare(
            "SELECT p.key FROM permissions p
             JOIN role_permissions rp ON rp.permission_id = p.id
             WHERE rp.role_id = ?1
             ORDER BY p.key"
        ).ok();

        if let Some(ref mut stmt) = stmt {
            if let Ok(rows) = stmt.query_map(rusqlite::params![rid], |row| row.get::<_, String>(0)) {
                for row in rows.flatten() {
                    permissions.push(row);
                }
            }
        }
    }

    permissions
}
