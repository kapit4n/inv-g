use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::State;
use crate::db::DbState;

fn get_conn<'r>(state: &'r State<'r, DbState>) -> Result<std::sync::MutexGuard<'r, rusqlite::Connection>, String> {
    state.conn.lock().map_err(|e| format!("Database lock error: {}", e))
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Category {
    pub id: i64,
    pub name: String,
    pub description: Option<String>,
    pub parent_id: Option<i64>,
    pub sort_order: i64,
    pub is_active: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Brand {
    pub id: i64,
    pub name: String,
    pub description: Option<String>,
    pub country: Option<String>,
    pub website: Option<String>,
    pub logo_url: Option<String>,
    pub is_active: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Manufacturer {
    pub id: i64,
    pub name: String,
    pub country: Option<String>,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub website: Option<String>,
    pub notes: Option<String>,
    pub is_active: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Supplier {
    pub id: i64,
    pub company_name: String,
    pub contact_person: Option<String>,
    pub phone: Option<String>,
    pub mobile: Option<String>,
    pub email: Option<String>,
    pub website: Option<String>,
    pub tax_number: Option<String>,
    pub address: Option<String>,
    pub city: Option<String>,
    pub state: Option<String>,
    pub postal_code: Option<String>,
    pub country: Option<String>,
    pub notes: Option<String>,
    pub is_active: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Warehouse {
    pub id: i64,
    pub name: String,
    pub code: String,
    pub address: Option<String>,
    pub city: Option<String>,
    pub state: Option<String>,
    pub country: Option<String>,
    pub manager: Option<String>,
    pub phone: Option<String>,
    pub is_active: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StorageLocation {
    pub id: i64,
    pub warehouse_id: i64,
    pub zone: Option<String>,
    pub aisle: Option<String>,
    pub shelf: Option<String>,
    pub bin: Option<String>,
    pub code: String,
    pub description: Option<String>,
    pub is_active: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Product {
    pub id: i64,
    pub name: String,
    pub sku: String,
    pub barcode: Option<String>,
    pub oem_number: Option<String>,
    pub internal_code: Option<String>,
    pub description: Option<String>,
    pub category_id: Option<i64>,
    pub brand_id: Option<i64>,
    pub manufacturer_id: Option<i64>,
    pub supplier_id: Option<i64>,
    pub cost_price: f64,
    pub sale_price: f64,
    pub wholesale_price: f64,
    pub suggested_retail_price: f64,
    pub tax_rate: f64,
    pub stock_quantity: i64,
    pub min_stock_level: i64,
    pub max_stock_level: i64,
    pub reorder_point: i64,
    pub unit: String,
    pub weight: Option<f64>,
    pub warehouse_id: Option<i64>,
    pub storage_location_id: Option<i64>,
    pub image_url: Option<String>,
    pub is_active: bool,
    pub is_discontinued: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProductImage {
    pub id: i64,
    pub product_id: i64,
    pub file_path: String,
    pub is_primary: bool,
    pub sort_order: i64,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DashboardStats {
    pub total_products: i64,
    pub active_products: i64,
    pub inactive_products: i64,
    pub total_categories: i64,
    pub total_brands: i64,
    pub total_suppliers: i64,
    pub total_warehouses: i64,
    pub low_stock_products: i64,
    pub out_of_stock_products: i64,
    pub inventory_value: f64,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PaginatedResult<T> {
    pub data: Vec<T>,
    pub total: i64,
    pub page: i64,
    pub page_size: i64,
    pub total_pages: i64,
}

fn paginate<T, F>(conn: &rusqlite::Connection, table: &str, page: i64, page_size: i64, where_clause: &str, params: Vec<Box<dyn rusqlite::types::ToSql>>, mapper: F) -> Result<PaginatedResult<T>, String>
where F: Fn(&rusqlite::Row) -> rusqlite::Result<T>
{
    let offset = (page - 1) * page_size;
    let param_refs: Vec<&dyn rusqlite::types::ToSql> = params.iter().map(|p| p.as_ref()).collect();
    let total: i64 = conn.query_row(
        &format!("SELECT COUNT(*) FROM {}", table),
        param_refs.as_slice(), |row| row.get(0)
    ).map_err(|e| e.to_string())?;

    let data = {
        let mut stmt = conn.prepare(
            &format!("SELECT * FROM {} {} ORDER BY id DESC LIMIT ?1 OFFSET ?2", table, where_clause)
        ).map_err(|e| e.to_string())?;
        let mut all_params = params;
        all_params.push(Box::new(page_size));
        all_params.push(Box::new(offset));
        let param_refs: Vec<&dyn rusqlite::types::ToSql> = all_params.iter().map(|p| p.as_ref()).collect();
        let rows = stmt.query_map(param_refs.as_slice(), mapper).map_err(|e| e.to_string())?;
        let mut result = Vec::new();
        for row in rows {
            result.push(row.map_err(|e| e.to_string())?);
        }
        result
    };

    Ok(PaginatedResult {
        total_pages: ((total as f64) / (page_size as f64)).ceil() as i64,
        data,
        total,
        page,
        page_size,
    })
}

// ── Categories ──

#[tauri::command]
pub fn get_categories(state: State<DbState>) -> Result<Vec<Category>, String> {
    let conn = get_conn(&state)?;
    let mut stmt = conn.prepare("SELECT * FROM categories ORDER BY sort_order").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(Category {
            id: row.get(0)?, name: row.get(1)?, description: row.get(2)?,
            parent_id: row.get(3)?, sort_order: row.get(4)?, is_active: row.get::<_, i64>(5)? != 0,
            created_at: row.get(6)?, updated_at: row.get(7)?,
        })
    }).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for row in rows { result.push(row.map_err(|e| e.to_string())?); }
    Ok(result)
}

#[tauri::command]
pub fn create_category(state: State<DbState>, name: String, description: Option<String>, parent_id: Option<i64>, sort_order: i64) -> Result<Category, String> {
    let conn = get_conn(&state)?;
    conn.execute("INSERT INTO categories (name, description, parent_id, sort_order) VALUES (?1, ?2, ?3, ?4)",
        params![name, description, parent_id, sort_order]).map_err(|e| e.to_string())?;
    let id = conn.last_insert_rowid();
    let mut stmt = conn.prepare("SELECT * FROM categories WHERE id = ?1").map_err(|e| e.to_string())?;
    stmt.query_row(params![id], |row| {
        Ok(Category {
            id: row.get(0)?, name: row.get(1)?, description: row.get(2)?,
            parent_id: row.get(3)?, sort_order: row.get(4)?, is_active: row.get::<_, i64>(5)? != 0,
            created_at: row.get(6)?, updated_at: row.get(7)?,
        })
    }).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_category(state: State<DbState>, id: i64, name: String, description: Option<String>, parent_id: Option<i64>, sort_order: i64) -> Result<Category, String> {
    let conn = get_conn(&state)?;
    conn.execute("UPDATE categories SET name=?1, description=?2, parent_id=?3, sort_order=?4, updated_at=datetime('now') WHERE id=?5",
        params![name, description, parent_id, sort_order, id]).map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT * FROM categories WHERE id = ?1").map_err(|e| e.to_string())?;
    stmt.query_row(params![id], |row| {
        Ok(Category {
            id: row.get(0)?, name: row.get(1)?, description: row.get(2)?,
            parent_id: row.get(3)?, sort_order: row.get(4)?, is_active: row.get::<_, i64>(5)? != 0,
            created_at: row.get(6)?, updated_at: row.get(7)?,
        })
    }).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn archive_category(state: State<DbState>, id: i64) -> Result<(), String> {
    let conn = get_conn(&state)?;
    conn.execute("UPDATE categories SET is_active=0, updated_at=datetime('now') WHERE id=?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn restore_category(state: State<DbState>, id: i64) -> Result<(), String> {
    let conn = get_conn(&state)?;
    conn.execute("UPDATE categories SET is_active=1, updated_at=datetime('now') WHERE id=?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

// ── Brands ──

#[tauri::command]
pub fn get_brands(state: State<DbState>) -> Result<Vec<Brand>, String> {
    let conn = get_conn(&state)?;
    let mut stmt = conn.prepare("SELECT * FROM brands ORDER BY name").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(Brand {
            id: row.get(0)?, name: row.get(1)?, description: row.get(2)?,
            country: row.get(3)?, website: row.get(4)?, logo_url: row.get(5)?,
            is_active: row.get::<_, i64>(6)? != 0, created_at: row.get(7)?, updated_at: row.get(8)?,
        })
    }).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for row in rows { result.push(row.map_err(|e| e.to_string())?); }
    Ok(result)
}

#[tauri::command]
pub fn create_brand(state: State<DbState>, name: String, description: Option<String>, country: Option<String>, website: Option<String>) -> Result<Brand, String> {
    let conn = get_conn(&state)?;
    conn.execute("INSERT INTO brands (name, description, country, website) VALUES (?1, ?2, ?3, ?4)",
        params![name, description, country, website]).map_err(|e| e.to_string())?;
    let id = conn.last_insert_rowid();
    let mut stmt = conn.prepare("SELECT * FROM brands WHERE id = ?1").map_err(|e| e.to_string())?;
    stmt.query_row(params![id], |row| {
        Ok(Brand {
            id: row.get(0)?, name: row.get(1)?, description: row.get(2)?,
            country: row.get(3)?, website: row.get(4)?, logo_url: row.get(5)?,
            is_active: row.get::<_, i64>(6)? != 0, created_at: row.get(7)?, updated_at: row.get(8)?,
        })
    }).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_brand(state: State<DbState>, id: i64, name: String, description: Option<String>, country: Option<String>, website: Option<String>) -> Result<Brand, String> {
    let conn = get_conn(&state)?;
    conn.execute("UPDATE brands SET name=?1, description=?2, country=?3, website=?4, updated_at=datetime('now') WHERE id=?5",
        params![name, description, country, website, id]).map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT * FROM brands WHERE id = ?1").map_err(|e| e.to_string())?;
    stmt.query_row(params![id], |row| {
        Ok(Brand {
            id: row.get(0)?, name: row.get(1)?, description: row.get(2)?,
            country: row.get(3)?, website: row.get(4)?, logo_url: row.get(5)?,
            is_active: row.get::<_, i64>(6)? != 0, created_at: row.get(7)?, updated_at: row.get(8)?,
        })
    }).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn archive_brand(state: State<DbState>, id: i64) -> Result<(), String> {
    let conn = get_conn(&state)?;
    conn.execute("UPDATE brands SET is_active=0, updated_at=datetime('now') WHERE id=?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

// ── Manufacturers ──

#[tauri::command]
pub fn get_manufacturers(state: State<DbState>) -> Result<Vec<Manufacturer>, String> {
    let conn = get_conn(&state)?;
    let mut stmt = conn.prepare("SELECT * FROM manufacturers ORDER BY name").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(Manufacturer {
            id: row.get(0)?, name: row.get(1)?, country: row.get(2)?,
            phone: row.get(3)?, email: row.get(4)?, website: row.get(5)?,
            notes: row.get(6)?, is_active: row.get::<_, i64>(7)? != 0,
            created_at: row.get(8)?, updated_at: row.get(9)?,
        })
    }).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for row in rows { result.push(row.map_err(|e| e.to_string())?); }
    Ok(result)
}

#[tauri::command]
pub fn create_manufacturer(state: State<DbState>, name: String, country: Option<String>, phone: Option<String>, email: Option<String>, website: Option<String>, notes: Option<String>) -> Result<Manufacturer, String> {
    let conn = get_conn(&state)?;
    conn.execute("INSERT INTO manufacturers (name, country, phone, email, website, notes) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![name, country, phone, email, website, notes]).map_err(|e| e.to_string())?;
    let id = conn.last_insert_rowid();
    let mut stmt = conn.prepare("SELECT * FROM manufacturers WHERE id = ?1").map_err(|e| e.to_string())?;
    stmt.query_row(params![id], |row| {
        Ok(Manufacturer {
            id: row.get(0)?, name: row.get(1)?, country: row.get(2)?,
            phone: row.get(3)?, email: row.get(4)?, website: row.get(5)?,
            notes: row.get(6)?, is_active: row.get::<_, i64>(7)? != 0,
            created_at: row.get(8)?, updated_at: row.get(9)?,
        })
    }).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_manufacturer(state: State<DbState>, id: i64, name: String, country: Option<String>, phone: Option<String>, email: Option<String>, website: Option<String>, notes: Option<String>) -> Result<Manufacturer, String> {
    let conn = get_conn(&state)?;
    conn.execute("UPDATE manufacturers SET name=?1, country=?2, phone=?3, email=?4, website=?5, notes=?6, updated_at=datetime('now') WHERE id=?7",
        params![name, country, phone, email, website, notes, id]).map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT * FROM manufacturers WHERE id = ?1").map_err(|e| e.to_string())?;
    stmt.query_row(params![id], |row| {
        Ok(Manufacturer {
            id: row.get(0)?, name: row.get(1)?, country: row.get(2)?,
            phone: row.get(3)?, email: row.get(4)?, website: row.get(5)?,
            notes: row.get(6)?, is_active: row.get::<_, i64>(7)? != 0,
            created_at: row.get(8)?, updated_at: row.get(9)?,
        })
    }).map_err(|e| e.to_string())
}

// ── Suppliers ──

#[tauri::command]
pub fn get_suppliers(state: State<DbState>) -> Result<Vec<Supplier>, String> {
    let conn = get_conn(&state)?;
    let mut stmt = conn.prepare("SELECT * FROM suppliers ORDER BY company_name").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(Supplier {
            id: row.get(0)?, company_name: row.get(1)?, contact_person: row.get(2)?,
            phone: row.get(3)?, mobile: row.get(4)?, email: row.get(5)?,
            website: row.get(6)?, tax_number: row.get(7)?, address: row.get(8)?,
            city: row.get(9)?, state: row.get(10)?, postal_code: row.get(11)?,
            country: row.get(12)?, notes: row.get(13)?, is_active: row.get::<_, i64>(14)? != 0,
            created_at: row.get(15)?, updated_at: row.get(16)?,
        })
    }).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for row in rows { result.push(row.map_err(|e| e.to_string())?); }
    Ok(result)
}

#[tauri::command]
pub fn create_supplier(state: State<DbState>, company_name: String, contact_person: Option<String>, phone: Option<String>, mobile: Option<String>, email: Option<String>, website: Option<String>, tax_number: Option<String>, address: Option<String>, city: Option<String>, state_province: Option<String>, country: Option<String>) -> Result<Supplier, String> {
    let conn = get_conn(&state)?;
    let state = state_province;
    conn.execute("INSERT INTO suppliers (company_name, contact_person, phone, mobile, email, website, tax_number, address, city, state, country) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
        params![company_name, contact_person, phone, mobile, email, website, tax_number, address, city, state, country]).map_err(|e| e.to_string())?;
    let id = conn.last_insert_rowid();
    let mut stmt = conn.prepare("SELECT * FROM suppliers WHERE id = ?1").map_err(|e| e.to_string())?;
    stmt.query_row(params![id], |row| {
        Ok(Supplier {
            id: row.get(0)?, company_name: row.get(1)?, contact_person: row.get(2)?,
            phone: row.get(3)?, mobile: row.get(4)?, email: row.get(5)?,
            website: row.get(6)?, tax_number: row.get(7)?, address: row.get(8)?,
            city: row.get(9)?, state: row.get(10)?, postal_code: row.get(11)?,
            country: row.get(12)?, notes: row.get(13)?, is_active: row.get::<_, i64>(14)? != 0,
            created_at: row.get(15)?, updated_at: row.get(16)?,
        })
    }).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_supplier(state: State<DbState>, id: i64, company_name: String, contact_person: Option<String>, phone: Option<String>, mobile: Option<String>, email: Option<String>, website: Option<String>, tax_number: Option<String>, address: Option<String>, city: Option<String>, state_province: Option<String>, country: Option<String>) -> Result<Supplier, String> {
    let conn = get_conn(&state)?;
    let state = state_province;
    conn.execute("UPDATE suppliers SET company_name=?1, contact_person=?2, phone=?3, mobile=?4, email=?5, website=?6, tax_number=?7, address=?8, city=?9, state=?10, country=?11, updated_at=datetime('now') WHERE id=?12",
        params![company_name, contact_person, phone, mobile, email, website, tax_number, address, city, state, country, id]).map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT * FROM suppliers WHERE id = ?1").map_err(|e| e.to_string())?;
    stmt.query_row(params![id], |row| {
        Ok(Supplier {
            id: row.get(0)?, company_name: row.get(1)?, contact_person: row.get(2)?,
            phone: row.get(3)?, mobile: row.get(4)?, email: row.get(5)?,
            website: row.get(6)?, tax_number: row.get(7)?, address: row.get(8)?,
            city: row.get(9)?, state: row.get(10)?, postal_code: row.get(11)?,
            country: row.get(12)?, notes: row.get(13)?, is_active: row.get::<_, i64>(14)? != 0,
            created_at: row.get(15)?, updated_at: row.get(16)?,
        })
    }).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn archive_supplier(state: State<DbState>, id: i64) -> Result<(), String> {
    let conn = get_conn(&state)?;
    conn.execute("UPDATE suppliers SET is_active=0, updated_at=datetime('now') WHERE id=?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

// ── Warehouses ──

#[tauri::command]
pub fn get_warehouses(state: State<DbState>) -> Result<Vec<Warehouse>, String> {
    let conn = get_conn(&state)?;
    let mut stmt = conn.prepare("SELECT * FROM warehouses ORDER BY name").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(Warehouse {
            id: row.get(0)?, name: row.get(1)?, code: row.get(2)?,
            address: row.get(3)?, city: row.get(4)?, state: row.get(5)?,
            country: row.get(6)?, manager: row.get(7)?, phone: row.get(8)?,
            is_active: row.get::<_, i64>(9)? != 0, created_at: row.get(10)?, updated_at: row.get(11)?,
        })
    }).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for row in rows { result.push(row.map_err(|e| e.to_string())?); }
    Ok(result)
}

#[tauri::command]
pub fn create_warehouse(state: State<DbState>, name: String, code: String, address: Option<String>, city: Option<String>, state_province: Option<String>, country: Option<String>, manager: Option<String>, phone: Option<String>) -> Result<Warehouse, String> {
    let conn = get_conn(&state)?;
    let state = state_province;
    conn.execute("INSERT INTO warehouses (name, code, address, city, state, country, manager, phone) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![name, code, address, city, state, country, manager, phone]).map_err(|e| e.to_string())?;
    let id = conn.last_insert_rowid();
    let mut stmt = conn.prepare("SELECT * FROM warehouses WHERE id = ?1").map_err(|e| e.to_string())?;
    stmt.query_row(params![id], |row| {
        Ok(Warehouse {
            id: row.get(0)?, name: row.get(1)?, code: row.get(2)?,
            address: row.get(3)?, city: row.get(4)?, state: row.get(5)?,
            country: row.get(6)?, manager: row.get(7)?, phone: row.get(8)?,
            is_active: row.get::<_, i64>(9)? != 0, created_at: row.get(10)?, updated_at: row.get(11)?,
        })
    }).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_warehouse(state: State<DbState>, id: i64, name: String, code: String, address: Option<String>, city: Option<String>, state_province: Option<String>, country: Option<String>, manager: Option<String>, phone: Option<String>) -> Result<Warehouse, String> {
    let conn = get_conn(&state)?;
    let state = state_province;
    conn.execute("UPDATE warehouses SET name=?1, code=?2, address=?3, city=?4, state=?5, country=?6, manager=?7, phone=?8, updated_at=datetime('now') WHERE id=?9",
        params![name, code, address, city, state, country, manager, phone, id]).map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT * FROM warehouses WHERE id = ?1").map_err(|e| e.to_string())?;
    stmt.query_row(params![id], |row| {
        Ok(Warehouse {
            id: row.get(0)?, name: row.get(1)?, code: row.get(2)?,
            address: row.get(3)?, city: row.get(4)?, state: row.get(5)?,
            country: row.get(6)?, manager: row.get(7)?, phone: row.get(8)?,
            is_active: row.get::<_, i64>(9)? != 0, created_at: row.get(10)?, updated_at: row.get(11)?,
        })
    }).map_err(|e| e.to_string())
}

// ── Storage Locations ──

#[tauri::command]
pub fn get_storage_locations(state: State<DbState>, warehouse_id: Option<i64>) -> Result<Vec<StorageLocation>, String> {
    let conn = get_conn(&state)?;
    let mut stmt = if let Some(_wid) = warehouse_id {
        conn.prepare("SELECT * FROM storage_locations WHERE warehouse_id = ?1 ORDER BY code").map_err(|e| e.to_string())?
    } else {
        conn.prepare("SELECT * FROM storage_locations ORDER BY code").map_err(|e| e.to_string())?
    };
    let rows = if let Some(wid) = warehouse_id {
        stmt.query_map(params![wid], mapper_storage_location).map_err(|e| e.to_string())?
    } else {
        stmt.query_map([], mapper_storage_location).map_err(|e| e.to_string())?
    };
    let mut result = Vec::new();
    for row in rows { result.push(row.map_err(|e| e.to_string())?); }
    Ok(result)
}

fn mapper_storage_location(row: &rusqlite::Row) -> rusqlite::Result<StorageLocation> {
    Ok(StorageLocation {
        id: row.get(0)?, warehouse_id: row.get(1)?, zone: row.get(2)?,
        aisle: row.get(3)?, shelf: row.get(4)?, bin: row.get(5)?,
        code: row.get(6)?, description: row.get(7)?, is_active: row.get::<_, i64>(8)? != 0,
        created_at: row.get(9)?, updated_at: row.get(10)?,
    })
}

#[tauri::command]
pub fn create_storage_location(state: State<DbState>, warehouse_id: i64, zone: Option<String>, aisle: Option<String>, shelf: Option<String>, bin: Option<String>, code: String, description: Option<String>) -> Result<StorageLocation, String> {
    let conn = get_conn(&state)?;
    conn.execute("INSERT INTO storage_locations (warehouse_id, zone, aisle, shelf, bin, code, description) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![warehouse_id, zone, aisle, shelf, bin, code, description]).map_err(|e| e.to_string())?;
    let id = conn.last_insert_rowid();
    let mut stmt = conn.prepare("SELECT * FROM storage_locations WHERE id = ?1").map_err(|e| e.to_string())?;
    stmt.query_row(params![id], mapper_storage_location).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_storage_location(state: State<DbState>, id: i64, warehouse_id: i64, zone: Option<String>, aisle: Option<String>, shelf: Option<String>, bin: Option<String>, code: String, description: Option<String>) -> Result<StorageLocation, String> {
    let conn = get_conn(&state)?;
    conn.execute("UPDATE storage_locations SET warehouse_id=?1, zone=?2, aisle=?3, shelf=?4, bin=?5, code=?6, description=?7, updated_at=datetime('now') WHERE id=?8",
        params![warehouse_id, zone, aisle, shelf, bin, code, description, id]).map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT * FROM storage_locations WHERE id = ?1").map_err(|e| e.to_string())?;
    stmt.query_row(params![id], mapper_storage_location).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn archive_storage_location(state: State<DbState>, id: i64) -> Result<(), String> {
    let conn = get_conn(&state)?;
    conn.execute("UPDATE storage_locations SET is_active=0, updated_at=datetime('now') WHERE id=?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

// ── Products ──

#[tauri::command]
pub fn get_products(state: State<DbState>, page: i64, page_size: i64, search: Option<String>) -> Result<PaginatedResult<Product>, String> {
    let conn = get_conn(&state)?;
    let (where_clause, params_vec) = if let Some(q) = search {
        let q = format!("%{}%", q);
        ("WHERE name LIKE ?1 OR sku LIKE ?1 OR barcode LIKE ?1 OR oem_number LIKE ?1 OR internal_code LIKE ?1".to_string(), vec![Box::new(q) as Box<dyn rusqlite::types::ToSql>])
    } else {
        ("".to_string(), vec![])
    };
    paginate(&conn, "products", page, page_size, &where_clause, params_vec, |row| {
        Ok(Product {
            id: row.get(0)?, name: row.get(1)?, sku: row.get(2)?,
            barcode: row.get(3)?, oem_number: row.get(4)?, internal_code: row.get(5)?,
            description: row.get(6)?, category_id: row.get(7)?, brand_id: row.get(8)?,
            manufacturer_id: row.get(9)?, supplier_id: row.get(10)?,
            cost_price: row.get(11)?, sale_price: row.get(12)?, wholesale_price: row.get(13)?,
            suggested_retail_price: row.get(14)?, tax_rate: row.get(15)?,
            stock_quantity: row.get(16)?, min_stock_level: row.get(17)?,
            max_stock_level: row.get(18)?, reorder_point: row.get(19)?,
            unit: row.get(20)?, weight: row.get(21)?,
            warehouse_id: row.get(22)?, storage_location_id: row.get(23)?,
            image_url: row.get(24)?, is_active: row.get::<_, i64>(25)? != 0,
            is_discontinued: row.get::<_, i64>(26)? != 0,
            created_at: row.get(27)?, updated_at: row.get(28)?,
        })
    })
}

#[tauri::command]
pub fn get_product(state: State<DbState>, id: i64) -> Result<Product, String> {
    let conn = get_conn(&state)?;
    let mut stmt = conn.prepare("SELECT * FROM products WHERE id = ?1").map_err(|e| e.to_string())?;
    stmt.query_row(params![id], |row| {
        Ok(Product {
            id: row.get(0)?, name: row.get(1)?, sku: row.get(2)?,
            barcode: row.get(3)?, oem_number: row.get(4)?, internal_code: row.get(5)?,
            description: row.get(6)?, category_id: row.get(7)?, brand_id: row.get(8)?,
            manufacturer_id: row.get(9)?, supplier_id: row.get(10)?,
            cost_price: row.get(11)?, sale_price: row.get(12)?, wholesale_price: row.get(13)?,
            suggested_retail_price: row.get(14)?, tax_rate: row.get(15)?,
            stock_quantity: row.get(16)?, min_stock_level: row.get(17)?,
            max_stock_level: row.get(18)?, reorder_point: row.get(19)?,
            unit: row.get(20)?, weight: row.get(21)?,
            warehouse_id: row.get(22)?, storage_location_id: row.get(23)?,
            image_url: row.get(24)?, is_active: row.get::<_, i64>(25)? != 0,
            is_discontinued: row.get::<_, i64>(26)? != 0,
            created_at: row.get(27)?, updated_at: row.get(28)?,
        })
    }).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_product(state: State<DbState>, name: String, sku: String, barcode: Option<String>, oem_number: Option<String>, internal_code: Option<String>, description: Option<String>, category_id: Option<i64>, brand_id: Option<i64>, manufacturer_id: Option<i64>, supplier_id: Option<i64>, cost_price: f64, sale_price: f64, wholesale_price: f64, suggested_retail_price: f64, tax_rate: f64, stock_quantity: i64, min_stock_level: i64, max_stock_level: i64, reorder_point: i64, unit: String, weight: Option<f64>, warehouse_id: Option<i64>, storage_location_id: Option<i64>) -> Result<Product, String> {
    let conn = get_conn(&state)?;
    conn.execute(
        "INSERT INTO products (name, sku, barcode, oem_number, internal_code, description, category_id, brand_id, manufacturer_id, supplier_id, cost_price, sale_price, wholesale_price, suggested_retail_price, tax_rate, stock_quantity, min_stock_level, max_stock_level, reorder_point, unit, weight, warehouse_id, storage_location_id) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20, ?21, ?22, ?23)",
        params![name, sku, barcode, oem_number, internal_code, description, category_id, brand_id, manufacturer_id, supplier_id, cost_price, sale_price, wholesale_price, suggested_retail_price, tax_rate, stock_quantity, min_stock_level, max_stock_level, reorder_point, unit, weight, warehouse_id, storage_location_id],
    ).map_err(|e| e.to_string())?;
    let id = conn.last_insert_rowid();
    get_product_internal(&conn, id)
}

fn get_product_internal(conn: &rusqlite::Connection, id: i64) -> Result<Product, String> {
    let mut stmt = conn.prepare("SELECT * FROM products WHERE id = ?1").map_err(|e| e.to_string())?;
    stmt.query_row(params![id], |row| {
        Ok(Product {
            id: row.get(0)?, name: row.get(1)?, sku: row.get(2)?,
            barcode: row.get(3)?, oem_number: row.get(4)?, internal_code: row.get(5)?,
            description: row.get(6)?, category_id: row.get(7)?, brand_id: row.get(8)?,
            manufacturer_id: row.get(9)?, supplier_id: row.get(10)?,
            cost_price: row.get(11)?, sale_price: row.get(12)?, wholesale_price: row.get(13)?,
            suggested_retail_price: row.get(14)?, tax_rate: row.get(15)?,
            stock_quantity: row.get(16)?, min_stock_level: row.get(17)?,
            max_stock_level: row.get(18)?, reorder_point: row.get(19)?,
            unit: row.get(20)?, weight: row.get(21)?,
            warehouse_id: row.get(22)?, storage_location_id: row.get(23)?,
            image_url: row.get(24)?, is_active: row.get::<_, i64>(25)? != 0,
            is_discontinued: row.get::<_, i64>(26)? != 0,
            created_at: row.get(27)?, updated_at: row.get(28)?,
        })
    }).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_product(state: State<DbState>, id: i64, name: String, sku: String, barcode: Option<String>, oem_number: Option<String>, internal_code: Option<String>, description: Option<String>, category_id: Option<i64>, brand_id: Option<i64>, manufacturer_id: Option<i64>, supplier_id: Option<i64>, cost_price: f64, sale_price: f64, wholesale_price: f64, suggested_retail_price: f64, tax_rate: f64, stock_quantity: i64, min_stock_level: i64, max_stock_level: i64, reorder_point: i64, unit: String, weight: Option<f64>, warehouse_id: Option<i64>, storage_location_id: Option<i64>) -> Result<Product, String> {
    let conn = get_conn(&state)?;
    conn.execute(
        "UPDATE products SET name=?1, sku=?2, barcode=?3, oem_number=?4, internal_code=?5, description=?6, category_id=?7, brand_id=?8, manufacturer_id=?9, supplier_id=?10, cost_price=?11, sale_price=?12, wholesale_price=?13, suggested_retail_price=?14, tax_rate=?15, stock_quantity=?16, min_stock_level=?17, max_stock_level=?18, reorder_point=?19, unit=?20, weight=?21, warehouse_id=?22, storage_location_id=?23, updated_at=datetime('now') WHERE id=?24",
        params![name, sku, barcode, oem_number, internal_code, description, category_id, brand_id, manufacturer_id, supplier_id, cost_price, sale_price, wholesale_price, suggested_retail_price, tax_rate, stock_quantity, min_stock_level, max_stock_level, reorder_point, unit, weight, warehouse_id, storage_location_id, id],
    ).map_err(|e| e.to_string())?;
    get_product_internal(&conn, id)
}

#[tauri::command]
pub fn archive_product(state: State<DbState>, id: i64) -> Result<(), String> {
    let conn = get_conn(&state)?;
    conn.execute("UPDATE products SET is_active=0, updated_at=datetime('now') WHERE id=?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn restore_product(state: State<DbState>, id: i64) -> Result<(), String> {
    let conn = get_conn(&state)?;
    conn.execute("UPDATE products SET is_active=1, updated_at=datetime('now') WHERE id=?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn get_dashboard_stats(state: State<DbState>) -> Result<DashboardStats, String> {
    let conn = get_conn(&state)?;

    let total_products: i64 = conn.query_row("SELECT COUNT(*) FROM products", [], |row| row.get(0)).map_err(|e| e.to_string())?;
    let active_products: i64 = conn.query_row("SELECT COUNT(*) FROM products WHERE is_active=1", [], |row| row.get(0)).map_err(|e| e.to_string())?;
    let inactive_products: i64 = total_products - active_products;
    let total_categories: i64 = conn.query_row("SELECT COUNT(*) FROM categories WHERE is_active=1", [], |row| row.get(0)).map_err(|e| e.to_string())?;
    let total_brands: i64 = conn.query_row("SELECT COUNT(*) FROM brands WHERE is_active=1", [], |row| row.get(0)).map_err(|e| e.to_string())?;
    let total_suppliers: i64 = conn.query_row("SELECT COUNT(*) FROM suppliers WHERE is_active=1", [], |row| row.get(0)).map_err(|e| e.to_string())?;
    let total_warehouses: i64 = conn.query_row("SELECT COUNT(*) FROM warehouses WHERE is_active=1", [], |row| row.get(0)).map_err(|e| e.to_string())?;
    let low_stock_products: i64 = conn.query_row("SELECT COUNT(*) FROM products WHERE is_active=1 AND stock_quantity > 0 AND stock_quantity <= min_stock_level", [], |row| row.get(0)).map_err(|e| e.to_string())?;
    let out_of_stock_products: i64 = conn.query_row("SELECT COUNT(*) FROM products WHERE is_active=1 AND stock_quantity <= 0", [], |row| row.get(0)).map_err(|e| e.to_string())?;
    let inventory_value: f64 = conn.query_row("SELECT COALESCE(SUM(stock_quantity * cost_price), 0) FROM products WHERE is_active=1", [], |row| row.get(0)).map_err(|e| e.to_string())?;

    Ok(DashboardStats {
        total_products, active_products, inactive_products,
        total_categories, total_brands, total_suppliers, total_warehouses,
        low_stock_products, out_of_stock_products, inventory_value,
    })
}

#[tauri::command]
pub fn get_product_images(state: State<DbState>, product_id: i64) -> Result<Vec<ProductImage>, String> {
    let conn = get_conn(&state)?;
    let mut stmt = conn.prepare("SELECT * FROM product_images WHERE product_id = ?1 ORDER BY sort_order").map_err(|e| e.to_string())?;
    let rows = stmt.query_map(params![product_id], |row| {
        Ok(ProductImage {
            id: row.get(0)?, product_id: row.get(1)?, file_path: row.get(2)?,
            is_primary: row.get::<_, i64>(3)? != 0, sort_order: row.get(4)?,
            created_at: row.get(5)?,
        })
    }).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for row in rows { result.push(row.map_err(|e| e.to_string())?); }
    Ok(result)
}

#[tauri::command]
pub fn create_product_image(state: State<DbState>, product_id: i64, file_path: String, is_primary: bool, sort_order: i64) -> Result<ProductImage, String> {
    let conn = get_conn(&state)?;
    if is_primary {
        conn.execute("UPDATE product_images SET is_primary=0 WHERE product_id=?1", params![product_id]).map_err(|e| e.to_string())?;
    }
    conn.execute("INSERT INTO product_images (product_id, file_path, is_primary, sort_order) VALUES (?1, ?2, ?3, ?4)",
        params![product_id, file_path, is_primary as i64, sort_order]).map_err(|e| e.to_string())?;
    let id = conn.last_insert_rowid();
    let mut stmt = conn.prepare("SELECT * FROM product_images WHERE id = ?1").map_err(|e| e.to_string())?;
    stmt.query_row(params![id], |row| {
        Ok(ProductImage {
            id: row.get(0)?, product_id: row.get(1)?, file_path: row.get(2)?,
            is_primary: row.get::<_, i64>(3)? != 0, sort_order: row.get(4)?,
            created_at: row.get(5)?,
        })
    }).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_product_image(state: State<DbState>, id: i64) -> Result<(), String> {
    let conn = get_conn(&state)?;
    conn.execute("DELETE FROM product_images WHERE id=?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

// ── Inventory Movements ──

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InventoryMovement {
    pub id: i64,
    pub product_id: i64,
    pub warehouse_id: Option<i64>,
    pub quantity: i64,
    pub r#type: String,
    pub reference_type: Option<String>,
    pub reference_id: Option<String>,
    pub notes: Option<String>,
    pub created_by: Option<i64>,
    pub created_at: String,
}

#[tauri::command]
pub fn get_inventory_movements(state: State<DbState>, product_id: Option<i64>) -> Result<Vec<InventoryMovement>, String> {
    let conn = get_conn(&state)?;
    let (sql, params_vec): (&str, Vec<Box<dyn rusqlite::types::ToSql>>) = if let Some(pid) = product_id {
        ("SELECT * FROM inventory_movements WHERE product_id = ?1 ORDER BY created_at DESC", vec![Box::new(pid)])
    } else {
        ("SELECT * FROM inventory_movements ORDER BY created_at DESC", vec![])
    };
    let mut stmt = conn.prepare(sql).map_err(|e| e.to_string())?;
    let param_refs: Vec<&dyn rusqlite::types::ToSql> = params_vec.iter().map(|p| p.as_ref()).collect();
    let rows = stmt.query_map(param_refs.as_slice(), |row| {
        Ok(InventoryMovement {
            id: row.get(0)?, product_id: row.get(1)?, warehouse_id: row.get(2)?,
            quantity: row.get(3)?, r#type: row.get(4)?,
            reference_type: row.get(5)?, reference_id: row.get(6)?,
            notes: row.get(7)?, created_by: row.get(8)?, created_at: row.get(9)?,
        })
    }).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for row in rows { result.push(row.map_err(|e| e.to_string())?); }
    Ok(result)
}

#[tauri::command]
pub fn create_inventory_movement(state: State<DbState>, product_id: i64, warehouse_id: Option<i64>, quantity: i64, r#type: String, reference_type: Option<String>, reference_id: Option<String>, notes: Option<String>, created_by: Option<i64>) -> Result<InventoryMovement, String> {
    let conn = get_conn(&state)?;
    conn.execute(
        "INSERT INTO inventory_movements (product_id, warehouse_id, quantity, type, reference_type, reference_id, notes, created_by) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![product_id, warehouse_id, quantity, r#type, reference_type, reference_id, notes, created_by],
    ).map_err(|e| e.to_string())?;

    // Update product stock quantity
    conn.execute(
        "UPDATE products SET stock_quantity = stock_quantity + ?1, updated_at = datetime('now') WHERE id = ?2",
        params![quantity, product_id],
    ).map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();
    let mut stmt = conn.prepare("SELECT * FROM inventory_movements WHERE id = ?1").map_err(|e| e.to_string())?;
    stmt.query_row(params![id], |row| {
        Ok(InventoryMovement {
            id: row.get(0)?, product_id: row.get(1)?, warehouse_id: row.get(2)?,
            quantity: row.get(3)?, r#type: row.get(4)?,
            reference_type: row.get(5)?, reference_id: row.get(6)?,
            notes: row.get(7)?, created_by: row.get(8)?, created_at: row.get(9)?,
        })
    }).map_err(|e| e.to_string())
}

#[cfg(test)]
mod tests {
    #[test]
    fn test_category_serialization() {
        let json = r#"{"id":1,"name":"Electronics","description":"Electronic items","parentId":null,"icon":"cpu","sortOrder":0,"createdAt":"2025-01-01T00:00:00Z","updatedAt":"2025-01-01T00:00:00Z"}"#;
        let cat: serde_json::Value = serde_json::from_str(json).unwrap();
        assert_eq!(cat["name"], "Electronics");
        assert!(cat.get("parentId").unwrap().is_null());
    }

    #[test]
    fn test_product_serialization() {
        let json = r#"{"id":1,"name":"Product A","sku":"SKU-001","costPrice":10.5,"sellPrice":15.99,"stockQuantity":100,"isActive":true,"unit":"pcs"}"#;
        let prod: serde_json::Value = serde_json::from_str(json).unwrap();
        assert_eq!(prod["sku"], "SKU-001");
        assert_eq!(prod["stockQuantity"], 100);
        assert_eq!(prod["isActive"], true);
    }

    #[test]
    fn test_paginated_result_structure() {
        let json = r#"{"data":[],"total":0,"page":1,"pageSize":20,"totalPages":0}"#;
        let result: serde_json::Value = serde_json::from_str(json).unwrap();
        assert_eq!(result["total"], 0);
        assert_eq!(result["page"], 1);
        assert!(result["data"].is_array());
    }
}


