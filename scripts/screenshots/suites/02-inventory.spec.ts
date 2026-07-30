import { test } from "@playwright/test"
import { setupInvokeMock } from "../helpers/invoke-mock"
import { loginAsAdmin } from "../helpers/login"
import { takeScreenshot, waitForDataLoad, clearNotifications, waitForCharts } from "../helpers/screenshot"
import { ROUTES, navigateAndWait } from "../helpers/navigation"
import { setLightTheme, setDarkTheme, THEMES } from "../helpers/theme"

for (const theme of THEMES) {
  test.describe(`Inventory screenshots - ${theme}`, () => {
    test.beforeEach(async ({ page }) => {
      await setupInvokeMock(page, { theme })
      await loginAsAdmin(page, "http://localhost:5173")
    })

    test(`inventory-dashboard`, async ({ page }) => {
      if (theme === "dark") await setDarkTheme(page)
      await navigateAndWait(page, ROUTES.inventoryDashboard)
      await waitForCharts(page)
      await clearNotifications(page)
      await takeScreenshot(page, "03-inventory-dashboard", theme)
    })

    test(`04-product-list`, async ({ page }) => {
      if (theme === "dark") await setDarkTheme(page)
      await navigateAndWait(page, ROUTES.products)
      await waitForDataLoad(page)
      await clearNotifications(page)
      await takeScreenshot(page, "04-product-list", theme)
    })

    test(`05-product-detail`, async ({ page }) => {
      if (theme === "dark") await setDarkTheme(page)
      await navigateAndWait(page, ROUTES.productDetail)
      await waitForDataLoad(page)
      await clearNotifications(page)
      await takeScreenshot(page, "05-product-detail", theme)
    })

    test(`06-create-product`, async ({ page }) => {
      if (theme === "dark") await setDarkTheme(page)
      await navigateAndWait(page, ROUTES.productNew)
      await waitForDataLoad(page)

      await page.locator('label:has-text("Nombre del Producto") + input').fill("Pastillas de Freno Cerámicas")
      await page.locator('label:has-text("SKU") + input').fill("FRN-PFC-099")
      await page.locator('label:has-text("Código de Barras") + input').fill("7501234567890")
      await page.locator('label:has-text("Descripción") + textarea').fill("Pastillas de freno cerámicas de alto rendimiento para SUV y camionetas.")

      await clearNotifications(page)
      await takeScreenshot(page, "06-create-product", theme)
    })

    test(`07-category-list`, async ({ page }) => {
      if (theme === "dark") await setDarkTheme(page)
      await navigateAndWait(page, ROUTES.categories)
      await waitForDataLoad(page)
      await clearNotifications(page)
      await takeScreenshot(page, "07-category-list", theme)
    })

    test(`08-brand-list`, async ({ page }) => {
      if (theme === "dark") await setDarkTheme(page)
      await navigateAndWait(page, ROUTES.brands)
      await waitForDataLoad(page)
      await clearNotifications(page)
      await takeScreenshot(page, "08-brand-list", theme)
    })

    test(`09-manufacturer-list`, async ({ page }) => {
      if (theme === "dark") await setDarkTheme(page)
      await navigateAndWait(page, ROUTES.manufacturers)
      await waitForDataLoad(page)
      await clearNotifications(page)
      await takeScreenshot(page, "09-manufacturer-list", theme)
    })

    test(`10-supplier-list`, async ({ page }) => {
      if (theme === "dark") await setDarkTheme(page)
      await navigateAndWait(page, ROUTES.inventorySuppliers)
      await waitForDataLoad(page)
      await clearNotifications(page)
      await takeScreenshot(page, "10-supplier-list", theme)
    })

    test(`11-warehouse-list`, async ({ page }) => {
      if (theme === "dark") await setDarkTheme(page)
      await navigateAndWait(page, ROUTES.warehouses)
      await waitForDataLoad(page)
      await clearNotifications(page)
      await takeScreenshot(page, "11-warehouse-list", theme)
    })

    test(`12-storage-location-list`, async ({ page }) => {
      if (theme === "dark") await setDarkTheme(page)
      await navigateAndWait(page, ROUTES.storageLocations)
      await waitForDataLoad(page)
      await clearNotifications(page)
      await takeScreenshot(page, "12-storage-location-list", theme)
    })

    test(`13-inventory-movements`, async ({ page }) => {
      if (theme === "dark") await setDarkTheme(page)
      await navigateAndWait(page, ROUTES.movements)
      await waitForDataLoad(page)
      await clearNotifications(page)
      await takeScreenshot(page, "13-inventory-movements", theme)
    })
  })
}
