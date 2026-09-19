# Milestone 14 — Database Profiles (Single-Store / Multi-Store / Empty)

**Status:** Complete

## Summary

Introduced four development/test database profiles — `default`,
`single-store`, `multi-store`, `empty` — each backed by its own SQLite file, so a
single install can test every business posture. Added a capability model derived
from the connected DB (store count), profile-aware seeding (Rust + TSX), store
transfers, per-store reports, a store selector, server-side enforcement of
multi-store-only commands, and i18n for EN/ES.

## Deliverables

### Backend (Rust / Tauri)
- Profile resolution & persistence (`src-tauri/src/config.rs`):
  `IG_DATABASE_PROFILE` env var → `profile.json` in the app data dir → `default`;
  `profile_db_file_name`; platform-aware `data_dir()`; unit tests.
- Profile-aware DB init (`src-tauri/src/db/connection.rs`) & seeding
  (`src-tauri/src/db/seed.rs`): `single-store` → 1 warehouse + locations, all
  products in it; `multi-store` → 3 warehouses with round-robin product
  distribution; `empty` → no business tables.
- New commands module (`src-tauri/src/commands/business.rs`):
  - `get_business_context` / `get_business_capabilities`
  - `transfer_inventory_between_stores` (movements `transfer_out`/`transfer_in`
    + warehouse re-assignment; rejects same-store, insufficient stock,
    product-not-in-store; multi-store only)
  - `get_store_sales`, `get_store_inventory` (multi-store only)
  - `switch_database_profile` (dev-only, writes `profile.json`)
  - 7 unit tests; stable error codes (`ERROR_MULTI_STORE_REQUIRED`, `ERROR_STORE_REQUIRED`,
    `ERROR_STORE_NOT_FOUND`, `ERROR_TRANSFER_SAME_STORE`, `ERROR_DEV_ONLY`)
- Store-aware POS: `process_checkout` resolves the store (`warehouse_id` or the
  only store).

### Seeding & Scripts
- TSX seeder (`database/seed/`): `--profile` flag; `warehouses` builds the exact
  store set, `locations` derives from warehouses, `transfers` skips when < 2
  warehouses, `empty` skips business data.
- `scripts/database/profile.mjs` + `seed-{single-store,multi-store,empty}.mjs`;
  npm `db:*` scripts for switch/reset/seed.

### Frontend (React)
- `src/stores/business.store.ts` + `useBusinessCapabilities` hook + tauri
  wrappers; conservative single-store defaults until hydrated.
- `StoreSelector` in the top bar (multi-store only), persisted per session;
  sidebar/route gating by capability; `/inventory/transfers` page.
- Dashboard per-store widgets; Settings → Developer Tools card (dev builds).
- i18n keys (EN/ES), new `business` namespace.

### Testing
- Rust: 87 tests passing (incl. new business/config tests; fixed a flaky temp-dir
  race in config tests).
- Vitest: 431 tests passing across 55 files (new business-store, business-gating,
  extended command-contracts).
- `npm run verify` green (typecheck → lint 0 errors → vitest → cargo test).

### Documentation
- `docs/database-profiles-assessment.md` (pre-implementation)
- `docs/database-profiles.md` (feature doc)
- `docs/database-profiles-progress.md` (7-phase checklist, all checked)
- `docs-site/developer/database-profiles.md` (+ sidebar entry)
- `docs/CHANGELOG.md`, `docs/IMPLEMENTATION_STATUS.md`, `docs/ROADMAP.md`
  (Phase 12 multi-branch foundation), `docs/BUG_FIX_LOG.md` updated.

## Files Created/Modified

```
src-tauri/src/config.rs
src-tauri/src/db/connection.rs
src-tauri/src/db/seed.rs
src-tauri/src/commands/business.rs          (new)
src-tauri/src/commands/mod.rs
src-tauri/src/lib.rs
src-tauri/src/commands/sales.rs
database/seed/index.ts
database/seed/run.ts
database/seed/warehouses.seed.ts
database/seed/locations.seed.ts
database/seed/transfers.seed.ts
scripts/database/profile.mjs                (new)
scripts/database/seed-single-store.mjs      (new)
scripts/database/seed-multi-store.mjs       (new)
scripts/database/seed-empty.mjs             (new)
package.json
src/types/index.ts
src/lib/tauri.ts
src/lib/business-errors.ts                  (new)
src/stores/business.store.ts                (new)
src/hooks/use-business-capabilities.ts      (new)
src/components/store-selector.tsx           (new)
src/layouts/top-bar.tsx
src/layouts/sidebar.tsx
src/App.tsx
src/routes/index.tsx
src/features/inventory/index.ts
src/features/inventory/pages/transfers-page.tsx  (new)
src/features/sales/pages/pos-page.tsx
src/features/dashboard/pages/dashboard-page.tsx
src/features/settings/pages/settings-page.tsx
src/i18n/config.ts
src/i18n/locales/{en,es}/business.json      (new)
src/i18n/locales/{en,es}/{settings,inventory,dashboard}.json
tests/helpers/setup.ts
tests/unit/stores/business-store.test.ts     (new)
tests/unit/components/business-gating.test.tsx (new)
tests/tauri/command-contracts.test.ts
tests/unit/components/dashboard-page.test.tsx
docs/database-profiles-assessment.md         (new)
docs/database-profiles.md                    (new)
docs/database-profiles-progress.md           (new)
docs/CHANGELOG.md
docs/IMPLEMENTATION_STATUS.md
docs/ROADMAP.md
docs/BUG_FIX_LOG.md
docs-site/developer/database-profiles.md     (new)
docs-site/.vitepress/config.ts
```

## Known Issues

- Single global `stock_quantity` (no per-store stock cells); transfers reassign
  the product home warehouse + log movements.
- No per-user store assignment; selection is shared per session.
- Profile switching is a dev tool and requires a restart to take effect.