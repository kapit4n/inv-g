import type Database from "better-sqlite3"
import { exists } from "./helpers"

const WAREHOUSES = [
  { name: "Almacén Principal", code: "WH-001", city: "Cochabamba", manager: "Carlos Romero" },
  { name: "Almacén Secundario", code: "WH-002", city: "Cochabamba", manager: "María López" },
  { name: "Almacén de Piezas Pequeñas", code: "WH-003", city: "Santa Cruz", manager: "Pedro Vargas" },
  { name: "Almacén de Rotación Rápida", code: "WH-004", city: "La Paz", manager: "Ana Morales" },
]

export function seed(db: Database.Database): void {
  const existing = db.prepare("SELECT COUNT(*) as cnt FROM warehouses").get() as { cnt: number }
  if (existing.cnt >= WAREHOUSES.length) return

  const checkStmt = db.prepare("SELECT id FROM warehouses WHERE code = ?")
  const insertStmt = db.prepare(
    `INSERT INTO warehouses (name, code, address, city, country, manager, phone, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'Bolivia', ?, ?, 1, datetime('now'), datetime('now'))`
  )

  let added = 0
  WAREHOUSES.forEach((w) => {
    const row = checkStmt.get(w.code) as { id: number } | undefined
    if (!row) {
      insertStmt.run(w.name, w.code, `Zona Industrial, Calle ${w.code}`, w.city, w.manager, "+591 4 4567890")
      added++
    }
  })

  if (added > 0) console.log(`  ✓ Added ${added} missing warehouses`)
}
