import { test } from "@playwright/test"
import { setupInvokeMock } from "../helpers/invoke-mock"
import { loginAsAdmin } from "../helpers/login"
import { ROUTES } from "../helpers/navigation"

test("debug-pos", async ({ page }) => {
  await setupInvokeMock(page, { theme: "light" })
  await loginAsAdmin(page, "http://localhost:5173")

  await page.goto(ROUTES.pos)
  await page.waitForLoadState("networkidle")
  await page.waitForTimeout(2000)

  const html = await page.evaluate(() => document.body?.innerHTML?.substring(0, 5000) || "NO BODY")
  console.log("=== POS BODY HTML (first 5000 chars) ===")
  console.log(html)
  console.log("\n=== POS URL ===")
  console.log(page.url())
})

test("debug-product-form", async ({ page }) => {
  await setupInvokeMock(page, { theme: "light" })
  await loginAsAdmin(page, "http://localhost:5173")

  await page.goto(ROUTES.productNew)
  await page.waitForLoadState("networkidle")
  await page.waitForTimeout(2000)

  const html = await page.evaluate(() => document.body?.innerHTML?.substring(0, 5000) || "NO BODY")
  console.log("=== PRODUCT FORM BODY HTML (first 5000 chars) ===")
  console.log(html)
  console.log("\n=== PRODUCT FORM URL ===")
  console.log(page.url())
})
