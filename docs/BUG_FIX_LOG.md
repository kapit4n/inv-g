# Bug Fix Log

## Format

Each entry records: date, symptom, root cause, fix, commit. This log is append-only — add new entries at the top.

---

### 2026-08-13 — Print feature: `usePrint()` crash, A4 paper width misreport, and missing sales locale keys

**Symptom:**
1. Clicking Print on the sale-detail, closeout, or quote pages threw
   `TypeError: print is not a function` (window never opened).
2. `paperWidth("A4")` returned `80mm` instead of `210mm` (A4 documents were
   sized as thermal).
3. The receipt print document title rendered the raw key `receipt` (lowercase)
   instead of a translated label.

**Investigation:**
- `src/hooks/use-print.ts` returned `{ print: fn }` but all three call sites
  (`sale-detail-page.tsx:108`, `closeout-page.tsx:68`, `quote-detail-page.tsx`)
  destructure-free `const print = usePrint()` then invoke `print(document)` —
  so `print` was an object, not a function. This was only surfaced when page
  tests started exercising the print flow.
- `src/lib/print/config.ts` `normalizePaperSize` uppercases `A4` but
  `paperWidth`'s switch had a lowercase `case "a4":`, so the `A4` input fell
  through to the `default` (80mm).
- `t("sales.receipt")` (plus `receiptNumber`, `receiptType`, `printedAt`,
  `receiptPrinted`, `noReceipts`, `details`, `notes`, `payments`, `method`,
  `reference`, `change`, `refundReasonPlaceholder`) were not defined in
  `en|es/sales.json`, so i18n fell back to raw keys in the print dialog and the
  sale-detail page.

**Fix:**
1. `usePrint()` now returns the open function directly (`src/hooks/use-print.ts`),
   matching the call sites; verified by the sale-detail/closeout page tests.
2. `paperWidth` case label corrected to `"A4"` (`src/lib/print/config.ts`).
3. Added the missing `sales.*` keys to `src/i18n/locales/{en,es}/sales.json`.

**Commit:** `6142477`

**Files:** `src/hooks/use-print.ts`, `src/lib/print/config.ts`,
`src/i18n/locales/en/sales.json`, `src/i18n/locales/es/sales.json`

---

### 2026-08-13 — Backups were never actually created; restore/verify did not exist

**Symptom:** `create_backup` only inserted a row into `backup_history` with a fake checksum (`pending_<timestamp>`) and an estimated size — **no backup file was ever written**. `delete_backup` only removed the DB record, leaving orphan files on disk. There was no `restore_backup` command at all (the frontend called nothing), no validation of files (corrupt/empty/missing files were indistinguishable), and the restore UI's Restore button was a disabled placeholder.

**Investigation:**
- `src-tauri/src/commands/admin/backups.rs` computed `checksum = format!("pending_{}", ...)` and `file_size` as a constant/estimate; nothing wrote to disk.
- `delete_backup` never touched the filesystem.
- No restore command existed in `lib.rs` or the command module; `verify_backup` was a stub.
- rusqlite 0.31 exposes the SQLite online backup API via `rusqlite::backup::Backup::new(from: &Connection, to: &mut Connection)` + `run_to_completion(...)`, but only when the `backup` feature is enabled — it was not in `Cargo.toml`.
- No checksum crate was present; `DbState` had no knowledge of the database path, so a real file location could not be resolved.

**Root Cause:** The backup feature was implemented as a data-model placeholder (history row only) without a filesystem artifact, an integrity check, or a restore path. Any user relying on it would have discovered their "backups" were empty rows.

**Fix:**
1. Real file backup: `write_backup` uses the rusqlite backup API to a temp file, then atomically renames; `checksum_file` streams SHA-256 (`sha2` added to Cargo.toml); real `file_size` recorded; failures recorded with status `failed` + error in `notes` and the partial temp file removed.
2. New `verify_backup` command (by `backup_id` or `file_path`) returning `BackupValidation` (SQLite header, `PRAGMA quick_check`, checksum match vs history).
3. New `restore_backup` command: validate-then-restore into the live connection, post-restore integrity check, `restore_history` success/failure record with `error_message`.
4. `delete_backup` now removes the physical file and records `created_by`.
5. `DbState` gained `db_path` so backups resolve next to the database file (`<db dir>/backups`).
6. Frontend: admin-backups-page + admin-restore-page rewritten (verify action, validate-gated restore, confirm dialogs, notifications); `tauri.ts` wrappers `verifyBackup`/`restoreBackup`; mock synced.

**Commit:** `8cfc9fb`

**Files:** `src-tauri/src/commands/admin/backups.rs`, `src-tauri/src/db/connection.rs`, `src-tauri/src/lib.rs`, `src-tauri/Cargo.toml`, `src/lib/tauri.ts`, `src/types/index.ts`, `src/features/admin/pages/admin-backups-page.tsx`, `src/features/admin/pages/admin-restore-page.tsx`, `src/i18n/locales/{en,es}/admin.json`, `scripts/screenshots/helpers/invoke-mock.ts`

---

**Symptom:** In the admin settings editor (`/admin/settings`), any setting with `options` (e.g. `language`, `barcode_format`, `backup_destination`, `business_type`) rendered as a `<select>` with exactly one broken `<option>` whose label looked like `{ options: ["es","en"] }` — the raw JSON string. Selecting the seeded value was impossible because the value string did not match any real option.

**Investigation:**
- The seeder stores `options` as a JSON string, either `["a","b"]` or `{"options":["a","b"]}` (`src-tauri/src/db/seed.rs` `seed_application_settings`).
- The page rendered options with `setting.options.split(",").map(o => o.trim())` (`src/features/admin/pages/admin-settings-page.tsx:70`), which does not parse JSON — it produced one token equal to the entire JSON blob.
- The Rust backend already stored a `validation` column (min/max/length) but neither the backend (`update_app_setting(s)`) nor the page ever enforced it, so an admin could save `tax_rate = -5` or `150` and the value would persist.

**Root Cause:** Frontend option parsing assumed a comma-separated string that the seeder never produced; and value validation was entirely absent on both the Rust write path and the admin UI.

**Fix:**
1. Added a shared `parseSettingOptions` util (`src/lib/settings-utils.ts`) that handles JSON arrays, `{"options":[...]}` objects, and comma-separated fallback; the page now uses it.
2. Added Rust-side validation (`validate_value` in `src-tauri/src/commands/admin/settings.rs`) enforced on `update_app_setting` and `update_app_settings_bulk` (number parse, boolean true/false, allowed-options membership, min/max and length constraints), with full pre-validation so an invalid value never causes a partial bulk write.
3. Added client-side validation with inline error messages; the Save button is disabled while any value is invalid.
4. Added seed `validation` metadata to numeric/length-constrained settings.

**Commit:** `09e723b`

**Files:** `src/features/admin/pages/admin-settings-page.tsx`, `src/lib/settings-utils.ts`, `src-tauri/src/commands/admin/settings.rs`, `src-tauri/src/db/seed.rs`

---

### 2026-07-29 — Reports page crashes with `v.toLocaleString` error; charts and table render empty

**Symptom:** Navigation to the Reports (dashboard) page threw a runtime error `v.toLocaleString` where `v` is undefined. Stack: `fmt@reports-page.tsx:36`. All charts (revenue, sales, etc.) rendered as empty skeletons with "No data". The top-customers table showed hyphens for all columns.

**Investigation:**
- `fmt()` called `v.toLocaleString()` without null guard — if `v` is `null`/`undefined`, it throws.
- The `ReportTable` columns used wrong property names (`header`/`accessorKey`/`cell` instead of `key`/`label`/`renderCell`). The `Column` interface expects `key` + `label` + optional `format`/`renderCell`. Because `col.key` was `undefined`, `row[undefined]` resolved to `undefined`, and `formatValue` returned `"-"` — no crash, but no data either.
- Chart components (`AreaChartCard`, `BarChartCard`, `LineChartCard`, `PieChartCard`, `StackedBarChartCard`) were called without the required `dataKeys` (or `dataKey`/`nameKey`) props. These props define which fields map to axes. Without them, recharts renders nothing.
- `BarChartCard` had an unsupported `horizontal` boolean prop that TypeScript rejected at strict mode.

**Root Cause:** The `reports-page.tsx` was written against a different API than the actual `report-charts.tsx` and `report-table.tsx` components expose. Chart components require `dataKeys`/`dataKey`/`nameKey` props that were never provided; `ReportTable.Column` uses `key`/`label`/`renderCell` but the code used `header`/`accessorKey`/`cell`.

**Fix:**
1. Added `dataKeys` (or `dataKey`/`nameKey` for pie charts) to all 10 chart component calls, mapping the correct data fields for each chart type.
2. Changed `ReportTable` column definitions to use `key`/`label`/`renderCell` matching the `Column` interface.
3. Added null guard to `fmt()`: `v == null ? "$0.00" : v.toLocaleString(...)`.
4. Removed unsupported `horizontal` prop from `BarChartCard`.
5. Added `as unknown as Record<string, unknown>[]` casts to match component prop types (consistent with other report pages).
6. Removed unused `Users` import flagged by TypeScript.

**Commit:** `d0bf1b8`

**Files:** `src/features/reports/pages/reports-page.tsx`

---

### 2026-07-29 — All listing pages show "No hay datos" (inventory, sales, purchases, CRM, reports, admin)

**Symptom:** Every listing page across the entire app (inventory: brands, suppliers, products, categories, warehouses, storage locations; plus sales, purchases, CRM, reports, admin pages) renders "No hay datos" (empty state) despite database containing data. DataTable shows header labels but every cell value is undefined. Some pages appear to partially work (e.g., "New Sale" shows product names) but numeric fields are blank.

**Investigation:**
- All Rust structs throughout every module (`inventory.rs`, `sales.rs`, `purchases.rs`, `customers.rs`, `vehicles.rs`, `crm.rs`, `auth.rs`, `reports/*.rs`, `admin/*.rs`, etc.) derived `Serialize` without `#[serde(rename_all = "camelCase")]`.
- Serde serialized field names as-is (Rust convention: `snake_case`): `is_active`, `cost_price`, `stock_quantity`, `created_at`, `company_name`, `page_size`.
- The frontend TypeScript interfaces all use `camelCase`: `isActive`, `costPrice`, `stockQuantity`, `createdAt`, `companyName`, `pageSize`.
- The DataTable's `accessorKey` and cell renderers access `row["isActive"]` → `undefined` because the actual JavaScript key is `is_active`.
- "New Sale" partially worked because `ProductForPos` fields `id`, `name`, `sku`, `barcode`, `unit` happen to be identical in both conventions — those rendered, but `salePrice`, `stockQuantity` etc. were undefined.

**Root Cause:** A systematic `snake_case` vs `camelCase` mismatch: all ~100+ Rust structs across 34 files in the `commands/` directory lacked `#[serde(rename_all = "camelCase")]`. The frontend TypeScript interfaces consistently use camelCase, but serde serialized with snake_case.

**Fix:**
1. Added `#[serde(rename_all = "camelCase")]` to every struct deriving `Serialize` or `Deserialize` across all 34 files in `src-tauri/src/commands/` (including all subdirectories: `reports/`, `admin/`). Each mismatch that previously produced `undefined` now correctly maps to the expected camelCase key.
2. Changed `DbState.conn` from `Mutex<Connection>` to `Arc<Mutex<Connection>>` so the same DB connection can be shared between the global `DB_STATE` (used by reports) and Tauri's managed state (used by inventory commands). Added `.manage(tauri_state)` to the Tauri builder in `lib.rs`.

**Commit:** `d0bf1b8`

**Files:**
- `src-tauri/src/commands/` — 34 files (all structs gained `#[serde(rename_all = "camelCase")]`)
- `src-tauri/src/db/connection.rs` — `DbState.conn` changed to `Arc<Mutex<Connection>>`
- `src-tauri/src/lib.rs` — added `.manage(tauri_state)` call

---

### 2026-07-29 — `compatibility.seed.ts` uses wrong column names

**Symptom:** Seed failed with `SqliteError: table product_vehicle_compatibility has no column named vehicle_brand`.

**Root Cause:** The `product_vehicle_compatibility` table was rewritten in a schema migration to use foreign-key integer columns (`brand_id`, `model_id`, `engine_id`) instead of the original string columns (`vehicle_brand`, `vehicle_model`, `engine`). The seed file was never updated.

**Fix:** Rewrote `compatibility.seed.ts` to look up FK IDs (lookup `vehicle_brands`, `vehicle_models`, `vehicle_engines` by name) and insert the resolved IDs. Also updated the engine strings in the COMPAT data array to match exact `vehicle_engines.name` values.

**Commit:** `b5ea0cb`

**Files:** `database/seed/compatibility.seed.ts`

---

### 2026-07-29 — `products.seed.ts` deletes all data on re-run

**Symptom:** Re-running the products seed deleted all existing products (and dependents: sales, quotes, movements) and re-inserted from scratch, breaking sales references.

**Root Cause:** The seed used a brute-force approach: `DELETE FROM` on all dependent tables + `DELETE FROM products`, then re-inserted all 129 products. This made re-seeding destructive.

**Fix:** Changed to additive mode — checks if a product already exists by name before inserting. Only inserts missing products. Never deletes.

**Commit:** `b5ea0cb`

**Files:** `database/seed/products.seed.ts`

---

### 2026-07-29 — `customers.seed.ts` bulk-skipped or overwrote customers

**Symptom:** Customer seed used `exists()` check on the whole table — if any customers existed, the entire seed was skipped. When customer count was increased from 150 to 200, existing databases kept the old 150.

**Root Cause:** The `exists()` helper checks if the table has any records. If a Rust seed had created 6 customers, the TypeScript customer seed would skip entirely.

**Fix:** Changed to check by email (unique) — only inserts customers whose email doesn't already exist. Count-based threshold (≥200) as a fast-path guard.

**Commit:** `b5ea0cb`

**Files:** `database/seed/customers.seed.ts`

---

### 2026-07-29 — Duplicate `getProductCompatibility` function

**Symptom:** TypeScript compilation error: `Cannot redeclare exported variable 'getProductCompatibility'` and `Duplicate function implementation`.

**Root Cause:** Two identical `getProductCompatibility` functions existed in `src/lib/tauri.ts` — one at ~line 477 and another later in the file. Likely a merge artifact.

**Fix:** Removed the first occurrence (kept the one in the correct section).

**Commit:** `b5ea0cb`

**Files:** `src/lib/tauri.ts`

---

### 2026-07-29 — `Skeleton` imported from `lucide-react`

**Symptom:** TypeScript compilation error: `lucide-react` does not export `Skeleton`.

**Root Cause:** In `reports-customers-page.tsx`, `Skeleton as SkeletonIcon` was imported from `lucide-react`. `Skeleton` is a custom UI component, not a Lucide icon.

**Fix:** Removed the erroneous import. The correct `Skeleton` component (from `@/components/ui/skeleton`) was already imported separately.

**Commit:** `b5ea0cb`

**Files:** `src/features/reports/pages/reports-customers-page.tsx`

---

### 2026-07-29 — `VehiclesPage` component name mismatch

**Symptom:** TypeScript compilation error: `Cannot find name 'VehiclesPage'`.

**Root Cause:** In `src/routes/index.tsx:137`, the route element referenced `<VehiclesPage />` but the component was exported as `CrmVehiclesPage` (from `src/features/crm/pages/vehicles-page.tsx`).

**Fix:** Changed the route to use `<CrmVehiclesPage />`.

**Commit:** `b5ea0cb`

**Files:** `src/routes/index.tsx`
