# Screenshot Catalog

> **Last updated:** 2026-07-29
> **Total screenshots:** ~95

---

## Conventions

- **Theme:** Light by default; Dark variant captured where marked
- **Language:** EN by default; Spanish variant captured where critical
- **Resolution:** 1440×900 (desktop), 390×844 (mobile if applicable)
- **Dependencies:** Seed data required for realistic content

---

## Auth

| # | Screenshot | Route | Purpose | Data/State | Theme | Language | Dependencies | Expected UI |
|---|---|---|---|---|---|---|---|---|
| 1 | `auth-login.png` | `/login` | Full login page with branding panel | Fresh load, no credentials | Light | EN | None | Centered card with login form, app branding on left panel, theme/language toggles at top-right |
| 2 | `auth-login-dark.png` | `/login` | Login page in dark mode | Fresh load | Dark | EN | None | Same layout with dark background |
| 3 | `auth-login-debug.png` | `/login` | Login with test roles expanded | Debug panel expanded showing 5 test role buttons | Light | EN | None | Login form with collapsed debug area expanded, showing Owner, Admin, Cashier, Warehouse, Viewer quick-login buttons |
| 4 | `auth-forbidden.png` | `/forbidden` | Forbidden/403 error page | Direct navigation to `/forbidden` | Light | EN | None | Centered shield-off icon, "Forbidden" title, description, "Go to Dashboard" button |

---

## Dashboard

| # | Screenshot | Route | Purpose | Data/State | Theme | Language | Dependencies | Expected UI |
|---|---|---|---|---|---|---|---|---|
| 5 | `dashboard-main.png` | `/dashboard` | Main dashboard with all widgets | Seeded data: sales, purchases, inventory | Light | EN | Seed data | 4 stat cards, monthly bar chart, profit card, best sellers table, recent activity feed, stock alerts table, recent purchases cards |
| 6 | `dashboard-main-dark.png` | `/dashboard` | Dashboard in dark mode | Same as above | Dark | EN | Seed data | Same layout with dark theme |

---

## Inventory

| # | Screenshot | Route | Purpose | Data/State | Theme | Language | Dependencies | Expected UI |
|---|---|---|---|---|---|---|---|---|
| 7 | `inventory-dashboard.png` | `/inventory` | Inventory dashboard stats | Seeded categories, brands, products | Light | EN | Seed data | 8 stat cards: Total/Active/Inactive Products, Inventory Value, Categories, Brands, Suppliers, Warehouses |
| 8 | `inventory-categories.png` | `/inventory/categories` | Categories list | 5+ categories exist | Light | EN | Seed data | DataTable with id, name, description, status columns, New Category button |
| 9 | `inventory-category-form.png` | `/inventory/categories/new` | Category create form | Empty form | Light | EN | None | EntityFormPage with Name, Description fields, Active switch, back button, save button |
| 10 | `inventory-brands.png` | `/inventory/brands` | Brands list | 5+ brands exist | Light | EN | Seed data | DataTable with id, name, description, status |
| 11 | `inventory-brand-form.png` | `/inventory/brands/new` | Brand create form | Empty form | Light | EN | None | Form with Name, Description, Active |
| 12 | `inventory-manufacturers.png` | `/inventory/manufacturers` | Manufacturers list | 5+ manufacturers exist | Light | EN | Seed data | DataTable with id, name, description, country, status |
| 13 | `inventory-manufacturer-form.png` | `/inventory/manufacturers/new` | Manufacturer form | Empty form | Light | EN | None | Form with Name, Description, Country, Active |
| 14 | `inventory-suppliers-list.png` | `/inventory/suppliers` | Inventory suppliers list | 5+ suppliers exist | Light | EN | Seed data | DataTable with company name, contact, email, phone, status |
| 15 | `inventory-supplier-form.png` | `/inventory/suppliers/new` | Supplier form | Empty form | Light | EN | None | Form with Company Name, Contact, Email, Phone, Address, City, State, Postal Code, Country, Notes, Active |
| 16 | `inventory-warehouses.png` | `/inventory/warehouses` | Warehouses list | 2+ warehouses exist | Light | EN | Seed data | DataTable with name, code, address, city, status |
| 17 | `inventory-warehouse-form.png` | `/inventory/warehouses/new` | Warehouse form | Empty form | Light | EN | None | Form with Name, Code, Address, City, State, Country, Active |
| 18 | `inventory-storage-locations.png` | `/inventory/storage-locations` | Storage locations list | 5+ locations exist | Light | EN | Seed data | DataTable with code, zone, warehouse, status |
| 19 | `inventory-storage-location-form.png` | `/inventory/storage-locations/new` | Storage location form | Empty form | Light | EN | None | Form with Code, Zone, Warehouse select, Description, Active |
| 20 | `inventory-products.png` | `/inventory/products` | Products list with data | 20+ products seeded | Light | EN | Seed data | DataTable: Name, SKU, Barcode, Cost/Sale Price, Stock badge (color-coded), Status. Search, pagination, Add Product button |
| 21 | `inventory-products-search.png` | `/inventory/products` | Products list with search active | Search query typed, filtered results | Light | EN | Seed data | Search bar with text, table filtered to matching products |
| 22 | `inventory-product-form.png` | `/inventory/products/new` | Product create form | Empty form, reference data loaded | Light | EN | Seed categories/brands/warehouses | Multi-section form: Basic Info, Pricing, Stock, Location. Selects populated with reference data |
| 23 | `inventory-product-detail.png` | `/inventory/products/:id` | Product detail view | Product with images and compatibility | Light | EN | Product with images, compatibility | EntityDetailPage with info cards: General Info, Pricing, Stock, Images list, Compatibility entries |
| 24 | `inventory-movements.png` | `/inventory/movements` | Movement history | 10+ movements from sales/receipts | Light | EN | Seed data with transactions | DataTable: ID, Product, Type badge (in/out/adjustment), Quantity, Reference, Date |
| 25 | `inventory-movement-form.png` | `/inventory/movements/new` | New movement form | Empty form | Light | EN | Products exist | Form: Product search, Type select, Quantity, Reference, Notes |

---

## Sales

| # | Screenshot | Route | Purpose | Data/State | Theme | Language | Dependencies | Expected UI |
|---|---|---|---|---|---|---|---|---|
| 26 | `sales-history.png` | `/sales` | Sales history with stats | 15+ sales with varied statuses | Light | EN | Seed sales data | 4 stat cards (Today's Sales, Monthly, Avg Ticket, Pending), DataTable with sale#, customer, total, payment, status badge, items, date |
| 27 | `sales-pos.png` | `/sales/new` | POS page with products | Products loaded, cart empty | Light | EN | Seed products | Two-column layout: left product cards grid with search, right cart panel with totals, customer search, payments |
| 28 | `sales-pos-cart.png` | `/sales/new` | POS with items in cart | 3+ items in cart, customer selected, discount set | Light | EN | Seed products | Left: product grid. Right: cart with items (qty +/-), subtotal/tax/discount, customer selected, payment rows, Complete Sale button with total |
| 29 | `sales-pos-payments.png` | `/sales/new` | POS with multiple payment methods | Cart with items, 2 payment rows (cash + card) | Light | EN | Seed products | Payment section with one cash row and one card row, total paid matching total, change due shown |
| 30 | `sales-detail.png` | `/sales/:id` | Sale detail with items/payments/receipts | Completed sale with multiple items | Light | EN | Sale exists | Back button, sale header, tabs: Items (line items table), Payments (payment rows), Receipts. Actions: Print, Refund |
| 31 | `sales-detail-refund.png` | `/sales/:id` | Sale detail in refund mode | Refund button clicked, reason field shown | Light | EN | Sale exists | Refund mode UI: reason textarea, confirm button, cancel |
| 32 | `sales-closeout.png` | `/sales/closeout` | Daily closeout | Day has sales data | Light | EN | Sales today | Stat cards, sales by payment method summary, discounts, returns, Close Shift button, previous closings table |
| 33 | `sales-quotes.png` | `/sales/quotes` | Quotes list | 5+ quotes with varied statuses | Light | EN | Seed quotes | DataTable: Quote#, Customer, Total, Status badge (colored: draft/sent/accepted/rejected/expired/converted), Valid until, Date |
| 34 | `sales-quote-form.png` | `/sales/quotes/new` | Quote create form | Empty form | Light | EN | Seed customers, products | Customer search, line items section (add products), tax rate, notes, Save button |
| 35 | `sales-quote-detail.png` | `/sales/quotes/:id` | Quote detail | Quote with items, status "draft" | Light | EN | Quote exists | Quote header, items table, totals, actions: Convert to Sale, Edit, Delete |
| 36 | `sales-returns.png` | `/sales/returns` | Returns page | Past returns visible | Light | EN | Seed returns | Stat cards, search sales input, results table, refund dialog |
| 37 | `sales-cash-register.png` | `/sales/register` | Cash register | Active session or no session | Light | EN | Seed data | Active session card, Open/Close form, sessions history table |
| 38 | `sales-receipts.png` | `/sales/receipts` | Receipts page | Sales with receipts generated | Light | EN | Seed sales with receipts | DataTable: Sale#, Receipt count, Last printed, actions to mark printed |

---

## Purchases

| # | Screenshot | Route | Purpose | Data/State | Theme | Language | Dependencies | Expected UI |
|---|---|---|---|---|---|---|---|---|
| 39 | `purchases-dashboard.png` | `/purchases` | Purchases dashboard | PO data exists | Light | EN | Seed POs | Stat cards, recent PO list, quick action buttons |
| 40 | `purchases-orders.png` | `/purchases/orders` | Purchase orders list | 5+ POs with varied statuses | Light | EN | Seed POs | DataTable: PO#, Supplier, Date, Status badge, Total, Items, Expected Date |
| 41 | `purchases-order-form.png` | `/purchases/orders/new` | PO create form | Empty form | Light | EN | Seed suppliers, products | Supplier select, warehouse select, dates, line items section (search products), notes, Save |
| 42 | `purchases-order-form-items.png` | `/purchases/orders/new` | PO form with items added | 3+ items added | Light | EN | Seed suppliers, products | Line items table with product name, qty, unit cost, discount, tax, total. Add item search visible |
| 43 | `purchases-order-detail.png` | `/purchases/orders/:id` | PO detail | PO with status "sent" | Light | EN | PO exists | PO header, items table, totals, actions: Edit, Send, Receive, Cancel |
| 44 | `purchases-order-receive.png` | `/purchases/orders/:id` | PO receive mode | Receive mode activated | Light | EN | PO exists | Items table with received/damaged qty input fields, confirm button |
| 45 | `purchases-requests.png` | `/purchases/requests` | Purchase requests | Some requests exist | Light | EN | Seed data | Requests list with status, approve/reject actions |
| 46 | `purchases-receipts.png` | `/purchases/receipts` | Purchase receipts | Past receipts exist | Light | EN | Seed receipts | DataTable: Receipt#, PO#, Supplier, Date, Items, Received by |
| 47 | `purchases-receipt-detail.png` | `/purchases/receipts/:id` | Receipt detail | Receipt exists | Light | EN | Receipt exists | Receipt header, items table (product, ordered, received, damaged, accepted) |
| 48 | `purchases-returns.png` | `/purchases/returns` | Purchase returns | Returns exist | Light | EN | Seed returns | Returns list, create return form |
| 49 | `purchases-supplier-products.png` | `/purchases/supplier-products` | Supplier product catalog | Suppliers with products exist | Light | EN | Seed data | Supplier select → products grid with supplier SKU, cost, lead time, MOQ |
| 50 | `purchases-cost-history.png` | `/purchases/cost-history` | Cost history | Product cost changes exist | Light | EN | Seed data | Product search → cost history table + cost over time chart |
| 51 | `purchases-reorder-suggestions.png` | `/purchases/reorder-suggestions` | Reorder suggestions | Products below reorder point | Light | EN | Seed data | Table: Product, Current Stock, Reorder Point, Suggested Qty, Supplier. Generate PO button |

---

## Customers

| # | Screenshot | Route | Purpose | Data/State | Theme | Language | Dependencies | Expected UI |
|---|---|---|---|---|---|---|---|---|
| 52 | `customers-list.png` | `/customers` | Customers list | 10+ customers seeded | Light | EN | Seed customers | PageHeader + Search + Customer cards/table with name, email, phone, address, status badge. Add Customer button |
| 53 | `customers-detail.png` | `/customers/:id` | Customer detail page | Customer with sales and credit account | Light | EN | Customer with data | Back button, customer name + status, 3 stat cards, tabs: Info, Sales History, Credit Account, Communications |

---

## CRM

| # | Screenshot | Route | Purpose | Data/State | Theme | Language | Dependencies | Expected UI |
|---|---|---|---|---|---|---|---|---|
| 54 | `crm-dashboard.png` | `/crm` | CRM dashboard | Customers, vehicles, reminders, warranties exist | Light | EN | Seed CRM data | 7 stat cards, recent reminders list, recent warranties list |
| 55 | `crm-customers.png` | `/crm/customers` | CRM customers | 10+ customers | Light | EN | Seed customers | Search bar, Add Customer button, customer cards with contact info, edit/archive actions |
| 56 | `crm-customer-detail.png` | `/crm/customers/:id` | CRM customer detail | Full customer profile | Light | EN | Customer with all data | Back button, customer name + status, stats, tabs: Info, Sales, Notes, Vehicles, Credit, Communications, Timeline |
| 57 | `crm-customer-vehicles.png` | `/crm/customers/:id` | Customer vehicles tab | Customer has 2+ vehicles | Light | EN | Customer with vehicles | Vehicles tab selected, vehicle list, Add Vehicle button |
| 58 | `crm-customer-vehicle-dialog.png` | `/crm/customers/:id` | Add vehicle dialog | Dialog open, brand selected, models populated | Light | EN | Brands and models exist | Dialog with cascading selects: Brand, Model, Generation, Engine. Text fields: Year, VIN, License Plate, Color, Notes |
| 59 | `crm-vehicles-reference.png` | `/crm/vehicles` | Vehicle reference data | Brands with models | Light | EN | Seed vehicle data | Expandable brand list with models under each brand, Add Brand/Model buttons |
| 60 | `crm-compatibility.png` | `/crm/compatibility` | Vehicle compatibility checker | Brands, models, products exist | Light | EN | Seed data | 4 cascading selects (Brand → Model → Year → Engine), compatible products grid results |
| 61 | `crm-compatibility-results.png` | `/crm/compatibility` | Compatibility search results | Brand/model/year selected, results shown | Light | EN | Seed data | Products grid showing compatible products with price and stock badges |
| 62 | `crm-reminders.png` | `/crm/reminders` | Service reminders | 5+ reminders, mix of pending/completed | Light | EN | Seed reminders | Status filter tabs, DataTable: Customer, Title, Type, Due Date, Due Mileage, Status badge, actions |
| 63 | `crm-reminder-form.png` | `/crm/reminders` | New reminder dialog | Dialog open | Light | EN | Customers exist | Dialog: Customer search, Title, Type dropdown, Description, Due Date, Due Mileage, Notes |
| 64 | `crm-warranties.png` | `/crm/warranties` | Warranties list | 5+ warranties | Light | EN | Seed warranties | Status filter, DataTable: Customer, Product, Type, Period, Start/End Date, Status |
| 65 | `crm-warranty-form.png` | `/crm/warranties` | New warranty dialog | Dialog open | Light | EN | Customers, products exist | Dialog: Customer search, Product search, Type select, Period months, Start Date, Notes |
| 66 | `crm-credit.png` | `/crm/credit` | Credit accounts overview | 3+ credit accounts | Light | EN | Credit accounts exist | Summary stats: Total Credit, Outstanding, Available, At-Risk. Accounts table with utilization |
| 67 | `crm-notes.png` | `/crm/notes` | Customer notes | Notes exist across customers | Light | EN | Notes exist | Search, type filter, notes list: customer name, type badge, content, date |

---

## Suppliers

| # | Screenshot | Route | Purpose | Data/State | Theme | Language | Dependencies | Expected UI |
|---|---|---|---|---|---|---|---|---|
| 68 | `suppliers-list.png` | `/suppliers` | Suppliers list | 5+ suppliers | Light | EN | Seed suppliers | PageHeader, SearchBar, supplier cards with name, contact, phone, email, products count, status |

---

## Vehicles

| # | Screenshot | Route | Purpose | Data/State | Theme | Language | Dependencies | Expected UI |
|---|---|---|---|---|---|---|---|---|
| 69 | `vehicles-list.png` | `/vehicles` | Vehicles page (standalone) | Placeholder state | Light | EN | None | 3 stat cards showing "—", EmptyState with "Coming Soon" message, planned features list |

---

## Warehouse

| # | Screenshot | Route | Purpose | Data/State | Theme | Language | Dependencies | Expected UI |
|---|---|---|---|---|---|---|---|---|
| 70 | `warehouse-dashboard.png` | `/warehouse` | Warehouse dashboard | Placeholder state | Light | EN | None | 4 stat cards showing "—", EmptyState with "Coming Soon", planned features list |

---

## Reports

| # | Screenshot | Route | Purpose | Data/State | Theme | Language | Dependencies | Expected UI |
|---|---|---|---|---|---|---|---|---|
| 71 | `reports-executive.png` | `/reports` | Executive report dashboard | Dashboard metrics exist | Light | EN | Seed data | Stat cards, charts (line, bar, area, pie), report tables |
| 72 | `reports-sales.png` | `/reports/sales` | Sales report | 30+ days of sales | Light | EN | Seed sales data | ReportFilters bar, stat cards, tabs: Overview, By Cashier, By Payment Method, Discounts, Returns, Tax. Charts + tables |
| 73 | `reports-sales-chart.png` | `/reports/sales` | Sales report with chart visible | Chart tab active | Light | EN | Seed data | Bar/pie chart rendered with sales data |
| 74 | `reports-inventory.png` | `/reports/inventory` | Inventory report | Products exist | Light | EN | Seed products | Filters, tabs: Stock Levels, Stock Value, Low Stock, Inactive Products, Movement Summary |
| 75 | `reports-purchasing.png` | `/reports/purchasing` | Purchasing report | PO data exists | Light | EN | Seed POs | Filters, tabs: PO Summary, Supplier Performance, Cost Analysis, Lead Times |
| 76 | `reports-customers.png` | `/reports/customers` | Customer report | Customer sales data | Light | EN | Seed customers/sales | Filters, tabs: Top Customers, Customer Activity, Credit Analysis |
| 77 | `reports-suppliers.png` | `/reports/suppliers` | Supplier report | Supplier PO data | Light | EN | Seed suppliers/POs | Filters, tabs: Supplier Performance, On-Time Delivery, Pricing Trends |
| 78 | `reports-warehouses.png` | `/reports/warehouses` | Warehouse report | Warehouse stock data | Light | EN | Seed warehouses | Filters, tabs: Capacity, Stock Distribution, Movement Frequency |
| 79 | `reports-profitability.png` | `/reports/profitability` | Profitability report | Sales and cost data | Light | EN | Seed data | Filters, stat cards (Gross Profit, Net Profit, Margin %), charts, tables |
| 80 | `reports-kpis.png` | `/reports/kpis` | KPI dashboard | Calculated metrics | Light | EN | Seed data | KPI cards: Revenue/employee, Orders/day, Stock Turnover, Sell-Through, Avg Margin, CLV |
| 81 | `reports-custom.png` | `/reports/custom` | Custom reports | Saved reports exist | Light | EN | Seed data | Saved reports list, create new report builder |
| 82 | `reports-scheduled.png` | `/reports/scheduled` | Scheduled reports | Schedules exist | Light | EN | Seed data | Schedule list with frequency/recipients/format, create form |
| 83 | `reports-exports.png` | `/reports/exports` | Export history | Past exports exist | Light | EN | Seed data | Export history table, export generator form |

---

## Admin

| # | Screenshot | Route | Purpose | Data/State | Theme | Language | Dependencies | Expected UI |
|---|---|---|---|---|---|---|---|---|
| 84 | `admin-dashboard.png` | `/admin` | Admin dashboard | System running with data | Light | EN | Users, printers configured | 8 stat cards: Active/Total Users, DB Size, Printers, Logins, Errors, Audits, Storage |
| 85 | `admin-users.png` | `/admin/users` | Users list | 3+ users exist | Light | EN | Seed users | Search bar, DataTable: Name, Email, Role, Status badge, Last Login. Row actions dropdown (Edit, Lock, Archive, Reset Password) |
| 86 | `admin-user-form.png` | `/admin/users/new` | User create form | Empty form | Light | EN | Roles exist | Form: Full Name, Email, Username, Password, Role select, Active switch, Save |
| 87 | `admin-roles.png` | `/admin/roles` | Roles list | 3+ roles exist | Light | EN | Seed roles | DataTable: Name, Description, Users count, System Role badge. Add Role button |
| 88 | `admin-role-form.png` | `/admin/roles/new` | Role form with permissions | Active tab open | Light | EN | Modules exist | Form: Name, Description. Permissions tree with checkboxes grouped by module |
| 89 | `admin-settings.png` | `/admin/settings` | App settings | Settings loaded | Light | EN | Seed settings | Category sidebar (16 categories), settings form with varied inputs (text, number, switch, select) |
| 90 | `admin-printers.png` | `/admin/printers` | Printer configuration | 2+ printers configured | Light | EN | Printers exist | Printer list: Name, Type, Interface, Status. Add/Edit/Test/Delete actions |
| 91 | `admin-devices.png` | `/admin/devices` | Registered devices | Devices exist | Light | EN | Devices | Device list: Name, Type, Last Seen, Status |
| 92 | `admin-backups.png` | `/admin/backups` | Backup management | 3+ backups exist | Light | EN | Backups exist | Stat cards, backup history table with download/delete. Create Backup button |
| 93 | `admin-restore.png` | `/admin/restore` | Database restore | Backups available | Light | EN | Backups exist | File/backup selector, restore confirmation with warning |
| 94 | `admin-database.png` | `/admin/database` | Database management | DB connected | Light | EN | None | DB info card (type, version, size), maintenance action buttons (Vacuum, Analyze, Reindex, Migrate) |
| 95 | `admin-diagnostics.png` | `/admin/diagnostics` | System diagnostics | All checks run | Light | EN | None | Health checks list with pass/warning/fail status badges, Run All button |
| 96 | `admin-audit.png` | `/admin/audit` | Audit log | Log entries exist | Light | EN | Audit events | DataTable: Timestamp, User, Action, Entity, Details, IP. Filters for date/user/action |
| 97 | `admin-updates.png` | `/admin/updates` | Software updates | Current version shown | Light | EN | None | Current version, Check for Updates button, update history, release notes |
| 98 | `admin-licensing.png` | `/admin/licensing` | License management | License info | Light | EN | None | License status, key input, registered to, expiration, feature flags |
| 99 | `admin-maintenance.png` | `/admin/maintenance` | Maintenance tools | System running | Light | EN | None | Maintenance mode toggle, cache clear, log cleanup, temp file cleanup, reindex |
| 100 | `admin-about.png` | `/admin/about` | About page | App info | Light | EN | None | App name, version, build date, tech stack, licenses, links |

---

## Settings

| # | Screenshot | Route | Purpose | Data/State | Theme | Language | Dependencies | Expected UI |
|---|---|---|---|---|---|---|---|---|
| 101 | `settings-page.png` | `/settings` | User settings | Default state | Light | EN | None | Settings category cards grid: Store, Appearance, Database, Notifications, Security, Localization, Printing, Shipping. Language toggle |

---

## Employees

| # | Screenshot | Route | Purpose | Data/State | Theme | Language | Dependencies | Expected UI |
|---|---|---|---|---|---|---|---|---|
| 102 | `employees-list.png` | `/employees` | Employees list | 4 employees hardcoded | Light | EN | None | PageHeader with disabled Add/Export buttons, employee cards: name, role, email, status badge, last active |

---

## Help

| # | Screenshot | Route | Purpose | Data/State | Theme | Language | Dependencies | Expected UI |
|---|---|---|---|---|---|---|---|---|
| 103 | `help-page.png` | `/help` | Help and support | Default state | Light | EN | None | 3-column grid: Documentation, Support, Keyboard Shortcuts. Shortcuts list with key combos |

---

## Summary by Module

| Module | Count | Screenshots |
|---|---|---|
| Auth | 4 | Login, Login Dark, Login Debug, Forbidden |
| Dashboard | 2 | Main, Main Dark |
| Inventory | 19 | Dashboard, 6 lists, 6 forms, Products list, Products search, Product form, Product detail, Movements list, Movement form |
| Sales | 13 | History, POS empty, POS cart, POS payments, Detail, Detail refund, Closeout, Quotes list, Quote form, Quote detail, Returns, Cash register, Receipts |
| Purchases | 13 | Dashboard, Orders list, Order form, Order form items, Order detail, Order receive, Requests, Receipts list, Receipt detail, Returns, Supplier products, Cost history, Reorder suggestions |
| Customers | 2 | List, Detail |
| CRM | 14 | Dashboard, Customers list, Customer detail, Vehicles tab, Vehicle dialog, Reference vehicles, Compatibility empty, Compatibility results, Reminders, Reminder form, Warranties, Warranty form, Credit, Notes |
| Suppliers | 1 | List |
| Vehicles | 1 | List (placeholder) |
| Warehouse | 1 | Dashboard (placeholder) |
| Reports | 13 | Executive, Sales, Sales chart, Inventory, Purchasing, Customers, Suppliers, Warehouses, Profitability, KPIs, Custom, Scheduled, Exports |
| Admin | 17 | Dashboard, Users list, User form, Roles list, Role form, Settings, Printers, Devices, Backups, Restore, Database, Diagnostics, Audit, Updates, Licensing, Maintenance, About |
| Settings | 1 | Page |
| Employees | 1 | List |
| Help | 1 | Page |
| **Total** | **103** | |
