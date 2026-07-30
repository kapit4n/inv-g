# Dashboard

## Overview

The Dashboard is the central hub of Inventory Gear, displayed immediately after login. It provides a real-time snapshot of the entire business — sales performance, inventory health, customer activity, and recent operations — all in one place.

The dashboard fetches data on mount and does not auto-refresh. Users can manually refresh via the refresh button in the toolbar. Date range filters update most widgets dynamically.

## Features

### Stats Cards
- **Today's Sales** — Number of sales transactions completed today.
- **Today's Revenue** — Total revenue from today's sales.
- **Active Orders** — Count of pending/processing sales.
- **Inventory Value** — Total cost value of all stock on hand.
- **Low Stock Items** — Count of products at or below the reorder point.
- **Best Sellers** — Top products by quantity sold (current period).
- **Open Cash Sessions** — Number of cash register sessions open.

### Charts
- **Revenue by Month** — Bar/line chart showing monthly revenue and cost trends.
- **Category Breakdown** — Pie/donut chart of sales distribution across product categories.
- **Profit Trend** — Line chart of gross profit over time.

### Recent Activity
- **Recent Sales** — Last 10 transactions with customer name, total, payment method, and timestamp.
- **Recent Orders** — Last 10 purchase orders with supplier, status, and total.

### Top Lists
- **Top Products** — Best-selling products by revenue and quantity.
- **Top Customers** — Highest-spending customers with order count.
- **Top Suppliers** — Suppliers with the highest purchase volume.

### Widgets
- **Cash Register Summary** — Today's cash/card/transfer totals.
- **Sales Growth** — Percentage change vs. previous period.
- **Inventory Turnover** — Rate at which inventory is sold and replaced.
- **Customer Growth** — New customer count this period.
- **Average Ticket** — Average order value.
- **Pending Purchases** — Count of purchase orders awaiting delivery.

## Available Actions

| Action | Description |
|--------|-------------|
| Refresh | Re-fetches all dashboard data |
| Change Date Range | Filters stats and charts by custom date range |
| Navigate to Module | Click any stat card or list item to navigate to the related module |
| Print Dashboard | Prints the current dashboard view |

## Widget Behavior

- Widgets are fetched via parallel API calls using `Promise.all`.
- The date range filter (default: current month) applies to all time-series charts and stat cards that support it.
- Low stock threshold is determined by `reorderPoint` on each product.
- Dashboard layout is responsive; cards reflow on smaller screens.

## Related Modules

- [Sales](sales.md)
- [Inventory](inventory.md)
- [Purchasing](purchasing.md)
- [Customers](customers.md)
- [Reports](reports.md)
- [Cash Register](cash-register.md)

## Known Limitations

- Charts are rendered using a basic chart component; interactivity (zoom, tooltip detail) is limited.
- No drag-and-drop widget customization at this time.
- Data refreshes only on manual action; no WebSocket push for real-time updates.
