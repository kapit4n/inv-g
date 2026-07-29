use serde::{Deserialize, Serialize};
use crate::DB_STATE;

#[derive(Debug, Serialize)]
pub struct AdminRole {
    pub id: i64,
    pub name: String,
    pub description: Option<String>,
    pub is_system: bool,
    pub is_active: bool,
    pub permission_count: i64,
    pub user_count: i64,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize)]
pub struct AdminPermission {
    pub id: i64,
    pub key: String,
    pub name: String,
    pub group_name: String,
    pub description: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct RoleWithPermissions {
    pub role: AdminRole,
    pub permissions: Vec<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateRoleInput {
    pub name: String,
    pub description: Option<String>,
    pub permissions: Vec<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateRoleInput {
    pub id: i64,
    pub name: Option<String>,
    pub description: Option<String>,
    pub is_active: Option<bool>,
    pub permissions: Vec<String>,
}

#[tauri::command]
pub fn get_admin_roles(search: Option<String>) -> Result<Vec<AdminRole>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let (where_clause, params): (String, Vec<Box<dyn rusqlite::types::ToSql>>) = if let Some(ref s) = search {
        let pattern = format!("%{}%", s);
        ("WHERE r.name LIKE ?1 OR COALESCE(r.description, '') LIKE ?2".to_string(),
         vec![Box::new(pattern.clone()), Box::new(pattern)])
    } else {
        (String::new(), vec![])
    };

    let param_refs: Vec<&dyn rusqlite::types::ToSql> = params.iter().map(|p| p.as_ref()).collect();

    let sql = format!(
        "SELECT r.id, r.name, r.description, r.is_system, r.is_active,
                (SELECT COUNT(*) FROM role_permissions rp WHERE rp.role_id = r.id) AS permission_count,
                (SELECT COUNT(*) FROM users u WHERE u.role_id = r.id) AS user_count,
                r.created_at, r.updated_at
         FROM roles r {} ORDER BY r.name ASC",
        where_clause,
    );

    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let rows = stmt.query_map(param_refs.as_slice(), |row| {
        Ok(AdminRole {
            id: row.get(0)?,
            name: row.get(1)?,
            description: row.get(2)?,
            is_system: row.get::<_, i64>(3)? == 1,
            is_active: row.get::<_, i64>(4)? == 1,
            permission_count: row.get(5)?,
            user_count: row.get(6)?,
            created_at: row.get(7)?,
            updated_at: row.get(8)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut result = Vec::new();
    for row in rows {
        result.push(row.map_err(|e| e.to_string())?);
    }

    Ok(result)
}

#[tauri::command]
pub fn get_admin_role(id: i64) -> Result<RoleWithPermissions, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let role = conn.query_row(
        "SELECT r.id, r.name, r.description, r.is_system, r.is_active,
                (SELECT COUNT(*) FROM role_permissions rp WHERE rp.role_id = r.id) AS permission_count,
                (SELECT COUNT(*) FROM users u WHERE u.role_id = r.id) AS user_count,
                r.created_at, r.updated_at
         FROM roles r WHERE r.id = ?1",
        rusqlite::params![id],
        |row| {
            Ok(AdminRole {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                is_system: row.get::<_, i64>(3)? == 1,
                is_active: row.get::<_, i64>(4)? == 1,
                permission_count: row.get(5)?,
                user_count: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            })
        },
    ).map_err(|e| format!("Role not found: {}", e))?;

    let mut stmt = conn.prepare(
        "SELECT p.key FROM permissions p
         JOIN role_permissions rp ON rp.permission_id = p.id
         WHERE rp.role_id = ?1 ORDER BY p.key"
    ).map_err(|e| e.to_string())?;

    let rows = stmt.query_map(rusqlite::params![id], |row| row.get::<_, String>(0))
        .map_err(|e| e.to_string())?;

    let mut permissions = Vec::new();
    for row in rows {
        permissions.push(row.map_err(|e| e.to_string())?);
    }

    Ok(RoleWithPermissions { role, permissions })
}

#[tauri::command]
pub fn get_all_permissions(search: Option<String>, group: Option<String>) -> Result<Vec<AdminPermission>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let mut conditions = Vec::new();
    let mut params: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();

    if let Some(ref g) = group {
        conditions.push(format!("p.group_name = ?{}", params.len() + 1));
        params.push(Box::new(g.clone()));
    }

    if let Some(ref s) = search {
        conditions.push(format!("(p.key LIKE ?{} OR p.name LIKE ?{})", params.len() + 1, params.len() + 2));
        let pattern = format!("%{}%", s);
        params.push(Box::new(pattern.clone()));
        params.push(Box::new(pattern));
    }

    let where_clause = if conditions.is_empty() {
        String::new()
    } else {
        format!("WHERE {}", conditions.join(" AND "))
    };

    let param_refs: Vec<&dyn rusqlite::types::ToSql> = params.iter().map(|p| p.as_ref()).collect();

    let sql = format!("SELECT p.id, p.key, p.name, p.group_name, p.description FROM permissions p {} ORDER BY p.group_name, p.key", where_clause);

    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let rows = stmt.query_map(param_refs.as_slice(), |row| {
        Ok(AdminPermission {
            id: row.get(0)?,
            key: row.get(1)?,
            name: row.get(2)?,
            group_name: row.get(3)?,
            description: row.get(4)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut result = Vec::new();
    for row in rows {
        result.push(row.map_err(|e| e.to_string())?);
    }

    Ok(result)
}

#[tauri::command]
pub fn get_permission_groups() -> Result<Vec<String>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare(
        "SELECT DISTINCT group_name FROM permissions ORDER BY group_name"
    ).map_err(|e| e.to_string())?;

    let rows = stmt.query_map([], |row| row.get::<_, String>(0))
        .map_err(|e| e.to_string())?;

    let mut result = Vec::new();
    for row in rows {
        result.push(row.map_err(|e| e.to_string())?);
    }

    Ok(result)
}

#[tauri::command]
pub fn create_admin_role(input: CreateRoleInput) -> Result<AdminRole, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO roles (name, description) VALUES (?1, ?2)",
        rusqlite::params![input.name, input.description],
    ).map_err(|e| e.to_string())?;

    let role_id = conn.last_insert_rowid();

    for perm_key in &input.permissions {
        if let Ok(perm_id) = conn.query_row::<i64, _, _>(
            "SELECT id FROM permissions WHERE key = ?1",
            rusqlite::params![perm_key],
            |row| row.get(0),
        ) {
            conn.execute(
                "INSERT INTO role_permissions (role_id, permission_id) VALUES (?1, ?2)",
                rusqlite::params![role_id, perm_id],
            ).ok();
        }
    }

    drop(conn);
    let result = get_admin_role(role_id)?;
    Ok(result.role)
}

#[tauri::command]
pub fn update_admin_role(input: UpdateRoleInput) -> Result<AdminRole, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let mut set_clauses = Vec::new();
    let mut params: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();

    if let Some(ref v) = input.name {
        set_clauses.push(format!("name = ?{}", params.len() + 1));
        params.push(Box::new(v.clone()));
    }
    if let Some(ref v) = input.description {
        set_clauses.push(format!("description = ?{}", params.len() + 1));
        params.push(Box::new(v.clone()));
    }
    if let Some(v) = input.is_active {
        set_clauses.push(format!("is_active = ?{}", params.len() + 1));
        params.push(Box::new(if v { 1 } else { 0 }));
    }

    if !set_clauses.is_empty() {
        set_clauses.push("updated_at = datetime('now')".to_string());
        let sql = format!(
            "UPDATE roles SET {} WHERE id = ?{}",
            set_clauses.join(", "),
            params.len() + 1,
        );
        params.push(Box::new(input.id));
        let param_refs: Vec<&dyn rusqlite::types::ToSql> = params.iter().map(|p| p.as_ref()).collect();
        conn.execute(&sql, param_refs.as_slice()).map_err(|e| e.to_string())?;
    }

    conn.execute(
        "DELETE FROM role_permissions WHERE role_id = ?1",
        rusqlite::params![input.id],
    ).map_err(|e| e.to_string())?;

    for perm_key in &input.permissions {
        if let Ok(perm_id) = conn.query_row::<i64, _, _>(
            "SELECT id FROM permissions WHERE key = ?1",
            rusqlite::params![perm_key],
            |row| row.get(0),
        ) {
            conn.execute(
                "INSERT INTO role_permissions (role_id, permission_id) VALUES (?1, ?2)",
                rusqlite::params![input.id, perm_id],
            ).ok();
        }
    }

    drop(conn);
    let result = get_admin_role(input.id)?;
    Ok(result.role)
}

#[tauri::command]
pub fn clone_admin_role(id: i64, new_name: String) -> Result<AdminRole, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let source = conn.query_row(
        "SELECT description, is_system, is_active FROM roles WHERE id = ?1",
        rusqlite::params![id],
        |row| Ok((row.get::<_, Option<String>>(0)?, row.get::<_, i64>(1)?, row.get::<_, i64>(2)?)),
    ).map_err(|_| "Source role not found".to_string())?;

    let (description, _is_system, is_active) = source;

    conn.execute(
        "INSERT INTO roles (name, description, is_active) VALUES (?1, ?2, ?3)",
        rusqlite::params![new_name, description, is_active],
    ).map_err(|e| e.to_string())?;

    let new_id = conn.last_insert_rowid();

    conn.execute(
        "INSERT INTO role_permissions (role_id, permission_id)
         SELECT ?1, permission_id FROM role_permissions WHERE role_id = ?2",
        rusqlite::params![new_id, id],
    ).map_err(|e| e.to_string())?;

    drop(conn);
    let result = get_admin_role(new_id)?;
    Ok(result.role)
}

#[tauri::command]
pub fn archive_admin_role(id: i64) -> Result<(), String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE roles SET is_active = 0, updated_at = datetime('now') WHERE id = ?1 AND is_system = 0",
        rusqlite::params![id],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn assign_permissions_to_role(role_id: i64, permission_keys: Vec<String>) -> Result<(), String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "DELETE FROM role_permissions WHERE role_id = ?1",
        rusqlite::params![role_id],
    ).map_err(|e| e.to_string())?;

    for key in &permission_keys {
        if let Ok(perm_id) = conn.query_row::<i64, _, _>(
            "SELECT id FROM permissions WHERE key = ?1",
            rusqlite::params![key],
            |row| row.get(0),
        ) {
            conn.execute(
                "INSERT INTO role_permissions (role_id, permission_id) VALUES (?1, ?2)",
                rusqlite::params![role_id, perm_id],
            ).ok();
        }
    }

    Ok(())
}

#[tauri::command]
pub fn bulk_assign_permissions(role_ids: Vec<i64>, permission_keys: Vec<String>, assign: bool) -> Result<(), String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    for role_id in &role_ids {
        if assign {
            for key in &permission_keys {
                if let Ok(perm_id) = conn.query_row::<i64, _, _>(
                    "SELECT id FROM permissions WHERE key = ?1",
                    rusqlite::params![key],
                    |row| row.get(0),
                ) {
                    conn.execute(
                        "INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?1, ?2)",
                        rusqlite::params![role_id, perm_id],
                    ).ok();
                }
            }
        } else {
            for key in &permission_keys {
                if let Ok(perm_id) = conn.query_row::<i64, _, _>(
                    "SELECT id FROM permissions WHERE key = ?1",
                    rusqlite::params![key],
                    |row| row.get(0),
                ) {
                    conn.execute(
                        "DELETE FROM role_permissions WHERE role_id = ?1 AND permission_id = ?2",
                        rusqlite::params![role_id, perm_id],
                    ).ok();
                }
            }
        }
    }

    Ok(())
}
