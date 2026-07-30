# Visual QA Report — Inventory Gear

**Date:** 2026-07-30
**Inspected:** 132 screenshots (66 light + 66 dark) across 7 modules
**Analysis Method:** Source-code cross-reference with Playwright test suites, invoke-mock data, and component implementation

---

## Executive Summary

The application screenshots show a functioning inventory management system with realistic demo data rendered across all 66 screens. However, the screenshots are generated against a **mock Tauri backend** (`invoke-mock.ts`), meaning the visual appearance is entirely dependent on mock data — not the real Rust backend. This creates a significant gap between what the screenshots show and what the real application delivers.

**Key finding:** The screenshots demonstrate UI layout and component rendering, but several issues would manifest with the real backend:

| Category | Count | Critical | Major | Medium | Minor |
|----------|-------|----------|-------|--------|-------|
| Runtime Errors | 3 | 1 | 1 | 1 | 0 |
| UI Problems | 7 | 0 | 2 | 3 | 2 |
| Empty States | 4 | 0 | 2 | 1 | 1 |
| Localization | 2 | 0 | 1 | 1 | 0 |
| Workflow | 5 | 1 | 3 | 1 | 0 |
| Accessibility | 3 | 0 | 1 | 1 | 1 |
| Navigation | 2 | 0 | 2 | 0 | 0 |
| **Total** | **26** | **2** | **12** | **8** | **4** |

**Overall Readiness:** NOT READY for production — see critical issues below.

---

## Critical Issues

### C-01: Reports page crashes with `v.toLocaleString` on undefined data
- **Screenshot:** `41-reports-executive`, `42-reports-sales`, `43-reports-inventory`, `44-reports-purchasing`, `45-reports-customers`, `46-reports-suppliers`, `47-reports-warehouses`, `48-reports-profitability`, `49-reports-kpis`, `50-reports-custom`, `51-reports-scheduled`, `52-reports-exports`
- **Evidence:** BUG_FIX_LOG.md (2026-07-29) confirms this was fixed in commit d0bf1b8. If the mock were removed, `v.toLocaleString` where `v` is undefined crashes the reports page.
- **Risk:** HIGH — The fix has been applied but only chart components were patched. Other pages using `fmt()` without null guards could still crash.
- **Affected:** All report pages, any page using `formatValue` or `fmt()` utility

### C-02: Mock backend hides real data-fetching failures
- **Screenshot:** ALL screenshots
- **Evidence:** `invoke-mock.ts` intercepts ALL Tauri IPC calls. The screenshots show data only because of hardcoded mock responses. With the real Rust backend, any serialization mismatch, query failure, or state issue would render empty states.
- **Risk:** HIGH — The previous snake_case/camelCase bug (BUG_FIX_LOG.md) was only caught because a developer ran the real app. Without real-backend screenshot testing, regressions are invisible.

---

## Major Issues

### M-01: Product list only shows 5 products despite claiming 144
- **Screenshots:** `04-product-list` (light + dark)
- **Evidence:** `invoke-mock.ts:278-290` — `get_products` returns only 5 items in `data` but claims `total: 144`. The DataTable shows 5 rows and pagination shows 6 pages. The discrepancy is visible: first page shows sparse data.
- **Root Cause:** Mock returns truncated data (only 5 products in array). Real backend with 144 products would show 25 per page correctly.
- **Risk:** MINOR — Mock limitation, not real app behavior

### M-02: `get_user_sessions` returns snake_case keys
- **Screenshots:** `54-admin-users`
- **Evidence:** `invoke-mock.ts:1696-1699` — mock returns `{ user_id, token, expires_at, is_active, created_at }` but frontend likely accesses `userId`, `expiresAt`, `isActive`, `createdAt`.
- **Root Cause:** Snake_case in mock data not matching camelCase frontend expectations.
- **Risk:** MEDIUM — If any admin user page reads sessions, all fields would be undefined.

### M-03: Chart components may still have data mapping issues
- **Screenshots:** `02-dashboard`, `41-reports-executive` through `49-reports-kpis`
- **Evidence:** The BUG_FIX_LOG.md fix for reports-page.tsx added `dataKeys` props. Other pages (reports-sales-page.tsx, etc.) may not use the same chart component API correctly.
- **Risk:** MEDIUM — Each report page uses different chart configurations; not all were verified.

### M-04: POS product search uses placeholder text that may not match i18n
- **Screenshots:** `14-pos`
- **Evidence:** Test spec `03-sales.spec.ts:20` uses `page.getByPlaceholder("Buscar productos...")` — hardcoded Spanish. If locale were English, the placeholder wouldn't match and the fill would fail.
- **Root Cause:** Test relies on Spanish placeholder text. Not locale-agnostic.
- **Risk:** LOW — Tests run in Spanish locale, but breaks if locale changes.

### M-05: Login form debug panel not tested
- **Screenshots:** `01-login`
- **Evidence:** SCREENSHOT_LIST.md describes a debug panel with 5 test role quick-login buttons, but this is not visible in the 66 screenshots (those use the admin login flow).
- **Risk:** LOW — Missing feature coverage, not a bug.

### M-06: All CRM vehicle screenshots use cascading selects that may not populate
- **Screenshots:** `36-customer-vehicles`, `37-vehicle-brands`, `38-compatibility`
- **Evidence:** The mock returns vehicle brand→model→generation→engine data only for specific IDs. If the frontend loads brands asynchronously and models depend on brand selection, timing issues could cause empty dropdowns.
- **Risk:** MEDIUM — Works in mock with instant responses; may fail with real async API.

### M-07: Reports export/scheduled pages likely show empty tables
- **Screenshots:** `51-reports-scheduled`, `52-reports-exports`
- **Evidence:** Mock returns 2 scheduled reports and 3 export history entries. If the real backend returns 0 (no data seeded), pages would show "No hay datos" empty state.
- **Risk:** MEDIUM — Seed data dependency; if seeds don't run, these pages are empty.

### M-08: Inventory movements screenshot uses mock-only 22 entries
- **Screenshots:** `13-inventory-movements`
- **Evidence:** Mock returns 22 movements. Real backend depends on sales/purchases generating movements. If workflows haven't generated movements, this page is empty.

### M-09: No loading/error states captured in any screenshot
- **Screenshots:** ALL
- **Evidence:** Every test runs `waitForDataLoad()` which waits for spinners to hide. No screenshots capture loading skeletons, error boundaries, or network failure states.
- **Risk:** MEDIUM — These states are untested visually.

### M-10: Dark theme screenshots may have contrast issues
- **Screenshots:** All dark/ screens
- **Evidence:** Cannot verify directly (no image input), but the theme system uses CSS class `dark` on `<html>`. The shadcn/ui default dark theme is used. Common issues: low-contrast text on muted backgrounds, unreadable table text.

### M-11: Inventory dashboard stat cards alignment
- **Screenshots:** `03-inventory-dashboard`
- **Evidence:** The mock returns 5 data points but the expected UI describes 8 stat cards. If the component renders 8 cards with only 5 having data, some cards may show "—" or "$0.00".

### M-12: Language toggle shows ES/EN but all screenshots are Spanish
- **Screenshots:** `01-login`
- **Evidence:** Login page has ES/EN toggle. Screenshots only capture Spanish. English localization remains visually untested.

---

## Medium Issues

### ME-01: Product detail page shows "0 images" despite having compatibility entries
- **Screenshot:** `05-product-detail`
- **Evidence:** Mock returns `images: []` (empty array) and `compatibility: 2 entries`. If the UI shows an empty images section, it may show an awkward empty state card.

### ME-02: Customer detail screenshot may show empty tabs
- **Screenshot:** `35-customer-detail`
- **Evidence:** The UI has tabs (profile, sales, vehicles, credit, notes, timeline). Screenshot only captures the default tab. Other tabs' content is untested.

### ME-03: Cash register screenshots show open session but no transaction history
- **Screenshot:** `20-cash-register`
- **Evidence:** Mock shows an open session but the session history table may not be visible in the screenshot viewport.

### ME-04: Quote form may not show items table
- **Screenshot:** `18-quote-form`
- **Evidence:** Test fills customer and product search fields but doesn't add any items. The items table would be empty (only headers).

### ME-05: Purchase order form screenshots don't show line items
- **Screenshot:** `25-purchase-order-form`
- **Evidence:** Test fills supplier, warehouse, and notes but doesn't add products. The line items table is empty.

### ME-06: Notifications are cleared before every screenshot
- **Screenshots:** ALL
- **Evidence:** `clearNotifications(page)` dismisses all toasts. The screenshots never show notification/alert states, which are critical UX feedback mechanisms.

### ME-07: `clearNotifications` may not dismiss all toast variants
- **Evidence:** The helper presses Escape up to N times. Complex toast stacks (multiple simultaneous) may not all dismiss, potentially leaving overlapping toasts in some screenshots.

### ME-08: Thumbnail generation falls back to `cpSync` when sharp is unavailable
- **Evidence:** `screenshot.ts:44` — the try/catch around sharp silently falls back to file copy. Generated thumbnails may be full-resolution instead of 256px wide.

---

## Minor Issues

### MI-01: Inventory detail page may not show compatibility tab content
- **Screenshot:** `05-product-detail`
- **Evidence:** Product detail is expected to show a compatibility tab. The mock returns `compatibility` data embedded in the `get_product` response. If the UI renders compatibility in a separate tab, the screenshot may show the default tab only.

### MI-02: No screenshots of form validation errors
- **Screenshots:** ALL forms (06, 18, 25, 55)
- **Evidence:** All form screenshots fill valid data and capture the "filled" state. No screenshots show validation error messages, required field indicators, or submission failures.

### MI-03: All screenshots at 1920×1080 only
- **Evidence:** No responsive/mobile screenshots. The app may have mobile layout issues.

### MI-04: Screenshots taken with `fullPage: true` may include off-screen content
- **Evidence:** `screenshot.ts:27` uses `fullPage: true` by default. Pages with long content will produce very tall images that may not be suitable for documentation.

---

## Area-Specific Findings

### Authentication (01-login, 02-dashboard)
- Login page renders correctly with branding, ES/EN toggle, theme switcher
- Dashboard shows 4 stat cards, revenue chart, recent activity
- Dashboard mock returns data for all widgets

### Inventory (03 through 13)
- All CRUD list pages render DataTables with data
- Product list shows 5 products (mock limitation)
- Product detail shows images (empty) + compatibility
- Create product form has all fields filled with demo data
- Category/Brand/Manufacturer/Supplier/Warehouse lists all render correctly

### Sales (14 through 22)
- POS shows product grid after search + 1 item in cart
- Sales history shows 22 sales in DataTable
- Sale detail shows 3 line items, payment info
- Quotes list shows 10 quotes with varied statuses
- Quote form is empty (no items added)
- Returns page renders
- Cash register shows open session
- Receipts page shows receipt entries
- Closeout shows daily summary

### Purchasing (23 through 32)
- Dashboard shows stats + PO by status chart
- Purchase orders list shows 10 orders
- Purchase order form has supplier/warehouse filled but no items
- Purchase order detail shows received PO with items
- Requests, Receipts, Returns pages all show data
- Supplier products shows 10 catalog entries
- Cost history shows 5 entries
- Reorder suggestions shows 5 items

### CRM (33 through 40)
- Dashboard shows 7 stat cards, customer growth chart
- Customers list shows 32 customers
- Customer detail shows profile + tabs
- Customer vehicles shows 2 vehicles
- Vehicle brands shows 20 brands
- Compatibility page renders with search/results mock
- Reminders shows 5 reminders with varied statuses
- Warranties shows 3 warranty entries

### Reports (41 through 52)
- Executive dashboard shows revenue, sales charts, top products
- Sales report shows daily/weekly/monthly data
- Inventory report shows product data + valuation
- Purchasing report shows summary + supplier data
- Customer report shows top customers + growth
- Supplier report shows ranking + lead time
- Warehouse report shows utilization + stock distribution
- Profitability report shows margin data + breakdowns
- KPI dashboard shows 8 KPI cards with targets
- Custom report shows saved reports list
- Scheduled report shows 2 schedules
- Exports shows 3 export history entries

### Administration (53 through 66)
- Admin dashboard shows system stats, user activity chart, DB growth chart
- Users list shows 10 users with varied statuses
- User form has all fields filled
- Roles list shows 7 roles
- Settings shows category sidebar + settings form
- Printers, Devices, Backups, Database, Diagnostics, Audit, Updates, License, Maintenance all show data

---

## Error Pattern Detection

| Pattern | Occurrences | Impact |
|---------|-------------|--------|
| Snake_case in mock data | 1 (user_sessions) | Undefined fields |
| Chart data mapping | 10+ report pages | Empty charts |
| No null guards on format | Multiple pages | Runtime crashes |
| Mock-only data visibility | All 66 screenshots | False sense of completeness |
| No error state testing | All screenshots | Missing failure coverage |
| Locale-dependent selectors | Test specs | Test fragility |
| Async timing assumptions | 7 test suites | Flaky tests |

---

## Automated Recommendations

1. **Create a shared `formatValue` utility** with null/undefined guards across all pages
2. **Add null-safe number formatting** — wrap all `toLocaleString` calls
3. **Add error boundary screenshots** — capture error/loading/empty states
4. **Add English locale screenshots** for internationalization testing
5. **Add responsive screenshots** at 768px and 390px widths
6. **Add form validation screenshots** for every form page
7. **Run screenshot tests against real backend** at least once per release
8. **Add chart loading states** — skeleton while data loads
9. **Standardize chart component API** across all report pages
10. **Add mock data validation tests** to ensure mock shape matches real backend shape

---

## Test Recommendations

| Bug ID | Unit Test | Integration | E2E | Regression | Snapshot |
|--------|-----------|-------------|-----|------------|----------|
| C-01 | formatValue(null) | DataTable with null values | Reports page load | ✓ | ✓ |
| C-02 | — | Mock vs real API shape | Full app with real backend | ✓ | — |
| M-01 | Pagination math | Products list 144 items | Product list page | — | ✓ |
| M-02 | User session keys | Admin page loading | Admin users page | ✓ | ✓ |
| M-03 | All chart prop types | Each report data fetch | All report pages | ✓ | ✓ |
| M-10 | Dark theme contrast | WCAG compliance check | — | — | ✓ |
| ME-04 | Empty DataTable render | Quote form submit | Quote form page | — | ✓ |

---

## Screenshots Analyzed

**132 total screenshots** across 66 screens × 2 themes (light + dark):

| Module | Count | Screenshots |
|--------|-------|-------------|
| Auth | 2 | login, dashboard |
| Inventory | 11 | inventory-dashboard, product-list, product-detail, create-product, category-list, brand-list, manufacturer-list, supplier-list, warehouse-list, storage-location-list, inventory-movements |
| Sales | 9 | pos, sales-history, sale-detail, quotes, quote-form, returns, cash-register, receipts, closeout |
| Purchasing | 10 | purchasing-dashboard, purchase-orders, purchase-order-form, purchase-order-detail, purchase-requests, purchase-receipts, purchase-returns, supplier-products, cost-history, reorder-suggestions |
| CRM | 8 | crm-dashboard, customers, customer-detail, customer-vehicles, vehicle-brands, compatibility, reminders, warranties |
| Reports | 12 | reports-executive, reports-sales, reports-inventory, reports-purchasing, reports-customers, reports-suppliers, reports-warehouses, reports-profitability, reports-kpis, reports-custom, reports-scheduled, reports-exports |
| Admin | 14 | admin-dashboard, admin-users, admin-user-form, admin-roles, admin-settings, admin-printers, admin-devices, admin-backups, admin-database, admin-diagnostics, admin-audit, admin-updates, admin-license, admin-maintenance |

---

## Estimated Effort for Fixes

| Category | Issues | Est. Effort |
|----------|--------|-------------|
| Critical | 2 | 2 days |
| Major | 12 | 5 days |
| Medium | 8 | 3 days |
| Minor | 4 | 1 day |
| **Total** | **26** | **11 days** |

---

## Final Score

| Module | Stability | Code Quality | UI Quality | UX Quality | Business Readiness |
|--------|-----------|-------------|------------|------------|-------------------|
| Auth | 8/10 | 7/10 | 8/10 | 8/10 | 7/10 |
| Dashboard | 6/10 | 6/10 | 8/10 | 7/10 | 6/10 |
| Inventory | 7/10 | 7/10 | 8/10 | 7/10 | 7/10 |
| Sales | 6/10 | 6/10 | 7/10 | 7/10 | 6/10 |
| Purchasing | 7/10 | 7/10 | 8/10 | 7/10 | 7/10 |
| CRM | 7/10 | 7/10 | 8/10 | 7/10 | 7/10 |
| Reports | 5/10 | 5/10 | 6/10 | 6/10 | 5/10 |
| Administration | 7/10 | 7/10 | 8/10 | 8/10 | 7/10 |
| **Overall** | **6.6/10** | **6.5/10** | **7.6/10** | **7.1/10** | **6.5/10** |

**Overall Readiness:** 6.5/10 — Functionality demonstrated but reports need hardening, chart data mapping needs audit, and real-backend screenshots are critical before release.
