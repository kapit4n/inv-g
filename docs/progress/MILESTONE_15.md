# Milestone 15 — Per-Product Pricing & Gains

**Status:** Complete (`40a77d0`, 2026-09-24)

## Summary

Introduced a real pricing engine: every product has an optional **gain margin**
(`% de ganancia`) and an optional **manual price override** (`Precio editado`).
The sale price is the **effective price** — the edited price if set, otherwise a
price **suggested from cost** using the product's margin or, when empty, the
**global default** configured in Settings → Business. Legacy prices were
preserved through a back-calculating additive migration, Excel import/export
gained the two new columns (`% de ganancia`, `Precio editado`), and pricing
changes are audited.

## Deliverables

### Backend (Rust / Tauri)
- Pricing domain `src-tauri/src/pricing.rs` (registered in `lib.rs`):
  `DEFAULT_MARGIN_VALUE = 30`, suggested = `round2(cost × (1 + margin/100))`,
  effective margin = own ?? global, effective price = edited ?? suggested,
  margin range `0..=90`, `is_non_negative`; 10 unit tests.
- Schema v14 (`src-tauri/src/db/schema.rs`): additive migration adds
  `profit_margin_pct REAL` and `edited_price REAL` after `updated_at` and
  **back-calculates implied margins** for existing products (cost > 0 →
  margin from cost/sale; cost ≤ 0 → `edited_price = sale_price`), so #34
  ("preserva precio al volver a guardar") holds without manual edits. Migration
  test `migration_from_previous_version_is_additive_and_preserves_prices`.
- Seeds (`seed.rs` + `scripts/database/seed-demo-catalog.mjs`): demo catalog now
  stores the implied margin per product (no edited price).
- `commands/inventory.rs`: `create_product` / `update_product` are now
  authoritative — the frontend sends `profitMarginPct` + `editedPrice`
  (numbers or `null`); the backend computes and stores the **effective price**;
  margin `null` = follow global. Helpers `map_product_row` (31 columns),
  `validate_pricing_inputs`, `resolve_sale_price`; audit rows
  (`create_product`, `product_pricing_updated`) written when `created_by` is
  present.
- `commands/admin/settings.rs`: updating `default_margin_percent` triggers
  `reprice_following_global_default` (re-prices products with no own margin/
  edited price); `update_app_setting` / `update_app_settings_bulk` accept
  `created_by` and audit (`update_setting`, entity `setting`).
- `commands/import_export.rs`: 29-column layout — `% de ganancia` (14) and
  `Precio editado` (15) inserted after `Precio sugerido` (13). Import pricing
  precedence: edited → margin → legacy sale price (stored as edited) → existing
  / suggested from global. Export writes the raw stored values (round-trip).
  Demo workbook regenerated; 10 tests.

### Frontend (React)
- `src/lib/pricing.ts` domain mirror (+ `tests/unit/lib/pricing.test.ts`).
- `src/types/inventory.ts`: `profitMarginPct`, `editedPrice`, `suggestedPrice`,
  `effectiveMarginPct`.
- Product list: `Precio sugerido` + `% de ganancia` columns.
- Product form: gain % field (empty = global, hint shows the global value),
  edited price (empty = auto), live suggested / configured-margin / effective
  price summary, below-cost warning; global margin from the app-settings store
  (`default_margin_percent`, fallback 30).
- Product 360° Pricing tab: realized margin **over cost**, configured margin,
  suggested / edited (`Auto`) / effective price rows.
- Admin settings page passes `user.id` for audit; i18n (es/en) pricing keys in
  `inventory.json` + `marginRange` validation key.

### Testing
- `cargo test --lib`: 118 passed (2 pre-existing `config` failures, NOT from
  this milestone — verified on a clean tree).
- Vitest: 396 unit + integration/regression/smoke → `npm test` 452 passed (58
  files), lint 0 errors, typecheck clean.

### Documentation
- `docs-site/inventory/products.md` (pricing section, product list columns,
  29-column reference map)
- `docs-site/inventory/import-export.md` (29-column format, pricing precedence,
  legacy-file note)
- `docs/CHANGELOG.md`, `docs/IMPLEMENTATION_STATUS.md`, `docs/ROADMAP.md`,
  `docs/BUG_FIX_LOG.md` (seed deref + reprice return type)

## Files Created/Modified

```
src-tauri/src/pricing.rs                          (new)
src-tauri/src/lib.rs
src-tauri/src/db/schema.rs
src-tauri/src/db/seed.rs
src-tauri/src/commands/inventory.rs
src-tauri/src/commands/admin/settings.rs
src-tauri/src/commands/import_export.rs
scripts/database/seed-demo-catalog.mjs
docs-site/public/samples/inventory-gear-product-import-example.xlsx  (regenerated)
src/lib/pricing.ts                                (new)
src/types/inventory.ts
src/lib/tauri.ts
src/features/inventory/pages/products-page.tsx
src/features/inventory/pages/product-form-page.tsx
src/features/inventory/components/product-pricing-tab.tsx
src/features/admin/pages/admin-settings-page.tsx
src/i18n/locales/{es,en}/inventory.json
src/i18n/locales/{es,en}/validation.json
tests/unit/lib/pricing.test.ts                     (new)
tests/unit/components/product-360-tabs.test.tsx
tests/unit/components/admin-settings-page.test.tsx
docs-site/inventory/products.md
docs-site/inventory/import-export.md
docs/CHANGELOG.md
docs/IMPLEMENTATION_STATUS.md
docs/ROADMAP.md
docs/BUG_FIX_LOG.md
docs/progress/MILESTONE_15.md                      (new)
```

## Known Issues

- Pre-existing `config::tests::test_config_default_profile_db_file` and
  `test_default_config` fail on a clean tree (from the demo-catalog commit),
  unrelated to this milestone.