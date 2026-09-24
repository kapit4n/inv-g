#!/usr/bin/env node
/**
 * Builds a dedicated demo database (`inventory-gear-demo.db`) whose product
 * catalog is exactly the supplied 19-item steering/suspension list.
 *
 * Usage:
 *   node scripts/database/seed-demo-catalog.mjs             # create demo DB
 *   node scripts/database/seed-demo-catalog.mjs --activate  # also swap it in as the active profile DB
 *
 * The demo DB is cloned from an already-initialized profile DB so it carries
 * the app schema plus users/roles/permissions/settings (created by the app on
 * first launch of any profile). All business and reference rows are wiped and
 * replaced with the minimal demo dataset:
 *   - 2 categories (Dirección, Suspensión)
 *   - 2 brands (Toyota Genuine, TRW)
 *   - 1 supplier, 1 warehouse, 12 storage locations
 *   - exactly the 19 products from the catalog, with:
 *       sku          = Código_2  (falls back to Código when empty)
 *       oem_number   = Código
 *       internal_code= Código
 *       sale_price   = Precio/u
 *       cost_price   ≈ 70% of Precio/u
 *       stock        = Cant
 *     plus cross-reference `product_identifiers` rows for both codes.
 */

import Database from "better-sqlite3"
import { existsSync, writeFileSync, rmSync, copyFileSync, readFileSync } from "fs"
import { homedir } from "os"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const DEMO_FILE = "inventory-gear-demo.db"

const PROFILE_DB_FILES = {
  "default": "inventory_gear.db",
  "single-store": "inventory-gear-single.db",
  "multi-store": "inventory-gear-multi.db",
  "empty": "inventory-gear-empty.db",
}

// {n, code, alt, name, price, category, brand, qty}
const CATALOG = [
  { code: "860067", alt: null, name: "MUÑON DIREC. TOY COROLLA/IPSU 84/95", price: 35.0, category: "Dirección", brand: "Toyota Genuine", qty: 4 },
  { code: "860068", alt: "124846", name: "TERMINAL DE DIRECCION IPSU/CALDINA L", price: 77.0, category: "Dirección", brand: "Toyota Genuine", qty: 4 },
  { code: "860069", alt: "124847", name: "TERMINAL DE DIRECCION IPSU/CALDINA R", price: 77.0, category: "Dirección", brand: "Toyota Genuine", qty: 4 },
  { code: "860090", alt: null, name: "MUÑON DIR. TOY. HIACE 2002 14X15", price: 68.0, category: "Dirección", brand: "Toyota Genuine", qty: 4 },
  { code: "860030", alt: "RACK-H-Y", name: "BRAZO DE CREMALLERA HIDRAULICO TOY. 16X14 (16X14X1.5)", price: 45.0, category: "Dirección", brand: "TRW", qty: 4 },
  { code: "860029", alt: "RACK-L-Y", name: "BRAZO DE CREMALLERA MECANICA 14X14", price: 45.0, category: "Dirección", brand: "TRW", qty: 4 },
  { code: "860093", alt: null, name: "BRAZO/PRECAP DIR. TOY. COROLLA/CALDINA/HIACE 14X15", price: 58.0, category: "Dirección", brand: "Toyota Genuine", qty: 4 },
  { code: "860039", alt: "124192", name: "ROTULA/MUÑON SUSP. TOY. COROLLA 92/PSU", price: 53.0, category: "Suspensión", brand: "Toyota Genuine", qty: 4 },
  { code: "860153", alt: "43330-29075", name: "MUÑON/ROTULA INF. DE KING LONG 2016-2020", price: 110.0, category: "Suspensión", brand: "TRW", qty: 4 },
  { code: "860154", alt: "43350-29095", name: "MUÑON/ROTULA SUP KING LONG 2016-2020", price: 114.0, category: "Suspensión", brand: "TRW", qty: 4 },
  { code: "860144", alt: "HQ-T26204", name: "TERMINAL/MUÑON DIR. KING LONG 99/2004 14X15 MM", price: 57.0, category: "Dirección", brand: "TRW", qty: 4 },
  { code: "860056", alt: "YOI-241", name: "ROTULA/MUÑON INF. NOAH PATENTADO", price: 89.0, category: "Suspensión", brand: "Toyota Genuine", qty: 4 },
  { code: "860057", alt: "YOI-240", name: "ROTULA/MUÑON SUP. NOAH SIN GRASERA BLINDADO", price: 71.0, category: "Suspensión", brand: "Toyota Genuine", qty: 4 },
  { code: "860026", alt: "YOI-237", name: "BARRA ESTABILIZADORA NOAH TRAS. 99 MUÑON/PERNO", price: 60.0, category: "Suspensión", brand: "Toyota Genuine", qty: 4 },
  { code: "120714", alt: "YOI-192", name: "BARRA ESTAB. NOAH DEL 96", price: 46.0, category: "Suspensión", brand: "Toyota Genuine", qty: 4 },
  { code: "850027", alt: null, name: "JUNTA COROLLA DIESEL/IPSUCALDINA ABS 26X24 (26X56X24)", price: 172.0, category: "Dirección", brand: "Toyota Genuine", qty: 4 },
  { code: "850020", alt: "TO-1-1010A", name: "JUNTA GASOLINA ABS COROLLA 26X23 (26X56X23)", price: 162.0, category: "Dirección", brand: "Toyota Genuine", qty: 4 },
  { code: "850136", alt: "RF4950021", name: "CAPUCHON TRICETA TOY. NOAH/VOXY 2000 YARIS/CALDINA/RAV4", price: 40.0, category: "Dirección", brand: "Toyota Genuine", qty: 4 },
  { code: "850000", alt: "850070", name: "CAPUCHON JUNTA C/PRECINTO MET.", price: 28.0, category: "Dirección", brand: "Toyota Genuine", qty: 4 },
]

// Tables the app manages / that must survive so login and settings keep working.
const KEEP_TABLES = new Set([
  "users", "roles", "permissions", "role_permissions",
  "settings", "application_settings",
  "license_information", "device_settings", "printer_settings", "system_updates",
  "dashboard_preferences", "kpi_definitions", "report_templates",
  "saved_reports", "scheduled_reports", "report_history",
  "backup_history", "restore_history", "sqlite_sequence",
])

function appDataDir() {
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

function projectRoot() {
  return join(dirname(fileURLToPath(import.meta.url)), "..", "..")
}

function usableSource(dir) {
  const candidates = [
    "inventory-gear-single.db",
    "inventory-gear-multi.db",
    "inventory_gear.db",
    "inventory-gear-empty.db",
  ]
  for (const file of candidates) {
    const path = join(dir, file)
    if (!existsSync(path)) continue
    try {
      const db = new Database(path, { readonly: true })
      const schema = db.prepare("SELECT COUNT(*) c FROM sqlite_master WHERE type='table' AND name='warehouses'").get().c
      const users = db.prepare("SELECT COUNT(*) c FROM users").get().c
      db.close()
      if (schema > 0 && users > 0) return path
    } catch {
      // not a usable source; try the next candidate
    }
  }
  return null
}

function clone(source, dest) {
  for (const suffix of ["", "-wal", "-shm"]) {
    const candidate = dest + suffix
    if (existsSync(candidate)) rmSync(candidate)
  }
  const db = new Database(source)
  const quoted = dest.replace(/'/g, "''")
  db.exec(`VACUUM INTO '${quoted}'`)
  db.close()
}

function wipeBusinessTables(db) {
  db.pragma("foreign_keys = OFF")
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map((r) => r.name)
  const wipe = db.transaction(() => {
    for (const t of tables) {
      if (!KEEP_TABLES.has(t)) {
        db.exec(`DELETE FROM "${t}"`)
      }
    }
    db.exec("DELETE FROM sqlite_sequence")
  })
  wipe()
  db.pragma("foreign_keys = ON")
}

function seedReference(db) {
  const brandStmt = db.prepare(
    "INSERT OR IGNORE INTO brands (name, description, country, website, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, 1, datetime('now'), datetime('now'))"
  )
  const categoryStmt = db.prepare(
    "INSERT OR IGNORE INTO categories (name, description, sort_order, is_active, created_at, updated_at) VALUES (?, ?, ?, 1, datetime('now'), datetime('now'))"
  )
  const supplierStmt = db.prepare(
    `INSERT INTO suppliers (company_name, contact_person, phone, email, address, city, country, tax_number, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 'Bolivia', ?, 1, datetime('now'), datetime('now'))`
  )
  const warehouseStmt = db.prepare(
    `INSERT INTO warehouses (name, code, address, city, country, manager, phone, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'Bolivia', ?, ?, 1, datetime('now'), datetime('now'))`
  )
  const locationStmt = db.prepare(
    "INSERT INTO storage_locations (warehouse_id, zone, aisle, shelf, bin, code, description, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))"
  )

  brandStmt.run("Toyota Genuine", "Marca Toyota Genuine - Japón", "Japón", "https://www.toyota.com")
  brandStmt.run("TRW", "Marca TRW - EEUU", "EEUU", "https://www.zf.com")

  categoryStmt.run("Dirección", "Terminales, cremalleras, muñones y brazos", 1)
  categoryStmt.run("Suspensión", "Rótulas, barras estabilizadoras y muñones", 2)

  supplierStmt.run(
    "Autorepuestos Demo SRL",
    "María Condori",
    "+591 4 4455667",
    "demo@autorepuestos.bo",
    "Av. Ayacucho #1234",
    "Cochabamba",
    "10203040"
  )

  warehouseStmt.run("Almacén Principal", "WH-001", "Zona Industrial, Calle WH-001", "Cochabamba", "Carlos Romero", "+591 4 4567890")
  const whId = db.prepare("SELECT id FROM warehouses WHERE code = 'WH-001'").get().id

  const zones = ["A", "B", "C"]
  const aisles = ["01", "02"]
  const shelves = ["A", "B"]
  const locationIds = []
  for (const zone of zones) {
    for (const aisle of aisles) {
      for (const shelf of shelves) {
        const code = `WH-001-${zone}-${aisle}-${shelf}-01`
        locationStmt.run(whId, zone, aisle, shelf, "01", code, `Ubicación ${code}`)
        locationIds.push(db.prepare("SELECT id FROM storage_locations WHERE code = ?").get(code).id)
      }
    }
  }

  return {
    categoryId: (name) => db.prepare("SELECT id FROM categories WHERE name = ?").get(name).id,
    brandId: (name) => db.prepare("SELECT id FROM brands WHERE name = ?").get(name).id,
    supplierId: db.prepare("SELECT id FROM suppliers WHERE company_name = 'Autorepuestos Demo SRL'").get().id,
    warehouseId: whId,
    locationIds,
  }
}

function seedProducts(db, ref) {
  const round2 = (n) => Math.round(n * 100) / 100
  const loc = (i) => ref.locationIds[i % ref.locationIds.length]

  const productStmt = db.prepare(
    `INSERT INTO products (name, sku, oem_number, internal_code, description, category_id, brand_id, supplier_id,
      cost_price, sale_price, wholesale_price, suggested_retail_price, tax_rate, stock_quantity,
      min_stock_level, max_stock_level, reorder_point, unit, warehouse_id, storage_location_id, image_url,
      is_active, is_discontinued, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, NULL, 1, 0, datetime('now'), datetime('now'))`
  )
  const idStmt = db.prepare("INSERT OR IGNORE INTO product_identifiers (product_id, identifier, identifier_type, brand_name, created_at) VALUES (?, ?, ?, ?, datetime('now'))")

  const insertAll = db.transaction(() => {
    let index = 0
    for (const p of CATALOG) {
      const sku = (p.alt || p.code).trim()
      const cost = round2(p.price * 0.7)
      const result = productStmt.run(
        p.name.trim(),
        sku,
        p.code,
        p.code,
        p.name.trim(),
        ref.categoryId(p.category),
        ref.brandId(p.brand),
        ref.supplierId,
        cost,
        p.price,
        round2(p.price * 0.85),
        Math.round(p.price * 1.15),
        p.qty,
        1,
        p.qty * 3,
        2,
        "pcs",
        ref.warehouseId,
        loc(index++),
      )
      idStmt.run(result.lastInsertRowid, p.code, "oem", p.brand)
      if (p.alt) idStmt.run(result.lastInsertRowid, p.alt.trim(), "alternate", p.brand)
    }
  })

  insertAll()
  return db.prepare("SELECT COUNT(*) c FROM products").get().c
}

function activeProfileFile(dir) {
  let profile = "single-store"
  try {
    const contents = JSON.parse(readFileSync(join(dir, "profile.json"), "utf8"))
    if (PROFILE_DB_FILES[contents.profile]) profile = contents.profile
  } catch {
    // unreadable profile → default to single-store
  }
  return join(dir, PROFILE_DB_FILES[profile])
}

function main() {
  const activate = process.argv.includes("--activate")
  const dir = appDataDir()
  const dest = join(dir, DEMO_FILE)

  const source = usableSource(dir)
  if (!source) {
    console.error("❌ No initialized source database found in " + dir)
    console.error("   Launch the app once with any profile (npm start), then re-run this script.")
    process.exit(1)
  }

  console.log(`📄 Cloning schema + users from: ${source}`)
  clone(source, dest)
  console.log(`📦 Created demo DB: ${dest}`)

  const db = new Database(dest)
  wipeBusinessTables(db)
  const ref = seedReference(db)
  const count = seedProducts(db, ref)
  db.close()

  const total = CATALOG.reduce((s, p) => s + p.price * p.qty, 0)
  console.log("📊 Demo catalog:")
  console.log(`  Products:      ${count}  (expected ${CATALOG.length})`)
  console.log(`  Categories:    Dirección, Suspensión`)
  console.log(`  Brands:        Toyota Genuine, TRW`)
  console.log(`  Warehouse:     1 (WH-001, 12 locations)`)
  console.log(`  Catalog value: ${total.toFixed(2)}`)
  if (count !== CATALOG.length) {
    console.error("❌ Demo catalog count mismatch — aborting activation.")
    process.exit(1)
  }

  if (!activate) {
    console.log("\n✅ Demo DB ready. To use it in the app:")
    console.log(`   node scripts/database/seed-demo-catalog.mjs --activate`)
    console.log("   (backup of the current active DB is kept next to it as .bak-demo)")
    return
  }

  const active = activeProfileFile(dir)
  if (!existsSync(active)) {
    console.error(`❌ Active profile DB not found: ${active}`)
    process.exit(1)
  }
  const backup = `${active}.bak-demo-${Date.now()}`
  copyFileSync(active, backup)
  for (const suffix of ["", "-wal", "-shm"]) {
    const candidate = active + suffix
    if (existsSync(candidate) && candidate !== backup) rmSync(candidate)
  }
  copyFileSync(dest, active)
  writeFileSync(join(dir, "profile.json"), JSON.stringify({ profile: "single-store" }, null, 2), "utf8")

  console.log(`\n✅ Demo catalog activated.`)
  console.log(`   Backed up previous DB → ${backup}`)
  console.log(`   Active profile DB → ${active}`)
  console.log("   Restart the app (npm start) to browse the demo catalog.")
}

main()