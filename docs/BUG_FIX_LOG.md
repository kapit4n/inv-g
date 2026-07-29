# Bug Fix Log

## Format

Each entry records: date, symptom, root cause, fix, commit. This log is append-only — add new entries at the top.

---

### 2026-07-29 — Product list shows empty despite 144 products in database

**Symptom:** Products page rendered "No hay datos" (empty state). No error message displayed.

**Investigation:**
- Database had 144 products (confirmed via seed validation).
- `get_products` Tauri command compiled and ran without Rust errors.
- DataTable `error` prop checked `error instanceof Error` — Tauri invoke rejects with an `Error`, so if the backend failed, the error UI would have appeared.
- The only scenario where the table stays empty without errors: React Query is not making the call, or the response comes back but `data?.data` is `[]/null`.

**Root Cause:** (TBD — diagnosed in next session)

**Fix:** (TBD)

**Commit:** `b5ea0cb`

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
