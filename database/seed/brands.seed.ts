import type Database from "better-sqlite3"
import { exists } from "./helpers"

const BRANDS = [
  { name: "Bosch", country: "Alemania", website: "https://www.bosch.com" },
  { name: "NGK", country: "Japón", website: "https://www.ngk.com" },
  { name: "SKF", country: "Suecia", website: "https://www.skf.com" },
  { name: "Denso", country: "Japón", website: "https://www.denso.com" },
  { name: "Valeo", country: "Francia", website: "https://www.valeo.com" },
  { name: "Mann", country: "Alemania", website: "https://www.mann-filter.com" },
  { name: "Fram", country: "EEUU", website: "https://www.fram.com" },
  { name: "ACDelco", country: "EEUU", website: "https://www.acdelco.com" },
  { name: "Gates", country: "EEUU", website: "https://www.gates.com" },
  { name: "Dayco", country: "EEUU", website: "https://www.dayco.com" },
  { name: "Monroe", country: "Bélgica", website: "https://www.monroe.com" },
  { name: "TRW", country: "EEUU", website: "https://www.trw.com" },
  { name: "Mobil", country: "EEUU", website: "https://www.mobil.com" },
  { name: "Castrol", country: "Reino Unido", website: "https://www.castrol.com" },
  { name: "Total", country: "Francia", website: "https://www.total.com" },
  { name: "Toyota Genuine", country: "Japón", website: "https://www.toyota.com" },
  { name: "Honda Genuine", country: "Japón", website: "https://www.honda.com" },
  { name: "Motorcraft", country: "EEUU", website: "https://www.motorcraft.com" },
  { name: "Mahle", country: "Alemania", website: "https://www.mahle.com" },
  { name: "K&N", country: "EEUU", website: "https://www.knfilters.com" },
  { name: "Osram", country: "Alemania", website: "https://www.osram.com" },
  { name: "Philips", country: "Países Bajos", website: "https://www.philips.com" },
  { name: "Exide", country: "EEUU", website: "https://www.exide.com" },
  { name: "Yuasa", country: "Japón", website: "https://www.yuasa.com" },
  { name: "Brembo", country: "Italia", website: "https://www.brembo.com" },
  { name: "Ferodo", country: "Reino Unido", website: "https://www.ferodo.com" },
  { name: "KYB", country: "Japón", website: "https://www.kyb.com" },
  { name: "Delphi", country: "Reino Unido", website: "https://www.delphi.com" },
  { name: "Hitachi", country: "Japón", website: "https://www.hitachi.com" },
  { name: "Continental", country: "Alemania", website: "https://www.continental.com" },
]

export function seed(db: Database.Database): void {
  const existing = db.prepare("SELECT COUNT(*) as cnt FROM brands").get() as { cnt: number }
  if (existing.cnt >= BRANDS.length) return

  const checkStmt = db.prepare("SELECT id FROM brands WHERE name = ?")
  const insertStmt = db.prepare(
    "INSERT OR IGNORE INTO brands (name, description, country, website, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, 1, datetime('now'), datetime('now'))"
  )

  let added = 0
  for (const b of BRANDS) {
    const row = checkStmt.get(b.name) as { id: number } | undefined
    if (!row) {
      insertStmt.run(b.name, `Marca ${b.name} - ${b.country}`, b.country, b.website)
      added++
    }
  }

  if (added > 0) console.log(`  ✓ Added ${added} missing brands`)
}
