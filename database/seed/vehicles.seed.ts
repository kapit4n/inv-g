import type Database from "better-sqlite3"
import { pick, randomInt, randomDate } from "./helpers"

interface VehicleModelDef { brand: string; name: string }
interface EngineDef { name: string; displacement: string; power: number; fuelType: string }
interface GenerationDef { modelName: string; brandName: string; name: string; yearStart: number; yearEnd: number }

const VEHICLE_BRANDS = [
  "Toyota", "Nissan", "Honda", "Suzuki", "Mazda", "Chevrolet", "Ford", "Hyundai", "Kia", "Mitsubishi",
  "Volkswagen", "Renault", "Peugeot", "Citroën", "Fiat", "Jeep", "Subaru", "BMW", "Mercedes-Benz", "Audi",
]

const VEHICLE_MODELS: VehicleModelDef[] = [
  { brand: "Toyota", name: "Corolla" },
  { brand: "Toyota", name: "Hilux" },
  { brand: "Toyota", name: "Fortuner" },
  { brand: "Toyota", name: "Yaris" },
  { brand: "Toyota", name: "RAV4" },
  { brand: "Toyota", name: "Land Cruiser" },
  { brand: "Toyota", name: "Prado" },
  { brand: "Nissan", name: "Frontier" },
  { brand: "Nissan", name: "Sentra" },
  { brand: "Nissan", name: "Versa" },
  { brand: "Nissan", name: "X-Trail" },
  { brand: "Nissan", name: "Navara" },
  { brand: "Honda", name: "Civic" },
  { brand: "Honda", name: "CR-V" },
  { brand: "Honda", name: "Fit" },
  { brand: "Honda", name: "HR-V" },
  { brand: "Suzuki", name: "Vitara" },
  { brand: "Suzuki", name: "Jimny" },
  { brand: "Suzuki", name: "Swift" },
  { brand: "Suzuki", name: "Celerio" },
  { brand: "Mazda", name: "BT-50" },
  { brand: "Mazda", name: "CX-5" },
  { brand: "Mazda", name: "Mazda3" },
  { brand: "Chevrolet", name: "D-Max" },
  { brand: "Chevrolet", name: "Cruze" },
  { brand: "Chevrolet", name: "Sail" },
  { brand: "Chevrolet", name: "Tracker" },
  { brand: "Ford", name: "Ranger" },
  { brand: "Ford", name: "EcoSport" },
  { brand: "Ford", name: "Territory" },
  { brand: "Hyundai", name: "Tucson" },
  { brand: "Hyundai", name: "Santa Fe" },
  { brand: "Hyundai", name: "Accent" },
  { brand: "Kia", name: "Sportage" },
  { brand: "Kia", name: "Sorento" },
  { brand: "Kia", name: "Picanto" },
  { brand: "Mitsubishi", name: "L200" },
  { brand: "Mitsubishi", name: "Montero Sport" },
  { brand: "Mitsubishi", name: "Outlander" },
  { brand: "Volkswagen", name: "Amarok" },
  { brand: "Volkswagen", name: "T-Cross" },
  { brand: "Volkswagen", name: "Nivus" },
  { brand: "Renault", name: "Duster" },
  { brand: "Renault", name: "Koleos" },
  { brand: "Renault", name: "Logan" },
  { brand: "Peugeot", name: "3008" },
  { brand: "Peugeot", name: "Partner" },
  { brand: "Fiat", name: "Strada" },
  { brand: "Fiat", name: "Pulse" },
  { brand: "Jeep", name: "Compass" },
  { brand: "Jeep", name: "Renegade" },
  { brand: "Subaru", name: "Forester" },
  { brand: "Subaru", name: "Outback" },
]

const ENGINES: EngineDef[] = [
  { name: "1.8L 2ZR-FE", displacement: "1.8L", power: 132, fuelType: "Gasoline" },
  { name: "1.8L 1ZZ-FE", displacement: "1.8L", power: 125, fuelType: "Gasoline" },
  { name: "2.8L 1GD-FTV", displacement: "2.8L", power: 174, fuelType: "Diesel" },
  { name: "3.0L 5L", displacement: "3.0L", power: 95, fuelType: "Diesel" },
  { name: "2.7L 2TR-FE", displacement: "2.7L", power: 159, fuelType: "Gasoline" },
  { name: "1.5L 1NZ-FE", displacement: "1.5L", power: 106, fuelType: "Gasoline" },
  { name: "2.5L YD25", displacement: "2.5L", power: 160, fuelType: "Diesel" },
  { name: "1.8L MR18DE", displacement: "1.8L", power: 128, fuelType: "Gasoline" },
  { name: "2.0L MR20DE", displacement: "2.0L", power: 140, fuelType: "Gasoline" },
  { name: "1.6L HR16DE", displacement: "1.6L", power: 109, fuelType: "Gasoline" },
  { name: "1.8L R18A", displacement: "1.8L", power: 140, fuelType: "Gasoline" },
  { name: "2.4L K24Z", displacement: "2.4L", power: 166, fuelType: "Gasoline" },
  { name: "2.0L J20A", displacement: "2.0L", power: 140, fuelType: "Gasoline" },
  { name: "1.3L M13A", displacement: "1.3L", power: 82, fuelType: "Gasoline" },
  { name: "1.2L K12M", displacement: "1.2L", power: 67, fuelType: "Gasoline" },
  { name: "2.5L 4JK1-TC", displacement: "2.5L", power: 136, fuelType: "Diesel" },
  { name: "2.0L Ecoboost", displacement: "2.0L", power: 250, fuelType: "Gasoline" },
  { name: "2.2L Duratorq", displacement: "2.2L", power: 147, fuelType: "Diesel" },
  { name: "1.6L Gamma", displacement: "1.6L", power: 128, fuelType: "Gasoline" },
  { name: "2.4L Theta", displacement: "2.4L", power: 176, fuelType: "Gasoline" },
  { name: "2.0L CRDI", displacement: "2.0L", power: 185, fuelType: "Diesel" },
  { name: "1.4L TSI", displacement: "1.4L", power: 150, fuelType: "Gasoline" },
  { name: "2.0L Bi-Turbo", displacement: "2.0L", power: 180, fuelType: "Diesel" },
  { name: "1.6L 16V", displacement: "1.6L", power: 115, fuelType: "Gasoline" },
  { name: "2.5L NA", displacement: "2.5L", power: 140, fuelType: "Gasoline" },
  { name: "1.5L TSI", displacement: "1.5L", power: 130, fuelType: "Gasoline" },
]

const GENERATIONS: GenerationDef[] = [
  { brandName: "Toyota", modelName: "Corolla", name: "E210 (2018-)", yearStart: 2018, yearEnd: 2025 },
  { brandName: "Toyota", modelName: "Corolla", name: "E180 (2013-2018)", yearStart: 2013, yearEnd: 2018 },
  { brandName: "Toyota", modelName: "Corolla", name: "E150 (2006-2013)", yearStart: 2006, yearEnd: 2013 },
  { brandName: "Toyota", modelName: "Hilux", name: "AN130 (2015-)", yearStart: 2015, yearEnd: 2025 },
  { brandName: "Toyota", modelName: "Hilux", name: "AN120 (2005-2015)", yearStart: 2005, yearEnd: 2015 },
  { brandName: "Toyota", modelName: "Fortuner", name: "SW4 (2015-)", yearStart: 2015, yearEnd: 2025 },
  { brandName: "Toyota", modelName: "Fortuner", name: "SW4 (2005-2015)", yearStart: 2005, yearEnd: 2015 },
  { brandName: "Toyota", modelName: "Yaris", name: "XP150 (2012-)", yearStart: 2012, yearEnd: 2025 },
  { brandName: "Toyota", modelName: "RAV4", name: "XA50 (2018-)", yearStart: 2018, yearEnd: 2025 },
  { brandName: "Nissan", modelName: "Frontier", name: "D23 (2014-)", yearStart: 2014, yearEnd: 2025 },
  { brandName: "Nissan", modelName: "Frontier", name: "D40 (2004-2014)", yearStart: 2004, yearEnd: 2014 },
  { brandName: "Nissan", modelName: "Sentra", name: "B18 (2019-)", yearStart: 2019, yearEnd: 2025 },
  { brandName: "Nissan", modelName: "Sentra", name: "B17 (2012-2019)", yearStart: 2012, yearEnd: 2019 },
  { brandName: "Nissan", modelName: "Versa", name: "V17 (2019-)", yearStart: 2019, yearEnd: 2025 },
  { brandName: "Nissan", modelName: "Versa", name: "V14 (2013-2019)", yearStart: 2013, yearEnd: 2019 },
  { brandName: "Nissan", modelName: "X-Trail", name: "T32 (2013-)", yearStart: 2013, yearEnd: 2025 },
  { brandName: "Honda", modelName: "Civic", name: "FC (2015-)", yearStart: 2015, yearEnd: 2025 },
  { brandName: "Honda", modelName: "Civic", name: "FB (2011-2015)", yearStart: 2011, yearEnd: 2015 },
  { brandName: "Honda", modelName: "CR-V", name: "RM (2015-)", yearStart: 2015, yearEnd: 2025 },
  { brandName: "Honda", modelName: "CR-V", name: "SR (2012-2015)", yearStart: 2012, yearEnd: 2015 },
  { brandName: "Honda", modelName: "Fit", name: "GK (2013-)", yearStart: 2013, yearEnd: 2025 },
  { brandName: "Suzuki", modelName: "Vitara", name: "LY (2015-)", yearStart: 2015, yearEnd: 2025 },
  { brandName: "Suzuki", modelName: "Vitara", name: "LY (2010-2015)", yearStart: 2010, yearEnd: 2015 },
  { brandName: "Suzuki", modelName: "Jimny", name: "JB74 (2018-)", yearStart: 2018, yearEnd: 2025 },
  { brandName: "Suzuki", modelName: "Swift", name: "FZ (2017-)", yearStart: 2017, yearEnd: 2025 },
  { brandName: "Chevrolet", modelName: "D-Max", name: "TFR (2012-)", yearStart: 2012, yearEnd: 2025 },
  { brandName: "Ford", modelName: "Ranger", name: "T6 (2011-)", yearStart: 2011, yearEnd: 2025 },
  { brandName: "Mazda", modelName: "BT-50", name: "UP (2011-)", yearStart: 2011, yearEnd: 2025 },
  { brandName: "Mitsubishi", modelName: "L200", name: "Triton (2015-)", yearStart: 2015, yearEnd: 2025 },
  { brandName: "Hyundai", modelName: "Tucson", name: "TL (2015-)", yearStart: 2015, yearEnd: 2025 },
]

const TRANSMISSIONS = ["5MT", "6MT", "4AT", "5AT", "6AT", "8AT", "CVT", "DSG", "AMT"]
const FUELS = ["Gasoline", "Diesel", "Gasoline", "Gasoline", "Diesel", "Hybrid", "Flex"]

const COLORS = [
  "Blanco", "Negro", "Plata", "Gris", "Rojo", "Azul", "Verde", "Beige",
  "Marrón", "Naranja", "Blanco Perlado", "Gris Oscuro", "Azul Marino", "Rojo Vino",
]

export function seed(db: Database.Database): void {
  const vehicleBrandCount = db.prepare("SELECT COUNT(*) as cnt FROM vehicle_brands").get() as { cnt: number }

  if (vehicleBrandCount.cnt === 0) {
    const insertBrand = db.prepare("INSERT INTO vehicle_brands (name, description, country, is_active, created_at, updated_at) VALUES (?, ?, ?, 1, datetime('now'), datetime('now'))")
    const insertModel = db.prepare("INSERT INTO vehicle_models (brand_id, name, is_active, created_at, updated_at) VALUES (?, ?, 1, datetime('now'), datetime('now'))")
    const insertGeneration = db.prepare("INSERT INTO vehicle_generations (model_id, name, year_start, year_end, created_at) VALUES (?, ?, ?, ?, datetime('now'))")
    const insertEngine = db.prepare("INSERT INTO vehicle_engines (name, displacement, power, fuel_type, created_at) VALUES (?, ?, ?, ?, datetime('now'))")
    const insertTransmission = db.prepare("INSERT INTO vehicle_transmissions (name, type, gears, created_at) VALUES (?, ?, ?, datetime('now'))")
    const insertFuel = db.prepare("INSERT INTO vehicle_fuels (name, created_at) VALUES (?, datetime('now'))")

    const insertAll = db.transaction(() => {
      // Brands
      const brandIds: Record<string, number> = {}
      for (const brand of VEHICLE_BRANDS) {
        const info = { country: "Japón", description: `${brand} vehículos` }
        if (["Chevrolet", "Ford", "Jeep"].includes(brand)) info.country = "EEUU"
        else if (["BMW", "Mercedes-Benz", "Volkswagen", "Audi"].includes(brand)) info.country = "Alemania"
        else if (["Renault", "Peugeot", "Citroën"].includes(brand)) info.country = "Francia"
        else if (["Fiat"].includes(brand)) info.country = "Italia"
        else if (["Hyundai", "Kia"].includes(brand)) info.country = "Corea"
        else if (["Mitsubishi", "Subaru"].includes(brand)) info.country = "Japón"
        insertBrand.run(brand, info.description, info.country)
        brandIds[brand] = db.prepare("SELECT id FROM vehicle_brands WHERE name = ?").get(brand) as { id: number }
      }

      // Models
      const modelIds: Record<string, number> = {}
      for (const model of VEHICLE_MODELS) {
        const brandId = db.prepare("SELECT id FROM vehicle_brands WHERE name = ?").get(model.brand) as { id: number }
        insertModel.run(brandId.id, model.name)
        const row = db.prepare("SELECT id FROM vehicle_models WHERE brand_id = ? AND name = ?").get(brandId.id, model.name) as { id: number }
        modelIds[`${model.brand}:${model.name}`] = row.id
      }

      // Generations
      for (const gen of GENERATIONS) {
        const model = db.prepare("SELECT vm.id FROM vehicle_models vm JOIN vehicle_brands vb ON vb.id = vm.brand_id WHERE vb.name = ? AND vm.name = ?").get(gen.brandName, gen.modelName) as { id: number }
        if (model) insertGeneration.run(model.id, gen.name, gen.yearStart, gen.yearEnd)
      }

      // Engines
      for (const eng of ENGINES) {
        const row = db.prepare("SELECT id FROM vehicle_engines WHERE name = ?").get(eng.name) as { id: number } | undefined
        if (!row) insertEngine.run(eng.name, eng.displacement, eng.power, eng.fuelType)
      }

      // Transmissions
      for (const t of TRANSMISSIONS) {
        const row = db.prepare("SELECT id FROM vehicle_transmissions WHERE name = ?").get(t) as { id: number } | undefined
        if (!row) {
          const type = t.includes("MT") ? "Manual" : t.includes("CVT") ? "CVT" : "Automatic"
          const gears = parseInt(t.replace(/\D/g, ""), 10) || 0
          insertTransmission.run(t, type, gears)
        }
      }

      // Fuels
      const seen = new Set<string>()
      for (const f of FUELS) {
        if (seen.has(f)) continue
        seen.add(f)
        const row = db.prepare("SELECT id FROM vehicle_fuels WHERE name = ?").get(f) as { id: number } | undefined
        if (!row) insertFuel.run(f)
      }
    })
    insertAll()
    console.log("  ✓ Seeded vehicle reference data (brands, models, generations, engines, transmissions, fuels)")
  }

  // Seed customer vehicles
  const cvCount = db.prepare("SELECT COUNT(*) as cnt FROM customer_vehicles").get() as { cnt: number }
  if (cvCount.cnt >= 300) return

  const customers = db.prepare("SELECT id FROM customers").all() as { id: number }[]
  const allBrands = db.prepare("SELECT id, name FROM vehicle_brands").all() as { id: number; name: string }[]
  const allModels = db.prepare("SELECT vm.id, vm.name, vb.name as brand_name FROM vehicle_models vm JOIN vehicle_brands vb ON vb.id = vm.brand_id").all() as { id: number; name: string; brand_name: string }[]
  const allEngines = db.prepare("SELECT id, name FROM vehicle_engines").all() as { id: number; name: string }[]
  const allTransmissions = db.prepare("SELECT id, name FROM vehicle_transmissions").all() as { id: number; name: string }[]
  const allFuels = db.prepare("SELECT id, name FROM vehicle_fuels").all() as { id: number; name: string }[]

  if (customers.length === 0 || allBrands.length === 0) return

  const insertCV = db.prepare(
    `INSERT INTO customer_vehicles (customer_id, brand_id, model_id, year, engine_id, transmission_id, fuel_id, color, mileage, vin, license_plate, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', datetime('now'), datetime('now'))`
  )

  const checkVin = db.prepare("SELECT id FROM customer_vehicles WHERE vin = ?")

  const insertAll = db.transaction(() => {
    let added = 0
    for (let i = 0; i < 300; i++) {
      const customer = pick(customers)
      const model = pick(allModels)
      const brand = allBrands.find((b) => b.name === model.brand_name) || pick(allBrands)
      const engine = pick(allEngines)
      const transmission = pick(allTransmissions)
      const fuel = pick(allFuels)
      const year = randomInt(2005, 2025)
      const color = pick(COLORS)
      const mileage = randomInt(10000, 200000)
      // Generate a realistic VIN
      const vin = `8AP${pick(["A", "B", "C", "D", "E", "F", "G", "H", "J", "K"])}${randomInt(100000, 999999)}${randomInt(100000, 999999)}`
      const licensePlate = `${pick(["CBA", "SCZ", "LPZ", "SUC", "ORU", "TJA", "PTI"])}${randomInt(1000, 9999)}`

      const existing = checkVin.get(vin) as { id: number } | undefined
      if (existing) continue

      insertCV.run(customer.id, brand.id, model.id, year, engine.id, transmission.id, fuel.id, color, mileage, vin, licensePlate)
      added++
    }
    if (added > 0) console.log(`  ✓ Added ${added} customer vehicles`)
  })

  insertAll()
}