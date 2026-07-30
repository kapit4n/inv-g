#!/usr/bin/env npx tsx
/**
 * Master screenshot generator — runs all Playwright test suites
 * 
 * Usage:
 *   THEME=all    npx playwright test --config playwright.config.ts   # all themes
 *   THEME=light   npx playwright test --config playwright.config.ts  # light only
 *   THEME=dark    npx playwright test --config playwright.config.ts  # dark only
 * 
 * Or launch via npm:
 *   npm run generate:all
 */

import { execSync } from "node:child_process"
import { existsSync, mkdirSync, writeFileSync } from "node:fs"
import { resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, "../..")

const SCREENSHOTS_DIR = resolve(ROOT, "docs/screenshots")
const LIGHT_DIR = resolve(SCREENSHOTS_DIR, "light")
const DARK_DIR = resolve(SCREENSHOTS_DIR, "dark")
const THUMBNAILS_DIR = resolve(SCREENSHOTS_DIR, "thumbnails")
const MANUALS_DIR = resolve(SCREENSHOTS_DIR, "manuals")
const MARKETING_DIR = resolve(SCREENSHOTS_DIR, "marketing")
const GITHUB_DIR = resolve(SCREENSHOTS_DIR, "github")

function ensureDirs() {
  for (const dir of [LIGHT_DIR, DARK_DIR, THUMBNAILS_DIR, MANUALS_DIR, MARKETING_DIR, GITHUB_DIR]) {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  }
}

function runSuite(name: string, env?: Record<string, string>) {
  console.log(`\n═══════════════════════════════════════`)
  console.log(`  Generating screenshots: ${name}`)
  console.log(`═══════════════════════════════════════\n`)

  const envVars = { ...process.env, ...env }
  const cmd = `npx playwright test --config playwright.config.ts --project=${name}`
  
  try {
    execSync(cmd, {
      cwd: __dirname,
      stdio: "inherit",
      env: envVars,
      timeout: 600_000, // 10 minutes
    })
    console.log(`\n✅ ${name} screenshots generated successfully.\n`)
  } catch (err: any) {
    console.error(`\n❌ ${name} screenshot generation failed: ${err.message}\n`)
    process.exitCode = 1
  }
}

function generateMarketingCopy() {
  console.log("  Generating marketing copies...")
  // Simple copy with `cp` — rely on the light theme screenshots as base
  try {
    execSync(`cp ${LIGHT_DIR}/02-dashboard.png ${MARKETING_DIR}/dashboard-light.png 2>/dev/null; true`, { stdio: "ignore" })
    execSync(`cp ${DARK_DIR}/02-dashboard.png ${MARKETING_DIR}/dashboard-dark.png 2>/dev/null; true`, { stdio: "ignore" })
    execSync(`cp ${LIGHT_DIR}/14-pos.png ${MARKETING_DIR}/pos-light.png 2>/dev/null; true`, { stdio: "ignore" })
    execSync(`cp ${LIGHT_DIR}/04-product-list.png ${MARKETING_DIR}/products-light.png 2>/dev/null; true`, { stdio: "ignore" })
    execSync(`cp ${LIGHT_DIR}/34-customers.png ${MARKETING_DIR}/customers-light.png 2>/dev/null; true`, { stdio: "ignore" })
    execSync(`cp ${LIGHT_DIR}/41-reports-executive.png ${MARKETING_DIR}/reports-light.png 2>/dev/null; true`, { stdio: "ignore" })
    execSync(`cp ${LIGHT_DIR}/53-admin-dashboard.png ${MARKETING_DIR}/admin-light.png 2>/dev/null; true`, { stdio: "ignore" })
  } catch {
    // Already handled
  }
}

function generateGithubCopies() {
  console.log("  Generating GitHub-optimized copies...")
  try {
    // Copy key screenshots for README
    const githubScreenshots = [
      ["02-dashboard", "dashboard"],
      ["04-product-list", "products"],
      ["14-pos", "pos"],
      ["24-purchase-orders", "purchasing"],
      ["34-customers", "customers"],
      ["41-reports-executive", "reports"],
      ["53-admin-dashboard", "admin"],
    ]
    for (const [src, dst] of githubScreenshots) {
      execSync(`cp ${LIGHT_DIR}/${src}.png ${GITHUB_DIR}/${dst}.png 2>/dev/null; true`, { stdio: "ignore" })
      execSync(`cp ${DARK_DIR}/${src}.png ${GITHUB_DIR}/${dst}-dark.png 2>/dev/null; true`, { stdio: "ignore" })
    }
  } catch {
    // Already handled
  }
}

async function main() {
  const theme = process.env.THEME || "all"
  const suites = process.env.SUITES || "all"

  ensureDirs()

  console.log(`\n📸 Inventory Gear — Screenshot Generator`)
  console.log(`   Theme: ${theme}`)
  console.log(`   Suites: ${suites}`)
  console.log(`   Output: ${SCREENSHOTS_DIR}\n`)

  const projectNames = theme === "all" ? ["light", "dark"] : [theme]

  for (const project of projectNames) {
    runSuite(project, { THEME: project })
  }

  // Generate derivative assets
  generateMarketingCopy()
  generateGithubCopies()

  console.log(`\n📸 All screenshots generated in ${SCREENSHOTS_DIR}`)

  // Print summary
  if (existsSync(LIGHT_DIR)) {
    const lightCount = execSync(`ls ${LIGHT_DIR}/*.png 2>/dev/null | wc -l`, { encoding: "utf8" }).trim()
    console.log(`   Light theme: ${lightCount} screenshots`)
  }
  if (existsSync(DARK_DIR)) {
    const darkCount = execSync(`ls ${DARK_DIR}/*.png 2>/dev/null | wc -l`, { encoding: "utf8" }).trim()
    console.log(`   Dark theme: ${darkCount} screenshots`)
  }
}

main().catch((err) => {
  console.error("Fatal error:", err)
  process.exit(1)
})
