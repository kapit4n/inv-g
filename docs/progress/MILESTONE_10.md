# Milestone 10 - Reporting, Analytics & Business Intelligence

**Status:** Complete

## Summary

Implemented a comprehensive Reporting & Analytics module providing business intelligence across all operational areas. The module delivers 11 category-specific report pages with interactive visualizations using Recharts, plus an executive dashboard with real-time KPI widgets. All reports support date-range filtering, period grouping (daily/weekly/monthly/yearly), and drill-down capabilities.

The backend features a dedicated `reports/` directory module with 10 sub-modules covering sales, inventory, purchasing, customers, suppliers, warehouse, profitability, KPI, dashboard, and report management. Over 45 Tauri commands execute SQL-based aggregations directly against the SQLite database for real-time analytics. The module also includes report persistence (saved/scheduled reports), history logging, cost history tracking, and dashboard preference storage.

## Deliverables

### Database (Schema v7)
- **saved_reports** — User-defined report configurations (name, module, config JSON, columns, filters, sorting, favorite flag, versioning)
- **scheduled_reports** — Automated report scheduling (frequency, day-of-week/month, time, export format, destination, recipient list, active flag, last/next run tracking)
- **report_history** — Audit log of report generations (report name, module, filters, export format, execution time, row count, file path, user)
- **dashboard_preferences** — Per-user dashboard layout/widget configuration (JSON widgets, theme, layout)
- **kpi_definitions** — Configurable KPI definitions (name, key, category, formula, unit, target, warning/critical thresholds, sort order)
- **report_templates** — System and user-defined report templates (name, description, module, config JSON, is_system flag)

### Rust Backend

Reports module at `src-tauri/src/commands/reports/` with 10 sub-modules:

#### Dashboard (`dashboard.rs`)
- `get_executive_dashboard` — Executive summary with revenue, profit estimate, inventory value, low stock, pending purchases, growth metrics
- `get_dashboard_widgets` — Full dashboard widgets including today/monthly revenue, top customers/products/categories, cash register summary, supplier performance
- `get_chart_data` — All chart datasets (revenue by month, sales by category/brand, profit trend, inventory trend, customer growth, warehouse distribution, top products/suppliers, purchases vs sales)

#### Sales (`sales.rs`)
- `get_sales_report_daily` / `get_sales_report_weekly` / `get_sales_report_monthly` / `get_sales_report_yearly` — Period-grouped sales with subtotals, discounts, tax, cost, profit
- `get_sales_by_cashier` — Sales breakdown per user
- `get_sales_by_payment_method` — Sales by payment method
- `get_sales_discount_analysis` — Discount metrics (total, avg, max, percentage)
- `get_sales_returns_summary` — Return/refund statistics
- `get_sales_tax_summary` — Tax collection metrics
- `get_sales_quote_conversion` — Quote-to-sale conversion rate

#### Inventory (`inventory.rs`)
- `get_inventory_report` — Full product inventory with stock, valuation, category/brand/warehouse
- `get_inventory_valuation` — Category-level valuation (cost value, sale value, potential profit)
- `get_inventory_low_stock` — Low stock items with severity status
- `get_inventory_movement_report` — Inbound/outbound/adjustment trends
- `get_inventory_aging` — Products with days since last movement
- `get_inventory_overstock` — Overstock items exceeding max levels
- `get_inventory_fast_slow` — Fast/slow moving product analysis

#### Purchasing (`purchasing.rs`)
- `get_purchases_by_month` — Monthly purchase trends with counts and averages
- `get_purchases_by_supplier` — Supplier-level purchase breakdown
- `get_supplier_performance_report` — Supplier perf (on-time delivery, lead time, return rate)
- `get_po_status_summary` — Purchase order status distribution
- `get_products_to_reorder` — Auto-suggested reorder list with preferred supplier
- `get_purchase_cost_history` — Cost change history with supplier context

#### Customers (`customers.rs`)
- `get_top_customers` — Top spenders with LTV metrics
- `get_customer_growth_report` — New customer acquisition trend
- `get_customer_locations` — Geographic distribution
- `get_inactive_customers` — Churn risk identification
- `get_customer_credit_summary` — Credit portfolio overview
- `get_customer_service_summary` — Service reminders/vehicles/warranties summary

#### Suppliers (`suppliers.rs`)
- `get_supplier_ranking` — Weighted supplier score (purchase volume, on-time, returns)
- `get_lead_time_analysis` — Min/max/avg lead times per supplier

#### Warehouse (`warehouse.rs`)
- `get_warehouse_utilization` — Storage capacity usage per warehouse
- `get_warehouse_stock_distribution` — Category-level stock by warehouse
- `get_warehouse_adjustments` — Inventory adjustment activity

#### Profitability (`profitability.rs`)
- `get_profit_summary` — Monthly gross profit and margin trends
- `get_profit_by_category` / `get_profit_by_product` / `get_profit_by_supplier` / `get_profit_by_brand` / `get_profit_by_customer` / `get_profit_by_warehouse` — Multi-dimensional profit analysis

#### KPI (`kpi.rs`)
- `get_kpi_values` — 12 computed KPIs with status/trend/target evaluation (revenue growth, sales growth, inventory turnover, avg order value, avg purchase cost, stock accuracy, customer retention, supplier performance, order fulfillment, low stock %, top products, top brands)
- `get_kpi_definitions` — Configurable KPI definitions from DB

#### Manage (`manage.rs`)
- Saved Reports: `get_saved_reports`, `create_saved_report`, `delete_saved_report`
- Scheduled Reports: `get_scheduled_reports`, `create_scheduled_report`, `toggle_scheduled_report`
- History: `get_report_history`, `log_report_generation`
- Templates: `get_report_templates`
- Preferences: `get_dashboard_preferences`, `save_dashboard_preferences`

### Frontend Pages

| Page | Route | Description |
|------|-------|-------------|
| ReportsPage | `/reports` | Executive dashboard with KPI stat cards, 10 chart visualizations, top customers table |
| ReportsSalesPage | `/reports/sales` | Sales reports with daily/weekly/monthly/yearly views, by cashier, payment method, discount/returns/tax analysis |
| ReportsInventoryPage | `/reports/inventory` | Inventory status, valuation, aging, low/overstock, movement, fast/slow analysis |
| ReportsPurchasingPage | `/reports/purchasing` | Monthly purchase trends, by supplier, supplier performance, PO status, reorder suggestions, cost history |
| ReportsCustomersPage | `/reports/customers` | Top customers, growth trend, geographic distribution, inactive customers, credit summary |
| ReportsSuppliersPage | `/reports/suppliers` | Supplier ranking, lead time analysis |
| ReportsWarehousesPage | `/reports/warehouses` | Warehouse utilization, stock distribution, adjustment activity |
| ReportsProfitabilityPage | `/reports/profitability` | Profit summary by month/category/product/supplier/brand/customer/warehouse |
| ReportsKpiPage | `/reports/kpis` | 12 business KPIs with status indicators, targets, and trend tracking |
| ReportsCustomPage | `/reports/custom` | Custom report builder with saved/persisted reports |
| ReportsScheduledPage | `/reports/scheduled` | Scheduled report management (create/toggle frequency/format) |
| ReportsExportsPage | `/reports/exports` | Report export history and generation log |

### Frontend Components

- **`report-charts.tsx`** — Reusable chart components wrapping Recharts: `LineChartCard`, `BarChartCard`, `AreaChartCard`, `PieChartCard`, `DonutChartCard`, `StackedBarChartCard` with skeleton loading and empty states
- **`report-filters.tsx`** — Reusable filter bar with date range, warehouse, category, brand, payment method selectors and clear button
- **`report-table.tsx`** — Reusable data table with formatting (currency/percent/number), skeleton loading, and empty state

### Other Frontend Changes
- **i18n**: New `reports.json` namespace with 296 keys each for es/en (320 lines each)
- **Sidebar**: Reports section with 12 child sub-items (Executive Dashboard, Sales, Inventory, Purchasing, Customers, Suppliers, Warehouses, Profitability, KPIs, Custom Reports, Scheduled Reports, Exports)
- **Routes**: 12 report page routes registered under `/reports/*`
- **TypeScript interfaces**: 25+ interfaces (`ExecutiveDashboard`, `DashboardWidgets`, `ChartData`, `SalesReportRow`, `SalesByCashier`, `InventoryReportRow`, `StockStatusItem`, `MovementSummary`, `AgingItem`, `PurchaseReportRow`, `SupplierRanking`, `WarehouseUtilization`, `ProfitSummary`, `ProfitByEntity`, `KpiValue`, `KpiDefinition`, `SavedReport`, `ScheduledReport`, `ReportHistoryEntry`, `ReportTemplate`, `CostHistoryEntry`, `CustomerReportRow`, `CustomerGrowthRow`, `CustomerLocation`, `CustomerCreditSummary`, `CustomerServiceSummary`, plus filter types)
- **Tauri invoke wrappers**: 45+ wrapper functions in `src/lib/tauri.ts` for all report commands

### Permissions
11 new report permissions assigned to owner and administrator roles:
- `reports.view` — View reports
- `reports.export` — Export reports
- `reports.sales.view` — View sales reports
- `reports.inventory.view` — View inventory reports
- `reports.purchases.view` — View purchasing reports
- `reports.customers.view` — View customer reports
- `reports.suppliers.view` — View supplier reports
- `reports.profitability.view` — View profitability reports
- `reports.create` — Create custom reports
- `reports.schedule` — Schedule reports
- `reports.manage_templates` — Manage report templates

## Architecture Decisions

- **Directory-based Rust module structure**: Reports module uses a `reports/` directory with 10 sub-module files (dashboard, sales, inventory, etc.), re-exported via `mod.rs`. This keeps each report category isolated while sharing types and helpers.
- **Recharts for visualization**: All charts use the Recharts library (Line, Bar, Area, Pie, StackedBar) wrapped in reusable card components with consistent styling, skeleton loading, and empty states.
- **DB_STATE global pattern**: All report queries use the `DB_STATE` global singleton with `conn.lock().map_err()` for thread-safe SQLite access. Helper functions `query_f64`/`query_i64` reduce boilerplate for scalar queries.
- **Tab-based report navigation pattern**: Each report page implements tab navigation for sub-views (e.g., daily/weekly/monthly/yearly in sales; low stock/overstock/aging/movement in inventory).
- **Direct invoke pattern for data fetching**: Frontend calls Tauri commands directly in `useEffect` with `Promise.all` for parallel data loading, rather than React Query or Zustand, keeping report data ephemeral.

## Files Created
```
src-tauri/src/commands/reports/mod.rs
src-tauri/src/commands/reports/dashboard.rs
src-tauri/src/commands/reports/sales.rs
src-tauri/src/commands/reports/inventory.rs
src-tauri/src/commands/reports/purchasing.rs
src-tauri/src/commands/reports/customers.rs
src-tauri/src/commands/reports/suppliers.rs
src-tauri/src/commands/reports/warehouse.rs
src-tauri/src/commands/reports/profitability.rs
src-tauri/src/commands/reports/kpi.rs
src-tauri/src/commands/reports/manage.rs
src/features/reports/index.ts
src/features/reports/pages/reports-page.tsx
src/features/reports/pages/reports-sales-page.tsx
src/features/reports/pages/reports-inventory-page.tsx
src/features/reports/pages/reports-purchasing-page.tsx
src/features/reports/pages/reports-customers-page.tsx
src/features/reports/pages/reports-suppliers-page.tsx
src/features/reports/pages/reports-warehouses-page.tsx
src/features/reports/pages/reports-profitability-page.tsx
src/features/reports/pages/reports-kpi-page.tsx
src/features/reports/pages/reports-custom-page.tsx
src/features/reports/pages/reports-scheduled-page.tsx
src/features/reports/pages/reports-exports-page.tsx
src/features/reports/components/report-charts.tsx
src/features/reports/components/report-filters.tsx
src/features/reports/components/report-table.tsx
src/i18n/locales/en/reports.json
src/i18n/locales/es/reports.json
docs/progress/MILESTONE_10.md
```

## Files Modified
```
src-tauri/src/db/schema.rs — Schema v7: 6 new tables (saved_reports, scheduled_reports, report_history, dashboard_preferences, kpi_definitions, report_templates)
src-tauri/src/db/seed.rs — 11 new report permissions, role assignments
src-tauri/src/commands/mod.rs — added reports module
src-tauri/src/lib.rs — registered 45+ report commands
src/types/index.ts — 25+ new reporting TypeScript interfaces
src/lib/tauri.ts — 45+ new Tauri invoke wrapper functions
src/layouts/sidebar.tsx — Reports section with 12 sub-items
src/routes/index.tsx — 12 report page routes
src/i18n/config.ts — added reports namespace
```

## Known Issues
- None

## Next Milestone
Milestone 11 - Administration, System Configuration, Backup, Printing & Deployment Features
