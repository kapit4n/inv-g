import { test } from "@playwright/test"
import { setupInvokeMock } from "../helpers/invoke-mock"
import { loginAsAdmin } from "../helpers/login"
import { takeScreenshot, waitForDataLoad, clearNotifications } from "../helpers/screenshot"
import { ROUTES, navigateAndWait } from "../helpers/navigation"
import { setLightTheme, setDarkTheme, THEMES } from "../helpers/theme"

for (const theme of THEMES) {
  test.describe(`Purchasing screenshots - ${theme}`, () => {
    test.beforeEach(async ({ page }) => {
      await setupInvokeMock(page, { theme })
      await loginAsAdmin(page, "http://localhost:5173")
    })

    test(`23-purchasing-dashboard`, async ({ page }) => {
      if (theme === "dark") await setDarkTheme(page)
      await navigateAndWait(page, ROUTES.purchasingDashboard)
      await waitForDataLoad(page)
      await clearNotifications(page)
      await takeScreenshot(page, "23-purchasing-dashboard", theme)
    })

    test(`24-purchase-orders`, async ({ page }) => {
      if (theme === "dark") await setDarkTheme(page)
      await navigateAndWait(page, ROUTES.purchaseOrders)
      await waitForDataLoad(page)
      await clearNotifications(page)
      await takeScreenshot(page, "24-purchase-orders", theme)
    })

    test(`25-purchase-order-form`, async ({ page }) => {
      if (theme === "dark") await setDarkTheme(page)
      await navigateAndWait(page, ROUTES.purchaseOrderNew)
      await waitForDataLoad(page)
      await clearNotifications(page)
      const supplierField = page.locator('input[name="supplierId"], input[id*="supplier"], input[placeholder*="proveedor" i]').first()
      if (await supplierField.isVisible()) {
        await supplierField.fill("Autopartes del Centro S.A. de C.V.")
      }
      const warehouseField = page.locator('input[name="warehouseId"], input[id*="warehouse"], input[placeholder*="almacén" i]').first()
      if (await warehouseField.isVisible()) {
        await warehouseField.fill("Almacén Central")
      }
      const notesField = page.locator('textarea[name="notes"], textarea[id*="notes"], textarea[placeholder*="nota" i]').first()
      if (await notesField.isVisible()) {
        await notesField.fill("Pedido urgente de pastillas de freno")
      }
      await page.waitForTimeout(500)
      await takeScreenshot(page, "25-purchase-order-form", theme)
    })

    test(`26-purchase-order-detail`, async ({ page }) => {
      if (theme === "dark") await setDarkTheme(page)
      await navigateAndWait(page, ROUTES.purchaseOrderDetail)
      await waitForDataLoad(page)
      await clearNotifications(page)
      await takeScreenshot(page, "26-purchase-order-detail", theme)
    })

    test(`27-purchase-requests`, async ({ page }) => {
      if (theme === "dark") await setDarkTheme(page)
      await navigateAndWait(page, ROUTES.purchaseRequests)
      await waitForDataLoad(page)
      await clearNotifications(page)
      await takeScreenshot(page, "27-purchase-requests", theme)
    })

    test(`28-purchase-receipts`, async ({ page }) => {
      if (theme === "dark") await setDarkTheme(page)
      await navigateAndWait(page, ROUTES.purchaseReceipts)
      await waitForDataLoad(page)
      await clearNotifications(page)
      await takeScreenshot(page, "28-purchase-receipts", theme)
    })

    test(`29-purchase-returns`, async ({ page }) => {
      if (theme === "dark") await setDarkTheme(page)
      await navigateAndWait(page, ROUTES.purchaseReturns)
      await waitForDataLoad(page)
      await clearNotifications(page)
      await takeScreenshot(page, "29-purchase-returns", theme)
    })

    test(`30-supplier-products`, async ({ page }) => {
      if (theme === "dark") await setDarkTheme(page)
      await navigateAndWait(page, ROUTES.supplierProducts)
      await waitForDataLoad(page)
      await clearNotifications(page)
      await takeScreenshot(page, "30-supplier-products", theme)
    })

    test(`31-cost-history`, async ({ page }) => {
      if (theme === "dark") await setDarkTheme(page)
      await navigateAndWait(page, ROUTES.costHistory)
      await waitForDataLoad(page)
      await clearNotifications(page)
      await takeScreenshot(page, "31-cost-history", theme)
    })

    test(`32-reorder-suggestions`, async ({ page }) => {
      if (theme === "dark") await setDarkTheme(page)
      await navigateAndWait(page, ROUTES.reorderSuggestions)
      await waitForDataLoad(page)
      await clearNotifications(page)
      await takeScreenshot(page, "32-reorder-suggestions", theme)
    })
  })
}
