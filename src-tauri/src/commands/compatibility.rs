use serde::{Deserialize, Serialize};

use crate::DB_STATE;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompatibilityEntry {
    pub id: i64,
    pub product_id: i64,
    pub product_name: Option<String>,
    pub product_sku: Option<String>,
    pub brand_id: Option<i64>,
    pub brand_name: Option<String>,
    pub model_id: Option<i64>,
    pub model_name: Option<String>,
    pub generation_id: Option<i64>,
    pub generation_name: Option<String>,
    pub engine_id: Option<i64>,
    pub engine_name: Option<String>,
    pub transmission_id: Option<i64>,
    pub transmission_name: Option<String>,
    pub year_start: Option<i64>,
    pub year_end: Option<i64>,
    pub notes: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProductRecommendation {
    pub product_id: i64,
    pub product_name: String,
    pub product_sku: String,
    pub sale_price: f64,
    pub stock_quantity: i64,
    pub category_name: Option<String>,
    pub brand_name: Option<String>,
    pub compatibility_count: i64,
}

macro_rules! map_err {
    ($expr:expr) => {
        $expr.map_err(|e| format!("{}", e))
    };
}

fn row_to_compatibility_entry(row: &rusqlite::Row) -> rusqlite::Result<CompatibilityEntry> {
    Ok(CompatibilityEntry {
        id: row.get(0)?,
        product_id: row.get(1)?,
        product_name: row.get(2)?,
        product_sku: row.get(3)?,
        brand_id: row.get(4)?,
        brand_name: row.get(5)?,
        model_id: row.get(6)?,
        model_name: row.get(7)?,
        generation_id: row.get(8)?,
        generation_name: row.get(9)?,
        engine_id: row.get(10)?,
        engine_name: row.get(11)?,
        transmission_id: row.get(12)?,
        transmission_name: row.get(13)?,
        year_start: row.get(14)?,
        year_end: row.get(15)?,
        notes: row.get(16)?,
        created_at: row.get(17)?,
    })
}

fn row_to_product_recommendation(row: &rusqlite::Row) -> rusqlite::Result<ProductRecommendation> {
    Ok(ProductRecommendation {
        product_id: row.get(0)?,
        product_name: row.get(1)?,
        product_sku: row.get(2)?,
        sale_price: row.get(3)?,
        stock_quantity: row.get(4)?,
        category_name: row.get(5)?,
        brand_name: row.get(6)?,
        compatibility_count: row.get(7)?,
    })
}

#[tauri::command]
pub fn get_product_compatibility(product_id: i64) -> Result<Vec<CompatibilityEntry>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let mut stmt = map_err!(conn.prepare(
        "SELECT pvc.id, pvc.product_id, p.name AS product_name, p.sku AS product_sku, pvc.brand_id, vb.name AS brand_name, pvc.model_id, vmo.name AS model_name, pvc.generation_id, vg.name AS generation_name, pvc.engine_id, ve.name AS engine_name, pvc.transmission_id, vt.name AS transmission_name, pvc.year_start, pvc.year_end, pvc.notes, pvc.created_at FROM product_vehicle_compatibility pvc LEFT JOIN products p ON p.id = pvc.product_id LEFT JOIN vehicle_brands vb ON vb.id = pvc.brand_id LEFT JOIN vehicle_models vmo ON vmo.id = pvc.model_id LEFT JOIN vehicle_generations vg ON vg.id = pvc.generation_id LEFT JOIN vehicle_engines ve ON ve.id = pvc.engine_id LEFT JOIN vehicle_transmissions vt ON vt.id = pvc.transmission_id WHERE pvc.product_id = ?1 ORDER BY pvc.created_at DESC"
    ))?;
    let rows = map_err!(stmt.query_map(rusqlite::params![product_id], row_to_compatibility_entry))?;
    let mut result = Vec::new();
    for row in rows {
        result.push(map_err!(row)?);
    }
    Ok(result)
}

#[tauri::command]
pub fn create_compatibility(
    product_id: i64,
    brand_id: Option<i64>,
    model_id: Option<i64>,
    generation_id: Option<i64>,
    engine_id: Option<i64>,
    transmission_id: Option<i64>,
    year_start: Option<i64>,
    year_end: Option<i64>,
    notes: Option<String>,
) -> Result<CompatibilityEntry, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    map_err!(conn.execute(
        "INSERT INTO product_vehicle_compatibility (product_id, brand_id, model_id, generation_id, engine_id, transmission_id, year_start, year_end, notes) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        rusqlite::params![product_id, brand_id, model_id, generation_id, engine_id, transmission_id, year_start, year_end, notes],
    ))?;

    let id = conn.last_insert_rowid();
    let row = conn.query_row(
        "SELECT pvc.id, pvc.product_id, p.name AS product_name, p.sku AS product_sku, pvc.brand_id, vb.name AS brand_name, pvc.model_id, vmo.name AS model_name, pvc.generation_id, vg.name AS generation_name, pvc.engine_id, ve.name AS engine_name, pvc.transmission_id, vt.name AS transmission_name, pvc.year_start, pvc.year_end, pvc.notes, pvc.created_at FROM product_vehicle_compatibility pvc LEFT JOIN products p ON p.id = pvc.product_id LEFT JOIN vehicle_brands vb ON vb.id = pvc.brand_id LEFT JOIN vehicle_models vmo ON vmo.id = pvc.model_id LEFT JOIN vehicle_generations vg ON vg.id = pvc.generation_id LEFT JOIN vehicle_engines ve ON ve.id = pvc.engine_id LEFT JOIN vehicle_transmissions vt ON vt.id = pvc.transmission_id WHERE pvc.id = ?1",
        rusqlite::params![id],
        row_to_compatibility_entry,
    ).map_err(|e| e.to_string())?;
    Ok(row)
}

#[tauri::command]
pub fn delete_compatibility(id: i64) -> Result<(), String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    map_err!(conn.execute(
        "DELETE FROM product_vehicle_compatibility WHERE id = ?1",
        rusqlite::params![id],
    ))?;

    Ok(())
}

#[tauri::command]
pub fn search_compatible_products(
    brand_id: Option<i64>,
    model_id: Option<i64>,
    year: Option<i64>,
    engine_id: Option<i64>,
    transmission_id: Option<i64>,
    search: Option<String>,
) -> Result<Vec<ProductRecommendation>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let mut sql = String::from(
        "SELECT p.id, p.name, p.sku, p.sale_price, p.stock_quantity, c.name AS category_name, b.name AS brand_name, COUNT(pvc.id) AS compatibility_count FROM product_vehicle_compatibility pvc JOIN products p ON p.id = pvc.product_id LEFT JOIN categories c ON c.id = p.category_id LEFT JOIN brands b ON b.id = p.brand_id WHERE p.is_active = 1"
    );
    let mut query_params: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();

    // The placeholder number is derived from the parameter vector instead of a
    // separate counter, so it can never drift out of sync with the bound values.
    if let Some(bid) = brand_id {
        let i = query_params.len() + 1;
        sql.push_str(&format!(" AND (pvc.brand_id = ?{i} OR pvc.brand_id IS NULL)"));
        query_params.push(Box::new(bid));
    }

    if let Some(mid) = model_id {
        let i = query_params.len() + 1;
        sql.push_str(&format!(" AND (pvc.model_id = ?{i} OR pvc.model_id IS NULL)"));
        query_params.push(Box::new(mid));
    }

    if let Some(y) = year {
        let i = query_params.len() + 1;
        sql.push_str(&format!(" AND (pvc.year_start IS NULL OR pvc.year_start <= ?{i}) AND (pvc.year_end IS NULL OR pvc.year_end >= ?{})", i + 1));
        query_params.push(Box::new(y));
        query_params.push(Box::new(y));
    }

    if let Some(eid) = engine_id {
        let i = query_params.len() + 1;
        sql.push_str(&format!(" AND (pvc.engine_id = ?{i} OR pvc.engine_id IS NULL)"));
        query_params.push(Box::new(eid));
    }

    if let Some(tid) = transmission_id {
        let i = query_params.len() + 1;
        sql.push_str(&format!(" AND (pvc.transmission_id = ?{i} OR pvc.transmission_id IS NULL)"));
        query_params.push(Box::new(tid));
    }

    if let Some(ref s) = search {
        if !s.is_empty() {
            let i = query_params.len() + 1;
            sql.push_str(&format!(" AND p.name LIKE ?{i}"));
            query_params.push(Box::new(format!("%{}%", s)));
        }
    }

    sql.push_str(" GROUP BY p.id, p.name, p.sku, p.sale_price, p.stock_quantity, c.name, b.name ORDER BY compatibility_count DESC, p.name");

    let params_refs: Vec<&dyn rusqlite::types::ToSql> = query_params.iter().map(|p| p.as_ref()).collect();
    let mut stmt = map_err!(conn.prepare(&sql))?;
    let rows = map_err!(stmt.query_map(params_refs.as_slice(), row_to_product_recommendation))?;
    let mut result = Vec::new();
    for row in rows {
        result.push(map_err!(row)?);
    }
    Ok(result)
}

#[tauri::command]
pub fn get_recommendations_for_vehicle(
    brand_id: Option<i64>,
    model_id: Option<i64>,
    year: Option<i64>,
) -> Result<Vec<ProductRecommendation>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let mut stmt = map_err!(conn.prepare(
        "SELECT p.id, p.name, p.sku, p.sale_price, p.stock_quantity, c.name AS category_name, b.name AS brand_name, COUNT(pvc.id) AS compatibility_count FROM product_vehicle_compatibility pvc JOIN products p ON p.id = pvc.product_id LEFT JOIN categories c ON c.id = p.category_id LEFT JOIN brands b ON b.id = p.brand_id WHERE p.is_active = 1 AND (pvc.brand_id = ?1 OR pvc.brand_id IS NULL) AND (pvc.model_id = ?2 OR pvc.model_id IS NULL) AND (pvc.year_start IS NULL OR pvc.year_start <= ?3) AND (pvc.year_end IS NULL OR pvc.year_end >= ?3) AND c.name IN ('Filters', 'Brakes', 'Electrical', 'Lubricants', 'Cooling', 'Engine', 'Exhaust', 'Transmission') GROUP BY p.id, p.name, p.sku, p.sale_price, p.stock_quantity, c.name, b.name ORDER BY c.sort_order, compatibility_count DESC, p.name"
    ))?;
    let rows = map_err!(stmt.query_map(rusqlite::params![brand_id, model_id, year], row_to_product_recommendation))?;
    let mut result = Vec::new();
    for row in rows {
        result.push(map_err!(row)?);
    }
    Ok(result)
}
