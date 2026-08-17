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
