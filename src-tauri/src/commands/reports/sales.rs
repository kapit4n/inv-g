use serde::{Deserialize, Serialize};
use crate::DB_STATE;

#[derive(Debug, Serialize)]
pub struct SalesReportRow {
    pub period: String,
    pub transaction_count: i64,
    pub subtotal: f64,
    pub discount: f64,
    pub tax: f64,
    pub total: f64,
    pub cost: f64,
    pub profit: f64,
}

#[derive(Debug, Serialize)]
pub struct SalesByCashier {
    pub user_id: i64,
    pub cashier_name: String,
    pub transaction_count: i64,
    pub total: f64,
}

#[derive(Debug, Serialize)]
pub struct SalesByPaymentMethod {
    pub method: String,
    pub count: i64,
    pub total: f64,
}

#[derive(Debug, Serialize)]
pub struct DiscountAnalysis {
    pub total_discounts: f64,
    pub avg_discount_per_sale: f64,
    pub sales_with_discount: i64,
    pub max_discount: f64,
    pub discount_percentage: f64,
}

#[derive(Debug, Serialize)]
pub struct ReturnsSummary {
    pub total_returns: i64,
    pub total_refunded: f64,
    pub avg_refund: f64,
}

#[derive(Debug, Serialize)]
pub struct TaxSummary {
    pub total_tax: f64,
    pub avg_tax_per_sale: f64,
    pub taxable_sales_count: i64,
}

#[derive(Debug, Deserialize)]
pub struct SalesReportFilter {
    pub date_from: Option<String>,
    pub date_to: Option<String>,
    pub warehouse_id: Option<i64>,
    pub cashier_id: Option<i64>,
    pub customer_id: Option<i64>,
    pub category_id: Option<i64>,
    pub brand_id: Option<i64>,
    pub product_id: Option<i64>,
    pub payment_method: Option<String>,
}

fn build_date_conditions(f: &SalesReportFilter, table: &str) -> (Vec<String>, Vec<String>) {
    let mut wheres = Vec::new();
    let mut params = Vec::new();
    if let Some(ref d) = f.date_from {
        wheres.push(format!("date({}.created_at) >= date(?)", table));
        params.push(d.clone());
    }
    if let Some(ref d) = f.date_to {
        wheres.push(format!("date({}.created_at) <= date(?)", table));
        params.push(d.clone());
    }
    (wheres, params)
}

fn exec_sales_report(f: &SalesReportFilter, group_by: &str) -> Result<Vec<SalesReportRow>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let (mut wheres, mut params) = build_date_conditions(f, "s");
    if let Some(w) = f.warehouse_id { wheres.push(format!("s.warehouse_id = ?{}", params.len() + 1)); params.push(w.to_string()); }
    if let Some(c) = f.cashier_id { wheres.push(format!("s.user_id = ?{}", params.len() + 1)); params.push(c.to_string()); }
    if let Some(c) = f.customer_id { wheres.push(format!("s.customer_id = ?{}", params.len() + 1)); params.push(c.to_string()); }
    if let Some(p) = &f.payment_method { wheres.push(format!("s.payment_method = ?{}", params.len() + 1)); params.push(p.clone()); }

    let where_clause = if wheres.is_empty() { String::new() } else { format!("WHERE {}", wheres.join(" AND ")) };

    let sql = format!(
        "SELECT {} AS period, COUNT(*) AS cnt, COALESCE(SUM(s.subtotal), 0) AS sub, COALESCE(SUM(s.discount_amount), 0) AS disc, COALESCE(SUM(s.tax_amount), 0) AS tax, COALESCE(SUM(s.total), 0) AS total, COALESCE(SUM(si.cost), 0) AS cost, COALESCE(SUM(s.total), 0) - COALESCE(SUM(si.cost), 0) AS profit FROM sales s LEFT JOIN (SELECT sale_id, SUM(p.cost_price * si.quantity) AS cost FROM sale_items si JOIN products p ON p.id = si.product_id GROUP BY sale_id) si ON si.sale_id = s.id {} GROUP BY period ORDER BY period ASC",
        group_by, where_clause
    );

    let param_refs: Vec<&dyn rusqlite::types::ToSql> = params.iter().map(|p| p as &dyn rusqlite::types::ToSql).collect();
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let rows = stmt.query_map(param_refs.as_slice(), |row| {
        Ok(SalesReportRow {
            period: row.get(0)?, transaction_count: row.get(1)?,
            subtotal: row.get(2)?, discount: row.get(3)?,
            tax: row.get(4)?, total: row.get(5)?,
            cost: row.get(6)?, profit: row.get(7)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut result = Vec::new();
    for row in rows { result.push(row.map_err(|e| e.to_string())?); }
    Ok(result)
}

#[tauri::command]
pub fn get_sales_report_daily(f: SalesReportFilter) -> Result<Vec<SalesReportRow>, String> {
    exec_sales_report(&f, "date(s.created_at)")
}

#[tauri::command]
pub fn get_sales_report_weekly(f: SalesReportFilter) -> Result<Vec<SalesReportRow>, String> {
    exec_sales_report(&f, "strftime('%Y-W%W', s.created_at)")
}

#[tauri::command]
pub fn get_sales_report_monthly(f: SalesReportFilter) -> Result<Vec<SalesReportRow>, String> {
    exec_sales_report(&f, "strftime('%Y-%m', s.created_at)")
}

#[tauri::command]
pub fn get_sales_report_yearly(f: SalesReportFilter) -> Result<Vec<SalesReportRow>, String> {
    exec_sales_report(&f, "strftime('%Y', s.created_at)")
}

#[tauri::command]
pub fn get_sales_by_cashier(f: SalesReportFilter) -> Result<Vec<SalesByCashier>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let (wheres, params) = build_date_conditions(&f, "s");
    let where_clause = if wheres.is_empty() { String::new() } else { format!("WHERE {}", wheres.join(" AND ")) };
    let sql = format!("SELECT s.user_id, u.full_name, COUNT(*) AS cnt, COALESCE(SUM(s.total), 0) AS total FROM sales s JOIN users u ON u.id = s.user_id {} GROUP BY s.user_id ORDER BY total DESC", where_clause);
    let param_refs: Vec<&dyn rusqlite::types::ToSql> = params.iter().map(|p| p as &dyn rusqlite::types::ToSql).collect();
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let rows = stmt.query_map(param_refs.as_slice(), |row| {
        Ok(SalesByCashier { user_id: row.get(0)?, cashier_name: row.get(1)?, transaction_count: row.get(2)?, total: row.get(3)? })
    }).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for row in rows { result.push(row.map_err(|e| e.to_string())?); }
    Ok(result)
}

#[tauri::command]
pub fn get_sales_by_payment_method(f: SalesReportFilter) -> Result<Vec<SalesByPaymentMethod>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let (wheres, params) = build_date_conditions(&f, "s");
    let where_clause = if wheres.is_empty() { String::new() } else { format!("WHERE {}", wheres.join(" AND ")) };
    let sql = format!("SELECT s.payment_method, COUNT(*) AS cnt, COALESCE(SUM(s.total), 0) AS total FROM sales s {} GROUP BY s.payment_method ORDER BY total DESC", where_clause);
    let param_refs: Vec<&dyn rusqlite::types::ToSql> = params.iter().map(|p| p as &dyn rusqlite::types::ToSql).collect();
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let rows = stmt.query_map(param_refs.as_slice(), |row| {
        Ok(SalesByPaymentMethod { method: row.get(0)?, count: row.get(1)?, total: row.get(2)? })
    }).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for row in rows { result.push(row.map_err(|e| e.to_string())?); }
    Ok(result)
}

#[tauri::command]
pub fn get_sales_discount_analysis(f: SalesReportFilter) -> Result<DiscountAnalysis, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let (wheres, params) = build_date_conditions(&f, "s");
    let where_clause = if wheres.is_empty() { String::new() } else { format!("WHERE {}", wheres.join(" AND ")) };
    let param_refs: Vec<&dyn rusqlite::types::ToSql> = params.iter().map(|p| p as &dyn rusqlite::types::ToSql).collect();

    let sql = format!("SELECT COALESCE(SUM(discount_amount), 0) AS total_disc, COALESCE(AVG(discount_amount), 0) AS avg_disc, SUM(CASE WHEN discount_amount > 0 THEN 1 ELSE 0 END) AS with_disc, COALESCE(MAX(discount_amount), 0) AS max_disc, CASE WHEN SUM(subtotal) > 0 THEN (SUM(discount_amount) / SUM(subtotal)) * 100 ELSE 0 END AS disc_pct FROM sales s {}", where_clause);
    let row = conn.query_row(&sql, param_refs.as_slice(), |row| {
        Ok(DiscountAnalysis {
            total_discounts: row.get(0)?, avg_discount_per_sale: row.get(1)?,
            sales_with_discount: row.get(2)?, max_discount: row.get(3)?,
            discount_percentage: row.get(4)?,
        })
    }).map_err(|e| e.to_string())?;
    Ok(row)
}

#[tauri::command]
pub fn get_sales_returns_summary(f: SalesReportFilter) -> Result<ReturnsSummary, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let refunded_count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM sales WHERE payment_status = 'refunded'",
        [], |row| row.get(0),
    ).unwrap_or(0);

    let refunded_total: f64 = conn.query_row(
        "SELECT COALESCE(SUM(total), 0) FROM sales WHERE payment_status = 'refunded'",
        [], |row| row.get(0),
    ).unwrap_or(0.0);

    let avg_refund = if refunded_count > 0 { refunded_total / refunded_count as f64 } else { 0.0 };

    Ok(ReturnsSummary { total_returns: refunded_count, total_refunded: refunded_total, avg_refund })
}

#[tauri::command]
pub fn get_sales_tax_summary(f: SalesReportFilter) -> Result<TaxSummary, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let (wheres, params) = build_date_conditions(&f, "s");
    let where_clause = if wheres.is_empty() { String::new() } else { format!("WHERE {}", wheres.join(" AND ")) };
    let param_refs: Vec<&dyn rusqlite::types::ToSql> = params.iter().map(|p| p as &dyn rusqlite::types::ToSql).collect();

    let sql = format!("SELECT COALESCE(SUM(tax_amount), 0) AS total_tax, COALESCE(AVG(tax_amount), 0) AS avg_tax, SUM(CASE WHEN tax_amount > 0 THEN 1 ELSE 0 END) AS taxable_count FROM sales s {}", where_clause);
    let row = conn.query_row(&sql, param_refs.as_slice(), |row| {
        Ok(TaxSummary { total_tax: row.get(0)?, avg_tax_per_sale: row.get(1)?, taxable_sales_count: row.get(2)? })
    }).map_err(|e| e.to_string())?;
    Ok(row)
}

#[tauri::command]
pub fn get_sales_quote_conversion() -> Result<f64, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let rate: f64 = conn.query_row(
        "SELECT COALESCE(ROUND(CAST(converted AS REAL) / CASE WHEN total = 0 THEN 1 ELSE CAST(total AS REAL) END * 100, 1), 0) FROM (SELECT (SELECT COUNT(*) FROM quotes WHERE status = 'converted') AS converted, (SELECT COUNT(*) FROM quotes) AS total)",
        [], |row| row.get(0),
    ).map_err(|e| e.to_string())?;
    Ok(rate)
}
