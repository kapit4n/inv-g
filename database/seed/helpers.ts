import type Database from "better-sqlite3"

export function randomInt(min: number, max: number, seed?: number): number {
  return Math.floor(randomFloat(min, max + 1, seed))
}

export function randomFloat(min: number, max: number, seed?: number): number {
  if (seed !== undefined) {
    let s = seed
    return () => {
      s = (s * 1103515245 + 12345) & 0x7fffffff
      return min + (s / 0x7fffffff) * (max - min)
    }
  }
  return Math.random() * (max - min) + min
}

let _rngSeed = Date.now()
function fastRng(): number {
  _rngSeed = (_rngSeed * 1103515245 + 12345) & 0x7fffffff
  return _rngSeed / 0x7fffffff
}

export function pick<T>(arr: T[]): T {
  return arr[Math.floor(fastRng() * arr.length)]
}

export function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => fastRng() - 0.5)
  return shuffled.slice(0, Math.min(n, arr.length))
}

export function pickWeighted<T>(items: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0)
  let r = fastRng() * total
  for (let i = 0; i < items.length; i++) {
    r -= weights[i]
    if (r <= 0) return items[i]
  }
  return items[items.length - 1]
}

export function randomDate(startDaysAgo: number, endDaysAgo: number): string {
  const now = Date.now()
  const start = now - startDaysAgo * 86400000
  const end = now - endDaysAgo * 86400000
  const ts = new Date(start + fastRng() * (end - start))
  return ts.toISOString().replace("T", " ").substring(0, 19)
}

export function randomTimeToday(): string {
  const now = new Date()
  const h = randomInt(7, 20)
  const m = randomInt(0, 59)
  now.setHours(h, m, randomInt(0, 59))
  return now.toISOString().replace("T", " ").substring(0, 19)
}

export function exists(conn: Database.Database, table: string): boolean {
  const row = conn.prepare(`SELECT COUNT(*) as cnt FROM ${table}`).get() as { cnt: number }
  return row.cnt > 0
}

export function nextId(conn: Database.Database, table: string): number {
  const row = conn.prepare(`SELECT COALESCE(MAX(id), 0) + 1 as n FROM ${table}`).get() as { n: number }
  return row.n
}

export function bolivianPhone(): string {
  const prefixes = ["4", "6", "7", "3"]
  const prefix = pick(prefixes)
  const num = Math.floor(fastRng() * 10000000).toString().padStart(7, "0")
  return `+591 ${prefix}${num}`
}

export function bolivianCity(): string {
  return pick(["Cochabamba", "Santa Cruz", "La Paz", "Sucre", "Oruro", "Tarija", "Potosí", "Beni", "Pando"])
}

export function bolivianAddress(city: string): string {
  const streets: Record<string, string[]> = {
    "Cochabamba": ["Av. Heroínas", "Calle San Martín", "Av. Ayacucho", "Av. Ballivián", "Calle Sucre", "Av. América", "Calle Antezana", "Av. Oquendo"],
    "Santa Cruz": ["Av. San Martín", "Av. Cristo Redentor", "Calle La Paz", "Av. Beni", "Av. Irala", "Calle Sucre", "Av. Cañoto", "Av. Monseñor Rivero"],
    "La Paz": ["Av. 16 de Julio", "Calle Socabaya", "Av. Camacho", "Av. Arce", "Calle Potosí", "Av. Montes", "Calle Colón", "Av. Mariscal Santa Cruz"],
    "Sucre": ["Av. Hernando Siles", "Calle España", "Av. Las Américas", "Calle San Alberto", "Av. Del Maestro", "Calle Bolívar"],
    "Oruro": ["Av. 6 de Octubre", "Calle Bolívar", "Av. España", "Calle Adolfo Mier", "Av. 1ro de Mayo"],
    "Tarija": ["Av. 15 de Abril", "Calle Ingavi", "Av. Las Américas", "Calle Sucre", "Av. Domingo Paz"],
    "Potosí": ["Av. Cerro Rico", "Calle Bolívar", "Av. Villazón", "Calle Lanza"],
    "Beni": ["Av. 6 de Agosto", "Calle Santa Cruz", "Av. Circunvalación"],
    "Pando": ["Av. 9 de Febrero", "Calle Cobija", "Av. Internacional"],
  }
  const street = pick(streets[city] || streets["Cochabamba"])
  return `${street} #${randomInt(100, 5000)}`
}

export function formatCurrency(amount: number): string {
  return `Bs ${amount.toFixed(2)}`
}

export function generateSKU(category: string, brand: string, index: number): string {
  const cat = category.substring(0, 3).toUpperCase()
  const brd = brand.substring(0, 3).toUpperCase()
  return `${cat}-${brd}-${index.toString().padStart(3, "0")}`
}

export function generateBarcode(): string {
  const prefix = "770" // Bolivia prefix
  const code = Math.floor(fastRng() * 100000000000).toString().padStart(10, "0")
  return `${prefix}${code}`
}
