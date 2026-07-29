use serde::{Deserialize, Serialize};
use crate::DB_STATE;

#[derive(Debug, Serialize)]
pub struct AppSetting {
    pub id: i64,
    pub category: String,
    pub key: String,
    pub value: Option<String>,
    pub setting_type: String,
    pub description: Option<String>,
    pub options: Option<String>,
    pub validation: Option<String>,
    pub is_system: bool,
    pub sort_order: i64,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateAppSettingInput {
    pub key: String,
    pub value: String,
}

#[derive(Debug, Serialize)]
pub struct SettingCategory {
    pub category: String,
    pub count: i64,
}

#[tauri::command]
pub fn get_app_settings(category: Option<String>) -> Result<Vec<AppSetting>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let (where_clause, params): (String, Vec<Box<dyn rusqlite::types::ToSql>>) = if let Some(ref cat) = category {
        ("WHERE s.category = ?1".to_string(), vec![Box::new(cat.clone())])
    } else {
        (String::new(), vec![])
    };

    let param_refs: Vec<&dyn rusqlite::types::ToSql> = params.iter().map(|p| p.as_ref()).collect();

    let sql = format!(
        "SELECT s.id, s.category, s.key, s.value, s.setting_type, s.description,
                s.options, s.validation, s.is_system, s.sort_order, s.created_at, s.updated_at
         FROM application_settings s {} ORDER BY s.sort_order, s.key",
        where_clause,
    );

    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let rows = stmt.query_map(param_refs.as_slice(), |row| {
        Ok(AppSetting {
            id: row.get(0)?,
            category: row.get(1)?,
            key: row.get(2)?,
            value: row.get(3)?,
            setting_type: row.get(4)?,
            description: row.get(5)?,
            options: row.get(6)?,
            validation: row.get(7)?,
            is_system: row.get::<_, i64>(8)? == 1,
            sort_order: row.get(9)?,
            created_at: row.get(10)?,
            updated_at: row.get(11)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut result = Vec::new();
    for row in rows {
        result.push(row.map_err(|e| e.to_string())?);
    }

    Ok(result)
}

#[tauri::command]
pub fn get_setting_categories() -> Result<Vec<SettingCategory>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare(
        "SELECT category, COUNT(*) AS count FROM application_settings GROUP BY category ORDER BY category"
    ).map_err(|e| e.to_string())?;

    let rows = stmt.query_map([], |row| {
        Ok(SettingCategory {
            category: row.get(0)?,
            count: row.get(1)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut result = Vec::new();
    for row in rows {
        result.push(row.map_err(|e| e.to_string())?);
    }

    Ok(result)
}

#[tauri::command]
pub fn update_app_setting(input: UpdateAppSettingInput) -> Result<(), String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO application_settings (key, value, updated_at) VALUES (?1, ?2, datetime('now'))
         ON CONFLICT(key) DO UPDATE SET value = ?2, updated_at = datetime('now')",
        rusqlite::params![input.key, input.value],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn update_app_settings_bulk(settings: Vec<UpdateAppSettingInput>) -> Result<(), String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    for setting in &settings {
        conn.execute(
            "INSERT INTO application_settings (key, value, updated_at) VALUES (?1, ?2, datetime('now'))
             ON CONFLICT(key) DO UPDATE SET value = ?2, updated_at = datetime('now')",
            rusqlite::params![setting.key, setting.value],
        ).map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
pub fn get_setting_history(key: String) -> Result<Vec<serde_json::Value>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare(
        "SELECT a.id, a.user_id, COALESCE(u.username, '') AS username, a.action,
                a.details, a.created_at
         FROM audit_logs a
         LEFT JOIN users u ON u.id = a.user_id
         WHERE a.entity_type = 'setting' AND a.entity_id = ?1
         ORDER BY a.created_at DESC LIMIT 100"
    ).map_err(|e| e.to_string())?;

    let rows = stmt.query_map(rusqlite::params![key], |row| {
        Ok(serde_json::json!({
            "id": row.get::<_, i64>(0)?,
            "user_id": row.get::<_, Option<i64>>(1)?,
            "username": row.get::<_, String>(2)?,
            "action": row.get::<_, String>(3)?,
            "details": row.get::<_, Option<String>>(4)?,
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
pub fn reset_setting_to_default(key: String) -> Result<(), String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "DELETE FROM application_settings WHERE key = ?1 AND is_system = 0",
        rusqlite::params![key],
    ).map_err(|e| e.to_string())?;

    Ok(())
}
