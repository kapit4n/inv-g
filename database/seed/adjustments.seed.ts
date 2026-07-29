import type Database from "better-sqlite3"
import { exists, pick, randomInt, randomDate } from "./helpers"

const ADJUSTMENT_REASONS = [
  "Corrección de inventario físico", "Diferencia en conteo cíclico", "Ajuste por daño",
  "Producto obsoleto", "Corrección de entrada", "Ajuste por merma", "Recuento de stock",
  "Error de sistema", "Producto devuelto sin registro", "Ajuste temporal",
]

export function seed(db: Database.Database): void {
  const count = db.prepare("SELECT COUNT(*) as cnt FROM inventory_movements WHERE type IN ('adjustment', 'correction')").get() as { cnt: number }
  if (count.cnt > 50) return

  const products = db.prepare("SELECT id FROM products").all() as { id: number }[]
  const users = db.prepare("SELECT id FROM users ORDER BY RANDOM()").all() as { id: number }[]
  const warehouses = db.prepare("SELECT id FROM warehouses ORDER BY RANDOM()").all() as { id: number }[]

  const stmt = db.prepare(
    `INSERT INTO inventory_movements (product_id, warehouse_id, quantity, type, reference_type, reference_id, notes, created_by, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )

  const updateStock = db.prepare("UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?")

  const insertAll = db.transaction(() => {
    let adjCount = 0
    for (let i = 0; i < 100; i++) {
      const p = pick(products)
      const wh = pick(warehouses)
      const qty = pick([-1]) ? -Math.abs(randomInt(1, 10)) : randomInt(1, 20)
      const reason = pick(ADJUSTMENT_REASONS)
      const date = randomDate(365, 1)
      stmt.run(p.id, wh.id, qty, "adjustment", "adjustment", `ADJ-${2001 + i}`, reason, pick(users).id, date)
      updateStock.run(qty, p.id)
      adjCount++
    }
    console.log(`  ✓ Seeded ${adjCount} inventory adjustments`)
  })

  insertAll()
}
