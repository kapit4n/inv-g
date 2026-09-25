//! Pricing domain logic — the single source of truth for how a product's
//! selling price is derived from its cost and profit margin.
//!
//! Rules (mirrored 1:1 by `src/lib/pricing.ts` on the frontend):
//!
//! * `suggested_price = round2(cost * (1 + margin_pct / 100))`
//! * `effective_margin = product.margin ?? global.default_margin`
//! * `effective_price = edited_price ?? suggested_price`
//!
//! `sale_price` on the `products` table is kept in sync with `effective_price`
//! by every write path (create/update/import/global-margin change) so POS,
//! reports and historical snapshots keep working unchanged.

use rusqlite::Connection;

/// The `application_settings` key that holds the app-wide default profit
/// margin. Empty (NULL) individual margins fall back to this value.
pub const DEFAULT_MARGIN_SETTING_KEY: &str = "default_margin_percent";
pub const DEFAULT_MARGIN_VALUE: f64 = 30.0;

/// Minimum and maximum allowed profit margin percentages. Mirrors the
/// validation declared for `business.default_margin_percent` in the seed.
pub const MARGIN_MIN: f64 = 0.0;
pub const MARGIN_MAX: f64 = 90.0;

/// Round a monetary amount / percentage to 2 decimals.
pub fn round2(x: f64) -> f64 {
    (x * 100.0).round() / 100.0
}

/// Round a profit margin percentage to 1 decimal (display precision).
pub fn round_margin(x: f64) -> f64 {
    (x * 10.0).round() / 10.0
}

/// Selling price suggested by a cost and a profit margin percentage,
/// `cost * (1 + margin_pct / 100)`, rounded to 2 decimals.
pub fn suggested_price(cost: f64, margin_pct: f64) -> f64 {
    round2(cost * (1.0 + margin_pct / 100.0))
}

/// Resolve the effective margin percentage for a product: the product's own
/// margin when set, otherwise the supplied default.
pub fn effective_margin(margin_pct: Option<f64>, default_margin_pct: f64) -> f64 {
    margin_pct.unwrap_or(default_margin_pct)
}

/// The effective selling price: the manually edited price when present,
/// otherwise the computed suggested price. Returns the value as-is (already
/// rounded by the caller when it comes from DB inputs / suggested_price).
pub fn effective_price(suggested: f64, edited_price: Option<f64>) -> f64 {
    edited_price.unwrap_or(suggested)
}

/// Convenience: effective price straight from a product's inputs.
/// Convenience wrapper over `effective_price`; not yet called from the
/// command layer.
#[allow(dead_code)]
pub fn resolve_effective_price(
    cost: f64,
    margin_pct: Option<f64>,
    default_margin_pct: f64,
    edited_price: Option<f64>,
) -> f64 {
    effective_price(suggested_price(cost, effective_margin(margin_pct, default_margin_pct)), edited_price)
}

/// Validate a percentage so it stays inside the allowed margin range.
pub fn validate_margin(pct: f64) -> Result<(), String> {
    if pct < MARGIN_MIN || pct > MARGIN_MAX || pct.is_nan() {
        return Err(format!(
            "El porcentaje de ganancia debe estar entre {}% y {}%",
            MARGIN_MIN, MARGIN_MAX
        ));
    }
    Ok(())
}

/// Validate a cost / price amount is not negative.
pub fn validate_amount(value: f64, label: &str) -> Result<(), String> {
    if value < 0.0 || value.is_nan() {
        return Err(format!("{} no puede ser negativo", label));
    }
    Ok(())
}

/// The currently configured app-wide default profit margin (percent), reading
/// from `application_settings`. Falls back to [`DEFAULT_MARGIN_VALUE`] when
/// the row is missing or malformed.
pub fn get_default_margin(conn: &Connection) -> f64 {
    conn.query_row(
        "SELECT value FROM application_settings WHERE key = ?1",
        rusqlite::params![DEFAULT_MARGIN_SETTING_KEY],
        |row| row.get::<_, String>(0),
    )
    .ok()
    .and_then(|v| v.parse::<f64>().ok())
    .unwrap_or(DEFAULT_MARGIN_VALUE)
}

/// Recompute `sale_price` for every product that follows the app-wide default
/// (no individual margin and no manual price edit), applying the given default
/// margin. Products with their own margin or an edited price are untouched.
/// Used when the global default margin setting changes.
///
/// Returns the number of products that were updated.
pub fn reprice_following_global_default(conn: &Connection, default_margin_pct: f64) -> Result<usize, String> {
    conn.execute(
        "UPDATE products
            SET sale_price = ROUND(cost_price * (1 + ?1 / 100.0), 2),
                updated_at = datetime('now')
          WHERE profit_margin_pct IS NULL
            AND edited_price IS NULL",
        rusqlite::params![round_margin(default_margin_pct)],
    )
    .map_err(|e| e.to_string())
}

/// Back-calculate a product's implied margin so that its current selling price
/// is preserved once the new pricing model is applied. Used by the v13→v14
/// schema migration (the suggested price derived from this margin reproduces
/// the existing `sale_price`).
pub fn implied_margin_pct(cost: f64, sale_price: f64) -> Option<f64> {
    if cost > 0.0 && sale_price > 0.0 {
        Some(round_margin((sale_price / cost - 1.0) * 100.0))
    } else {
        None
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn round2_rounds_to_two_decimals() {
        assert_eq!(round2(12.345), 12.35);
        assert_eq!(round2(12.344), 12.34);
        assert_eq!(round2(0.0), 0.0);
        assert_eq!(round2(10.0), 10.0);
    }

    #[test]
    fn round_margin_rounds_to_one_decimal() {
        assert_eq!(round_margin(42.857), 42.9);
        assert_eq!(round_margin(42.4), 42.4);
    }

    #[test]
    fn suggested_price_is_cost_times_one_plus_margin() {
        assert_eq!(suggested_price(100.0, 30.0), 130.0);
        assert_eq!(suggested_price(70.0, 30.0), 91.0);
        assert_eq!(suggested_price(24.5, 42.9), 35.01);
        assert_eq!(suggested_price(0.0, 30.0), 0.0);
    }

    #[test]
    fn effective_margin_falls_back_to_default() {
        assert_eq!(effective_margin(Some(15.0), 30.0), 15.0);
        assert_eq!(effective_margin(None, 30.0), 30.0);
    }

    #[test]
    fn effective_price_prefers_edited_override() {
        assert_eq!(effective_price(130.0, None), 130.0);
        assert_eq!(effective_price(130.0, Some(150.0)), 150.0);
    }

    #[test]
    fn resolve_effective_price_end_to_end() {
        // cost 100, no individual margin -> global 30 -> suggested 130.
        assert_eq!(resolve_effective_price(100.0, None, 30.0, None), 130.0);
        // individual margin wins.
        assert_eq!(resolve_effective_price(100.0, Some(50.0), 30.0, None), 150.0);
        // edited price overrides the computed one.
        assert_eq!(resolve_effective_price(100.0, Some(50.0), 30.0, Some(999.0)), 999.0);
    }

    #[test]
    fn validate_margin_enforces_range() {
        assert!(validate_margin(0.0).is_ok());
        assert!(validate_margin(90.0).is_ok());
        assert!(validate_margin(30.5).is_ok());
        assert!(validate_margin(-1.0).is_err());
        assert!(validate_margin(90.1).is_err());
        assert!(validate_margin(f64::NAN).is_err());
    }

    #[test]
    fn validate_amount_rejects_negatives() {
        assert!(validate_amount(0.0, "costo").is_ok());
        assert!(validate_amount(12.5, "costo").is_ok());
        assert!(validate_amount(-0.01, "costo").is_err());
    }

    #[test]
    fn implied_margin_preserves_price_on_resolve() {
        let cost = 24.5;
        let sale = 35.0;
        let margin = implied_margin_pct(cost, sale).unwrap();
        let resolved = suggested_price(cost, margin);
        // Round-trip lands within one cent of the original price.
        assert!((resolved - sale).abs() <= 0.01);
        assert_eq!(implied_margin_pct(0.0, 35.0), None);
        assert_eq!(implied_margin_pct(24.5, 0.0), None);
    }

    #[test]
    fn reprice_following_global_default_updates_only_unedited_products() {
        let conn = rusqlite::Connection::open_in_memory().unwrap();
        conn.execute_batch(
            "CREATE TABLE products (
                id INTEGER PRIMARY KEY,
                name TEXT,
                cost_price REAL,
                sale_price REAL,
                profit_margin_pct REAL,
                edited_price REAL,
                updated_at TEXT
            )",
        )
        .unwrap();
        conn.execute(
            "INSERT INTO products (name, cost_price, sale_price, profit_margin_pct, edited_price) VALUES
                ('global', 100.0, 0.0, NULL, NULL),
                ('own-margin', 100.0, 140.0, 40.0, NULL),
                ('edited', 100.0, 99.0, NULL, 99.0)",
            [],
        )
        .unwrap();

        let updated = reprice_following_global_default(&conn, 30.0).unwrap();
        assert_eq!(updated, 1);

        let prices: Vec<(String, f64)> = conn
            .prepare("SELECT name, sale_price FROM products ORDER BY id")
            .unwrap()
            .query_map([], |row| Ok((row.get(0)?, row.get(1)?)))
            .unwrap()
            .collect::<rusqlite::Result<_>>()
            .unwrap();
        assert_eq!(prices[0].1, 130.0);
        assert_eq!(prices[1].1, 140.0);
        assert_eq!(prices[2].1, 99.0);
    }
}