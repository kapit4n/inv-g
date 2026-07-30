# Navigation Guide

> Complete reference for all menus, submenus, routes, dialogs, and modals.

## Sidebar Structure

The sidebar is organized into two sections: **Primary Navigation** (core business modules) and **Secondary Navigation** (administration and settings). A collapsible toggle at the bottom expands/collapses the sidebar.

---

## Primary Navigation

### Dashboard

| Menu Label | Icon | Route | Description | Permission |
|---|---|---|---|---|
| Dashboard | LayoutDashboard | `/dashboard` | Main KPIs, charts, recent activity | `dashboard.view` |

### Sales

| Menu Label | Icon | Route | Description | Permission |
|---|---|---|---|---|
| Sales | ShoppingCart | `/sales` | Sales list with search and filters | `sales.view` |
| ├ Point of Sale | ShoppingCart | `/sales/new` | POS terminal for processing sales | `sales.create` |
| ├ Sales History | Receipt | `/sales` | View and manage completed sales | `sales.view` |
| ├ Quotes | FileText | `/sales/quotes` | Create, edit, manage price quotes | `sales.quotes` |
| ├ Returns | RotateCcw | `/sales/returns` | Process customer returns and refunds | `sales.refund` |
| ├ Cash Register | DollarSign | `/sales/register` | Open/close cash register sessions | `sales.register` |
| ├ Receipts | Printer | `/sales/receipts` | View and reprint receipts | `sales.receipts` |
| └ Daily Closeout | BarChart3 | `/sales/closeout` | End-of-day sales summary and close | `sales.closeout` |

### Inventory

| Menu Label | Icon | Route | Description | Permission |
|---|---|---|---|---|
| Inventory | Package | `/inventory` | Inventory dashboard with KPIs | `inventory.view` |
| ├ Categories | Layers | `/inventory/categories` | Manage product categories | `inventory.categories.manage` |
| ├ Brands | Tag | `/inventory/brands` | Manage product brands | `inventory.brands.manage` |
| ├ Manufacturers | Cog | `/inventory/manufacturers` | Manage product manufacturers | `inventory.manufacturers.manage` |
| ├ Suppliers | Briefcase | `/inventory/suppliers` | Manage inventory supplier list | `inventory.suppliers.manage` |
| ├ Warehouses | Warehouse | `/inventory/warehouses` | Manage warehouse locations | `inventory.warehouses.manage` |
| ├ Storage Locations | MapPin | `/inventory/storage-locations` | Manage bin/shelf locations | `inventory.storage.manage` |
| ├ Products | Box | `/inventory/products` | Product catalog management | `inventory.view` |
| └ Inventory Movements | ArrowUpDown | `/inventory/movements` | Stock movement history | `inventory.view` |

### Purchases

| Menu Label | Icon | Route | Description | Permission |
|---|---|---|---|---|
| Purchases | ShoppingBag | `/purchases` | Purchasing dashboard | `purchases.view` |
| ├ Dashboard | LayoutDashboard | `/purchases` | Purchasing KPIs and alerts | `purchases.view` |
| ├ Orders | FileText | `/purchases/orders` | Purchase order management | `purchases.view` |
| ├ Requests | Layers | `/purchases/requests` | Internal purchase requests | `purchases.requests` |
| ├ Receipts | Package | `/purchases/receipts` | Goods receiving records | `purchases.receive` |
| ├ Returns | RotateCcw | `/purchases/returns` | Supplier returns management | `purchases.returns` |
| ├ Supplier Products | Briefcase | `/purchases/supplier-products` | Supplier product catalog mapping | `purchases.supplier_products` |
| ├ Cost History | DollarSign | `/purchases/cost-history` | Product cost price history | `purchases.cost_history` |
| └ Reorder Suggestions | ArrowUpDown | `/purchases/reorder-suggestions` | Auto-generated reorder list | `purchases.view` |

### CRM

| Menu Label | Icon | Route | Description | Permission |
|---|---|---|---|---|
| CRM | Users | `/crm` | CRM dashboard | `customers.view` |
| ├ Dashboard | LayoutDashboard | `/crm` | CRM KPIs and overview | `customers.view` |
| ├ Customers | Users | `/crm/customers` | Full customer profiles | `customers.view` |
| ├ Vehicles | Car | `/crm/vehicles` | Customer vehicle records | `vehicles.view` |
| ├ Compatibility | GitCompare | `/crm/compatibility` | Parts-by-vehicle search | `inventory.view` |
| ├ Reminders | BellRing | `/crm/reminders` | Service reminders | `reminders.view` |
| ├ Warranties | ShieldCheck | `/crm/warranties` | Warranty registration and tracking | `warranty.view` |
| ├ Credit | CreditCard | `/crm/credit` | Customer credit accounts | `customers.credit` |
| └ Notes | StickyNote | `/crm/notes` | Internal customer notes | `customers.notes` |

### Suppliers

| Menu Label | Icon | Route | Description | Permission |
|---|---|---|---|---|
| Suppliers | Truck | `/suppliers` | Supplier directory | `suppliers.view` |

### Warehouse

| Menu Label | Icon | Route | Description | Permission |
|---|---|---|---|---|
| Warehouse | Warehouse | `/warehouse` | Multi-warehouse management | `warehouse.view` |

---

## Secondary Navigation

### Reports

| Menu Label | Icon | Route | Description | Permission |
|---|---|---|---|---|
| Reports | BarChart3 | `/reports` | Executive dashboard | `reports.view` |
| ├ Executive Dashboard | LayoutDashboard | `/reports` | Business performance overview | `reports.view` |
| ├ Sales | ShoppingCart | `/reports/sales` | Sales reports suite | `reports.sales.view` |
| ├ Inventory | Package | `/reports/inventory` | Inventory reports suite | `reports.inventory.view` |
| ├ Purchasing | ShoppingBag | `/reports/purchasing` | Purchasing reports suite | `reports.purchases.view` |
| ├ Customers | Users | `/reports/customers` | Customer reports suite | `reports.customers.view` |
| ├ Suppliers | Truck | `/reports/suppliers` | Supplier reports suite | `reports.suppliers.view` |
| ├ Warehouses | Warehouse | `/reports/warehouses` | Warehouse reports suite | `reports.warehouses.view` (implied) |
| ├ Profitability | DollarSign | `/reports/profitability` | Profit and margin analysis | `reports.profitability.view` |
| ├ KPIs | BarChart3 | `/reports/kpis` | Key performance indicators | `reports.view` |
| ├ Custom Reports | FileText | `/reports/custom` | Custom report builder | `reports.create` |
| ├ Scheduled Reports | BellRing | `/reports/scheduled` | Auto-generated report schedules | `reports.schedule` |
| └ Exports | Printer | `/reports/exports` | Report data export | `reports.export` |

### Administration

| Menu Label | Icon | Route | Description | Permission |
|---|---|---|---|---|
| Administration | Shield | `/admin` | Admin dashboard | `admin.*` (varies) |
| ├ Dashboard | Monitor | `/admin` | System overview and health | `admin.dashboard` (implied) |
| ├ Users | Users | `/admin/users` | User account management | `admin.users.manage` |
| ├ Roles | ShieldCheck | `/admin/roles` | Role and permission management | `admin.roles.manage` |
| ├ Permissions | Shield | `/admin/roles` | Permission matrix (same page) | `admin.permissions.manage` |
| ├ Settings | Settings | `/admin/settings` | Application-wide settings | `admin.settings.manage` |
| ├ Printers | Printer | `/admin/printers` | Printer configuration | `admin.printers.manage` |
| ├ Devices | Smartphone | `/admin/devices` | Hardware device management | `admin.devices.manage` |
| ├ Backups | HardDrive | `/admin/backups` | Backup creation and management | `admin.backups.manage` |
| ├ Restore | RotateCcw | `/admin/restore` | Database restore from backup | `admin.restore` |
| ├ Database | Database | `/admin/database` | Database stats and maintenance | `admin.database.manage` |
| ├ Diagnostics | Activity | `/admin/diagnostics` | System diagnostic checks | `admin.diagnostics.view` |
| ├ Audit | FileText | `/admin/audit` | Audit log viewer | `admin.audit.view` |
| ├ Updates | Wifi | `/admin/updates` | Software update center | `admin.updates.manage` |
| ├ Licensing | Shield | `/admin/licensing` | License key management | `admin.license.manage` |
| ├ Maintenance | Cog | `/admin/maintenance` | System maintenance tools | `admin.maintenance.manage` |
| └ About | HelpCircle | `/admin/about` | Application info and credits | (all authenticated) |

### Employees

| Menu Label | Icon | Route | Description | Permission |
|---|---|---|---|---|
| Employees | UsersRound | `/employees` | Employee/user list | `employees.manage` |

### Settings

| Menu Label | Icon | Route | Description | Permission |
|---|---|---|---|---|
| Settings | Settings | `/settings` | Personal preferences and store config | `settings.view` |

### Help

| Menu Label | Icon | Route | Description | Permission |
|---|---|---|---|---|
| Help | HelpCircle | `/help` | Documentation and support | `dashboard.view` |

---

## Sub-routes and Form Routes

Many CRUD pages have dedicated sub-routes for creating and editing entities.

### Inventory

| Route | Page Component | Description |
|---|---|---|
| `/inventory/categories/new` | CategoryFormPage | Create category |
| `/inventory/categories/:id/edit` | CategoryFormPage | Edit category |
| `/inventory/brands/new` | BrandFormPage | Create brand |
| `/inventory/brands/:id/edit` | BrandFormPage | Edit brand |
| `/inventory/manufacturers/new` | ManufacturerFormPage | Create manufacturer |
| `/inventory/manufacturers/:id/edit` | ManufacturerFormPage | Edit manufacturer |
| `/inventory/suppliers/new` | SupplierFormPage | Create supplier |
| `/inventory/suppliers/:id/edit` | SupplierFormPage | Edit supplier |
| `/inventory/warehouses/new` | WarehouseFormPage | Create warehouse |
| `/inventory/warehouses/:id/edit` | WarehouseFormPage | Edit warehouse |
| `/inventory/storage-locations/new` | StorageLocationFormPage | Create storage location |
| `/inventory/storage-locations/:id/edit` | StorageLocationFormPage | Edit storage location |
| `/inventory/products/new` | ProductFormPage | Create product |
| `/inventory/products/:id` | ProductDetailPage | Product detail and history |
| `/inventory/products/:id/edit` | ProductFormPage | Edit product |
| `/inventory/movements/new` | InventoryMovementFormPage | Record stock movement |

### Sales

| Route | Page Component | Description |
|---|---|---|
| `/sales/new` | PosPage | POS terminal |
| `/sales/:id` | SaleDetailPage | Sale detail and receipt |
| `/sales/quotes/new` | QuoteFormPage | Create quote |
| `/sales/quotes/:id` | QuoteDetailPage | Quote detail |
| `/sales/quotes/:id/edit` | QuoteFormPage | Edit quote |

### Purchases

| Route | Page Component | Description |
|---|---|---|
| `/purchases/orders/new` | PurchaseOrderFormPage | Create purchase order |
| `/purchases/orders/:id` | PurchaseOrderDetailPage | PO detail and receive |
| `/purchases/orders/:id/edit` | PurchaseOrderFormPage | Edit purchase order |

### Administration

| Route | Page Component | Description |
|---|---|---|
| `/admin/users/new` | AdminUserFormPage | Create user |
| `/admin/users/:id/edit` | AdminUserFormPage | Edit user |
| `/admin/roles/new` | AdminRoleFormPage | Create role |
| `/admin/roles/:id/edit` | AdminRoleFormPage | Edit role |

### CRM

| Route | Page Component | Description |
|---|---|---|
| `/crm/customers/:id` | CrmCustomerDetailPage | Full customer profile |

---

## Dialogs and Modals

| Dialog/Modal | Trigger | Description |
|---|---|---|
| **Command Palette** | Ctrl+K / Cmd+K | Quick navigation and theme toggle |
| **Confirm Dialog** | Various actions (delete, save, etc.) | Confirmation prompt before actions |
| **Prompt Dialog** | Various inputs | Text input dialog for prompts |
| **Error Boundary** | Unhandled errors | Crashed component fallback UI |
| **Notification Center** | Bell icon (top bar) | List of recent notifications |
| **Notification Toast** | System events | Transient success/error/warning messages |

## Authentication Routes

| Route | Page Component | Description |
|---|---|---|
| `/login` | LoginPage | User login (GuestRoute) |
| `/forbidden` | ForbiddenPage | Access denied (no permission) |

## Catch-All

| Route | Behavior |
|---|---|
| `*` (any unregistered route) | Redirects to `/dashboard` |
