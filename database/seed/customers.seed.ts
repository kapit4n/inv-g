import type Database from "better-sqlite3"
import { exists, bolivianPhone, bolivianCity, bolivianAddress, randomDate, pick, pickN, randomInt } from "./helpers"

const FIRST_NAMES = [
  "Carlos", "María", "José", "Ana", "Luis", "Carmen", "Juan", "Rosa", "Pedro", "Elena",
  "Jorge", "Sofía", "Miguel", "Laura", "Fernando", "Patricia", "Roberto", "Mónica", "Gabriel", "Verónica",
  "Diego", "Silvia", "Manuel", "Teresa", "Ricardo", "Alejandra", "Pablo", "Diana", "César", "Andrea",
  "Daniel", "Ruth", "Mario", "Katherine", "David", "Cecilia", "Walter", "Gabriela", "Raúl", "Marcela",
]

const LAST_NAMES = [
  "García", "Rodríguez", "Martínez", "López", "Hernández", "González", "Pérez", "Quispe", "Mendoza", "Vargas",
  "Rojas", "Flores", "Torrez", "Morales", "Cruz", "Vaca", "Ríos", "Cuéllar", "Lima", "Cárdenas",
  "Gutiérrez", "Sánchez", "Romero", "Ávila", "Ortíz", "Suárez", "Castillo", "Andrade", "Patzi", "Mamani",
  "Choque", "Yucra", "Condori", "Huanca", "Moya", "Rocha", "Castro", "Navarro", "Paredes", "Álvarez",
]

const BUSINESS_NAMES = [
  "Taller Mecánico {name}", "Servicio Automotriz {name}", "Autorepuestos {name}", "Centro Automotriz {name}",
  "Garaje {name}", "Mecánica General {name}", "Auto Servicio {name}", "Importadora {name}",
  "Distribuidora {name}", "Comercial {name}", "Repuestos {name}", "Lubricentro {name}",
]

const NOTES = [
  "Cliente frecuente", "Compra al por mayor", "Taller asociado", "Pago puntual",
  "Cliente nuevo", "Requiere factura", "Descuento especial", "Crédito aprobado",
]

function generateCustomers(): { name: string; phone: string; email: string; address: string; city: string; notes: string; createdAt: string }[] {
  const customers: { name: string; phone: string; email: string; address: string; city: string; notes: string; createdAt: string }[] = []

  // Generate individuals
  for (let i = 0; i < 130; i++) {
    const firstName = pick(FIRST_NAMES)
    const lastName = pick(LAST_NAMES)
    const city = bolivianCity()
    customers.push({
      name: `${firstName} ${lastName}`,
      phone: bolivianPhone(),
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randomInt(1, 99)}@gmail.com`,
      address: bolivianAddress(city),
      city,
      notes: pick(NOTES),
      createdAt: randomDate(365, 1),
    })
  }

  // Generate businesses
  for (let i = 0; i < 50; i++) {
    const lastName = pick(LAST_NAMES)
    const city = bolivianCity()
    const bizTemplate = pick(BUSINESS_NAMES)
    const bizName = bizTemplate.replace("{name}", lastName)
    customers.push({
      name: bizName,
      phone: bolivianPhone(),
      email: `contacto@${bizName.toLowerCase().replace(/[^a-z]/g, "")}.com`,
      address: bolivianAddress(city),
      city,
      notes: "Empresa / Taller",
      createdAt: randomDate(365, 1),
    })
  }

  return customers
}

export function seed(db: Database.Database): void {
  const existing = db.prepare("SELECT COUNT(*) as cnt FROM customers").get() as { cnt: number }
  if (existing.cnt >= 200) return

  const customers = generateCustomers()

  const checkEmail = db.prepare("SELECT id FROM customers WHERE email = ?")
  const stmt = db.prepare(
    `INSERT INTO customers (name, email, phone, address, city, country, notes, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'Bolivia', ?, 1, ?, ?)`
  )

  const insertAll = db.transaction(() => {
    let added = 0
    for (const c of customers) {
      const row = checkEmail.get(c.email) as { id: number } | undefined
      if (row) continue
      stmt.run(c.name, c.email, c.phone, c.address, c.city, c.notes, c.createdAt, c.createdAt)
      added++
    }
    if (added > 0) console.log(`  ✓ Added ${added} missing customers`)
  })

  insertAll()
}
