import type Database from "better-sqlite3"
import { exists, pick, randomInt, randomDate } from "./helpers"

const ACTIONS: { action: string; entityType: string; severity: string }[] = [
  { action: "login", entityType: "user", severity: "info" },
  { action: "sale_created", entityType: "sale", severity: "info" },
  { action: "product_created", entityType: "product", severity: "info" },
  { action: "product_updated", entityType: "product", severity: "info" },
  { action: "inventory_adjusted", entityType: "inventory", severity: "warning" },
  { action: "transfer_completed", entityType: "transfer", severity: "info" },
  { action: "customer_created", entityType: "customer", severity: "info" },
  { action: "customer_updated", entityType: "customer", severity: "info" },
  { action: "quote_created", entityType: "quote", severity: "info" },
  { action: "quote_converted", entityType: "quote", severity: "success" },
  { action: "payment_received", entityType: "payment", severity: "info" },
  { action: "register_opened", entityType: "register", severity: "info" },
  { action: "register_closed", entityType: "register", severity: "info" },
  { action: "daily_closeout", entityType: "closeout", severity: "success" },
  { action: "receipt_printed", entityType: "receipt", severity: "info" },
  { action: "settings_modified", entityType: "settings", severity: "warning" },
  { action: "user_created", entityType: "user", severity: "info" },
  { action: "product_discontinued", entityType: "product", severity: "warning" },
  { action: "damage_reported", entityType: "inventory", severity: "error" },
  { action: "stock_corrected", entityType: "inventory", severity: "warning" },
  { action: "logout", entityType: "user", severity: "info" },
  { action: "sale_refunded", entityType: "sale", severity: "warning" },
  { action: "supplier_created", entityType: "supplier", severity: "info" },
  { action: "category_created", entityType: "category", severity: "info" },
  { action: "brand_created", entityType: "brand", severity: "info" },
  { action: "reservation_created", entityType: "reservation", severity: "info" },
  { action: "report_generated", entityType: "report", severity: "info" },
  { action: "user_logged_out", entityType: "user", severity: "info" },
]

const DETAILS = [
  "Usuario inició sesión en el sistema",
  "Venta registrada correctamente",
  "Nuevo producto añadido al inventario",
  "Producto actualizado en el sistema",
  "Inventario ajustado manualmente",
  "Transferencia entre almacenes completada",
  "Nuevo cliente registrado",
  "Datos de cliente actualizados",
  "Cotización creada para cliente",
  "Cotización convertida a venta",
  "Pago recibido y procesado",
  "Caja registradora abierta",
  "Caja registradora cerrada",
  "Cierre de turno completado",
  "Recibo impreso",
  "Configuración del sistema modificada",
  "Nuevo usuario creado en el sistema",
  "Producto descontinuado",
  "Daño reportado en inventario",
  "Stock corregido después de conteo",
  "Sesión de usuario cerrada",
  "Venta reembolsada al cliente",
  "Nuevo proveedor registrado",
  "Nueva categoría de producto creada",
  "Nueva marca registrada",
  "Reservación de inventario creada",
  "Reporte generado exitosamente",
  "Usuario cerró sesión",
]

export function seed(db: Database.Database): void {
  const count = db.prepare("SELECT COUNT(*) as cnt FROM audit_logs").get() as { cnt: number }
  if (count.cnt > 5000) return

  const users = db.prepare("SELECT id FROM users").all() as { id: number }[]
  const products = db.prepare("SELECT id, name FROM products LIMIT 50").all() as { id: number; name: string }[]
  const customers = db.prepare("SELECT id FROM customers LIMIT 50").all() as { id: number }[]

  const stmt = db.prepare(
    `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, severity, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )

  const insertAll = db.transaction(() => {
    let inserted = 0

    // Generate login/logout events (1-2 per day for 365 days)
    for (let day = 0; day < 365; day++) {
      const date = randomDate(365, 0)
      for (const user of users) {
        if (Math.random() > 0.6) {
          stmt.run(user.id, "login", "user", String(user.id), `Usuario #${user.id} inició sesión`, "info", date)
          inserted++
          if (Math.random() > 0.3) {
            const logoutDate = randomDate(1, 0)
            stmt.run(user.id, "logout", "user", String(user.id), `Usuario #${user.id} cerró sesión`, "info", logoutDate)
            inserted++
          }
        }
      }
    }

    // Generate product-related actions
    for (const p of products) {
      if (Math.random() > 0.5) {
        const date = randomDate(365, 0)
        stmt.run(pick(users).id, "product_updated", "product", String(p.id), `Producto #${p.id} actualizado: ${p.name}`, "info", date)
        inserted++
      }
    }

    // Generate periodic actions
    for (let i = 0; i < 3000; i++) {
      const actionDef = pick(ACTIONS)
      const user = pick(users)
      const detail = pick(DETAILS)
      const entityId = String(randomInt(1, 500))
      const date = randomDate(365, 0)
      stmt.run(user.id, actionDef.action, actionDef.entityType, entityId, detail, actionDef.severity, date)
      inserted++
    }

    console.log(`  ✓ Seeded ${inserted} audit log entries`)
  })

  insertAll()
}
