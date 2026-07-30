# Screenshot Generation Scripts

> **Last updated:** 2026-07-29

This directory contains Playwright-based scripts for programmatically capturing screenshots of every Inventory Gear screen. The scripts automate login, navigation, and screenshot capture for documentation and QA purposes.

---

## Approach

The screenshot generation uses **Playwright** (Node.js) to:

1. **Mock** all Tauri IPC invoke calls with realistic demo data (no backend needed)
2. **Login** using the login form (credentials: admin / admin123)
3. **Navigate** to each route
4. **Wait** for the page to fully render (data loaded, charts drawn)
5. **Capture** a viewport screenshot at 1920×1080
6. **Save** to `docs/screenshots/{theme}/` with zero-padded numbering

Two theme variants are generated: `light` and `dark`. All UI text in Spanish.

---

## Directory Structure

```
scripts/screenshots/
├── README.md                   # This file
├── playwright.config.ts        # Playwright configuration
├── package.json                # Dependencies
├── tsconfig.json               # TypeScript config
├── generate_all.ts             # Master runner script
├── helpers/
│   ├── invoke-mock.ts          # Tauri IPC mock (2000+ lines, all 290+ commands)
│   ├── login.ts                # Login helper (admin/admin123)
│   ├── navigation.ts           # Route map + navigate and wait utility
│   ├── screenshot.ts           # Screenshot capture + thumbnail + wait helpers
│   └── theme.ts                # Light/dark theme switching
└── suites/
    ├── 01-auth.spec.ts         # Login + Dashboard
    ├── 02-inventory.spec.ts    # Products, categories, brands, warehouses, movements
    ├── 03-sales.spec.ts        # POS, sales, quotes, returns, register, receipts, closeout
    ├── 04-purchasing.spec.ts   # POs, requests, receipts, returns, cost history
    ├── 05-crm.spec.ts          # Customers, vehicles, compatibility, reminders, warranties
    ├── 06-reports.spec.ts      # 12 report types
    └── 07-admin.spec.ts        # Users, roles, settings, backups, audit, diagnostics, etc.
```

Screenshots are saved to:

```
docs/screenshots/
├── SCREENSHOTS.md              # Metadata catalog
├── light/                      # 66 light theme screenshots
├── dark/                       # 66 dark theme screenshots
├── thumbnails/                 # Scaled 0.25× copies
├── marketing/                  # Key screenshots for presentations
└── github/                     # README-optimized copies (~1400px)

---

## Setup

### Prerequisites

```bash
# From project root
npm install -D @playwright/test
npx playwright install chromium
```

### Environment

| Variable | Default | Description |
|---|---|---|
| `BASE_URL` | `http://localhost:5173` | Dev server URL |
| `SCREENSHOT_DIR` | `docs/screenshots/generated` | Output directory |
| `THEME` | `light` | Default theme (`light`, `dark`, or `both`) |
| `LANGUAGE` | `en` | UI language (`en`, `es`, or `both`) |
| `SEED_ONCE` | `true` | Seed data before first test only |

---

## Usage

### Full screenshot run

```bash
# Start the dev server
npm run dev

# In another terminal, run the screenshot script
npx playwright test scripts/screenshots/screenshots.spec.ts
```

### Selective run (by module)

```bash
# Only inventory screenshots
npx playwright test scripts/screenshots/screenshots.spec.ts --grep "Inventory"

# Only admin screenshots
npx playwright test scripts/screenshots/screenshots.spec.ts --grep "Admin"
```

### Theme variants

```bash
THEME=both npx playwright test scripts/screenshots/screenshots.spec.ts
```

---

## Script Architecture

### `playwright.config.ts`

```typescript
import { defineConfig } from "@playwright/test"

export default defineConfig({
  testDir: ".",
  timeout: 60000,
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:5173",
    viewport: { width: 1440, height: 900 },
    // ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: "screenshots",
      testMatch: "**/*.spec.ts",
    },
  ],
})
```

### `helpers/login.ts`

Exports a `loginAsRole(role: string)` function that:

- Navigates to `/login`
- Opens the debug panel (collapsible)
- Clicks the corresponding test role button
- Waits for redirect to `/dashboard`

```typescript
export async function loginAsRole(page: Page, role: string) {
  await page.goto("/login")
  // Expand debug panel if collapsed
  const debugTrigger = page.locator("text=Testing")
  if (await debugTrigger.isVisible()) {
    await debugTrigger.click()
  }
  await page.click(`[data-testid="login-role-${role}"]`)
  await page.waitForURL("/dashboard")
}
```

### `helpers/seed.ts`

```typescript
export async function seedDemoData(page: Page) {
  await page.goto("/dashboard")
  // Click user menu → "Seed Demo Data"
  await page.click("[data-testid='user-menu-trigger']")
  await page.click("text=Seed Demo Data")
  await page.waitForSelector("text=Seed completed!", { timeout: 30000 })
}
```

### `helpers/navigation.ts`

```typescript
export async function navigateAndWait(page: Page, route: string) {
  await page.goto(route)
  // Wait for network to settle and main content to render
  await page.waitForLoadState("networkidle")
  // Wait for data tables to load (if applicable)
  await page.waitForTimeout(1000)
}
```

### `helpers/screenshots.ts`

```typescript
import path from "path"

const SCREENSHOT_DIR = process.env.SCREENSHOT_DIR || "docs/screenshots/generated"

export function screenshotPath(name: string): string {
  return path.resolve(SCREENSHOT_DIR, name)
}

export async function capture(page: Page, name: string) {
  await page.screenshot({
    path: screenshotPath(name),
    fullPage: true,
  })
}
```

---

## Screenshot Naming Convention

```
{module}-{screen}-{variant}.png
```

| Part | Description | Examples |
|---|---|---|
| `{module}` | Feature module name | `inventory`, `sales`, `admin` |
| `{screen}` | Specific screen identifier | `products`, `pos`, `users` |
| `{variant}` | Optional variant | `dark`, `search`, `detail`, `form` |

Examples:

| File | Screen |
|---|---|
| `dashboard-main.png` | Main dashboard (light) |
| `dashboard-main-dark.png` | Main dashboard (dark) |
| `inventory-products.png` | Products list |
| `inventory-product-form.png` | Product create form |
| `sales-pos-cart.png` | POS with items in cart |
| `admin-backups.png` | Backup management |

---

## Screenshot Spec Template

```typescript
import { test } from "@playwright/test"
import { loginAsRole } from "./helpers/login"
import { seedDemoData } from "./helpers/seed"
import { navigateAndWait } from "./helpers/navigation"
import { capture } from "./helpers/screenshots"

test.describe("Dashboard", () => {
  test.beforeAll(async ({ page }) => {
    await loginAsRole(page, "owner")
  })

  test("dashboard-main", async ({ page }) => {
    await navigateAndWait(page, "/dashboard")
    await capture(page, "dashboard-main.png")
  })

  test("dashboard-main-dark", async ({ page }) => {
    // Switch to dark mode via theme toggle
    await page.click("[data-testid='theme-toggle']")
    // Ensure dark class is applied
    await page.waitForSelector("html.dark")
    await capture(page, "dashboard-main-dark.png")
    // Switch back
    await page.click("[data-testid='theme-toggle']")
  })
})
```

---

## Handling Dynamic Content

### DataTable loading

For pages using `DataTable` with pagination, wait for the table body to render:

```typescript
await page.waitForSelector("table tbody tr")
```

### Charts (recharts)

Charts render as SVG. Wait for SVG elements:

```typescript
await page.waitForSelector("svg.recharts-surface")
```

### Dialogs

For pages where dialogs need to be captured:

```typescript
// Open dialog
await page.click("text=Add Customer")
await page.waitForSelector("[role='dialog']")
await capture(page, "crm-customer-dialog.png")
// Close dialog
await page.click("[role='dialog'] button[aria-label='Close']")
```

### POS page

The POS page requires adding items to the cart before capturing:

```typescript
test("sales-pos-cart", async ({ page }) => {
  await navigateAndWait(page, "/sales/new")
  // Click first few product cards to add to cart
  const products = page.locator(".cursor-pointer.hover\\:bg-accent")
  const count = await products.count()
  for (let i = 0; i < Math.min(3, count); i++) {
    await products.nth(i).click()
    await page.waitForTimeout(200)
  }
  await capture(page, "sales-pos-cart.png")
})
```

---

## CI Integration

In CI, run the screenshot script after the dev server is ready:

```yaml
# .github/workflows/screenshots.yml
jobs:
  screenshots:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run dev & npx wait-on http://localhost:5173
      - run: npx playwright test scripts/screenshots/screenshots.spec.ts
      - uses: actions/upload-artifact@v4
        with:
          name: screenshots
          path: docs/screenshots/generated/
```

---

## Tips

- **Run after seeding**: Always seed fresh data before screenshot runs to ensure consistent content
- **Stable selectors**: Use `data-testid` attributes on key elements (theme toggle, user menu, dialog close) to make selectors robust
- **Viewport consistency**: Always use `1440×900` viewport for desktop screenshots
- **Mobile screenshots**: Can be added with a separate project config using `viewport: { width: 390, height: 844 }`
- **Theme toggling**: Cycle through light → dark → system using the theme toggle button in the top bar
- **Language toggling**: Switch language via the EN/ES toggle on the login page or settings page
- **Full-page vs viewport**: Use `fullPage: true` for tall pages (e.g., dashboard), `fullPage: false` for fixed-height pages (e.g., POS)
