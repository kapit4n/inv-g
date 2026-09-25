#!/usr/bin/env node
/**
 * Single source of truth for the Inventory Gear version.
 *
 *   package.json  ── authoritative ──┐
 *   tauri.conf.json (version: "../package.json", so it *reads* the above)
 *   Cargo.toml    ── must match ─────┘
 *
 * `tauri.conf.json` points its `version` at `../package.json`, so Tauri picks up
 * the version automatically and the installer is named from it. Cargo cannot do
 * the same, so it is the one file that can silently drift — `npm run version:check`
 * (part of `npm run verify`) fails the build if it does.
 *
 *   node scripts/version.mjs check   # exit 1 on drift
 *   node scripts/version.mjs sync    # write Cargo.toml from package.json
 *   node scripts/version.mjs set 1.2.3
 */

import { readFileSync, writeFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const read = (p) => readFileSync(join(ROOT, p), "utf8")

const pkg = JSON.parse(read("package.json"))
const cargo = read("src-tauri/Cargo.toml")
const conf = JSON.parse(read("src-tauri/tauri.conf.json"))

const cargoVersion = cargo.match(/^version\s*=\s*"([^"]+)"/m)?.[1]
const problems = []

if (conf.version !== "../package.json") {
  problems.push(
    `tauri.conf.json: version is "${conf.version}" but must be "../package.json" ` +
      `so package.json stays the single source of truth`
  )
}
if (cargoVersion !== pkg.version) {
  problems.push(`src-tauri/Cargo.toml: version "${cargoVersion}" != package.json "${pkg.version}"`)
}

const cmd = process.argv[2] ?? "check"

if (cmd === "check") {
  if (problems.length) {
    console.error("Version mismatch:\n" + problems.map((p) => "  - " + p).join("\n"))
    console.error("\nFix with: npm run version:sync")
    process.exit(1)
  }
  console.log(`version in sync: ${pkg.version} (package.json → tauri.conf.json → Cargo.toml)`)
  process.exit(0)
}

if (cmd === "sync") {
  const next = cargo.replace(/^version\s*=\s*"[^"]+"/m, `version = "${pkg.version}"`)
  writeFileSync(join(ROOT, "src-tauri/Cargo.toml"), next)
  console.log(`Cargo.toml version → ${pkg.version}`)
  process.exit(0)
}

if (cmd === "set") {
  const v = process.argv[3]
  if (!/^\d+\.\d+\.\d+$/.test(v ?? "")) {
    console.error("Usage: node scripts/version.mjs set <MAJOR.MINOR.PATCH>")
    process.exit(1)
  }
  const p = JSON.parse(read("package.json"))
  p.version = v
  writeFileSync(join(ROOT, "package.json"), JSON.stringify(p, null, 2) + "\n")
  const next = read("src-tauri/Cargo.toml").replace(
    /^version\s*=\s*"[^"]+"/m,
    `version = "${v}"`
  )
  writeFileSync(join(ROOT, "src-tauri/Cargo.toml"), next)
  console.log(`version set to ${v} in package.json and Cargo.toml (tauri.conf.json reads package.json)`)
  process.exit(0)
}

console.error("Usage: node scripts/version.mjs <check|sync|set MAJOR.MINOR.PATCH>")
process.exit(1)
