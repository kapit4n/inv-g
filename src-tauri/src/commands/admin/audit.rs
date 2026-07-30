use serde::{Deserialize, Serialize};
use crate::DB_STATE;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AuditEvent {
    pub id: i64,
    pub user_id: Option<i64>,
    pub username: String,
    pub full_name: String,
    pub action: String,
    pub entity_type: Option<String>,
    pub entity_id: Option<String>,
    pub details: Option<String>,
    pub severity: String,
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuditFilter {
    pub action: Option<String>,
    pub entity_type: Option<String>,
    pub severity: Option<String>,
    pub user_id: Option<i64>,
    pub date_from: Option<String>,
    pub date_to: Option<String>,
    pub search: Option<String>,
}

fn build_audit_query(
    filter: &Option<AuditFilter>,
    page: i64,
    page_size: i64,
) -> (String, Vec<Box<dyn rusqlite::types::ToSql>>) {
    let mut conditions = Vec::new();
    let mut params: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();

    if let Some(ref f) = filter {
        if let Some(ref a) = f.action {
            conditions.push(format!("a.action = ?{}", params.len() + 1));
            params.push(Box::new(a.clone()));
        }
        if let Some(ref et) = f.entity_type {
            conditions.push(format!("a.entity_type = ?{}", params.len() + 1));
            params.push(Box::new(et.clone()));
        }
        if let Some(ref s) = f.severity {
            conditions.push(format!("a.severity = ?{}", params.len() + 1));
            params.push(Box::new(s.clone()));
        }
        if let Some(uid) = f.user_id {
            conditions.push(format!("a.user_id = ?{}", params.len() + 1));
            params.push(Box::new(uid));
        }
        if let Some(ref df) = f.date_from {
            conditions.push(format!("a.created_at >= ?{}", params.len() + 1));
            params.push(Box::new(df.clone()));
        }
        if let Some(ref dt) = f.date_to {
            conditions.push(format!("a.created_at <= ?{}", params.len() + 1));
            params.push(Box::new(dt.clone()));
        }
        if let Some(ref s) = f.search {
            conditions.push(format!(
                "(a.action LIKE ?{} OR a.entity_type LIKE ?{} OR a.entity_id LIKE ?{} OR COALESCE(a.details, '') LIKE ?{})",
                params.len() + 1, params.len() + 2, params.len() + 3, params.len() + 4
            ));
            let pattern = format!("%{}%", s);
            params.push(Box::new(pattern.clone()));
            params.push(Box::new(pattern.clone()));
            params.push(Box::new(pattern.clone()));
            params.push(Box::new(pattern));
        }
    }

    let where_clause = if conditions.is_empty() {
        String::new()
    } else {
        format!("WHERE {}", conditions.join(" AND "))
    };

    let sql = format!(
        "SELECT a.id, a.user_id, COALESCE(u.username, '') AS username,
                COALESCE(u.full_name, '') AS full_name,
                a.action, a.entity_type, a.entity_id, a.details, a.severity, a.created_at
         FROM audit_logs a
         LEFT JOIN users u ON u.id = a.user_id
         {} ORDER BY a.created_at DESC LIMIT ?{} OFFSET ?{}",
        where_clause,
        params.len() + 1,
        params.len() + 2,
    );

    params.push(Box::new(page_size));
    params.push(Box::new((page - 1) * page_size));

    (sql, params)
}

#[tauri::command]
pub fn get_audit_events(
    filter: Option<AuditFilter>,
    page: Option<i64>,
    page_size: Option<i64>,
) -> Result<Vec<AuditEvent>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let page = page.unwrap_or(1).max(1);
    let page_size = page_size.unwrap_or(50).max(1).min(200);

    let (sql, params) = build_audit_query(&filter, page, page_size);
    let param_refs: Vec<&dyn rusqlite::types::ToSql> = params.iter().map(|p| p.as_ref()).collect();

    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let rows = stmt.query_map(param_refs.as_slice(), |row| {
        Ok(AuditEvent {
            id: row.get(0)?,
            user_id: row.get(1)?,
            username: row.get(2)?,
            full_name: row.get(3)?,
            action: row.get(4)?,
            entity_type: row.get(5)?,
            entity_id: row.get(6)?,
            details: row.get(7)?,
            severity: row.get(8)?,
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
pub fn get_audit_event(id: i64) -> Result<AuditEvent, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    conn.query_row(
        "SELECT a.id, a.user_id, COALESCE(u.username, '') AS username,
                COALESCE(u.full_name, '') AS full_name,
                a.action, a.entity_type, a.entity_id, a.details, a.severity, a.created_at
         FROM audit_logs a
         LEFT JOIN users u ON u.id = a.user_id
         WHERE a.id = ?1",
        rusqlite::params![id],
        |row| {
            Ok(AuditEvent {
                id: row.get(0)?,
                user_id: row.get(1)?,
                username: row.get(2)?,
                full_name: row.get(3)?,
                action: row.get(4)?,
                entity_type: row.get(5)?,
                entity_id: row.get(6)?,
                details: row.get(7)?,
                severity: row.get(8)?,
                created_at: row.get(9)?,
            })
        },
    ).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_audit_summary() -> Result<serde_json::Value, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let by_severity = {
        let mut stmt = conn.prepare(
            "SELECT severity, COUNT(*) AS count FROM audit_logs GROUP BY severity"
        ).map_err(|e| e.to_string())?;
        let rows = stmt.query_map([], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, i64>(1)?))
        }).map_err(|e| e.to_string())?;
        let mut map = serde_json::Map::new();
        for row in rows {
            let (k, v) = row.map_err(|e| e.to_string())?;
            map.insert(k, serde_json::Value::Number(v.into()));
        }
        serde_json::Value::Object(map)
    };

    let by_action = {
        let mut stmt = conn.prepare(
            "SELECT action, COUNT(*) AS count FROM audit_logs GROUP BY action ORDER BY count DESC LIMIT 20"
        ).map_err(|e| e.to_string())?;
        let rows = stmt.query_map([], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, i64>(1)?))
        }).map_err(|e| e.to_string())?;
        let mut map = serde_json::Map::new();
        for row in rows {
            let (k, v) = row.map_err(|e| e.to_string())?;
            map.insert(k, serde_json::Value::Number(v.into()));
        }
        serde_json::Value::Object(map)
    };

    let by_entity = {
        let mut stmt = conn.prepare(
            "SELECT entity_type, COUNT(*) AS count FROM audit_logs WHERE entity_type IS NOT NULL GROUP BY entity_type ORDER BY count DESC"
        ).map_err(|e| e.to_string())?;
        let rows = stmt.query_map([], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, i64>(1)?))
        }).map_err(|e| e.to_string())?;
        let mut map = serde_json::Map::new();
        for row in rows {
            let (k, v) = row.map_err(|e| e.to_string())?;
            map.insert(k, serde_json::Value::Number(v.into()));
        }
        serde_json::Value::Object(map)
    };

    let total: i64 = conn.query_row("SELECT COUNT(*) FROM audit_logs", [], |row| row.get(0)).unwrap_or(0);

    Ok(serde_json::json!({
        "total_events": total,
        "by_severity": by_severity,
        "by_action": by_action,
        "by_entity_type": by_entity,
    }))
}

#[tauri::command]
pub fn get_audit_timeline(days: Option<i64>) -> Result<Vec<serde_json::Value>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let days = days.unwrap_or(30);

    let mut stmt = conn.prepare(
        "SELECT substr(created_at, 1, 10) AS date, COUNT(*) AS count
         FROM audit_logs WHERE created_at > datetime('now', ?1)
         GROUP BY date ORDER BY date ASC"
    ).map_err(|e| e.to_string())?;

    let rows = stmt.query_map(rusqlite::params![format!("-{} days", days)], |row| {
        Ok(serde_json::json!({
            "date": row.get::<_, String>(0)?,
            "count": row.get::<_, i64>(1)?,
        }))
    }).map_err(|e| e.to_string())?;

    let mut result = Vec::new();
    for row in rows {
        result.push(row.map_err(|e| e.to_string())?);
    }

    Ok(result)
}

#[tauri::command]
pub fn get_audit_by_action() -> Result<Vec<serde_json::Value>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare(
        "SELECT action, COUNT(*) AS count, MAX(created_at) AS last_occurrence
         FROM audit_logs GROUP BY action ORDER BY count DESC"
    ).map_err(|e| e.to_string())?;

    let rows = stmt.query_map([], |row| {
        Ok(serde_json::json!({
            "action": row.get::<_, String>(0)?,
            "count": row.get::<_, i64>(1)?,
            "last_occurrence": row.get::<_, String>(2)?,
        }))
    }).map_err(|e| e.to_string())?;

    let mut result = Vec::new();
    for row in rows {
        result.push(row.map_err(|e| e.to_string())?);
    }

    Ok(result)
}

#[tauri::command]
pub fn get_audit_by_user(days: Option<i64>) -> Result<Vec<serde_json::Value>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let days = days.unwrap_or(30);

    let mut stmt = conn.prepare(
        "SELECT a.user_id, COALESCE(u.username, '') AS username,
                COALESCE(u.full_name, '') AS full_name,
                COUNT(*) AS count, MAX(a.created_at) AS last_activity
         FROM audit_logs a
         LEFT JOIN users u ON u.id = a.user_id
         WHERE a.user_id IS NOT NULL AND a.created_at > datetime('now', ?1)
         GROUP BY a.user_id ORDER BY count DESC"
    ).map_err(|e| e.to_string())?;

    let rows = stmt.query_map(rusqlite::params![format!("-{} days", days)], |row| {
        Ok(serde_json::json!({
            "user_id": row.get::<_, i64>(0)?,
            "username": row.get::<_, String>(1)?,
            "full_name": row.get::<_, String>(2)?,
            "count": row.get::<_, i64>(3)?,
            "last_activity": row.get::<_, String>(4)?,
        }))
    }).map_err(|e| e.to_string())?;

    let mut result = Vec::new();
    for row in rows {
        result.push(row.map_err(|e| e.to_string())?);
    }

    Ok(result)
}

#[tauri::command]
pub fn export_audit_logs(filter: Option<AuditFilter>) -> Result<String, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let (sql, params) = build_audit_query(&filter, 1, 10000);
    let param_refs: Vec<&dyn rusqlite::types::ToSql> = params.iter().map(|p| p.as_ref()).collect();

    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let rows = stmt.query_map(param_refs.as_slice(), |row| {
        Ok(serde_json::json!({
            "id": row.get::<_, i64>(0)?,
            "user_id": row.get::<_, Option<i64>>(1)?,
            "username": row.get::<_, String>(2)?,
            "full_name": row.get::<_, String>(3)?,
            "action": row.get::<_, String>(4)?,
            "entity_type": row.get::<_, Option<String>>(5)?,
            "entity_id": row.get::<_, Option<String>>(6)?,
            "details": row.get::<_, Option<String>>(7)?,
            "severity": row.get::<_, String>(8)?,
            "created_at": row.get::<_, String>(9)?,
        }))
    }).map_err(|e| e.to_string())?;

    let mut events = Vec::new();
    for row in rows {
        events.push(row.map_err(|e| e.to_string())?);
    }

    serde_json::to_string_pretty(&events).map_err(|e| e.to_string())
}
