use serde::{Deserialize, Serialize};

use crate::DB_STATE;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProductIdentifier {
    pub id: i64,
    pub product_id: i64,
    pub identifier: String,
    pub identifier_type: String,
    pub brand_name: Option<String>,
    pub notes: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CrossReferenceResult {
    pub product_id: i64,
    pub product_name: String,
    pub product_sku: String,
    pub sale_price: f64,
    pub stock_quantity: i64,
    pub category_name: Option<String>,
    pub brand_name: Option<String>,
    pub matched_identifier: String,
    pub matched_type: String,
}

macro_rules! map_err {
    ($expr:expr) => {
        $expr.map_err(|e| format!("{}", e))
    };
}

fn row_to_identifier(row: &rusqlite::Row) -> rusqlite::Result<ProductIdentifier> {
    Ok(ProductIdentifier {
        id: row.get(0)?,
        product_id: row.get(1)?,
        identifier: row.get(2)?,
        identifier_type: row.get(3)?,
        brand_name: row.get(4)?,
        notes: row.get(5)?,
        created_at: row.get(6)?,
    })
}

fn row_to_cross_reference(row: &rusqlite::Row) -> rusqlite::Result<CrossReferenceResult> {
    Ok(CrossReferenceResult {
        product_id: row.get(0)?,
        product_name: row.get(1)?,
        product_sku: row.get(2)?,
        sale_price: row.get(3)?,
        stock_quantity: row.get(4)?,
        category_name: row.get(5)?,
        brand_name: row.get(6)?,
        matched_identifier: row.get(7)?,
        matched_type: row.get(8)?,
    })
}

#[tauri::command]
pub fn get_product_identifiers(product_id: i64) -> Result<Vec<ProductIdentifier>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let mut stmt = map_err!(conn.prepare(
        "SELECT id, product_id, identifier, identifier_type, brand_name, notes, created_at FROM product_identifiers WHERE product_id = ?1 ORDER BY identifier_type, identifier"
    ))?;
    let rows = map_err!(stmt.query_map(rusqlite::params![product_id], row_to_identifier))?;
    let mut result = Vec::new();
    for row in rows {
        result.push(map_err!(row)?);
    }
    Ok(result)
}

#[tauri::command]
pub fn create_product_identifier(
    product_id: i64,
    identifier: String,
    identifier_type: String,
    brand_name: Option<String>,
    notes: Option<String>,
) -> Result<ProductIdentifier, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    map_err!(conn.execute(
        "INSERT INTO product_identifiers (product_id, identifier, identifier_type, brand_name, notes) VALUES (?1, ?2, ?3, ?4, ?5)",
        rusqlite::params![product_id, identifier, identifier_type, brand_name, notes],
    ))?;

    let id = conn.last_insert_rowid();
    let row = conn.query_row(
        "SELECT id, product_id, identifier, identifier_type, brand_name, notes, created_at FROM product_identifiers WHERE id = ?1",
        rusqlite::params![id],
        row_to_identifier,
    ).map_err(|e| e.to_string())?;
    Ok(row)
}

#[tauri::command]
pub fn delete_product_identifier(id: i64) -> Result<(), String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    map_err!(conn.execute(
        "DELETE FROM product_identifiers WHERE id = ?1",
        rusqlite::params![id],
    ))?;
    Ok(())
}

#[tauri::command]
pub fn cross_reference_search(query: String) -> Result<Vec<CrossReferenceResult>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let like_query = format!("%{}%", query);

    let mut stmt = map_err!(conn.prepare(
        "SELECT DISTINCT p.id, p.name, p.sku, p.sale_price, p.stock_quantity, c.name AS category_name, b.name AS brand_name, ?1 AS matched_identifier, 'product_field' AS matched_type FROM products p LEFT JOIN categories c ON c.id = p.category_id LEFT JOIN brands b ON b.id = p.brand_id WHERE p.is_active = 1 AND (p.sku = ?1 OR p.barcode = ?1 OR p.oem_number = ?1 OR p.internal_code = ?1 OR p.name LIKE ?2) LIMIT 50"
    ))?;
    let rows = map_err!(stmt.query_map(rusqlite::params![query, like_query], row_to_cross_reference))?;
    let mut results: Vec<CrossReferenceResult> = Vec::new();
    let mut seen_ids = std::collections::HashSet::new();
    for row in rows {
        let r = map_err!(row)?;
        if seen_ids.insert(r.product_id) {
            results.push(r);
        }
    }

    let mut stmt2 = map_err!(conn.prepare(
        "SELECT DISTINCT p.id, p.name, p.sku, p.sale_price, p.stock_quantity, c.name AS category_name, b.name AS brand_name, pi.identifier, pi.identifier_type FROM product_identifiers pi JOIN products p ON p.id = pi.product_id LEFT JOIN categories c ON c.id = p.category_id LEFT JOIN brands b ON b.id = p.brand_id WHERE p.is_active = 1 AND (pi.identifier = ?1 OR pi.identifier LIKE ?2) LIMIT 50"
    ))?;
    let rows2 = map_err!(stmt2.query_map(rusqlite::params![query, like_query], row_to_cross_reference))?;
    for row in rows2 {
        let r = map_err!(row)?;
        if seen_ids.insert(r.product_id) {
            results.push(r);
        }
    }

    results.sort_by(|a, b| a.product_name.cmp(&b.product_name));
    Ok(results)
}
