import { test } from "@playwright/test"
import { setupInvokeMock } from "../helpers/invoke-mock"
import { loginAsAdmin } from "../helpers/login"
import { takeScreenshot, waitForDataLoad, waitForCharts, clearNotifications } from "../helpers/screenshot"
import { ROUTES, navigateAndWait } from "../helpers/navigation"
import { setLightTheme, setDarkTheme, THEMES } from "../helpers/theme"

for (const theme of THEMES) {
  test.describe(`Reports screenshots - ${theme}`, () => {
    test.beforeEach(async ({ page }) => {
      await setupInvokeMock(page, { theme })
      await loginAsAdmin(page, "http://localhost:5173")
    })

    test(`41-reports-executive`, async ({ page }) => {
      if (theme === "dark") await setDarkTheme(page)
      else await setLightTheme(page)
      await navigateAndWait(page, ROUTES.reports)
      await waitForDataLoad(page)
      await waitForCharts(page)
      await clearNotifications(page)
      await takeScreenshot(page, "41-reports-executive", theme)
    })

    test(`42-reports-sales`, async ({ page }) => {
      if (theme === "dark") await setDarkTheme(page)
      else await setLightTheme(page)
      await navigateAndWait(page, ROUTES.reportsSales)
      await waitForDataLoad(page)
      await waitForCharts(page)
      await clearNotifications(page)
      await takeScreenshot(page, "42-reports-sales", theme)
    })

    test(`43-reports-inventory`, async ({ page }) => {
      if (theme === "dark") await setDarkTheme(page)
      else await setLightTheme(page)
      await navigateAndWait(page, ROUTES.reportsInventory)
      await waitForDataLoad(page)
      await waitForCharts(page)
      await clearNotifications(page)
      await takeScreenshot(page, "43-reports-inventory", theme)
    })

    test(`44-reports-purchasing`, async ({ page }) => {
      if (theme === "dark") await setDarkTheme(page)
      else await setLightTheme(page)
      await navigateAndWait(page, ROUTES.reportsPurchasing)
      await waitForDataLoad(page)
      await waitForCharts(page)
      await clearNotifications(page)
      await takeScreenshot(page, "44-reports-purchasing", theme)
    })

    test(`45-reports-customers`, async ({ page }) => {
      if (theme === "dark") await setDarkTheme(page)
      else await setLightTheme(page)
      await navigateAndWait(page, ROUTES.reportsCustomers)
      await waitForDataLoad(page)
      await waitForCharts(page)
      await clearNotifications(page)
      await takeScreenshot(page, "45-reports-customers", theme)
    })

    test(`46-reports-suppliers`, async ({ page }) => {
      if (theme === "dark") await setDarkTheme(page)
      else await setLightTheme(page)
      await navigateAndWait(page, ROUTES.reportsSuppliers)
      await waitForDataLoad(page)
      await waitForCharts(page)
      await clearNotifications(page)
      await takeScreenshot(page, "46-reports-suppliers", theme)
    })

    test(`47-reports-warehouses`, async ({ page }) => {
      if (theme === "dark") await setDarkTheme(page)
      else await setLightTheme(page)
      await navigateAndWait(page, ROUTES.reportsWarehouses)
      await waitForDataLoad(page)
      await waitForCharts(page)
      await clearNotifications(page)
      await takeScreenshot(page, "47-reports-warehouses", theme)
    })

    test(`48-reports-profitability`, async ({ page }) => {
      if (theme === "dark") await setDarkTheme(page)
      else await setLightTheme(page)
      await navigateAndWait(page, ROUTES.reportsProfitability)
      await waitForDataLoad(page)
      await waitForCharts(page)
      await clearNotifications(page)
      await takeScreenshot(page, "48-reports-profitability", theme)
    })

    test(`49-reports-kpis`, async ({ page }) => {
      if (theme === "dark") await setDarkTheme(page)
      else await setLightTheme(page)
      await navigateAndWait(page, ROUTES.reportsKpis)
      await waitForDataLoad(page)
      await waitForCharts(page)
      await clearNotifications(page)
      await takeScreenshot(page, "49-reports-kpis", theme)
    })

    test(`50-reports-custom`, async ({ page }) => {
      if (theme === "dark") await setDarkTheme(page)
      else await setLightTheme(page)
      await navigateAndWait(page, ROUTES.reportsCustom)
      await waitForDataLoad(page)
      await clearNotifications(page)
      await takeScreenshot(page, "50-reports-custom", theme)
    })

    test(`51-reports-scheduled`, async ({ page }) => {
      if (theme === "dark") await setDarkTheme(page)
      else await setLightTheme(page)
      await navigateAndWait(page, ROUTES.reportsScheduled)
      await waitForDataLoad(page)
      await clearNotifications(page)
      await takeScreenshot(page, "51-reports-scheduled", theme)
    })

    test(`52-reports-exports`, async ({ page }) => {
      if (theme === "dark") await setDarkTheme(page)
      else await setLightTheme(page)
      await navigateAndWait(page, ROUTES.reportsExports)
      await waitForDataLoad(page)
      await clearNotifications(page)
      await takeScreenshot(page, "52-reports-exports", theme)
    })
  })
}
