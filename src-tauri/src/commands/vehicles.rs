use serde::{Deserialize, Serialize};

use crate::DB_STATE;

#[derive(Debug, Serialize, Deserialize)]
pub struct VehicleBrand {
    pub id: i64,
    pub name: String,
    pub description: Option<String>,
    pub country: Option<String>,
    pub is_active: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct VehicleModel {
    pub id: i64,
    pub brand_id: i64,
    pub name: String,
    pub brand_name: Option<String>,
    pub is_active: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct VehicleGeneration {
    pub id: i64,
    pub model_id: i64,
    pub name: Option<String>,
    pub year_start: Option<i64>,
    pub year_end: Option<i64>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct VehicleEngine {
    pub id: i64,
    pub name: String,
    pub displacement: Option<String>,
    pub power: Option<String>,
    pub fuel_type: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct VehicleTransmission {
    pub id: i64,
    pub name: String,
    #[serde(rename = "type")]
    pub type_: Option<String>,
    pub gears: Option<i64>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct VehicleFuel {
    pub id: i64,
    pub name: String,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CustomerVehicle {
    pub id: i64,
    pub customer_id: i64,
    pub license_plate: Option<String>,
    pub nickname: Option<String>,
    pub brand_id: Option<i64>,
    pub model_id: Option<i64>,
    pub generation_id: Option<i64>,
    pub year: Option<i64>,
    pub engine_id: Option<i64>,
    pub transmission_id: Option<i64>,
    pub fuel_id: Option<i64>,
    pub vin: Option<String>,
    pub color: Option<String>,
    pub mileage: i64,
    pub purchase_date: Option<String>,
    pub notes: Option<String>,
    pub status: String,
    pub created_at: String,
    pub updated_at: String,
    pub brand_name: Option<String>,
    pub model_name: Option<String>,
    pub engine_name: Option<String>,
    pub transmission_name: Option<String>,
    pub fuel_name: Option<String>,
    pub customer_name: Option<String>,
}

macro_rules! map_err {
    ($expr:expr) => {
        $expr.map_err(|e| format!("{}", e))
    };
}

fn row_to_vehicle_brand(row: &rusqlite::Row) -> rusqlite::Result<VehicleBrand> {
    Ok(VehicleBrand {
        id: row.get(0)?,
        name: row.get(1)?,
        description: row.get(2)?,
        country: row.get(3)?,
        is_active: row.get::<_, i64>(4)? != 0,
        created_at: row.get(5)?,
        updated_at: row.get(6)?,
    })
}

fn row_to_vehicle_model(row: &rusqlite::Row) -> rusqlite::Result<VehicleModel> {
    Ok(VehicleModel {
        id: row.get(0)?,
        brand_id: row.get(1)?,
        name: row.get(2)?,
        brand_name: row.get(3)?,
        is_active: row.get::<_, i64>(4)? != 0,
        created_at: row.get(5)?,
        updated_at: row.get(6)?,
    })
}

fn row_to_vehicle_generation(row: &rusqlite::Row) -> rusqlite::Result<VehicleGeneration> {
    Ok(VehicleGeneration {
        id: row.get(0)?,
        model_id: row.get(1)?,
        name: row.get(2)?,
        year_start: row.get(3)?,
        year_end: row.get(4)?,
        created_at: row.get(5)?,
    })
}

fn row_to_vehicle_engine(row: &rusqlite::Row) -> rusqlite::Result<VehicleEngine> {
    Ok(VehicleEngine {
        id: row.get(0)?,
        name: row.get(1)?,
        displacement: row.get(2)?,
        power: row.get(3)?,
        fuel_type: row.get(4)?,
        created_at: row.get(5)?,
    })
}

fn row_to_vehicle_transmission(row: &rusqlite::Row) -> rusqlite::Result<VehicleTransmission> {
    Ok(VehicleTransmission {
        id: row.get(0)?,
        name: row.get(1)?,
        type_: row.get(2)?,
        gears: row.get(3)?,
        created_at: row.get(4)?,
    })
}

fn row_to_vehicle_fuel(row: &rusqlite::Row) -> rusqlite::Result<VehicleFuel> {
    Ok(VehicleFuel {
        id: row.get(0)?,
        name: row.get(1)?,
        created_at: row.get(2)?,
    })
}

fn row_to_customer_vehicle(row: &rusqlite::Row) -> rusqlite::Result<CustomerVehicle> {
    Ok(CustomerVehicle {
        id: row.get(0)?,
        customer_id: row.get(1)?,
        license_plate: row.get(2)?,
        nickname: row.get(3)?,
        brand_id: row.get(4)?,
        model_id: row.get(5)?,
        generation_id: row.get(6)?,
        year: row.get(7)?,
        engine_id: row.get(8)?,
        transmission_id: row.get(9)?,
        fuel_id: row.get(10)?,
        vin: row.get(11)?,
        color: row.get(12)?,
        mileage: row.get(13)?,
        purchase_date: row.get(14)?,
        notes: row.get(15)?,
        status: row.get(16)?,
        created_at: row.get(17)?,
        updated_at: row.get(18)?,
        brand_name: row.get(19)?,
        model_name: row.get(20)?,
        engine_name: row.get(21)?,
        transmission_name: row.get(22)?,
        fuel_name: row.get(23)?,
        customer_name: row.get(24)?,
    })
}

#[tauri::command]
pub fn get_vehicle_brands(search: Option<String>) -> Result<Vec<VehicleBrand>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let mut sql = String::from(
        "SELECT id, name, description, country, is_active, created_at, updated_at FROM vehicle_brands WHERE 1=1"
    );
    let mut query_params: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();

    if let Some(ref s) = search {
        if !s.is_empty() {
            sql.push_str(" AND name LIKE ?1");
            query_params.push(Box::new(format!("%{}%", s)));
        }
    }

    sql.push_str(" ORDER BY name");

    let params_refs: Vec<&dyn rusqlite::types::ToSql> = query_params.iter().map(|p| p.as_ref()).collect();
    let mut stmt = map_err!(conn.prepare(&sql))?;
    let rows = map_err!(stmt.query_map(params_refs.as_slice(), row_to_vehicle_brand))?;
    let mut result = Vec::new();
    for row in rows {
        result.push(map_err!(row)?);
    }
    Ok(result)
}

#[tauri::command]
pub fn create_vehicle_brand(
    name: String,
    description: Option<String>,
    country: Option<String>,
) -> Result<VehicleBrand, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    map_err!(conn.execute(
        "INSERT INTO vehicle_brands (name, description, country) VALUES (?1, ?2, ?3)",
        rusqlite::params![name, description, country],
    ))?;

    let id = conn.last_insert_rowid();
    let row = conn.query_row(
        "SELECT id, name, description, country, is_active, created_at, updated_at FROM vehicle_brands WHERE id = ?1",
        rusqlite::params![id],
        row_to_vehicle_brand,
    ).map_err(|e| e.to_string())?;
    Ok(row)
}

#[tauri::command]
pub fn update_vehicle_brand(
    id: i64,
    name: String,
    description: Option<String>,
    country: Option<String>,
) -> Result<VehicleBrand, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    map_err!(conn.execute(
        "UPDATE vehicle_brands SET name = ?1, description = ?2, country = ?3, updated_at = datetime('now') WHERE id = ?4",
        rusqlite::params![name, description, country, id],
    ))?;

    let row = conn.query_row(
        "SELECT id, name, description, country, is_active, created_at, updated_at FROM vehicle_brands WHERE id = ?1",
        rusqlite::params![id],
        row_to_vehicle_brand,
    ).map_err(|e| e.to_string())?;
    Ok(row)
}

#[tauri::command]
pub fn get_vehicle_models(brand_id: Option<i64>, search: Option<String>) -> Result<Vec<VehicleModel>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let mut sql = String::from(
        "SELECT vm.id, vm.brand_id, vm.name, vb.name AS brand_name, vm.is_active, vm.created_at, vm.updated_at FROM vehicle_models vm LEFT JOIN vehicle_brands vb ON vb.id = vm.brand_id WHERE 1=1"
    );
    let mut query_params: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();
    let mut param_idx = 1;

    if let Some(bid) = brand_id {
        sql.push_str(&format!(" AND vm.brand_id = ?{}", param_idx));
        query_params.push(Box::new(bid));
        param_idx += 1;
    }

    if let Some(ref s) = search {
        if !s.is_empty() {
            sql.push_str(&format!(" AND vm.name LIKE ?{}", param_idx));
            query_params.push(Box::new(format!("%{}%", s)));
        }
    }

    sql.push_str(" ORDER BY vb.name, vm.name");

    let params_refs: Vec<&dyn rusqlite::types::ToSql> = query_params.iter().map(|p| p.as_ref()).collect();
    let mut stmt = map_err!(conn.prepare(&sql))?;
    let rows = map_err!(stmt.query_map(params_refs.as_slice(), row_to_vehicle_model))?;
    let mut result = Vec::new();
    for row in rows {
        result.push(map_err!(row)?);
    }
    Ok(result)
}

#[tauri::command]
pub fn create_vehicle_model(brand_id: i64, name: String) -> Result<VehicleModel, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    map_err!(conn.execute(
        "INSERT INTO vehicle_models (brand_id, name) VALUES (?1, ?2)",
        rusqlite::params![brand_id, name],
    ))?;

    let id = conn.last_insert_rowid();
    let row = conn.query_row(
        "SELECT vm.id, vm.brand_id, vm.name, vb.name AS brand_name, vm.is_active, vm.created_at, vm.updated_at FROM vehicle_models vm LEFT JOIN vehicle_brands vb ON vb.id = vm.brand_id WHERE vm.id = ?1",
        rusqlite::params![id],
        row_to_vehicle_model,
    ).map_err(|e| e.to_string())?;
    Ok(row)
}

#[tauri::command]
pub fn get_vehicle_generations(model_id: i64) -> Result<Vec<VehicleGeneration>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let mut stmt = map_err!(conn.prepare(
        "SELECT id, model_id, name, year_start, year_end, created_at FROM vehicle_generations WHERE model_id = ?1 ORDER BY year_start"
    ))?;
    let rows = map_err!(stmt.query_map(rusqlite::params![model_id], row_to_vehicle_generation))?;
    let mut result = Vec::new();
    for row in rows {
        result.push(map_err!(row)?);
    }
    Ok(result)
}

#[tauri::command]
pub fn create_vehicle_generation(
    model_id: i64,
    name: Option<String>,
    year_start: Option<i64>,
    year_end: Option<i64>,
) -> Result<VehicleGeneration, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    map_err!(conn.execute(
        "INSERT INTO vehicle_generations (model_id, name, year_start, year_end) VALUES (?1, ?2, ?3, ?4)",
        rusqlite::params![model_id, name, year_start, year_end],
    ))?;

    let id = conn.last_insert_rowid();
    let row = conn.query_row(
        "SELECT id, model_id, name, year_start, year_end, created_at FROM vehicle_generations WHERE id = ?1",
        rusqlite::params![id],
        row_to_vehicle_generation,
    ).map_err(|e| e.to_string())?;
    Ok(row)
}

#[tauri::command]
pub fn get_vehicle_engines(search: Option<String>) -> Result<Vec<VehicleEngine>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let mut sql = String::from(
        "SELECT id, name, displacement, power, fuel_type, created_at FROM vehicle_engines WHERE 1=1"
    );
    let mut query_params: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();

    if let Some(ref s) = search {
        if !s.is_empty() {
            sql.push_str(" AND name LIKE ?1");
            query_params.push(Box::new(format!("%{}%", s)));
        }
    }

    sql.push_str(" ORDER BY name");

    let params_refs: Vec<&dyn rusqlite::types::ToSql> = query_params.iter().map(|p| p.as_ref()).collect();
    let mut stmt = map_err!(conn.prepare(&sql))?;
    let rows = map_err!(stmt.query_map(params_refs.as_slice(), row_to_vehicle_engine))?;
    let mut result = Vec::new();
    for row in rows {
        result.push(map_err!(row)?);
    }
    Ok(result)
}

#[tauri::command]
pub fn create_vehicle_engine(
    name: String,
    displacement: Option<String>,
    power: Option<String>,
    fuel_type: Option<String>,
) -> Result<VehicleEngine, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    map_err!(conn.execute(
        "INSERT INTO vehicle_engines (name, displacement, power, fuel_type) VALUES (?1, ?2, ?3, ?4)",
        rusqlite::params![name, displacement, power, fuel_type],
    ))?;

    let id = conn.last_insert_rowid();
    let row = conn.query_row(
        "SELECT id, name, displacement, power, fuel_type, created_at FROM vehicle_engines WHERE id = ?1",
        rusqlite::params![id],
        row_to_vehicle_engine,
    ).map_err(|e| e.to_string())?;
    Ok(row)
}

#[tauri::command]
pub fn get_vehicle_transmissions() -> Result<Vec<VehicleTransmission>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let mut stmt = map_err!(conn.prepare(
        "SELECT id, name, type, gears, created_at FROM vehicle_transmissions ORDER BY name"
    ))?;
    let rows = map_err!(stmt.query_map([], row_to_vehicle_transmission))?;
    let mut result = Vec::new();
    for row in rows {
        result.push(map_err!(row)?);
    }
    Ok(result)
}

#[tauri::command]
pub fn create_vehicle_transmission(
    name: String,
    r#type: Option<String>,
    gears: Option<i64>,
) -> Result<VehicleTransmission, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    map_err!(conn.execute(
        "INSERT INTO vehicle_transmissions (name, type, gears) VALUES (?1, ?2, ?3)",
        rusqlite::params![name, r#type, gears],
    ))?;

    let id = conn.last_insert_rowid();
    let row = conn.query_row(
        "SELECT id, name, type, gears, created_at FROM vehicle_transmissions WHERE id = ?1",
        rusqlite::params![id],
        row_to_vehicle_transmission,
    ).map_err(|e| e.to_string())?;
    Ok(row)
}

#[tauri::command]
pub fn get_vehicle_fuels() -> Result<Vec<VehicleFuel>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let mut stmt = map_err!(conn.prepare(
        "SELECT id, name, created_at FROM vehicle_fuels ORDER BY name"
    ))?;
    let rows = map_err!(stmt.query_map([], row_to_vehicle_fuel))?;
    let mut result = Vec::new();
    for row in rows {
        result.push(map_err!(row)?);
    }
    Ok(result)
}

#[tauri::command]
pub fn create_vehicle_fuel(name: String) -> Result<VehicleFuel, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    map_err!(conn.execute(
        "INSERT INTO vehicle_fuels (name) VALUES (?1)",
        rusqlite::params![name],
    ))?;

    let id = conn.last_insert_rowid();
    let row = conn.query_row(
        "SELECT id, name, created_at FROM vehicle_fuels WHERE id = ?1",
        rusqlite::params![id],
        row_to_vehicle_fuel,
    ).map_err(|e| e.to_string())?;
    Ok(row)
}

#[tauri::command]
pub fn get_customer_vehicles(customer_id: i64) -> Result<Vec<CustomerVehicle>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let mut stmt = map_err!(conn.prepare(
        "SELECT cv.id, cv.customer_id, cv.license_plate, cv.nickname, cv.brand_id, cv.model_id, cv.generation_id, cv.year, cv.engine_id, cv.transmission_id, cv.fuel_id, cv.vin, cv.color, cv.mileage, cv.purchase_date, cv.notes, cv.status, cv.created_at, cv.updated_at, vb.name AS brand_name, vmo.name AS model_name, ve.name AS engine_name, vt.name AS transmission_name, vf.name AS fuel_name, c.name AS customer_name FROM customer_vehicles cv LEFT JOIN vehicle_brands vb ON vb.id = cv.brand_id LEFT JOIN vehicle_models vmo ON vmo.id = cv.model_id LEFT JOIN vehicle_engines ve ON ve.id = cv.engine_id LEFT JOIN vehicle_transmissions vt ON vt.id = cv.transmission_id LEFT JOIN vehicle_fuels vf ON vf.id = cv.fuel_id LEFT JOIN customers c ON c.id = cv.customer_id WHERE cv.customer_id = ?1 ORDER BY cv.created_at DESC"
    ))?;
    let rows = map_err!(stmt.query_map(rusqlite::params![customer_id], row_to_customer_vehicle))?;
    let mut result = Vec::new();
    for row in rows {
        result.push(map_err!(row)?);
    }
    Ok(result)
}

#[tauri::command]
pub fn get_customer_vehicle(id: i64) -> Result<CustomerVehicle, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let row = conn.query_row(
        "SELECT cv.id, cv.customer_id, cv.license_plate, cv.nickname, cv.brand_id, cv.model_id, cv.generation_id, cv.year, cv.engine_id, cv.transmission_id, cv.fuel_id, cv.vin, cv.color, cv.mileage, cv.purchase_date, cv.notes, cv.status, cv.created_at, cv.updated_at, vb.name AS brand_name, vmo.name AS model_name, ve.name AS engine_name, vt.name AS transmission_name, vf.name AS fuel_name, c.name AS customer_name FROM customer_vehicles cv LEFT JOIN vehicle_brands vb ON vb.id = cv.brand_id LEFT JOIN vehicle_models vmo ON vmo.id = cv.model_id LEFT JOIN vehicle_engines ve ON ve.id = cv.engine_id LEFT JOIN vehicle_transmissions vt ON vt.id = cv.transmission_id LEFT JOIN vehicle_fuels vf ON vf.id = cv.fuel_id LEFT JOIN customers c ON c.id = cv.customer_id WHERE cv.id = ?1",
        rusqlite::params![id],
        row_to_customer_vehicle,
    ).map_err(|e| e.to_string())?;
    Ok(row)
}

#[tauri::command]
pub fn create_customer_vehicle(
    customer_id: i64,
    license_plate: Option<String>,
    nickname: Option<String>,
    brand_id: Option<i64>,
    model_id: Option<i64>,
    generation_id: Option<i64>,
    year: Option<i64>,
    engine_id: Option<i64>,
    transmission_id: Option<i64>,
    fuel_id: Option<i64>,
    vin: Option<String>,
    color: Option<String>,
    mileage: Option<i64>,
    purchase_date: Option<String>,
    notes: Option<String>,
    user_id: i64,
) -> Result<CustomerVehicle, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let m = mileage.unwrap_or(0);
    map_err!(conn.execute(
        "INSERT INTO customer_vehicles (customer_id, license_plate, nickname, brand_id, model_id, generation_id, year, engine_id, transmission_id, fuel_id, vin, color, mileage, purchase_date, notes) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15)",
        rusqlite::params![customer_id, license_plate, nickname, brand_id, model_id, generation_id, year, engine_id, transmission_id, fuel_id, vin, color, m, purchase_date, notes],
    ))?;

    let id = conn.last_insert_rowid();

    // Add timeline entry
    let vehicle_info = nickname.clone().or_else(|| license_plate.clone()).unwrap_or_else(|| format!("Vehicle #{}", id));
    map_err!(conn.execute(
        "INSERT INTO customer_timeline (customer_id, event_type, title, description, created_by) VALUES (?1, 'vehicle_added', ?2, ?3, ?4)",
        rusqlite::params![customer_id, format!("Vehicle Added: {}", vehicle_info), notes.as_deref(), user_id],
    ))?;

    drop(conn);
    get_customer_vehicle(id)
}

#[tauri::command]
pub fn update_customer_vehicle(
    id: i64,
    customer_id: i64,
    license_plate: Option<String>,
    nickname: Option<String>,
    brand_id: Option<i64>,
    model_id: Option<i64>,
    generation_id: Option<i64>,
    year: Option<i64>,
    engine_id: Option<i64>,
    transmission_id: Option<i64>,
    fuel_id: Option<i64>,
    vin: Option<String>,
    color: Option<String>,
    mileage: Option<i64>,
    purchase_date: Option<String>,
    notes: Option<String>,
) -> Result<CustomerVehicle, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let m = mileage.unwrap_or(0);
    map_err!(conn.execute(
        "UPDATE customer_vehicles SET customer_id=?1, license_plate=?2, nickname=?3, brand_id=?4, model_id=?5, generation_id=?6, year=?7, engine_id=?8, transmission_id=?9, fuel_id=?10, vin=?11, color=?12, mileage=?13, purchase_date=?14, notes=?15, updated_at=datetime('now') WHERE id=?16",
        rusqlite::params![customer_id, license_plate, nickname, brand_id, model_id, generation_id, year, engine_id, transmission_id, fuel_id, vin, color, m, purchase_date, notes, id],
    ))?;

    drop(conn);
    get_customer_vehicle(id)
}

#[tauri::command]
pub fn delete_customer_vehicle(id: i64) -> Result<(), String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    map_err!(conn.execute(
        "DELETE FROM customer_vehicles WHERE id = ?1",
        rusqlite::params![id],
    ))?;

    Ok(())
}
