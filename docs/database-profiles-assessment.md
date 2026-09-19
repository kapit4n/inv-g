# Database Profiles — Pre-Implementation Assessment

> **Status:** Completed before implementation (Milestone for DB profiles).
> **Date:** 2026-09-18

## 1. Purpose

Identify how Inventory Gear currently models stores/branches/locations so that
three development/test database profiles can be added with minimal risk:

- **single-store** — one store, simplified UI (no store selector, no transfers)
- **multi-store** — 2–3 stores, store selector, transfers, cross-store reports
- **empty** — no business/transactional data (fresh app, schema + base data only)

## 2. Where the business model lives today

There is **no `stores` / `branches` table**. The store concept is the **`warehouses`**
table. These are the only warehouse/stock bindings in the schema:

| Table | Column | Notes |
| --- | --- | --- |
| `warehouses` | — | `name`, `code`, `address`, `city`, `state`, `is_active` |
| `products` | `warehouse_id` | **nullable**, single warehouse per product |
| `products` | `stock_quantity` | **single global quantity** per product (no per-warehouse rows) |
| `sales` | `warehouse_id` | nullable; written from `process_checkout` input |
| `purchase_orders` | `warehouse_id` | nullable |
| `inventory_movements` | `warehouse_id` | movements carry a warehouse |
| `storage_locations` | `warehouse_id` | bins/zones per warehouse |

**Consequence:** a store == a warehouse. A product has one home warehouse and
one global stock counter. Cross-store transfers therefore move a product's
warehouse assignment (plus transfer movements), not per-warehouse stock cells.

## 3. How data is seeded today

There are **two independent seeders**, both of which must become profile-aware:

1. **Rust auto-seed** — `src-tauri/src/db/seed.rs`. Runs inside `init_database`
   only when the `users` table is empty. Seeds users/roles/permissions/settings,
   then 3 warehouses (`WH-001..WH-003`), storage locations and 15 products
   (`warehouse_id` hard-coded to `1`). Also unconditionally seeds
   settings/printers/devices/licence/update records (idempotent).
2. **TSX business seeder** — `database/seed/`. CLI driven (`run.ts`, via
   `npx tsx`), triggered from the app ("Seed Demo Data") or manually. Seeds
   categories/brands/suppliers/4 warehouses (`WH-001..WH-004`)/locations/≈200
   products/customers/vehicles/sales/movements/transfers/quotes/etc., only when
   counts are below thresholds. **Assumes a warehouse set already exists** and
   picks warehouses at random.

Gaps observed in the TSX seeder that break single-store:
- `warehouses.seed.ts` unconditionally adds up to 4 warehouses.
- `locations.seed.ts` hard-codes `warehouse_id` 1–4.
- `transfers.seed.ts` will **infinite-loop** when only 1 warehouse exists
  (`while (toWh.id === fromWh.id)`).

## 4. Where store selection / capabilities would plug in (frontend)

- **Top bar** (`src/layouts/top-bar.tsx`) shows `store_name` from settings; no
  store selector exists.
- **Sidebar** (`src/layouts/sidebar.tsx`) is a static `navigation` array (incl.
  `inventory.warehouses`, `inventory.storageLocations`); no capability gating.
- **POS** (`src/features/sales/pages/pos-page.tsx`) builds a
  `CheckoutInput` with `customerId`, `items`, `payments`, `notes` — it never
  passes `warehouseId`, although `CheckoutInput.warehouseId?` exists and
  `process_checkout` (sales.rs) already persists it.
- **Dashboard** uses `getDashboardWidgets`/`getPurchaseDashboard`/
  `getCrmDashboard`/`getDashboardStats`; no per-store widgets.
- **Settings page** renders setting groups; no developer-tools section.
- **Auth/RBAC**: permissions + roles seeded; **no user↔warehouse assignment**
  exists anywhere (documented as a limitation).
- App-wide state is zustand (`src/stores/*`), APIs are thin wrappers over
  `invoke` in `src/lib/tauri.ts`, and `tests/helpers/setup.ts` mocks the whole
  tauri module per test.

## 5. Architecture decisions (locked during assessment)

1. **Reuse `warehouses` as stores.** No new `stores` table, no migrations, no
   schema version bump. Capabilities are **derived from the data** (warehouse
   count) rather than parsed from a config string scattered through the app.
2. **Profile is resolved once at startup** via (in precedence order):
   env var `IG_DATABASE_PROFILE` → `profile.json` in the data dir → default.
   The profile decides which `.db` file to open and how to seed. Restart is
   required to switch; the app never deletes or migrates another profile's DB.
3. **Two-tier enforcement.** The frontend hides single-store-irrelevant UI, but
   every multi-store-only **Rust command** validates the capability itself and
   returns a consistent error string so a malicious/caller bypass can't mix
   stores (single-store) or requires an explicit store.
4. **Capabilities are centralized**: one Rust struct
   `BusinessCapabilities { multiStore, storeSelection, storeManagement,
   storeTransfers, crossStoreReports }`, exposed via `get_business_context`,
   mirrored by a zustand store + `useBusinessCapabilities()` hook on the
   frontend. No `if (profile === "single-store")` checks spread through views.
5. **Known limitation, documented:** no per-warehouse stock rows. Multi-store
   transfers reassign the product's home warehouse and log movements; store
   sales are recorded per store but stock remaining is global.

## 6. DB files and profiles

| Profile | DB file (in data dir, next to `inventory_gear.db`) | Warehouses | Store selector | Transfers | Cross-store reports |
| --- | --- | --- | --- | --- | --- |
| `default` (legacy) | `inventory_gear.db` | 3 | — | — | — |
| `single-store` | `inventory-gear-single.db` | **1** | no | hidden (backend blocks) | hidden |
| `multi-store` | `inventory-gear-multi.db` | **3** | yes | yes | yes |
| `empty` | `inventory-gear-empty.db` | 0 | no | hidden | hidden |

> `default` keeps the current behaviour byte-for-byte; the profiles are opt-in.

## 7. Seeding plan per profile

- **Rust auto-seed** becomes profile-aware: `single-store` creates exactly one
  warehouse + its locations; `multi-store` creates three; `empty` skips
  warehouses/locations/products/categories/brands/suppliers (but still creates
  users/roles/permissions/settings).
- **TSX seeder** becomes profile-aware: `single-store` guarantees one warehouse,
  locations are generated from whatever warehouses exist, and the transfers
  seed is skipped when fewer than two warehouses exist. `empty` skips business
  data. `default` keeps current thresholds.

## 8. Scope of work (what gets built)

- **Backend (Rust):** profile resolution in `config.rs`; `commands/business.rs`
  with `get_business_context`, `switch_database_profile`, capability validation,
  `transfer_inventory_between_stores`, and per-store sales/inventory summaries;
  profile-aware seeding; registration in `lib.rs`.
- **TSX seeder:** profile-aware `warehouses`/`locations`/`transfers` seeds and
  `--profile` CLI support; npm `db:*` scripts; `scripts/database/create-profile-db.mjs`.
- **Frontend:** `BusinessCapabilities` types + API wrappers, business store,
  `useBusinessCapabilities` hook, StoreSelector in the top bar, dashboard
  store widgets, transfers page, sidebar/route gating, settings Developer
  Tools card, i18n keys.
- **Tests:** Rust unit tests for profile resolution + capability derivation +
  transfer enforcement; Vitest coverage for capability store/hook, selector,
  gating.
- **Docs:** this assessment, `docs/database-profiles.md`,
  `docs/database-profiles-progress.md`.

## 9. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Transfer loop with 1 warehouse | transfers seed skipped when 1 warehouse; Rust command validates store count |
| Breaking existing DBs | `default` untouched; schema version unchanged (no new tables) |
| Frontend showing wrong features after load | capabilities store hydrates before routes render; features default to the most conservative (single-store) view until loaded |
| Possibility of a caller invoking multi-store commands on single-store DB | every multi-store command validates capabilities server-side |
| Deleting a profile's DB | none of the switch/reset flows delete files; reset only re-creates a fresh empty file |