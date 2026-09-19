# Database Profiles — Progress Tracking

> Milestone companion document. Checklist below is the agreement from the task
> brief (section 19) and MUST stay accurate. Each item is checked only once
> completed and committed.

## Phase 1 — Architecture

- [x] 1.1 Confirm that single-store/multi-store maps to the existing `warehouses` model (assessment: `warehouses` == stores; `products.warehouse_id`; one global `stock_quantity` — documented limitation).
- [x] 1.2 Define the capability model: `multiStore`, `storeSelection`, `storeManagement`, `storeTransfers`, `crossStoreReports` derived from store count (single source of truth).
- [x] 1.3 Lock the profile resolution order: env var `IG_DATABASE_PROFILE` → `profile.json` in data dir → `default`.
- [x] 1.4 Confirm dev-only nature of profile switching (Settings → Developer Tools + npm scripts) and that restart is required to switch.

## Phase 2 — Database Profiles

- [x] 2.1 `src-tauri/src/config.rs` resolves an active profile (`default`, `single-store`, `multi-store`, `empty`) and picks the corresponding DB file (`inventory_gear.db`, `inventory-gear-single.db`, `inventory-gear-multi.db`, `inventory-gear-empty.db`) next to the existing DB.
- [x] 2.2 Profile persists in `profile.json` in the data dir; env var `IG_DATABASE_PROFILE` overrides it; unknown profile falls back to `default`.
- [x] 2.3 **single-store**: seeding produces exactly 1 warehouse + its locations; all products live in that warehouse.
- [x] 2.4 **multi-store**: seeding produces 3 warehouses (different cities), locations and product distribution across them; business seed produces sales/movements/transfers across stores.
- [x] 2.5 **empty**: no warehouses/locations/products/categories/brands/suppliers and no business data; only users/roles/permissions/settings are seeded.
- [x] 2.6 Switching profile never deletes any DB file; it only points the app at a different file.
- [x] 2.7 TSX seeder (`database/seed/*`) is profile-aware: `warehouses` builds exactly the target store set, `locations` derives warehouses dynamically, `transfers` skipped when < 2 warehouses, `empty` skips business data.

## Phase 3 — Application Capabilities

- [x] 3.1 Rust `BusinessCapabilities` struct + `get_business_capabilities`/`get_business_context` command returning `{ activeProfile, databasePath, multiStore, storeCount, stores, defaultStoreId, capabilities }`.
- [x] 3.2 Capabilities derived centrally from the connected DB (warehouse count), not from ad-hoc profile string checks.
- [x] 3.3 Frontend mirror: zustand business store + `useBusinessCapabilities()` hook + API wrappers in `src/lib/tauri.ts`.
- [x] 3.4 Business store hydrates before/with other app stores; defaults to the conservative single-store view until loaded.
- [x] 3.5 RBAC review documented: user↔warehouse assignment does not exist; store selection is shared, not per-user (limitation recorded).

## Phase 4 — UI

- [x] 4.1 StoreSelector in the top bar rendered only when `storeSelection` is enabled (multi-store); current store shown, persisted per session (localStorage).
- [x] 4.2 Sidebar gating: hide `inventory.warehouses`, `inventory.storageLocations` when `storeManagement` is off; hide Transfers when `storeTransfers` is off.
- [x] 4.3 Routes: `/inventory/transfers` added and only reachable when `storeTransfers`; using the existing movement/warehouse UI patterns.
- [x] 4.4 POS: `processCheckout` receives `warehouseId` = selected store (or the only store in single-store).
- [x] 4.5 Dashboard: multi-store-only widgets (Sales by Store, Inventory by Store) rendered only when `multiStore`.
- [x] 4.6 Settings: Developer Tools / Database Profile card, visible only in dev mode and to users with `admin.settings.manage`, showing the active profile and restart-after-switch flow.
- [x] 4.7 i18n keys added in `es` and `en` for all new UI (selector, transfers, dev tools, widgets).

## Phase 5 — Backend

- [x] 5.1 `transfer_inventory_between_stores` command implemented at product level (movements + warehouse re-assignment) and **fails safely** on single-store with a consistent translatable app error.
- [x] 5.2 Store-aware POS: checkout enforces the store is provided; single-store uses the only store.
- [x] 5.3 New report/commands for stores: per-store sales summary and per-store inventory summary (multi-store only).
- [x] 5.4 All multi-store-only commands validate capability server-side; single-store DBs reject them regardless of frontend state.
- [x] 5.5 `get_business_context` used by the frontend to gate features; consistent error contract (`AppError`-style strings) for all business commands.

## Phase 6 — Testing

- [x] 6.1 Rust tests: profile resolution (env override, file fallback, unknown→default), capability derivation (0/1/3 warehouses), transfer blocked on single-store, switch command behaviour.
- [x] 6.2 Vitest: capability store/hook unit tests, StoreSelector behaviour, sidebar gating by capability, dashboard widgets hidden on single-store.
- [x] 6.3 Tauri command-contract tests extended for `getBusinessContext`/`switchDatabaseProfile`/`transferInventoryBetweenStores`.
- [x] 6.4 Additive-only: existing tests keep passing (no existing behaviour regressed).

## Phase 7 — Documentation

- [x] 7.1 `docs/database-profiles-assessment.md` written **before** implementation (done).
- [x] 7.2 `docs/database-profiles.md` written (what each profile is, how to switch, how to reset, behaviour matrix, capabilities, seeding, testing).
- [x] 7.3 `docs-site/` page for database profiles (if applicable per docs rule) — link from developer section.
- [x] 7.4 `docs/CHANGELOG.md` entry added.
- [ ] 7.5 `docs/IMPLEMENTATION_STATUS.md` items checked.

## Final Verification (regression gate)

- [ ] App runs against **single-store** DB: no selector, no transfers, POS + inventory work, dashboards render.
- [ ] App runs against **multi-store** DB: selector works, transfers work, cross-store widgets render, POS records per store.
- [ ] App runs against **empty** DB: boots, login works, no business data.
- [x] `npm run verify` passes (typecheck → lint → vitest → rust test).
- [x] No POS or inventory regression on the legacy `default` DB.

## Known Limitations (tracked)

- Products have a **single global** `stock_quantity`; there are no per-warehouse
  stock cells. Store transfers reassign the product's home warehouse and log
  movements, but the remaining stock counter is global.
- No user↔warehouse assignment; store selection is shared across users of the
  same device/session.
- Profile switching is a **development tool**; production users should stick to
  `default` (or the profile configured by an operator), and switching requires a
  full app restart.