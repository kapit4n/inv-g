#!/usr/bin/env node
/**
 * Database profile manager for development/testing.
 *
 * Usage:
 *   node scripts/database/profile.mjs <profile> [--reset]
 *
 * Profiles:
 *   single-store   → inventory-gear-single.db   (1 store)
 *   multi-store    → inventory-gear-multi.db    (3 stores)
 *   empty          → inventory-gear-empty.db    (no business data)
 *   default        → inventory_gear.db          (legacy)
 *
 * Behaviour:
 *   1. Writes profile.json in the app data dir so the next launch opens the
 *      matching DB file.
 *   2. Creates the DB file (empty SQLite) if it does not exist.
 *   3. If the schema already exists, runs the profile-aware business seed.
 *      Otherwise it prints guidance (run the app once to create the schema).
 *
 * --reset recreates a fresh empty DB file (never touches the default/production
 * database unless you explicitly pass `default`).
 */

import Database from "better-sqlite3"
import { spawnSync } from "child_process"
import { mkdirSync, writeFileSync, existsSync, unlinkSync, rmSync } from "fs"
import { homedir } from "os"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const PROFILES = {
  "default": "inventory_gear.db",
  "single-store": "inventory-gear-single.db",
  "multi-store": "inventory-gear-multi.db",
  "empty": "inventory-gear-empty.db",
}

function dataDir() {
  const platform = process.platform
  if (platform === "win32") {
    const base = process.env.LOCALAPPDATA || process.env.APPDATA || join(homedir(), "AppData", "Local")
    return join(base, "inventory-gear")
  }
  if (platform === "darwin") {
    return join(homedir(), "Library", "Application Support", "inventory-gear")
  }
  const base = process.env.XDG_DATA_HOME || join(homedir(), ".local", "share")
  return join(base, "inventory-gear")
}

function projectRoot() {
  return join(dirname(fileURLToPath(import.meta.url)), "..", "..")
}

function schemaExists(dbPath) {
  const opened = new Database(dbPath, { readonly: true, fileMustExist: true })
  try {
    const row = opened.prepare("SELECT COUNT(*) as cnt FROM sqlite_master WHERE type='table' AND name='warehouses'").get()
    return row.cnt > 0
  } catch {
    return false
  } finally {
    opened.close()
  }
}

function runBusinessSeed(profile, dbPath) {
  console.log(`\n🌱 Running business seed for profile '${profile}'...\n`)
  const result = spawnSync(
    "npx",
    ["tsx", "database/seed/run.ts", "--profile", profile, "--db", dbPath],
    { cwd: projectRoot(), stdio: "inherit", shell: process.platform === "win32" }
  )
  if (result.status !== 0) {
    console.error(`❌ Business seed failed (exited ${result.status}).`)
    process.exit(result.status ?? 1)
  }
}

function main() {
  const profile = process.argv[2]
  const reset = process.argv.includes("--reset")

  if (!profile || !PROFILES[profile]) {
    console.error(`Unknown profile '${profile}'. Expected one of: ${Object.keys(PROFILES).join(", ")}`)
    process.exit(1)
  }

  const dir = dataDir()
  const dbPath = join(dir, PROFILES[profile])
  mkdirSync(dir, { recursive: true })

  if (reset && existsSync(dbPath)) {
    // Remove WAL/SHM sidecars too so the file is truly fresh.
    for (const suffix of ["", "-wal", "-shm"]) {
      const candidate = dbPath + suffix
      if (existsSync(candidate)) rmSync(candidate)
    }
    console.log(`🗑  Reset profile DB: ${dbPath}`)
  }

  if (!existsSync(dbPath)) {
    // Create an empty SQLite file (schema is introduced by the app on launch).
    const db = new Database(dbPath)
    db.close()
    console.log(`📄 Created empty DB: ${dbPath}`)
  }

  writeFileSync(join(dir, "profile.json"), JSON.stringify({ profile }, null, 2), "utf8")
  console.log(`🧭 Active profile set to '${profile}' (${PROFILES[profile]}).`)
  console.log(`   Env override: IG_DATABASE_PROFILE=${profile}`)

  if (profile === "default") {
    console.log("   Legacy database selected; no further seeding performed.")
    return
  }

  if (!schemaExists(dbPath)) {
    console.log(`
   The app creates the schema on first launch.
   → Launch the app once (npm start) to initialize it.
   → Then run: npm run db:seed:<profile-name>
   (or: npx tsx database/seed/run.ts --profile ${profile} --db "${dbPath}")
`)
    return
  }

  runBusinessSeed(profile, dbPath)
  console.log(`\n✅ Profile '${profile}' ready. Restart the app to use it.`)
}

main()