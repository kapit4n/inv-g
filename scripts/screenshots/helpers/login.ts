import type { Page } from "@playwright/test"

export async function loginAsAdmin(page: Page, baseURL: string) {
  await page.goto("/login")
  await page.waitForLoadState("networkidle")

  await page.fill('input[name="username"], input[type="text"]', "admin")
  await page.fill('input[name="password"], input[type="password"]', "admin123")

  await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")')

  await page.waitForURL("**/dashboard")
  await page.waitForSelector("h1:has-text('Panel de Control'), h1:has-text('Dashboard')")
}
