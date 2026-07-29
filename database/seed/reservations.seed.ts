import type Database from "better-sqlite3"
import { exists, pick, randomInt, randomDate } from "./helpers"

const STATUSES = ["active", "active", "active", "fulfilled", "fulfilled", "cancelled", "expired"]
const NOTES = [
  "Reservado para taller", "Cliente solicitó apartado", "Reserva para instalación",
  "Pedido especial", "Garantía de disponibilidad",
]

export function seed(db: Database.Database): void {
  const count = db.prepare("SELECT COUNT(*) as cnt FROM inventory_movements WHERE reference_type = 'reservation'").get() as { cnt: number }
  if (count.cnt > 5) return

  const products = db.prepare("SELECT id, stock_quantity FROM products WHERE stock_quantity > 5").all() as { id: number; stock_quantity: number }[]
  const users = db.prepare("SELECT id FROM users ORDER BY RANDOM()").all() as { id: number }[]
  const warehouses = db.prepare("SELECT id FROM warehouses ORDER BY RANDOM()").all() as { id: number }[]

  const movementStmt = db.prepare(
    `INSERT INTO inventory_movements (product_id, warehouse_id, quantity, type, reference_type, reference_id, notes, created_by, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )

  const updateStock = db.prepare("UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?")

  if (products.length === 0) return

  const insertAll = db.transaction(() => {
    let count = 0
    for (let i = 0; i < 50; i++) {
      const p = pick(products)
      const qty = -Math.abs(randomInt(1, Math.min(5, p.stock_quantity)))
      if (qty === 0) continue
      const status = pick(STATUSES)
      const date = randomDate(90, 0)
      const note = `${pick(NOTES)}`

      movementStmt.run(p.id, pick(warehouses).id, qty, "reservation", "reservation", `RES-${3001 + i}`, note, pick(users).id, date)
      if (status === "fulfilled" || status === "cancelled") {
        // Release the stock
        const releaseDate = randomDate(30, 0)
        movementStmt.run(p.id, pick(warehouses).id, -qty, "reservation", "reservation", `RES-${3001 + i}`, `Liberación: ${note}`, pick(users).id, releaseDate)
        updateStock.run(-qty, p.id)
        count++
      } else {
        updateStock.run(qty, p.id)
        count++
      }
    }
    console.log(`  ✓ Seeded ${count} reservations`)
  })

  insertAll()
}
