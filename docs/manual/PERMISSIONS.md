# Permissions Reference

> Complete permission matrix. All permission keys, descriptions, and default role assignments.

## Permission Key Format

Permissions follow the convention: `module.action` or `module.submodule.action`.

## Permission Groups

### Dashboard

| Permission Key | Description | Owner | Admin | Cashier | Warehouse | Purchasing | Viewer |
|---|---|---|---|---|---|---|---|
| `dashboard.view` | Access the dashboard | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

### Inventory

| Permission Key | Description | Owner | Admin | Cashier | Warehouse | Purchasing | Viewer |
|---|---|---|---|---|---|---|---|
| `inventory.view` | View inventory | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `inventory.create` | Create products | ✓ | ✓ | ✓ | ✓ | ✓ | -- |
| `inventory.update` | Update products | ✓ | ✓ | -- | ✓ | -- | -- |
| `inventory.delete` | Delete products | ✓ | ✓ | -- | -- | -- | -- |
| `inventory.categories.manage` | Manage categories | ✓ | ✓ | -- | -- | -- | -- |
| `inventory.brands.manage` | Manage brands | ✓ | ✓ | -- | -- | -- | -- |
| `inventory.manufacturers.manage` | Manage manufacturers | ✓ | ✓ | -- | -- | -- | -- |
| `inventory.suppliers.manage` | Manage inventory suppliers | ✓ | ✓ | -- | -- | -- | -- |
| `inventory.warehouses.manage` | Manage warehouses | ✓ | ✓ | -- | -- | -- | -- |
| `inventory.storage.manage` | Manage storage locations | ✓ | ✓ | -- | -- | -- | -- |

### Sales

| Permission Key | Description | Owner | Admin | Cashier | Warehouse | Purchasing | Viewer |
|---|---|---|---|---|---|---|---|
| `sales.view` | View sales | ✓ | ✓ | ✓ | -- | -- | ✓ |
| `sales.create` | Create sales (POS) | ✓ | ✓ | ✓ | -- | -- | -- |
| `sales.refund` | Process refunds/returns | ✓ | ✓ | -- | -- | -- | -- |
| `sales.quotes` | Manage quotes | ✓ | ✓ | ✓ | -- | -- | -- |
| `sales.register` | Manage cash register | ✓ | ✓ | ✓ | -- | -- | -- |
| `sales.closeout` | Perform daily closeout | ✓ | ✓ | -- | -- | -- | -- |
| `sales.receipts` | View and reprint receipts | ✓ | ✓ | ✓ | -- | -- | -- |

### Purchases

| Permission Key | Description | Owner | Admin | Cashier | Warehouse | Purchasing | Viewer |
|---|---|---|---|---|---|---|---|
| `purchases.view` | View purchases | ✓ | ✓ | -- | ✓ | ✓ | ✓ |
| `purchases.create` | Create purchase orders | ✓ | ✓ | -- | -- | ✓ | -- |
| `purchases.update` | Update purchase orders | ✓ | ✓ | -- | -- | ✓ | -- |
| `purchases.delete` | Delete purchase orders | ✓ | ✓ | -- | -- | -- | -- |
| `purchases.approve` | Approve purchase orders | ✓ | ✓ | -- | -- | ✓ | -- |
| `purchases.receive` | Receive purchase orders | ✓ | ✓ | -- | ✓ | ✓ | -- |
| `purchases.returns` | Handle purchase returns | ✓ | ✓ | -- | -- | ✓ | -- |
| `purchases.requests` | Manage purchase requests | ✓ | ✓ | -- | -- | ✓ | -- |
| `purchases.supplier_products` | Manage supplier catalog | ✓ | ✓ | -- | -- | ✓ | -- |
| `purchases.cost_history` | View cost history | ✓ | ✓ | -- | -- | ✓ | -- |

### Customers

| Permission Key | Description | Owner | Admin | Cashier | Warehouse | Purchasing | Viewer |
|---|---|---|---|---|---|---|---|
| `customers.view` | View customers | ✓ | ✓ | ✓ | -- | -- | ✓ |
| `customers.create` | Create customers | ✓ | ✓ | ✓ | -- | -- | -- |
| `customers.update` | Update customers | ✓ | ✓ | -- | -- | -- | -- |
| `customers.delete` | Delete customers | ✓ | ✓ | -- | -- | -- | -- |
| `customers.credit` | Manage customer credit | ✓ | ✓ | -- | -- | -- | -- |
| `customers.communication` | Manage communication log | ✓ | ✓ | -- | -- | -- | -- |
| `customers.notes` | Manage customer notes | ✓ | ✓ | -- | -- | -- | -- |

### Suppliers

| Permission Key | Description | Owner | Admin | Cashier | Warehouse | Purchasing | Viewer |
|---|---|---|---|---|---|---|---|
| `suppliers.view` | View suppliers | ✓ | ✓ | -- | -- | ✓ | ✓ |
| `suppliers.create` | Create suppliers | ✓ | ✓ | -- | -- | ✓ | -- |

### Vehicles

| Permission Key | Description | Owner | Admin | Cashier | Warehouse | Purchasing | Viewer |
|---|---|---|---|---|---|---|---|
| `vehicles.view` | View vehicles | ✓ | ✓ | -- | -- | -- | ✓ |
| `vehicles.create` | Create vehicles | ✓ | ✓ | -- | -- | -- | -- |
| `vehicles.update` | Update vehicles | ✓ | ✓ | -- | -- | -- | -- |
| `vehicles.delete` | Delete vehicles | ✓ | ✓ | -- | -- | -- | -- |

### Warehouse

| Permission Key | Description | Owner | Admin | Cashier | Warehouse | Purchasing | Viewer |
|---|---|---|---|---|---|---|---|
| `warehouse.view` | View warehouse module | ✓ | ✓ | -- | ✓ | -- | ✓ |

### Service Reminders

| Permission Key | Description | Owner | Admin | Cashier | Warehouse | Purchasing | Viewer |
|---|---|---|---|---|---|---|---|
| `reminders.view` | View service reminders | ✓ | ✓ | -- | -- | -- | -- |
| `reminders.manage` | Manage service reminders | ✓ | ✓ | -- | -- | -- | -- |

### Warranties

| Permission Key | Description | Owner | Admin | Cashier | Warehouse | Purchasing | Viewer |
|---|---|---|---|---|---|---|---|
| `warranty.view` | View warranties | ✓ | ✓ | -- | -- | -- | -- |
| `warranty.manage` | Manage warranties | ✓ | ✓ | -- | -- | -- | -- |

### Reports

| Permission Key | Description | Owner | Admin | Cashier | Warehouse | Purchasing | Viewer |
|---|---|---|---|---|---|---|---|
| `reports.view` | View reports | ✓ | ✓ | -- | -- | -- | ✓ |
| `reports.export` | Export reports | ✓ | ✓ | -- | -- | -- | -- |
| `reports.sales.view` | View sales reports | -- | ✓ | -- | -- | -- | -- |
| `reports.inventory.view` | View inventory reports | -- | ✓ | -- | -- | -- | -- |
| `reports.purchases.view` | View purchasing reports | -- | ✓ | -- | -- | -- | -- |
| `reports.customers.view` | View customer reports | -- | ✓ | -- | -- | -- | -- |
| `reports.suppliers.view` | View supplier reports | -- | ✓ | -- | -- | -- | -- |
| `reports.profitability.view` | View profitability reports | -- | ✓ | -- | -- | -- | -- |
| `reports.create` | Create custom reports | -- | ✓ | -- | -- | -- | -- |
| `reports.schedule` | Schedule reports | -- | ✓ | -- | -- | -- | -- |
| `reports.manage_templates` | Manage report templates | -- | ✓ | -- | -- | -- | -- |

### Employees

| Permission Key | Description | Owner | Admin | Cashier | Warehouse | Purchasing | Viewer |
|---|---|---|---|---|---|---|---|
| `employees.manage` | Manage employees | ✓ | ✓ | -- | -- | -- | -- |

### Settings

| Permission Key | Description | Owner | Admin | Cashier | Warehouse | Purchasing | Viewer |
|---|---|---|---|---|---|---|---|
| `settings.view` | View settings | ✓ | ✓ | -- | -- | -- | ✓ |
| `settings.manage` | Manage settings | ✓ | ✓ | -- | -- | -- | -- |

### Auth / Administration

| Permission Key | Description | Owner | Admin | Cashier | Warehouse | Purchasing | Viewer |
|---|---|---|---|---|---|---|---|
| `auth.manage` | Manage authentication | ✓ | -- | -- | -- | -- | -- |
| `admin.users.manage` | Manage user accounts | ✓ | ✓ | -- | -- | -- | -- |
| `admin.roles.manage` | Manage roles | ✓ | ✓ | -- | -- | -- | -- |
| `admin.permissions.manage` | Manage permissions | ✓ | ✓ | -- | -- | -- | -- |
| `admin.settings.manage` | Manage app settings | ✓ | ✓ | -- | -- | -- | -- |
| `admin.backups.manage` | Manage backups | ✓ | ✓ | -- | -- | -- | -- |
| `admin.restore` | Restore from backup | ✓ | ✓ | -- | -- | -- | -- |
| `admin.database.manage` | Database maintenance | ✓ | ✓ | -- | -- | -- | -- |
| `admin.printers.manage` | Manage printers | ✓ | ✓ | -- | -- | -- | -- |
| `admin.audit.view` | View audit logs | ✓ | ✓ | -- | -- | -- | -- |
| `admin.maintenance.manage` | Run maintenance | ✓ | ✓ | -- | -- | -- | -- |
| `admin.updates.manage` | Manage updates | ✓ | ✓ | -- | -- | -- | -- |
| `admin.license.manage` | Manage license | ✓ | ✓ | -- | -- | -- | -- |
| `admin.diagnostics.view` | View diagnostics | ✓ | ✓ | -- | -- | -- | -- |
| `admin.devices.manage` | Manage devices | ✓ | ✓ | -- | -- | -- | -- |

---

## Default Roles Summary

| Role | Scope | Typical User |
|---|---|---|
| **owner** | Full system access including auth management | Business owner |
| **administrator** | Full system access except auth management | IT manager, operations manager |
| **cashier** | Sales, POS, customers, basic inventory views | Counter sales staff |
| **warehouse** | Inventory, purchasing receive, basic views | Warehouse staff |
| **purchasing** | Purchasing, suppliers, inventory create | Purchasing agent |
| **viewer** | Read-only access to all view permissions | Guest, auditor, read-only reports |

## Notes

- Permissions are additive — a user's effective permissions are the union of all permissions assigned to their role(s).
- Route access is gated by permissions. A user without `sales.view` cannot access the sales route.
- UI elements (buttons, tabs, menu items) are conditionally rendered based on permissions.
- The Owner role is the only role with `auth.manage` permission (user authentication management).
- The Administrator role has all `admin.*` permissions and all `reports.*` permissions.
- Custom roles can be created with any combination of permissions via Admin > Roles.
