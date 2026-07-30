# Reports

## Overview

The Reports module provides business intelligence across all operational domains. It offers 12 report types covering sales, inventory, purchasing, customers, suppliers, warehouses, profitability, and KPIs — plus saved reports, scheduled reports, custom reports, and exports.

## Features

### 1. Executive Dashboard
High-level business overview with key metrics:
- Today's and monthly revenue.
- Net profit estimate.
- Inventory value, low stock count, pending purchases.
- Average ticket, sales growth, inventory turnover, customer growth.
- Interactive widgets with trend indicators.

### 2. Sales Reports

**Sales by Period** (Daily / Weekly / Monthly / Yearly)
- Filter by date range, warehouse, cashier, customer, category, brand, product, payment method.
- Transaction count, subtotal, discount, tax, total, cost, profit.
- Grouped by the selected period.

**Sales by Cashier**
- Performance breakdown per cashier: transaction count, total sales.

**Sales by Payment Method**
- Cash, card, transfer — count and total per method.

**Discount Analysis**
- Total discounts, average discount per sale, sales with discount percentage, max discount.

**Returns Analysis**
- Total returns, total refunded, average refund amount.

**Tax Summary**
- Total tax collected, average tax per sale, taxable sale count.

### 3. Inventory Reports

**Full Inventory Report**
- All products with stock levels, prices, stock values (cost and sale).
- Filter by warehouse, category, brand.

**Inventory Valuation**
- Stock value breakdown by category or warehouse.
- Product count, total stock, average cost, total cost value, total sale value, potential profit.

**Low Stock Report**
- Products at or below reorder point.
- With suggested order quantities.

**Inventory Movement Summary**
- Inbound, outbound, adjustments, net change by period.

**Aging Report**
- Products with no movement in X days.
- Days since last movement and stock value.

**Overstock Report**
- Products significantly above max stock level.

**Fast / Slow Movers**
- Products ranked by sales velocity over a selected period.

### 4. Purchasing Reports

**Purchases by Month**
- Order count, total, item count, average order value.

**Purchases by Supplier**
- Per-supplier breakdown: order count, total, average cost.

**Supplier Performance**
- Orders, on-time delivery rate, average lead time, return rate, total spent.

**PO Status Summary**
- Count and total per status (Draft, Sent, Approved, Received, Completed, Cancelled).

**Reorder Report**
- Products needing reorder with supplier suggestion.

**Cost History**
- Cost changes over time per product.

### 5. Customer Reports

**Top Customers**
- Highest-spending customers with order count, average ticket, lifetime value.

**Customer Growth**
- New customers per month, cumulative total.

**Customer Locations**
- Geographic distribution by city/state.

**Inactive Customers**
- Customers with no purchase in X days.

**Credit Summary**
- Total accounts, credit limits, balances, utilization rate, overdue accounts.

**Service Summary**
- Total reminders, pending/overdue/completed, vehicles, warranties.

### 6. Supplier Reports

**Supplier Ranking**
- Ranked by composite score (purchase volume, on-time rate, return rate, lead time).

**Lead Time Analysis**
- Min, max, average lead time per supplier.

### 7. Warehouse Reports

**Warehouse Utilization**
- Product count, total stock, stock value, location count, utilization percentage.

**Stock Distribution**
- Stock value breakdown by warehouse.

**Adjustment Summary**
- Count and value of adjustments per warehouse.

### 8. Profitability Reports

**Profit Summary**
- Gross revenue, estimated cost, gross profit, margin percentage.

**Profit by Category** — Margin analysis per product category.

**Profit by Product** — Per-product margin analysis.

**Profit by Supplier** — Margin analysis by supplier.

**Profit by Brand** — Margin analysis by brand.

**Profit by Customer** — Margin analysis by customer.

**Profit by Warehouse** — Margin analysis per warehouse.

### 9. KPIs

**KPI Dashboard** — Values and status indicators for each KPI.

**KPI Definitions** — Configurable list of all KPIs:
- Category: Sales, Inventory, Financial, Customer, Operations.
- Each KPI has: name, key, description, unit, target, warning threshold, critical threshold.
- Status indicator: Good / Warning / Critical based on thresholds.

### 10. Custom Reports
- Build custom report configurations.
- Select module, columns, filters, and sorting.
- Save as a custom report template.

### 11. Scheduled Reports
- Schedule report generation on a recurring basis.
- Frequency: Daily, Weekly, Monthly.
- Day of week/month, time, export format (PDF, CSV, XLSX).
- Destination: email or file save.
- Recipients list for email delivery.
- Track last run and next run dates.
- Enable/disable schedules.

### 12. Exports
- Centralized export center.
- Export any report to CSV, XLSX, or PDF.
- Download generated export files.
- Track export history.

### Saved Reports
- Save any report configuration (filters, columns, sorting).
- Mark favorites for quick access.
- Each saved report tracks version number.
- Create, edit, delete saved reports.

### Report History
- Log of all generated reports.
- Report name, module, filters, export format, execution time, row count, file path.
- Generated by and timestamp.
- Download previously generated reports.

### Report Templates
- System-defined and user-defined report templates.
- Pre-configured layouts for common reporting needs.

### Dashboard Preferences
- Configure which widgets appear on the Executive Dashboard.
- Preference persistence per user.

## Available Actions

| Action | Description |
|--------|-------------|
| Run Report | Execute any report with current filters |
| Export Report | Download as CSV, XLSX, or PDF |
| Save Report | Save current configuration |
| Schedule Report | Set up recurring generation |
| View History | Browse past generated reports |
| Delete History | Remove old report history entries |
| Manage Favorites | Star/unstar saved reports |
| Create Custom Report | Define ad-hoc report configuration |
| Manage Templates | Create, edit, delete report templates |
| Configure Dashboard | Select executive dashboard widgets |
| Export All Lists | Export to CSV/XLSX |

## Shared Report Components

All report pages share three reusable components:
- **ReportFilters** — Date range, entity selectors (customer, supplier, product, warehouse, etc.).
- **ReportTable** — Data display with sorting and pagination.
- **ReportCharts** — Chart visualization (bar, line, pie) based on report data.

## Validation Rules

- Date range "from" must be before "to".
- Export format is required for scheduled reports.
- Scheduled report frequency must be valid.
- Saved report name is required and must be unique per user.
- KPI targets must be non-negative where applicable.

## Related Modules

- [Dashboard](dashboard.md) — Executive dashboard overlap.
- [Sales](sales.md) — Sales report data source.
- [Inventory](inventory.md) — Inventory report data source.
- [Purchasing](purchasing.md) — Purchasing report data source.
- [Customers](customers.md) — Customer report data source.
- [Suppliers](suppliers.md) — Supplier report data source.
- [Admin](admin.md) — User and system admin.

## Known Limitations

- All aggregation is SQL-based; complex cross-domain reports may be slow on large datasets.
- Charts are basic — no drill-down interactivity.
- No real-time report streaming (fetch on load only).
- Scheduled reports require the app to be running or a system scheduler setup.
- No report dashboards with multiple charts on a single page (except Executive Dashboard).
- PDF export quality is browser-dependent (uses window.print).
