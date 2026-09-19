import type Database from "better-sqlite3"
import type { DatabaseProfile } from "./index"
import { pick, randomInt, randomDate } from "./helpers"

const TRANSFER_NOTES = [
  "Reabastecimiento de stock", "Traslado por demanda", "Distribución a sucursal",
  "Traslado por exceso de inventario", "Reorganización de almacén",
]

export function seed(db: Database.Database, profile: DatabaseProfile): void {
  // Transfers require at least two stores; single-store profile has exactly one.
  const warehouseCount = db.prepare("SELECT COUNT(*) as cnt FROM warehouses").get() as { cnt: number }
  if (profile === "single-store" || warehouseCount.cnt < 2) return

  const count = db.prepare("SELECT COUNT(*) as cnt FROM inventory_movements WHERE reference_type = 'transfer'").get() as { cnt: number }
  if (count.cnt > 10) return

  const products = db.prepare("SELECT id FROM products").all() as { id: number }[]
  const users = db.prepare("SELECT id FROM users ORDER BY RANDOM()").all() as { id: number }[]
  const warehouses = db.prepare("SELECT id FROM warehouses ORDER BY RANDOM()").all() as { id: number }[]

  // We'll track transfers as pairs of movements (out from one, in to another)
  // In reality there would be a transfers table, but we use inventory_movements

  const movementStmt = db.prepare(
    `INSERT INTO inventory_movements (product_id, warehouse_id, quantity, type, reference_type, reference_id, notes, created_by, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )

  const updateStock = db.prepare("UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?")

  const insertAll = db.transaction(() => {
    let count = 0
    for (let i = 0; i < 100; i++) {
      const p = pick(products)
      const fromWh = pick(warehouses)
      let toWh = pick(warehouses)
      while (toWh.id === fromWh.id) {
        toWh = pick(warehouses)
      }
      const qty = randomInt(1, 20)
      const date = randomDate(300, 1)
      const note = pick(TRANSFER_NOTES)
      const status = pick(["completed", "completed", "completed", "pending", "cancelled"]) as string

      if (status === "completed") {
        // Transfer out (negative)
        movementStmt.run(p.id, fromWh.id, -qty, "transfer_out", "transfer", `TRF-${1001 + i}`, note, pick(users).id, date)
        updateStock.run(-qty, p.id)

        // Transfer in (positive) - slightly later
        const inDate = randomDate(1, 0)
        movementStmt.run(p.id, toWh.id, qty, "transfer_in", "transfer", `TRF-${1001 + i}`, note, pick(users).id, date)
        updateStock.run(qty, p.id)

        count += 2
      } else if (status === "pending") {
        // Only transfer out recorded
        movementStmt.run(p.id, fromWh.id, -qty, "transfer_out", "transfer", `TRF-${1001 + i}`, `${note} (PENDIENTE)`, pick(users).id, date)
        count++
      } else {
        // Cancelled - no movements
        count++
      }
    }
    console.log(`  ✓ Seeded ${count} transfer movements`)
  })

  insertAll()
}
