# Reports Module Architecture

## Overview

The Reports module provides real-time business intelligence across all operational domains. It follows the same feature-first pattern as the rest of the application: Rust backend (Tauri commands) + React frontend (pages + components), with SQLite for data aggregation.

## Module Structure

```
src-tauri/src/commands/reports/
├── mod.rs              # Module declarations and re-exports
├── dashboard.rs        # Executive dashboard, widgets, chart data
├── sales.rs            # Sales reports (daily/weekly/monthly/yearly, by cashier, etc.)
├── inventory.rs        # Inventory reports (valuation, aging, low/overstock, movements)
├── purchasing.rs       # Purchasing reports (trends, supplier perf, reorder)
├── customers.rs        # Customer reports (top, growth, locations, inactive, credit)
├── suppliers.rs        # Supplier reports (ranking, lead time)
├── warehouse.rs        # Warehouse reports (utilization, adjustments)
├── profitability.rs    # Profit reports (by category/product/supplier/brand/customer/warehouse)
├── kpi.rs              # KPI values and definitions
└── manage.rs           # Saved/scheduled reports, history, templates, preferences

src/features/reports/
├── index.ts            # Barrel exports
├── pages/              # 12 report pages
│   ├── reports-page.tsx
│   ├── reports-sales-page.tsx
│   └── ...
└── components/         # 3 reusable components
    ├── report-charts.tsx
    ├── report-filters.tsx
    └── report-table.tsx
```

## How to Add a New Report

1. **Backend**: Add a new `.rs` file in `src-tauri/src/commands/reports/` (or add commands to an existing sub-module).
2. **Register**: Add `mod <name>;` and `pub use <name>::*;` to `reports/mod.rs`, then register the command in `src-tauri/src/lib.rs`.
3. **Frontend**: Create a page component in `src/features/reports/pages/` and export it from `index.ts`.
4. **Route**: Add the route in `src/routes/index.tsx`.
5. **Sidebar**: Add the nav item in `src/layouts/sidebar.tsx`.
6. **i18n**: Add translation keys to `src/i18n/locales/{en,es}/reports.json`.
7. **Permissions**: Add a permission key in `src-tauri/src/db/seed.rs` if the report should be role-gated.

## Aggregation Strategy (SQL-based)

All report data is aggregated in SQL rather than in application code. This keeps the Rust layer thin and lets SQLite's query planner optimize aggregations.

### Common Patterns

**Period-based grouping** uses SQLite `strftime`:
```sql
-- Daily
GROUP BY date(created_at)
-- Weekly
GROUP BY strftime('%Y-W%W', created_at)
-- Monthly
GROUP BY strftime('%Y-%m', created_at)
-- Yearly
GROUP BY strftime('%Y', created_at)
```

**Scalar totals** use `COALESCE(SUM(...), 0)` to handle empty results.

**Dynamic filters** build WHERE clauses conditionally, using parameterized queries for safety.

### Example: Sales Report Filter Builder

The `build_date_conditions` helper in `sales.rs` constructs WHERE clauses from the `SalesReportFilter` struct, appending only non-null filter fields. The `exec_sales_report` function accepts a `group_by` expression (e.g., `"date(s.created_at)"`) and returns typed `SalesReportRow` structs.

## Query Patterns Used

| Pattern | Description | Example |
|---------|-------------|---------|
| Scalar query | Single-value aggregation | `query_row("SELECT SUM(total) ...")` |
| Windowed aggregation | Running totals over time | `SELECT month, COUNT(*) AS new, (SELECT COUNT(*) FROM ... WHERE created_at <= ...) AS total` |
| LEFT JOIN with aggregation | Multi-table rollup | `LEFT JOIN sale_items ... GROUP BY product_id` |
| Subquery expression | Computed columns | `SELECT ... (SELECT COUNT(*) FROM ...) AS loc_count` |
| Conditional aggregation | Status/type breakdowns | `SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END)` |
| Date arithmetic | Aging/lead time | `julianday('now') - julianday(created_at)` |
| Composite scoring | Weighted ranking | `purchase_volume * 0.4 + on_time_rate * 0.3 + ...` |

## Performance Considerations

- **SQLite does all the work**: All aggregation happens in SQL — no N+1 queries, no in-memory joins on the Rust side. Each command is a single SQL statement (or a few sequential ones).
- **Limit results**: Reports cap results (e.g., `LIMIT 10` for top products, `LIMIT 100` for history). Use `LIMIT ?1` with parameterization.
- **Date filtering**: Reports accept `date_from`/`date_to` filters to restrict scan ranges. Use date columns with index-friendly comparisons (`date(col) >= date(?)`).
- **DB_STATE lock**: All commands acquire `conn.lock()`. Keep transactions short — release the lock with `drop(conn)` before building the response for long-running queries.
- **Frontend caching**: Currently reports re-fetch on mount. Future optimization could add React Query with stale-while-revalidate for frequently accessed dashboards.
- **Avoid heavy queries on every render**: Use `useEffect` with `[]` dependency (fetch once on mount). The `reports-page.tsx` dashboard fetches widgets and chart data in parallel with `Promise.all`.
