import { test } from "@playwright/test"
import { setupInvokeMock } from "../helpers/invoke-mock"
import { loginAsAdmin } from "../helpers/login"
import { takeScreenshot, waitForDataLoad, clearNotifications } from "../helpers/screenshot"
import { ROUTES, navigateAndWait } from "../helpers/navigation"
import { setLightTheme, setDarkTheme, THEMES } from "../helpers/theme"

for (const theme of THEMES) {
  test.describe(`CRM screenshots - ${theme}`, () => {
    test.beforeEach(async ({ page }) => {
      await setupInvokeMock(page, { theme })
      await loginAsAdmin(page, "http://localhost:5173")
    })

    test(`33-crm-dashboard`, async ({ page }) => {
      if (theme === "dark") await setDarkTheme(page)
      await navigateAndWait(page, ROUTES.crmDashboard)
      await waitForDataLoad(page)
      await clearNotifications(page)
      await takeScreenshot(page, "33-crm-dashboard", theme)
    })

    test(`34-customers`, async ({ page }) => {
      if (theme === "dark") await setDarkTheme(page)
      await navigateAndWait(page, ROUTES.crmCustomers)
      await waitForDataLoad(page)
      await clearNotifications(page)
      await takeScreenshot(page, "34-customers", theme)
    })

    test(`35-customer-detail`, async ({ page }) => {
      if (theme === "dark") await setDarkTheme(page)
      await navigateAndWait(page, ROUTES.crmCustomerDetail)
      await waitForDataLoad(page)
      await clearNotifications(page)
      await takeScreenshot(page, "35-customer-detail", theme)
    })

    test(`36-customer-vehicles`, async ({ page }) => {
      if (theme === "dark") await setDarkTheme(page)
      await navigateAndWait(page, ROUTES.crmVehicles)
      await waitForDataLoad(page)
      await clearNotifications(page)
      await takeScreenshot(page, "36-customer-vehicles", theme)
    })

    test(`37-vehicle-brands`, async ({ page }) => {
      if (theme === "dark") await setDarkTheme(page)
      await navigateAndWait(page, "/crm/vehicle-brands")
      await waitForDataLoad(page)
      await clearNotifications(page)
      await takeScreenshot(page, "37-vehicle-brands", theme)
    })

    test(`38-compatibility`, async ({ page }) => {
      if (theme === "dark") await setDarkTheme(page)
      await navigateAndWait(page, ROUTES.crmCompatibility)
      await waitForDataLoad(page)
      await clearNotifications(page)
      await takeScreenshot(page, "38-compatibility", theme)
    })

    test(`39-reminders`, async ({ page }) => {
      if (theme === "dark") await setDarkTheme(page)
      await navigateAndWait(page, ROUTES.crmReminders)
      await waitForDataLoad(page)
      await clearNotifications(page)
      await takeScreenshot(page, "39-reminders", theme)
    })

    test(`40-warranties`, async ({ page }) => {
      if (theme === "dark") await setDarkTheme(page)
      await navigateAndWait(page, ROUTES.crmWarranties)
      await waitForDataLoad(page)
      await clearNotifications(page)
      await takeScreenshot(page, "40-warranties", theme)
    })
  })
}
