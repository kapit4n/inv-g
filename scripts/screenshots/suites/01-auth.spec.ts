import { test } from "@playwright/test"
import { setupInvokeMock } from "../helpers/invoke-mock"
import { loginAsAdmin } from "../helpers/login"
import { takeScreenshot, waitForDataLoad, waitForCharts, clearNotifications } from "../helpers/screenshot"
import { ROUTES, navigateAndWait } from "../helpers/navigation"
import { setLightTheme, setDarkTheme, THEMES } from "../helpers/theme"

for (const theme of THEMES) {
  test.describe(`Auth screenshots - ${theme}`, () => {
    test.beforeEach(async ({ page }) => {
      await setupInvokeMock(page, { theme })
      await page.goto("/login")
    })

    test(`01-login`, async ({ page }) => {
      if (theme === "dark") await setDarkTheme(page)
      else await setLightTheme(page)
      await page.waitForSelector('input[type="text"], input[name="username"], input[placeholder*="usuario" i], input[placeholder*="email" i]', { timeout: 10000 })
      const usernameInput = page.locator('input[type="text"], input[name="username"], input[placeholder*="usuario" i]').first()
      await usernameInput.fill("admin")
      const passwordInput = page.locator('input[type="password"], input[name="password"]').first()
      await passwordInput.fill("admin123")
      await page.waitForTimeout(500)
      await takeScreenshot(page, "01-login", theme)
    })

    test(`02-dashboard`, async ({ page }) => {
      if (theme === "dark") await setDarkTheme(page)
      else await setLightTheme(page)
      await loginAsAdmin(page, "http://localhost:5173")
      await waitForDataLoad(page)
      await clearNotifications(page)
      await waitForCharts(page)
      await takeScreenshot(page, "02-dashboard", theme)
    })
  })
}
