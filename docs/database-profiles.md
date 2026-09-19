# Database Profiles

> Companion to the pre-implementation assessment in
> [`database-profiles-assessment.md`](./database-profiles-assessment.md) and the
> task checklist in [`database-profiles-progress.md`](./database-profiles-progress.md).

Database profiles let a single Inventory Gear install switch between **four
development/test databases** without touching production data:

| Profile        | DB file                 | Stores | Purpose |
| -------------- | ----------------------- | ------ | ------- |
| `default`      | `inventory_gear.db`     | 4      | Legacy/production behaviour (unchanged) |
| `single-store` | `inventory-gear-single.db` | 1   | Single-store business; store-management UI hidden |
| `multi-store`  | `inventory-gear-multi.db` | 3   | Multi-store; transfers, per-store reports, store selector |
| `empty`        | `inventory-gear-empty.db` | 0   | Fresh app: no business data; only users/roles/settings |

## What is it for?

- **Development**: test every business shape (`0 / 1 / 3+` stores) against a
  deterministic dataset.
- **Tests**: ability to mount either posture in Vitest/Rust tests.
- **Feature gating**: the UI and backend derive *capabilities* from the active
  database, so the app never shows multi-store-only features on a single store.

## How to Access

The app opens the database for the **active profile**. Resolution order:

1. Environment variable `IG_DATABASE_PROFILE` (e.g. `IG_DATABASE_PROFILE=single-store npm start`).
2. `profile.json` in the app data directory
   (`~/.local/share/inventory-gear/` on Linux, `%APPDATA%/inventory-gear/` on Windows).
3. `default` (no profile).

DB files all live in the same app data directory:

```
~/.local/share/inventory-gear/
├── inventory_gear.db              ← default
├── inventory-gear-single.db
├── inventory-gear-multi.db
├── inventory-gear-empty.db
└── profile.json                   ← "default" | "single-store" | "multi-store" | "empty"
```

## How to Use

### Switching with npm scripts

```bash
npm run db:single-store    # create (if missing) + point the app at the single-store DB
npm run db:multi-store     # multi-store DB
npm run db:empty           # empty DB
npm run db:default         # back to the legacy database

# Resetting a profile DB to a blank file (safe: only that profile's file is deleted):
npm run db:reset:single-store
npm run db:reset:multi-store
npm run db:reset:empty

# Seeding business data into an *existing* schema (created on first app launch):
npm run db:seed-single-store
npm run db:seed-multi-store
npm run db:seed-empty
```

> [!IMPORTANT]
> `--reset` deletes **only the profile's own DB file** (plus its `-wal`/`-shm`
> sidecars). It never touches `inventory_gear.db` or any other profile's DB.
> A schema-less profile DB is created empty; the Rust app creates the schema on
> first launch, after which the TSX seeder can populate business seed data.

### Switching inside the app (dev builds)

1. Go to **Settings → Developer Tools**.
2. Pick a profile chip. The app writes `profile.json` and asks for a restart.
3. Restart the app; it opens the selected database.

`switch_database_profile` is compiled out for release builds (`cfg!(debug_assertions)`),
so production users cannot switch profiles from the UI.

### Behaviour per profile

| Feature | `default` | `single-store` | `multi-store` | `empty` |
| ------- | :-------: | :------------: | :-----------: | :-----: |
| Store selector in top bar | – | – | ✓ | – |
| Warehouses / Storage Locations menu | ✓ | – | ✓ | – |
| Store Transfers (`/inventory/transfers`) | – | – | ✓ | – |
| Dashboard: Sales by Store / Inventory by Store | – | – | ✓ | – |
| POS checkout store | only store | only store | selected store | only store |
| Per-store reports (Reports → Warehouses) | ✓* | – | ✓ | – |
| Seed data | full | full | full | users/roles/settings only |

\* `default` keeps its legacy multi-warehouse posture; capabilities are derived
from the number of active warehouses, so a hand-built single-warehouse DB reports
the same single-store posture.

## Capabilities

Central backend model (`BusinessCapabilities`), derived once from the connected
DB (active warehouse count) and returned by `get_business_context`:

| Capability | Meaning |
| ---------- | ------- |
| `multiStore` | store count ≥ 2 |
| `storeSelection` | user can switch store in the top bar (multi-store) |
| `storeManagement` | show warehouses / storage-locations / warehouse module |
| `storeTransfers` | enable `/inventory/transfers` |
| `crossStoreReports` | enable per-store dashboard widgets and Reports → Warehouses |

The frontend mirrors these in a zustand store
(`src/stores/business.store.ts`) hydrated at startup. Before hydration it uses a
conservative single-store view so no multi-store UI flashes.

## Seeding

- Rust (`src-tauri/src/db/seed.rs`): profile-aware on app init.
  `single-store` → 1 warehouse + locations, all products in it;
  `multi-store` → 3 warehouses with products round-robined;
  `empty` → no business tables (only users/roles/permissions/settings).
- TSX seeder (`database/seed/`): `--profile <name>` flag.
  - `warehouses` builds the exact store set per profile.
  - `locations` derives warehouses dynamically.
  - `transfers` is skipped when there are fewer than 2 warehouses.
  - `empty` skips business seeding entirely.

## Backend enforcement

Multi-store-only commands (`transfer_inventory_between_stores`, `get_store_sales`,
`get_store_inventory`) validate the capability **server-side** and fail with
stable, translatable error codes even if the UI is bypassed:

`ERROR_MULTI_STORE_REQUIRED` · `ERROR_STORE_REQUIRED` · `ERROR_STORE_NOT_FOUND` ·
`ERROR_TRANSFER_SAME_STORE` · `ERROR_DEV_ONLY`

`process_checkout` resolves the store via `warehouse_id` (explicit in multi-store,
the only store otherwise).

## Known limitations

- **Single global stock**: `products.stock_quantity` is per product, not per store.
  A transfer reassigns the product's home warehouse and creates
  `transfer_out`/`transfer_in` movements, but the remaining stock counter is global.
- **No per-user store assignment**: store selection is shared per session
  (localStorage `ig.currentStoreId`), not per user (RBAC).
- **Dev tool**: switching requires a restart and is intentionally a development
  convenience, not a runtime production feature.

## Related

- [`database-profiles-assessment.md`](./database-profiles-assessment.md)
- [`database-profiles-progress.md`](./database-profiles-progress.md)
- `src-tauri/src/config.rs` · `src-tauri/src/commands/business.rs`
- `scripts/database/profile.mjs`