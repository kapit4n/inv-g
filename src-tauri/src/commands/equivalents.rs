use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::State;

use crate::db::DbState;

fn get_conn<'r>(state: &'r State<'r, DbState>) -> Result<std::sync::MutexGuard<'r, rusqlite::Connection>, String> {
    state.conn.lock().map_err(|e| format!("Database lock error: {}", e))
}

// A relationship row joined with the counter-part product. `product_id` is
// always the product the list/tab was opened from; `equivalent_product_id`
// and the joined fields describe the other product of the pair.
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ProductEquivalent {
    pub id: i64,
    pub product_id: i64,
    pub equivalent_product_id: i64,
    pub note: Option<String>,
    pub created_at: String,
    // Joined product data of the equivalent (counter-part) product.
    pub name: String,
    pub sku: String,
    pub brand_name: Option<String>,
    pub category_name: Option<String>,
    pub stock_quantity: i64,
    pub unit: String,
    pub sale_price: f64,
    pub wholesale_price: f64,
    pub tax_rate: f64,
    pub image_url: Option<String>,
    pub is_active: bool,
}

const EQUIV_PREFIX: &str = "SELECT e.id, p.id, e.note, e.created_at,
            p.name, p.sku, b.name, c.name, p.stock_quantity, p.unit,
            p.sale_price, p.wholesale_price, p.tax_rate, p.image_url, p.is_active
     FROM product_equivalents e
     JOIN products p ON p.id = CASE WHEN e.product_id = ?1 THEN e.equivalent_product_id ELSE e.product_id END
     LEFT JOIN brands b ON b.id = p.brand_id
     LEFT JOIN categories c ON c.id = p.category_id";

fn row_to_equivalent(row: &rusqlite::Row, requested: i64) -> rusqlite::Result<ProductEquivalent> {
    Ok(ProductEquivalent {
        id: row.get(0)?,
        product_id: requested,
        equivalent_product_id: row.get(1)?,
        note: row.get(2)?,
        created_at: row.get(3)?,
        name: row.get(4)?,
        sku: row.get(5)?,
        brand_name: row.get(6)?,
        category_name: row.get(7)?,
        stock_quantity: row.get(8)?,
        unit: row.get(9)?,
        sale_price: row.get(10)?,
        wholesale_price: row.get(11)?,
        tax_rate: row.get(12)?,
        image_url: row.get(13)?,
        is_active: row.get::<_, i64>(14)? != 0,
    })
}

fn fetch_equivalent(
    conn: &rusqlite::Connection,
    relationship_id: i64,
    requested_product_id: i64,
) -> Result<ProductEquivalent, String> {
    conn.query_row(
        "SELECT e.id, p.id, e.note, e.created_at,
            p.name, p.sku, b.name, c.name, p.stock_quantity, p.unit,
            p.sale_price, p.wholesale_price, p.tax_rate, p.image_url, p.is_active
         FROM product_equivalents e
         JOIN products p ON p.id = CASE WHEN e.product_id = ?2 THEN e.equivalent_product_id ELSE e.product_id END
         LEFT JOIN brands b ON b.id = p.brand_id
         LEFT JOIN categories c ON c.id = p.category_id
         WHERE e.id = ?1",
        params![relationship_id, requested_product_id],
        |row| row_to_equivalent(row, requested_product_id),
    )
    .map_err(|e| e.to_string())
}

fn get_equivalents_internal(
    conn: &rusqlite::Connection,
    product_id: i64,
) -> Result<Vec<ProductEquivalent>, String> {
    let mut stmt = conn
        .prepare(&format!("{} WHERE e.product_id = ?1 OR e.equivalent_product_id = ?1 ORDER BY p.name COLLATE NOCASE", EQUIV_PREFIX))
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(params![product_id], |row| row_to_equivalent(row, product_id))
        .map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for row in rows {
        result.push(row.map_err(|e| e.to_string())?);
    }
    Ok(result)
}

fn add_equivalent_internal(
    conn: &rusqlite::Connection,
    product_id: i64,
    equivalent_product_id: i64,
    note: Option<String>,
    created_by: Option<i64>,
) -> Result<ProductEquivalent, String> {
    if product_id == equivalent_product_id {
        return Err("Un producto no puede ser equivalente de sí mismo.".into());
    }

    let exists: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM products WHERE id IN (?1, ?2)",
            params![product_id, equivalent_product_id],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;
    if exists != 2 {
        return Err("Uno de los productos no existe.".into());
    }

    let (low, high) = if product_id < equivalent_product_id {
        (product_id, equivalent_product_id)
    } else {
        (equivalent_product_id, product_id)
    };

    let already: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM product_equivalents WHERE product_id = ?1 AND equivalent_product_id = ?2",
            params![low, high],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;
    if already > 0 {
        return Err("La relación de equivalencia ya existe.".into());
    }

    conn.execute(
        "INSERT INTO product_equivalents (product_id, equivalent_product_id, note) VALUES (?1, ?2, ?3)",
        params![low, high, note],
    )
    .map_err(|e| e.to_string())?;
    let id = conn.last_insert_rowid();

    if let Some(uid) = created_by {
        conn.execute(
            "INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, severity)
             VALUES (?1, ?2, 'product', ?3, ?4, 'info')",
            params![
                uid,
                "create_equivalent",
                product_id.to_string(),
                format!(
                    "Producto {} marcado como equivalente del producto {}.",
                    product_id, equivalent_product_id
                )
            ],
        )
        .map_err(|e| e.to_string())?;
    }

    fetch_equivalent(conn, id, product_id)
}

fn remove_equivalent_internal(
    conn: &rusqlite::Connection,
    relationship_id: i64,
    created_by: Option<i64>,
) -> Result<(), String> {
    let pair_info: Option<(i64, i64)> = conn
        .query_row(
            "SELECT product_id, equivalent_product_id FROM product_equivalents WHERE id = ?1",
            params![relationship_id],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .ok();

    let removed = conn
        .execute(
            "DELETE FROM product_equivalents WHERE id = ?1",
            params![relationship_id],
        )
        .map_err(|e| e.to_string())?;

    if removed == 0 {
        return Err("La relación de equivalencia no existe.".into());
    }

    if let Some((low, high)) = pair_info {
        if let Some(uid) = created_by {
            let _ = conn.execute(
                "INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, severity)
                 VALUES (?1, ?2, 'product', ?3, ?4, 'info')",
                params![
                    uid,
                    "delete_equivalent",
                    low.to_string(),
                    format!("Relación de equivalencia entre los productos {} y {}.", low, high)
                ],
            );
        }
    }

    Ok(())
}

#[tauri::command]
pub fn get_product_equivalents(state: State<DbState>, product_id: i64) -> Result<Vec<ProductEquivalent>, String> {
    let conn = get_conn(&state)?;
    get_equivalents_internal(&conn, product_id)
}

#[tauri::command]
pub fn add_product_equivalent(
    state: State<DbState>,
    product_id: i64,
    equivalent_product_id: i64,
    note: Option<String>,
    created_by: Option<i64>,
) -> Result<ProductEquivalent, String> {
    let conn = get_conn(&state)?;
    add_equivalent_internal(&conn, product_id, equivalent_product_id, note, created_by)
}

#[tauri::command]
pub fn remove_product_equivalent(state: State<DbState>, relationship_id: i64, created_by: Option<i64>) -> Result<(), String> {
    let conn = get_conn(&state)?;
    remove_equivalent_internal(&conn, relationship_id, created_by)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::config::PROFILE_SINGLE_STORE;
    use crate::db::init_database_with_profile;

    fn test_db() -> rusqlite::Connection {
        let dir = std::env::temp_dir().join(format!("ig_equiv_test_{}", uuid::Uuid::new_v4()));
        std::fs::create_dir_all(&dir).expect("create temp dir");
        let path = dir.join("equiv.db");
        init_database_with_profile(path.to_str().unwrap(), PROFILE_SINGLE_STORE).expect("init db")
    }

    fn insert_product(conn: &rusqlite::Connection, sku: &str) -> i64 {
        conn.execute(
            "INSERT INTO products (name, sku, cost_price, sale_price, is_active) VALUES (?1, ?2, 5.0, 10.0, 1)",
            params![format!("Producto {}", sku), sku],
        )
        .unwrap();
        conn.last_insert_rowid()
    }

    #[test]
    fn roundtrip_add_get_remove() {
        let conn = test_db();
        let a = insert_product(&conn, "EQ-ROUND-A");
        let b = insert_product(&conn, "EQ-ROUND-B");

        let added = add_equivalent_internal(&conn, a, b, Some("misma pieza".into()), Some(1)).unwrap();
        assert_eq!(added.product_id, a);
        assert_eq!(added.equivalent_product_id, b);
        assert_eq!(added.name, "Producto EQ-ROUND-B");
        assert_eq!(added.sku, "EQ-ROUND-B");
        assert!((added.sale_price - 10.0).abs() < f64::EPSILON);

        // Symmetric read: listing from either side returns the counterpart.
        let from_a = get_equivalents_internal(&conn, a).unwrap();
        assert_eq!(from_a.len(), 1);
        assert_eq!(from_a[0].equivalent_product_id, b);
        let from_b = get_equivalents_internal(&conn, b).unwrap();
        assert_eq!(from_b.len(), 1);
        assert_eq!(from_b[0].product_id, b);
        assert_eq!(from_b[0].equivalent_product_id, a);

        // Audit row recorded.
        let audit: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM audit_logs WHERE action='create_equivalent' AND entity_id=?1",
                params![a.to_string()],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(audit, 1);

        remove_equivalent_internal(&conn, added.id, Some(1)).unwrap();
        assert!(get_equivalents_internal(&conn, a).unwrap().is_empty());

        let audit: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM audit_logs WHERE action='delete_equivalent'",
                [],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(audit, 1);
    }

    #[test]
    fn rejects_self_and_unknown_products() {
        let conn = test_db();
        let a = insert_product(&conn, "EQ-REJ-A");
        assert!(add_equivalent_internal(&conn, a, a, None, None).is_err());

        let unknown = 999_999_i64;
        assert!(add_equivalent_internal(&conn, a, unknown, None, None).is_err());
        assert!(add_equivalent_internal(&conn, unknown, a, None, None).is_err());
    }

    #[test]
    fn rejects_duplicate_pair_in_either_order() {
        let conn = test_db();
        let a = insert_product(&conn, "EQ-DUP-A");
        let b = insert_product(&conn, "EQ-DUP-B");

        add_equivalent_internal(&conn, a, b, None, None).unwrap();
        // Same direction and reversed direction both fail (canonical storage).
        assert!(add_equivalent_internal(&conn, a, b, None, None).is_err());
        assert!(add_equivalent_internal(&conn, b, a, None, None).is_err());
        assert_eq!(get_equivalents_internal(&conn, a).unwrap().len(), 1);
    }

    #[test]
    fn remove_returns_error_for_missing_relationship() {
        let conn = test_db();
        assert!(remove_equivalent_internal(&conn, 123_456, None).is_err());
    }
}