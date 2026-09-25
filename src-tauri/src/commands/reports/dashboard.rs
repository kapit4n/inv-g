use serde::Serialize;
use crate::DB_STATE;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExecutiveDashboard {
    pub today_revenue: f64,
    pub monthly_revenue: f64,
    pub net_profit_estimate: f64,
    pub inventory_value: f64,
    pub low_stock_count: i64,
    pub pending_purchases: i64,
    pub average_ticket: f64,
    pub sales_growth: f64,
    pub inventory_turnover: f64,
    pub customer_growth: f64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RevenueByMonth {
    pub month: String,
    pub revenue: f64,
    pub cost: f64,
    pub profit: f64,
    pub count: i64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CategoryBreakdown {
    pub category: String,
    pub value: f64,
    pub count: i64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TopProduct {
    pub product_id: i64,
    pub product_name: String,
    pub sku: String,
    pub quantity_sold: i64,
    pub revenue: f64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TopCustomer {
    pub customer_id: i64,
    pub customer_name: String,
    pub total_spent: f64,
    pub order_count: i64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TopSupplier {
    pub supplier_id: i64,
    pub supplier_name: String,
    pub total_purchases: f64,
    pub order_count: i64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WarehouseDistribution {
    pub warehouse: String,
    pub product_count: i64,
    pub stock_value: f64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PurchaseVsSale {
    pub month: String,
    pub purchases: f64,
    pub sales: f64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CustomerGrowthPoint {
    pub month: String,
    pub count: i64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DashboardWidgets {
    pub today_revenue: f64,
    pub monthly_revenue: f64,
    pub net_profit_estimate: f64,
    pub inventory_value: f64,
    pub low_stock_count: i64,
    pub pending_purchases: i64,
    pub top_customers: Vec<TopCustomer>,
    pub top_products: Vec<TopProduct>,
    pub best_categories: Vec<CategoryBreakdown>,
    pub recent_sales_count: i64,
    pub cash_register_summary: CashRegisterSummary,
    pub supplier_performance_avg: f64,
    pub average_ticket: f64,
    pub sales_growth: f64,
    pub inventory_turnover: f64,
    pub customer_growth: f64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CashRegisterSummary {
    pub open_sessions: i64,
    pub today_cash: f64,
    pub today_card: f64,
    pub today_transfer: f64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ChartData {
    pub revenue_by_month: Vec<RevenueByMonth>,
    pub sales_by_category: Vec<CategoryBreakdown>,
    pub sales_by_brand: Vec<CategoryBreakdown>,
    pub profit_trend: Vec<RevenueByMonth>,
    pub inventory_trend: Vec<RevenueByMonth>,
    pub customer_growth: Vec<CustomerGrowthPoint>,
    pub warehouse_distribution: Vec<WarehouseDistribution>,
    pub top_products_chart: Vec<TopProduct>,
    pub top_suppliers_chart: Vec<TopSupplier>,
    pub purchases_vs_sales: Vec<PurchaseVsSale>,
}

/// Convenience accessor; not yet used by the dashboard queries.
#[allow(dead_code)]
fn query_f64(sql: &str, params: &[&dyn rusqlite::types::ToSql]) -> f64 {
    let db = DB_STATE.get().unwrap();
    let conn = db.conn.lock().unwrap();
    conn.query_row(sql, params, |row| row.get::<_, f64>(0)).unwrap_or(0.0)
}

/// Convenience accessor; not yet used by the dashboard queries.
#[allow(dead_code)]
fn query_i64(sql: &str, params: &[&dyn rusqlite::types::ToSql]) -> i64 {
    let db = DB_STATE.get().unwrap();
    let conn = db.conn.lock().unwrap();
    conn.query_row(sql, params, |row| row.get::<_, i64>(0)).unwrap_or(0)
}

#[tauri::command]
pub fn get_executive_dashboard() -> Result<ExecutiveDashboard, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let today = conn.query_row(
        "SELECT COALESCE(SUM(total), 0) FROM sales WHERE date(created_at) = date('now')",
        [],
        |row| row.get::<_, f64>(0),
    ).unwrap_or(0.0);

    let monthly = conn.query_row(
        "SELECT COALESCE(SUM(total), 0) FROM sales WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')",
        [],
        |row| row.get::<_, f64>(0),
    ).unwrap_or(0.0);

    let cost = conn.query_row(
        "SELECT COALESCE(SUM(si.total), 0) FROM sale_items si WHERE si.sale_id IN (SELECT id FROM sales WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now'))",
        [],
        |row| row.get::<_, f64>(0),
    ).unwrap_or(0.0);

    let cost_estimate = cost * 0.65;
    let net_profit = monthly - cost_estimate;

    let inventory_value = conn.query_row(
        "SELECT COALESCE(SUM(p.stock_quantity * p.cost_price), 0) FROM products p WHERE p.is_active = 1 AND p.is_discontinued = 0",
        [],
        |row| row.get::<_, f64>(0),
    ).unwrap_or(0.0);

    let low_stock = conn.query_row(
        "SELECT COUNT(*) FROM products WHERE stock_quantity <= min_stock_level AND min_stock_level > 0 AND is_active = 1",
        [],
        |row| row.get::<_, i64>(0),
    ).unwrap_or(0);

    let pending = conn.query_row(
        "SELECT COUNT(*) FROM purchase_orders WHERE status NOT IN ('completed', 'cancelled')",
        [],
        |row| row.get::<_, i64>(0),
    ).unwrap_or(0);

    let avg_ticket = conn.query_row(
        "SELECT COALESCE(ROUND(AVG(total), 2), 0) FROM sales WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')",
        [],
        |row| row.get::<_, f64>(0),
    ).unwrap_or(0.0);

    let prev_month_revenue: f64 = conn.query_row(
        "SELECT COALESCE(SUM(total), 0) FROM sales WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now', '-1 month')",
        [],
        |row| row.get::<_, f64>(0),
    ).unwrap_or(0.0);

    let sales_growth = if prev_month_revenue > 0.0 {
        ((monthly - prev_month_revenue) / prev_month_revenue) * 100.0
    } else {
        0.0
    };

    let total_sales_cost: f64 = conn.query_row(
        "SELECT COALESCE(SUM(p.cost_price * si.quantity), 0) FROM sale_items si JOIN products p ON p.id = si.product_id WHERE si.sale_id IN (SELECT id FROM sales WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now'))",
        [],
        |row| row.get::<_, f64>(0),
    ).unwrap_or(0.0);

    let avg_inventory: f64 = conn.query_row(
        "SELECT COALESCE(ROUND(AVG(p.stock_quantity * p.cost_price), 2), 0) FROM products p WHERE p.is_active = 1",
        [],
        |row| row.get::<_, f64>(0),
    ).unwrap_or(0.0);

    let inventory_turnover = if avg_inventory > 0.0 { total_sales_cost / avg_inventory } else { 0.0 };

    let customer_growth_val: f64 = conn.query_row(
        "SELECT ROUND((CAST(current AS REAL) - CAST(previous AS REAL)) / CASE WHEN previous = 0 THEN 1 ELSE CAST(previous AS REAL) END * 100, 1) FROM (SELECT (SELECT COUNT(*) FROM customers WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')) AS current, (SELECT COUNT(*) FROM customers WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now', '-1 month')) AS previous)",
        [],
        |row| row.get::<_, f64>(0),
    ).unwrap_or(0.0);

    drop(conn);

    Ok(ExecutiveDashboard {
        today_revenue: today,
        monthly_revenue: monthly,
        net_profit_estimate: net_profit,
        inventory_value,
        low_stock_count: low_stock,
        pending_purchases: pending,
        average_ticket: avg_ticket,
        sales_growth,
        inventory_turnover,
        customer_growth: customer_growth_val,
    })
}

#[tauri::command]
pub fn get_dashboard_widgets() -> Result<DashboardWidgets, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let today_revenue: f64 = conn.query_row(
        "SELECT COALESCE(SUM(total), 0) FROM sales WHERE date(created_at) = date('now')",
        [], |row| row.get(0),
    ).unwrap_or(0.0);

    let monthly_revenue: f64 = conn.query_row(
        "SELECT COALESCE(SUM(total), 0) FROM sales WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')",
        [], |row| row.get(0),
    ).unwrap_or(0.0);

    let cost_estimate: f64 = conn.query_row(
        "SELECT COALESCE(SUM(si.total), 0) FROM sale_items si JOIN sales s ON s.id = si.sale_id WHERE strftime('%Y-%m', s.created_at) = strftime('%Y-%m', 'now')",
        [], |row| row.get(0),
    ).unwrap_or(0.0) * 0.65;

    let inventory_value: f64 = conn.query_row(
        "SELECT COALESCE(SUM(p.stock_quantity * p.cost_price), 0) FROM products p WHERE p.is_active = 1",
        [], |row| row.get(0),
    ).unwrap_or(0.0);

    let low_stock_count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM products WHERE stock_quantity <= min_stock_level AND is_active = 1",
        [], |row| row.get(0),
    ).unwrap_or(0);

    let pending_purchases: i64 = conn.query_row(
        "SELECT COUNT(*) FROM purchase_orders WHERE status NOT IN ('completed','cancelled')",
        [], |row| row.get(0),
    ).unwrap_or(0);

    let mut top_customers = Vec::new();
    if let Ok(mut stmt) = conn.prepare("SELECT c.id, c.name, COALESCE(SUM(s.total), 0) AS total_spent, COUNT(s.id) AS order_count FROM customers c LEFT JOIN sales s ON s.customer_id = c.id GROUP BY c.id ORDER BY total_spent DESC LIMIT 5") {
        if let Ok(rows) = stmt.query_map([], |row| {
            Ok(TopCustomer { customer_id: row.get(0)?, customer_name: row.get(1)?, total_spent: row.get(2)?, order_count: row.get(3)? })
        }) {
            for row in rows { if let Ok(r) = row { top_customers.push(r); } }
        }
    }

    let mut top_products = Vec::new();
    if let Ok(mut stmt) = conn.prepare("SELECT p.id, p.name, p.sku, SUM(si.quantity) AS qty, SUM(si.total) AS rev FROM sale_items si JOIN products p ON p.id = si.product_id GROUP BY p.id ORDER BY rev DESC LIMIT 5") {
        if let Ok(rows) = stmt.query_map([], |row| {
            Ok(TopProduct { product_id: row.get(0)?, product_name: row.get(1)?, sku: row.get(2)?, quantity_sold: row.get(3)?, revenue: row.get(4)? })
        }) {
            for row in rows { if let Ok(r) = row { top_products.push(r); } }
        }
    }

    let mut best_categories = Vec::new();
    if let Ok(mut stmt) = conn.prepare("SELECT c.name, COALESCE(SUM(si.total), 0) AS value, COUNT(DISTINCT s.id) AS cnt FROM sale_items si JOIN sales s ON s.id = si.sale_id JOIN products p ON p.id = si.product_id JOIN categories c ON c.id = p.category_id GROUP BY c.id ORDER BY value DESC LIMIT 5") {
        if let Ok(rows) = stmt.query_map([], |row| {
            Ok(CategoryBreakdown { category: row.get(0)?, value: row.get(1)?, count: row.get(2)? })
        }) {
            for row in rows { if let Ok(r) = row { best_categories.push(r); } }
        }
    }

    let recent_sales_count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM sales WHERE date(created_at) = date('now')",
        [], |row| row.get(0),
    ).unwrap_or(0);

    let open_sessions: i64 = conn.query_row(
        "SELECT COUNT(*) FROM cash_register_sessions WHERE status = 'open'",
        [], |row| row.get(0),
    ).unwrap_or(0);

    let today_cash: f64 = conn.query_row(
        "SELECT COALESCE(SUM(CASE WHEN sp.method = 'cash' THEN sp.amount ELSE 0 END), 0) FROM sale_payments sp JOIN sales s ON s.id = sp.sale_id WHERE date(s.created_at) = date('now')",
        [], |row| row.get(0),
    ).unwrap_or(0.0);

    let today_card: f64 = conn.query_row(
        "SELECT COALESCE(SUM(CASE WHEN sp.method = 'card' THEN sp.amount ELSE 0 END), 0) FROM sale_payments sp JOIN sales s ON s.id = sp.sale_id WHERE date(s.created_at) = date('now')",
        [], |row| row.get(0),
    ).unwrap_or(0.0);

    let today_transfer: f64 = conn.query_row(
        "SELECT COALESCE(SUM(CASE WHEN sp.method = 'transfer' THEN sp.amount ELSE 0 END), 0) FROM sale_payments sp JOIN sales s ON s.id = sp.sale_id WHERE date(s.created_at) = date('now')",
        [], |row| row.get(0),
    ).unwrap_or(0.0);

    let supplier_perf: f64 = conn.query_row(
        "SELECT COALESCE(ROUND(AVG(CASE WHEN julianday(COALESCE(pr.created_at, po.expected_delivery_date)) - julianday(po.order_date) <= 7 THEN 100.0 ELSE 0.0 END), 1), 0) FROM purchase_orders po LEFT JOIN purchase_receipts pr ON pr.purchase_order_id = po.id WHERE po.status = 'completed'",
        [], |row| row.get(0),
    ).unwrap_or(0.0);

    let avg_ticket: f64 = conn.query_row(
        "SELECT COALESCE(ROUND(AVG(total), 2), 0) FROM sales WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')",
        [], |row| row.get(0),
    ).unwrap_or(0.0);

    let prev_month: f64 = conn.query_row(
        "SELECT COALESCE(SUM(total), 0) FROM sales WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now', '-1 month')",
        [], |row| row.get(0),
    ).unwrap_or(0.0);

    let sales_growth = if prev_month > 0.0 { ((monthly_revenue - prev_month) / prev_month) * 100.0 } else { 0.0 };

    let total_sales_cost: f64 = conn.query_row(
        "SELECT COALESCE(SUM(p.cost_price * si.quantity), 0) FROM sale_items si JOIN products p ON p.id = si.product_id WHERE si.sale_id IN (SELECT id FROM sales WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now'))",
        [], |row| row.get(0),
    ).unwrap_or(0.0);

    let avg_inv: f64 = conn.query_row(
        "SELECT COALESCE(ROUND(AVG(p.stock_quantity * p.cost_price), 2), 0) FROM products p WHERE p.is_active = 1",
        [], |row| row.get(0),
    ).unwrap_or(0.0);

    let inventory_turnover = if avg_inv > 0.0 { total_sales_cost / avg_inv } else { 0.0 };

    let customer_growth_val: f64 = conn.query_row(
        "SELECT ROUND((CAST(current AS REAL) - CAST(previous AS REAL)) / CASE WHEN previous = 0 THEN 1 ELSE CAST(previous AS REAL) END * 100, 1) FROM (SELECT (SELECT COUNT(*) FROM customers WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')) AS current, (SELECT COUNT(*) FROM customers WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now', '-1 month')) AS previous)",
        [], |row| row.get(0),
    ).unwrap_or(0.0);

    drop(conn);

    Ok(DashboardWidgets {
        today_revenue,
        monthly_revenue,
        net_profit_estimate: monthly_revenue - cost_estimate,
        inventory_value,
        low_stock_count,
        pending_purchases,
        top_customers,
        top_products,
        best_categories,
        recent_sales_count,
        cash_register_summary: CashRegisterSummary { open_sessions, today_cash, today_card, today_transfer },
        supplier_performance_avg: supplier_perf,
        average_ticket: avg_ticket,
        sales_growth,
        inventory_turnover,
        customer_growth: customer_growth_val,
    })
}

#[tauri::command]
pub fn get_chart_data() -> Result<ChartData, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let mut revenue_by_month = Vec::new();
    if let Ok(mut stmt) = conn.prepare("SELECT strftime('%Y-%m', created_at) AS month, COALESCE(SUM(total), 0) AS revenue, 0 AS cost, COALESCE(SUM(total), 0) * 0.35 AS profit, COUNT(*) AS cnt FROM sales GROUP BY month ORDER BY month ASC LIMIT 12") {
        if let Ok(rows) = stmt.query_map([], |row| {
            Ok(RevenueByMonth { month: row.get(0)?, revenue: row.get(1)?, cost: row.get(2)?, profit: row.get(3)?, count: row.get(4)? })
        }) {
            for row in rows { if let Ok(r) = row { revenue_by_month.push(r); } }
        }
    }

    let mut sales_by_category = Vec::new();
    if let Ok(mut stmt) = conn.prepare("SELECT c.name, COALESCE(SUM(si.total), 0) AS value, COUNT(DISTINCT s.id) AS cnt FROM sale_items si JOIN sales s ON s.id = si.sale_id JOIN products p ON p.id = si.product_id JOIN categories c ON c.id = p.category_id GROUP BY c.id ORDER BY value DESC") {
        if let Ok(rows) = stmt.query_map([], |row| {
            Ok(CategoryBreakdown { category: row.get(0)?, value: row.get(1)?, count: row.get(2)? })
        }) {
            for row in rows { if let Ok(r) = row { sales_by_category.push(r); } }
        }
    }

    let mut sales_by_brand = Vec::new();
    if let Ok(mut stmt) = conn.prepare("SELECT b.name, COALESCE(SUM(si.total), 0) AS value, COUNT(DISTINCT s.id) AS cnt FROM sale_items si JOIN sales s ON s.id = si.sale_id JOIN products p ON p.id = si.product_id JOIN brands b ON b.id = p.brand_id GROUP BY b.id ORDER BY value DESC") {
        if let Ok(rows) = stmt.query_map([], |row| {
            Ok(CategoryBreakdown { category: row.get(0)?, value: row.get(1)?, count: row.get(2)? })
        }) {
            for row in rows { if let Ok(r) = row { sales_by_brand.push(r); } }
        }
    }

    let profit_trend = revenue_by_month.clone();

    let mut inventory_trend = Vec::new();
    if let Ok(mut stmt) = conn.prepare("SELECT strftime('%Y-%m', created_at) AS month, COALESCE(SUM(stock_quantity * cost_price), 0) AS value, COUNT(*) AS cnt FROM products GROUP BY month ORDER BY month ASC LIMIT 12") {
        if let Ok(rows) = stmt.query_map([], |row| {
            Ok(RevenueByMonth { month: row.get(0)?, revenue: row.get(1)?, cost: 0.0, profit: 0.0, count: row.get(2)? })
        }) {
            for row in rows { if let Ok(r) = row { inventory_trend.push(r); } }
        }
    }

    let mut customer_growth = Vec::new();
    if let Ok(mut stmt) = conn.prepare("SELECT strftime('%Y-%m', created_at) AS month, COUNT(*) AS cnt FROM customers GROUP BY month ORDER BY month ASC LIMIT 12") {
        if let Ok(rows) = stmt.query_map([], |row| {
            Ok(CustomerGrowthPoint { month: row.get(0)?, count: row.get(1)? })
        }) {
            for row in rows { if let Ok(r) = row { customer_growth.push(r); } }
        }
    }

    let mut warehouse_distribution = Vec::new();
    if let Ok(mut stmt) = conn.prepare("SELECT w.name, COUNT(p.id) AS pcount, COALESCE(SUM(p.stock_quantity * p.cost_price), 0) AS value FROM warehouses w LEFT JOIN products p ON p.warehouse_id = w.id GROUP BY w.id ORDER BY value DESC") {
        if let Ok(rows) = stmt.query_map([], |row| {
            Ok(WarehouseDistribution { warehouse: row.get(0)?, product_count: row.get(1)?, stock_value: row.get(2)? })
        }) {
            for row in rows { if let Ok(r) = row { warehouse_distribution.push(r); } }
        }
    }

    let mut top_products_chart = Vec::new();
    if let Ok(mut stmt) = conn.prepare("SELECT p.id, p.name, p.sku, SUM(si.quantity) AS qty, SUM(si.total) AS rev FROM sale_items si JOIN products p ON p.id = si.product_id GROUP BY p.id ORDER BY rev DESC LIMIT 10") {
        if let Ok(rows) = stmt.query_map([], |row| {
            Ok(TopProduct { product_id: row.get(0)?, product_name: row.get(1)?, sku: row.get(2)?, quantity_sold: row.get(3)?, revenue: row.get(4)? })
        }) {
            for row in rows { if let Ok(r) = row { top_products_chart.push(r); } }
        }
    }

    let mut top_suppliers_chart = Vec::new();
    if let Ok(mut stmt) = conn.prepare("SELECT s.id, s.company_name, COALESCE(SUM(po.total), 0) AS total, COUNT(po.id) AS cnt FROM suppliers s LEFT JOIN purchase_orders po ON po.supplier_id = s.id GROUP BY s.id ORDER BY total DESC LIMIT 5") {
        if let Ok(rows) = stmt.query_map([], |row| {
            Ok(TopSupplier { supplier_id: row.get(0)?, supplier_name: row.get(1)?, total_purchases: row.get(2)?, order_count: row.get(3)? })
        }) {
            for row in rows { if let Ok(r) = row { top_suppliers_chart.push(r); } }
        }
    }

    let mut purchases_vs_sales = Vec::new();
    if let Ok(mut stmt) = conn.prepare("SELECT m.month, COALESCE(p.total, 0) AS purchases, COALESCE(s.total, 0) AS sales FROM (SELECT DISTINCT strftime('%Y-%m', created_at) AS month FROM sales UNION SELECT DISTINCT strftime('%Y-%m', created_at) AS month FROM purchase_orders) m LEFT JOIN (SELECT strftime('%Y-%m', created_at) AS month, SUM(total) AS total FROM purchase_orders WHERE status != 'cancelled' GROUP BY month) p ON p.month = m.month LEFT JOIN (SELECT strftime('%Y-%m', created_at) AS month, SUM(total) AS total FROM sales GROUP BY month) s ON s.month = m.month ORDER BY m.month ASC LIMIT 12") {
        if let Ok(rows) = stmt.query_map([], |row| {
            Ok(PurchaseVsSale { month: row.get(0)?, purchases: row.get(1)?, sales: row.get(2)? })
        }) {
            for row in rows { if let Ok(r) = row { purchases_vs_sales.push(r); } }
        }
    }

    drop(conn);

    Ok(ChartData {
        revenue_by_month,
        sales_by_category,
        sales_by_brand,
        profit_trend,
        inventory_trend,
        customer_growth,
        warehouse_distribution,
        top_products_chart,
        top_suppliers_chart,
        purchases_vs_sales,
    })
}
