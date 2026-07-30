import type { Page } from "@playwright/test"

export const THEMES = ["light", "dark"] as const

export async function setLightTheme(page: Page) {
  await page.evaluate(() => {
    localStorage.setItem("inventory-gear-theme", JSON.stringify({ state: { theme: "light" }, version: 0 }))
    document.documentElement.classList.remove("dark")
  })
  await page.waitForTimeout(200)
}

export async function setDarkTheme(page: Page) {
  await page.evaluate(() => {
    localStorage.setItem("inventory-gear-theme", JSON.stringify({ state: { theme: "dark" }, version: 0 }))
    document.documentElement.classList.add("dark")
  })
  await page.waitForTimeout(200)
}
