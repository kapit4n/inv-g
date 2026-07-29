import type Database from "better-sqlite3"
import { exists, pick, pickN, randomInt, randomFloat, randomDate } from "./helpers"

function generateSaleNumber(index: number): string {
  const date = new Date()
  const year = date.getFullYear()
  return `V-${year}-${index.toString().padStart(5, "0")}`
}

export function seed(db: Database.Database): void {
  const count = db.prepare("SELECT COUNT(*) as cnt FROM sales").get() as { cnt: number }
  if (count.cnt > 10) return

  const products = db.prepare("SELECT id, sale_price, cost_price, name FROM products").all() as { id: number; sale_price: number; cost_price: number; name: string }[]
  const customers = db.prepare("SELECT id FROM customers").all() as { id: number }[]
  const users = db.prepare("SELECT id FROM users ORDER BY RANDOM()").all() as { id: number }[]
  const warehouses = db.prepare("SELECT id FROM warehouses ORDER BY RANDOM()").all() as { id: number }[]

  const insertSale = db.prepare(
    `INSERT INTO sales (sale_number, receipt_number, customer_id, user_id, warehouse_id, subtotal, tax_rate, tax_amount, discount_amount, total, payment_method, payment_status, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'paid', ?, ?, ?)`
  )

  const insertItem = db.prepare(
    `INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, discount, total, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  )

  const insertPayment = db.prepare(
    `INSERT INTO sale_payments (sale_id, method, amount, reference, change_amount, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  )

  const insertMovement = db.prepare(
    `INSERT INTO inventory_movements (product_id, warehouse_id, quantity, type, reference_type, reference_id, notes, created_by, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )

  const updateStock = db.prepare("UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?")

  const insertReceipt = db.prepare(
    `INSERT INTO receipts (sale_id, receipt_number, receipt_type, is_printed, created_at)
     VALUES (?, ?, 'sale', 1, ?)`
  )

  const getSaleId = db.prepare("SELECT id FROM sales WHERE sale_number = ?")

  const PAYMENT_METHODS = ["cash", "cash", "cash", "card", "card", "transfer", "qr"]
  const SALE_NOTES = [
    "Venta directa", "Cliente mostrador", "Taller asociado", "Venta al por mayor",
    "Cliente frecuente", "Descuento por volumen", "Incluye instalación", "",
    "", "", "",
  ]

  const insertAll = db.transaction(() => {
    let saleIdx = 0
    let totalItems = 0

    for (let saleNum = 0; saleNum < 500; saleNum++) {
      saleIdx++
      const saleNumber = generateSaleNumber(saleIdx)
      const customer = pick(customers)
      const user = pick(users)
      const warehouse = pick(warehouses)
      const itemCount = randomInt(1, 8)
      const selectedProducts = pickN(products, itemCount)
      const createdAt = randomDate(365, 0)
      const paymentMethod = pick(PAYMENT_METHODS)

      let subtotal = 0
      const items: { productId: number; qty: number; unitPrice: number; discount: number; total: number }[] = []

      for (const p of selectedProducts) {
        const qty = randomInt(1, 4)
        const unitPrice = p.sale_price
        const discount = Math.random() > 0.7 ? randomFloat(1, unitPrice * 0.15) : 0
        const total = (unitPrice * qty) - discount
        subtotal += total
        items.push({ productId: p.id, qty, unitPrice, discount, total })
        totalItems++
      }

      const taxRate = 0
      const taxAmount = 0
      const discountAmount = Math.random() > 0.8 ? randomFloat(5, subtotal * 0.1) : 0
      const total = subtotal - discountAmount
      const notes = pick(SALE_NOTES)
      const receiptNumber = `R-${saleIdx.toString().padStart(5, "0")}`

      insertSale.run(saleNumber, receiptNumber, customer.id, user.id, warehouse.id, subtotal, taxRate, taxAmount, discountAmount, total, paymentMethod, notes, createdAt, createdAt)

      const saleRow = getSaleId.get(saleNumber) as { id: number }
      const saleId = saleRow.id

      for (const item of items) {
        insertItem.run(saleId, item.productId, item.qty, item.unitPrice, item.discount, item.total, createdAt, createdAt)
        // Inventory movement for sale
        insertMovement.run(item.productId, warehouse.id, -item.qty, "sale", "sale", saleNumber, `Venta #${saleNumber}`, user.id, createdAt)
        updateStock.run(item.qty, item.productId)
      }

      // Payment
      if (paymentMethod === "cash") {
        const change = randomFloat(0, 20)
        insertPayment.run(saleId, "cash", total + change, null, change, createdAt)
      } else if (paymentMethod === "card") {
        insertPayment.run(saleId, "card", total, `AUTH-${randomInt(100000, 999999)}`, 0, createdAt)
      } else if (paymentMethod === "transfer") {
        insertPayment.run(saleId, "transfer", total, `TRF-${randomInt(10000, 99999)}`, 0, createdAt)
      } else if (paymentMethod === "qr") {
        insertPayment.run(saleId, "qr", total, `QR-${randomInt(100000, 999999)}`, 0, createdAt)
      }

      // Receipt
      insertReceipt.run(saleId, receiptNumber, createdAt)
    }

    console.log(`  ✓ Seeded ${saleIdx} sales with ${totalItems} items and payments`)
  })

  insertAll()
}
