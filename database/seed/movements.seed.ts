import type Database from "better-sqlite3"
import { exists, pick, randomInt, randomDate } from "./helpers"

const MOVEMENT_TYPES = ["initial_stock", "adjustment", "transfer_in", "transfer_out", "sale", "damage", "loss", "found"]

const DAMAGE_REASONS = [
  "Golpe en transporte", "Almacenamiento incorrecto", "Producto vencido", "Embalaje dañado",
  "Óxido detectado", "Falla de fábrica", "Rotura en manipulación", "Derrame de líquido",
]

const LOSS_REASONS = [
  "Extraviado en inventario", "Error de conteo", "Producto no localizado", "Diferencia de inventario",
]

export function seed(db: Database.Database): void {
  const count = db.prepare("SELECT COUNT(*) as cnt FROM inventory_movements").get() as { cnt: number }
  if (count.cnt > 100) return // Already seeded with demo data

  const getProducts = db.prepare("SELECT id, stock_quantity FROM products ORDER BY id")
  const getUsers = db.prepare("SELECT id FROM users ORDER BY RANDOM()")
  const getWarehouses = db.prepare("SELECT id FROM warehouses ORDER BY RANDOM()")

  const products = getProducts.all() as { id: number; stock_quantity: number }[]
  const users = getUsers.all() as { id: number }[]
  const warehouses = getWarehouses.all() as { id: number }[]

  const initialStockStmt = db.prepare(
    `INSERT INTO inventory_movements (product_id, warehouse_id, quantity, type, reference_type, notes, created_by, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  )

  const movementStmt = db.prepare(
    `INSERT INTO inventory_movements (product_id, warehouse_id, quantity, type, reference_type, reference_id, notes, created_by, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )

  const updateStock = db.prepare("UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?")

  const insertAll = db.transaction(() => {
    let totalMovements = 0

    // Generate initial stock movements for all products
    for (const p of products) {
      if (p.stock_quantity > 0) {
        const date = randomDate(365, 300)
        const wh = pick(warehouses)
        initialStockStmt.run(p.id, wh.id, p.stock_quantity, "initial_stock", "initial", "Stock inicial", pick(users).id, date)
        totalMovements++
      }
    }

    // Generate adjustment movements
    for (let i = 0; i < 100; i++) {
      const p = pick(products)
      const wh = pick(warehouses)
      const qty = randomInt(-20, 50)
      const type = pick(["adjustment", "correction"])
      const reason = pick(DAMAGE_REASONS)
      const date = randomDate(300, 1)
      movementStmt.run(p.id, wh.id, qty, type, "adjustment", null, `Ajuste: ${reason}`, pick(users).id, date)
      updateStock.run(qty, p.id)
      totalMovements++
    }

    // Generate damage movements (negative)
    for (let i = 0; i < 50; i++) {
      const p = pick(products)
      const wh = pick(warehouses)
      const qty = -Math.abs(randomInt(1, 5))
      const date = randomDate(300, 1)
      movementStmt.run(p.id, wh.id, qty, "damage", "damage", null, `Daño: ${pick(DAMAGE_REASONS)}`, pick(users).id, date)
      updateStock.run(qty, p.id)
      totalMovements++
    }

    // Generate loss movements (negative)
    for (let i = 0; i < 30; i++) {
      const p = pick(products)
      const wh = pick(warehouses)
      const qty = -Math.abs(randomInt(1, 3))
      const date = randomDate(300, 1)
      movementStmt.run(p.id, wh.id, qty, "loss", "loss", null, `Pérdida: ${pick(LOSS_REASONS)}`, pick(users).id, date)
      updateStock.run(qty, p.id)
      totalMovements++
    }

    // Generate found inventory (positive)
    for (let i = 0; i < 20; i++) {
      const p = pick(products)
      const wh = pick(warehouses)
      const qty = randomInt(1, 10)
      const date = randomDate(300, 1)
      movementStmt.run(p.id, wh.id, qty, "found", "found", null, "Inventario encontrado en conteo", pick(users).id, date)
      updateStock.run(qty, p.id)
      totalMovements++
    }

    // We'll add sales movements later after recording sales
    // For now, generate synthetic sale movements
    for (let i = 0; i < 300; i++) {
      const p = pick(products)
      const wh = pick(warehouses)
      const qty = -Math.abs(randomInt(1, 8))
      const date = randomDate(300, 1)
      movementStmt.run(p.id, wh.id, qty, "sale", "sale", `SALE-${1000 + i}`, `Venta #${1000 + i}`, pick(users).id, date)
      updateStock.run(qty, p.id)
      totalMovements++
    }

    // Additional random movements
    for (let i = 0; i < 1500; i++) {
      const p = pick(products)
      const wh = pick(warehouses)
      const type = pick(MOVEMENT_TYPES)
      const isPositive = pick([true, false])
      const qty = isPositive ? randomInt(1, 50) : -Math.abs(randomInt(1, 20))
      const date = randomDate(365, 1)
      movementStmt.run(p.id, wh.id, qty, type, type, null, `Movimiento ${type}`, pick(users).id, date)
      updateStock.run(qty, p.id)
      totalMovements++
    }

    console.log(`  ✓ Seeded ${totalMovements} inventory movements`)
  })

  insertAll()
}
