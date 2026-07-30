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

  const inputCount = await page.locator('input[placeholder*="Buscar"]').count()
  console.log(`Inputs with placeholder Buscar: ${inputCount}`)
  const allInputs = await page.locator('input').count()
  console.log(`Total inputs: ${allInputs}`)
  const labels = await page.locator('label').allTextContents()
  console.log(`Labels: ${JSON.stringify(labels)}`)

  await page.screenshot({ path: "/tmp/debug-pos.png", fullPage: true })
})

test("debug-product-form", async ({ page }) => {
  await setupInvokeMock(page, { theme: "light" })
  await loginAsAdmin(page, "http://localhost:5173")

  await page.goto(ROUTES.productNew)
  await page.waitForLoadState("networkidle")
  await page.waitForTimeout(2000)

  const labels = await page.locator('label').allTextContents()
  console.log(`Labels: ${JSON.stringify(labels)}`)
  const inputs = await page.locator('input').count()
  console.log(`Input count: ${inputs}`)

  await page.screenshot({ path: "/tmp/debug-product.png", fullPage: true })
})
