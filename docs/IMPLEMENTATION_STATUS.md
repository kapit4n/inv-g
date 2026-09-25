# Documentation System Implementation Status

**Date:** 2026-08-19
**Status:** In Progress

---

## Architecture

### Current State
- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS v4
- **Backend:** Tauri v2 + Rust + SQLite/Rusqlite
- **Existing manual:** 1150-line USER_MANUAL.md + 20 module docs in `docs/manual/modules/`
- **Screenshots:** 66 screenshots (light + dark themes) in `docs/screenshots/`
- **Desktop app:** Tauri v2 (CSP: `default-src 'self'; style-src 'self' 'unsafe-inline'`)

### Documentation Strategy
```
docs/manual/*.md (Markdown source — single source of truth)
        │
        ├──────────────────┐
        ↓                  ↓
    VitePress            PDF (Playwright)
        │                  │
        ↓                  ↓
  Web Documentation   Downloadable PDF
        │
        ↓
  Inventory Gear (iframe at /manual)
```

### Integration Approach
- VitePress builds static HTML to `docs-site/.vitepress/dist/`
- Build script copies output to `public/manual/`
- React app serves manual via `<iframe src="/manual/index.html">`
- Tauri bundles `public/manual/` into the desktop app
- PDF generated via Playwright from built VitePress output

---

## Detected Features

### Modules Documented
| Module | Pages | Manual Doc | Screenshot |
|--------|-------|------------|------------|
| Auth (Login) | 1 | auth.md | 01-login |
| Dashboard | 1 | dashboard.md | 05-dashboard |
| Inventory | 20 | inventory.md | 08-17 inventory |
| Sales | 10 | sales.md, pos.md, quotes.md, returns.md, receipts.md, closeout.md, cash-register.md | 18-26 sales |
| Purchasing | 11 | purchasing.md | 27-36 purchases |
| CRM | 9 | crm.md, customers.md, vehicles.md, compatibility.md | 37-44 crm |
| Reports | 12 | reports.md | 45-56 reports |
| Admin | 17 | admin.md | 57-70 admin |
| Employees | 1 | employees.md | — |
| Settings | 1 | settings.md | — |
| Help | 1 | help.md | — |
| Part Finder | 1 | — | — |
| Cross References | 1 | — | — |
| Warehouse | 1 | — | — |

---

## Files to Create

### Infrastructure
- `docs-site/.vitepress/config.ts` — VitePress configuration
- `docs-site/index.md` — Landing page
- `docs-site/.vitepress/theme/index.ts` — Custom theme (Inventory Gear branding)

### Manual Pages (VitePress)
- `docs-site/manual/*.md` — Module documentation pages
- `docs-site/manual/screenshots.md` — Screenshot gallery

### Integration
- `src/features/manual/manual-page.tsx` — React wrapper for manual
- `src/routes/index.tsx` — Add `/manual` route
- `src/layouts/sidebar.tsx` — Add manual nav item
- `scripts/build-docs.mjs` — Build + copy script
- `scripts/generate-pdf.mjs` — PDF generation

### Documentation
- `docs/IMPLEMENTATION_STATUS.md` — This file
- `docs/CHANGELOG.md` — Documentation changelog
- `docs/IMPLEMENTATION_REPORT.md` — Final report

---

## Commands

```json
{
  "docs:dev": "vitepress dev docs-site",
  "docs:build": "node scripts/build-docs.mjs",
  "docs:pdf": "node scripts/generate-pdf.mjs",
  "docs:check": "vitepress build docs-site --fail-on-dad-links"
}
```

---

## Progress

- [x] Architecture analysis
- [x] Feature identification
- [ ] VitePress infrastructure
- [ ] Manual content (VitePress pages)
- [ ] App integration (React page + route)
- [ ] PDF generation
- [ ] Search functionality
- [ ] CHANGELOG.md
- [ ] IMPLEMENTATION_REPORT.md
- [ ] AGENTS.md doc rules
- [ ] README update
- [ ] Build verification

---

## Database Profiles Milestone (2026-09-18)

Feature marker: **in-progress from 2026-09-18.**

### Status
- [x] Assessment completed (`docs/database-profiles-assessment.md`)
- [x] Profile resolution + persistence (`src-tauri/src/config.rs`)
- [x] Profile-aware DB init & seeding (`src-tauri/src/db/{connection,seed}.rs`)
- [x] Business capabilities + store commands (`src-tauri/src/commands/business.rs`)
- [x] Store-aware POS checkout (`processCheckout` + `warehouseId`)
- [x] TSX seeder profile support (`database/seed/`)
- [x] Dev scripts (`scripts/database/*`, npm `db:*`)
- [x] Frontend: business store, hook, tauri wrappers, StoreSelector
- [x] Frontend: sidebar/route gating, transfers page, dashboard widgets, Dev Tools card
- [x] i18n (`en`/`es`, new `business` namespace)
- [x] Tests: Rust (87), Vitest (431), command contracts, business-gating
- [x] Docs: `database-profiles.md`, progress file, docs-site page, CHANGELOG
- [x] `npm run verify` green
- [ ] Live app check: run against single-store / multi-store / empty DBs
- [ ] Final implementation report (`docs/IMPLEMENTATION_REPORT.md`)

## Per-Product Pricing & Gains Milestone (2026-09-24)

### Status
- [x] Pricing domain (`src-tauri/src/pricing.rs`, mirrored in `src/lib/pricing.ts`)
- [x] Schema v14 additive migration + seed with implied margins
- [x] Backend: effective-price resolution on create/update, global-default reprice, pricing audit
- [x] Excel import/export 29-column layout with `% de ganancia` / `Precio editado`
- [x] Frontend: product form pricing fields, list columns, Pricing tab, i18n (es/en)
- [x] Tests: Rust pricing/import (10 each), Vitest pricing domain + Product 360 tabs
- [x] Docs: `docs-site/inventory/products.md`, `import-export.md`, CHANGELOG, ROADMAP, `MILESTONE_15.md`
- [x] `npm test` green (452), `cargo test --lib` 118 passed (2 pre-existing config failures)
