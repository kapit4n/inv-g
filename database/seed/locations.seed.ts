import type Database from "better-sqlite3"
import type { DatabaseProfile } from "./index"

const ZONES = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"]
const AISLES = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10"]
const SHELVES = ["A", "B", "C", "D"]
const BINS = ["01", "02", "03"]

/**
 * Each existing warehouse gets a location plan sized by its position so the
 * first store is always the richest (mirrors the legacy hard-coded layout).
 */
function planForIndex(index: number): { zones: string[]; aisles: string[]; shelves: string[] } {
  if (index === 0) return { zones: ZONES.slice(0, 4), aisles: AISLES.slice(0, 5), shelves: SHELVES.slice(0, 2) }
  if (index === 1) return { zones: ZONES.slice(0, 3), aisles: AISLES.slice(0, 5), shelves: SHELVES.slice(0, 2) }
  if (index === 2) return { zones: ZONES.slice(0, 2), aisles: AISLES.slice(0, 5), shelves: SHELVES.slice(0, 2) }
  return { zones: ZONES.slice(0, 1), aisles: AISLES.slice(0, 5), shelves: SHELVES.slice(0, 3) }
}

export function seed(db: Database.Database, _profile: DatabaseProfile): void {
  const existing = db.prepare("SELECT COUNT(*) as cnt FROM storage_locations").get() as { cnt: number }
  if (existing.cnt >= 100) return

  const warehouses = db.prepare("SELECT id, code FROM warehouses ORDER BY code").all() as { id: number; code: string }[]
  if (warehouses.length === 0) return

  const checkStmt = db.prepare("SELECT id FROM storage_locations WHERE code = ?")
  const insertStmt = db.prepare(
    "INSERT OR IGNORE INTO storage_locations (warehouse_id, zone, aisle, shelf, bin, code, description, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))"
  )

  const insertMany = db.transaction(() => {
    let added = 0
    warehouses.forEach((wh, index) => {
      const plan = planForIndex(index)
      for (const zone of plan.zones) {
        for (const aisle of plan.aisles) {
          for (const shelf of plan.shelves) {
            const code = `${wh.code}-${zone}-${aisle}-${shelf}-${BINS[0]}`
            const row = checkStmt.get(code) as { id: number } | undefined
            if (!row) {
              insertStmt.run(wh.id, zone, aisle, shelf, BINS[0], code, `Ubicación ${code}`)
              added++
            }
          }
        }
      }
    })
    if (added > 0) console.log(`  ✓ Added ${added} missing storage locations`)
  })

  insertMany()
}