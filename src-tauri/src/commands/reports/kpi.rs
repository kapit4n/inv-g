use serde::{Deserialize, Serialize};
use crate::DB_STATE;

#[derive(Debug, Serialize, Deserialize)]
pub struct KpiValue {
    pub key: String,
    pub name: String,
    pub value: f64,
    pub unit: Option<String>,
    pub target: Option<f64>,
    pub trend: Option<String>,
    pub category: String,
    pub status: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct KpiDefinition {
    pub id: i64,
    pub name: String,
    pub key: String,
    pub description: Option<String>,
    pub category: String,
    pub unit: Option<String>,
    pub target: Option<f64>,
    pub warning_threshold: Option<f64>,
    pub critical_threshold: Option<f64>,
    pub sort_order: i64,
}

#[tauri::command]
pub fn get_kpi_values() -> Result<Vec<KpiValue>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let monthly_revenue: f64 = conn.query_row("SELECT COALESCE(SUM(total), 0) FROM sales WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')", [], |row| row.get(0)).unwrap_or(0.0);
    let prev_revenue: f64 = conn.query_row("SELECT COALESCE(SUM(total), 0) FROM sales WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now', '-1 month')", [], |row| row.get(0)).unwrap_or(0.0);
    let revenue_growth = if prev_revenue > 0.0 { ((monthly_revenue - prev_revenue) / prev_revenue) * 100.0 } else { 0.0 };

    let total_sales: f64 = conn.query_row("SELECT COALESCE(SUM(total), 0) FROM sales WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')", [], |row| row.get(0)).unwrap_or(0.0);
    let prev_sales: f64 = conn.query_row("SELECT COALESCE(SUM(total), 0) FROM sales WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now', '-1 month')", [], |row| row.get(0)).unwrap_or(0.0);
    let sales_growth = if prev_sales > 0.0 { ((total_sales - prev_sales) / prev_sales) * 100.0 } else { 0.0 };

    let total_cost: f64 = conn.query_row("SELECT COALESCE(SUM(p.cost_price * si.quantity), 0) FROM sale_items si JOIN products p ON p.id = si.product_id WHERE si.sale_id IN (SELECT id FROM sales WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now'))", [], |row| row.get(0)).unwrap_or(0.0);
    let avg_inv: f64 = conn.query_row("SELECT COALESCE(ROUND(AVG(stock_quantity * cost_price), 2), 0) FROM products WHERE is_active = 1", [], |row| row.get(0)).unwrap_or(0.0);
    let inventory_turnover = if avg_inv > 0.0 { total_cost / avg_inv } else { 0.0 };

    let avg_order_value: f64 = conn.query_row("SELECT COALESCE(ROUND(AVG(total), 2), 0) FROM sales WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')", [], |row| row.get(0)).unwrap_or(0.0);

    let avg_purchase_cost: f64 = conn.query_row("SELECT COALESCE(ROUND(AVG(unit_cost), 2), 0) FROM purchase_order_items", [], |row| row.get(0)).unwrap_or(0.0);

    let stock_accuracy: f64 = conn.query_row("SELECT COALESCE(ROUND((SELECT COUNT(*) FROM products WHERE is_active = 1 AND stock_quantity >= 0) * 100.0 / CASE WHEN (SELECT COUNT(*) FROM products WHERE is_active = 1) = 0 THEN 1 ELSE (SELECT COUNT(*) FROM products WHERE is_active = 1) END, 1), 100)", [], |row| row.get(0)).unwrap_or(100.0);

    let total_customers: i64 = conn.query_row("SELECT COUNT(*) FROM customers", [], |row| row.get(0)).unwrap_or(0);
    let customers_with_purchase: i64 = conn.query_row("SELECT COUNT(DISTINCT customer_id) FROM sales WHERE customer_id IS NOT NULL", [], |row| row.get(0)).unwrap_or(0);
    let retention = if total_customers > 0 { (customers_with_purchase as f64 / total_customers as f64) * 100.0 } else { 0.0 };

    let supplier_perf: f64 = conn.query_row("SELECT COALESCE(ROUND(AVG(CASE WHEN julianday(COALESCE(pr.created_at, po.expected_delivery_date)) - julianday(po.order_date) <= 7 THEN 100.0 ELSE 0.0 END), 1), 0) FROM purchase_orders po LEFT JOIN purchase_receipts pr ON pr.purchase_order_id = po.id WHERE po.status = 'completed'", [], |row| row.get(0)).unwrap_or(0.0);

    let total_orders: i64 = conn.query_row("SELECT COUNT(*) FROM sales", [], |row| row.get(0)).unwrap_or(0);
    let fulfilled: i64 = conn.query_row("SELECT COUNT(*) FROM sales WHERE payment_status = 'paid'", [], |row| row.get(0)).unwrap_or(0);
    let fulfillment = if total_orders > 0 { (fulfilled as f64 / total_orders as f64) * 100.0 } else { 100.0 };

    let low_stock_count: i64 = conn.query_row("SELECT COUNT(*) FROM products WHERE stock_quantity <= min_stock_level AND min_stock_level > 0 AND is_active = 1", [], |row| row.get(0)).unwrap_or(0);
    let total_active: i64 = conn.query_row("SELECT COUNT(*) FROM products WHERE is_active = 1", [], |row| row.get(0)).unwrap_or(0);
    let low_stock_pct = if total_active > 0 { (low_stock_count as f64 / total_active as f64) * 100.0 } else { 0.0 };

    let top_selling: i64 = conn.query_row("SELECT COALESCE(SUM(si.quantity), 0) FROM sale_items si JOIN sales s ON s.id = si.sale_id WHERE strftime('%Y-%m', s.created_at) = strftime('%Y-%m', 'now')", [], |row| row.get(0)).unwrap_or(0);

    let top_brands_count: i64 = conn.query_row("SELECT COUNT(DISTINCT p.brand_id) FROM sale_items si JOIN products p ON p.id = si.product_id JOIN sales s ON s.id = si.sale_id WHERE strftime('%Y-%m', s.created_at) = strftime('%Y-%m', 'now')", [], |row| row.get(0)).unwrap_or(0);

    drop(conn);

    let mut kpis = vec![
        KpiValue { key: "revenue_growth".into(), name: "Revenue Growth".into(), value: revenue_growth, unit: Some("%".into()), target: Some(10.0), trend: Some(if revenue_growth > 0.0 { "up".into() } else { "down".into() }), category: "financial".into(), status: if revenue_growth >= 10.0 { "good".into() } else if revenue_growth >= 0.0 { "warning".into() } else { "critical".into() } },
        KpiValue { key: "sales_growth".into(), name: "Sales Growth".into(), value: sales_growth, unit: Some("%".into()), target: Some(10.0), trend: Some(if sales_growth > 0.0 { "up".into() } else { "down".into() }), category: "sales".into(), status: if sales_growth >= 10.0 { "good".into() } else if sales_growth >= 0.0 { "warning".into() } else { "critical".into() } },
        KpiValue { key: "inventory_turnover".into(), name: "Inventory Turnover".into(), value: inventory_turnover, unit: None, target: Some(4.0), trend: None, category: "inventory".into(), status: if inventory_turnover >= 4.0 { "good".into() } else if inventory_turnover >= 2.0 { "warning".into() } else { "critical".into() } },
        KpiValue { key: "avg_order_value".into(), name: "Average Order Value".into(), value: avg_order_value, unit: Some("currency".into()), target: Some(100.0), trend: None, category: "sales".into(), status: if avg_order_value >= 100.0 { "good".into() } else { "warning".into() } },
        KpiValue { key: "avg_purchase_cost".into(), name: "Average Purchase Cost".into(), value: avg_purchase_cost, unit: Some("currency".into()), target: None, trend: None, category: "purchasing".into(), status: "neutral".into() },
        KpiValue { key: "stock_accuracy".into(), name: "Stock Accuracy".into(), value: stock_accuracy, unit: Some("%".into()), target: Some(98.0), trend: None, category: "inventory".into(), status: if stock_accuracy >= 98.0 { "good".into() } else if stock_accuracy >= 90.0 { "warning".into() } else { "critical".into() } },
        KpiValue { key: "customer_retention".into(), name: "Customer Retention".into(), value: retention, unit: Some("%".into()), target: Some(50.0), trend: None, category: "customers".into(), status: if retention >= 50.0 { "good".into() } else if retention >= 30.0 { "warning".into() } else { "critical".into() } },
        KpiValue { key: "supplier_performance".into(), name: "Supplier Performance".into(), value: supplier_perf, unit: Some("%".into()), target: Some(90.0), trend: None, category: "suppliers".into(), status: if supplier_perf >= 90.0 { "good".into() } else if supplier_perf >= 70.0 { "warning".into() } else { "critical".into() } },
        KpiValue { key: "order_fulfillment".into(), name: "Order Fulfillment".into(), value: fulfillment, unit: Some("%".into()), target: Some(95.0), trend: None, category: "sales".into(), status: if fulfillment >= 95.0 { "good".into() } else { "warning".into() } },
        KpiValue { key: "low_stock_percentage".into(), name: "Low Stock %".into(), value: low_stock_pct, unit: Some("%".into()), target: Some(5.0), trend: None, category: "inventory".into(), status: if low_stock_pct <= 5.0 { "good".into() } else if low_stock_pct <= 15.0 { "warning".into() } else { "critical".into() } },
        KpiValue { key: "top_selling_products".into(), name: "Top Selling Products".into(), value: top_selling as f64, unit: Some("units".into()), target: None, trend: None, category: "sales".into(), status: "neutral".into() },
        KpiValue { key: "top_brands".into(), name: "Top Brands".into(), value: top_brands_count as f64, unit: None, target: None, trend: None, category: "inventory".into(), status: "neutral".into() },
    ];

    Ok(kpis)
}

#[tauri::command]
pub fn get_kpi_definitions() -> Result<Vec<KpiDefinition>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT id, name, key, description, category, unit, target, warning_threshold, critical_threshold, sort_order FROM kpi_definitions WHERE is_active = 1 ORDER BY sort_order ASC").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(KpiDefinition { id: row.get(0)?, name: row.get(1)?, key: row.get(2)?, description: row.get(3)?, category: row.get(4)?, unit: row.get(5)?, target: row.get(6)?, warning_threshold: row.get(7)?, critical_threshold: row.get(8)?, sort_order: row.get(9)? })
    }).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for row in rows { result.push(row.map_err(|e| e.to_string())?); }
    Ok(result)
}
