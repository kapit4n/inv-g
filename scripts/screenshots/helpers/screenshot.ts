import path from "node:path"
import fs from "node:fs"
import type { Page } from "@playwright/test"

const SCREENSHOTS_ROOT = path.resolve("docs/screenshots")

export const screenshotDir = path.join(SCREENSHOTS_ROOT, "{theme}")

export async function takeScreenshot(
  page: Page,
  name: string,
  theme: string,
  options?: { fullPage?: boolean; mask?: string[] }
) {
  const dir = path.join(SCREENSHOTS_ROOT, theme)
  const thumbDir = path.join(SCREENSHOTS_ROOT, "thumbnails")

  fs.mkdirSync(dir, { recursive: true })
  fs.mkdirSync(thumbDir, { recursive: true })

  const filePath = path.join(dir, `${name}.png`)
  const thumbPath = path.join(thumbDir, `${name}.png`)

  try {
    await page.screenshot({
      path: filePath,
      fullPage: options?.fullPage ?? true,
    })

    await createThumbnail(filePath, thumbPath)

    console.log(`  ✓ ${theme}/${name}.png`)
  } catch (err) {
    console.error(`  ✗ ${theme}/${name}.png — ${err}`)
  }
}

async function createThumbnail(src: string, dest: string) {
  try {
    const sharp = (await import("sharp")).default
    await sharp(src)
      .resize({ width: 256 })
      .toFile(dest)
  } catch {
    fs.cpSync(src, dest)
  }
}

export async function waitForDataLoad(page: Page) {
  await page.waitForLoadState("networkidle")
  const spinners = page.locator(
    '[role="status"], .spinner, .loading, [data-testid="loader"], .animate-spin'
  )
  if ((await spinners.count()) > 0) {
    await spinners.first().waitFor({ state: "hidden", timeout: 30_000 })
  }
}

export async function waitForCharts(page: Page) {
  try {
    await page.waitForSelector("svg.recharts-surface, .recharts-wrapper", { timeout: 10_000 })
  } catch {
    // page may not have charts — that's fine
  }
}

export async function clearNotifications(page: Page) {
  const toasts = page.locator("[role='alert'], [role='status'], .toast, [data-testid='toast']")
  const count = await toasts.count()
  for (let i = 0; i < count; i++) {
    await page.keyboard.press("Escape")
    await page.waitForTimeout(200)
  }
}

export async function dismissDialogs(page: Page) {
  const dialog = page.locator("[role='dialog'], [data-testid='dialog']")
  if ((await dialog.count()) > 0) {
    await page.keyboard.press("Escape")
    await page.waitForTimeout(300)
  }
}
