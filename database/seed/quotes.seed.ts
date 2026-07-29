import type Database from "better-sqlite3"
import { exists, pick, pickN, randomInt, randomFloat, randomDate } from "./helpers"

function generateQuoteNumber(index: number): string {
  const date = new Date()
  const year = date.getFullYear()
  return `COT-${year}-${index.toString().padStart(4, "0")}`
}

const QUOTE_STATUSES = ["draft", "pending", "converted", "expired", "cancelled"]
const QUOTE_NOTES = [
  "Cotización para taller", "Presupuesto solicitado", "Cliente potencial",
  "Renovación de cotización", "Descuento por pronto pago", "Válido por 15 días",
]

export function seed(db: Database.Database): void {
  const count = db.prepare("SELECT COUNT(*) as cnt FROM quotes").get() as { cnt: number }
  if (count.cnt > 5) return

  const products = db.prepare("SELECT id, sale_price, name FROM products").all() as { id: number; sale_price: number; name: string }[]
  const customers = db.prepare("SELECT id FROM customers").all() as { id: number }[]
  const users = db.prepare("SELECT id FROM users ORDER BY RANDOM()").all() as { id: number }[]

  const insertQuote = db.prepare(
    `INSERT INTO quotes (quote_number, customer_id, user_id, subtotal, tax_rate, tax_amount, discount_amount, total, status, valid_until, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )

  const insertItem = db.prepare(
    `INSERT INTO quote_items (quote_id, product_id, quantity, unit_price, discount, total, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )

  const getQuoteId = db.prepare("SELECT id FROM quotes WHERE quote_number = ?")

  const insertAll = db.transaction(() => {
    for (let i = 0; i < 100; i++) {
      const quoteNumber = generateQuoteNumber(i + 1)
      const customer = pick(customers)
      const user = pick(users)
      const status = pickWeighted(QUOTE_STATUSES, [10, 25, 30, 20, 15])
      const itemCount = randomInt(2, 6)
      const selected = pickN(products, itemCount)
      const createdAt = randomDate(365, 0)

      // Valid until: 15-30 days from created
      const validDays = randomInt(15, 30)
      const validUntil = new Date(new Date(createdAt).getTime() + validDays * 86400000)
        .toISOString().replace("T", " ").substring(0, 19)

      let subtotal = 0
      const items: { productId: number; qty: number; unitPrice: number; discount: number; total: number }[] = []

      for (const p of selected) {
        const qty = randomInt(1, 10)
        const unitPrice = p.sale_price
        const discount = Math.random() > 0.6 ? randomFloat(0, unitPrice * 0.1) : 0
        const total = (unitPrice * qty) - discount
        subtotal += total
        items.push({ productId: p.id, qty, unitPrice, discount, total })
      }

      const discountAmount = Math.random() > 0.7 ? randomFloat(5, subtotal * 0.08) : 0
      const total = subtotal - discountAmount

      insertQuote.run(quoteNumber, customer.id, user.id, subtotal, 0, 0, discountAmount, total, status, validUntil, pick(QUOTE_NOTES), createdAt, createdAt)

      const quoteRow = getQuoteId.get(quoteNumber) as { id: number }
      for (const item of items) {
        insertItem.run(quoteRow.id, item.productId, item.qty, item.unitPrice, item.discount, item.total, createdAt)
      }
    }

    console.log(`  ✓ Seeded 100 quotes with items`)
  })

  insertAll()
}

function pickWeighted<T>(arr: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (let i = 0; i < arr.length; i++) {
    r -= weights[i]
    if (r <= 0) return arr[i]
  }
  return arr[arr.length - 1]
}
