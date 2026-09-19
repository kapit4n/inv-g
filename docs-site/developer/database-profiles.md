# Database Profiles

> Developer reference for the `default`, `single-store`, `multi-store` and
> `empty` database profiles. User-facing docs live in the app; this page covers
> the implementation and the day-to-day dev workflow.

## What is it?

A profile is a pointer (`profile.json` in the app data dir, or the
`IG_DATABASE_PROFILE` env var) that tells Inventory Gear **which SQLite database
to open**. Each profile has its own DB file, so developers can test the three
business postures side by side without touching the legacy `inventory_gear.db`.

| Profile        | DB file                    | Stores |
| -------------- | -------------------------- | ------ |
| `default`      | `inventory_gear.db`        | 4      |
| `single-store` | `inventory-gear-single.db` | 1      |
| `multi-store`  | `inventory-gear-multi.db`  | 3      |
| `empty`        | `inventory-gear-empty.db`  | 0      |

## How to Access

```bash
npm run db:single-store    # point the app at the single-store DB
npm run db:multi-store
npm run db:empty
npm run db:default         # back to the legacy DB

npm run db:reset:single-store   # delete only that profile's DB file (safe)
npm run db:seed-single-store    # seed business data into an existing schema
```

Or set the env var for a one-off run:

```bash
IG_DATABASE_PROFILE=multi-store npm run dev:tauri
```

Resolution order: `IG_DATABASE_PROFILE` env var → `profile.json` in the data dir →
`default`. Unknown profiles fall back to `default`.

## How it works

**Rust side**
- `src-tauri/src/config.rs` — profile constants, `read_active_profile` /
  `write_active_profile`, `profile_db_file_name`, platform-aware `data_dir()`.
- `src-tauri/src/db/connection.rs` — `init_database_with_profile` opens the right
  file; `DbState` carries the profile for the business commands.
- `src-tauri/src/db/seed.rs` — profile-aware seeding on first init.
- `src-tauri/src/commands/business.rs` — `get_business_context` /
  `get_business_capabilities`, `transfer_inventory_between_stores`,
  `get_store_sales`, `get_store_inventory`, and the dev-only
  `switch_database_profile`.

**Capabilities** are derived from the connected DB (active warehouse count), not
from the profile string, so a hand-built DB reports the posture that matches its
data. The backend enforces multi-store-only commands server-side with stable
error codes (`ERROR_MULTI_STORE_REQUIRED`, `ERROR_STORE_REQUIRED`,
`ERROR_STORE_NOT_FOUND`, `ERROR_TRANSFER_SAME_STORE`, `ERROR_DEV_ONLY`).

**Frontend side**
- `src/stores/business.store.ts` — hydrated at startup via `getBusinessContext`;
  `capabilities()` falls back to a conservative single-store view until loaded.
- `src/components/store-selector.tsx` — top-bar selector, rendered only when
  `storeSelection` is enabled; preference persisted in `ig.currentStoreId`.
- `src/layouts/sidebar.tsx` — hides Warehouses / Storage Locations / Transfers
  based on capabilities.
- `src/features/inventory/pages/transfers-page.tsx` — `/inventory/transfers`.
- Dashboard per-store widgets and the Settings → Developer Tools card.

## Seeding

- Rust seeder (`seed_database_with_profile`): `single-store` → 1 warehouse and
  all products in it; `multi-store` → 3 warehouses with products round-robined;
  `empty` → no business tables.
- TSX seeder (`database/seed/`): accept `--profile`; `warehouses`/`locations`
  build the target store set, `transfers` is skipped below 2 warehouses, `empty`
  skips business data.
- A fresh profile DB is schema-less until the app's first launch creates the
  schema, after which `npm run db:seed:*` can populate it.

## Considerations

- **Dev only.** `switch_database_profile` is gated by `cfg!(debug_assertions)`;
  release builds always open `profile.json`'s database and cannot switch from the UI.
- **Switching requires a restart** — the app caches the DB handle at startup.
- **Never deletes data.** Resetting a profile removes only that profile's DB file,
  never the legacy DB or other profiles.
- Tracked limitation: `products.stock_quantity` is a single global counter; store
  transfers reassign a product's home warehouse and log movements without a
  per-warehouse stock cell.

## Related

- Architecture: [Architecture](./architecture)
- Testing: [Testing](./testing)
- Project docs: `docs/database-profiles.md`, `docs/database-profiles-assessment.md`