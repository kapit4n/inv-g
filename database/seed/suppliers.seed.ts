import type Database from "better-sqlite3"
import { exists, bolivianCity, bolivianAddress, bolivianPhone } from "./helpers"

const SUPPLIER_DATA = [
  { company: "Importadora Boliviana de Autopartes SRL", contact: "Carlos Romero", tax: "102345021" },
  { company: "Distribuidora Automotriz Cochabamba", contact: "María García", tax: "102345022" },
  { company: "Autorepuestos Santa Cruz Ltda.", contact: "Pedro Vaca", tax: "102345023" },
  { company: "Importadora Japonesa de Partes", contact: "Akio Yamamoto", tax: "102345024" },
  { company: "Bosch Bolivia SRL", contact: "Hans Müller", tax: "102345025" },
  { company: "Distribuidora de Lubricantes Total", contact: "Luis Ángel Ríos", tax: "102345026" },
  { company: "Repuestos Alemanes La Paz", contact: "Jorge Schmidt", tax: "102345027" },
  { company: "Comercializadora de Neumáticos", contact: "Roberto Vargas", tax: "102345028" },
  { company: "Suministros Eléctricos Automotrices", contact: "Ana María Cuéllar", tax: "102345029" },
  { company: "Importadora SKF Bolivia", contact: "Erik Larsson", tax: "102345030" },
  { company: "Distribuidora de Frenos y Embragues", contact: "Fernando Rocha", tax: "102345031" },
  { company: "Proveedora de Filtros Mann", contact: "Dieter Weber", tax: "102345032" },
  { company: "Auto Partes del Sur", contact: "Mario Cárdenas", tax: "102345033" },
  { company: "Importadora Denso Bolivia", contact: "Takeshi Tanaka", tax: "102345034" },
  { company: "Repuestos Originales Toyota", contact: "Alberto Suzuki", tax: "102345035" },
  { company: "Distribuidora de Accesorios Automotrices", contact: "Sofía Andrade", tax: "102345036" },
  { company: "Comercial Multirepuestos", contact: "Daniel Quispe", tax: "102345037" },
  { company: "Importadora de Rodamientos y Correas", contact: "Patricia Limpias", tax: "102345038" },
  { company: "Proveedora de Baterías Exide", contact: "Richard Suárez", tax: "102345039" },
  { company: "Distribuidora KYB Suspensión", contact: "Kenji Nakamura", tax: "102345040" },
]

export function seed(db: Database.Database): void {
  const existing = db.prepare("SELECT COUNT(*) as cnt FROM suppliers").get() as { cnt: number }
  if (existing.cnt >= SUPPLIER_DATA.length) return

  const checkStmt = db.prepare("SELECT id FROM suppliers WHERE company_name = ?")
  const insertStmt = db.prepare(
    `INSERT INTO suppliers (company_name, contact_person, phone, mobile, email, website, tax_number, address, city, country, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Bolivia', 1, datetime('now'), datetime('now'))`
  )

  const cities = ["Cochabamba", "Santa Cruz", "La Paz", "Sucre"]

  let added = 0
  SUPPLIER_DATA.forEach((s) => {
    const row = checkStmt.get(s.company) as { id: number } | undefined
    if (!row) {
      const city = cities[Math.floor(Math.random() * cities.length)]
      const username = s.company.toLowerCase().replace(/[^a-z]/g, "")
      insertStmt.run(
        s.company, s.contact, bolivianPhone(), bolivianPhone(),
        `contacto@${username}.com`, `www.${username}.com`, s.tax,
        bolivianAddress(city), city,
      )
      added++
    }
  })

  if (added > 0) console.log(`  ✓ Added ${added} missing suppliers`)
}
