# Changelog

## [0.11.0] - 2026-07-29

### Milestone 11: Administration Frontend
- Added admin dashboard with system health stats, quick actions
- Added user management (list, create, edit, archive, lock/unlock, reset password)
- Added role management (list, create, edit, clone, archive) with permission matrix
- Added system settings editor with category sidebar (General, Inventory, Sales, Purchasing, Notifications, Appearance, Security)
- Added printer management (add, edit, test, delete, set default)
- Added device management (add, edit, test, delete)
- Added backup management (create, list, delete)
- Added restore management with warning and history tracking
- Added database maintenance page (stats, vacuum, optimize, integrity check, reindex)
- Added diagnostics page with checks and history
- Added audit log viewer with severity filtering and search
- Added system updates page (version display, check for updates, history)
- Added license activation and status display
- Added maintenance operations page (cache, optimize, clean, vacuum, reindex, integrity)
- Added About page with system info, version, resources, credits
- Added CustomerSearchField — searchable combobox with quick-add dialog for POS and Quotes
- Added ~90 TypeScript Tauri invoke wrappers for admin backend commands
- Added TypeScript interfaces for all admin entities
- Fixed systematic snake_case vs camelCase mismatch across all 34 Rust command files

## [0.10.0] - 2026-07-29

### Milestone 10: Reporting, Analytics & Business Intelligence
- Added executive dashboard with 10 widget cards and 10 interactive charts (Recharts)
- Added sales reports (daily, weekly, monthly, yearly, by cashier, by payment method, discount analysis, returns, tax, quote conversion)
- Added inventory reports (current stock, valuation, low/over stock, movements, aging, fast/slow moving)
- Added purchasing reports (by month, by supplier, performance, PO status, reorder suggestions, cost history)
- Added customer reports (top customers, growth, locations, inactive, credit, service summary)
- Added supplier reports (ranking, lead time analysis)
- Added warehouse reports (utilization, adjustments, stock distribution)
- Added profitability analysis (by product, category, supplier, customer, brand, warehouse)
- Added KPI dashboard with 12 configurable KPI cards and status indicators
- Added custom report builder foundation (save, manage, generate)
- Added scheduled reports foundation (create, toggle, track last run)
- Added export system foundation with report history tracking
- Added 6 new database tables for reports management
- Added 45+ Rust Tauri commands across 10 sub-modules
- Added 12 frontend report pages with tabbed navigation
- Added reusable chart components (Line, Bar, Area, Pie, Donut, Stacked Bar)
- Added reusable filter bar and data table components
- Added full i18n (296 keys per locale, es/en)
- Added 11 new report permissions
- Fixed `reports-page.tsx` chart rendering crash (missing `dataKeys` props, wrong column API, null guard in formatter)

## [0.9.0] - 2026-07-29

### Milestone 9: CRM & Vehicles
- Added CRM dashboard with aggregated stats and charts
- Added vehicle catalog (brands, models, generations, engines, transmissions, fuels)
- Added customer vehicle registry with detailed specs
- Added product-vehicle compatibility system with recommendations
- Added service reminders with mileage/date tracking and overdue detection
- Added warranty management with expiration monitoring
- Added customer notes with public/private flag
- Added customer timeline (event log for customer activity)
- Added 9 CRM frontend pages (Dashboard, Customers, Vehicles, Compatibility, Reminders, Warranties, Credit, Notes)
- Restructured sidebar: unified CRM section with 8 sub-items
- Added 15+ new TypeScript interfaces and 30+ Tauri wrapper functions
- Added seed data permissions for CRM modules across 6 roles

## [0.8.0] - 2026-07-28

### Milestone 8: Customers & Suppliers
- Added customer management CRUD with list page and stat cards
- Added customer detail page with 4 tabs (Info, Sales History, Credit Account, Communication Log)
- Added credit account management (create account, transactions, add payment/charge)
- Added communication log (call, email, visit, note entries)
- Added customer purchase history view
- Expanded supplier management within inventory module
- Added updated sidebar with customer sub-items
- Added full i18n for customers module (es/en)

## [0.7.0] - 2026-07-28

### Milestone 7: Purchasing & Supplier Procurement
- Added purchasing dashboard with stats, recent orders, reorder alerts, top suppliers
- Added purchase order management (create/edit with dynamic items, status lifecycle)
- Added purchase order status transitions (draft → pending_approval → approved/sent → partially_received → completed)
- Added purchase request management (list, create, approve/reject, convert to PO)
- Added purchase receiving with validation, auto-stock update, cost history recording
- Added purchase returns with inventory reversal
- Added supplier product catalog CRUD
- Added product cost history tracking with supplier context
- Added auto-reorder suggestions (products below reorder point with preferred supplier lookup)
- Added supplier performance analytics (avg delivery days, return rate, late deliveries, total spend)
- Added 28 Rust Tauri commands for full purchase lifecycle
- Added 11 frontend page components and 12 sub-routes
- Added 8 new database tables (Schema v4)
- Added 10 new purchase permissions across 6 roles

## [0.6.0] - 2026-07-28

### Milestone 6: Sales & Point of Sale
- Added sales list page with real data and stat cards (revenue, transactions, average, cash)
- Added POS terminal interface with product search, cart management, customer/payment selection
- Added sale detail page with status badge, items table, summary card
- Added auto-generated invoice numbers (INV-00001 format)
- Added stock auto-decrement on sale creation
- Added sales refund with stock return and inventory movements
- Added receipt printing (80mm formatted receipt with print CSS)
- Added daily closeout with totals by payment method, refunds, net revenue
- Added inventory movements UI (list, stock in/out/adjustment with auto-update)
- Added product images management UI
- Added product-vehicle compatibility UI
- Added storage location editing (backend + frontend)
- Added customer CRUD (used in POS customer selection)

## [0.5.0] - 2026-07-28

### Milestone 5: Inventory Management
- Added inventory dashboard with live stats (total products, value, low stock, etc.)
- Added categories management (list, create, edit)
- Added brands management (list, create, edit)
- Added manufacturers management (list, create, edit)
- Added suppliers management (list, create, edit) within inventory module
- Added warehouses management (list, create, edit)
- Added storage locations management (list, create)
- Added products management with full CRUD
- Added server-side paginated product list with search
- Added full product detail view with all fields
- Added 22 inventory sub-routes with collapsible sidebar navigation
- Added 30+ Rust inventory CRUD commands
- Added 150+ i18n keys across all sub-modules
- Added seed data (10 categories, 8 brands, 6 manufacturers, 4 suppliers, 3 warehouses, 7 locations, 15 products)
- Added 6 new inventory permissions

## [0.4.0] - 2026-07-28

### Milestone 4: CRUD Framework & Data Management Foundation
- Added generic CRUD TypeScript types (CrudEntity, PaginatedResult, TableColumn, etc.)
- Added Zod validation system (schema factories, validators, error formatting)
- Added Repository pattern (interface + BaseRepository abstract class)
- Added CrudService with validation, transaction support, error handling
- Added 11 form field components (text, number, email, phone, currency, textarea, select, checkbox, switch, date)
- Added DataTable with sorting, pagination, search, column toggle, selection, bulk actions
- Added dialog components (Confirm, Prompt, Delete, Archive, Restore)
- Added entity layout components (ListPage, FormPage, DetailPage, InfoCard, ActionBar, Breadcrumb, Header)
- Added 7 CRUD hooks (useCrud, useEntity, useDataTable, useSearch, useFilters, usePagination, useSelection)
- Added data utilities (pagination, sorting, filtering, export/import, mappers)
- Added full documentation (docs/CRUD_FRAMEWORK.md)

## [0.3.0] - 2026-07-28

### Milestone 3: Core Infrastructure
- Added user login/logout with session persistence
- Added route guards (AuthenticatedRoute, GuestRoute, PermissionRoute)
- Added role-based access control with 5 default roles (owner, administrator, manager, editor, viewer)
- Added permission system with group-based organization
- Added settings management (key-value, grouped display)
- Added notification system (toast + notification center with history)
- Added dialog system (confirm, delete, warning, info)
- Added centralized error boundary and error pages (404, forbidden, generic)
- Added database schema (users, roles, permissions, role_permissions, settings, user_sessions)
- Added seed data for default roles and admin user
- Added Zustand stores for auth, settings, notification, dialog, theme, language

## [0.2.0] - 2026-07-28

### Milestone 2: Authentication & Users
- Added login page with form validation
- Added session management (login, logout, session check)
- Added role-based access control (RBAC) system
- Added permission system with role-permission mapping
- Added auth guards (AuthenticatedRoute, GuestRoute, PermissionRoute)
- Added auth Zustand store for client-side state
- Added user CRUD (create, read, update, archive)
- Added role management
- Added permission assignment UI

## [0.1.0] - 2026-07-28

### Milestone 1: Project Foundation
- Project scaffolding with Tauri v2 + React 19 + TypeScript
- Feature-first folder structure
- UI component library (shadcn/ui with TailwindCSS v4)
- Routing and navigation (React Router v7)
- Desktop layout (sidebar, topbar, statusbar)
- Theme system (light/dark/system)
- Command palette (Cmd+K)
- Zustand state management
- SQLite database schema with Drizzle ORM
- Dashboard with stat cards and widgets
- 12 feature module placeholders
- Notification panel
- Status bar with live clock
- Complete documentation structure
- GitHub issue/PR templates
- Development roadmap
