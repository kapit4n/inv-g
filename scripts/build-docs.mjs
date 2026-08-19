#!/usr/bin/env node

/**
 * Build VitePress documentation and copy output to public/manual/
 * for integration into the Tauri desktop app.
 */

import { execSync } from "child_process"
import { existsSync, rmSync, cpSync, mkdirSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, "..")
const SITE_DIR = resolve(ROOT, "docs-site")
const DIST_DIR = resolve(SITE_DIR, ".vitepress", "dist")
const PUBLIC_MANUAL = resolve(ROOT, "public", "manual")
const FINAL_DIST = resolve(ROOT, "dist", "docs")

console.log("📚 Building VitePress documentation...")

try {
  // Step 1: Build VitePress
  console.log("  → Running vitepress build...")
  execSync("npx vitepress build", {
    cwd: SITE_DIR,
    stdio: "inherit",
    env: { ...process.env, NODE_ENV: "production" },
  })

  // Step 2: Clean previous output
  if (existsSync(PUBLIC_MANUAL)) {
    console.log("  → Cleaning previous build...")
    rmSync(PUBLIC_MANUAL, { recursive: true, force: true })
  }

  // Step 3: Copy to public/manual/ (for dev server)
  console.log("  → Copying to public/manual/...")
  mkdirSync(PUBLIC_MANUAL, { recursive: true })
  cpSync(DIST_DIR, PUBLIC_MANUAL, { recursive: true })

  // Step 4: Also copy to dist/docs/ (for production builds)
  console.log("  → Copying to dist/docs/...")
  mkdirSync(FINAL_DIST, { recursive: true })
  cpSync(DIST_DIR, FINAL_DIST, { recursive: true })

  console.log("✅ Documentation built successfully!")
  console.log(`   Dev:    http://localhost:5173/manual/`)
  console.log(`   Output: ${PUBLIC_MANUAL}`)
} catch (error) {
  console.error("❌ Documentation build failed:", error.message)
  process.exit(1)
}
