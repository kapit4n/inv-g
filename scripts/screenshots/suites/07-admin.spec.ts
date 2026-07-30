import { test } from "@playwright/test"
import { setupInvokeMock } from "../helpers/invoke-mock"
import { loginAsAdmin } from "../helpers/login"
import { takeScreenshot, waitForDataLoad, waitForCharts, clearNotifications } from "../helpers/screenshot"
import { ROUTES, navigateAndWait } from "../helpers/navigation"
import { setLightTheme, setDarkTheme, THEMES } from "../helpers/theme"

for (const theme of THEMES) {
  test.describe(`Admin screenshots - ${theme}`, () => {
    test.beforeEach(async ({ page }) => {
      await setupInvokeMock(page, { theme })
      await loginAsAdmin(page, "http://localhost:5173")
    })

    test(`53-admin-dashboard`, async ({ page }) => {
      if (theme === "dark") await setDarkTheme(page)
      else await setLightTheme(page)
      await navigateAndWait(page, ROUTES.adminDashboard)
      await waitForDataLoad(page)
      await waitForCharts(page)
      await clearNotifications(page)
      await takeScreenshot(page, "53-admin-dashboard", theme)
    })

    test(`54-admin-users`, async ({ page }) => {
      if (theme === "dark") await setDarkTheme(page)
      else await setLightTheme(page)
      await navigateAndWait(page, ROUTES.adminUsers)
      await waitForDataLoad(page)
      await clearNotifications(page)
      await takeScreenshot(page, "54-admin-users", theme)
    })

    test(`55-admin-user-form`, async ({ page }) => {
      if (theme === "dark") await setDarkTheme(page)
      else await setLightTheme(page)
      await navigateAndWait(page, ROUTES.adminUserNew)
      await waitForDataLoad(page)
      await clearNotifications(page)
      const usernameInput = page.locator('input[name="username"], input[placeholder*="usuario" i], input[placeholder*="Usuario" i], input[placeholder*="username" i]').first()
      if (await usernameInput.isVisible()) {
        await usernameInput.fill("nuevo_usuario")
      }
      const emailInput = page.locator('input[name="email"], input[type="email"]').first()
      if (await emailInput.isVisible()) {
        await emailInput.fill("nuevo@inventorygear.com")
      }
      const nameInput = page.locator('input[name="fullName"], input[name="full_name"], input[placeholder*="nombre" i]').first()
      if (await nameInput.isVisible()) {
        await nameInput.fill("Nuevo Usuario")
      }
      const phoneInput = page.locator('input[name="phone"], input[placeholder*="tel" i]').first()
      if (await phoneInput.isVisible()) {
        await phoneInput.fill("+52 55 1234 5678")
      }
      const passwordInput = page.locator('input[name="password"], input[type="password"]').first()
      if (await passwordInput.isVisible()) {
        await passwordInput.fill("TempPass123!")
      }
      await page.waitForTimeout(300)
      await takeScreenshot(page, "55-admin-user-form", theme)
    })

    test(`56-admin-roles`, async ({ page }) => {
      if (theme === "dark") await setDarkTheme(page)
      else await setLightTheme(page)
      await navigateAndWait(page, ROUTES.adminRoles)
      await waitForDataLoad(page)
      await clearNotifications(page)
      await takeScreenshot(page, "56-admin-roles", theme)
    })

    test(`57-admin-settings`, async ({ page }) => {
      if (theme === "dark") await setDarkTheme(page)
      else await setLightTheme(page)
      await navigateAndWait(page, ROUTES.adminSettings)
      await waitForDataLoad(page)
      await clearNotifications(page)
      await takeScreenshot(page, "57-admin-settings", theme)
    })

    test(`58-admin-printers`, async ({ page }) => {
      if (theme === "dark") await setDarkTheme(page)
      else await setLightTheme(page)
      await navigateAndWait(page, ROUTES.adminPrinters)
      await waitForDataLoad(page)
      await clearNotifications(page)
      await takeScreenshot(page, "58-admin-printers", theme)
    })

    test(`59-admin-devices`, async ({ page }) => {
      if (theme === "dark") await setDarkTheme(page)
      else await setLightTheme(page)
      await navigateAndWait(page, ROUTES.adminDevices)
      await waitForDataLoad(page)
      await clearNotifications(page)
      await takeScreenshot(page, "59-admin-devices", theme)
    })

    test(`60-admin-backups`, async ({ page }) => {
      if (theme === "dark") await setDarkTheme(page)
      else await setLightTheme(page)
      await navigateAndWait(page, ROUTES.adminBackups)
      await waitForDataLoad(page)
      await clearNotifications(page)
      await takeScreenshot(page, "60-admin-backups", theme)
    })

    test(`61-admin-database`, async ({ page }) => {
      if (theme === "dark") await setDarkTheme(page)
      else await setLightTheme(page)
      await navigateAndWait(page, ROUTES.adminDatabase)
      await waitForDataLoad(page)
      await clearNotifications(page)
      await takeScreenshot(page, "61-admin-database", theme)
    })

    test(`62-admin-diagnostics`, async ({ page }) => {
      if (theme === "dark") await setDarkTheme(page)
      else await setLightTheme(page)
      await navigateAndWait(page, ROUTES.adminDiagnostics)
      await waitForDataLoad(page)
      await clearNotifications(page)
      await takeScreenshot(page, "62-admin-diagnostics", theme)
    })

    test(`63-admin-audit`, async ({ page }) => {
      if (theme === "dark") await setDarkTheme(page)
      else await setLightTheme(page)
      await navigateAndWait(page, ROUTES.adminAudit)
      await waitForDataLoad(page)
      await clearNotifications(page)
      await takeScreenshot(page, "63-admin-audit", theme)
    })

    test(`64-admin-updates`, async ({ page }) => {
      if (theme === "dark") await setDarkTheme(page)
      else await setLightTheme(page)
      await navigateAndWait(page, ROUTES.adminUpdates)
      await waitForDataLoad(page)
      await clearNotifications(page)
      await takeScreenshot(page, "64-admin-updates", theme)
    })

    test(`65-admin-license`, async ({ page }) => {
      if (theme === "dark") await setDarkTheme(page)
      else await setLightTheme(page)
      await navigateAndWait(page, ROUTES.adminLicensing)
      await waitForDataLoad(page)
      await clearNotifications(page)
      await takeScreenshot(page, "65-admin-license", theme)
    })

    test(`66-admin-maintenance`, async ({ page }) => {
      if (theme === "dark") await setDarkTheme(page)
      else await setLightTheme(page)
      await navigateAndWait(page, ROUTES.adminMaintenance)
      await waitForDataLoad(page)
      await clearNotifications(page)
      await takeScreenshot(page, "66-admin-maintenance", theme)
    })
  })
}
