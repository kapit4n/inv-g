#!/usr/bin/env node

/**
 * Generate PDF from VitePress-built documentation using Playwright.
 * Requires: npm install -D playwright (or playwright-core with system browser)
 */

import { execSync } from "child_process"
import { existsSync, mkdirSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, "..")
const SITE_DIR = resolve(ROOT, "docs-site")
const DIST_DIR = resolve(SITE_DIR, ".vitepress", "dist")
const PDF_DIR = resolve(ROOT, "dist", "docs")
const PDF_PATH = resolve(PDF_DIR, "inventory-gear-user-manual.pdf")

console.log("📄 Generating PDF manual...")

// Step 1: Ensure docs are built
if (!existsSync(DIST_DIR)) {
  console.log("  → Building documentation first...")
  execSync("node scripts/build-docs.mjs", { cwd: ROOT, stdio: "inherit" })
}

mkdirSync(PDF_DIR, { recursive: true })

// Step 2: Generate PDF using Playwright
try {
  const script = `
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Load the built index page
  const filePath = ${JSON.stringify(resolve(DIST_DIR, "index.html"))};
  await page.goto('file://' + filePath, { waitUntil: 'networkidle' });

  // Wait for content to render
  await page.waitForTimeout(2000);

  // Generate PDF
  await page.pdf({
    path: ${JSON.stringify(PDF_PATH)},
    format: 'A4',
    margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<div style="font-size: 8px; width: 100%; text-align: center; color: #666;">Inventory Gear — User Manual</div>',
    footerTemplate: '<div style="font-size: 8px; width: 100%; text-align: center; color: #666;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>',
  });

  await browser.close();
  console.log('PDF generated: ${PDF_PATH}');
})();
`

  // Write temp script
  const tempScript = resolve(ROOT, ".tmp-pdf-gen.cjs")
  const { writeFileSync, unlinkSync } = await import("fs")
  writeFileSync(tempScript, script)

  try {
    execSync(`node ${tempScript}`, { cwd: ROOT, stdio: "inherit" })
  } finally {
    if (existsSync(tempScript)) unlinkSync(tempScript)
  }

  console.log(`✅ PDF generated: ${PDF_PATH}`)
} catch (error) {
  console.error("⚠️  PDF generation requires Playwright.")
  console.error("   Install with: npm install -D playwright")
  console.error("   Then run: npx playwright install chromium")
  console.error("")
  console.error("   Alternatively, you can generate PDF manually:")
  console.error("   1. Run: npm run docs:build")
  console.error("   2. Open dist/docs/index.html in a browser")
  console.error("   3. Use browser Print → Save as PDF")
  console.error("")
  console.error("   Error:", error.message)
  process.exit(1)
}
