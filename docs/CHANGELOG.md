# Documentation Changelog

All notable changes to the Inventory Gear documentation are documented here.

Format based on [Keep a Changelog](https://keepachangelog.com/).

---

## [Unreleased] - Spanish i18n hardening

### Added

- **Demo catalog database** (`inventory-gear-demo.db`): dedicated demo DB whose
  product catalog is exactly a 19-item steering/suspension list (muñones,
  terminales, brazos de cremallera, rótulas, barras estabilizadoras, juntas y
  capuchones). Built by `scripts/database/seed-demo-catalog.mjs`
  (`npm run db:demo`), which clones the schema + users from an initialized
  profile DB, wipes all business data, and inserts the catalog with
  `sku = Código_2` (fallback `Código`), `oem_number = Código`, `sale_price =
  Precio/u`, `cost ≈ 70%`, stock from `Cant`, plus `product_identifiers` rows
  for both codes. `npm run db:demo:activate` swaps it in as the active
  single-store profile DB (previous file backed up as `.bak-demo-<ts>`).

### Changed

- Localized every remaining hardcoded English user-facing string in the Spanish
  (`es`) locale: shared components (product-search / customer-search comboboxes,
  table placeholders, dialog sr-only text, print receipt/document templates),
  help page, CRM pages (9), Admin pages (10+), Sales/customers pages, Purchases
  pages and Reports pages (incl. purchasing report rewrite with `setActiveTab`).
- Added ~1,250 flat keys across `es` and `en` in 16 namespaces
  (`common`, `inventory`, `sales`, `purchases`, `customers`, `crm`, `admin`,
  `reports`, `report` UI, etc.) and documented flat-key conventions and the
  audit methodology in `docs/I18N.md`.
- `tests/unit/components/product-search-combobox.test.tsx` now calls
  `setupI18n("en")` before asserting English UI copy.

### Fixed

- **`npm run typecheck` was a no-op** — `tsc --noEmit` on the solution-style
  root `tsconfig.json` (with `files: []`) compiled 0 files. Script now uses
  `tsc -b` and the 158 latent type errors it surfaced were all fixed (unused
  imports, null-guards, report-table casts, `TableColumn` alignment,
  `@/types` export renames, Checkbox `id` prop, removed invalid `closeout.date`).
- **Spanish i18n hardening** — 0 missing ES keys, 0 missing EN keys, 0 EN-only
  keys, 0 `t('key', 'english')` fallback calls project-wide (verified by the
  new audit script).

### Known issue added

- `cargo test` fails 2 config tests on machines whose real app-data dir already
  contains a `profile.json` (environment-dependent, not a code regression).
  See `docs/KNOWN_ISSUES.md`.

---

## [Unreleased] - Database Profiles

### Added

- Four development/test database profiles: `default`, `single-store`, `multi-store`, `empty`
  with per-profile DB files (`inventory_gear.db`, `inventory-gear-single.db`, `inventory-gear-multi.db`, `inventory-gear-empty.db`).
- Profile resolution: `IG_DATABASE_PROFILE` env var → `profile.json` in the app data dir → `default`.
- Profile-aware Rust seeding (`single-store` = 1 warehouse, `multi-store` = 3 warehouses,
  `empty` = users/roles/settings only) and TSX seeder (`--profile` flag; warehouses, locations,
  transfers skip < 2 warehouses, empty skips business data).
- `BusinessCapabilities` model + `get_business_context` / `get_business_capabilities` backend
  commands; capabilities derived from the connected DB (store count).
- Store transfers: `transfer_inventory_between_stores` command with
  `transfer_out`/`transfer_in` movements and warehouse re-assignment (multi-store only, server enforced).
- Per-store commands: `get_store_sales`, `get_store_inventory` (multi-store only).
- Store-aware POS: `processCheckout` accepts `warehouseId`; single-store auto-resolves the only store.
- StoreSelector in the top bar (multi-store), persisted per session.
- Sidebar/route gating by capability (hide Warehouses/Storage Locations/Transfers when unsupported).
- `/inventory/transfers` page with transfer form and recent-transfers history.
- Dashboard per-store widgets (Sales by Store, Inventory by Store) rendered only in multi-store.
- Settings → Developer Tools card (dev builds only) to switch profile; restart required.
- i18n keys in `en` and `es` for the selector, transfers, dev tools and dashboard widgets
  (new `business` namespace).
- Docs: `docs/database-profiles.md`, `docs/database-profiles-assessment.md`,
  `docs/database-profiles-progress.md`, docs-site page `developer/database-profiles`.

### Fixed

- Flaky Rust config test: tests now use a unique temp dir per call instead of a shared
  process-wide dir (parallel test races on `profile.json`).

### Regressions

- None: `npm run verify` passes (typecheck → lint → vitest 431 tests → rust 87 tests);
  legacy `default` DB behaviour unchanged.

---

## [1.0.0] - 2026-08-19

### Added

- VitePress documentation infrastructure
- User Manual with 30+ documentation pages
- Search functionality (VitePress local search)
- PDF generation pipeline (Playwright)
- In-app manual viewer (React iframe integration)
- Custom theme with Inventory Gear branding
- 66 screenshots (light + dark themes) integrated

### Documented Modules

- Getting Started (Introduction, Installation, Login, First Steps)
- Dashboard overview
- Inventory (Products, Categories & Brands, Warehouses, Stock & Movements, Cross References)
- Sales (POS, History, Quotes, Returns, Cash Register, Receipts & Closeout)
- Purchasing (Overview, Orders, Receiving, Supplier Products)
- CRM (Overview, Customers, Vehicles & Compatibility, Reminders & Warranties, Credit & Notes)
- Part Finder (Vehicle-to-Part Search)
- Reports (Executive, Sales, Inventory, Purchasing, Customers, KPIs)
- Administration (Overview, Users & Roles, Settings, Database, Diagnostics)
- Settings & Help
- Troubleshooting
- Developer (Architecture, Development Guide, Testing)

### Infrastructure

- `docs-site/` — VitePress source directory
- `docs-site/.vitepress/config.ts` — VitePress configuration with Inventory Gear theme
- `docs-site/.vitepress/theme/` — Custom CSS and theme
- `scripts/build-docs.mjs` — Build + copy script
- `scripts/generate-pdf.mjs` — PDF generation with Playwright
- `src/features/manual/manual-page.tsx` — React wrapper for in-app manual
- `/manual` route in application
- Sidebar entry for User Manual

### Commands Added

- `npm run docs:dev` — VitePress dev server
- `npm run docs:build` — Build documentation
- `npm run docs:preview` — Preview built docs
- `npm run docs:pdf` — Generate PDF manual
