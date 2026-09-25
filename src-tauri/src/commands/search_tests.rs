//! Regression tests for every user-facing search in the app.
//!
//! These exist because a search once failed *hard* on the Products list: the
//! shared `paginate` helper built its `COUNT(*)` without the `WHERE` clause yet
//! still bound the filter parameter, so SQLite rejected the statement
//! (`Wrong number of parameters passed to query. Got 1, needed 0`). Two further
//! latent faults lived in the same helper — `LIMIT ?1` stealing the caller's
//! `?1`, and a `total` that described the unfiltered table.
//!
//! The bug class is "SQL that looks right but binds the wrong thing", which
//! reading cannot catch. So every search is executed here against the **real**
//! schema from `db::schema::create_tables`, never against a hand-written copy:
//!
//! * searches that read the `DB_STATE` global are called as real functions;
//! * searches behind `State<DbState>` cannot be constructed in a unit test
//!   (`tauri::State` has no public constructor), so their SQL was extracted to
//!   `pub(crate)` consts that the command and these tests both reference — there
//!   is no duplicated SQL to drift out of sync.

use crate::db::DbState;
use rusqlite::Connection;
use std::path::PathBuf;
use std::sync::{Arc, Mutex, MutexGuard, Once};

use super::compatibility::search_compatible_products;
use super::cross_references::cross_reference_search;
use super::customers::get_customers;
use super::inventory::{paginate, PRODUCTS_SEARCH_WHERE};
use super::purchases::build_purchase_order_filter;
use super::sales::{GLOBAL_PRODUCT_SEARCH_SQL, SEARCH_PRODUCTS_FOR_POS_SQL, SEARCH_SALES_SQL};
use super::vehicles::{get_vehicle_brands, get_vehicle_engines, get_vehicle_models};

static INIT: Once = Once::new();

/// Installs a real, seeded, in-memory schema as the crate's `DB_STATE` so the
/// global-backed commands can be invoked for real. Runs once per test binary.
fn db() -> &'static DbState {
    INIT.call_once(|| {
        let conn = Connection::open_in_memory().expect("open in-memory db");
        crate::db::schema::create_tables(&conn).expect("create_tables");
        seed(&conn);
        let _ = crate::DB_STATE.set(DbState {
            conn: Arc::new(Mutex::new(conn)),
            db_path: PathBuf::from(":memory:"),
            profile: "test".into(),
        });
    });
    crate::DB_STATE.get().expect("DB_STATE must be initialised")
}

fn conn() -> MutexGuard<'static, Connection> {
    // Deliberately poison-tolerant: a failed assertion in one search must not
    // cascade into every other test, since they all share this one connection.
    db().conn.lock().unwrap_or_else(|e| e.into_inner())
}

fn seed(c: &Connection) {
    c.execute_batch(
        // ── customers ──
        "INSERT INTO customers (name, email, phone) VALUES
           ('Ana Lopez',  'ana@example.com',  '70011111'),
           ('Bruno Diaz',  'bruno@shop.com',  '70022222'),
           ('Carlos Ruiz', 'carlos@mail.org', '70033333');",
    )
    .unwrap();

    // ── vehicle catalog ──
    c.execute_batch(
        "INSERT INTO vehicle_brands (id, name) VALUES (1, 'Toyota'), (2, 'Honda');
         INSERT INTO vehicle_models (brand_id, name) VALUES
           (1, 'Corolla'), (1, 'Hilux'), (2, 'Civic');
         INSERT INTO vehicle_engines (id, name) VALUES (1, '1.8 VVT-i'), (2, '2.0 Diesel');",
    )
    .unwrap();

    // ── products + identifiers ──
    c.execute_batch(
        "INSERT INTO products (id, name, sku, barcode, oem_number, internal_code, is_active) VALUES
           (1, 'Brake Pad Set',  'BP-100', '7801110000001', 'OEM-BP1', 'INT-BP1', 1),
           (2, 'Oil Filter',     'OIL-200','7801110000002', 'OEM-OF1', 'INT-OF1', 1),
           (3, 'Spark Plug',     'SPK-300','7801110000003', 'OEM-SP1', 'INT-SP1', 1),
           (4, 'Oil Filter XL',  'OIL-400','7801110000004', 'OEM-OF2', 'INT-OF2', 1),
           (5, 'Retired Part',   'OLD-900', NULL,          NULL,       NULL,       0);
         INSERT INTO product_identifiers (product_id, identifier, identifier_type) VALUES
           (1, 'BP-100-X', 'supplier'), (2, 'OF-SUP-77', 'supplier'), (3, 'SPK-300-X', 'supplier');",
    )
    .unwrap();

    // ── vehicle compatibility (exercises the multi-filter param indices) ──
    c.execute_batch(
        "INSERT INTO product_vehicle_compatibility (product_id, brand_id, model_id, engine_id, year_start, year_end) VALUES
           (1, 1, 1, 1, 2015, 2020),
           (2, 1, 2, 2, 2018, 2024),
           (3, 2, 3, 1, 2016, 2022);",
    )
    .unwrap();

    // ── sales ──
    c.execute_batch(
        "INSERT INTO sales (id, sale_number, customer_id, total) VALUES
           (1, 'SALE-0001', 1, 100.0),
           (2, 'SALE-0002', 2, 200.0),
           (3, 'SALE-0003', 3, 300.0);",
    )
    .unwrap();

    // ── purchase orders ──
    c.execute_batch(
        "INSERT INTO suppliers (id, company_name) VALUES (1, 'AutoParts SA'), (2, 'MotorTodo');
         INSERT INTO purchase_orders (id, po_number, supplier_id, buyer, reference_number, status, order_date, total) VALUES
           (1, 'PO-0001', 1, 'ana',   'REF-A', 'draft',     '2026-01-10', 10.0),
           (2, 'PO-0002', 2, 'bruno', 'REF-B', 'received', '2026-02-10', 20.0),
           (3, 'PO-0003', 1, 'carlos','REF-C', 'draft',     '2026-03-10', 30.0);",
    )
    .unwrap();
}

// ── parameter-index invariant ───────────────────────────────────────────────

/// Highest `?N` placeholder in `sql` (0 when there are none).
fn max_param_index(sql: &str) -> usize {
    let mut max = 0;
    let bytes: Vec<char> = sql.chars().collect();
    for (i, c) in bytes.iter().enumerate() {
        if *c == '?' {
            let digits: String = bytes[i + 1..]
                .iter()
                .take_while(|d| d.is_ascii_digit())
                .collect();
            if !digits.is_empty() {
                max = max.max(digits.parse::<usize>().unwrap());
            }
        }
    }
    max
}

/// The invariant the original bug violated: every placeholder the statement
/// mentions must have exactly one bound value, and there must be no extras.
fn assert_bindings_match(sql: &str, bound: usize, what: &str) {
    assert_eq!(
        max_param_index(sql),
        bound,
        "{}: highest ?N is not the number of bound params",
        what
    );
}

#[test]
fn every_search_sql_binds_one_value_per_placeholder() {
    // (sql, values it binds, label)
    let cases: Vec<(&str, usize, &str)> = vec![
        (PRODUCTS_SEARCH_WHERE, 1, "get_products search"),
        (SEARCH_PRODUCTS_FOR_POS_SQL, 1, "search_products_for_pos"),
        (GLOBAL_PRODUCT_SEARCH_SQL, 4, "global_product_search"),
        (SEARCH_SALES_SQL, 1, "search_sales"),
    ];
    for (sql, bound, what) in cases {
        assert_bindings_match(sql, bound, what);
    }
}

#[test]
fn purchase_order_filter_indices_track_bound_values() {
    // Every filter subset the UI can produce: search alone, search + each
    // trailing filter, and the full set. The clause must claim one new index
    // per value in the same order.
    let flags: Vec<(&str, Option<&str>, Option<&str>, Option<i64>, Option<i64>, Option<&str>, Option<&str>, Option<&str>)> = vec![
        ("all none", None, None, None, None, None, None, None),
        ("search", Some("PO"), None, None, None, None, None, None),
        ("search+status", Some("PO"), Some("draft"), None, None, None, None, None),
        ("search+status+supplier", Some("PO"), Some("draft"), Some(1), None, None, None, None),
        ("search+status+supplier+wh", Some("PO"), Some("draft"), Some(1), Some(2), None, None, None),
        ("search+status+supplier+wh+buyer", Some("PO"), Some("draft"), Some(1), Some(2), Some("ana"), None, None),
        ("full", Some("PO"), Some("draft"), Some(1), Some(2), Some("ana"), Some("2026-01-01"), Some("2026-12-31")),
        ("status only", None, Some("draft"), None, None, None, None, None),
        ("empty strings ignored", Some(""), Some(""), None, None, Some(""), Some(""), Some("")),
    ];
    for (label, search, status, sup, wh, buyer, from, to) in flags {
        let (clause, params) =
            build_purchase_order_filter(search, status, sup, wh, buyer, from, to);
        let sql = format!(
            "SELECT po.id FROM purchase_orders po LEFT JOIN suppliers s ON s.id = po.supplier_id {}",
            clause
        );
        assert_eq!(
            max_param_index(&sql),
            params.len(),
            "purchase_order_filter[{}]: index/value mismatch in `{}`",
            label,
            clause
        );
    }
}

// ── Products list (the command that was broken) ─────────────────────────────

fn products_search(term: Option<&str>, page: i64, page_size: i64) -> (i64, Vec<String>) {
    // The guard is dropped before the unwrap on purpose: panicking while holding
    // the shared connection would poison the Mutex, and the commands behind
    // DB_STATE turn a poisoned lock into an Err -- cascading one failure into
    // every other search test.
    let outcome = {
        let c = conn();
        let (clause, params) = match term {
            Some(q) => (
                PRODUCTS_SEARCH_WHERE.to_string(),
                vec![Box::new(format!("%{}%", q)) as Box<dyn rusqlite::types::ToSql>],
            ),
            None => (String::new(), vec![]),
        };
        paginate(&c, "products", page, page_size, &clause, params, |row| {
            Ok(row.get::<_, String>(1)?)
        })
    };
    let res = outcome
        .unwrap_or_else(|e| panic!("products search `{}` failed: {}", term.unwrap_or("-"), e));
    (res.total, res.data)
}

/// Runs `f` against the shared connection, releasing the lock before returning
/// so an `Err` here never poisons it.
fn with_conn<T>(f: impl FnOnce(&Connection) -> T) -> T {
    let outcome = {
        let c = conn();
        f(&c)
    };
    outcome
}

#[test]
fn products_search_filters_and_counts_against_real_schema() {
    let (total, names) = products_search(Some("Oil"), 1, 20);
    assert_eq!(total, 2, "total must reflect the filter, not the table");
    assert_eq!(names.len(), 2);
    assert!(names.iter().all(|n| n.contains("Oil")), "got {:?}", names);
}

#[test]
fn products_search_matches_each_searched_column() {
    for (term, expected) in [
        ("Brake", 1),      // name
        ("OIL-200", 1),    // sku
        ("7801110000003", 1), // barcode
        ("OEM-SP1", 1),   // oem_number
        ("INT-OF2", 1),   // internal_code
    ] {
        let (total, _) = products_search(Some(term), 1, 20);
        assert_eq!(total, expected, "searching `{}` should match {}", term, expected);
    }
}

#[test]
fn products_search_paginates_and_surfaces_inactive_items() {
    // Note: the product *list* intentionally has no is_active filter (unlike the
    // POS search), so discontinued rows are searchable here. Pinned so a future
    // change to that is a deliberate one.
    let (total, inactive) = products_search(Some("Retired"), 1, 20);
    assert_eq!(total, 1);
    assert_eq!(inactive, vec!["Retired Part".to_string()]);

    let (total, page1) = products_search(None, 1, 2);
    assert_eq!(total, 5);
    assert_eq!(page1.len(), 2);
    let (total2, page2) = products_search(None, 2, 2);
    assert_eq!(total2, 5);
    assert_eq!(page2.len(), 2);
    let (total3, page3) = products_search(None, 3, 2);
    assert_eq!(total3, 5);
    assert_eq!(page3.len(), 1);
}

// ── POS / global / sales searches (State-backed: exercised via consts) ──────

#[test]
fn pos_product_search_returns_matches() {
    let names = with_conn(|c| {
        let mut stmt = c.prepare(SEARCH_PRODUCTS_FOR_POS_SQL).unwrap();
        stmt.query_map(rusqlite::params!["%Filter%"], |row| row.get::<_, String>(1))
            .unwrap()
            .map(|r| r.unwrap())
            .collect::<Vec<String>>()
    });
    assert_eq!(names.len(), 2, "got {:?}", names);
    let none = with_conn(|c| {
        let mut stmt = c.prepare(SEARCH_PRODUCTS_FOR_POS_SQL).unwrap();
        stmt.query_map(rusqlite::params!["%NoSuchThing%"], |row| row.get::<_, String>(1))
            .unwrap()
            .map(|r| r.unwrap())
            .collect::<Vec<String>>()
    });
    assert!(none.is_empty());
}

#[test]
fn global_product_search_ranks_exact_match_first() {
    // "Oil Filter" (exact) and "Oil Filter XL" (prefix) both match.
    let rows = with_conn(|c| {
        let mut stmt = c.prepare(GLOBAL_PRODUCT_SEARCH_SQL).unwrap();
        stmt.query_map(rusqlite::params!["Oil Filter", "Oil Filter%", "%Oil Filter%", 20i64], |row| {
            Ok((row.get::<_, String>(1)?, row.get::<_, i64>(14)?))
        })
        .unwrap()
        .map(|r| r.unwrap())
        .collect::<Vec<(String, i64)>>()
    });
    let names: Vec<&str> = rows.iter().map(|(n, _)| n.as_str()).collect();
    assert_eq!(names.first(), Some(&"Oil Filter"), "exact match must rank first, got {:?}", names);
    assert!(names.contains(&"Oil Filter XL"), "prefix match must be included: {:?}", names);
    // relevance 0 for the exact hit, 1 for the prefix hit
    assert_eq!(rows[0].1, 0);
}

#[test]
fn global_product_search_limit_is_bound_not_literal() {
    let n = with_conn(|c| {
        let mut stmt = c.prepare(GLOBAL_PRODUCT_SEARCH_SQL).unwrap();
        stmt.query_row(rusqlite::params!["%o%", "%o%", "%o%", 1i64], |row| {
            row.get::<_, i64>(0).map(|_| 1i64)
        })
        .unwrap()
    });
    assert_eq!(n, 1, "LIMIT ?4 must honour the bound limit");
}

#[test]
fn sales_search_matches_number_and_customer_name() {
    let by_number = with_conn(|c| {
        let mut stmt = c.prepare(SEARCH_SALES_SQL).unwrap();
        stmt.query_map(rusqlite::params!["%0002%"], |row| row.get::<_, String>(1))
            .unwrap()
            .map(|r| r.unwrap())
            .collect::<Vec<String>>()
    });
    assert_eq!(by_number, vec!["SALE-0002".to_string()]);

    let by_customer = with_conn(|c| {
        let mut stmt = c.prepare(SEARCH_SALES_SQL).unwrap();
        stmt.query_map(rusqlite::params!["%Lopez%"], |row| row.get::<_, String>(1))
            .unwrap()
            .map(|r| r.unwrap())
            .collect::<Vec<String>>()
    });
    assert_eq!(by_customer, vec!["SALE-0001".to_string()]);
}

// ── Global-backed commands, called for real ─────────────────────────────────

#[test]
fn customers_search_filters_and_returns_all_when_unfiltered() {
    db(); // install DB_STATE before the command reads the global
    assert_eq!(get_customers(None).unwrap().len(), 3);
    assert_eq!(get_customers(Some("".into())).unwrap().len(), 3, "empty string must not filter");

    let by_name = get_customers(Some("lopez".into())).unwrap();
    assert_eq!(by_name.len(), 1);
    assert_eq!(by_name[0].name, "Ana Lopez", "LIKE must be case-insensitive");

    assert_eq!(get_customers(Some("shop.com".into())).unwrap().len(), 1, "email");
    assert_eq!(get_customers(Some("70033".into())).unwrap().len(), 1, "phone");
    assert_eq!(get_customers(Some("zzzz".into())).unwrap().len(), 0);
}

#[test]
fn vehicle_brands_search_works() {
    db(); // install DB_STATE before the command reads the global
    assert_eq!(get_vehicle_brands(None).unwrap().len(), 2);
    let hit = get_vehicle_brands(Some("oyo".into())).unwrap();
    assert_eq!(hit.len(), 1);
    assert_eq!(hit[0].name, "Toyota");
    assert_eq!(get_vehicle_brands(Some("nope".into())).unwrap().len(), 0);
}

#[test]
fn vehicle_models_search_composes_with_brand_filter() {
    db(); // install DB_STATE before the command reads the global
    // brand_id and search both bind params: brand is ?1, search is ?2.
    let all = get_vehicle_models(None, None).unwrap();
    assert_eq!(all.len(), 3);

    let toyota = get_vehicle_models(Some(1), None).unwrap();
    assert_eq!(toyota.len(), 2);

    let filtered = get_vehicle_models(Some(1), Some("coro".into())).unwrap();
    assert_eq!(filtered.len(), 1, "got {:?}", filtered.iter().map(|m| &m.name).collect::<Vec<_>>());
    assert_eq!(filtered[0].name, "Corolla");

    // search alone (no brand) must still work
    assert_eq!(get_vehicle_models(None, Some("civ".into())).unwrap().len(), 1);
    // search that contradicts the brand filter
    assert_eq!(get_vehicle_models(Some(1), Some("Civic".into())).unwrap().len(), 0);
}

#[test]
fn vehicle_engines_search_works() {
    db(); // install DB_STATE before the command reads the global
    assert_eq!(get_vehicle_engines(None).unwrap().len(), 2);
    assert_eq!(get_vehicle_engines(Some("vvt".into())).unwrap().len(), 1);
    assert_eq!(get_vehicle_engines(Some("zzz".into())).unwrap().len(), 0);
}

#[test]
fn compatible_products_search_binds_after_every_other_filter() {
    db(); // install DB_STATE before the command reads the global
    // With brand+model+year+engine set, `search` lands on ?6 — the highest-risk
    // spot for an index collision, since `year` consumes two placeholders.
    let all = search_compatible_products(None, None, None, None, None, None).unwrap();
    assert_eq!(all.len(), 3, "unfiltered compatibility rows");

    let by_vehicle = search_compatible_products(Some(1), Some(1), Some(2018), Some(1), None, None).unwrap();
    assert_eq!(by_vehicle.len(), 1);
    assert_eq!(by_vehicle[0].product_name, "Brake Pad Set");

    let with_search =
        search_compatible_products(Some(1), Some(1), Some(2018), Some(1), None, Some("Brake".into()))
            .unwrap();
    assert_eq!(with_search.len(), 1, "search at ?6 must reach the WHERE clause");
    assert_eq!(with_search[0].product_name, "Brake Pad Set");

    let mismatched =
        search_compatible_products(Some(1), Some(1), Some(2018), Some(1), None, Some("Spark".into()))
            .unwrap();
    assert!(mismatched.is_empty(), "search must actually filter, not be ignored");

    let search_only = search_compatible_products(None, None, None, None, None, Some("Filter".into())).unwrap();
    assert_eq!(search_only.len(), 1);
    assert_eq!(search_only[0].product_name, "Oil Filter");
}

#[test]
fn cross_reference_search_matches_fields_and_identifiers() {
    db(); // install DB_STATE before the command reads the global
    // exact sku / barcode / oem / internal code
    for q in ["BP-100", "7801110000001", "OEM-BP1", "INT-BP1"] {
        let hits = cross_reference_search(q.into()).unwrap();
        assert_eq!(hits.len(), 1, "`{}` should match exactly one product", q);
        assert_eq!(hits[0].product_name, "Brake Pad Set");
    }
    // partial name, via the LIKE branch
    let partial = cross_reference_search("Filter".into()).unwrap();
    assert_eq!(partial.len(), 2, "got {:?}", partial.iter().map(|h| &h.product_name).collect::<Vec<_>>());
    // supplier identifier
    let ident = cross_reference_search("OF-SUP-77".into()).unwrap();
    assert_eq!(ident.len(), 1);
    assert_eq!(ident[0].product_name, "Oil Filter");
    // inactive products must not surface
    assert!(cross_reference_search("OLD-900".into()).unwrap().is_empty());
    assert!(cross_reference_search("zzz-nothing".into()).unwrap().is_empty());
}
