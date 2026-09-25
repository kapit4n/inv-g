# Milestone 16 — Product Equivalents

**Status:** Complete (`616a168`)

## Summary

Added a first-class **Product Equivalents** relationship: two products that are
interchangeable (the same part under a different brand, SKU, or supplier) are
linked so the catalog and the register can treat them as substitutes. Backed by
a one-to-one `product_equivalents` table (additive schema migration v14 → v15),
it is surfaced in three places: a new **Equivalents** tab in the Product 360°
view, an in-stock substitute panel at the POS when a product is tapped out of
stock, and a **Productos equivalentes** sheet in the Excel import/export
workbook so relationships can be bulk-loaded.

## Deliverables

### Backend (Rust / Tauri)
- `src-tauri/src/commands/equivalents.rs` (new, registered in `lib.rs`):
  `get_product_equivalents`, `add_product_equivalent`,
  `remove_product_equivalent`. `add` rejects self-references, unknown product
  ids, and duplicate pairs in either order; `remove` errors on a missing
  relationship id. Results carry the equivalent's name, sku, brand, category,
  stock, unit, prices, tax rate, and `is_active` for immediate UI use. 4 unit
  tests.
- `src-tauri/src/db/schema.rs`: additive migration v14 → v15 creates
  `product_equivalents` with a unique `(product_id, equivalent_product_id)`
  pair and FK cascade; existing product prices are untouched. Migration test
  `migration_v14_to_v15_adds_equivalents_and_preserves_prices`.
- `src-tauri/src/commands/import_export.rs`:
  - `SHEET_EQUIVALENTES` ("Productos equivalentes") with 5 columns
    (Producto, SKU producto, Producto equivalente, SKU equivalente, Nota);
    matching by SKU (cols B and D).
  - `parse_equivalents_sheet`, header detection, per-row validation
    (unknown SKU or self-reference blocks the import), duplicate-pair skip.
  - Export and the downloadable template write the sheet (template includes an
    example row); preview exposes `equivalent_count`, execute reports
    `equivalent_created`.
  - Demo catalog workbook regenerated with the sheet and an example pair
    (860067 ↔ 860068).
  - Tests: parse, unknown-SKU rejection, new-product reference, existing-pair
    skip, export sheet contents, demo-workbook row count.

### Frontend (React / TypeScript)
- `src/types/index.ts`: `ProductEquivalent`; `ProductForPos.equivalentCount`
  (already present) drives the POS affordance.
- `src/types/inventory.ts`: `ImportPreview.equivalentCount` and
  `ImportResult.equivalentCreated`.
- `src/lib/tauri.ts`: `getProductEquivalents`, `addProductEquivalent`,
  `removeProductEquivalent` wrappers.
- `src/features/inventory/components/product-equivalents-tab.tsx` (new): lists
  equivalents as info cards (sku, brand, category, stock, sale/wholesale price,
  note, inactive flag); search-and-pick to link via `getProducts`; delete to
  unlink; invalidates on change.
- `src/features/inventory/pages/product-detail-page.tsx`: **Equivalents** tab
  registered between Identifiers and Activity.
- `src/features/sales/pages/pos-page.tsx`:
  - Tapping an out-of-stock product with equivalents opens an inline panel
    listing active, in-stock substitutes; choosing one adds it to the cart and
    closes the panel (reuses the existing inline-Card dialog pattern).
  - Checkout success now also invalidates `["global-product-search"]` (the
    actual POS search key) alongside the existing sales/closeout/dashboard
    keys, so stock stays fresh.
- `src/features/inventory/pages/import-export-page.tsx`: preview and result
  show an "Equivalents created" count.
- i18n: `inventory.equivalents.*`, `inventory.product360.tabs.equivalents`,
  and `sales.equivalents*` in both `es` and `en`.

### Tests
- `tests/unit/components/product-360-tabs.test.tsx`: 3 new
  `ProductEquivalentsTab` cases (empty state, render fields, inactive flag);
  tauri mock extended with the equivalents functions.
- `tests/unit/components/pos-page.test.tsx`: 2 new POS cases (offers in-stock
  equivalents; adds the chosen equivalent to the cart); the existing
  out-of-stock case now asserts the empty-substitute panel. `equivalentCount`
  added to fixtures and `getProductEquivalents` to the mock.
- Rust: equivalents (4), schema migration (1), and import/export equivalents
  tests all pass.

### Docs
- New `docs-site/inventory/product-equivalents.md` (full guide, spreadsheet
  format, POS workflow), added to the sidebar in
  `docs-site/.vitepress/config.ts`; cross-links from Products,
  Import/Export, Cross References, and POS.
- `docs/CHANGELOG.md` and `docs/ROADMAP.md` updated.

## Files created

- `src-tauri/src/commands/equivalents.rs`
- `src/features/inventory/components/product-equivalents-tab.tsx`
- `docs-site/inventory/product-equivalents.md`
- `docs/progress/MILESTONE_16.md` (this file)

## Files modified

- `src-tauri/src/lib.rs`, `src-tauri/src/commands/mod.rs`,
  `src-tauri/src/commands/sales.rs`, `src-tauri/src/commands/import_export.rs`,
  `src-tauri/src/db/schema.rs`
- `src/lib/tauri.ts`, `src/types/index.ts`, `src/types/inventory.ts`
- `src/features/inventory/pages/product-detail-page.tsx`,
  `src/features/inventory/pages/import-export-page.tsx`,
  `src/features/sales/pages/pos-page.tsx`
- `src/i18n/locales/{es,en}/inventory.json`,
  `src/i18n/locales/{es,en}/sales.json`
- `docs-site/.vitepress/config.ts`, `docs-site/inventory/products.md`,
  `docs-site/inventory/import-export.md`, `docs-site/sales/pos.md`
- `docs-site/public/samples/inventory-gear-product-import-example.xlsx`
- `docs/CHANGELOG.md`, `docs/ROADMAP.md`
- `tests/unit/components/pos-page.test.tsx`,
  `tests/unit/components/product-360-tabs.test.tsx`

## Verification

- `npx tsc --noEmit` — clean.
- `npm run lint` — 0 errors (only pre-existing `any`/unused warnings in tests).
- `npm test` — 58 files, 457 tests, all pass (incl. 3 new tab + 3 new/updated
  POS cases).
- `cargo test` — 127 pass. The 2 failures
  (`config::tests::test_default_config`,
  `config::tests::test_config_default_profile_db_file`) are **pre-existing and
  environment-dependent**: `AppConfig::default()` reads the machine's
  `~/.local/share/inventory-gear/profile.json`, which is set to
  `single-store` on this machine, so they expect `default`. Unrelated to this
  milestone (`config.rs` is untouched); the equivalents/import/sales/schema
  tests all pass.
- `npm run docs:build` — succeeds.

## Known issues

- The two `config.rs` tests above fail on any machine whose persisted active
  profile is not `default`; they are not hermetic (worth a future fix to inject
  a temp data dir).
