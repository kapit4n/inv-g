# Implementation Progress — Inventory Gear

**Persistent development journal.** One entry per completed task, appended over time. Do not overwrite history.

---

## TASK 00 — Project analysis and implementation baseline ✅

**Status:** Complete
**Date:** 2026-08-12
**Branch/commit:** master (docs uncommitted as of this entry)

### Current status
- **Phase:** 0 — Baseline
- **Task:** 00 — Project analysis and implementation baseline
- **Next recommended task:** **TASK 01 — Synchronize project documentation**

### What this task was
TASK 00 required a complete analysis of the current project (README, ROADMAP,
SUMMARI, KNOWN_ISSUES, package.json, schema, Tauri commands, React
architecture, routing, navigation, POS, inventory, purchasing, customers,
vehicles, reporting, administration, tests, screenshot framework), without
implementing major features. The output is this journal plus the findings
below.

### Files changed (created this task)
- `docs/development/IMPLEMENTATION_PROGRESS.md` (this file, created)
- (New baseline docs from prior session, still untracked: `docs/STATUS.md`,
  `docs/development/DEVELOPMENT_PLAN.md`)

### Tests executed
- `npm run typecheck` — ✅ passed (TS strict, no errors).
- `npm run lint` — ✅ 0 errors, 141 pre-existing warnings (all `no-explicit-any`).
- `npm test` — ✅ 26 files / 174 tests passed in ~11s (quality dashboard
  baseline claimed 177; suite has since drifted by 3, all green).
- `npm run verify` (full gate incl. `cargo test`) — deferred to the first code
  change; frontend gates above establish the baseline is green.

### Verification status
- **GREEN.** Frontend baseline verified. No code changed (analysis-only task).
  Quality dashboard reference: 26 visual QA findings
  (`quality/visual_analysis/BUG_LIST.md`), business-logic coverage 91% vs 95%
  target.

---

## Findings

### 1. Existing functionality that already solves part of the roadmap

| Roadmap need | Existing implementation | Location |
| ------------ | ----------------------- | -------- |
| Settings infra | `settings` table + CRUD commands, admin settings editor with categories | `src-tauri/src/commands/settings.rs`, `src-tauri/src/commands/admin/settings.rs`, `src/features/admin` |
| Backup/restore | create/list/delete backup, restore history, scheduled config, stats | `src-tauri/src/commands/admin/backups.rs`, `src/features/admin` (AdminBackupsPage, AdminRestorePage) |
| Printer management | add/edit/test/delete/set default | `src-tauri/src/commands/admin/printers.rs`, `src/features/admin` |
| Command palette | Ctrl+K palette exists | `src/components/command-palette.tsx` (UI only — **not wired to navigation**) |
| Customer search | searchable combobox | `src/components/forms/customer-search-field.tsx` |
| POS search→cart→customer→payment→checkout | working single-page flow | `src/features/sales/pages/pos-page.tsx` |
| Vehicle catalog + compatibility | brands/models/generations/engines + product compatibility | `src-tauri/src/commands/vehicles.rs`, `src-tauri/src/commands/compatibility.rs`, `src/features/vehicles` |
| Customer detail (sales, credit, vehicles) | customer detail page | `src/features/customers` (CustomersPage, CustomerDetailPage) |
| Reports/analytics | 10+ report modules, charts, KPIs, custom/scheduled/exports | `src-tauri/src/commands/reports/`, `src/features/reports` |
| Device management, diagnostics, audit, updates, license, maintenance | admin module | `src-tauri/src/commands/admin/` (14 files), `src/features/admin` |

### 2. Duplicated / overlapping functionality

- **Two settings systems.** `src-tauri/src/commands/settings.rs` exposes a
  flat key/value `SettingResponse`; `src-tauri/src/commands/admin/settings.rs`
  exposes a richer `AppSetting` (category, options, validation, is_system).
  Both read the same `settings` table. Risk of divergence; TASK 02 must extend
  one and retire/delegate the other.
- **Customer/vehicle routes duplicated.** `customers` and `crm/customers`,
  `vehicles` and `crm/vehicles`, `suppliers` and `inventory/suppliers` point at
  the same pages (see `src/routes/index.tsx:77-98,134-138`). Navigation has
  overlapping entries (sidebar ~109 entries).
- **Search surfaces overlap.** Top-bar search (`src/components/search-bar.tsx`),
  POS search, and the command palette all implement independent filtering.
  TASK 06 (fast global product search) and TASK 09 (palette) should consolidate.

### 3. Stale documentation

- **`docs/ROADMAP.md`** — duplicate/out-of-order Milestone 13/14 blocks at
  lines 233–258; Milestone 13 labelled "Administration & System Configuration"
  (Pending) although the committed Milestone 13 was the QA & testing framework.
- **`docs/progress/SUMMARI.md`** — numbering (M12=AI, M13=Workshop) predates
  the actual screenshot (M12) and QA (M13) milestones.
- **`docs/KNOWN_ISSUES.md`** — completely stale: claims "no real CRUD", "no
  authentication", "placeholder commands only". Real current issues are in
  `quality/visual_analysis/BUG_LIST.md`.
- **`docs/CHANGELOG.md`** — single 0.1.0 entry dated 2024-07-27; does not
  reflect Milestones 2–13.
- **Version mismatch** — `package.json` version `0.0.0`, STATUS.md claims
  `0.11.0`, CHANGELOG only documents `0.1.0`. Unreliable everywhere.
- **`database/schema.ts` (Drizzle)** — only 11 tables; the real schema lives in
  `src-tauri/src/db/schema.rs` (v8, ~66 CREATE TABLE). The Drizzle schema is a
  legacy snapshot and is not the source of truth.

### 4. Visual QA issues (from `quality/visual_analysis/BUG_LIST.md`, 26 total)

- **C-01 (Critical):** Reports page crashes with undefined values
  (`v.toLocaleString()` without null guard). Unconfirmed.
- **C-02 (Critical):** Mock backend hides real data-fetching failures — no E2E
  screenshot run against the real Rust backend.
- **12 Major** (e.g. mock count vs total mismatch, snake_case in
  `get_user_sessions`, chart dataKey inconsistencies, locale-dependent
  selectors, products stock=null rendering).
- **8 Medium + 4 Minor** — see BUG_LIST.md for full details.

### 5. Architectural risks

- **Schema source of truth is Rust raw SQL** (`src-tauri/src/db/schema.rs`,
  migrations via `user_version`, destructive drop/recreate for v8). Drizzle
  schema is stale; drizzle-kit generate/migrate scripts are effectively dead.
  Any schema change task must work with the Rust schema, not `database/schema.ts`.
- **Mixed DB state patterns.** Some commands use the global `DB_STATE`
  (`crate::DB_STATE`) while others take `State<DbState>` (e.g.
  `purchases.rs:474+`). Two access patterns to reconcile over time.
- **303 Tauri commands** (`#[tauri::command]` count) across top-level and
  nested command modules — large surface; requires the existing mock
  (screenshot framework) to stay in sync when signatures change.
- **Sync `pub fn` commands** doing blocking DB work on the command layer (no
  spawn_blocking in several files) — fine for desktop scale, but a perf risk
  for report aggregations.

### 6. Technical debt to address before/alongside new features

- Drizzle schema + `db:migrate` scripts mislead future work; either remove or
  document as read-only reference.
- Command palette is a non-functional placeholder (filters a hardcoded list,
  does not navigate).
- POS product search (`search_products_for_pos`, `sales.rs:360`) is a simple
  LIKE search; no FTS/OEM/barcode breadth (TASK 06 scope).
- No hold/resume sales, no per-line discount wiring, receipt printing relies on
  the printer module only.
- `scripts/screenshots/test-results/` is untracked and being committed to the
  repo working tree.

### 7. Reusable components for future tasks

- `src/components/forms/customer-search-field.tsx` — pattern for a reusable
  searchable combobox (extend for product/barcode/OEM search).
- `src/components/data-table/`, `src/components/dialogs/`,
  `src/components/forms/`, `src/components/entity/` — full CRUD UI kit.
- `src/components/charts/` (Line, Bar, Area, Pie, Donut, Stacked) for reports.
- `src/hooks/` — use-crud, use-data-table, use-dialog, use-filters,
  use-search, use-settings, use-notification.
- `src/services/crud.service.ts` + `src/lib/tauri.ts` invoke wrappers.
- `src/stores/` — zustand stores (auth, settings, theme, language, dialog,
  notification) with persistence.

### Architectural decisions (this task)
- None made; TASK 00 is analysis-only per the plan.

### Known issues discovered (recorded for future tasks)
- See "Stale documentation", "Visual QA", "Technical debt" above. The C-01
  reports crash and the version-number inconsistencies are the most
  user-visible and should be prioritized in TASK 01.

---

### Next recommended task
**TASK 01 — Synchronize project documentation.** Fix ROADMAP numbering and
duplicates, update SUMMARI, refresh KNOWN_ISSUES against BUG_LIST.md, update
CHANGELOG, align package.json version with STATUS.md, and commit the baseline
docs (STATUS.md, DEVELOPMENT_PLAN.md, this file). Then establish the
IMPLEMENTATION_PROGRESS as the live journal going forward.

---

## TASK 01 — Synchronize project documentation ✅

**Status:** Complete
**Date:** 2026-08-12
**Branch/commit:** master

### Current status
- **Phase:** 1 — Production readiness
- **Task:** 01 — Synchronize project documentation
- **Next recommended task:** **TASK 02 — Administration & business configuration**

### What this task was
Bring the project documentation into agreement with the implementation:
resolve incorrect/duplicate milestone numbering, obsolete descriptions and
stale claims; create one coherent roadmap separating completed / current /
planned / long-term; align the version; update this journal.

### Files changed
- `docs/ROADMAP.md` — rewritten: completed milestones 1–13 with commit hashes,
  removed duplicate/out-of-order Milestone 13/14 blocks at the end, added
  current & planned work (Development Plan Phases 0–10) and long-term vision.
- `docs/progress/SUMMARI.md` — completed table now matches committed history
  (M1–13); remaining milestones renumbered M14–M22 (was M12–M20, offset by the
  screenshot/QA milestones 12–13).
- `docs/KNOWN_ISSUES.md` — replaced stale placeholder-era entries ("no real
  CRUD", "no authentication") with current findings: 2 critical, 12 major,
  8 medium, 4 minor from `quality/visual_analysis/BUG_LIST.md`, plus
  non-visual project issues (schema source of truth, dual settings backends,
  placeholder command palette, LIKE-only POS search, mixed Rust DB state).
- `docs/CHANGELOG.md` — expanded from a single 0.1.0 entry to full milestone
  history (M1 through M13), with a version note.
- `package.json` — version aligned 0.0.0 → 0.1.0 (matches `Cargo.toml`,
  `tauri.conf.json`, and the `app_version` seed setting).
- `docs/STATUS.md` — latest commit/version updated, "documentation
  inconsistencies" section replaced with a resolved summary, planned work now
  reflects the Development Plan.
- `docs/development/IMPLEMENTATION_PROGRESS.md` — this TASK 01 entry appended.

### Tests executed
- `npm run typecheck` — ✅ passed.
- `npm run lint` — ✅ 0 errors (141 pre-existing warnings, unchanged).
- `npm test` — ✅ 26 files / 174 tests passed.
- No runtime code changed (documentation + package.json version only).

### Verification status
- **GREEN.** No behavior change; typecheck/lint/vitest all pass.

### Architectural decisions
- **Milestone numbering is the authoritative history.** Version 0.1.0 is kept
  across all config files and is *not* bumped per milestone; milestones 1–13
  are the release history. Prevents repeated 0.0.0/0.1.0/0.11.0 drift.
- **Single forward-looking roadmap.** `docs/development/DEVELOPMENT_PLAN.md`
  is the working plan (Phases 0–10, tasks 00–25); `docs/ROADMAP.md` is a
  status summary pointing to it; `docs/progress/SUMMARI.md` holds long-term
  vision (M14+). No more duplicate milestone blocks.

### Known issues discovered
- `scripts/screenshots/test-results/` still appears as an untracked/empty dir;
  consider a `.gitignore` entry when it produces artifacts.
- `docs/README.md` "Project Management" section still links fine but does not
  yet reference the Development Plan or the implementation journal — minor
  follow-up if desired.

### Next recommended task
**TASK 02 — Administration and business configuration.** Company/store
information, tax configuration, receipt/business defaults, notification
preferences, appearance settings, business configuration — reusing the existing
settings infrastructure (`src-tauri/src/commands/settings.rs` +
`admin/settings.rs`, `src/features/admin`). Note the duplication between the
two settings backends found in TASK 00; consolidate or clearly delegate before
adding new keys.

---

## TASK 02 — Administration and business configuration ✅

**Status:** Complete
**Date:** 2026-08-13
**Branch/commit:** master (`09e723b`)

### Current status
- **Phase:** 1 — Production readiness
- **Task:** 02 — Administration and business configuration
- **Next recommended task:** **TASK 03 — Backup and restore hardening**

### What this task was
Company/store information, tax configuration, receipt/business defaults,
notification preferences, appearance settings and business configuration —
reusing the existing settings infrastructure. No second settings system was
created; the richer `application_settings` backend was extended and made
authoritative, the legacy `settings` table is kept in sync on writes, and the
value is validated in Rust and in the UI. Settings are loaded on startup where
appropriate.

### Settings backends consolidation (the TASK 00 duplication)
- `src-tauri/src/commands/admin/settings.rs` (`application_settings`) is now
  the **authoritative** backend. `update_app_setting` / `update_app_settings_bulk`
  now (a) reject unknown keys, (b) validate values against `setting_type`,
  `options` and `validation` before writing, and (c) mirror each write into the
  legacy `settings` table so `app_version` readers and legacy hooks stay
  coherent. Validation runs for the whole bulk first, so an invalid entry never
  causes a partial write.
- Legacy `commands/settings.rs` remains for compatibility reads (app_version,
  dashboard/updates/maintenance/diagnostics) and is kept equal via the write
  mirror.

### Seed data (business config, `src-tauri/src/db/seed.rs`)
- `seed_application_settings` is now **idempotent per key** (`INSERT OR IGNORE`
  every boot) so new keys appear on existing databases; legacy values are still
  migrated and `tax_rate` is moved to the `tax` category.
- New keys: **company** (`business_name`, `tax_id`, `address_line1/2`, `city`,
  `state`, `postal_code`, `phone`, `email`, `website`, `business_type` select),
  **tax** (`tax_rate` moved here, `prices_include_tax`, `tax_id_required`),
  **sales/receipts** (`sale_prefix`, `quote_prefix`,
  `receipt_show_tax_breakdown`, `receipt_show_barcode`,
  `receipt_show_customer_info`, options for `default_payment_method`),
  **notifications** (`notify_low_stock`, `notify_purchase_orders`,
  `notify_warranty_expiry`, `notify_backup_failures`, `sound_enabled`),
  **business** (`items_per_page`, `default_margin_percent`, `enable_sales`,
  `enable_purchasing`, `enable_crm`), plus `validation` metadata on existing
  numeric settings.

### Frontend
- `src/lib/settings-utils.ts` — shared `parseSettingOptions`,
  `parseSettingValidation`, `validateSettingValue`.
- `src/features/admin/pages/admin-settings-page.tsx` — rewritten: JSON options
  correctly parsed, client-side validation with inline errors (Save disabled
  while invalid), i18n for categories/UI strings, per-category descriptions,
  success/error notifications, local app-settings store kept in sync after save.
- `src/stores/app-settings.store.ts` — new zustand store (`hydrate`, `getValue`,
  `setValue`), hydrated on startup in `App.tsx`.
- `src/layouts/top-bar.tsx` — displays the configured `store_name`.
- `src/features/settings/pages/settings-page.tsx` — quick toggles now persist
  (`notify_low_stock`, `sound_enabled`, `auto_backup`, `theme`), Configure
  buttons navigate to `/admin/settings` when the user has
  `admin.settings.manage`, switches got accessible `aria-label`s.
- i18n: new es/en `admin.settings` keys (company/tax/receipts/notifications/
  business categories + descriptions, categories, noSettings, save/saving/
  saved/saveError, fixErrors, errors.*).
- Screenshot mock (`scripts/screenshots/helpers/invoke-mock.ts`) synced to the
  new categories and keys, and `update_app_settings_bulk`/history kept usable.

### Tests executed
- `npm run verify` — ✅ full gate green.
- Vitest: **30 files / 198 tests passed** (24 new: 11 `settings-utils`,
  3 `app-settings.store`, 4 `admin-settings-page`, 3 `settings-page`, 9 Rust).
- `cargo test` — ✅ 29 passed (was 20; +9 validation tests).

### Verification status
- **GREEN.** Typecheck clean, lint 0 errors (140 pre-existing warnings),
  198 frontend + 29 Rust tests pass.

### Architectural decisions
- **`application_settings` is the single authoritative settings store**; the
  legacy `settings` table is a compatibility mirror kept in sync on writes
  rather than a second source of truth.
- **Server-side validation is the enforcement point** (Rust validates every
  write); client-side validation is a UX layer only.
- **Seeding is per-key idempotent** so future key additions do not require a
  schema migration or a wipe.

### Known issues discovered
- `reset_setting_to_default` **deletes** the row for non-system settings, which
  only reappears on the next app start (seeding). The admin UI does not surface
  this; consider `INSERT OR IGNORE` + value-restore semantics in TASK 03.
- `update_setting` (legacy) has no validation and no mirror; nothing calls it,
  but a future consumer could diverge the legacy table.
- The seeded `currency` options list is illustrative; a full ISO-4217 list is
  better served by a future picker.

### Next recommended task
**TASK 03 — Backup and restore hardening.** Review the existing backup
implementation so users can safely create/see status/restore/validate backups,
handle corrupt files and errors, confirm destructive restores, and get clear
messages. Reuse `src-tauri/src/commands/admin/backups.rs` and the admin backup
pages; add tests for failure cases.

---

## TASK 03 — Backup and restore hardening ✅

**Status:** Complete
**Date:** 2026-08-13
**Branch/commit:** master (`8cfc9fb`)

### Current status
- **Phase:** 1 — Production readiness
- **Task:** 03 — Backup and restore hardening
- **Next recommended task:** **TASK 04 — Printing foundation**

### What this task was
Make backup/restore safe and trustworthy. Previously `create_backup` only
inserted a history row with a *fake* `pending_` checksum and an estimated size —
**no backup file was ever written**, delete did not remove the physical file,
there was no restore command at all, no validation, and the restore UI was a
disabled button. This task implemented a real, validated, confirmed backup and
restore workflow.

### Backend (`src-tauri/src/commands/admin/backups.rs`)
- **Real backups.** `create_backup` now snapshots the live database with the
  SQLite **online backup API** (`rusqlite::backup`, WAL-aware), writes to a
  temp file first and atomically renames on success, computes a real **SHA-256
  checksum** and real file size, and stores them in `backup_history`
  (`compression`/`encryption` = `none`; no cloud sync per plan). Failed backups
  are recorded with status `failed` and the error in `notes`, and the partial
  temp file is removed.
- **Restore.** New `restore_backup` command: resolves the source (by
  `backup_id` from history, or an explicit `file_path`), refuses to restore
  non-`completed` records, **validates the file first** (existence, non-empty,
  SQLite header, `PRAGMA quick_check`, checksum match), then restores into the
  live connection via the backup API and runs a **post-restore integrity
  check**. History/audit rows are written *after* a successful restore so the
  restore itself never rolls them back; failures are recorded in
  `restore_history` with `error_message`.
- **Verify.** New `verify_backup` command returns a `BackupValidation`
  (file name/size, `valid`, `sqlite_valid`, `integrity_ok`, checksum,
  `checksum_match`, human-readable `message`) for any backup, by id or by path.
- **Delete.** `delete_backup` now also removes the physical file (missing file
  is tolerated) and takes a `created_by` for the audit trail.
- `DbState` now carries `db_path` so backups resolve to
  `<database dir>/backups`; `get_scheduled_backup_config` / `save_scheduled_backup_config`
  still read/write the `backup` settings category.

### Frontend
- `src/features/admin/pages/admin-backups-page.tsx` — per-row **Verify**
  (ShieldCheck) and **Restore** actions; **confirm dialogs before restore and
  delete**; restore disabled for failed backups; toast notifications
  (created/verified/restored/deleted + backend error messages); loading /
  empty / error states; `common.delete`/`common.cancel` labels to avoid
  ambiguous dialog text.
- `src/features/admin/pages/admin-restore-page.tsx` — real flow: pick a
  completed backup, see metadata (date/size), **validate before restore**
  (Restore stays disabled until validation passes), destructive confirmation
  dialog, then restore; restore-history table shows failures with
  `error_message`.
- `src/lib/tauri.ts` + `src/types/index.ts` — `verifyBackup`, `restoreBackup`
  wrappers; `BackupValidation`, `RestoreBackupInput` types; `deleteBackup`
  passes `createdBy`.
- i18n: new es/en keys (`backups.verify/verifySuccess/verifyFailed/restore/…`,
  `backups.status.*`, `restore.validation/historyTitle/noBackupsAvailable/…`).
- Screenshot mock (`scripts/screenshots/helpers/invoke-mock.ts`) — added
  `verify_backup` + `restore_backup` handlers, realistic checksum in
  `create_backup`, `none` compression/encryption.

### Tests executed
- `npm run verify` — ✅ full gate green.
- Vitest: **32 files / 210 tests passed** (12 new: 7 `admin-backups-page`,
  5 `admin-restore-page`).
- `cargo test` — ✅ 39 passed (was 29; +10 backup tests: snapshot contains
  data, valid sqlite file, checksum changes on tamper, missing file, corrupt
  file, empty file, restore roundtrip, restore-from-missing fails,
  restore-from-corrupt fails and keeps DB usable, backup dir resolution).

### Verification status
- **GREEN.** Typecheck clean, lint 0 errors (140 pre-existing warnings),
  210 frontend + 39 Rust tests pass.

### Architectural decisions
- **Restore uses the SQLite online backup API into the live connection** (not
  a file swap) — the single global connection stays valid and WAL is handled;
  the backup file itself is the validated, tamper-evident artifact.
- **Validate-then-restore with a post-restore integrity check**; a failed
  restore leaves a `restore_history` failure record with the error message
  instead of silently corrupting state.
- **Backups are real files, written to a temp name and renamed atomically** —
  a failed backup never appears under a valid backup name in history.
- **Checksums are recorded at creation time** so a modified/corrupted file is
  detected by `verify` and refuses to restore.

### Known issues discovered
- Restore replaces the whole database (full restore only, as scoped); there is
  no partial/table-level restore (the old UI claimed one — now removed).
- The "Download" backup action remains a disabled placeholder (no desktop file
  dialog integration yet); backups live in `<data dir>/backups` and can be
  copied manually.
- `get_backup_history` re-queries the DB after a restore, which now reflects
  the backup-time history — expected, but worth a UI note.

### Next recommended task
**TASK 04 — Printing foundation.** Architecture for thermal receipts, A4
invoices, quotations, purchase orders, customer statements, inventory reports
and barcode/product labels. Inspect `src-tauri/src/commands/admin/printers.rs`
and the printer admin pages first; build reusable print/template abstractions
with preview, printer selection, error handling and testable rendering logic.

## TASK 04 — Printing foundation ✅

**Status:** Complete
**Date:** 2026-08-13
**Branch/commit:** master (`6142477`)

### Current status
- **Phase:** 1 — Production readiness
- **Task:** 04 — Printing foundation
- **Next recommended task:** **TASK 05 — Analyze and redesign the POS workflow**

### What this task was
Build a reusable printing foundation on top of the existing printer
configuration (`src-tauri/src/commands/admin/printers.rs`, admin printer pages):
a document model, pure print-config/model builders, a shared print dialog with
live preview and printer selection, and wiring for the receipt (sale detail),
closeout report, and quote pages. The printing foundation is covered by unit
tests for config mapping, formatting, document-model building, printer
resolution, the dialog component, and page-level print flows.

### Architecture
- **`src/lib/print/`** — pure, framework-free core (unit-tested):
  - `types.ts`: `PrintDocumentModel`, `PrintConfig`, `PrintStoreInfo`,
    `PrintRequest`, kind/paper-size constants.
  - `config.ts`: `buildPrintConfig` maps the app-settings store into a
    `PrintConfig` (store name/address/phone/tax id, currency, footer, flag
    booleans, per-kind printer names, default paper size); `isThermalPaper`,
    `paperWidth`, `paperSizeForKind` normalize sizes (thermal vs A4/letter).
  - `format.ts`: `formatCurrency`/`formatNumber`/`formatDate`/`formatDateTime`
    with null/NaN-safe fallbacks.
  - `models.ts`: `buildSaleReceiptModel`, `buildQuoteDocumentModel`,
    `buildCloseoutDocumentModel` produce `PrintDocumentModel`s (totals with
    bold total, line items, payments, meta lines, footer, notes).
  - `printer.ts`: `sortPrinters` (default first), `activePrinters`,
    `resolveDefaultPrinter` (configured printer → `is_default` → first),
    `printerLabel`.
- **`src/components/print/`** — UI:
  - `print-dialog.tsx`: Radix dialog with live preview (`PrintTemplate`),
    printer select (default pre-selected via `resolveDefaultPrinter`), a
    `@media print` stylesheet that isolates `#print-preview-root`, warning
    state when no printers are configured (link to Admin → Printers), and
    `window.print()` + best-effort `onPrinted` callback.
  - `print-host.tsx`: renders the dialog from `usePrintStore.request`.
  - `templates.tsx`: `PrintTemplate` renders per-kind documents (receipt,
    quote, report, etc.) with meta/summary/totals sections.
- **`src/stores/print.store.ts`** — zustand store holding the active
  `PrintRequest`; `src/hooks/use-print.ts` exposes `usePrint()` (returns the
  open function), `src/hooks/use-print-config.ts` derives `PrintConfig` from
  the app-settings store.
- **Wiring:** `PrintHost` mounted in `App.tsx`; pages call
  `usePrint()` + `build*Model(...)` (sale-detail, closeout, quote-detail);
  `print` i18n namespace registered in `src/i18n/config.ts`
  (`en|es/print.json`); `get_printers(printer_type)` Rust command so the
  dialog lists configured printers.

### Tests executed
- New Vitest suites (39 tests):
  - `tests/unit/lib/print-format.test.ts` — currency/number/date formatting.
  - `tests/unit/lib/print-config.test.ts` — setting mapping, thermal/paper
    size normalization, kind-specific fallbacks.
  - `tests/unit/lib/print-models.test.ts` — receipt/quote/closeout model
    building, tax-row and customer-meta conditionals, bold total, fallbacks.
  - `tests/unit/lib/print-printer.test.ts` — sorting, active filtering,
    default-printer resolution order, label formatting.
  - `tests/unit/components/print-dialog.test.tsx` — live preview, printer
    select pre-selection, print + close flow, no-printers warning state.
  - `tests/unit/components/sale-detail-page.test.tsx` — sale details render
    and the full print flow marks the receipt printed after `window.print`.
  - `tests/unit/components/closeout-page.test.tsx` — closeout stats render
    and the print dialog opens with the report document.
- `npm run verify` — ✅ full gate green (typecheck, lint 0 errors, 249
  frontend tests in 39 files, 46 Rust tests).

### Bug fixes surfaced by the new tests
See `docs/BUG_FIX_LOG.md` top entry:
1. `usePrint()` returned `{ print }` while all three call sites invoked it as
   a function → runtime crash on every Print click. Fixed to return the open
   function directly.
2. `paperWidth("A4")` fell through to the 80mm default because
   `normalizePaperSize` returns uppercase `A4` but the switch matched lowercase
   `a4`. Fixed the case label.
3. `sales.receipt` (and 12 sibling keys used by the sale-detail/closeout
   pages) were missing from `en|es/sales.json`, so the receipt document title
   rendered the raw key (`receipt`). Added the keys in both locales.

### Verification status
- **GREEN.** `npm run verify` passes end to end; no new lint errors; Rust
  suite unchanged (46 passed).

### Known issues discovered
- Printing relies on the browser print dialog (`window.print`) with an
  isolated preview; there is no native/CUPS direct-print path yet (out of
  scope for the foundation).
- `sales.receipt` document title is now translated, but invoice/statement/
  label builders from the foundation are not yet wired to pages — those are
  follow-on tasks.

### Next recommended task
**TASK 05 — Analyze and redesign the POS workflow.** Reuse the printing
foundation (`usePrint` + `build*Model`) for receipt printing in the POS, then
work the search → identify → stock → cart → customer → vehicle → payment →
receipt flow. Add regression tests for the print path.

---

## TASK 05 — Analyze and redesign the POS workflow (partial)

**Status:** In progress
**Date:** 2026-08-17
**Branch/commit:** master (`1496cdc`)

### Current status
- **Phase:** 2 — POS UX
- **Task:** 05 — Analyze and redesign the POS workflow
- **Next recommended task:** **TASK 05 continued** (customer/vehicle selection in POS, hold/resume sales)

### What was done in this pass
First UX improvement pass on the POS page targeting the search → stock → cart →
payment → receipt flow. The POS page was analyzed, and the following were
implemented:

1. **Stock guards.** Adding out-of-stock products is blocked with a warning
   notification. Quantity is capped at available stock in the cart (both
   increment and direct input). Product cards show "Out of stock" badge for
   zero-stock and a warning variant for ≤5.

2. **Keyboard navigation.** ArrowDown/ArrowUp browse the product grid with
   visual ring highlight. Enter adds the selected product. Escape clears the
   search and refocuses. Debounced search always queries (empty string returns
   all active products); client-side filtering is applied after the query.

3. **Cart quantity input.** Replaced the static quantity display with a numeric
   `<Input type="number">` spinbutton with min/max enforcement. Cart items show
   remaining stock.

4. **Receipt printing.** After checkout, the POS automatically calls
   `printReceiptForSale` which fetches sale items, builds a `PrintDocumentModel`
   via `buildSaleReceiptModel`, and opens the print dialog. Best-effort (errors
   are swallowed since the sale is already complete).

5. **Accessibility.** `aria-label` on quantity inputs, remove/add buttons,
   payment method selector, discount input, payment amount inputs. `data-testid`
   on product cards for reliable test targeting.

6. **i18n.** New keys in `en/sales.json` and `es/sales.json`: `stockOut`,
   `stockLeft`, `stockOnly`, `posShortcuts`, `insufficientPayment`, `totalPaid`,
   `changeDue`, `discountAmount`.

### Files changed
- `src/features/sales/pages/pos-page.tsx` — stock guards, keyboard nav,
  quantity input, print receipt, data-testids, aria-labels
- `src/i18n/locales/en/sales.json` — new POS keys
- `src/i18n/locales/es/sales.json` — new POS keys (Spanish)
- `tests/unit/components/pos-page.test.tsx` — 10 unit tests (new file)

### Tests executed
- `npm test` — ✅ 40 files / 259 tests passed.

### Verification status
- **GREEN.** All 259 tests pass across 40 files.

### Remaining scope for TASK 05
The initial POS UX pass is done. Remaining items for full TASK 05 completion:
- Customer/vehicle selection is already wired (CustomerSearchField) but not
  deeply tested.
- Hold/resume sales (TASK 07 in the plan) is a separate task.
- Per-line discount is not wired (the existing percentage discount applies to
  the whole sale).
- The product grid is limited to 60 items; no virtualization or lazy loading.
- Search results do not show compatibility info for the current vehicle.

### Next recommended task
**TASK 06 — Fast global product search.** Reusable search supporting name,
SKU, barcode, OEM, brand, aliases. Show product/brand/SKU/stock/price.
Desktop keyboard optimized. Tests.

---

## TASK 06 — Fast global product search ✅

**Status:** Complete
**Date:** 2026-08-17
**Branch/commit:** master (`8db0034`)

### Current status
- **Phase:** 2 — POS UX
- **Task:** 06 — Fast global product search
- **Next recommended task:** **TASK 07 — POS hold and resume sales**

### What this task was
Build a fast, reusable product search infrastructure that works across POS,
inventory, purchasing, and other search surfaces. Replace fragmented LIKE-only
searches with a single relevance-ordered command, add SQLite indexes for
performance, and create reusable frontend primitives (hook + combobox).

### Backend
- **Schema v9** (`src-tauri/src/db/schema.rs`): Added 8 indexes on products
  (`name`, `sku`, `barcode`, `oem_number`, `internal_code`, `category_id`,
  `brand_id`, `is_active`). Destructive drop/recreate migration; the schema
  version was bumped from 8 → 9.
- **New `global_product_search` command** (`src-tauri/src/commands/sales.rs`):
  Relevance-ordered search with `CASE WHEN` scoring (exact match > prefix >
  contains), JOINed `brands.name` and `categories.name`, brand-name search
  support, configurable `limit` (default 20). Returns `ProductForPos` with the
  new `brand_name` field.
- **Enhanced `search_products_for_pos`**: Now JOINs brands and returns
  `brand_name` (backward compatible — new `Option<String>` field).
- Registered in `src-tauri/src/lib.rs`.

### Frontend
- **`useProductSearch` hook** (`src/hooks/use-product-search.ts`): Wraps
  `useQuery` + debounce, configurable `debounceMs` (default 200), `limit`
  (default 20), `queryAllWhenEmpty` for POS initial load, `isTyping` indicator.
  Exported from `src/hooks/index.ts`.
- **`ProductSearchCombobox` component** (`src/components/product-search-combobox.tsx`):
  Reusable Popover with inline search, product/SKU/brand display, stock badge
  (destructive for 0, warning for ≤5), price, keyboard navigation between
  results.
- **POS page refactored**: Replaced manual `useState` + `useEffect` debounce
  with `useProductSearch({ queryAllWhenEmpty: true })`. Removed unused
  `searchProductsForPos` import.
- **TypeScript**: `ProductForPos` now includes `brandName?: string`.
  `globalProductSearch(query, limit?)` wrapper in `tauri.ts`.
- **Screenshot mock** updated for `global_product_search`.

### Tests executed
- `npm run verify` — ✅ full gate green.
- Vitest: **42 files / 270 tests passed** (11 new: 5 `use-product-search`,
  6 `product-search-combobox`).
- `cargo test` — ✅ 46 passed (unchanged).

### Verification status
- **GREEN.** Typecheck clean, lint 0 errors (pre-existing warnings),
  270 frontend + 46 Rust tests pass.

### Known issues discovered
- `LIKE '%term%'` with leading wildcard still does full table scans even with
  indexes; FTS5 would be needed for true full-text performance at scale. Not
  justified for current data volumes (< 10K products).
- The `ProductSearchCombobox` is not yet wired into purchasing or inventory
  pages — those use their own search patterns.
- Brand search via `b.name LIKE` requires a JOIN; at scale this could be a
  bottleneck if brands table grows significantly.

### Next recommended task
**TASK 07 — POS hold and resume sales.** Hold a sale, name/identify it,
continue another, view held, resume, cancel safely. Preserve inventory/payment
correctness. Tests for full workflow.

---

## TASK 07 — POS hold and resume sales ✅

**Status:** Complete
**Date:** 2026-08-17
**Branch/commit:** master

### What this task was
TASK 07 implemented hold and resume functionality for the POS. Operators can
now temporarily park an incomplete sale (with a label), continue with a
different sale, then return to any held sale to resume or cancel it. No
inventory or payment records are touched until checkout.

### Design decisions
- **Separate `held_sales` / `held_sale_items` tables** (not extending the `sales`
  table) — keeps held sales completely isolated from sales reports and analytics.
- Hold creates a snapshot of the cart (items, customer, discount, notes) without
  decrementing stock or creating payments.
- Resume loads items back into the POS cart and deletes the held sale record.
- Cancel simply deletes the held sale (cascade deletes items).
- Schema bumped to version 10 (destructive migration).

### Files created/modified

#### Backend
- `src-tauri/src/db/schema.rs` — Schema v10: added `held_sales` and
  `held_sale_items` tables with indexes and foreign keys.
- `src-tauri/src/commands/sales.rs` — Added `hold_sale`, `get_held_sales`,
  `get_held_sale_items`, `resume_held_sale`, `delete_held_sale` commands with
  `HeldSale`, `HeldSaleItem`, `HoldSaleInput`, `HeldSaleItemInput` structs.
- `src-tauri/src/lib.rs` — Registered 5 new commands.

#### Frontend
- `src/types/index.ts` — Added `HeldSale`, `HeldSaleItem`, `HoldSaleInput`,
  `HeldSaleItemInput` interfaces.
- `src/lib/tauri.ts` — Added 5 wrappers: `getHeldSales`, `getHeldSaleItems`,
  `holdSale`, `resumeHeldSale`, `deleteHeldSale`.
- `src/features/sales/pages/pos-page.tsx` — Hold/resume UI: hold button in cart,
  hold label dialog, held sales panel with count badge, resume/cancel per item.
  Uses `useMutation` for hold/resume/cancel and `useQuery` for held sales list.
- `src/i18n/locales/en/sales.json` — 12 new English keys for hold/resume.
- `src/i18n/locales/es/sales.json` — 12 new Spanish keys for hold/resume.
- `scripts/screenshots/helpers/invoke-mock.ts` — Added mocks for all 5 held
  sale commands.

#### Tests
- `tests/unit/components/pos-page.test.tsx` — 7 new tests (17 total):
  hold button disabled when cart empty, hold dialog opens, hold sale clears cart,
  held sales count badge, toggle panel open/close, resume into cart, cancel held.

### Tests executed
- `npm run verify` — ✅ full gate green.
- Vitest: **42 files / 277 tests passed** (7 new POS hold/resume tests).
- `cargo test` — ✅ 46 passed (unchanged).

### Verification status
- **GREEN.** Typecheck clean, lint 0 errors (pre-existing warnings),
  277 frontend + 46 Rust tests pass.

### Known issues discovered
- The Wrapper in `tests/helpers/render.tsx` creates a new QueryClient on every
  render, which can cause test isolation issues with react-query. The resume test
  requires checking for duplicate DOM elements (product grid + cart item both show
  the same product name).
- Held sales do not expire — there is no automatic cleanup for old held sales.
  This could be added as a future enhancement.

---

## TASK 08 — Faster POS checkout ✅

**Status:** Complete
**Date:** 2026-08-17
**Branch/commit:** master

### What this task was
TASK 08 streamlined the POS checkout flow to reduce clicks, navigation, and
dialogs. The biggest change is that after checkout, the user stays on the POS
page with an inline success card rather than being navigated to the sale detail
page. Additional speed improvements include quick-pay buttons for cash, keyboard
shortcuts for common actions, and collapsible notes.

### Design decisions
- **Stay on POS after checkout:** Replaced `navigate()` with a `completedSale`
  state that renders an inline success card with "New Sale" and "View Sale"
  buttons. The user can immediately start the next sale.
- **Quick-pay cash buttons:** "Exact", $20, $50, $100 buttons appear when the
  first payment method is cash and total > 0. Reduces typing for the most common
  payment method.
- **Keyboard shortcuts:** F2 = focus customer, F4 = focus payment, F10 = complete
  sale, Escape = clear search (or dismiss success card).
- **Collapsible notes:** Notes section starts collapsed ("Add note" button) and
  can be expanded to show the textarea. Saves vertical space for the common case
  where notes are not needed.
- **No vehicle assignment** was added — deferred to a future task since it
  requires vehicle selection logic tied to customers and is less critical for
  checkout speed.

### Files created/modified
- `src/features/sales/pages/pos-page.tsx` — Post-checkout success card,
  quick-pay buttons, keyboard shortcuts (F2/F4/F10), collapsible notes, refs for
  focus management.
- `src/i18n/locales/en/sales.json` — 10 new keys (saleComplete, quickPay, etc.)
- `src/i18n/locales/es/sales.json` — 10 new Spanish keys
- `tests/unit/components/pos-page.test.tsx` — 8 new tests (25 total):
  inline success card, new sale resets, card payment, transfer with reference,
  split payments, quick-pay exact/denomination, F10 shortcut, notes toggle.

### Tests executed
- `npm run verify` — ✅ full gate green.
- Vitest: **42 files / 285 tests passed** (8 new POS checkout tests).
- `cargo test` — ✅ 46 passed (unchanged).

### Verification status
- **GREEN.** Typecheck clean, lint 0 errors (pre-existing warnings),
  285 frontend + 46 Rust tests pass.

### Known issues discovered
- The `combobox` role for `<select>` elements can be ambiguous when multiple
  selects exist on the page — tests use `getAllByRole` with aria-label filtering
  for split payment tests.
- Vehicle assignment is not yet wired into POS — tracked for future work.

---

## TASK 09 — Global command palette ✅

**Status:** Complete
**Date:** 2026-08-17
**Branch/commit:** master

### Current status
- **Phase:** 3 — Desktop productivity
- **Task:** 09 — Global command palette
- **Next recommended task:** **TASK 10 — Keyboard shortcuts**

### What this task was
Replace the non-functional command palette placeholder with a fully wired `Ctrl+K`
command palette that navigates the application. The palette supports fuzzy search
across labels and keywords, keyboard navigation (ArrowUp/Down + Enter), categorized
command groups (Navigation, Quick Actions, Appearance), keyboard shortcut badges,
and a result count footer.

### Implementation

#### Command registry (`src/lib/command-palette/`)
- `types.ts` — `Command` interface (id, label, category, icon, shortcut, keywords, action),
  `CommandCategory` type, `CommandCategoryConfig`.
- `commands.ts` — `buildCommands(deps)` factory: 60+ commands from navigation
  routes (42 navigation items covering every sidebar entry) + 4 quick actions
  (New Sale, New Purchase Order, New Product, New Customer) + 2 appearance
  actions (Toggle Theme, Toggle Sidebar). Each command is bound to a `navigate()`
  or store action at render time. Keywords enable Spanish/English fuzzy matching.

#### Command palette component (`src/components/command-palette.tsx`)
Full rewrite of the placeholder. Features:
- **Ctrl/Cmd+K** global toggle (unchanged from before, `window.addEventListener`).
- **Search input** with debounced filtering across label, id, and keywords.
- **Keyboard navigation** — ArrowUp/Down move selection, Enter executes, Escape closes.
  Handler attached to the input element (Radix Dialog's focus trap intercepts arrow
  events at the container level).
- **Categorized display** — commands grouped under Navigation / Quick Actions /
  Appearance headers with visual separators.
- **Keyboard shortcut badges** — `kbd` elements show Ctrl+N, Ctrl+B, etc.
- **Scroll into view** — selected item scrolls into view via `scrollIntoView` (guarded
  for jsdom).
- **Result count** — footer shows total matching commands.
- **No results** state with translated message.

#### Sidebar navigation reuse
Navigation commands are derived from the same route paths defined in the sidebar
(`src/layouts/sidebar.tsx`) — no duplicate route definitions. The `buildCommands`
factory receives `navigate` and builds path-based navigation commands.

#### i18n
- `en/common.json` and `es/common.json` — added `commandPalette.*` keys:
  placeholder, noResults, navigate, select, results, categories (navigation,
  actions, appearance), actions (newSale, newPurchaseOrder, newProduct,
  newCustomer), appearance (toggleTheme, expandSidebar, collapseSidebar).
- `en/help.json` and `es/help.json` — added `shortcuts.*` keys for the help page.

#### Help page (`src/features/help/pages/help-page.tsx`)
Updated shortcuts list to reflect actually implemented global shortcuts:
- `Ctrl+K` — Open command palette
- `Ctrl+B` — Toggle sidebar
- `Ctrl+N` — New sale (POS)
- `Esc` — Close dialog/panel

### Files created/modified
- `src/lib/command-palette/types.ts` (new)
- `src/lib/command-palette/commands.ts` (new)
- `src/components/command-palette.tsx` (rewritten)
- `src/features/help/pages/help-page.tsx` (updated shortcuts)
- `src/i18n/locales/en/common.json` (added commandPalette keys)
- `src/i18n/locales/es/common.json` (added commandPalette keys)
- `src/i18n/locales/en/help.json` (added shortcuts keys)
- `src/i18n/locales/es/help.json` (added shortcuts keys)
- `tests/unit/lib/command-palette.test.ts` (new, 25 tests)
- `tests/unit/components/command-palette.test.tsx` (new, 13 tests)

### Tests executed
- `npm run verify` — ✅ full gate green.
- Vitest: **44 files / 313 tests passed** (38 new: 25 command registry + 13 component).
- `cargo test` — ✅ 46 passed (unchanged).

### Verification status
- **GREEN.** Typecheck clean, lint 0 errors (144 pre-existing warnings),
  313 frontend + 46 Rust tests pass.

### Architectural decisions
- **Command registry is a pure function** (`buildCommands`) that receives dependencies
  (navigate, theme toggler, sidebar state, i18n `t`) — no hooks or React coupling
  in the registry itself. This makes it testable in isolation.
- **Keyboard handler on the input element**, not on `DialogContent`. Radix Dialog's
  focus trap intercepts arrow key events at the container level; attaching the handler
  to the input avoids this.
- **Keywords enable cross-language search** — Spanish terms like "pos", "venta",
  "cliente" are indexed as keywords so the palette works for both locales.

### Known issues discovered
- The theme toggle in the command palette directly manipulates `document.documentElement`
  classes rather than using the `useThemeStore` — this is a lightweight approach that
  works but doesn't persist the theme choice. A follow-up could wire it to the store.
- `flatFiltered` is a redundant useMemo (just returns `filtered`). Could be simplified
  in a follow-up cleanup.

### Next recommended task
**TASK 10 — Keyboard shortcuts.** Centralized shortcut system: Ctrl+K palette, Ctrl+F
search, Ctrl+N new, Ctrl+S save, Ctrl+P print, Escape close, F2 product, F4 customer,
F6 vehicle, F10 payment. Inspect existing shortcuts first; avoid conflicts; document
via shortcut/help dialog. Tests.

---

## TASK 10 — Keyboard shortcuts ✅

**Status:** Complete
**Date:** 2026-08-19
**Branch/commit:** master

### Current status
- **Phase:** 3 — Desktop productivity
- **Task:** 10 — Keyboard shortcuts
- **Next recommended task:** **TASK 11 — Quick Actions dashboard**

### What this task was
Centralized keyboard shortcut system. Previously shortcuts were scattered across
`command-palette.tsx` (5 shortcuts) and `pos-page.tsx` (4 shortcuts) via individual
`useHotkey` calls with no single source of truth, potential Escape conflicts, and
no way to discover shortcuts except the help page. This task created a central
registry, a `ShortcutProvider` that registers all shortcuts from one place, context-
aware POS shortcuts via custom events, and a shared theme-cycling utility.

### Architecture

#### Central registry (`src/lib/shortcuts/shortcuts.ts`)
Single source of truth for all shortcut metadata: 13 shortcuts with `id`, `keys`,
`scope` (global | pos), `category` (navigation | actions | pos | appearance),
and `actionKey` (i18n key). Used by the help page for documentation.

**Shortcuts registered:**

| Shortcut | Scope | Action |
|---|---|---|
| Ctrl+K | global | Toggle command palette |
| Ctrl+F | global | Focus search (or open palette) |
| Ctrl+N | global | New sale (POS) |
| Ctrl+Shift+P | global | New purchase order |
| Ctrl+Shift+D | global | Cycle theme |
| Ctrl+B | global | Toggle sidebar |
| Ctrl+S | global | Save (dispatches `shortcut:save`) |
| Ctrl+P | global | Print (dispatches `shortcut:print`) |
| Escape | global | Close (priority: palette > dialog > page) |
| F2 | pos | Focus product search |
| F4 | pos | Open customer selector |
| F6 | pos | Open vehicle selector |
| F10 | pos | Focus payment field |

#### ShortcutProvider (`src/components/shortcut-provider.tsx`)
Mounted in `AppShell`. Registers all global shortcuts via `useHotkey`. Handles
Escape priority: command palette first, then active dialogs, then page-specific
(via `shortcut:escape` custom event). POS-specific shortcuts (F2/F4/F6/F10) are
only active when on `/sales/new` and dispatch `shortcut:pos` custom events with a
`detail` string identifying which action.

#### Theme cycle utility (`src/lib/theme-cycle.ts`)
Extracted `cycleTheme` from the command palette into a shared pure function. Both
the `ShortcutProvider` and command palette use it. Persists via `useThemeStore`.

#### Command palette (`src/components/command-palette.tsx`)
Removed 5 `useHotkey` calls and the manual global Escape listener — all now
handled by `ShortcutProvider`. The palette retains local keyboard navigation
(ArrowUp/Down/Enter/Escape on the input) and the `cycleTheme` for its internal
toggle-theme action.

#### POS page (`src/features/sales/pages/pos-page.tsx`)
Removed 4 `useHotkey` calls. Now listens for `shortcut:escape` and `shortcut:pos`
custom events. Reassigned shortcuts: F2 → product search (was customer), F4 →
customer (was payment), F6 → vehicle (new, placeholder), F10 → payment (was
checkout).

### Files created/modified
- `src/lib/shortcuts/shortcuts.ts` — expanded from 9 to 13 shortcuts
- `src/lib/theme-cycle.ts` — new shared theme cycling utility
- `src/components/shortcut-provider.tsx` — new centralized shortcut handler
- `src/layouts/app-shell.tsx` — added ShortcutProvider
- `src/components/command-palette.tsx` — removed useHotkey calls, removed global Escape listener
- `src/features/sales/pages/pos-page.tsx` — replaced useHotkey with custom event listeners
- `src/i18n/locales/en/help.json` — added keys for new shortcuts
- `src/i18n/locales/es/help.json` — added keys for new shortcuts
- `tests/unit/lib/shortcuts.test.ts` — new, 10 tests
- `tests/unit/lib/theme-cycle.test.ts` — new, 4 tests
- `tests/unit/components/shortcut-provider.test.tsx` — new, 8 tests
- `tests/unit/components/pos-page.test.tsx` — updated Escape/F10 tests, added F2 test

### Tests executed
- `npm run typecheck` — ✅ passed.
- `npm run lint` — ✅ 0 errors (pre-existing warnings).
- `npx vitest run` — ✅ **49 files / 374 tests passed** (22 new: 10 shortcuts, 4 theme-cycle, 8 shortcut-provider).
- `cargo test` — ✅ **72 passed** (unchanged).

### Verification status
- **GREEN.** Typecheck clean, lint 0 errors, 374 frontend + 72 Rust tests pass.

### Architectural decisions
- **Centralized registry + distributed listeners.** The `shortcuts.ts` registry is the
  single source of truth for metadata (used by help page). The `ShortcutProvider`
  handles global shortcuts; page-specific shortcuts use custom events dispatched
  by the provider and listened by pages. This avoids a single component needing
  to know about every page's internals.
- **Custom events for page-specific shortcuts.** The `ShortcutProvider` detects
  the current route and dispatches `shortcut:pos` / `shortcut:escape` events.
  Pages listen for these events. This decouples the provider from page internals
  while keeping shortcut registration centralized.
- **Escape priority chain.** Command palette > Radix dialog `[data-state='open']` >
  page-specific handler. The provider checks each in order and stops when one
  consumes the event.
- **Shared theme cycling.** Extracted from the command palette into `lib/theme-cycle.ts`
  so both the provider and palette use the same logic without duplication.

### Known issues discovered
- F6 vehicle selector is a no-op placeholder — the POS page does not yet have a
  vehicle selector component. This will be implemented in TASK 19 (Customer +
  vehicle unified workflow).
- `Ctrl+S` and `Ctrl+P` dispatch custom events (`shortcut:save`, `shortcut:print`)
  but no pages currently listen for them. They are registered for future use when
  forms and document pages need context-aware save/print.
- The `useHotkey` hook attaches to `window` — POS shortcuts (F2/F4/F6/F10) fire
  even when focused on inputs. This is intentional for POS keyboard-driven
  operation but could interfere with input typing if any F-key is used in an
  input field (unlikely in practice).

### Next recommended task
**TASK 11 — Quick Actions dashboard.** Employee-oriented operational dashboard:
new sale, receive purchase, search product/customer, inventory, PO, returns;
"needs attention" section. Do not duplicate the executive analytics dashboard.

---

## TASK 11 — Quick Actions dashboard ✅

**Status:** Complete
**Date:** 2026-08-19
**Branch/commit:** (uncommitted)

### What this task was
Replaced the hardcoded static dashboard mockup with a real, data-driven
employee-oriented operational dashboard. The new dashboard focuses on quick
actions (daily tasks), a "needs attention" section (actionable alerts), and
today's summary stats — all pulling live data from existing Tauri commands.

### Deliverables
- **Quick Actions grid** — 6 clickable cards (New Sale, Receive PO, Products,
  New Customer, New PO, Inventory) navigating to their respective routes.
- **Today at a Glance** — 4 stat cards with live data: revenue, sales count,
  low stock, new customers.
- **Needs Attention** — Dynamic list of actionable items with severity badges
  (out of stock, low stock, pending POs, awaiting approval, reminders,
  warranties). All items navigate to their relevant page. Shows "All clear!"
  when nothing needs attention.
- **Recent Sales** — Last 5 sales with sale number, time, total, payment status.
  Click navigates to sale detail. "View all sales" link to `/sales`.

### Files created/modified
- `src/features/dashboard/pages/dashboard-page.tsx` — Full rewrite: replaced
  hardcoded mockup with real Tauri data queries (react-query) and navigation.
- `src/i18n/locales/en/dashboard.json` — Replaced old static keys with new
  structured keys for actions, attention items, stats.
- `src/i18n/locales/es/dashboard.json` — Spanish translations for all new keys.
- `tests/unit/components/dashboard-page.test.tsx` — 6 tests: page renders,
  quick actions present, stats display, attention items with data, recent sales,
  all-clear state.

### Architecture notes
- Uses 5 Tauri commands in parallel via react-query: `getDashboardWidgets`,
  `getPurchaseDashboard`, `getCrmDashboard`, `getDashboardStats`, `getSales`.
- Attention items are computed from query results (not a separate API).
- No new Tauri commands needed — everything built on existing infrastructure.

### Known issues
- None.

### Next recommended task
**TASK 13 — Automotive vehicle-to-part search.** Vehicle → Make → Model → Year →
Engine → Compatible parts. Inspect existing vehicle/compatibility schema; do not
duplicate. Minimum viable Part Finder with product/brand/SKU/OEM/stock/price. Tests.

---

## TASK 12 — Product 360° page ✅

**Status:** Complete
**Date:** 2026-08-18 (prior session)
**Branch/commit:** `8da1de1`

### What this task was
Comprehensive product detail page with 6-tab Radix UI interface: Overview,
Inventory, Pricing, Suppliers, Compatibility, Activity. Implemented in a prior
session.

### Files created/modified
- 6 tab components in `src/features/inventory/components/`
- `src/features/inventory/pages/product-detail-page.tsx` — rewritten with tabs
- 20 i18n keys (en/es) for tab labels
- 22 unit tests covering all 6 tab components

---

## TASK 13 — Automotive vehicle-to-part search (Part Finder) ✅

**Status:** Complete
**Date:** 2026-08-19
**Branch/commit:** (uncommitted)

### What this task was
Built a standalone Part Finder feature at `/part-finder` that allows users to
search compatible parts by vehicle make, model, generation, year, engine, and
transmission. Cascading selectors filter downstream options. Reuses the existing
`search_compatible_products` and `get_recommendations_for_vehicle` Tauri commands.

### Deliverables
- **Part Finder page** — 7-selector grid: Brand → Model → Generation → Year →
  Engine → Transmission + free-text search. All selectors cascade: selecting a
  brand loads its models, selecting a model loads its generations, and selecting
  a generation narrows the year range.
- **Compatible Parts results** — Card grid with product name, SKU, category,
  brand, price, stock badge. Click navigates to product detail.
- **Recommended Parts sidebar** — Category-filtered recommendations based on
  selected vehicle, auto-fetched on brand/model change.
- **Empty/loading/error states** — Skeleton loading, "select and search"
  placeholder, "no results" empty state, toast errors.
- **11 unit tests** — page renders, labels, brand loading, cascading model,
  cascading generation, search call, results display, out-of-stock badge,
  empty results, recommendations, disabled model.

### Files created/modified
- `src/features/part-finder/index.ts` — barrel export
- `src/features/part-finder/pages/part-finder-page.tsx` — main page component
- `src/i18n/locales/en/part-finder.json` — English i18n (25 keys)
- `src/i18n/locales/es/part-finder.json` — Spanish i18n (25 keys)
- `src/i18n/config.ts` — registered `part-finder` namespace
- `src/routes/index.tsx` — added `/part-finder` route
- `src/layouts/sidebar.tsx` — added Part Finder nav item with ScanLine icon
- `tests/unit/components/part-finder-page.test.tsx` — 11 tests

### Architecture notes
- No Rust backend changes needed — the existing `search_compatible_products`
  command already supports brand, model, year, engine, and transmission filters.
- Generation filtering is handled client-side: when a generation is selected,
  the year dropdown is narrowed to its yearStart–yearEnd range.
- The page uses `useTranslation("part-finder")` with a dedicated namespace.

### Known issues
- The legacy `CrmCompatibilityPage` at `/crm/compatibility` still exists with
  the old basic implementation. Consider deprecating it in favor of the new
  Part Finder, or redirecting `/crm/compatibility` to `/part-finder`.
- Engine list is loaded globally (all engines). A production Part Finder would
  benefit from filtering engines by brand/model/year, but this requires either
  cross-referencing `product_vehicle_compatibility` or `customer_vehicles` data.

### Next recommended task
**TASK 14 — OEM and cross-reference support.** OEM numbers, manufacturer numbers,
alternative numbers, cross-references. Search one identifier → find products.

---

## TASK 14 — OEM and cross-reference support ✅

**Completed:** 2026-08-19

### Summary
Added a unified cross-reference identifier system that supports many-to-many
product-to-identifier mappings. Each product can have multiple identifiers of
different types (OEM, aftermarket, interchange, supersession, cross-reference).
A new Cross References search page lets users find products by any identifier.

### Backend
- **Schema v11:** Added `product_identifiers` table with `id`, `product_id`,
  `identifier`, `identifier_type`, `brand_name`, `notes`, `created_at`. Indexed
  on `identifier`, `product_id`, and `identifier_type`.
- **Commands:** `get_product_identifiers`, `create_product_identifier`,
  `delete_product_identifier`, `cross_reference_search`. The search command
  queries both product fields (SKU, barcode, OEM, internal_code, name) and the
  `product_identifiers` table, deduplicating by product_id.

### Frontend
- **Cross References page** (`/inventory/cross-references`): Full-text search
  across all product fields and cross-reference identifiers. Results show
  product name, SKU, category, brand, price, stock, and matched identifier type.
- **Product Identifiers tab** added to Product 360° page. CRUD for identifiers
  with type selector, optional brand name and notes. Identifiers grouped by type.
- **Sidebar:** Added "Cross References" under Inventory section with Link2 icon.

### Files created/modified
- `src-tauri/src/db/schema.rs` — version 10→11, `product_identifiers` table
- `src-tauri/src/commands/cross_references.rs` — new file, 4 Tauri commands
- `src-tauri/src/commands/mod.rs` — register `cross_references` module
- `src-tauri/src/lib.rs` — register 4 new commands
- `src/types/index.ts` — `ProductIdentifier`, `CrossReferenceResult` interfaces
- `src/lib/tauri.ts` — 4 new TypeScript bindings
- `src/features/inventory/pages/cross-references-page.tsx` — new page
- `src/features/inventory/components/product-identifiers-tab.tsx` — new component
- `src/features/inventory/pages/product-detail-page.tsx` — add Identifiers tab
- `src/features/inventory/index.ts` — export `CrossReferencesPage`
- `src/routes/index.tsx` — add `/inventory/cross-references` route
- `src/layouts/sidebar.tsx` — add cross-references nav item
- `src/i18n/locales/en/inventory.json` — 11 new keys
- `src/i18n/locales/es/inventory.json` — 11 new keys
- `src/i18n/locales/en/common.json` — added `results` key
- `src/i18n/locales/es/common.json` — added `results` key
- `tests/unit/components/cross-references-page.test.tsx` — 11 tests
- `tests/unit/components/product-identifiers-tab.test.tsx` — 11 tests

### Test results
- 22 new frontend tests, all passing
- 72 Rust tests passing
- Full verify (typecheck + lint + vitest + rust) green

### Known issues / future improvements
- Cross-reference search currently uses simple LIKE queries. Fuzzy/approximate
  matching could improve results for partial identifiers.
- The identifiers tab could show a "supersedes" chain visualization for
  supersession-type identifiers.
- Bulk import of cross-references from CSV/Excel is not yet supported.

## CRM pages i18n cleanup

Localized all remaining hardcoded English user-facing strings across the 9 CRM
pages (dashboard, customers, customer detail, vehicles, warranties, reminders,
notes, credit, compatibility). Every JSX text node and label/title/placeholder
now resolves through the `crm` i18n namespace.

### Files modified
- `src/features/crm/pages/crm-dashboard-page.tsx`
- `src/features/crm/pages/crm-customers-page.tsx`
- `src/features/crm/pages/crm-customer-detail-page.tsx`
- `src/features/crm/pages/crm-vehicles-page.tsx`
- `src/features/crm/pages/crm-warranties-page.tsx`
- `src/features/crm/pages/crm-reminders-page.tsx`
- `src/features/crm/pages/crm-notes-page.tsx`
- `src/features/crm/pages/crm-credit-page.tsx`
- `src/features/crm/pages/crm-compatibility-page.tsx`
- `src/i18n/locales/en/crm.json` — ~90 new flat keys
- `src/i18n/locales/es/crm.json` — matching Spanish translations

### Test results
- `npm run typecheck` — passing
- `node /tmp/opencode/audit-i18n.mjs` — 0 missing in ES, 0 missing in EN

## Admin pages i18n cleanup

Localized all remaining hardcoded English user-facing strings across the Admin
pages (audit, database, devices, license, printers, roles, role form, settings,
updates, user form, users, about, diagnostics, maintenance). Every JSX text
node and label/title/placeholder now resolves through the `admin` i18n
namespace.

### Files modified
- `src/features/admin/pages/admin-audit-page.tsx` … `admin-users-page.tsx`
  (12+ pages)
- `src/i18n/locales/en/admin.json`, `es/admin.json` — ~45 new flat keys each

### Test results
- audit script — 0 missing in ES, 0 missing in EN

## Sales / customers i18n cleanup

Localized remaining hardcoded English in Sales pages (POS, cash register,
closeout, quotes, quote form/detail, receipts, returns, sale detail, sales)
and customers pages; added ~59 `common` + `customers` keys (es+en), including
payment-method icons and the quote workflow labels.

### Files modified
- `src/features/sales/pages/*.tsx`, `src/features/customers/pages/customer-detail-page.tsx`
- `src/i18n/locales/{en,es}/common.json`, `customers.json`, `sales.json`

### Test results
- audit script — 0 missing in ES, 0 missing in EN

## Shared components + Reports i18n cleanup

Localized shared components (customer-search-field, product-search-combobox,
table-placeholder, dialog sr-only close, print templates, help page
keyboard-shortcuts) under the `common` namespace, and all Reports pages under
the `reports` namespace. Rewrote `reports-purchasing-page.tsx` to move
TABS/columns into the component with `t()` — this also fixed an undefined
`setActiveTab` (the previous typecheck gate had been silently passing).

### Files modified
- `src/components/forms/customer-search-field.tsx`,
  `src/components/product-search-combobox.tsx`,
  `src/components/table-placeholder.tsx`, `src/components/ui/dialog.tsx`,
  `src/components/print/templates.tsx`, `src/features/help/pages/help-page.tsx`
- `src/features/reports/components/report-charts.tsx`, `report-table.tsx`,
  `report-filters.tsx`
- `src/features/reports/pages/reports-purchasing-page.tsx` (+8 other reports pages)
- `src/features/inventory/components/product-inventory-tab.tsx`
- `src/i18n/locales/{en,es}/common.json`, `reports.json` (+~90 keys)
- `tests/unit/components/product-search-combobox.test.tsx` — added `setupI18n("en")`

### Test results
- audit script — 0 missing in ES, 0 missing in EN

## Typecheck gate was a no-op — fixed and 158 latent errors resolved

`npm run typecheck` (`tsc --noEmit`) silently compiled **0 files**: the root
`tsconfig.json` is a solution file with `files: []`, and `tsc --noEmit` in
non-build mode ignores project references. `npm run build` already used `tsc -b`
and typechecked correctly. Root cause verified with `--listFilesOnly`
(0 vs 976 files). Fixed by changing the script to `tsc -b`
(both referenced configs are `noEmit: true`, so it only typechecks).

The now-real gate surfaced **158 genuine type errors**, all fixed across 5
parallel cleanup batches — no runtime behavior changes:

- **Admin** — 8 `dashboard` possibly-null guards; removed unused
  `Filter/Button/Badge/AlertTriangle/Smartphone/Trash2/CardHeader/...`; guarded
  `noUncheckedIndexedAccess`; added `id?: string` to `ui/checkbox.tsx`.
- **Sales** — removed unused `DialogTrigger/Separator/Badge/CreditCard/...`;
  aligned DataTable columns as `TableColumn<X>[]` (cell fns now read the row);
  `setValidUntil(e.target.value)` fix; `if (!sale) return` print guard.
- **Purchases** — removed unused `Eye/NumberField/SelectField/...`;
  `InventorySupplier`/`Warehouse` imported from `@/types/inventory`;
  `products?.data ?? []` fixes the `never[]` query typing; rebuilt two return
  items with explicit fields; `cancelled` badge variant `outline`→`secondary`.
- **Reports** — `percent` `?? 0` guards; report data arrays cast
  `as unknown as Record<string, unknown>[]`; removed non-existent `horizontal`
  prop on `BarChartCard` (was inert at runtime); `SupplierPerformanceReport` →
  `SupplierPerformance`.
- **Misc** — `use-hotkey`/`theme-cycle`/`command-palette` `?? ""`/`?? "light"`
  index guards; removed unused lucide imports (`sidebar`, `commands`);
  removed invalid `DailyCloseout.date` references (type has no date field);
  `CompatibilityEntry` uses `brandName`/`modelName`; `cross-references-page`
  Section got the missing `title={t("common.search")}`.

### Test results
- `npm run typecheck` — **exit 0, 0 errors** (real gate)
- `npm run lint` — exit 0, 0 errors (35 pre-existing warnings)
- `vitest run` — 55 files / 431 tests passing
- audit script — 0 missing in ES, 0 missing in EN, 0 EN-only, no fallbacks
- All 42 locale JSON files parse

### Known issue (not fixed by design)
- `cargo test` fails 2 env-dependent config tests on this machine because
  `~/.local/share/inventory-gear/profile.json` = `single-store`; no `src-tauri`
  changes made. Logged in `docs/BUG_FIX_LOG.md`, `docs/KNOWN_ISSUES.md`.

### Docs updated
- `docs/I18N.md` (21 namespaces, flat-key convention, audit methodology),
  `docs/CHANGELOG.md`, `docs/KNOWN_ISSUES.md`, `docs/BUG_FIX_LOG.md`.

## Demo catalog database (`inventory-gear-demo.db`)

Added a dedicated demo database whose product catalog is exactly a 19-item
steering/suspension parts list (real-world invoice data: muñones, terminales,
brazos de cremallera, rótulas, barras estabilizadoras, juntas y capuchones for
Toyota Corolla/Ipsu/Caldina/Hiace/Noah/Voxy/Yaris/RAV4 and King Long).

### How it works
- `scripts/database/seed-demo-catalog.mjs` (`npm run db:demo`) clones the app
  schema + users/roles/permissions/settings from an already-initialized profile
  DB (via `VACUUM INTO`), wipes ALL business/reference rows, then inserts:
  - 2 categories (`Dirección`, `Suspensión`), 2 brands (`Toyota Genuine`,
    `TRW`), 1 supplier, 1 warehouse (WH-001) with 12 storage locations
  - exactly the 19 products, mapped per the owner's decisions:
    `sku = Código_2` (falls back to `Código` when empty), `oem_number = Código`,
    `internal_code = Código`, `sale_price = Precio/u`, `cost_price ≈ 70%` of
    sale, `stock_quantity = Cant`, plus `product_identifiers` rows (`oem` for
    `Código`, `alternate` for `Código_2`) so both codes are searchable from the
    Cross References page
- Output lands at `~/.local/share/inventory-gear/inventory-gear-demo.db`
  (integrity_check OK, catalog value 5,628.00 matches the invoice total).
- `npm run db:demo:activate` copies the demo file over the active profile DB
  (`single-store`), keeps a `.bak-demo-<ts>` backup, and points `profile.json`
  at it — restart the app to browse the demo.
- Reversible: `npm run db:reset:single-store` restores the regular seed.

### Files
- `scripts/database/seed-demo-catalog.mjs` (new)
- `package.json` — `db:demo`, `db:demo:activate` scripts
- `docs/CHANGELOG.md` — entry

## Sales dashboard KPI fix

The four Ventas KPIs (Ingresos de Hoy, Transacciones de Hoy, Pedido Promedio,
Ventas del Mes) now update immediately after sales are created/refunded and use
correct date windows. Logged in `docs/BUG_FIX_LOG.md` (2026-09-24).

### Root cause (two layers)
1. **Stale query cache** — POS/refund/convert mutations invalidated `["sales"]`,
   `["pos-search"]`, `["daily-closeout"]` but not `["sales-summary"]` nor
   `["dashboard-widgets"]`; `staleTime: 5min` kept the summary "fresh" so it
   never refetched when returning to the dashboard.
2. **Wrong windows** — `get_sales_summary` compared local `today_date()` vs UTC
   `date(created_at)` (off by up to ~20h on UTC-4) and month was a rolling 30-day
   window, not the calendar month.

### Fix
- Rust: `sales_summary_for(conn, now)` + chrono helpers
  (`utc_bounds_for_local_day`, `utc_bounds_for_local_month`,
  `local_day_start_utc`) — local calendar day/month → UTC ranges; `get_sales_summary`
  calls it with `Local::now()`. Refunded excluded, pending/partial counted, week
  and top-products stay rolling.
- Frontend: added `["sales-summary"]` + `["dashboard-widgets"]` invalidations to
  `pos-page.tsx`, `sale-detail-page.tsx`, `returns-page.tsx`; `quote-detail-page.tsx`
  also gains `["daily-closeout"]`.

### Files
- `src-tauri/src/commands/sales.rs` (+ 9 `#[cfg(test)]` tests)
- `src/features/sales/pages/{pos-page,sale-detail-page,returns-page,quote-detail-page}.tsx`
- `tests/helpers/render.tsx`, `tests/unit/components/pos-page.test.tsx`,
  `tests/unit/components/sales-kpi-refresh.test.tsx` (new)
- `docs/BUG_FIX_LOG.md`, `docs/CHANGELOG.md`

### Verification
- `npm run typecheck` ✓ · `npm run lint` (0 errors) ✓ · `npx vitest run` 434/434 ✓
  · `cargo test --lib` 94 passed / 2 pre-existing env-dependent config failures
- Live SQL sanity check on a copy of the active demo DB (inserted today 100+50,
  same-month 25, previous-month 40, refunded 200): today=2/$150, month=3/$175,
  boundary correct (UTC 04:00). Commit: 9f02059

### Product import reference template (example workbook)
- `docs-site/public/samples/inventory-gear-product-import-example.xlsx` — the
  demo catalog table extended to the full `products` import shape (identity,
  pricing, stock, org, state + `product_identifiers`), plus a
  "Maestros de referencia" sheet. Documented with column map + import rules in
  `docs-site/inventory/products.md` ("Import Reference Template"). Reference
  format for the future bulk-import feature.

---

## TASK 15 — Bulk Excel product import / export ✅

**Completed:** 2026-09-24 · **Commit:** f284fdd

### Summary
Bulk Excel (.xlsx) import/export for products and stock in Inventory Gear:
export the catalog or an empty template workbook, and import with Append /
Update modes through a preview-then-execute wizard that is transactional and
multi-store aware. Uses the `tauri-plugin-dialog` file dialogs.

### Backend (Rust)
- **Schema v12:** added `import_history` table (id, filename, import_mode,
  insert_count, update_count, skip_count, error_count, stock_increase_count,
  stock_decrease_count, created_by, created_at) and permissions
  `inventory.export` / `inventory.import`.
- **`src-tauri/src/commands/import_export.rs`** (new, ~2000 lines incl. tests):
  - `export_products_xlsx(state, path, scope?, created_by?)` — workbook with
    sheet `Productos` (27 official columns in reference order) + sheet
    `Maestros de referencia` (Tabla destino | Campo | Valor). Scope `all`
    includes inactive/discontinued; default `active`.
  - `export_products_template(state, path)` — same workbook, empty rows.
  - `preview_product_import(state, path, mode?, store_id?)` —
    re-parses + validates the file; classifies every row (insert/update/skip/
    error); capped preview at 500 rows (`rows_truncated`); errors uncapped.
  - `execute_product_import(state, path, mode?, store_id?, created_by?)` —
    re-validates server-side; all writes in one `BEGIN IMMEDIATE` transaction,
    rollback on any error (all-or-nothing); writes `product_identifiers`
    (type `oem` for Código, `alternate` for Código_2), stock movements of type
    `import` (notes `Importación Excel`), and an `import_history` row.
  - `get_import_history(state)` — most recent first.
- Matching identity order: SKU → Código (oem/identifier/internal_code) →
  barcode. Append = skip existing; Update = only non-empty columns, *Stock
  inicial* is absolute resulting stock (movement = difference). References
  (Categoría/Marca/Fabricante/Proveedor/Almacén/Ubicación) resolve against the
  refs sheet; near-miss values get accent-insensitive suggestions via
  `normalize_word`.
- Store semantics: stores == active warehouses; single store ⇒ optional/empty
  store_id; multi-store ⇒ `store_id` must match each row's Almacén.
- 9 `#[cfg(test)]` tests (`cargo test --lib import_export` — 9 passed).

### Frontend
- `src/types/inventory.ts` — `ImportAction`, `ImportMode`, `ExportScope`,
  `RowPreview`, `RowError`, `ImportPreview`, `ImportResult`, `ExportResult`,
  `ImportHistoryRow` (camelCase matching serde).
- `src/lib/tauri.ts` — wrappers `exportProductsXlsx`, `exportProductsTemplate`,
  `previewProductImport`, `executeProductImport`, `getImportHistory`.
- `src/features/inventory/pages/import-export-page.tsx` (new) — 3 cards
  (Export / Template / Import), file picker, mode + store selectors, preview
  DataTable with action badges (insert/update/skip/error) and stock change,
  per-row error list (blocks Import now when errorCount > 0), result panel,
  import-history DataTable. Gated by `usePermission("inventory.export" /
  "inventory.import")`; page shows a permission message when neither. After a
  successful import invalidates `inventory-products`, `inventory-movements`,
  `inventory-dashboard`, `import-history`.
- Registered in `src/features/inventory/index.ts`, route `inventory/import-export`
  in `src/routes/index.tsx`, sidebar child with `FileSpreadsheet` icon.
- i18n keys added in `src/i18n/locales/{es,en}/inventory.json` (importExport
  block) and `createdBy` in `{es,en}/common.json`. Interpolation placeholders
  use `{{var}}` (single braces are NOT interpolated by i18next).

### Files
- `src-tauri/src/db/schema.rs`, `src-tauri/src/db/seed.rs`,
  `src-tauri/src/commands/import_export.rs` (new), `src-tauri/src/commands/mod.rs`,
  `src-tauri/src/lib.rs`, `src-tauri/Cargo.toml` (rust_xlsxwriter,
  tauri-plugin-dialog), `src-tauri/capabilities/default.json`
- `src/types/inventory.ts`, `src/lib/tauri.ts`,
  `src/features/inventory/pages/import-export-page.tsx` (new),
  `src/features/inventory/index.ts`, `src/routes/index.tsx`,
  `src/layouts/sidebar.tsx`
- `src/i18n/locales/{es,en}/{inventory,common}.json`
- `tests/unit/components/import-export-page.test.tsx` (new, 6 tests)
- `docs-site/inventory/import-export.md` (new), `docs-site/inventory/index.md`,
  `docs-site/.vitepress/config.ts`, `docs/CHANGELOG.md`

### Verification
- `npm run typecheck` ✓ (0 errors) · `npm run lint` ✓ (0 errors, 35
  pre-existing warnings) · `npx vitest run tests/unit` — 384/384 ✓ ·
  `cargo test --lib` — 9/9 import/export tests ✓

### Follow-up: Demo catalog import source
**Commit:** 93863d4 · **Date:** 2026-09-24

The Import card gained a **Source** selector: *File (Excel)* (default) or
*Demo catalog* — the latter previews/executes the bundled 19-product example
workbook without a file dialog (user request, confirmation asked and answered).

- `src-tauri/src/commands/import_export.rs`: `DEMO_WORKBOOK` embedded via
  `include_bytes!` from `docs-site/public/samples/inventory-gear-product-import-example.xlsx`;
  `demo_workbook_file()` materializes it to `$TMP/inventory-gear/…` at first use
  (overwrites each call to avoid stale copies); new commands
  `preview_demo_catalog` + `execute_demo_catalog` reuse `preview_internal` /
  `execute_internal`. Registered in `src-tauri/src/lib.rs`.
- Frontend: `previewDemoCatalog` / `executeDemoCatalog` wrappers in
  `src/lib/tauri.ts`; `ImportSource` state (`file` | `demo`) + selector on the
  Import card; preview/import mutations branch on the source; picking a file
  resets the source to `file`.
- i18n: `importSource`, `importSourceFile`, `importSourceDemo`,
  `demoCatalogName`, `demoCatalogNotice` in `{es,en}/inventory.json`.
- Tests: +1 Rust (`test_demo_workbook_parses_nineteen_rows`, 10 total) and +2
  Vitest (demo-source flow, preview disabled without file — 8 total).
- Docs: `docs-site/inventory/import-export.md` Step 1 now "Choose a data
  source"; `docs/CHANGELOG.md` updated.
- Verification: `cargo test --lib import_export` 10/10 ✓ · vitest 386/386 ✓ ·
  typecheck ✓ · lint 0 errors ✓ · `npm run build` ✓ · `npm run docs:build` ✓ ·
  full `cargo test --lib` 104 passed / 2 pre-existing env-dependent config
  failures (unchanged, `config.rs` untouched).
