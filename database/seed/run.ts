#!/usr/bin/env tsx
/**
 * Seed Runner CLI
 *
 * Usage:
 *   npx tsx database/seed/run.ts                    # Auto-detect DB path
 *   npx tsx database/seed/run.ts --db /path/to/db   # Specify DB path
 *   npx tsx database/seed/run.ts --profile multi-store # Profile-aware seeding
 *   npx tsx database/seed/run.ts --help              # Show help
 */

import Database from "better-sqlite3"
import { homedir } from "os"
import { join } from "path"
import { existsSync } from "fs"
import { seedAll, resolveProfile } from "./index"

const PROFILE_DB_FILES: Record<string, string> = {
  "default": "inventory_gear.db",
  "single-store": "inventory-gear-single.db",
  "multi-store": "inventory-gear-multi.db",
  "empty": "inventory-gear-empty.db",
}

function appDataDir(): string {
  if (process.platform === "win32") {
    const base = process.env.LOCALAPPDATA || process.env.APPDATA || join(homedir(), "AppData", "Local")
    return join(base, "inventory-gear")
  }
  if (process.platform === "darwin") {
    return join(homedir(), "Library", "Application Support", "inventory-gear")
  }
  const base = process.env.XDG_DATA_HOME || join(homedir(), ".local", "share")
  return join(base, "inventory-gear")
}

function findDatabasePath(customPath?: string, profile?: string): string {
  if (customPath) {
    if (!existsSync(customPath)) {
      throw new Error(`Database file not found: ${customPath}`)
    }
    return customPath
  }

  // A named profile points at its own DB file in the app data dir.
  if (profile && PROFILE_DB_FILES[profile]) {
    const profilePath = join(appDataDir(), PROFILE_DB_FILES[profile])
    if (existsSync(profilePath)) {
      return profilePath
    }
  }

  // Default paths
  const candidates = [
    // Tauri dev data directory
    join(homedir(), ".local", "share", "inventory-gear", "inventory_gear.db"),
    // Profile databases (next to the legacy DB)
    join(homedir(), ".local", "share", "inventory-gear", "inventory-gear-single.db"),
    join(homedir(), ".local", "share", "inventory-gear", "inventory-gear-multi.db"),
    join(homedir(), ".local", "share", "inventory-gear", "inventory-gear-empty.db"),
    // Current working directory
    join(process.cwd(), "inventory_gear.db"),
    // data directory in project
    join(process.cwd(), "data", "inventory_gear.db"),
    // temp Tauri dev path
    join(homedir(), ".cache", "inventory-gear", "inventory_gear.db"),
  ]

  for (const path of candidates) {
    if (existsSync(path)) {
      return path
    }
  }

  // If none found, try to find any inventory_gear.db
  const { execSync } = require("child_process")
  try {
    const result = execSync("find / -name 'inventory*.db' -maxdepth 5 2>/dev/null", { timeout: 5000 })
    const paths = result.toString().trim().split("\n").filter(Boolean)
    if (paths.length > 0) {
      return paths[0]
    }
  } catch {}

  throw new Error(
    "Could not find a database file. Specify the path with --db <path>\n" +
    "Expected locations:\n" +
    candidates.map((p) => `  - ${p}`).join("\n")
  )
}

async function main() {
  const args = process.argv.slice(2)

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
Inventory Gear - Database Seed Runner

Usage:
  npx tsx database/seed/run.ts                    # Auto-detect DB
  npx tsx database/seed/run.ts --db <path>        # Specify DB path
  npx tsx database/seed/run.ts --profile <name>   # Profile-aware seeding
  npx tsx database/seed/run.ts --help             # Show this help

Options:
  --db <path>       Path to the SQLite database
  --profile <name>  Profile: default | single-store | multi-store | empty
  --verbose         Show detailed output
  --help            Show this help message
    `)
    process.exit(0)
  }

  const argValue = (flag: string) => {
    const idx = args.indexOf(flag)
    return idx >= 0 ? args[idx + 1] : undefined
  }

  const dbPath = argValue("--db")
  const profile = resolveProfile(argValue("--profile"))

  let resolved: string
  try {
    resolved = findDatabasePath(dbPath, profile)
  } catch (err) {
    console.error("❌", (err as Error).message)
    process.exit(1)
  }

  console.log(`📁 Database: ${resolved}`)
  console.log(`🧭 Profile:   ${profile}`)

  const db = new Database(resolved, { readonly: false })

  try {
    // Enable WAL mode and foreign keys
    db.pragma("journal_mode = WAL")
    db.pragma("foreign_keys = ON")

    await seedAll(db, profile)

    // Print summary statistics
    const stats = [
      "roles", "permissions", "users", "categories", "brands",
      "manufacturers", "suppliers", "warehouses", "storage_locations",
      "products", "product_vehicle_compatibility",
      "customers", "customer_vehicles",
      "vehicle_brands", "vehicle_models", "vehicle_generations",
      "vehicle_engines", "vehicle_transmissions", "vehicle_fuels",
      "sales", "sale_items", "sale_payments",
      "quotes", "quote_items", "inventory_movements",
      "cash_register_sessions", "daily_closings", "receipts",
      "audit_logs",
    ]

    console.log("📊 Database Statistics:")
    console.log("─".repeat(50))
    for (const table of stats) {
      try {
        const row = db.prepare(`SELECT COUNT(*) as cnt FROM ${table}`).get() as { cnt: number }
        console.log(`  ${table.padEnd(30)} ${row.cnt.toString().padStart(6)}`)
      } catch {}
    }
    console.log("─".repeat(50))
    console.log("✨ Seeding completed successfully!")

  } catch (err) {
    console.error("❌ Seed failed:", err)
    process.exit(1)
  } finally {
    db.close()
  }
}

main()
