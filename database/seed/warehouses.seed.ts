import type Database from "better-sqlite3"
import type { DatabaseProfile } from "./index"

const WAREHOUSES = [
  { name: "Almacén Principal", code: "WH-001", city: "Cochabamba", manager: "Carlos Romero" },
  { name: "Almacén Secundario", code: "WH-002", city: "Cochabamba", manager: "María López" },
  { name: "Almacén de Piezas Pequeñas", code: "WH-003", city: "Santa Cruz", manager: "Pedro Vargas" },
  { name: "Almacén de Rotación Rápida", code: "WH-004", city: "La Paz", manager: "Ana Morales" },
]

/**
 * Returns the target warehouse set for a profile:
 *   single-store → exactly 1, multi-store → 3, default → 4 (legacy).
 */
function wantedWarehouses(profile: DatabaseProfile) {
  if (profile === "single-store") return WAREHOUSES.slice(0, 1)
  if (profile === "multi-store") return WAREHOUSES.slice(0, 3)
  if (profile === "empty") return []
  return WAREHOUSES
}

export function seed(db: Database.Database, profile: DatabaseProfile): void {
  const wanted = wantedWarehouses(profile)
  if (profile === "empty") return

  // The base schema (created by the app) already provides warehouses for the
  // single-store/multi-store seeds; only add whatever is missing.
  const checkStmt = db.prepare("SELECT id FROM warehouses WHERE code = ?")
  const insertStmt = db.prepare(
    `INSERT INTO warehouses (name, code, address, city, country, manager, phone, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'Bolivia', ?, ?, 1, datetime('now'), datetime('now'))`
  )

  let added = 0
  wanted.forEach((w) => {
    const row = checkStmt.get(w.code) as { id: number } | undefined
    if (!row) {
      insertStmt.run(w.name, w.code, `Zona Industrial, Calle ${w.code}`, w.city, w.manager, "+591 4 4567890")
      added++
    }
  })

  if (added > 0) console.log(`  ✓ Added ${added} missing warehouses`)
}