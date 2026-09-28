use serde::{Deserialize, Serialize};

use crate::DB_STATE;
use bcrypt::verify;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserResponse {
    pub id: i64,
    pub username: String,
    pub email: String,
    pub full_name: String,
    pub role_id: Option<i64>,
    pub role_name: Option<String>,
    pub is_active: bool,
    /// True when the account still carries its provisioned password. The frontend
    /// gates the whole app behind a forced change while this is set.
    ///
    /// The column has existed since the users table was created and was written by
    /// the admin reset path, but `login` never selected it and this struct never
    /// carried it, so nothing could act on it. It is now returned by both login
    /// paths and by `get_current_user`, so a session restored from local storage
    /// is gated too and not only a fresh login.
    pub password_change_required: bool,
    pub last_login_at: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LoginResponse {
    pub user: UserResponse,
    pub token: String,
    pub permissions: Vec<String>,
}

/// Only used by the RBAC tests, not by any command signature.
#[cfg(test)]
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PermissionInfo {
    pub key: String,
    pub name: String,
    pub group_name: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
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
                u.role_id, u.is_active, u.password_change_required, u.created_at
         FROM users u WHERE u.username = ?1 COLLATE NOCASE AND u.is_active = 1",
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
                row.get::<_, i64>(7)?,
                row.get::<_, String>(8)?,
            ))
        },
    ).map_err(|_| "Credenciales inválidas".to_string())?;

    let (user_id, user_name, email, password_hash, full_name, role_id, is_active, password_change_required, created_at) = user_row;

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
        password_change_required: password_change_required == 1,
        last_login_at: Some(chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string()),
        created_at,
    };

    Ok(LoginResponse { user, token, permissions })
}

#[tauri::command]
pub fn login_by_role(role_name: String) -> Result<LoginResponse, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let role = conn.query_row(
        "SELECT id, name, quick_login_enabled FROM roles WHERE name = ?1 AND is_active = 1",
        rusqlite::params![role_name],
        |row| {
            Ok((
                row.get::<_, i64>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, i64>(2)?,
            ))
        },
    ).map_err(|_| format!("Role '{}' not found", role_name))?;

    let (role_id, _role_name_str, quick_login_enabled) = role;

    // Quick login signs someone in with no password at all, so the role has to
    // have been switched on deliberately. The column defaults to 0, which means
    // every role is denied until the installer config or an administrator enables
    // it — a database that predates the column, or a role nobody listed, is off.
    //
    // Checked here rather than only in the UI: the buttons on the login screen are
    // a convenience, and this is the gate that matters.
    if quick_login_enabled != 1 {
        return Err(format!(
            "El acceso rápido no está habilitado para el rol '{role_name}'."
        ));
    }

    let user_row = conn.query_row(
        "SELECT u.id, u.username, u.email, u.password_hash, u.full_name,
                u.role_id, u.is_active, u.password_change_required, u.created_at
         FROM users u WHERE u.role_id = ?1 AND u.is_active = 1 LIMIT 1",
        rusqlite::params![role_id],
        |row| {
            Ok((
                row.get::<_, i64>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, String>(3)?,
                row.get::<_, String>(4)?,
                row.get::<_, Option<i64>>(5)?,
                row.get::<_, i64>(6)?,
                row.get::<_, i64>(7)?,
                row.get::<_, String>(8)?,
            ))
        },
    ).map_err(|_| format!("No active user found for role '{}'", role_name))?;

    let (user_id, user_name, email, _password_hash, full_name, user_role_id, is_active, password_change_required, created_at) = user_row;

    let token = uuid::Uuid::new_v4().to_string();
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
         VALUES (?1, 'quick_login', 'user', ?2, 'Quick login by role', 'info')",
        rusqlite::params![user_id, user_id.to_string()],
    ).ok();

    let permissions = get_user_permissions(&conn, user_id, user_role_id);

    let user = UserResponse {
        id: user_id,
        username: user_name,
        email,
        full_name,
        role_id: user_role_id,
        role_name: Some(role_name),
        is_active: is_active == 1,
        password_change_required: password_change_required == 1,
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
                u.role_id, u.is_active, u.password_change_required, u.last_login_at, u.created_at
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
                row.get::<_, i64>(6)?,
                row.get::<_, Option<String>>(7)?,
                row.get::<_, String>(8)?,
            ))
        },
    ).map_err(|_| "Usuario no encontrado".to_string())?;

    let (uid, username, email, full_name, role_id, is_active, password_change_required, last_login_at, created_at) = user_row;

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
        password_change_required: password_change_required == 1,
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_user_response_serialization() {
        let user = UserResponse {
            id: 1,
            username: "admin".to_string(),
            email: "admin@test.com".to_string(),
            full_name: "Admin User".to_string(),
            role_id: Some(1),
            role_name: Some("Admin".to_string()),
            is_active: true,
            password_change_required: false,
            last_login_at: None,
            created_at: "2025-01-01T00:00:00Z".to_string(),
        };
        let json = serde_json::to_string(&user).unwrap();
        assert!(json.contains("fullName"));
        assert!(json.contains("isActive"));
        assert!(json.contains("lastLoginAt"));
    }

    #[test]
    fn test_login_response_serialization() {
        let user = UserResponse {
            id: 1,
            username: "admin".to_string(),
            email: "admin@test.com".to_string(),
            full_name: "Admin User".to_string(),
            role_id: Some(1),
            role_name: Some("Admin".to_string()),
            is_active: true,
            password_change_required: false,
            last_login_at: None,
            created_at: "2025-01-01T00:00:00Z".to_string(),
        };
        let resp = LoginResponse {
            user,
            token: "test-token".to_string(),
            permissions: vec!["*".to_string()],
        };
        let json = serde_json::to_string(&resp).unwrap();
        assert!(json.contains("test-token"));
        assert!(json.contains("*"));
    }

    #[test]
    fn test_session_info_serialization() {
        let user = UserResponse {
            id: 1,
            username: "admin".to_string(),
            email: "admin@test.com".to_string(),
            full_name: "Admin User".to_string(),
            role_id: Some(1),
            role_name: Some("Admin".to_string()),
            is_active: true,
            password_change_required: false,
            last_login_at: None,
            created_at: "2025-01-01T00:00:00Z".to_string(),
        };
        let info = SessionInfo {
            user,
            permissions: vec!["read".to_string(), "write".to_string()],
            expires_at: "2099-12-31 23:59:59".to_string(),
        };
        let json = serde_json::to_string(&info).unwrap();
        assert!(json.contains("expiresAt"));
        assert!(json.contains("read"));
        assert!(json.contains("write"));
    }

    #[test]
    fn test_permission_info_defaults() {
        let perm = PermissionInfo {
            key: "inventory.read".to_string(),
            name: "Read Inventory".to_string(),
            group_name: "Inventory".to_string(),
        };
        assert_eq!(perm.key, "inventory.read");
        assert_eq!(perm.group_name, "Inventory");
    }
}

/// Minimum length for a user-chosen password.
///
/// Matches `installer_config::MIN_PASSWORD_LEN` so a password that would be
/// rejected at provisioning is not accepted later either.
const MIN_PASSWORD_LEN: usize = 6;

/// Replaces the signed-in user's password.
///
/// Verifies the current password even though the caller already holds a valid
/// session token. A stolen token alone must not be enough to take the account
/// over: without this, anyone who found a token in local storage could set a new
/// password and keep access after the real user was removed from the device.
///
/// On success the flag that forced this call is cleared, which is what releases
/// the frontend from the change-password screen.
#[tauri::command]
pub fn change_password(
    token: String,
    current_password: String,
    new_password: String,
) -> Result<(), String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let user_id: i64 = conn.query_row(
        "SELECT s.user_id FROM user_sessions s
         JOIN users u ON u.id = s.user_id
         WHERE s.token = ?1 AND s.is_active = 1 AND u.is_active = 1 AND u.is_locked = 0",
        rusqlite::params![token],
        |row| row.get(0),
    ).map_err(|_| "Sesión inválida".to_string())?;

    if new_password.chars().count() < MIN_PASSWORD_LEN {
        return Err(format!(
            "La nueva contraseña debe tener al menos {MIN_PASSWORD_LEN} caracteres."
        ));
    }
    if new_password == current_password {
        return Err("La nueva contraseña debe ser distinta de la actual.".to_string());
    }

    let (username, password_hash) = conn.query_row(
        "SELECT username, password_hash FROM users WHERE id = ?1",
        rusqlite::params![user_id],
        |row| Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?)),
    ).map_err(|_| "Usuario no encontrado".to_string())?;

    let valid = bcrypt::verify(&current_password, &password_hash)
        .map_err(|_| "Error al verificar contraseña")?;
    if !valid {
        return Err("La contraseña actual es incorrecta.".to_string());
    }

    let new_hash = bcrypt::hash(&new_password, bcrypt::DEFAULT_COST)
        .map_err(|e| format!("No se pudo cifrar la nueva contraseña: {e}"))?;

    conn.execute(
        "UPDATE users
         SET password_hash = ?1,
             password_change_required = 0,
             failed_login_attempts = 0,
             password_expires_at = datetime('now', '+90 days'),
             updated_at = datetime('now')
         WHERE id = ?2",
        rusqlite::params![new_hash, user_id],
    )
    .map_err(|e| e.to_string())?;

    // Close every other session, so a password change signs out anyone else
    // holding a token for the account — the usual reason to change a password.
    // The caller's own token is kept, otherwise the user is logged out of the tab
    // they are standing in.
    conn.execute(
        "UPDATE user_sessions SET is_active = 0
         WHERE user_id = ?1 AND token != ?2",
        rusqlite::params![user_id, token],
    )
    .ok();

    conn.execute(
        "INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, severity)
         VALUES (?1, 'change_password', 'user', ?2, 'Usuario cambió su contraseña', 'info')",
        rusqlite::params![user_id, user_id.to_string()],
    )
    .ok();

    log::info!("Contraseña cambiada para '{username}'");
    Ok(())
}

/// Roles that currently allow passwordless quick login, for the login screen.
///
/// Drives the buttons rather than deciding them: the backend still refuses a role
/// that is not in this list, so a stale or tampered response can at worst hide a
/// button, never open a door.
#[tauri::command]
pub fn get_quick_login_roles() -> Result<Vec<String>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT name FROM roles
             WHERE is_active = 1 AND quick_login_enabled = 1
             ORDER BY id",
        )
        .map_err(|e| e.to_string())?;

    let roles = stmt
        .query_map([], |row| row.get::<_, String>(0))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<String>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(roles)
}

/// Turns quick login on or off for a role.
///
/// Separate from the installer config on purpose. The config decides the state a
/// machine ships in; this is how an administrator changes it afterwards without
/// rebuilding an installer. Quick login is deliberately not offered to `owner`:
/// an owner password is the last control on the data, and handing it away by role
/// alone is not a trade most installations want. Owners use the normal form.
#[tauri::command]
pub fn set_role_quick_login(role_name: String, enabled: bool) -> Result<(), String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let is_owner: bool = conn
        .query_row(
            "SELECT name = 'owner' FROM roles WHERE name = ?1",
            rusqlite::params![role_name],
            |row| row.get(0),
        )
        .map_err(|_| format!("El rol '{role_name}' no existe."))?;

    if is_owner && enabled {
        return Err("El acceso rápido no se puede habilitar para el rol 'owner'.".to_string());
    }

    conn.execute(
        "UPDATE roles SET quick_login_enabled = ?1, updated_at = datetime('now') WHERE name = ?2",
        rusqlite::params![if enabled { 1 } else { 0 }, role_name],
    )
    .map_err(|e| e.to_string())?;

    log::info!("Acceso rápido del rol '{role_name}': {enabled}");
    Ok(())
}
