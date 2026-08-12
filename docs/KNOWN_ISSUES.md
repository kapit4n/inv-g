# Known Issues

> **Last updated:** 2026-08-12
> **Source of truth:** Visual QA findings are tracked in detail in
> [`quality/visual_analysis/BUG_LIST.md`](../quality/visual_analysis/BUG_LIST.md)
> and the generated report at `quality/dashboard.md`. Bug fixes are logged in
> [`docs/BUG_FIX_LOG.md`](./BUG_FIX_LOG.md).
>
> Older "placeholder / no CRUD / no auth" entries were removed — those are long
> since implemented (see `docs/ROADMAP.md`).

---

## Critical

1. **Reports crash on null/undefined values** (C-01) — `v.toLocaleString()`
   throws when a report value is null/undefined. Unconfirmed; fix with
   null-coalescing. Visual QA: all report screenshots (41–52).
2. **Mock backend hides real data-fetching failures** (C-02) — the 66
   screenshots rely on the Playwright IPC mock; real Rust backend failures are
   invisible. Fix: run screenshots against a built binary in CI.

## Major

1. **Product list count mismatch** (M-01) — mock returns 5 products but
   claims 144 total.
2. **`get_user_sessions` returns snake_case** (M-02) — mock does not convert to
   camelCase; frontend expects camelCase.
3. **Chart `dataKey` mappings not uniform** (M-03) — report/dashboard charts may
   have wrong data keys after refactors.
4. **POS product search selector is locale-dependent** (M-04) — hardcoded
   Spanish placeholder in tests.
5. **Login debug panel / language toggle only tested in Spanish** (M-05, M-12).
6. **CRM cascading selects may not handle async loading** (M-06).
7. **Reports export/scheduled pages empty without seeds** (M-07).
8. **Inventory movements depend on workflow-generated data** (M-08).
9. **No loading/error-state screenshots captured** (M-09).
10. **Dark theme WCAG contrast unverified** (M-10).
11. **Inventory dashboard stat cards mismatch** (M-11) — 8 cards vs 5 data
    points.

## Medium

1. **Product detail shows empty images section** (ME-01).
2. **Customer detail only shows default tab** (ME-02).
3. **Cash register history may be out of viewport** (ME-03).
4. **Quote form / PO form items tables empty in screenshots** (ME-04, ME-05).
5. **No notification-state screenshots** (ME-06) and stacked-toast dismissal
   unreliable (ME-07).
6. **Thumbnails may be full resolution** (ME-08) — sharp fallback copies full
   images.

## Minor

1. **Compatibility tab not visible in default product view** (MI-01).
2. **No form validation error screenshots** (MI-02).
3. **No responsive/mobile screenshots** (MI-03).
4. **`fullPage` screenshots may be very tall** (MI-04).

---

## Non-visual / project issues

1. **Version consistency** — was `package.json` (0.0.0) vs `tauri.conf.json`,
   `Cargo.toml`, and seed data (0.1.0); STATUS.md previously claimed 0.11.0.
   **Resolved in TASK 01** — all aligned to **0.1.0**. Note: version is not
   bumped per milestone; milestones are the authoritative history.
2. **Stale Drizzle schema** — `database/schema.ts` (11 tables) is not the
   source of truth; the real schema is `src-tauri/src/db/schema.rs` (v8).
   Drizzle generate/migrate scripts are effectively dead — treat them as
   read-only reference.
3. **Two settings backends** — `src-tauri/src/commands/settings.rs` (flat
   key/value) and `src-tauri/src/commands/admin/settings.rs` (rich AppSetting)
   both read the `settings` table; consolidate before adding new settings.
4. **Command palette is a placeholder** — filters a hardcoded list but does not
   navigate (TASK 09 scope).
5. **POS product search is simple LIKE** — no FTS/OEM/barcode breadth (TASK 06
   scope).
6. **Mixed Rust DB state patterns** — some commands use global `DB_STATE`,
   others `State<DbState>`.
7. **Synced (`pub fn`) DB commands** — several command modules do blocking work
   without `spawn_blocking`; perf risk on report aggregations.

## Previously fixed (see `docs/BUG_FIX_LOG.md`)

| ID | Bug | Fixed In |
|----|-----|----------|
| F-01 | Reports page crashed on `v.toLocaleString` | `d0bf1b8` |
| F-02 | Inventory/reports empty state (snake_case vs camelCase + Tauri state) | `d0bf1b8` |
