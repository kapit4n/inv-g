use serde::{Deserialize, Serialize};
use crate::DB_STATE;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
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
#[serde(rename_all = "camelCase")]
pub struct UpdateAppSettingInput {
    pub key: String,
    pub value: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SettingCategory {
    pub category: String,
    pub count: i64,
}

/// Parse a stored `options` column into a list of allowed values.
///
/// Accepts a JSON array (`["a","b"]`), a JSON object (`{"options":["a","b"]}`),
/// or a plain comma-separated string for backward compatibility.
fn parse_options(raw: Option<&str>) -> Vec<String> {
    let Some(raw) = raw else { return Vec::new() };
    let trimmed = raw.trim();
    if trimmed.is_empty() {
        return Vec::new();
    }
    if let Ok(values) = serde_json::from_str::<Vec<String>>(trimmed) {
        return values;
    }
    if let Ok(value) = serde_json::from_str::<serde_json::Value>(trimmed) {
        if let Some(arr) = value.get("options").and_then(|o| o.as_array()) {
            return arr
                .iter()
                .filter_map(|s| s.as_str().map(|s| s.to_string()))
                .collect();
        }
    }
    trimmed
        .split(',')
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .collect()
}

/// Validate a setting value against its declared type, allowed options and
/// numeric/length constraints. Returns a human-readable error on failure.
fn validate_value(
    setting_type: &str,
    value: &str,
    options: Option<&str>,
    validation: Option<&str>,
) -> Result<(), String> {
    let trimmed = value.trim();

    if setting_type == "number" {
        let num: f64 = trimmed
            .parse()
            .map_err(|_| format!("Value '{}' is not a valid number", value))?;
        if let Some(raw) = validation {
            if let Ok(spec) = serde_json::from_str::<serde_json::Value>(raw) {
                if let Some(min) = spec.get("min").and_then(|m| m.as_f64()) {
                    if num < min {
                        return Err(format!("Value must be at least {}", min));
                    }
                }
                if let Some(max) = spec.get("max").and_then(|m| m.as_f64()) {
                    if num > max {
                        return Err(format!("Value must be at most {}", max));
                    }
                }
            }
        }
    } else if setting_type == "boolean" {
        if !matches!(trimmed, "true" | "false") {
            return Err(format!(
                "Value '{}' is not a valid boolean (expected 'true' or 'false')",
                value
            ));
        }
    }

    if !trimmed.is_empty() {
        let allowed = parse_options(options);
        if !allowed.is_empty() && !allowed.iter().any(|o| o == trimmed) {
            return Err(format!(
                "Value '{}' is not one of the allowed options: {}",
                value,
                allowed.join(", ")
            ));
        }
    }

    if let Some(raw) = validation {
        if let Ok(spec) = serde_json::from_str::<serde_json::Value>(raw) {
            if let Some(min_len) = spec.get("minLength").and_then(|m| m.as_u64()) {
                if (value.len() as u64) < min_len {
                    return Err(format!("Value must be at least {} characters", min_len));
                }
            }
            if let Some(max_len) = spec.get("maxLength").and_then(|m| m.as_u64()) {
                if (value.len() as u64) > max_len {
                    return Err(format!("Value must be at most {} characters", max_len));
                }
            }
        }
    }

    Ok(())
}

/// Fetch a full setting row by key, or `None` when it does not exist.
fn fetch_app_setting(conn: &rusqlite::Connection, key: &str) -> Result<Option<AppSetting>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, category, key, value, setting_type, description,
                    options, validation, is_system, sort_order, created_at, updated_at
             FROM application_settings WHERE key = ?1",
        )
        .map_err(|e| e.to_string())?;
    let mut rows = stmt
        .query_map(rusqlite::params![key], |row| {
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
        })
        .map_err(|e| e.to_string())?;
    match rows.next() {
        Some(Ok(setting)) => Ok(Some(setting)),
        Some(Err(e)) => Err(e.to_string()),
        None => Ok(None),
    }
}

/// Persist a value into `application_settings` and mirror it into the legacy
/// `settings` table so existing consumers (dashboard, updates, diagnostics,
/// hooks) keep seeing a single coherent value.
fn persist_setting(
    conn: &rusqlite::Connection,
    setting: &AppSetting,
    value: &str,
) -> Result<(), String> {
    conn.execute(
        "INSERT INTO application_settings (key, value, updated_at) VALUES (?1, ?2, datetime('now'))
         ON CONFLICT(key) DO UPDATE SET value = ?2, updated_at = datetime('now')",
        rusqlite::params![setting.key, value],
    )
    .map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO settings (key, value, group_name, setting_type, description)
         VALUES (?1, ?2, ?3, ?4, ?5)
         ON CONFLICT(key) DO UPDATE SET value = ?2, setting_type = ?4, updated_at = datetime('now')",
        rusqlite::params![
            setting.key,
            value,
            setting.category,
            setting.setting_type,
            setting.description
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
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

    let setting = fetch_app_setting(&conn, &input.key)?
        .ok_or_else(|| format!("Unknown setting '{}'", input.key))?;

    validate_value(
        &setting.setting_type,
        &input.value,
        setting.options.as_deref(),
        setting.validation.as_deref(),
    )?;

    persist_setting(&conn, &setting, &input.value)
}

#[tauri::command]
pub fn update_app_settings_bulk(settings: Vec<UpdateAppSettingInput>) -> Result<(), String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    // Validate every value first so an invalid entry never causes a partial write.
    let mut resolved: Vec<(AppSetting, String)> = Vec::with_capacity(settings.len());
    for input in &settings {
        let setting = fetch_app_setting(&conn, &input.key)?
            .ok_or_else(|| format!("Unknown setting '{}'", input.key))?;
        validate_value(
            &setting.setting_type,
            &input.value,
            setting.options.as_deref(),
            setting.validation.as_deref(),
        )?;
        resolved.push((setting, input.value.clone()));
    }

    for (setting, value) in &resolved {
        persist_setting(&conn, setting, value)?;
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

#[cfg(test)]
mod tests {
    use super::{parse_options, validate_value};

    #[test]
    fn parse_options_accepts_json_array() {
        let options = parse_options(Some(r#"["es","en"]"#));
        assert_eq!(options, vec!["es".to_string(), "en".to_string()]);
    }

    #[test]
    fn parse_options_accepts_json_object() {
        let options = parse_options(Some(r#"{"options":["cash","card","credit"]}"#));
        assert_eq!(
            options,
            vec!["cash".to_string(), "card".to_string(), "credit".to_string()]
        );
    }

    #[test]
    fn parse_options_falls_back_to_comma_separated() {
        let options = parse_options(Some("a, b , c"));
        assert_eq!(options, vec!["a".to_string(), "b".to_string(), "c".to_string()]);
    }

    #[test]
    fn parse_options_handles_none_and_empty() {
        assert!(parse_options(None).is_empty());
        assert!(parse_options(Some("")).is_empty());
    }

    #[test]
    fn number_values_are_parsed() {
        assert!(validate_value("number", "16", None, None).is_ok());
        assert!(validate_value("number", "16.5", None, None).is_ok());
        assert!(validate_value("number", "abc", None, None).is_err());
        assert!(validate_value("number", "", None, None).is_err());
    }

    #[test]
    fn number_validation_respects_min_max() {
        let spec = r#"{"min":0,"max":100}"#;
        assert!(validate_value("number", "-1", None, Some(spec)).is_err());
        assert!(validate_value("number", "101", None, Some(spec)).is_err());
        assert!(validate_value("number", "0", None, Some(spec)).is_ok());
        assert!(validate_value("number", "100", None, Some(spec)).is_ok());
    }

    #[test]
    fn boolean_values_must_be_true_or_false() {
        assert!(validate_value("boolean", "true", None, None).is_ok());
        assert!(validate_value("boolean", "false", None, None).is_ok());
        assert!(validate_value("boolean", "1", None, None).is_err());
        assert!(validate_value("boolean", "yes", None, None).is_err());
    }

    #[test]
    fn values_must_match_allowed_options() {
        let options = r#"{"options":["cash","card"]}"#;
        assert!(validate_value("string", "cash", Some(options), None).is_ok());
        assert!(validate_value("string", "crypto", Some(options), None).is_err());
        // Empty values are allowed for optional settings.
        assert!(validate_value("string", "", Some(options), None).is_ok());
    }

    #[test]
    fn string_length_constraints_are_enforced() {
        let spec = r#"{"minLength":3,"maxLength":30}"#;
        assert!(validate_value("string", "ab", None, Some(spec)).is_err());
        assert!(validate_value("string", &"x".repeat(31), None, Some(spec)).is_err());
        assert!(validate_value("string", "valid", None, Some(spec)).is_ok());
    }
}
