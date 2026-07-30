# Inventory Gear — Release Notes

**Version 0.11.0** | July 29, 2026

Inventory Gear is a professional desktop inventory management and point-of-sale (POS) system built for automotive parts stores and small-to-medium retail businesses. It runs entirely locally on your computer — no internet connection required, no cloud subscription, your data stays with you.

---

## Table of Contents

- [System Requirements](#system-requirements)
- [Installation](#installation)
- [What's Included](#whats-included)
  - [Dashboard](#dashboard)
  - [Inventory Management](#inventory-management)
  - [Sales & Point of Sale](#sales--point-of-sale)
  - [Purchasing & Procurement](#purchasing--procurement)
  - [Customer Management (CRM)](#customer-management-crm)
  - [Vehicle Catalog & Compatibility](#vehicle-catalog--compatibility)
  - [Reporting & Analytics](#reporting--analytics)
  - [Administration](#administration)
  - [Internationalization](#internationalization)
- [Known Limitations](#known-limitations)

---

## System Requirements

| Component | Requirement |
|-----------|-------------|
| **Operating System** | Windows 10/11, macOS 12+, or Linux (GTK3) |
| **Storage** | 200 MB for the application, plus space for your database |
| **Memory** | 512 MB minimum, 1 GB recommended |
| **Display** | 1280×720 minimum, 1920×1080 recommended |
| **Database** | SQLite (included — no separate installation needed) |
| **Network** | None required (fully offline application) |

## Installation

1. Download the latest installer for your platform from the releases page.
2. Run the installer:
   - **Windows**: Run `Inventory-Gear-Setup-x.x.x.exe` and follow the setup wizard.
   - **macOS**: Mount the `.dmg` and drag Inventory Gear to your Applications folder.
   - **Linux**: Run `chmod +x inventory-gear-x.x.x.AppImage && ./inventory-gear-x.x.x.AppImage`.
3. Launch the application. The database is created automatically on first run.
4. Log in with the default admin credentials:
   - **Username**: `admin`
   - **Password**: `123456`
5. Go to **Admin → Users** to create your own users and customize roles.

---

## What's Included

### Dashboard

The home screen gives you a real-time snapshot of your business. Cards show total products, active/inactive inventory, low-stock alerts, out-of-stock items, categories, brands, suppliers, and warehouses. The executive dashboard (in Reports) adds revenue charts, profit trends, customer growth, warehouse distribution, and top-performing products and suppliers.

### Inventory Management

Full control over your product catalog and stock:

- **Products** — Add, edit, archive products with SKU, barcode, OEM number, internal code, pricing (cost, sale, wholesale, MSRP), tax rate, stock levels, reorder points, and warehouse/storage location assignments.
- **Categories** — Organize products into hierarchical categories.
- **Brands** — Manage product brands with country, website, and logo.
- **Manufacturers** — Track manufacturers with contact details.
- **Suppliers** — Manage supplier information with company details, tax numbers, and contact info.
- **Warehouses** — Set up multiple warehouse locations with addresses and managers.
- **Storage Locations** — Define zones, aisles, shelves, and bins within each warehouse.
- **Product Images** — Attach multiple images to products with primary image selection.
- **Inventory Movements** — Track all stock changes (inbound, outbound, adjustments) with automatic quantity updates.
- **Stock Alerts** — Low-stock and out-of-stock indicators throughout the interface.

### Sales & Point of Sale

Process sales quickly and efficiently:

- **POS Terminal** — Search products with live filtering, add items to cart with quantity controls, select customer and payment method, and complete the sale. Stock is automatically deducted.
- **Sales History** — View all sales with stat cards showing today's revenue, transaction count, and averages.
- **Sale Details** — Click any sale to see full details including items, customer info, payment method, and totals.
- **Invoice Auto-Numbering** — Each sale gets a unique invoice number (INV-00001 format).
- **Refunds** — Process full or partial refunds with automatic stock return and inventory movement recording.
- **Receipt Printing** — Print formatted 80mm receipts directly from the sale detail view.
- **Daily Closeout** — End-of-day summary showing totals by payment method, refunds, and net revenue with print support.
- **Quotes** — Create customer quotes (foundation in place).

### Purchasing & Procurement

End-to-end purchase order management:

- **Purchase Dashboard** — Overview with stats, recent orders, reorder alerts, and top supplier performance.
- **Purchase Orders** — Create POs with dynamic line items, manage status lifecycle (draft → pending approval → approved → sent → received → completed).
- **Purchase Requests** — Submit and approve purchase requests, convert to purchase orders.
- **Receiving** — Receive POs with damaged quantity tracking, auto-stock update, and cost history recording.
- **Purchase Returns** — Return items to suppliers with automatic inventory reversal.
- **Supplier Product Catalog** — Map products to suppliers with SKU, lead time, minimum order quantity, and preferred supplier flags.
- **Cost History** — Track product cost changes over time with supplier and PO context.
- **Auto-Reorder Suggestions** — Automatically identifies products below reorder point, considering pending PO quantities and preferred suppliers.
- **Supplier Performance** — Analytics on delivery days, return rate, late deliveries, and total spend per supplier.

### Customer Management (CRM)

A complete customer relationship management system:

- **Customer Database** — Full customer profiles with contact info, type (individual/workshop/fleet/company), tax number, and preferences.
- **Purchase History** — See every sale a customer has made with clickable navigation to sale details.
- **Credit Accounts** — Set credit limits, track balances, record payments and charges.
- **Communication Log** — Log calls, emails, visits, and notes for each customer.
- **Customer Notes** — Internal notes with public/private flagging.
- **Activity Timeline** — Automatic event log for all customer interactions.
- **CRM Dashboard** — Aggregated stats and trend data for your entire customer base.

### Vehicle Catalog & Compatibility

Built specifically for automotive parts businesses:

- **Vehicle Catalog** — Comprehensive database of brands, models, generations, engines, transmissions, and fuel types.
- **Customer Vehicles** — Register customer vehicles with license plate, VIN, color, mileage, and full specification breakdown.
- **Product-Vehicle Compatibility** — Define which products work with which vehicles, with a recommendation engine.
- **Compatibility Search** — Find products that fit a specific vehicle, with stock and pricing info.
- **Auto-Recommendations** — System automatically suggests compatible products based on vehicle brand/model/year.

#### Service Reminders
- Set date-based and mileage-based service reminders for customer vehicles.
- Track reminder status (pending, completed, cancelled).
- Automatic overdue reminder detection.

#### Warranties
- Manage product warranties with expiration date monitoring.
- Track warranty status (active, expired, claimed, voided).
- Auto-detect warranties expiring within a configurable number of days.

### Reporting & Analytics

Comprehensive business intelligence with over 45 report types:

- **Executive Dashboard** — 10 widget cards and 10 interactive charts covering revenue, profit, inventory, customers, and more.
- **Sales Reports** — Daily, weekly, monthly, yearly summaries; by cashier; by payment method; discount analysis; returns; tax summary; quote conversion.
- **Inventory Reports** — Current stock with valuation; low stock alerts; overstock detection; aging analysis; movement trends; fast/slow moving products.
- **Purchasing Reports** — Monthly purchase trends; by supplier; supplier performance; PO status distribution; reorder suggestions; cost history.
- **Customer Reports** — Top customers by spending; customer growth trends; geographic distribution; inactive customer detection; credit portfolio summary.
- **Supplier Reports** — Supplier ranking (weighted score); lead time analysis.
- **Warehouse Reports** — Capacity utilization; stock distribution by category; adjustment activity.
- **Profitability Analysis** — Gross profit and margin trends by month, product, category, supplier, brand, customer, and warehouse.
- **KPI Dashboard** — 12 configurable KPIs with status indicators, trend tracking, and target comparison (revenue growth, inventory turnover, average order value, customer retention, etc.).
- **Custom Reports** — Save and manage custom report configurations.
- **Scheduled Reports** — Schedule automated report generation with configurable frequency and format.
- **Chart Visualizations** — Line, Bar, Area, Pie, Donut, and Stacked Bar charts with interactive filtering.

### Administration

Complete system administration and configuration:

- **User Management** — Create, edit, archive, lock/unlock users, reset passwords.
- **Role Management** — Create, edit, clone, archive roles with a permission matrix UI. Pre-seeded roles: Owner, Administrator, Cashier, Warehouse, Purchasing, Viewer.
- **System Settings** — Configure store information, inventory thresholds, sales defaults, purchasing preferences, printing settings, security policies, backup configuration, localization, and more — all through a categorized settings editor.
- **Printer Management** — Add, configure, test, and set default printers for receipts, invoices, and labels. Supports USB, network, and Bluetooth interfaces with configurable paper sizes.
- **Device Management** — Register barcode scanners, POS peripherals, and other connected devices.
- **Backup & Restore** — Create manual backups, view backup history, restore from previous backups with full warning safeguards.
- **Database Maintenance** — View database statistics, run vacuum, optimize performance, check integrity, reindex tables.
- **Diagnostics** — Run system diagnostic checks and view history.
- **Audit Log** — Comprehensive event log with severity filtering, entity type, user, and date search.
- **System Updates** — Check for new versions, view update history.
- **License Management** — Activate license keys, view license status and feature entitlements.
- **Maintenance Operations** — Cache clearing, database optimization, log cleanup, vacuum, reindex, and integrity checks with operation history.
- **About Page** — Application version, system information, resource links, and credits.

### Internationalization

- **Spanish (es)** — Default language, fully translated.
- **English (en)** — Complete English translation.
- **18 translation namespaces** covering every module of the application.
- Easily extensible to additional languages.

---

## Known Limitations

- Multi-warehouse inventory transfers are not yet available.
- Barcode/QR code scanning hardware integration is foundational but not fully featured.
- Cloud sync is not available (the application is fully offline).
- PDF export for reports is in development.
- No mobile companion app yet.
<!-- markdownlint-disable-file -->
