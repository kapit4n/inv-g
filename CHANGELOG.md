# Changelog

## [Unreleased]

### Customers — a cashier can correct a customer they mistyped at the till
- A cashier registering a customer at the point of sale could not fix a mistake:
  the name went in as typed and only an administrator could change it later. The
  POS customer field now offers **Edit customer details** next to the selection
- The cashier role gains `customers.update`. It deliberately does **not** gain
  `customers.view`, so the Customers module stays closed to cashiers: they can
  correct the customer on the sale in front of them and cannot list anyone
  else's contact details or credit balance
- `customers.delete` is not granted
- The dialog renders name, email, phone and notes. `update_customer` overwrites
  every column, so the address, city, state, postcode and country are passed
  through from the loaded record — otherwise saving a corrected name would
  quietly blank the customer's address
- **The permission is now enforced in the backend.** `update_customer` had no
  permission check at all, so every customer permission in the app was enforced
  by the interface hiding a button and nothing else. The command now takes the
  acting user and checks `customers.update` before writing, and the refusal is
  returned without applying any part of the update
- The grant is applied to existing installations by a schema v18 → v19
  migration, not by the seeder. `seed_additional_permissions` returns early once
  any `admin.*` permission exists, so a seeder-only change would have been
  silently ignored on exactly the databases that needed it — the same
  `INSERT OR IGNORE` trap as the currency options one schema step earlier
- The additive-migration window was widened to `SCHEMA_VERSION - 6`, so bumping
  the schema version did not push v13 installations onto the legacy `DROP TABLE`
  path


### Settings — rejected values now speak your language, and the currency selector actually rolls back
- A refused settings write no longer shows the backend's English sentence. The
  command now returns a stable code (`notAllowed`, `notNumber`, `notBoolean`,
  `min`, `max`, `minLength`, `maxLength`) and the UI resolves it through the
  existing `admin.settings.errors.*` keys, so a Spanish installation gets
  *El valor no está entre las opciones permitidas* instead of
  `Value 'BOB' is not one of the allowed options: USD, MXN, ...`
- Bounds are interpolated: *Debe tener al menos 3 caracteres* rather than a
  sentence that has to be re-parsed client-side
- Errors with no code — a permission refusal, a database failure, a message from
  a future command — are still shown exactly as they arrive, because those are
  the ones worth reading
- **Fixed a rollback that never rolled back.** The currency card read the value
  to restore *after* its optimistic write, so a refused write restored the
  rejected currency onto itself: the app went on formatting every price in the
  new currency while the setting on disk still held the old one, until a restart
  reverted it. The value to restore is now captured before the write
- Tauri commands report failures as plain strings, so the code travels inside the
  message and the English prose is retained after it. A cross-cutting `AppError`
  refactor was deliberately not done to fix one message
- Adds a `currency-card` test suite that covers the translated toast, the uncoded
  toast, the rollback and the success path

### Settings — Boliviano was rejected by the currency selector
- Choosing *Boliviano (Bs)* in the system-currency card failed with
  `Value 'BOB' is not one of the allowed options`, and the rejected value stayed
  selected. (It looked like it had rolled back; it had not — see the entry above,
  where the rollback bug is fixed.)
- The allowed-currency list is not hardcoded: the backend reads it from the
  `currency` row's `options` column, and no migration had ever updated that
  column. `seed_application_settings` inserts with `INSERT OR IGNORE`, so adding
  BOB to the seeder in Milestone 18 could never reach an existing installation —
  the row was already there and the stale list survived. The Milestone 18 note
  "validator now accepts it" was inaccurate; the validator was never changed
- Schema v17 → v18 rewrites the list on existing databases, and the seeder now
  matches the UI
- Also fixes the mirror-image failure that was live on *every* installation: the
  UI offered 14 currencies while the backend allowed 7, so ARS, CLP, PEN, UYU,
  PYG, GBP, CHF, JPY and BRL were all selectable and all refused. GTQ and CRC
  were backend-only, selectable from Admin → Settings with no label to render
  them, and are dropped
- Bumping the schema version narrowed the additive-migration window, which would
  have pushed v13 installations onto the legacy `DROP TABLE` path and destroyed
  their products. The window was widened to keep v13 additive
- The migration also has to tolerate a missing `application_settings` table,
  because `create_tables` migrates before it finishes creating tables
- Docs: bug log entry with the full investigation

### Users — required-field validation when creating an account
- Both account-creation screens (**Admin → Users** and **Empleados**) now validate
  before saving and show the message **on the field**, in the field's own language,
  reporting every problem at once instead of a single toast naming three fields
- **Role is now required.** `roleId: form.roleId || undefined` sent "no role" when
  the selector was left on its placeholder and the backend stores a NULL `role_id`
  without complaint, so an account that can sign in and open nothing was created
  silently in one click. A user with no role is never what anyone means to create
- Username, full name and email are required and trimmed, so a field holding only
  spaces is caught instead of being saved as a whitespace username
- Email is checked for a real address, and an optional phone number must be digits
  and `+ - ( )` if given
- A duplicate username or email is now reported on the field as a plain sentence.
  The server has no duplicate check of its own — `create_admin_user` runs a raw
  INSERT — so the clash used to reach the user as SQLite's own
  `UNIQUE constraint failed: users.username`
- Fixed the admin form swallowing failures entirely: it had no `catch` at all, so
  a rejected save left the form silently. The form also carries `noValidate` now,
  because a Tauri webview renders no native validation bubble — with the native
  `required` attribute left on, **Save** did nothing and showed nothing
- Both screens moved onto the shared field components (`TextField`, `EmailField`,
  `SelectField`), so the labels are now properly associated with their controls
- Validation lives in one place, `src/lib/validation/user-form.ts`, returning
  translation keys so the English and Spanish builds both read correctly
- Docs: docs-site Admin → Users & Roles, new "Required Fields" section

### Inventory — Quick add
- New **Quick add** dialog on Inventory → Products for registering a product with
  just the four fields that matter at the counter: product, provider, quantity
  and prices, instead of walking the full 25-field product form for every line of
  a supplier's price list
- Captures name, SKU, supplier, opening quantity, cost price, sale price, gain
  margin, unit and (on multi-store installations) warehouse
- The quantity is written as an `in` stock movement tagged `quick_add` rather
  than onto the product row, so the opening stock is backed by a row in the
  product's activity history and appears in movement reports
- Blank SKU generates a `QA-…` code automatically; a duplicate is reported as
  "This SKU is already used by another product" with the dialog left open and
  the typed name intact, instead of a raw SQLite constraint message
- Suppliers are searchable by name or tax number, and an unknown one can be
  registered from inside the dialog without leaving it
- The dialog stays open after saving with a counter of products added, keeping
  the supplier, prices, unit and warehouse filled in and clearing only the
  per-line fields, so a whole supplier list can be keyed in one sitting
- Selling price left empty is derived from the product's gain margin or the
  global default; a live preview shows the suggested price, effective gain and
  effective price, and warns when the price is at or below cost
- Both buttons are gated on the `inventory.create` permission
- Docs: docs-site Inventory → Products quick add section

### Dashboard — role-aware content
- The Panel de Control no longer shows functionality the signed-in role cannot
  use: a cashier (dashboard + sales) now sees only the **Nueva Venta** action, the
  revenue/sales-count tiles and the recent-sales list. The purchasing, inventory
  and customer actions, tiles and alerts, plus the cross-store totals, are hidden
- Quick actions are gated on the exact permission the action needs, so a read-only
  role is no longer offered **Nueva Venta**, **Nueva OC** or **Nuevo Cliente**
- A quick action whose module is switched off in Admin > Settings is hidden too,
  instead of dead-ending on the module guard
- Queries for inventory, purchasing, CRM and cross-store data are not issued at all
  when the role cannot see them
- The "Necesita Atención" section is dropped when the role can open none of the
  modules its alerts come from, rather than showing a misleading "¡Todo listo!"
- Card grids resize to the number of visible items, so a partial row does not leave
  empty tracks
- Docs: docs-site Dashboard (per-feature permission tables) and Admin → Users &
  Roles (cashier section)

### Database Lifecycle — First-Launch Initialization & Restore-Initial-Data
- Database is initialized once (schema + seed only when there are no users); restarts and
  updates never re-seed or delete data; `database_initialized` marker recorded in settings
- New admin-only **Restaurar datos iniciales** tool on Admin → Database: blast-radius
  preview, two-step confirmation (`RESTAURAR` token + dialog), auto pre-reset backup
  (`inventory-gear-backup-<timestamp>.sqlite` with checksum + history record) that keeps
  the previous state restorable, then a transactional wipe + full first-launch re-seed;
  operator is signed out afterwards because the acting account no longer exists
- Backend gated on `admin.database.manage` permission; audit entry written
- Seeds Bolivian defaults: currency `BOB` value + option (validator now accepts it)
- Docs: docs-site Admin → Database lifecycle + restore section, manual checklist Scenarios A–D

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
