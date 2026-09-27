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
import { existsSync, mkdirSync, readdirSync, statSync } from "node:fs"
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

/** Set once at startup; only files touched at or after this count as generated. */
const RUN_STARTED_AT = Date.now()

function ensureDirs() {
  for (const dir of [LIGHT_DIR, DARK_DIR, THUMBNAILS_DIR, MANUALS_DIR, MARKETING_DIR, GITHUB_DIR]) {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  }
}

/**
 * Counts only the PNGs this run actually wrote.
 *
 * The output directories are committed to the repository, so a plain
 * `ls *.png | wc -l` counts the 66 checked-in files no matter how badly the run
 * went. That is how a run in which every theme failed still printed
 * "Light theme: 66 screenshots / Dark theme: 66 screenshots" and looked like a
 * success.
 */
function countGenerated(dir: string): number {
  if (!existsSync(dir)) return 0
  return readdirSync(dir).filter((f) => {
    if (!f.endsWith(".png")) return false
    return statSync(resolve(dir, f)).mtimeMs >= RUN_STARTED_AT
  }).length
}

function runSuite(name: string, env?: Record<string, string>): boolean {
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
    return true
  } catch (err: any) {
    console.error(`\n❌ ${name} screenshot generation failed: ${err.message}\n`)
    process.exitCode = 1
    return false
  }
}

/**
 * Copies a screenshot, warning if the source is missing.
 *
 * The previous version ran `cp ... 2>/dev/null; true`, which forces exit 0 no
 * matter what: `execSync` could never throw, so the surrounding try/catch was
 * dead code and a missing source left a silently absent copy. A derivative image
 * is not worth failing the whole run over, but it is worth saying so.
 */
function copyScreenshot(src: string, dest: string): void {
  if (!existsSync(src)) {
    console.warn(`   ⚠️  missing source, copy skipped: ${src}`)
    return
  }
  try {
    execSync(`cp ${JSON.stringify(src)} ${JSON.stringify(dest)}`)
  } catch (err: any) {
    console.warn(`   ⚠️  copy failed: ${src} -> ${dest}: ${err.message}`)
  }
}

function generateMarketingCopy() {
  console.log("  Generating marketing copies...")
  // Simple copy — rely on the light theme screenshots as base
  const pairs: [string, string][] = [
    [`${LIGHT_DIR}/02-dashboard.png`, `${MARKETING_DIR}/dashboard-light.png`],
    [`${DARK_DIR}/02-dashboard.png`, `${MARKETING_DIR}/dashboard-dark.png`],
    [`${LIGHT_DIR}/14-pos.png`, `${MARKETING_DIR}/pos-light.png`],
    [`${LIGHT_DIR}/04-product-list.png`, `${MARKETING_DIR}/products-light.png`],
    [`${LIGHT_DIR}/34-customers.png`, `${MARKETING_DIR}/customers-light.png`],
    [`${LIGHT_DIR}/41-reports-executive.png`, `${MARKETING_DIR}/reports-light.png`],
    [`${LIGHT_DIR}/53-admin-dashboard.png`, `${MARKETING_DIR}/admin-light.png`],
  ]
  for (const [src, dest] of pairs) copyScreenshot(src, dest)
}

function generateGithubCopies() {
  console.log("  Generating GitHub-optimized copies...")
  // Copy key screenshots for README
  const githubScreenshots: [string, string][] = [
    ["02-dashboard", "dashboard"],
    ["04-product-list", "products"],
    ["14-pos", "pos"],
    ["24-purchase-orders", "purchasing"],
    ["34-customers", "customers"],
    ["41-reports-executive", "reports"],
    ["53-admin-dashboard", "admin"],
  ]
  for (const [src, dst] of githubScreenshots) {
    copyScreenshot(`${LIGHT_DIR}/${src}.png`, `${GITHUB_DIR}/${dst}.png`)
    copyScreenshot(`${DARK_DIR}/${src}.png`, `${GITHUB_DIR}/${dst}-dark.png`)
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

  const results = projectNames.map((project) => ({
    project,
    ok: runSuite(project, { THEME: project }),
  }))
  const failed = results.filter((r) => !r.ok)

  // Generate derivative assets
  generateMarketingCopy()
  generateGithubCopies()

  const lightCount = countGenerated(LIGHT_DIR)
  const darkCount = countGenerated(DARK_DIR)

  // Only claim success if every theme actually produced files. `results` alone
  // is not enough: a suite can exit 0 having written nothing (a project name
  // that matches no test, for instance), and the checked-in PNGs would otherwise
  // make an empty run look complete.
  const PROJECT_DIRS: Record<string, string> = { light: LIGHT_DIR, dark: DARK_DIR }
  const empty = projectNames.filter((p) => countGenerated(PROJECT_DIRS[p] ?? "") === 0)

  if (failed.length > 0 || empty.length > 0) {
    process.exitCode = 1
    console.error(`\n❌ Screenshot generation FAILED\n`)
    for (const r of results) {
      if (!r.ok) console.error(`   ${r.project}: suite exited non-zero`)
    }
    for (const p of empty) {
      console.error(`   ${p}: suite wrote no screenshots`)
    }
    console.error(
      `\n   New files written: light ${lightCount}, dark ${darkCount}.` +
        `\n   The PNGs already under docs/screenshots are from a previous run` +
        `\n   and were not regenerated.\n`,
    )
    return
  }

  console.log(`\n📸 All screenshots generated in ${SCREENSHOTS_DIR}`)
  console.log(`   Light theme: ${lightCount} new screenshots`)
  console.log(`   Dark theme: ${darkCount} new screenshots`)
}

main().catch((err) => {
  console.error("Fatal error:", err)
  process.exit(1)
})
