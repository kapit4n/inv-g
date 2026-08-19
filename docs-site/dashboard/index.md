# Dashboard

## What is it?

The Dashboard is the central hub of Inventory Gear, displayed immediately after login. It provides a real-time snapshot of your business — sales performance, inventory health, customer activity, and recent operations.

![Dashboard Overview](/screenshots/light/02-dashboard.png)

## What is it for?

Get a quick overview of your business without navigating to individual modules. Spot issues early, track performance, and access frequently used features quickly.

## How to Access

Click **Dashboard** in the sidebar (first item). Route: `/dashboard`.

## Features

### Quick Actions

Six action cards for common operations:
- **New Sale** — Opens the POS
- **New Product** — Opens product creation form
- **New Purchase Order** — Opens PO form
- **View Inventory** — Navigates to inventory
- **View Reports** — Opens reports overview
- **Customers** — Opens CRM customers

### Today at a Glance

| Metric | Description |
|--------|-------------|
| Today's Sales | Number of completed transactions |
| Today's Revenue | Total revenue from today |
| Active Orders | Pending/processing sales |
| Low Stock Alerts | Products at or below reorder point |

### Needs Attention

Dynamic alerts for urgent items:
- Low stock products
- Overdue service reminders
- Pending purchase orders

### Recent Sales

Last 10 transactions with customer, total, and timestamp.

## How to Use

1. Review stats cards for quick numbers
2. Check "Needs Attention" for urgent items
3. Use Quick Actions for common tasks
4. Click any card to navigate to the full module

## Considerations

- Dashboard data is fetched on load and does not auto-refresh
- Use the **Refresh** button in the toolbar to update
- Date range filters apply to charts and time-based metrics

## Related

- [Sales](/sales/) — View detailed sales data
- [Inventory](/inventory/) — Stock management
- [Reports](/reports/) — In-depth analytics
