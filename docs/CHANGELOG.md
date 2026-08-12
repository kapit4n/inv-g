# Changelog

> **Version note:** The project has not followed strict semver per milestone.
> Current version is **0.1.0** (`package.json`, `src-tauri/Cargo.toml`,
> `src-tauri/tauri.conf.json`, and the `app_version` seed setting). Milestone
> numbers below are the authoritative history (see `docs/ROADMAP.md`).

## [0.1.0] - 2026-08-12 (Milestones 2–13)

> Cumulative development history since the 0.1.0 initial release. Version
> number was not bumped per milestone; this entry covers all completed
> milestones.

### Milestone 13 — Enterprise Quality Assurance & Testing Framework (2026-07-30)
- Vitest suite: 26 test files — unit, integration, regression, smoke, Tauri
  contract tests (177 frontend + 20 Rust tests)
- Test factories, mock repository, render helpers, test setup
- ESLint 9 flat config migration + GitHub Actions CI
- Quality dashboard (`quality/dashboard.md`) + `npm run verify` gate

### Milestone 12 — Automated Screenshot Framework & Artifacts (2026-07-30)
- Playwright screenshot generation: 66 screens × light/dark across 7 modules
- Tauri IPC mock serving 290+ commands; helper modules; docs
- Committed artifacts: `docs/screenshots/{dark,light,thumbnails,report}`

### Milestone 11 — Administration Frontend (2026-07-29)
- Admin dashboard, user & role management, settings editor
- Printers, devices, backups, restore, database maintenance, diagnostics
- Audit log, updates, licensing, maintenance, about
- ~90 admin backend command wrappers + interfaces

### Milestone 10 — Reporting, Analytics & BI (2026-07-29)
- Executive dashboard (10 widgets + 10 charts), KPI dashboard
- Sales/inventory/purchasing/customer/supplier/warehouse/profitability reports
- Custom & scheduled reports, export foundation, 6 new tables
- 45+ Rust commands, 12 report pages, reusable charts, RBAC, i18n

### Milestone 9 — CRM & Vehicles (2026-07-29)
- CRM dashboard, customer management, credit accounts
- Vehicle catalog (brands, models, generations, engines), customer vehicles
- Product-vehicle compatibility, service reminders, warranties

### Milestones 7–8 — Purchasing, Customers & Suppliers (2026-07-28)
- Purchasing: POs, requests, receiving/inspection, returns, supplier catalog,
  cost history, reorder suggestions, supplier performance, dashboard
- Customers: CRUD, purchase history, credit accounts, communication log

### Milestone 6 — Sales & Point of Sale (2026-07-28)
- Sales management, POS terminal, invoice generation, payments
- Returns/refunds, receipt printing, daily close-out

### Milestone 5 — Inventory Management (2026-07-28)
- Brands, manufacturers, warehouses, storage locations, product images,
  compatibility, inventory movements
- Product CRUD with search, detail view, 22 sub-routes, i18n

### Milestone 4 — CRUD Framework (2026-07-28)
- Generic CRUD types, Zod validation, repository pattern, CrudService
- 11 form fields, DataTable, dialogs, entity layouts, 7 CRUD hooks
- `docs/CRUD_FRAMEWORK.md`

### Milestones 2–3 — Auth, Users & Core Infrastructure (2026-07-28)
- Authentication & authorization, RBAC, sessions, permissions, protected routes
- Settings (key-value), notifications, dialogs, error handling
- Schema (users, roles, permissions, settings) + seed data

## [0.1.0] - 2024-07-27 (Initial / Milestone 1)

### Added
- Project foundation and scaffolding
- Tauri v2 desktop runtime
- React 19 + TypeScript frontend
- TailwindCSS v4 styling system
- shadcn/ui component library
- 12 feature modules with placeholder UI
- Dashboard with stat cards and widgets
- Collapsible sidebar navigation
- Top bar with search, theme toggle, notifications
- Status bar with connection info
- Command palette (Cmd+K)
- Theme system (light/dark/system)
- Zustand state management
- SQLite database schema
- Drizzle ORM configuration
- Complete documentation structure
- GitHub issue/PR templates
- Development roadmap
