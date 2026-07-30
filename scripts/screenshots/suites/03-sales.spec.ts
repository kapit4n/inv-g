import { test } from "@playwright/test"
import { setupInvokeMock } from "../helpers/invoke-mock"
import { loginAsAdmin } from "../helpers/login"
import { takeScreenshot, waitForDataLoad, clearNotifications, waitForCharts } from "../helpers/screenshot"
import { ROUTES, navigateAndWait } from "../helpers/navigation"
import { setLightTheme, setDarkTheme, THEMES } from "../helpers/theme"

for (const theme of THEMES) {
  test.describe(`Sales screenshots - ${theme}`, () => {
    test.beforeEach(async ({ page }) => {
      await setupInvokeMock(page, { theme })
      await loginAsAdmin(page, "http://localhost:5173")
    })

    test(`14-pos`, async ({ page }) => {
      if (theme === "dark") await setDarkTheme(page)
      else await setLightTheme(page)
      await navigateAndWait(page, ROUTES.pos)
      // Type a search to show products
      await page.getByPlaceholder("Buscar productos...").fill("freno")
      await page.waitForTimeout(500)
      // Click a product to add to cart
      const productCards = page.locator('[class*="card"]').filter({ has: page.locator('text=Pastillas') })
      if (await productCards.count() > 0) {
        await productCards.first().click()
        await page.waitForTimeout(300)
      }
      await clearNotifications(page)
      await takeScreenshot(page, "14-pos", theme)
    })

    test(`15-sales-history`, async ({ page }) => {
      if (theme === "dark") await setDarkTheme(page)
      else await setLightTheme(page)
      await navigateAndWait(page, ROUTES.sales)
      await clearNotifications(page)
      await takeScreenshot(page, "15-sales-history", theme)
    })

    test(`16-sale-detail`, async ({ page }) => {
      if (theme === "dark") await setDarkTheme(page)
      else await setLightTheme(page)
      await navigateAndWait(page, ROUTES.saleDetail)
      await clearNotifications(page)
      await takeScreenshot(page, "16-sale-detail", theme)
    })

    test(`17-quotes`, async ({ page }) => {
      if (theme === "dark") await setDarkTheme(page)
      else await setLightTheme(page)
      await navigateAndWait(page, ROUTES.quotes)
      await clearNotifications(page)
      await takeScreenshot(page, "17-quotes", theme)
    })

    test(`18-quote-form`, async ({ page }) => {
      if (theme === "dark") await setDarkTheme(page)
      else await setLightTheme(page)
      await navigateAndWait(page, ROUTES.quoteNew)
      // Fill customer search
      const customerInput = page.locator('input[placeholder*="cliente" i], input[placeholder*="customer" i]').first()
      if (await customerInput.count() > 0) {
        await customerInput.fill("Juan")
        await page.waitForTimeout(400)
      }
      // Add a product search
      const productInput = page.locator('input[placeholder*="producto" i], input[placeholder*="product" i], input[placeholder*="buscar" i]').first()
      if (await productInput.count() > 0) {
        await productInput.fill("Pastillas")
        await page.waitForTimeout(400)
      }
      await clearNotifications(page)
      await takeScreenshot(page, "18-quote-form", theme)
    })

    test(`19-returns`, async ({ page }) => {
      if (theme === "dark") await setDarkTheme(page)
      else await setLightTheme(page)
      await navigateAndWait(page, ROUTES.returns)
      await clearNotifications(page)
      await takeScreenshot(page, "19-returns", theme)
    })

    test(`20-cash-register`, async ({ page }) => {
      if (theme === "dark") await setDarkTheme(page)
      else await setLightTheme(page)
      await navigateAndWait(page, ROUTES.cashRegister)
      await clearNotifications(page)
      await takeScreenshot(page, "20-cash-register", theme)
    })

    test(`21-receipts`, async ({ page }) => {
      if (theme === "dark") await setDarkTheme(page)
      else await setLightTheme(page)
      await navigateAndWait(page, ROUTES.receipts)
      await clearNotifications(page)
      await takeScreenshot(page, "21-receipts", theme)
    })

    test(`22-closeout`, async ({ page }) => {
      if (theme === "dark") await setDarkTheme(page)
      else await setLightTheme(page)
      await navigateAndWait(page, ROUTES.closeout)
      await clearNotifications(page)
      await takeScreenshot(page, "22-closeout", theme)
    })
  })
}
