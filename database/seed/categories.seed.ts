import type Database from "better-sqlite3"
import { exists } from "./helpers"

const CATEGORIES = [
  { name: "Filtros", description: "Filtros de aceite, aire, combustible y cabina" },
  { name: "Frenos", description: "Sistema de frenado: pastillas, discos, tambores" },
  { name: "Motor", description: "Partes y componentes del motor" },
  { name: "Suspensión", description: "Amortiguadores, resortes, rótulas" },
  { name: "Dirección", description: "Terminales, cremalleras, bomba de dirección" },
  { name: "Transmisión", description: "Embrague, caja de cambios, kit de arrastre" },
  { name: "Lubricantes", description: "Aceites de motor, transmisión y grasas" },
  { name: "Refrigeración", description: "Radiadores, bombas de agua, termostatos" },
  { name: "Encendido", description: "Bujías, cables, bobinas" },
  { name: "Sistema Eléctrico", description: "Alternadores, motores de arranque, sensores" },
  { name: "Baterías", description: "Baterías para vehículos" },
  { name: "Iluminación", description: "Faros, bombillas, LED" },
  { name: "Rodamientos", description: "Rodamientos de rueda y transmisión" },
  { name: "Correas", description: "Correas de distribución, poly-V" },
  { name: "Sensores", description: "Sensores MAP, MAF, oxígeno, velocidad" },
  { name: "Escape", description: "Silenciadores, tubos de escape, catalizadores" },
  { name: "Accesorios", description: "Accesorios y complementos para vehículos" },
  { name: "Herramientas", description: "Herramientas automotrices" },
  { name: "Neumáticos", description: "Llantas y neumáticos" },
  { name: "Limpieza Automotriz", description: "Productos de limpieza y cuidado" },
]

export function seed(db: Database.Database): void {
  const existing = db.prepare("SELECT COUNT(*) as cnt FROM categories").get() as { cnt: number }
  if (existing.cnt >= CATEGORIES.length) return

  const getMaxSort = db.prepare("SELECT COALESCE(MAX(sort_order), 0) FROM categories").get() as { "COALESCE(MAX(sort_order), 0)": number }
  let nextSort = getMaxSort["COALESCE(MAX(sort_order), 0)"] + 1

  const checkStmt = db.prepare("SELECT id FROM categories WHERE name = ?")
  const insertStmt = db.prepare(
    "INSERT INTO categories (name, description, sort_order, is_active, created_at, updated_at) VALUES (?, ?, ?, 1, datetime('now'), datetime('now'))"
  )

  let added = 0
  for (const cat of CATEGORIES) {
    const row = checkStmt.get(cat.name) as { id: number } | undefined
    if (!row) {
      insertStmt.run(cat.name, cat.description, nextSort++)
      added++
    }
  }

  if (added > 0) console.log(`  ✓ Added ${added} missing categories`)
}
