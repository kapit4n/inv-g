# Dashboard

## What is it?

The Dashboard is the central hub of Inventory Gear, displayed immediately after login. It provides a real-time snapshot of your business — sales performance, inventory health, customer activity, and recent operations.

![Dashboard Overview](/screenshots/light/02-dashboard.png)

## What is it for?

Get a quick overview of your business without navigating to individual modules. Spot issues early, track performance, and access frequently used features quickly.

## How to Access

Click **Dashboard** in the sidebar (first item). Route: `/dashboard`.

## Features

::: tip What you see depends on your role
Every card, tile and section on the dashboard is filtered by the permissions of
the account you signed in with. A role that cannot open a module is never offered
a shortcut into it, because the click would only land on the "Access denied"
screen. Nothing has to be configured — edit the permissions of your role in
**Admin → Users → Roles** and the dashboard follows on the next sign-in.
:::

### Quick Actions

Up to six action cards for common operations. A card appears only if your role
holds the permission it needs:

| Card | Required permission |
|------|--------------------|
| New Sale | `sales.create` |
| Receive PO | `purchases.receive` |
| Products | `inventory.view` |
| New Customer | `customers.create` |
| New PO | `purchases.create` |
| Inventory | `inventory.view` |

A card also disappears when the module behind it is switched off in
**Admin → Settings** (Sales, Purchasing, CRM).

### Today at a Glance

| Metric | Description | Requires |
|--------|-------------|----------|
| Today's Revenue | Total revenue from today | `sales.view` |
| Sales | Number of completed transactions | `sales.view` |
| Low Stock | Products at or below reorder point | `inventory.view` |
| New Customers | Customers added this month | `customers.view` |

### Stores Overview

Sales and inventory totals per store, on multi-store installations only. Requires
`reports.view` or `inventory.view`, since these are management figures covering
locations other than the one you are working in.

### Needs Attention

Dynamic alerts for urgent items, each one linking to the module that resolves it:

- Out of stock / low stock products — `inventory.view`
- Pending purchase orders and orders awaiting approval — `purchases.view`
- Service reminders and expiring warranties — `customers.view`

The whole section is hidden when your role can open none of those modules, rather
than showing an empty "All clear!" for alerts you are not allowed to see.

### Recent Sales

The last 5 transactions with number, total and time, plus a link to the full
sales history. Requires `sales.view`. When there is no sale yet, the shortcut to
open the POS appears only for roles that may create one (`sales.create`).

## How to Use

1. Review the stats cards for quick numbers
2. Check "Needs Attention" for urgent items
3. Use Quick Actions for common tasks
4. Click any card to navigate to the full module

## Considerations

- Dashboard data is fetched on load and does not auto-refresh
- Use the **Refresh** button in the toolbar to update
- Date range filters apply to charts and time-based metrics
- Nothing outside your role's permissions is fetched at all, so a limited account
  loads faster as well as showing less

## Related

- [Sales](/sales/) — View detailed sales data
- [Inventory](/inventory/) — Stock management
- [Reports](/reports/) — In-depth analytics
