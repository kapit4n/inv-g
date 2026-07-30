# Screens Documentation

> **Last updated:** 2026-07-29
> **Total routes:** 80 (including index redirects and catch-all)

---

## Legend

| Column | Description |
|---|---|
| **Route** | URL path |
| **Component** | Page component rendered |
| **Entry** | How user navigates to this screen (Sidebar → Submenu → Item) |
| **Layout** | Structural breakdown (Toolbar, Sidebar sections, Main content, Action buttons) |
| **Dialogs** | Modal dialogs that overlay this screen |
| **Exit** | Navigation exits from this screen |

---

## 1. Auth

### 1.1 Login

| Field | Value |
|---|---|
| **Route** | `/login` |
| **Component** | `LoginPage` |
| **Entry** | App loads → guest route redirects to `/login` |
| **Layout** | Full-screen centered card on gradient background. Left panel (lg+) shows app branding + help text. Right panel has login card with `LoginForm`. Theme toggle (light/dark/system) and language toggle (EN/ES) at top-right. Debug expandable panel for test role login. |
| **Form fields** | Username (text), Password (password with show/hide toggle), Remember me (switch) |
| **Actions** | Sign in button, Test role quick-login buttons (owner, admin, cashier, warehouse, viewer) |
| **Data displayed** | App name, welcome subtitle, help text |
| **Exit points** | Successful login navigates to `/dashboard` |
| **Related screens** | Dashboard, Forbidden |

### 1.2 Forbidden

| Field | Value |
|---|---|
| **Route** | `/forbidden` |
| **Component** | `ForbiddenPage` |
| **Entry** | User lacks permission for a route |
| **Layout** | Full-screen centered. Shield-off icon, title "Forbidden", description text, button to go to dashboard |
| **Actions** | "Go to Dashboard" button |
| **Exit points** | Button → `/dashboard` |
| **Related screens** | Dashboard |

---

## 2. Dashboard

### 2.1 Main Dashboard

| Field | Value |
|---|---|
| **Route** | `/dashboard` |
| **Component** | `DashboardPage` |
| **Entry** | Sidebar → Dashboard icon, or default redirect after login |
| **Layout** | **Toolbar:** Page title "Dashboard", description. **Main content (vertical stack):** 4 StatCards row (Today's Sales, Today's Orders, Inventory Value, Low Stock Items) → 2-column grid: Monthly Sales Overview (bar chart placeholder + legend) + Profit Overview (this month profit, revenue/COGS breakdown) → 2-column grid: Best Sellers table (rank, name/SKU, sold count, revenue) + Recent Activity feed (type badge, action text, detail, time) → 2-column grid: Stock Alerts table (product, current stock, min, status badge) + Recent Purchases cards (PO#, supplier, items count, amount, status badge) |
| **Actions** | View Report (disabled), theme cycle (top bar), command palette (⌘K) |
| **Data displayed** | 4 stat cards, monthly sales/purchases bar chart, profit metrics, best sellers top 5, recent activity feed, low stock warnings, recent purchase orders |
| **Exit points** | Sidebar navigation, top bar user menu (logout) |
| **Related screens** | All other screens |

---

## 3. CRM

### 3.1 CRM Dashboard

| Field | Value |
|---|---|
| **Route** | `/crm` |
| **Component** | `CrmDashboardPage` |
| **Entry** | Sidebar → CRM |
| **Layout** | **Toolbar:** "CRM Dashboard" title. **Main content:** 7 stat cards grid (Total Customers, New This Month, Active Customers, Vehicles Registered, Upcoming Reminders, Expired Warranties, Lifetime Revenue) → Recent Reminders list → Recent Warranties list |
| **Actions** | None (overview only) |
| **Data displayed** | CRM summary stats, reminders, warranties |
| **Related screens** | CRM Customers, CRM Vehicles, CRM Compatibility, CRM Reminders, CRM Warranties, CRM Credit, CRM Notes |

### 3.2 CRM Customers List

| Field | Value |
|---|---|
| **Route** | `/crm/customers` |
| **Component** | `CrmCustomersPage` |
| **Entry** | Sidebar → CRM → Customers |
| **Layout** | **Toolbar:** Title "CRM Customers" + Add Customer button. **Main content:** Search bar → Customer cards/table (name, email, phone, address, notes, status badge). **Dialogs:** Create/Edit Customer dialog (name, email, phone, address, city, state, postalCode, country, notes) |
| **Actions** | Add Customer, Search, Edit, Archive, row click → detail |
| **Dialogs/Modals** | Customer form dialog (Create/Edit) |
| **Data displayed** | Customer list with contact info and status |
| **Filters/Searches** | Search by name/email/phone |
| **Exit points** | Row click → `/crm/customers/:id` |
| **Related screens** | CRM Customer Detail |

### 3.3 CRM Customer Detail

| Field | Value |
|---|---|
| **Route** | `/crm/customers/:id` |
| **Component** | `CrmCustomerDetailPage` |
| **Entry** | Click customer row in CRM Customers list or CRM Dashboard |
| **Layout** | Back button, customer name + status badge, 3 stat cards (Total Sales, Total Spent, Last Purchase). **Tabs:** Info (contact details grid), Sales (sales history table with sale#, total, payment method, status, items, date), Notes (notes list + add note form), Vehicles (vehicle list + add vehicle dialog with brand/model/year/engine/VIN), Credit (credit account info + transactions), Communications (add communication form + history table), Timeline (activity log) |
| **Actions** | Back to list, add vehicle (dialog), add note, add communication, create credit account, add credit transaction |
| **Dialogs/Modals** | Add Vehicle dialog (brand, model, generation, engine, year, VIN, license plate, color, notes) |
| **Data displayed** | Customer info, sales history, notes, vehicles, credit account, communications, timeline |
| **Related screens** | CRM Customers, CRM Vehicles, CRM Credit, CRM Notes |

### 3.4 CRM Vehicles

| Field | Value |
|---|---|
| **Route** | `/crm/vehicles` |
| **Component** | `CrmVehiclesPage` |
| **Entry** | Sidebar → CRM → Vehicles |
| **Layout** | **Toolbar:** "Vehicle Reference Data" title + Add Brand/Add Model buttons. **Main content:** Search → Expandable brand list. Each brand has Accordion-style expansion showing models. Dialogs for adding brands (name, description, country) and models (name) |
| **Actions** | Add Brand (dialog), Add Model (dialog), search |
| **Dialogs/Modals** | Brand form dialog, Model form dialog |
| **Data displayed** | Vehicle brands with expandable model lists |
| **Filters/Searches** | Search by brand name |
| **Related screens** | CRM Compatibility, Vehicles (standalone page) |

### 3.5 CRM Compatibility

| Field | Value |
|---|---|
| **Route** | `/crm/compatibility` |
| **Component** | `CrmCompatibilityPage` |
| **Entry** | Sidebar → CRM → Compatibility |
| **Layout** | **Toolbar:** "Vehicle Compatibility" title. **Main content:** 4-level cascading selectors (Brand → Model → Year → Engine) + text search → Compatible products results grid (product name, SKU, price, stock badge, compatibility notes). Also "Find by Product" section to search products and see compatible vehicles |
| **Actions** | Search, filter, view product detail |
| **Data displayed** | Compatible products for selected vehicle, or compatible vehicles for selected product |
| **Filters/Searches** | Brand, Model, Year, Engine dropdowns cascading; text search |
| **Related screens** | CRM Vehicles, Inventory Products |

### 3.6 CRM Reminders

| Field | Value |
|---|---|
| **Route** | `/crm/reminders` |
| **Component** | `CrmRemindersPage` |
| **Entry** | Sidebar → CRM → Reminders |
| **Layout** | **Toolbar:** "Service Reminders" title + New Reminder button. **Main content:** Status filter tabs → Reminder list table (customer, title, type, due date, due mileage, status badge, actions). **Dialog:** Create/Edit reminder form (customer search, title, type select: oil_change/tire_rotation/brake_inspection/etc., description, due date, due mileage, notes) |
| **Actions** | New Reminder, mark complete/dismiss, filter by status |
| **Dialogs/Modals** | Reminder form dialog |
| **Data displayed** | Service reminders with status, due date/mileage |
| **Filters/Searches** | Status filter (pending/completed/dismissed/all) |
| **Related screens** | CRM Dashboard, Customers |

### 3.7 CRM Warranties

| Field | Value |
|---|---|
| **Route** | `/crm/warranties` |
| **Component** | `CrmWarrantiesPage` |
| **Entry** | Sidebar → CRM → Warranties |
| **Layout** | **Toolbar:** "Warranties" title + New Warranty button. **Main content:** Status filter → Warranty list table (customer, product, type, period, start/end date, status badge). **Dialog:** Create warranty form (customer search, product search, warranty type: standard/extended/manufacturer, period in months, start date, notes) |
| **Actions** | New Warranty, filter by status |
| **Dialogs/Modals** | Warranty form dialog |
| **Data displayed** | Warranty records with status |
| **Filters/Searches** | Status filter |
| **Related screens** | CRM Dashboard, Products |

### 3.8 CRM Credit

| Field | Value |
|---|---|
| **Route** | `/crm/credit` |
| **Component** | `CrmCreditPage` |
| **Entry** | Sidebar → CRM → Credit |
| **Layout** | **Toolbar:** "Credit Accounts" title. **Main content:** Summary stat cards (Total Credit Extended, Total Outstanding, Available Credit, At-Risk Accounts). Credit accounts table (customer name, credit limit, current balance, available, utilization %) |
| **Actions** | Row click navigates to customer detail (credit tab) |
| **Data displayed** | All credit accounts with balances and risk indicators |
| **Related screens** | CRM Customer Detail (Credit tab), Customers |

### 3.9 CRM Notes

| Field | Value |
|---|---|
| **Route** | `/crm/notes` |
| **Component** | `CrmNotesPage` |
| **Entry** | Sidebar → CRM → Notes |
| **Layout** | **Toolbar:** "Customer Notes" title. **Main content:** Search bar + Type filter → Notes list (customer name, type badge, title, content preview, created by, date) |
| **Data displayed** | All customer notes aggregated across customers |
| **Filters/Searches** | Search by content, filter by note type |
| **Related screens** | CRM Customer Detail (Notes tab) |

---

## 4. Inventory

### 4.1 Inventory Dashboard

| Field | Value |
|---|---|
| **Route** | `/inventory` |
| **Component** | `InventoryDashboardPage` |
| **Entry** | Sidebar → Inventory |
| **Layout** | **Toolbar:** "Inventory Dashboard" title + description. **Main content:** 8 stat cards grid (Total Products, Active Products, Inactive Products, Inventory Value, Total Categories, Total Brands, Total Suppliers, Total Warehouses) |
| **Actions** | None (overview only) |
| **Data displayed** | Inventory summary statistics |
| **Exit points** | Sidebar submenu items |
| **Related screens** | All inventory sub-pages |

### 4.2 Categories List

| Field | Value |
|---|---|
| **Route** | `/inventory/categories` |
| **Component** | `CategoriesPage` |
| **Entry** | Sidebar → Inventory → Categories |
| **Layout** | **EntityListPage** with title/description + New Category button. DataTable (id, name, description, isActive badge, actions) |
| **Actions** | New Category (→ `/inventory/categories/new`), Edit (→ `/:id/edit`), view |
| **Data displayed** | Category list |
| **Exit points** | New/Edit → form pages |
| **Related screens** | Category Form |

### 4.3 Category Form

| Field | Value |
|---|---|
| **Route** | `/inventory/categories/new` or `/inventory/categories/:id/edit` |
| **Component** | `CategoryFormPage` |
| **Entry** | Click New or Edit in Categories list |
| **Layout** | **EntityFormPage** with back button + title, max-w-2xl form container. Fields: Name, Description, Is Active switch |
| **Exit points** | Save → redirect to list, Back → list |

### 4.4 Brands List

| Field | Value |
|---|---|
| **Route** | `/inventory/brands` |
| **Component** | `BrandsPage` |
| **Entry** | Sidebar → Inventory → Brands |
| **Layout** | **EntityListPage** + DataTable (id, name, description, isActive) |
| **Actions** | New Brand, Edit |
| **Related screens** | Brand Form |

### 4.5 Brand Form

| Route | `/inventory/brands/new` or `/inventory/brands/:id/edit` |
|---|---|
| **Component** | `BrandFormPage` |
| **Layout** | EntityFormPage with Name, Description, Is Active |
| **Exit** | Save → list |

### 4.6 Manufacturers List

| Route | `/inventory/manufacturers` |
|---|---|
| **Component** | `ManufacturersPage` |
| **Entry** | Sidebar → Inventory → Manufacturers |
| **Layout** | EntityListPage + DataTable (id, name, description, isActive, country) |
| **Actions** | New Manufacturer, Edit |
| **Related screens** | Manufacturer Form |

### 4.7 Manufacturer Form

| Route | `/inventory/manufacturers/new` or `/inventory/manufacturers/:id/edit` |
|---|---|
| **Component** | `ManufacturerFormPage` |
| **Layout** | EntityFormPage with Name, Description, Country, Is Active |

### 4.8 Inventory Suppliers List

| Route | `/inventory/suppliers` |
|---|---|
| **Component** | `InventorySuppliersPage` (aliased from `SuppliersPage` in inventory feature) |
| **Entry** | Sidebar → Inventory → Suppliers |
| **Layout** | EntityListPage + DataTable (id, companyName, contactName, email, phone, isActive) |
| **Actions** | New Supplier, Edit |
| **Related screens** | Supplier Form |

### 4.9 Inventory Supplier Form

| Route | `/inventory/suppliers/new` or `/inventory/suppliers/:id/edit` |
|---|---|
| **Component** | `SupplierFormPage` |
| **Layout** | EntityFormPage with Company Name, Contact Name, Email, Phone, Address, City, State, Postal Code, Country, Notes, Is Active |

### 4.10 Warehouses List

| Route | `/inventory/warehouses` |
|---|---|
| **Component** | `WarehousesPage` |
| **Entry** | Sidebar → Inventory → Warehouses |
| **Layout** | EntityListPage + DataTable (id, name, code, address, city, isActive) |
| **Actions** | New Warehouse, Edit |
| **Related screens** | Warehouse Form |

### 4.11 Warehouse Form

| Route | `/inventory/warehouses/new` or `/inventory/warehouses/:id/edit` |
|---|---|
| **Component** | `WarehouseFormPage` |
| **Layout** | EntityFormPage with Name, Code, Address, City, State, Country, Is Active |

### 4.12 Storage Locations List

| Route | `/inventory/storage-locations` |
|---|---|
| **Component** | `StorageLocationsPage` |
| **Entry** | Sidebar → Inventory → Storage Locations |
| **Layout** | EntityListPage + DataTable (id, code, zone, warehouse name, isActive) |
| **Actions** | New Storage Location, Edit |
| **Related screens** | Storage Location Form |

### 4.13 Storage Location Form

| Route | `/inventory/storage-locations/new` or `/inventory/storage-locations/:id/edit` |
|---|---|
| **Component** | `StorageLocationFormPage` |
| **Layout** | EntityFormPage with Code, Zone, Warehouse (select), Description, Is Active |

### 4.14 Products List

| Field | Value |
|---|---|
| **Route** | `/inventory/products` |
| **Component** | `ProductsPage` |
| **Entry** | Sidebar → Inventory → Products |
| **Layout** | **EntityListPage** with title "Products" + Add Product button. DataTable: Name, SKU, Barcode, Cost Price, Sale Price, Stock Quantity (badge with color: default/≤min/destructive), Status (active/inactive badge). Pagination, search, refresh. Row click → detail. Row actions: View, Edit |
| **Actions** | Add Product (`/inventory/products/new`), Search, Paginate, Row click → detail, Edit |
| **Data displayed** | Product list with pricing, stock levels |
| **Filters/Searches** | Search by name/SKU/barcode |
| **Exit points** | Row click → `/inventory/products/:id`, Add → `/inventory/products/new` |
| **Related screens** | Product Form, Product Detail |

### 4.15 Product Form

| Field | Value |
|---|---|
| **Route** | `/inventory/products/new` or `/inventory/products/:id/edit` |
| **Component** | `ProductFormPage` |
| **Entry** | Add/Edit product in Products list |
| **Layout** | **EntityFormPage** with back button, max-w-2xl form. **Sections:** Basic Info (name, SKU, barcode, OEM#, internal code, description), Category/Brand/Manufacturer/Supplier (selects), Pricing (cost, sale, wholesale, MSRP, tax rate), Stock (quantity, min, max, reorder point, unit, weight), Location (warehouse, storage location selects with cascading), Image URL. **Edit mode only:** Product Images section (list + add/remove), Vehicle Compatibility section (add/remove compat entries with brand/model/year/engine/transmission). **Bottom:** EntityActionBar with Save button |
| **Actions** | Save (create or update), add image, remove image, add compatibility, remove compatibility |
| **Data displayed** | Product form fields, images list, compatibility list |
| **Exit points** | Save → redirect to `/inventory/products` |
| **Related screens** | Products List, Product Detail |

### 4.16 Product Detail

| Field | Value |
|---|---|
| **Route** | `/inventory/products/:id` |
| **Component** | `ProductDetailPage` |
| **Entry** | Click product row in Products list |
| **Layout** | **EntityDetailPage** with back button + Edit button. **Info cards (2-column grids):** General Info (name, SKU, barcode, OEM#, internal code, description, category, brand, manufacturer, supplier, status, discontinued), Pricing (cost, sale, wholesale, MSRP, tax rate), Stock (quantity, min, max, reorder point, unit, weight, warehouse, storage location), Product Images (image list with primary badge), Vehicle Compatibility (compatible vehicles table) |
| **Actions** | Back to list, Edit (→ `/:id/edit`) |
| **Data displayed** | All product fields, images, compatibility entries |
| **Exit points** | Edit → form, Back → list |
| **Related screens** | Products List, Product Form |

### 4.17 Inventory Movements List

| Field | Value |
|---|---|
| **Route** | `/inventory/movements` |
| **Component** | `InventoryMovementsPage` |
| **Entry** | Sidebar → Inventory → Inventory Movements |
| **Layout** | **EntityListPage** + New Movement button. DataTable: ID, Product ID, Type badge (in/out/adjustment), Quantity, Reference, Notes, Created By, Created At |
| **Actions** | New Movement (→ `/inventory/movements/new`) |
| **Data displayed** | Movement history log |
| **Related screens** | Movement Form |

### 4.18 Inventory Movement Form

| Route | `/inventory/movements/new` |
|---|---|
| **Component** | `InventoryMovementFormPage` |
| **Entry** | Click New Movement |
| **Layout** | EntityFormPage. Fields: Product (search/select), Type (in/out/adjustment), Quantity, Reference (optional), Notes (optional) |

---

## 5. Sales

### 5.1 Sales History

| Field | Value |
|---|---|
| **Route** | `/sales` |
| **Component** | `SalesPage` |
| **Entry** | Sidebar → Sales → Sales History |
| **Layout** | **Toolbar:** "Sales History" title + New Sale button. **Top:** 4 StatCards (Today's Sales, Monthly Total, Average Ticket, Pending Payments). **Main content:** Search bar → DataTable: Sale #, Customer, Total, Payment Method, Status badge, Items count, Date. Row actions: View. Pagination |
| **Actions** | New Sale (`/sales/new`), Search, Paginate, Row click → detail, Filters (date range, status) |
| **Data displayed** | Sale list with summary stats |
| **Filters/Searches** | Search by sale#/customer |
| **Exit points** | Row click → `/sales/:id`, New Sale → `/sales/new` |
| **Related screens** | POS, Sale Detail, Closeout |

### 5.2 POS / New Sale

| Field | Value |
|---|---|
| **Route** | `/sales/new` |
| **Component** | `PosPage` |
| **Entry** | Sidebar → Sales → Point of Sale, or New Sale button in Sales History |
| **Layout** | **Toolbar:** "New Sale" title + Cancel button + keyboard shortcuts hint. **Two-column layout (xl: 4-col grid):** Left 2/3: Product search bar → Product cards grid (name, SKU, price, stock badge, tax rate). Right 1/3: Cart section (cart items list with +/- qty, remove, line total), Totals (subtotal, tax, discount input with %), Customer search/select, Payment methods (cash/card/transfer rows with amount inputs, reference for transfer), Notes textarea, Complete Sale button (shows total). Keyboard: Esc clears search |
| **Actions** | Search products, Add to cart, Adjust quantity, Remove from cart, Set discount %, Select customer, Add/remove payment methods, Complete Sale (checkout) |
| **Dialogs/Modals** | None inline (customer searched via CustomerSearchField component) |
| **Data displayed** | Searchable products, cart items, totals, payments |
| **Exit points** | Complete → `/sales/:id`, Cancel → `/sales` |
| **Related screens** | Sales History, Sale Detail |

### 5.3 Sale Detail

| Field | Value |
|---|---|
| **Route** | `/sales/:id` |
| **Component** | `SaleDetailPage` |
| **Entry** | Click sale row in Sales History or after POS checkout |
| **Layout** | Back button. **Header:** Sale #, date, status badges. **Tabs:** Items (line items table), Payments (payment rows with method/amount/reference/status), Receipts (receipt list with print status). **Bottom action bar:** Print Receipt, Refund (with reason textarea + confirm), Mark as Paid |
| **Actions** | Back to sales, Print Receipt, Refund (with dialog), change payment status |
| **Dialogs/Modals** | Refund confirmation dialog |
| **Data displayed** | Sale header, line items, payments, receipts |
| **Exit points** | Back to Sales History |
| **Related screens** | Sales History, POS, Receipts |

### 5.4 Daily Closeout

| Field | Value |
|---|---|
| **Route** | `/sales/closeout` |
| **Component** | `CloseoutPage` |
| **Entry** | Sidebar → Sales → Daily Closeout |
| **Layout** | **Toolbar:** "Daily Closeout" title. **Top:** StatCards (Total Sales, Total Transactions, Average Ticket, Cash in Drawer). **Main content:** Summary cards: Sales by Payment Method (cash/card/transfer totals), Discounts given, Returns processed, Taxes collected. **History section:** Previous closings table (date, total sales, total cash, closed by, status). **Action:** Close Shift button |
| **Actions** | Close Shift (ends current day, locks register), View previous closings |
| **Data displayed** | Current shift summary, closing history |
| **Related screens** | Cash Register, Sales History |

### 5.5 Quotes List

| Field | Value |
|---|---|
| **Route** | `/sales/quotes` |
| **Component** | `QuotesPage` |
| **Entry** | Sidebar → Sales → Quotes |
| **Layout** | **Toolbar:** "Quotes" title + New Quote button. DataTable: Quote #, Customer, Total, Status badge (draft/sent/accepted/rejected/expired/converted), Valid until, Date. Row actions: View, Delete. Status color badges |
| **Actions** | New Quote, View, Delete, status change |
| **Data displayed** | Quote list |
| **Exit points** | Row click → `/sales/quotes/:id`, New → `/sales/quotes/new` |
| **Related screens** | Quote Form, Quote Detail |

### 5.6 Quote Form

| Field | Value |
|---|---|
| **Route** | `/sales/quotes/new` or `/sales/quotes/:id/edit` |
| **Component** | `QuoteFormPage` |
| **Entry** | New/Edit Quote |
| **Layout** | **Toolbar:** "New Quote" / "Edit Quote". **Form:** Customer search/select, line items table (product search → add → quantity/price/discount/total), tax rate input, notes textarea. Save button |
| **Actions** | Search and add products, remove line items, save quote |
| **Data displayed** | Customer, line items, totals |
| **Exit points** | Save → `/sales/quotes` |
| **Related screens** | Quotes List, Quote Detail |

### 5.7 Quote Detail

| Route | `/sales/quotes/:id` |
|---|---|
| **Component** | `QuoteDetailPage` |
| **Entry** | Click quote row in Quotes list |
| **Layout** | EntityDetailPage-style: Back button + Edit button + Convert to Sale button. Quote header info (#, customer, date, valid until, status). Line items table. Totals. Actions: Convert to Sale (creates a sale from quote), Edit, Delete |
| **Actions** | Convert to Sale, Edit, Delete |
| **Data displayed** | Quote details with line items |
| **Exit points** | Convert → `/sales/:id` (new sale), Edit → form |
| **Related screens** | Quotes List, Quote Form, Sale Detail |

### 5.8 Returns

| Field | Value |
|---|---|
| **Route** | `/sales/returns` |
| **Component** | `ReturnsPage` |
| **Entry** | Sidebar → Sales → Returns |
| **Layout** | **Toolbar:** "Returns" title. **Top:** Summary stat cards. **Main content:** Search sales → sale results table → select sale → refund dialog. **Dialog:** Refund confirmation with reason textarea |
| **Actions** | Search sale by number, process refund |
| **Dialogs/Modals** | Refund dialog (reason, confirm) |
| **Data displayed** | Sale search results, refund confirmation |
| **Related screens** | Sales History, Sale Detail |

### 5.9 Cash Register

| Field | Value |
|---|---|
| **Route** | `/sales/register` |
| **Component** | `CashRegisterPage` |
| **Entry** | Sidebar → Sales → Cash Register |
| **Layout** | **Toolbar:** "Cash Register" title. **Top:** Active session status card (opened at, initial balance, current cash, status). **Main content:** Open/Close Register form (initial balance field for open, final balance + notes for close). Sessions history DataTable (opened at, closed at, initial balance, final balance, expected, difference, status) |
| **Actions** | Open Register (with initial balance), Close Register (with final balance + notes), view session history |
| **Dialogs/Modals** | Open/Close confirmation |
| **Data displayed** | Active session, session history |
| **Related screens** | Closeout, Sales History |

### 5.10 Receipts

| Field | Value |
|---|---|
| **Route** | `/sales/receipts` |
| **Component** | `ReceiptsPage` |
| **Entry** | Sidebar → Sales → Receipts |
| **Layout** | **Toolbar:** "Receipts" title. DataTable: Sale #, Receipt count per sale, last printed date, status. Actions to mark as printed |
| **Actions** | Mark receipt as printed |
| **Data displayed** | Sales with receipt status |
| **Related screens** | Sale Detail |

---

## 6. Purchases

### 6.1 Purchases Dashboard

| Field | Value |
|---|---|
| **Route** | `/purchases` |
| **Component** | `PurchasesPage` |
| **Entry** | Sidebar → Purchases |
| **Layout** | Dashboard with stat cards (total POs, pending receipts, monthly spend, avg cost). Recent purchase orders list. Quick action buttons |
| **Actions** | New Purchase Order |
| **Related screens** | All purchases sub-pages |

### 6.2 Purchase Orders List

| Field | Value |
|---|---|
| **Route** | `/purchases/orders` |
| **Component** | `PurchaseOrdersPage` |
| **Entry** | Sidebar → Purchases → Orders |
| **Layout** | **Toolbar:** "Purchase Orders" title + New PO button. DataTable: PO#, Supplier, Order Date, Status badge (draft/pending/sent/partially_received/received/cancelled), Total, Items count, Expected Date |
| **Actions** | New PO, View, Edit |
| **Exit points** | Row click → `/purchases/orders/:id`, New → `/purchases/orders/new` |
| **Related screens** | PO Form, PO Detail |

### 6.3 Purchase Order Form

| Field | Value |
|---|---|
| **Route** | `/purchases/orders/new` or `/purchases/orders/:id/edit` |
| **Component** | `PurchaseOrderFormPage` |
| **Entry** | New/Edit Purchase Order |
| **Layout** | **Toolbar:** "New Purchase Order" / "Edit Purchase Order". **Form:** Supplier select, Warehouse select, Order date, Expected date, Status select. Line items section: product search → add row → quantity, unit cost, discount, tax, total. Notes textarea. Save button |
| **Actions** | Search and add products, remove items, save |
| **Data displayed** | Supplier info, line items, totals |
| **Exit points** | Save → `/purchases/orders` |
| **Related screens** | Orders List, PO Detail |

### 6.4 Purchase Order Detail

| Field | Value |
|---|---|
| **Route** | `/purchases/orders/:id` |
| **Component** | `PurchaseOrderDetailPage` |
| **Entry** | Click PO row in Orders list |
| **Layout** | Back button. PO header (#, supplier, warehouse, date, status badge). Line items table (product, ordered qty, received qty, damaged qty, unit cost, total). Totals section. Actions: Edit, Send to Supplier (mark sent), Receive (partial/full), Cancel |
| **Actions** | Edit, Send, Receive, Cancel, Create Receipt |
| **Exit points** | Back to orders list, Receive → Update + stock adjustment |
| **Related screens** | Orders List, PO Form, Purchase Receipts |

### 6.5 Purchase Requests

| Field | Value |
|---|---|
| **Route** | `/purchases/requests` |
| **Component** | `PurchaseRequestsPage` |
| **Entry** | Sidebar → Purchases → Requests |
| **Layout** | List of purchase requests with status (pending/approved/rejected). Form to create request. Approval workflow (approve/reject) |
| **Actions** | New Request, Approve, Reject |
| **Related screens** | Purchase Orders |

### 6.6 Purchase Receipts List

| Field | Value |
|---|---|
| **Route** | `/purchases/receipts` |
| **Component** | `PurchaseReceiptsPage` |
| **Entry** | Sidebar → Purchases → Receipts |
| **Layout** | DataTable: Receipt#, PO#, Supplier, Date, Total items, Received by, Status |
| **Actions** | View receipt |
| **Related screens** | Purchase Receipt Detail |

### 6.7 Purchase Receipt Detail

| Route | `/purchases/receipts/:id` |
|---|---|
| **Component** | `PurchaseReceiptDetailPage` |
| **Entry** | Click receipt row |
| **Layout** | Back button. Receipt header (PO#, supplier, warehouse, date, received by). Items table (product, ordered, received, damaged, accepted). Status |

### 6.8 Purchase Returns

| Route | `/purchases/returns` |
|---|---|
| **Component** | `PurchaseReturnsPage` |
| **Entry** | Sidebar → Purchases → Returns |
| **Layout** | List of returns to suppliers. Form to create return referencing a PO or receipt. Reason, items, quantities |

### 6.9 Supplier Products

| Route | `/purchases/supplier-products` |
|---|---|
| **Component** | `SupplierProductsPage` |
| **Entry** | Sidebar → Purchases → Supplier Products |
| **Layout** | View/edit supplier-specific product catalog. Supplier select → products list with supplier SKU, cost, lead time, MOQ |

### 6.10 Cost History

| Route | `/purchases/cost-history` |
|---|---|
| **Component** | `CostHistoryPage` |
| **Entry** | Sidebar → Purchases → Cost History |
| **Layout** | Product search → cost history table (date, supplier, cost, quantity, reference). Chart of cost over time |

### 6.11 Reorder Suggestions

| Route | `/purchases/reorder-suggestions` |
|---|---|
| **Component** | `ReorderSuggestionsPage` |
| **Entry** | Sidebar → Purchases → Reorder Suggestions |
| **Layout** | Products below reorder point. Table: Product, Current Stock, Reorder Point, Suggested Qty, Preferred Supplier. Generate PO button for selected items |

---

## 7. Customers

### 7.1 Customers List

| Field | Value |
|---|---|
| **Route** | `/customers` |
| **Component** | `CustomersPage` |
| **Entry** | Sidebar → Customers |
| **Layout** | **Toolbar:** "Customers" title + Add Customer button + Search. **Main content:** Customer cards/list with name, email, phone, address, status. **Dialog:** Create/Edit customer form (name, email, phone, address, city, state, postalCode, country, notes) |
| **Actions** | Add Customer, Edit, Archive, Search |
| **Dialogs/Modals** | Customer form dialog |
| **Data displayed** | Customer list |
| **Exit points** | Row click → `/customers/:id` |
| **Related screens** | Customer Detail |

### 7.2 Customer Detail

| Field | Value |
|---|---|
| **Route** | `/customers/:id` |
| **Component** | `CustomerDetailPage` |
| **Entry** | Click customer in Customers list |
| **Layout** | Back button. Customer name + status badge. 3 stat cards (Total Sales, Total Spent, Last Purchase). **Tabs:** Info (contact details grid), Sales History (table), Credit Account (create/view/add transactions), Communications (log + add form) |
| **Actions** | Back, create credit account, add transaction, add communication |
| **Dialogs/Modals** | None (inline forms) |
| **Data displayed** | Full customer profile |
| **Exit points** | Back to Customers list |
| **Related screens** | Customers List |

---

## 8. Suppliers

### 8.1 Suppliers List

| Field | Value |
|---|---|
| **Route** | `/suppliers` |
| **Component** | `SuppliersPage` |
| **Entry** | Sidebar → Suppliers |
| **Layout** | **Toolbar:** "Suppliers" title + Add Supplier button + Export button + Search. **Main content:** Supplier cards table (name, contact, phone, email, products count, status badge) |
| **Actions** | Add Supplier (disabled for now), Export, Search |
| **Data displayed** | Supplier list |
| **Related screens** | Inventory Suppliers |

---

## 9. Vehicles

### 9.1 Vehicles List

| Field | Value |
|---|---|
| **Route** | `/vehicles` |
| **Component** | `VehiclesPage` (from features/vehicles) |
| **Entry** | Sidebar → Vehicles (standalone) |
| **Layout** | **Toolbar:** "Vehicles" title + Export + Add Vehicle buttons (both disabled). **Top:** 3 stat cards (Total Vehicles, Service Records, Makes Covered — all showing "—"). **Main content:** EmptyState with "Coming Soon" title and planned features list |
| **Actions** | Add Vehicle (disabled), Export (disabled) |
| **Data displayed** | Placeholder stats, coming soon message |
| **Note** | This is a separate page from CRM Vehicles; mostly placeholder |
| **Related screens** | CRM Vehicles |

---

## 10. Warehouse

### 10.1 Warehouse Dashboard

| Field | Value |
|---|---|
| **Route** | `/warehouse` |
| **Component** | `WarehousePage` |
| **Entry** | Sidebar → Warehouse |
| **Layout** | **Toolbar:** "Warehouse" title + Export + Add Location buttons (disabled). **Top:** 4 stat cards (Locations, Bins Used, Capacity, Transfers Today — all "—"). **Main content:** EmptyState "Coming Soon" + planned features list |
| **Actions** | Add Location (disabled), Export (disabled) |
| **Data displayed** | Placeholder stats, coming soon message |
| **Note** | Warehouse module is still in planning; basic placeholder |
| **Related screens** | Inventory Warehouses |

---

## 11. Reports

### 11.1 Executive Dashboard (Reports Home)

| Field | Value |
|---|---|
| **Route** | `/reports` |
| **Component** | `ReportsPage` |
| **Entry** | Sidebar → Reports |
| **Layout** | **Toolbar:** "Reports" title. **Top:** Stat cards (Total Revenue, Avg Order Value, etc.). **Main content:** Chart cards (Line, Bar, Area, Pie, Stacked Bar) using report-charts components. Report tables. Date range filter |
| **Actions** | Date filter, refresh |
| **Data displayed** | Dashboard widgets, chart data |
| **Related screens** | All report sub-pages |

### 11.2 Sales Reports

| Route | `/reports/sales` |
|---|---|
| **Component** | `ReportsSalesPage` |
| **Entry** | Sidebar → Reports → Sales |
| **Layout** | PageHeader + ReportFilters (date range, payment method, warehouse, category, brand) + Tabs: Overview (stat cards + charts), By Cashier, By Payment Method, Discounts, Returns, Tax Summary. Tables with export |
| **Actions** | Apply filters, export to CSV/Excel |
| **Related screens** | Sales History |

### 11.3 Inventory Reports

| Route | `/reports/inventory` |
|---|---|
| **Component** | `ReportsInventoryPage` |
| **Entry** | Sidebar → Reports → Inventory |
| **Layout** | Filters + tabs: Stock Levels, Stock Value, Low Stock, Inactive Products, Movement Summary. Tables + charts |

### 11.4 Purchasing Reports

| Route | `/reports/purchasing` |
|---|---|
| **Component** | `ReportsPurchasingPage` |
| **Entry** | Sidebar → Reports → Purchasing |
| **Layout** | Filters + tabs: PO Summary, Supplier Performance, Cost Analysis, Lead Times |

### 11.5 Customer Reports

| Route | `/reports/customers` |
|---|---|
| **Component** | `ReportsCustomersPage` |
| **Entry** | Sidebar → Reports → Customers |
| **Layout** | Filters + tabs: Top Customers, Customer Activity, Credit Analysis, New vs Returning |

### 11.6 Supplier Reports

| Route | `/reports/suppliers` |
|---|---|
| **Component** | `ReportsSuppliersPage` |
| **Entry** | Sidebar → Reports → Suppliers |
| **Layout** | Filters + tabs: Supplier Performance, On-Time Delivery, Pricing Trends |

### 11.7 Warehouse Reports

| Route | `/reports/warehouses` |
|---|---|
| **Component** | `ReportsWarehousesPage` |
| **Entry** | Sidebar → Reports → Warehouses |
| **Layout** | Filters + tabs: Capacity Utilization, Stock Distribution, Movement Frequency |

### 11.8 Profitability Reports

| Route | `/reports/profitability` |
|---|---|
| **Component** | `ReportsProfitabilityPage` |
| **Entry** | Sidebar → Reports → Profitability |
| **Layout** | Filters (date range, category, brand) + stat cards (Gross Profit, Net Profit, Margin %) + charts (monthly profit trend, profit by category) + tables |

### 11.9 KPI Reports

| Route | `/reports/kpis` |
|---|---|
| **Component** | `ReportsKpiPage` |
| **Entry** | Sidebar → Reports → KPIs |
| **Layout** | KPI cards grid: Revenue per employee, Orders per day, Stock Turnover Ratio, Sell-Through Rate, Avg Margin, Customer Lifetime Value |

### 11.10 Custom Reports

| Route | `/reports/custom` |
|---|---|
| **Component** | `ReportsCustomPage` |
| **Entry** | Sidebar → Reports → Custom Reports |
| **Layout** | List of saved custom reports. Create new: SQL query builder or column/table selector. Save, run, export |

### 11.11 Scheduled Reports

| Route | `/reports/scheduled` |
|---|---|
| **Component** | `ReportsScheduledPage` |
| **Entry** | Sidebar → Reports → Scheduled Reports |
| **Layout** | List of scheduled reports with frequency (daily/weekly/monthly), recipients, format. Create schedule form |

### 11.12 Exports

| Route | `/reports/exports` |
|---|---|
| **Component** | `ReportsExportsPage` |
| **Entry** | Sidebar → Reports → Exports |
| **Layout** | Export history table (date, report type, format, status, download). Export generator: select report type, format (PDF/CSV/Excel), date range, generate |

---

## 12. Admin

### 12.1 Admin Dashboard

| Field | Value |
|---|---|
| **Route** | `/admin` |
| **Component** | `AdminDashboardPage` |
| **Entry** | Sidebar → Admin |
| **Layout** | **Toolbar:** "Admin Dashboard" title. **Main content:** 8 stat cards (Active Users, Total Users, Database Size, Connected Printers, Recent Logins, Recent Errors, Audit Events Today, Storage Usage). Recent activity log |
| **Actions** | Navigate to sub-pages |
| **Data displayed** | System overview statistics |
| **Related screens** | All admin sub-pages |

### 12.2 Users List

| Route | `/admin/users` |
|---|---|
| **Component** | `AdminUsersPage` |
| **Entry** | Sidebar → Admin → Users |
| **Layout** | "Users" title + Add User button. Search bar. Table: Name, Email, Role, Status (active/inactive/locked), Last Login. Row actions: Edit, Lock/Unlock, Archive/Restore, Reset Password |
| **Actions** | Add User, Edit, Lock/Unlock, Archive/Restore, Reset Password |
| **Exit points** | Add/Edit → `/admin/users/new` or `/:id/edit` |
| **Related screens** | User Form |

### 12.3 User Form

| Route | `/admin/users/new` or `/admin/users/:id/edit` |
|---|---|
| **Component** | `AdminUserFormPage` |
| **Layout** | Form: Full name, Email, Username, Password (new only), Role (select), Is Active switch |

### 12.4 Roles List

| Route | `/admin/roles` |
|---|---|
| **Component** | `AdminRolesPage` |
| **Entry** | Sidebar → Admin → Roles |
| **Layout** | "Roles" title + Add Role button. Table: Name, Description, Users count, Is System Role. Actions: Edit, Duplicate |
| **Related screens** | Role Form |

### 12.5 Role Form

| Route | `/admin/roles/new` or `/admin/roles/:id/edit` |
|---|---|
| **Component** | `AdminRoleFormPage` |
| **Layout** | Form: Name, Description. Permissions tree: grouped by module with checkboxes (create/read/update/delete/export per entity) |

### 12.6 Settings (Admin)

| Route | `/admin/settings` |
|---|---|
| **Component** | `AdminSettingsPage` |
| **Entry** | Sidebar → Admin → Settings |
| **Layout** | Category sidebar (General, Store, Localization, Theme, Security, Inventory, Sales, Purchasing, CRM, Reports, Printing, Database, Backup, Updates, Performance, Advanced) + settings form (key-value pairs with appropriate inputs: text, number, boolean switches, selects). Save button per category |

### 12.7 Printers

| Route | `/admin/printers` |
|---|---|
| **Component** | `AdminPrintersPage` |
| **Entry** | Sidebar → Admin → Printers |
| **Layout** | List of configured printers (name, type, interface, status). Add/Edit/Test/Delete printer |

### 12.8 Devices

| Route | `/admin/devices` |
|---|---|
| **Component** | `AdminDevicesPage` |
| **Entry** | Sidebar → Admin → Devices |
| **Layout** | List of registered devices (name, type, last seen, status). Barcode scanner configuration |

### 12.9 Backups

| Route | `/admin/backups` |
|---|---|
| **Component** | `AdminBackupsPage` |
| **Entry** | Sidebar → Admin → Backups |
| **Layout** | **Toolbar:** "Backups" title + Create Backup button. **Top:** Stat cards (Total Backups, Total Size, Last Backup). **Main content:** Backups table (id, date, type [manual/automatic/scheduled], size, status, created by). Actions: Download, Delete |
| **Actions** | Create Backup, Download, Delete |
| **Related screens** | Restore |

### 12.10 Restore

| Route | `/admin/restore` |
|---|---|
| **Component** | `AdminRestorePage` |
| **Entry** | Sidebar → Admin → Restore |
| **Layout** | File upload/select from backup list. Restore confirmation with warning. Progress indicator |

### 12.11 Database

| Route | `/admin/database` |
|---|---|
| **Component** | `AdminDatabasePage` |
| **Entry** | Sidebar → Admin → Database |
| **Layout** | Database info (type, version, size, connection status). Maintenance actions: Vacuum, Analyze, Reindex, Run Migrations |

### 12.12 Diagnostics

| Route | `/admin/diagnostics` |
|---|---|
| **Component** | `AdminDiagnosticsPage` |
| **Entry** | Sidebar → Admin → Diagnostics |
| **Layout** | System health checks: Database connection, File system permissions, Network connectivity, Printer status, Memory usage, CPU load. Status badges (pass/warning/fail). Run All button |

### 12.13 Audit Log

| Route | `/admin/audit` |
|---|---|
| **Component** | `AdminAuditPage` |
| **Entry** | Sidebar → Admin → Audit |
| **Layout** | Audit log DataTable: Timestamp, User, Action, Entity Type, Entity ID, Details, IP Address. Filters by date range, user, action type |

### 12.14 Updates

| Route | `/admin/updates` |
|---|---|
| **Component** | `AdminUpdatesPage` |
| **Entry** | Sidebar → Admin → Updates |
| **Layout** | Current version info. Check for updates button. Update history. Release notes viewer |

### 12.15 Licensing

| Route | `/admin/licensing` |
|---|---|
| **Component** | `AdminLicensePage` |
| **Entry** | Sidebar → Admin → Licensing |
| **Layout** | License status (active/expired/invalid). License key input. Registered to. Expiration date. Feature flags |

### 12.16 Maintenance

| Route | `/admin/maintenance` |
|---|---|
| **Component** | `AdminMaintenancePage` |
| **Entry** | Sidebar → Admin → Maintenance |
| **Layout** | Maintenance mode toggle. Cache clearing. Log cleanup. Temp file cleanup. Data reindex |

### 12.17 About

| Route | `/admin/about` |
|---|---|
| **Component** | `AdminAboutPage` |
| **Entry** | Sidebar → Admin → About |
| **Layout** | App name, version, build date. Tech stack info. Licenses. Links to documentation and GitHub |

---

## 13. Employees

### 13.1 Employees List

| Field | Value |
|---|---|
| **Route** | `/employees` |
| **Component** | `EmployeesPage` |
| **Entry** | Sidebar → Employees |
| **Layout** | **Toolbar:** "Employees" title + Add Employee (disabled) + Export buttons. **Main content:** Employee cards table (name, role, email, status badge, last active) |
| **Actions** | Add Employee (disabled), Export |
| **Data displayed** | Employee list with roles and status |
| **Related screens** | Admin Users |

---

## 14. Settings

### 14.1 Settings Page

| Field | Value |
|---|---|
| **Route** | `/settings` |
| **Component** | `SettingsPage` |
| **Entry** | Sidebar → Settings |
| **Layout** | **Toolbar:** "Settings" title. **Main content:** Settings category cards grid (Store Information, Appearance, Database & Backup, Notifications, Security, Localization, Receipt Printing, Shipping & Delivery). Each card: icon, title, description, optional badge. Language toggle (EN/ES) in toolbar area |
| **Actions** | Toggle language, click setting cards (some navigate to admin settings) |
| **Data displayed** | Settings categories |
| **Related screens** | Admin Settings |

---

## 15. Help

### 15.1 Help Page

| Field | Value |
|---|---|
| **Route** | `/help` |
| **Component** | `HelpPage` |
| **Entry** | Sidebar → Help |
| **Layout** | **Toolbar:** "Help" title. **Main content:** 3-column grid: Documentation card, Support card, Keyboard Shortcuts card. Keyboard shortcuts list. About section |
| **Actions** | Access documentation links |
| **Data displayed** | Help resources, keyboard shortcuts |

---

## Route Summary

| # | Route | Component | Module |
|---|---|---|---|
| 1 | `/login` | `LoginPage` | Auth |
| 2 | `/forbidden` | `ForbiddenPage` | Auth |
| 3 | `/dashboard` | `DashboardPage` | Dashboard |
| 4 | `/crm` | `CrmDashboardPage` | CRM |
| 5 | `/crm/customers` | `CrmCustomersPage` | CRM |
| 6 | `/crm/customers/:id` | `CrmCustomerDetailPage` | CRM |
| 7 | `/crm/vehicles` | `CrmVehiclesPage` | CRM |
| 8 | `/crm/compatibility` | `CrmCompatibilityPage` | CRM |
| 9 | `/crm/reminders` | `CrmRemindersPage` | CRM |
| 10 | `/crm/warranties` | `CrmWarrantiesPage` | CRM |
| 11 | `/crm/credit` | `CrmCreditPage` | CRM |
| 12 | `/crm/notes` | `CrmNotesPage` | CRM |
| 13 | `/inventory` | `InventoryDashboardPage` | Inventory |
| 14 | `/inventory/categories` | `CategoriesPage` | Inventory |
| 15 | `/inventory/categories/new` | `CategoryFormPage` | Inventory |
| 16 | `/inventory/categories/:id/edit` | `CategoryFormPage` | Inventory |
| 17 | `/inventory/brands` | `BrandsPage` | Inventory |
| 18 | `/inventory/brands/new` | `BrandFormPage` | Inventory |
| 19 | `/inventory/brands/:id/edit` | `BrandFormPage` | Inventory |
| 20 | `/inventory/manufacturers` | `ManufacturersPage` | Inventory |
| 21 | `/inventory/manufacturers/new` | `ManufacturerFormPage` | Inventory |
| 22 | `/inventory/manufacturers/:id/edit` | `ManufacturerFormPage` | Inventory |
| 23 | `/inventory/suppliers` | `InventorySuppliersPage` | Inventory |
| 24 | `/inventory/suppliers/new` | `SupplierFormPage` | Inventory |
| 25 | `/inventory/suppliers/:id/edit` | `SupplierFormPage` | Inventory |
| 26 | `/inventory/warehouses` | `WarehousesPage` | Inventory |
| 27 | `/inventory/warehouses/new` | `WarehouseFormPage` | Inventory |
| 28 | `/inventory/warehouses/:id/edit` | `WarehouseFormPage` | Inventory |
| 29 | `/inventory/storage-locations` | `StorageLocationsPage` | Inventory |
| 30 | `/inventory/storage-locations/new` | `StorageLocationFormPage` | Inventory |
| 31 | `/inventory/storage-locations/:id/edit` | `StorageLocationFormPage` | Inventory |
| 32 | `/inventory/products` | `ProductsPage` | Inventory |
| 33 | `/inventory/products/new` | `ProductFormPage` | Inventory |
| 34 | `/inventory/products/:id` | `ProductDetailPage` | Inventory |
| 35 | `/inventory/products/:id/edit` | `ProductFormPage` | Inventory |
| 36 | `/inventory/movements` | `InventoryMovementsPage` | Inventory |
| 37 | `/inventory/movements/new` | `InventoryMovementFormPage` | Inventory |
| 38 | `/sales` | `SalesPage` | Sales |
| 39 | `/sales/new` | `PosPage` | Sales |
| 40 | `/sales/closeout` | `CloseoutPage` | Sales |
| 41 | `/sales/quotes` | `QuotesPage` | Sales |
| 42 | `/sales/quotes/new` | `QuoteFormPage` | Sales |
| 43 | `/sales/quotes/:id` | `QuoteDetailPage` | Sales |
| 44 | `/sales/quotes/:id/edit` | `QuoteFormPage` | Sales |
| 45 | `/sales/returns` | `ReturnsPage` | Sales |
| 46 | `/sales/register` | `CashRegisterPage` | Sales |
| 47 | `/sales/receipts` | `ReceiptsPage` | Sales |
| 48 | `/sales/:id` | `SaleDetailPage` | Sales |
| 49 | `/purchases` | `PurchasesPage` | Purchases |
| 50 | `/purchases/orders` | `PurchaseOrdersPage` | Purchases |
| 51 | `/purchases/orders/new` | `PurchaseOrderFormPage` | Purchases |
| 52 | `/purchases/orders/:id` | `PurchaseOrderDetailPage` | Purchases |
| 53 | `/purchases/orders/:id/edit` | `PurchaseOrderFormPage` | Purchases |
| 54 | `/purchases/requests` | `PurchaseRequestsPage` | Purchases |
| 55 | `/purchases/receipts` | `PurchaseReceiptsPage` | Purchases |
| 56 | `/purchases/receipts/:id` | `PurchaseReceiptDetailPage` | Purchases |
| 57 | `/purchases/returns` | `PurchaseReturnsPage` | Purchases |
| 58 | `/purchases/supplier-products` | `SupplierProductsPage` | Purchases |
| 59 | `/purchases/cost-history` | `CostHistoryPage` | Purchases |
| 60 | `/purchases/reorder-suggestions` | `ReorderSuggestionsPage` | Purchases |
| 61 | `/customers` | `CustomersPage` | Customers |
| 62 | `/customers/:id` | `CustomerDetailPage` | Customers |
| 63 | `/suppliers` | `SuppliersPage` | Suppliers |
| 64 | `/vehicles` | `VehiclesPage` | Vehicles |
| 65 | `/warehouse` | `WarehousePage` | Warehouse |
| 66 | `/reports` | `ReportsPage` | Reports |
| 67 | `/reports/sales` | `ReportsSalesPage` | Reports |
| 68 | `/reports/inventory` | `ReportsInventoryPage` | Reports |
| 69 | `/reports/purchasing` | `ReportsPurchasingPage` | Reports |
| 70 | `/reports/customers` | `ReportsCustomersPage` | Reports |
| 71 | `/reports/suppliers` | `ReportsSuppliersPage` | Reports |
| 72 | `/reports/warehouses` | `ReportsWarehousesPage` | Reports |
| 73 | `/reports/profitability` | `ReportsProfitabilityPage` | Reports |
| 74 | `/reports/kpis` | `ReportsKpiPage` | Reports |
| 75 | `/reports/custom` | `ReportsCustomPage` | Reports |
| 76 | `/reports/scheduled` | `ReportsScheduledPage` | Reports |
| 77 | `/reports/exports` | `ReportsExportsPage` | Reports |
| 78 | `/admin` | `AdminDashboardPage` | Admin |
| 79 | `/admin/users` | `AdminUsersPage` | Admin |
| 80 | `/admin/users/new` | `AdminUserFormPage` | Admin |
| 81 | `/admin/users/:id/edit` | `AdminUserFormPage` | Admin |
| 82 | `/admin/roles` | `AdminRolesPage` | Admin |
| 83 | `/admin/roles/new` | `AdminRoleFormPage` | Admin |
| 84 | `/admin/roles/:id/edit` | `AdminRoleFormPage` | Admin |
| 85 | `/admin/settings` | `AdminSettingsPage` | Admin |
| 86 | `/admin/printers` | `AdminPrintersPage` | Admin |
| 87 | `/admin/devices` | `AdminDevicesPage` | Admin |
| 88 | `/admin/backups` | `AdminBackupsPage` | Admin |
| 89 | `/admin/restore` | `AdminRestorePage` | Admin |
| 90 | `/admin/database` | `AdminDatabasePage` | Admin |
| 91 | `/admin/diagnostics` | `AdminDiagnosticsPage` | Admin |
| 92 | `/admin/audit` | `AdminAuditPage` | Admin |
| 93 | `/admin/updates` | `AdminUpdatesPage` | Admin |
| 94 | `/admin/licensing` | `AdminLicensePage` | Admin |
| 95 | `/admin/maintenance` | `AdminMaintenancePage` | Admin |
| 96 | `/admin/about` | `AdminAboutPage` | Admin |
| 97 | `/employees` | `EmployeesPage` | Employees |
| 98 | `/settings` | `SettingsPage` | Settings |
| 99 | `/help` | `HelpPage` | Help |
