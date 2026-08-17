# Development Roadmap

> **Note:** Milestones 1–13 below are **completed** and documented with their
> commits. The active forward-looking plan (Phases 0–10, Tasks 00–25) lives in
> **[docs/development/DEVELOPMENT_PLAN.md](./development/DEVELOPMENT_PLAN.md)**.
> Long-term vision is maintained in **[docs/progress/SUMMARI.md](./progress/SUMMARI.md)**.
> Per-milestone detail is in **[docs/progress/](./progress/)**.

---

## Completed Milestones

| Milestone | Title | Status | Commits |
|-----------|-------|--------|---------|
| 1 | Project Foundation | ✅ | `4b25372` |
| 2 | Authentication & Users | ✅ (delivered with M3) | `8dd4e17` |
| 3 | Core Infrastructure | ✅ | `8dd4e17` |
| 4 | CRUD Framework & Data Management | ✅ | `4bdbeb1` |
| 5 | Inventory Management | ✅ | `2029fb9` |
| 6 | Sales & Point of Sale | ✅ | `8f19e53` |
| 7 | Purchasing | ✅ | `46ebd23` |
| 8 | Customers & Suppliers | ✅ | `46ebd23` |
| 9 | CRM & Vehicles | ✅ | `d5b1e9e` |
| 10 | Reporting, Analytics & BI | ✅ | `af90a61` |
| 11 | Administration Frontend | ✅ | `174da30`, `55a6252`, `d331084` |
| 12 | Automated Screenshot Framework & Artifacts | ✅ | `1e60da7` … `3b6484e` |
| 13 | Enterprise Quality Assurance & Testing | ✅ | `f2d9495` |

---

## Milestone 1: Project Foundation ✅
**Status:** Complete (`4b25372`)
- Project scaffolding (Tauri v2 + React + TypeScript)
- Folder structure and architecture
- UI component library (shadcn/ui)
- Routing and navigation (React Router)
- Layout system (sidebar, topbar, statusbar)
- Theme system (light/dark/system)
- Dashboard placeholder
- Database schema design
- Documentation foundation

## Milestone 2: Authentication & Users ✅
**Status:** Complete (delivered with Milestone 3, commit `8dd4e17`)
- User login/logout flow
- Role-based access control (RBAC)
- Session management
- Permission system
- Protected routes (AuthenticatedRoute, GuestRoute, PermissionRoute)

## Milestone 3: Core Infrastructure ✅
**Status:** Complete (commit `8dd4e17`)
- Authentication & authorization
- RBAC with role/permission management
- Settings management (key-value)
- Notification system (toast + notification center)
- Dialog system (confirm, delete, warning, info)
- Error handling (error boundary, error pages)
- Database schema (users, roles, permissions, settings)
- Seed data for default roles and admin user

## Milestone 4: CRUD Framework ✅
**Status:** Complete (commit `4bdbeb1`)
- Generic CRUD types (CrudEntity, PaginatedResult, TableColumn, etc.)
- Zod validation system (schema factories, validators)
- Repository pattern (interface + abstract base class)
- CrudService with validation and error handling
- 11 form field components (text, number, email, phone, currency, textarea, select, checkbox, switch, date)
- DataTable with sorting, pagination, search, column toggle, selection, bulk actions
- Dialog components (Confirm, Prompt, Delete, Archive, Restore)
- Entity layout components (ListPage, FormPage, DetailPage, InfoCard, ActionBar, Breadcrumb, Header)
- 7 CRUD hooks (useCrud, useEntity, useDataTable, useSearch, useFilters, usePagination, useSelection)
- Data utilities (pagination, sorting, filtering, export/import, mappers)
- Full documentation (docs/CRUD_FRAMEWORK.md)

## Milestone 5: Inventory Management ✅
**Status:** Complete (commit `2029fb9`)
- Database schema v2 (brands, manufacturers, warehouses, storage_locations, product_images, product_compatibility, inventory_movements)
- Expanded products and suppliers tables
- Rust CRUD commands for all inventory entities
- Seed data (categories, brands, manufacturers, suppliers, warehouses, storage locations, products)
- 14 frontend page components (dashboard, categories, brands, manufacturers, suppliers, warehouses, storage locations, products)
- Server-side paginated product list with search
- Full product detail view
- Collapsible inventory sub-navigation in sidebar
- 22 inventory sub-routes
- i18n keys for all sub-modules (es/en)

## Milestone 6: Sales & Point of Sale ✅
**Status:** Complete (commit `8f19e53`)
**Complexity:** High
**Dependencies:** Milestone 5
- ✅ Create and manage sales
- ✅ POS terminal interface
- ✅ Invoice generation
- ✅ Payment processing
- ✅ Return/refund handling
- ✅ Receipt printing
- ✅ Daily close-out

## Milestone 7: Purchasing ✅
**Status:** Complete (commit `46ebd23`)
**Complexity:** High
**Dependencies:** Milestone 5

### Tasks
- [x] Database schema v4 (8 new purchase tables + extended PO/PO items)
- [x] Rust backend (28 commands: CRUD, approvals, receiving, returns, cost history, reorder, supplier performance, dashboard)
- [x] Purchasing dashboard with stats, recent orders, reorder alerts, top suppliers
- [x] Purchase order creation with dynamic items
- [x] Purchase order list with filters (status, supplier, warehouse)
- [x] Purchase order detail with status-driven action buttons
- [x] Receiving and inspection (receive PO, track damaged qty, auto-update inventory)
- [x] Purchase returns with inventory reversal
- [x] Supplier product catalog
- [x] Cost history tracking
- [x] Auto-reorder suggestions
- [x] Supplier performance analytics
- [x] i18n keys (es/en)
- [x] Seed data permissions for 6 roles
- [x] 11 frontend page components
- [x] 12 purchase sub-routes + sidebar navigation

## Milestone 8: Customers & Suppliers
**Status:** Complete (commit `46ebd23`)
**Complexity:** Medium
**Dependencies:** Milestone 6

### Tasks
- [x] Customer management CRUD
- [x] Customer purchase history
- [x] Supplier management CRUD (in inventory)
- [x] Supplier product catalog (in purchases)
- [x] Credit accounts
- [x] Communication log

## Milestone 9: CRM & Vehicles ✅
**Status:** Complete (commit `d5b1e9e`)
**Complexity:** High
**Dependencies:** Milestone 6, 7, 8

### Tasks
- [x] CRM dashboard with aggregated stats and charts
- [x] Customer management with notes, timeline, and credit accounts
- [x] Vehicle catalog (brands, models, generations, engines, transmissions, fuels)
- [x] Customer vehicle registry with detailed specs
- [x] Product-vehicle compatibility system with recommendations
- [x] Service reminders with mileage/date tracking
- [x] Warranty management with expiration monitoring
- [x] Full sidebar navigation restructuring for CRM module
- [x] i18n keys (es/en) for all CRM UI text
- [x] Seed data permissions for new modules across 6 roles

## Milestone 10: Reporting, Analytics & Business Intelligence ✅
**Status:** Complete (commit `af90a61`)
**Complexity:** High
**Dependencies:** Milestone 6, 7, 8, 9

### Tasks
- [x] Executive dashboard with 10 widget cards and 10 interactive charts
- [x] Sales reports (daily, weekly, monthly, yearly, by cashier, by payment method)
- [x] Inventory reports (current stock, valuation, low/over stock, movements, aging, fast/slow moving)
- [x] Purchasing reports (by month, by supplier, performance, PO status, reorder suggestions)
- [x] Customer reports (top, growth, locations, inactive, credit, service summary)
- [x] Supplier reports (ranking, lead time, performance analysis)
- [x] Warehouse reports (utilization, adjustments, stock distribution)
- [x] Profitability analysis (by product, category, supplier, customer, brand, warehouse)
- [x] KPI dashboard with 12 configurable KPI cards and status indicators
- [x] Custom report builder foundation (save, manage, generate report definitions)
- [x] Scheduled reports foundation (create, toggle, track last run)
- [x] Export system foundation with report history tracking
- [x] 6 new database tables for reports management
- [x] 45+ Rust Tauri commands for all report aggregations
- [x] 12 frontend report pages with tabbed navigation
- [x] Reusable chart components (Line, Bar, Area, Pie, Donut, Stacked Bar)
- [x] Reusable filter bar and data table components
- [x] Full i18n (296 keys per locale, es/en)
- [x] 11 new permissions assigned to owner and administrator roles
- [x] RBAC integration for all report features

## Milestone 11: Administration Frontend ✅
**Status:** Complete (commits `174da30`, `55a6252`, `d331084`)
**Complexity:** Medium
**Dependencies:** Milestone 3, 10

### Tasks
- [x] Admin dashboard with system health, stats, quick actions
- [x] User management (list, create, edit, archive, lock/unlock, reset password)
- [x] Role management (list, create, edit, clone, archive) with permission matrix
- [x] System settings editor with category sidebar
- [x] Printer management (add, edit, test, delete, set default)
- [x] Device management (add, edit, test, delete)
- [x] Backup management (create, list, delete)
- [x] Restore management with warning/history
- [x] Database maintenance (stats, vacuum, optimize, integrity check, reindex)
- [x] Diagnostics (run checks, history)
- [x] Audit log viewer with severity filtering and search
- [x] System updates (version display, check for updates, history)
- [x] License activation and status display
- [x] Maintenance operations (cache, optimize, clean, vacuum, reindex, integrity)
- [x] About page with system info, version, resources
- [x] TypeScript interfaces for all admin entities
- [x] Tauri invoke wrappers for ~90 admin backend commands

## Milestone 12: Automated Screenshot Framework & Artifacts ✅
**Status:** Complete (commits `1e60da7` → `3b6484e`)
**Complexity:** Medium
**Dependencies:** Milestone 11

### Tasks
- [x] Playwright-based screenshot generation with 66 screens across 7 modules
- [x] Tauri IPC mock serving 290+ commands with realistic demo data
- [x] Light/dark theme variants for every screen
- [x] 7 test suites: Auth, Inventory, Sales, Purchasing, CRM, Reports, Admin
- [x] Helper modules: navigation, login, theme switching, screenshot capture
- [x] Documentation: SCREENSHOTS.md catalog, README with usage guide
- [x] Generated screenshot artifacts (dark/light 66 each, thumbnails, report)

## Milestone 13: Enterprise Quality Assurance & Testing Framework ✅
**Status:** Complete (commit `f2d9495`)
**Complexity:** Medium
**Dependencies:** Milestone 12

### Tasks
- [x] Vitest configured: 26 suites — 177 frontend tests + 20 Rust tests
- [x] Unit tests (utils, stores, hooks, services, components)
- [x] Integration workflow tests (product, sales, purchasing, inventory)
- [x] Regression tests for BUG-001/002/003
- [x] Smoke tests and Tauri command contract tests
- [x] Test factories, mock repository, render helpers, test setup
- [x] ESLint 9 flat config migration
- [x] GitHub Actions CI pipeline
- [x] Quality dashboard at `quality/dashboard.md`
- [x] `npm run verify` quality gate (typecheck → lint → vitest → coverage → cargo test)

---

## Current & Planned Work

The active roadmap is the **[Development Plan](./development/DEVELOPMENT_PLAN.md)**.
It is organized around **usability and operational efficiency** rather than new
CRUD modules, with phases executed incrementally one task at a time.

| Phase | Focus | Priority | Status |
|-------|-------|----------|--------|
| 0 | Project cleanup + baseline | 🔴 Critical | ✅ TASK 00 complete (commit `11296e4`) |
| 1 | Production configuration | 🔴 Critical | ✅ TASK 01 (commit `14b8d92`), ✅ TASK 02 (commit `09e723b`), ✅ TASK 03 (commit `8cfc9fb`), ✅ TASK 04 (commit `6142477`) |
| 2 | POS UX foundation | 🔴 Critical | ⏳ TASK 05 (commit `1496cdc`, partial), ✅ TASK 06 (commit `8db0034`), ✅ TASK 07 (commit `19e327e`) |
| 3 | Global search + command palette | 🔴 Critical | Planned |
| 4 | Keyboard-first workflows | 🟠 High | Planned |
| 5 | Product 360° view | 🟠 High | Planned |
| 6 | Automotive Part Finder | 🟠 High | Planned |
| 7 | Barcode workflows | 🟠 High | Planned |
| 8 | Warehouse workflows | 🟠 High | Planned |
| 9 | Printing & labels | 🟠 High | Planned |
| 10 | Customer + vehicle workflow | 🟡 Medium | Planned |
| 11 | Attention Center & operational dashboard | 🟡 Medium | Planned |
| 12 | Multi-branch foundation | 🟡 Medium | Planned |
| 13 | Automation / AI | 🟢 Later | Deferred — do not start yet |

The particularly important sequence once Phase 1 lands:

**POS → Search → Command Palette → Keyboard → Product 360 → Part Finder → Barcode → Warehouse**

These features reinforce each other and will make the ERP feel substantially
different while the underlying infrastructure remains unchanged.

---

## Long-Term Vision

Milestones 14+ (AI assistant, workshop/service center, accounting,
multi-branch/company, import/export & integrations, mobile companion, cloud
sync, enterprise features, commercial polish) are tracked in
**[docs/progress/SUMMARI.md](./progress/SUMMARI.md)**.
