use serde::{Deserialize, Serialize};
use crate::DB_STATE;

#[derive(Debug, Serialize, Deserialize)]
pub struct LicenseInfo {
    pub id: i64,
    pub license_key: String,
    pub license_type: String,
    pub company_name: Option<String>,
    pub contact_name: Option<String>,
    pub contact_email: Option<String>,
    pub max_users: i64,
    pub max_stores: i64,
    pub features: String,
    pub activation_date: Option<String>,
    pub expiration_date: Option<String>,
    pub status: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct LicenseInput {
    pub license_key: String,
    pub license_type: String,
    pub company_name: Option<String>,
    pub contact_name: Option<String>,
    pub contact_email: Option<String>,
    pub max_users: i64,
    pub max_stores: i64,
    pub features: String,
    pub activation_date: Option<String>,
    pub expiration_date: Option<String>,
}

fn row_to_license(row: &rusqlite::Row) -> rusqlite::Result<LicenseInfo> {
    Ok(LicenseInfo {
        id: row.get(0)?,
        license_key: row.get(1)?,
        license_type: row.get(2)?,
        company_name: row.get(3)?,
        contact_name: row.get(4)?,
        contact_email: row.get(5)?,
        max_users: row.get(6)?,
        max_stores: row.get(7)?,
        features: row.get(8)?,
        activation_date: row.get(9)?,
        expiration_date: row.get(10)?,
        status: row.get(11)?,
        created_at: row.get(12)?,
        updated_at: row.get(13)?,
    })
}

#[tauri::command]
pub fn get_license_info() -> Result<Option<LicenseInfo>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let result = conn.query_row(
        "SELECT id, license_key, license_type, company_name, contact_name, contact_email,
                max_users, max_stores, features, activation_date, expiration_date,
                status, created_at, updated_at
         FROM license_information ORDER BY id DESC LIMIT 1",
        [],
        row_to_license,
    );

    match result {
        Ok(license) => Ok(Some(license)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub fn save_license(input: LicenseInput) -> Result<LicenseInfo, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let existing: Option<i64> = conn.query_row(
        "SELECT id FROM license_information ORDER BY id DESC LIMIT 1",
        [],
        |row| row.get(0),
    ).ok();

    if let Some(id) = existing {
        conn.execute(
            "UPDATE license_information SET license_key = ?1, license_type = ?2, company_name = ?3,
                    contact_name = ?4, contact_email = ?5, max_users = ?6, max_stores = ?7,
                    features = ?8, activation_date = ?9, expiration_date = ?10, updated_at = datetime('now')
             WHERE id = ?11",
            rusqlite::params![
                input.license_key, input.license_type, input.company_name,
                input.contact_name, input.contact_email, input.max_users, input.max_stores,
                input.features, input.activation_date, input.expiration_date, id
            ],
        ).map_err(|e| e.to_string())?;
    } else {
        conn.execute(
            "INSERT INTO license_information (license_key, license_type, company_name, contact_name,
                    contact_email, max_users, max_stores, features, activation_date, expiration_date)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
            rusqlite::params![
                input.license_key, input.license_type, input.company_name,
                input.contact_name, input.contact_email, input.max_users, input.max_stores,
                input.features, input.activation_date, input.expiration_date
            ],
        ).map_err(|e| e.to_string())?;
    }

    drop(conn);
    get_license_info().map(|opt| opt.unwrap())
}

#[tauri::command]
pub fn activate_license(license_key: String) -> Result<LicenseInfo, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let existing: Option<i64> = conn.query_row(
        "SELECT id FROM license_information WHERE license_key = ?1",
        rusqlite::params![license_key],
        |row| row.get(0),
    ).ok();

    if let Some(id) = existing {
        conn.execute(
            "UPDATE license_information SET status = 'active', activation_date = datetime('now'), updated_at = datetime('now') WHERE id = ?1",
            rusqlite::params![id],
        ).map_err(|e| e.to_string())?;

        drop(conn);
        get_license_info().map(|opt| opt.unwrap())
    } else {
        conn.execute(
            "INSERT INTO license_information (license_key, status, activation_date) VALUES (?1, 'active', datetime('now'))",
            rusqlite::params![license_key],
        ).map_err(|e| e.to_string())?;

        drop(conn);
        get_license_info().map(|opt| opt.unwrap())
    }
}

#[tauri::command]
pub fn deactivate_license() -> Result<(), String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE license_information SET status = 'inactive', updated_at = datetime('now')",
        [],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn validate_license() -> Result<serde_json::Value, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let result = conn.query_row(
        "SELECT status, expiration_date FROM license_information ORDER BY id DESC LIMIT 1",
        [],
        |row| Ok((row.get::<_, String>(0)?, row.get::<_, Option<String>>(1)?)),
    );

    match result {
        Ok((status, expiration_date)) => {
            let expired = if let Some(ref exp) = expiration_date {
                let now = chrono::Utc::now().format("%Y-%m-%d").to_string();
                exp < &now
            } else {
                false
            };

            let valid = status == "active" && !expired;

            Ok(serde_json::json!({
                "valid": valid,
                "status": status,
                "expiration_date": expiration_date,
                "expired": expired,
            }))
        }
        Err(rusqlite::Error::QueryReturnedNoRows) => {
            Ok(serde_json::json!({
                "valid": false,
                "status": "unlicensed",
                "expiration_date": null,
                "expired": false,
            }))
        }
        Err(e) => Err(e.to_string()),
    }
}
