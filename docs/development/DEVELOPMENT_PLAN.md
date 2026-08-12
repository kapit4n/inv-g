# Inventory Gear — Development Plan (Post-Milestone 13)

**Date:** 2026-08-12
**Status:** Active development roadmap
**Related docs:** `docs/STATUS.md`, `docs/development/IMPLEMENTATION_PROGRESS.md`

---

## Purpose

Continue development of Inventory Gear from the current state documented in the project status.

Inventory Gear is a Tauri v2 + React 19 + TypeScript desktop ERP for automotive parts businesses, using SQLite/Drizzle, Rust Tauri commands, shadcn/ui, Tailwind CSS v4, and i18n.

The current project already contains:

- Authentication
- RBAC
- Inventory
- Products
- Brands
- Warehouses
- Locations
- POS
- Sales
- Payments
- Returns
- Purchasing
- Receiving
- Suppliers
- Customers
- Credit accounts
- CRM
- Vehicles
- Compatibility
- Warranties
- Reporting
- Analytics
- Administration
- Backups
- Testing infrastructure
- Screenshot/visual QA infrastructure

**The objective of the next development stage is NOT to create many additional CRUD modules.**

The objective is to make Inventory Gear significantly faster, easier, and more natural for an automotive-parts business employee to use.

---

# Development Roadmap

Organized around **usability and operational efficiency**. Phases are ordered so OpenCode works incrementally on a large, existing project.

| Phase | Focus                                    | Priority |
| ----- | ---------------------------------------- | -------- |
| 0     | Project cleanup + baseline               | 🔴 Critical |
| 1     | Production configuration                 | 🔴 Critical |
| 2     | POS UX foundation                        | 🔴 Critical |
| 3     | Global search + command palette          | 🔴 Critical |
| 4     | Keyboard-first workflows                 | 🟠 High |
| 5     | Product 360° view                        | 🟠 High |
| 6     | Automotive Part Finder                   | 🟠 High |
| 7     | Barcode workflows                        | 🟠 High |
| 8     | Warehouse workflows                      | 🟠 High |
| 9     | Printing & labels                        | 🟠 High |
| 10    | Customer + vehicle workflow              | 🟡 Medium |
| 11    | Attention Center & operational dashboard | 🟡 Medium |
| 12    | Multi-branch foundation                  | 🟡 Medium |
| 13    | Automation / AI                          | 🟢 Later |

**Do not start AI yet.**

---

# Phase 0 — Establish a development baseline

Before changing functionality, clean up the project's documentation and establish a single source of truth.

Create:

```text
docs/development/IMPLEMENTATION_PROGRESS.md
```

This becomes the persistent development journal. It contains:

```text
Current phase
Current task
Completed tasks
Files changed
Tests executed
Verification status
Known issues discovered
Architectural decisions
Next recommended task
```

---

# Phase 1 — Production readiness

Make the current ERP something that can realistically be installed and used.

### 1. Documentation synchronization
- Fix ROADMAP numbering.
- Update SUMMARI.
- Replace stale KNOWN_ISSUES.
- Establish the new roadmap.
- Create implementation progress document.

### 2. Administration & configuration
- Store/company information.
- Tax configuration.
- Receipt configuration.
- Notification settings.
- Appearance settings.
- Business defaults.

### 3. Backup and restore hardening
- Backup database.
- Restore database.
- Validation.
- Backup history.
- Error handling.
- Confirmation dialogs.

### 4. Printing foundation
- Printer configuration.
- Print preview.
- Receipt templates.
- A4 documents.
- Thermal receipts.

---

# Phase 2 — POS UX

First major UX development phase.

### 5. POS redesign
Create a faster workflow:

```text
Search
   ↓
Product
   ↓
Compatibility / stock
   ↓
Cart
   ↓
Customer
   ↓
Vehicle
   ↓
Payment
   ↓
Receipt
```

### 6. Product search
Support:

- SKU
- barcode
- product name
- brand
- OEM
- aliases
- fuzzy search

### 7. Hold/resume sales

```text
Sale #1 → Hold
Sale #2 → Complete
Sale #1 → Resume
```

### 8. Faster checkout
Reduce dialogs and unnecessary navigation.

---

# Phase 3 — Desktop productivity

Add:

- `Ctrl+K` command palette
- keyboard shortcuts
- quick actions
- recent products
- recent customers
- favorites
- global search
- navigation shortcuts

This is where Inventory Gear starts feeling like a **real desktop business application**.

---

# Phase 4 — Automotive differentiation

Strategically the most important phase.

```text
Vehicle
  ↓
Make
  ↓
Model
  ↓
Year
  ↓
Engine
  ↓
Compatible parts
```

And product cross-references:

```text
OEM
 ├── Bosch
 ├── Mann
 ├── Sakura
 └── Toyota OEM
```

The user should find a part based on the vehicle, not the SKU.

---

# Phase 5 — Warehouse

Barcode-first workflows:

```text
Receive
   ↓
Scan
   ↓
Identify product
   ↓
Confirm quantity
   ↓
Assign location
   ↓
Update stock
```

Then: stock transfers, cycle counts, picking, stock adjustments, barcode labels, warehouse dashboard.

---

# Phase 6 — Product / customer intelligence

**Product 360:**

```text
Product
├── General
├── Inventory
├── Prices
├── Suppliers
├── Purchases
├── Sales
├── Compatibility
├── OEM numbers
└── Activity
```

**Customer 360:**

```text
Customer
├── Information
├── Vehicles
├── Sales
├── Credit
├── Payments
├── Warranties
└── Activity
```

---

# Phase 7 — Operational dashboard

Show things requiring action, not just KPIs:

```text
TODAY

🔴 4 products out of stock
🟠 17 products below minimum
🟠 5 purchase orders pending
🟡 3 overdue customers
🟡 2 warranties expiring

[Review inventory]
[Receive purchases]
[View overdue accounts]
```

---

# Phase 8 — Multi-branch foundation

Only after the above is stable:

- branches
- warehouses per branch
- branch permissions
- stock transfers
- branch reports
- centralized customers
- centralized products

---

# Phase 9 — Automation / AI

Finally:

- purchase recommendations
- demand forecasting
- natural-language reports
- anomaly detection
- automatic follow-ups
- intelligent product matching

---

# OpenCode Execution Strategy

Do **not** give OpenCode one giant prompt containing the entire roadmap.

```text
Master initialization
       ↓
Task 01
       ↓
update progress
       ↓
Task 02
       ↓
update progress
       ↓
Task 03
       ↓
update progress
       ↓
...
```

This prevents large uncontrolled changes. Each prompt is executed **one at a time**.

---

# Global Instructions (apply to every task)

## 1. Inspect before modifying
- Inspect existing architecture, components, schema, repositories/services/hooks, tests, UI patterns, dialogs, tables, forms, notifications, navigation.
- Search for reusable existing functionality.
- Do not create duplicate infrastructure when an existing implementation can be extended.

## 2. Preserve existing functionality
- Prefer extending existing components, extracting reusable components, adding services/hooks where appropriate.
- Preserve naming conventions, database patterns, and Tauri command conventions.
- Avoid large architectural changes unless demonstrably necessary.

## 3. Follow the current architecture
- Respect the separation between React UI, hooks/stores, services/repositories, Tauri commands, Rust backend, SQLite/Drizzle, validation, and tests.
- Do not bypass the existing data-access architecture.

## 4. UX requirements
Desktop ERP. Prioritize: speed, keyboard navigation, minimal clicks, clear feedback, predictable behavior, large actionable controls, fast search, useful empty/loading/error states, confirmation only when necessary, accessibility, light/dark consistency. Do not make the UI visually complicated.

## 5. Testing requirements
For every task:
- Add/update unit tests where business logic changes.
- Add integration tests for important workflows.
- Add UI tests where behavior is user-facing and testable.
- Run the most relevant tests after implementation.
- Run `npm run verify` before declaring a major task complete whenever practical.
- Do not disable tests or lower coverage thresholds to make a task pass.

## 6. Progress tracking
Maintain `docs/development/IMPLEMENTATION_PROGRESS.md` — the persistent record of implementation. After EVERY task update it with:
- **Current status:** phase, task, status, date, branch/commit.
- **Completed work:** task ID, description, implementation summary.
- **Files changed:** important files/directories.
- **Tests:** executed, result, verification result, coverage when relevant.
- **Known issues:** record problems discovered; do not hide them.
- **Architectural decisions:** important decisions and why.
- **Next recommended task.**

Keep it concise but useful. Do not overwrite historical progress — append/update.

---

# Task List

## PHASE 0 — BASELINE

### TASK 00 — Project analysis and implementation baseline
Complete analysis of the current project (README, ROADMAP, SUMMARI, KNOWN_ISSUES, package.json, schema, Tauri commands, React architecture, routing, navigation, POS, inventory, purchasing, customers, vehicles, reporting, administration, tests, screenshot framework).

Identify:
1. Existing functionality that already solves part of the roadmap.
2. Duplicated functionality.
3. Stale documentation.
4. Important visual QA issues.
5. Architectural risks.
6. Technical debt to address before new features.
7. Existing reusable components for future tasks.

Do NOT implement major features. Create/update `IMPLEMENTATION_PROGRESS.md`, run appropriate verification, report findings, state the next task.

## PHASE 1 — PRODUCTION READINESS

### TASK 01 — Synchronize project documentation
Bring docs into agreement with implementation (ROADMAP, SUMMARI, KNOWN_ISSUES, CHANGELOG, README, milestones). Resolve incorrect/duplicate numbering, obsolete descriptions, stale claims. Create one coherent roadmap separating completed/current/planned/long-term. Update IMPLEMENTATION_PROGRESS.md.

### TASK 02 — Administration and business configuration
Company/store information, tax configuration, receipt/business defaults, notification preferences, appearance settings, business configuration — using existing settings infrastructure. Do not create a second settings system. Persisted, validated, loaded on startup where appropriate, covered by tests.

### TASK 03 — Backup and restore hardening
Review existing backup implementation so a user can safely create/see status/restore/validate backups, handle corrupt files, understand errors, get confirmation before destructive restoration. Timestamps, metadata, validation, safe temp files, rollback/error handling. No cloud sync. Add tests for failure cases.

### TASK 04 — Printing foundation
Architecture for thermal receipts, A4 invoices, quotations, purchase orders, customer statements, inventory reports, barcode/product labels. Inspect existing printing first. Reusable print/template abstractions. Print preview, printer selection, error handling, configurable templates, testable rendering logic.

## PHASE 2 — POS UX

### TASK 05 — Analyze and redesign the POS workflow
Analyze current POS (steps per sale, unnecessary dialogs/navigation, slow operations, missing shortcuts/information, confusing states, reusable components), then a first UX improvement pass targeting: search → identify → stock → cart → customer → vehicle → payment → receipt. Preserve business logic. No financial calculation changes without tests. Add regression tests.

### TASK 06 — Fast global product search
Reusable search (POS, inventory, purchasing, others) supporting name, SKU, barcode, OEM, brand, aliases, relevant identifiers. Show product/brand/SKU/stock/price/compatibility. Desktop keyboard optimized. No AI. SQLite indexing/FTS if justified. Tests: exact, partial, multiple identifiers, no results, large sets, special characters.

### TASK 07 — POS hold and resume sales
Hold a sale, name/identify it, continue another, view held, resume, cancel safely. Preserve inventory/payment correctness. Tests for full workflow.

### TASK 08 — Faster POS checkout
Reduce navigation/dialogs. Clear access to customer, vehicle, discount, payment, receipt. Keep validation. Keyboard support. Test cash, other payment methods, discounts, customer sales, returns/regressions, receipt generation.

## PHASE 3 — DESKTOP PRODUCTIVITY

### TASK 09 — Global command palette
`Ctrl+K` palette for: new sale, search product/customer/vehicle, open inventory, create/receive purchase order, open reports/settings. Use existing router/navigation/action infrastructure. No duplicated application logic. Tests for registration and navigation.

### TASK 10 — Keyboard shortcuts
Centralized shortcut system: Ctrl+K palette, Ctrl+F search, Ctrl+N new, Ctrl+S save, Ctrl+P print, Escape close, F2 product, F4 customer, F6 vehicle, F10 payment. Inspect existing shortcuts first; avoid conflicts; document via shortcut/help dialog. Tests.

### TASK 11 — Quick Actions dashboard
Employee-oriented operational dashboard: new sale, receive purchase, search product/customer, inventory, PO, returns; "needs attention" section. Do not duplicate the executive analytics dashboard.

## PHASE 4 — PRODUCT INTELLIGENCE

### TASK 12 — Product 360° page
Comprehensive product detail (general, SKU, barcode, OEM, brand, prices, stock by warehouse, locations, suppliers, purchasing/sales history, compatibility, activity). Quick actions: sell, purchase, adjust stock, transfer, edit, print label. Reuse existing repositories/services. Tests.

## PHASE 5 — AUTOMOTIVE PART FINDER

### TASK 13 — Automotive vehicle-to-part search
Vehicle → Make → Model → Year → Engine → Compatible parts. Inspect existing vehicle/compatibility schema; do not duplicate. Minimum viable Part Finder with product/brand/SKU/OEM/stock/price. Tests for compatibility queries.

### TASK 14 — OEM and cross-reference support
OEM numbers, manufacturer numbers, alternative numbers, cross-references. Search one identifier → find products. Review existing schema before introducing many-to-many. Add indexes. Tests.

## PHASE 6 — BARCODE AND WAREHOUSE

### TASK 15 — Barcode-first product workflow
USB/Bluetooth scanners acting as keyboard input. Scanning into POS, receiving, inventory; barcode lookup. No camera required. Handle unknown/duplicate barcode, invalid input, rapid scans. Tests.

### TASK 16 — Barcode labels
Label printing via printing foundation: product name, SKU, barcode, price where appropriate, optional location. One product, multiple products, received products.

### TASK 17 — Warehouse receiving workflow
PO → scan/select → confirm quantity → assign location → receive → update stock. Expected vs received. Partial receiving. Prevent incorrect stock updates. Integration tests.

### TASK 18 — Stock transfer and cycle count
Transfers (request → pick → dispatch → receive) and cycle counts (scan/count → compare → approve adjustment → audit). Reuse existing inventory infrastructure; every movement auditable. Integration tests.

## PHASE 7 — CUSTOMER AND VEHICLE WORKFLOW

### TASK 19 — Customer + vehicle unified workflow
Connect customer, vehicle, sales, compatibility. Quick access to customer's vehicles; per-vehicle previous purchases, relevant parts, warranties, history; create sale from context. No duplicate data. Integration tests.

### TASK 20 — Customer 360° page
Contact info, vehicles, sales, payments, credit, outstanding balance, warranties, communication/activity. Quick actions: new sale, view vehicle, payment, statement, contact.

## PHASE 8 — OPERATIONAL INTELLIGENCE

### TASK 21 — Attention Center
Reusable operational alerts: out/low stock, pending POs, overdue accounts, warranties expiring, pending receiving, backup/system warnings. Each alert has a direct action. Avoid excessive notifications; prioritize severity.

### TASK 22 — Operational dashboard
Employee dashboard separate from executive BI: today's sales, pending work, low stock, pending receiving, overdue accounts, quick actions, recent activity.

## PHASE 9 — MULTI-BRANCH FOUNDATION

### TASK 23 — Analyze multi-branch architecture
Do NOT implement yet. Analyze impact on database, products, warehouses, inventory, users, roles, sales, purchasing, reporting, settings, backups. Produce architectural proposal and migration risks. No schema changes unless approved.

## PHASE 10 — AUTOMATION

### TASK 24 — Purchase recommendation engine
Deterministic (no LLM): stock, minimum stock, sales velocity, historical demand, supplier lead time, open POs → explainable recommendations (e.g., Bosch Brake Pad: stock 4, weekly sales 8, lead time 5 days → buy 20). Tests.

### TASK 25 — AI assistant architecture analysis
Only after workflows are stable. Analyze where AI adds value (NL reports, purchase recommendations, product matching, anomaly detection, follow-ups, forecasting). Do NOT integrate an external AI provider. Proposal covering privacy, local vs cloud, cost, permissions, auditability, data boundaries, failure handling.

---

# Completion criteria

A task is complete only when:
1. The implementation works.
2. Existing functionality remains intact.
3. Relevant tests pass.
4. UX behavior is coherent.
5. Light/dark mode is considered.
6. Error/loading/empty states are handled.
7. Documentation is updated.
8. `docs/development/IMPLEMENTATION_PROGRESS.md` is updated.
9. Known limitations are recorded.
10. The next task is clearly identified.

At the end of every OpenCode session provide a concise summary: what was implemented, files changed, tests executed, verification result, known issues, next recommended task. Do not silently continue into the next task.

## Execution order

Start only with **TASK 00**. Then: **00 → 01 → 02 → 03 → 04 → 05 → …**

The particularly important sequence:

**POS → Search → Command Palette → Keyboard → Product 360 → Part Finder → Barcode → Warehouse**

These features reinforce each other. Once implemented, Inventory Gear will feel substantially different while the underlying ERP infrastructure remains unchanged.
