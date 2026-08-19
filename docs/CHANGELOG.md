# Documentation Changelog

All notable changes to the Inventory Gear documentation are documented here.

Format based on [Keep a Changelog](https://keepachangelog.com/).

---

## [1.0.0] - 2026-08-19

### Added

- VitePress documentation infrastructure
- User Manual with 30+ documentation pages
- Search functionality (VitePress local search)
- PDF generation pipeline (Playwright)
- In-app manual viewer (React iframe integration)
- Custom theme with Inventory Gear branding
- 66 screenshots (light + dark themes) integrated

### Documented Modules

- Getting Started (Introduction, Installation, Login, First Steps)
- Dashboard overview
- Inventory (Products, Categories & Brands, Warehouses, Stock & Movements, Cross References)
- Sales (POS, History, Quotes, Returns, Cash Register, Receipts & Closeout)
- Purchasing (Overview, Orders, Receiving, Supplier Products)
- CRM (Overview, Customers, Vehicles & Compatibility, Reminders & Warranties, Credit & Notes)
- Part Finder (Vehicle-to-Part Search)
- Reports (Executive, Sales, Inventory, Purchasing, Customers, KPIs)
- Administration (Overview, Users & Roles, Settings, Database, Diagnostics)
- Settings & Help
- Troubleshooting
- Developer (Architecture, Development Guide, Testing)

### Infrastructure

- `docs-site/` — VitePress source directory
- `docs-site/.vitepress/config.ts` — VitePress configuration with Inventory Gear theme
- `docs-site/.vitepress/theme/` — Custom CSS and theme
- `scripts/build-docs.mjs` — Build + copy script
- `scripts/generate-pdf.mjs` — PDF generation with Playwright
- `src/features/manual/manual-page.tsx` — React wrapper for in-app manual
- `/manual` route in application
- Sidebar entry for User Manual

### Commands Added

- `npm run docs:dev` — VitePress dev server
- `npm run docs:build` — Build documentation
- `npm run docs:preview` — Preview built docs
- `npm run docs:pdf` — Generate PDF manual
