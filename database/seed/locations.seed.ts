import type Database from "better-sqlite3"
import { exists } from "./helpers"

const ZONES = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"]
const AISLES = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10"]
const SHELVES = ["A", "B", "C", "D"]
const BINS = ["01", "02", "03"]

function generateLocations(): { zone: string; aisle: string; shelf: string; bin: string; warehouseId: number }[] {
  const locs: { zone: string; aisle: string; shelf: string; bin: string; warehouseId: number }[] = []

  // WH-001: 40 locations (A-D zones, 1-5 aisles, A-B shelves, 01-02 bins)
  for (const zone of ZONES.slice(0, 4)) {
    for (const aisle of AISLES.slice(0, 5)) {
      for (const shelf of SHELVES.slice(0, 2)) {
        for (const bin of BINS.slice(0, 1)) {
          locs.push({ zone, aisle, shelf, bin, warehouseId: 1 })
        }
      }
    }
  }

  // WH-002: 30 locations
  for (const zone of ZONES.slice(0, 3)) {
    for (const aisle of AISLES.slice(0, 5)) {
      for (const shelf of SHELVES.slice(0, 2)) {
        locs.push({ zone, aisle, shelf, bin: "01", warehouseId: 2 })
      }
    }
  }

  // WH-003: 20 locations
  for (const zone of ZONES.slice(0, 2)) {
    for (const aisle of AISLES.slice(0, 5)) {
      for (const shelf of SHELVES.slice(0, 2)) {
        locs.push({ zone, aisle, shelf, bin: "01", warehouseId: 3 })
      }
    }
  }

  // WH-004: 15 locations
  for (const zone of ZONES.slice(0, 1)) {
    for (const aisle of AISLES.slice(0, 5)) {
      for (const shelf of SHELVES.slice(0, 3)) {
        locs.push({ zone, aisle, shelf, bin: "01", warehouseId: 4 })
      }
    }
  }

  return locs
}

export function seed(db: Database.Database): void {
  const existing = db.prepare("SELECT COUNT(*) as cnt FROM storage_locations").get() as { cnt: number }
  if (existing.cnt >= 100) return

  const locations = generateLocations()
  const checkStmt = db.prepare("SELECT id FROM storage_locations WHERE code = ?")
  const insertStmt = db.prepare(
    "INSERT OR IGNORE INTO storage_locations (warehouse_id, zone, aisle, shelf, bin, code, description, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))"
  )

  const insertMany = db.transaction(() => {
    let added = 0
    for (const loc of locations) {
      const code = `WH-${loc.warehouseId.toString().padStart(3, "0")}-${loc.zone}-${loc.aisle}-${loc.shelf}-${loc.bin}`
      const row = checkStmt.get(code) as { id: number } | undefined
      if (!row) {
        insertStmt.run(loc.warehouseId, loc.zone, loc.aisle, loc.shelf, loc.bin, code, `Ubicación ${code}`)
        added++
      }
    }
    if (added > 0) console.log(`  ✓ Added ${added} missing storage locations`)
  })

  insertMany()
}
