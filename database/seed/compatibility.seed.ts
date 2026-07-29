import type Database from "better-sqlite3"
import { exists, pick } from "./helpers"

interface CompatDef {
  productName: string
  vehicleBrand: string
  vehicleModel: string
  yearStart: number
  yearEnd: number
  engine: string
}

const COMPAT: CompatDef[] = [
  { productName: "Filtro de Aceite Toyota Corolla", vehicleBrand: "Toyota", vehicleModel: "Corolla", yearStart: 2008, yearEnd: 2025, engine: "1.8L 2ZR-FE" },
  { productName: "Filtro de Aceite Toyota Corolla", vehicleBrand: "Toyota", vehicleModel: "Corolla", yearStart: 2000, yearEnd: 2007, engine: "1.8L 1ZZ-FE" },
  { productName: "Filtro de Aceite Nissan Sentra", vehicleBrand: "Nissan", vehicleModel: "Sentra", yearStart: 2013, yearEnd: 2025, engine: "1.8L MR18DE" },
  { productName: "Filtro de Aceite Nissan Sentra", vehicleBrand: "Nissan", vehicleModel: "Sentra", yearStart: 2007, yearEnd: 2012, engine: "2.0L MR20DE" },
  { productName: "Filtro de Aire Toyota Hilux", vehicleBrand: "Toyota", vehicleModel: "Hilux", yearStart: 2015, yearEnd: 2025, engine: "2.8L 1GD-FTV" },
  { productName: "Filtro de Aire Toyota Hilux", vehicleBrand: "Toyota", vehicleModel: "Hilux", yearStart: 2005, yearEnd: 2014, engine: "3.0L 5L" },
  { productName: "Filtro de Aire Toyota Hilux", vehicleBrand: "Toyota", vehicleModel: "Fortuner", yearStart: 2015, yearEnd: 2025, engine: "2.8L 1GD-FTV" },
  { productName: "Pastillas de Freno Delanteras Corolla", vehicleBrand: "Toyota", vehicleModel: "Corolla", yearStart: 2014, yearEnd: 2025, engine: "1.8L 2ZR-FE" },
  { productName: "Pastillas de Freno Delanteras Corolla", vehicleBrand: "Toyota", vehicleModel: "Corolla", yearStart: 2009, yearEnd: 2013, engine: "1.8L 1ZZ-FE" },
  { productName: "Pastillas de Freno Delanteras Corolla", vehicleBrand: "Toyota", vehicleModel: "Yaris", yearStart: 2012, yearEnd: 2025, engine: "1.5L 1NZ-FE" },
  { productName: "Amortiguador Delantero KYB Corolla", vehicleBrand: "Toyota", vehicleModel: "Corolla", yearStart: 2014, yearEnd: 2025, engine: "1.8L 2ZR-FE" },
  { productName: "Amortiguador Delantero KYB Corolla", vehicleBrand: "Toyota", vehicleModel: "Corolla", yearStart: 2009, yearEnd: 2013, engine: "1.8L 1ZZ-FE" },
  { productName: "Radiador Toyota Hilux", vehicleBrand: "Toyota", vehicleModel: "Hilux", yearStart: 2015, yearEnd: 2025, engine: "2.8L 1GD-FTV" },
  { productName: "Radiador Toyota Hilux", vehicleBrand: "Toyota", vehicleModel: "Fortuner", yearStart: 2015, yearEnd: 2025, engine: "2.8L 1GD-FTV" },
  { productName: "Bomba de Agua Toyota", vehicleBrand: "Toyota", vehicleModel: "Corolla", yearStart: 2008, yearEnd: 2025, engine: "1.8L 2ZR-FE" },
  { productName: "Alternador Toyota Hilux", vehicleBrand: "Toyota", vehicleModel: "Hilux", yearStart: 2015, yearEnd: 2025, engine: "2.8L 1GD-FTV" },
  { productName: "Alternador Toyota Hilux", vehicleBrand: "Toyota", vehicleModel: "Fortuner", yearStart: 2015, yearEnd: 2025, engine: "2.8L 1GD-FTV" },
  { productName: "Batería Bosch 65Ah", vehicleBrand: "Toyota", vehicleModel: "Corolla", yearStart: 2008, yearEnd: 2025, engine: "1.8L 2ZR-FE" },
  { productName: "Batería Bosch 65Ah", vehicleBrand: "Toyota", vehicleModel: "Hilux", yearStart: 2010, yearEnd: 2025, engine: "2.8L 1GD-FTV" },
  { productName: "Batería Bosch 65Ah", vehicleBrand: "Nissan", vehicleModel: "Frontier", yearStart: 2010, yearEnd: 2025, engine: "2.5L YD25" },
  { productName: "Batería Bosch 45Ah", vehicleBrand: "Toyota", vehicleModel: "Yaris", yearStart: 2012, yearEnd: 2025, engine: "1.5L 1NZ-FE" },
  { productName: "Batería Bosch 45Ah", vehicleBrand: "Suzuki", vehicleModel: "Vitara", yearStart: 2010, yearEnd: 2025, engine: "2.0L J20A" },
  { productName: "Batería Bosch 45Ah", vehicleBrand: "Nissan", vehicleModel: "Versa", yearStart: 2013, yearEnd: 2025, engine: "1.6L HR16DE" },
  { productName: "Bujía NGK BKR6E", vehicleBrand: "Toyota", vehicleModel: "Corolla", yearStart: 2008, yearEnd: 2025, engine: "1.8L 2ZR-FE" },
  { productName: "Bujía NGK BKR6E", vehicleBrand: "Toyota", vehicleModel: "Hilux", yearStart: 2005, yearEnd: 2015, engine: "2.7L 2TR-FE" },
  { productName: "Bujía NGK BKR6E", vehicleBrand: "Nissan", vehicleModel: "Sentra", yearStart: 2013, yearEnd: 2025, engine: "1.8L MR18DE" },
  { productName: "Correa de Distribución Gates", vehicleBrand: "Toyota", vehicleModel: "Corolla", yearStart: 2000, yearEnd: 2007, engine: "1.8L 1ZZ-FE" },
  { productName: "Correa de Distribución Dayco", vehicleBrand: "Honda", vehicleModel: "Civic", yearStart: 2012, yearEnd: 2025, engine: "1.8L R18A" },
  { productName: "Pastillas de Freno Honda Civic", vehicleBrand: "Honda", vehicleModel: "Civic", yearStart: 2012, yearEnd: 2025, engine: "1.8L R18A" },
  { productName: "Alternador Nissan Frontier", vehicleBrand: "Nissan", vehicleModel: "Frontier", yearStart: 2010, yearEnd: 2025, engine: "2.5L YD25" },
  { productName: "Disco de Freno Hilux", vehicleBrand: "Toyota", vehicleModel: "Hilux", yearStart: 2015, yearEnd: 2025, engine: "2.8L 1GD-FTV" },
  { productName: "Disco de Freno Hilux", vehicleBrand: "Toyota", vehicleModel: "Fortuner", yearStart: 2015, yearEnd: 2025, engine: "2.8L 1GD-FTV" },
  { productName: "Kit de Embrague Toyota Corolla", vehicleBrand: "Toyota", vehicleModel: "Corolla", yearStart: 2008, yearEnd: 2025, engine: "1.8L 2ZR-FE" },
  { productName: "Kit de Embrague Hilux", vehicleBrand: "Toyota", vehicleModel: "Hilux", yearStart: 2015, yearEnd: 2025, engine: "2.8L 1GD-FTV" },
  { productName: "Kit de Embrague Hilux", vehicleBrand: "Toyota", vehicleModel: "Fortuner", yearStart: 2015, yearEnd: 2025, engine: "2.8L 1GD-FTV" },
  { productName: "Motor de Arranque Toyota", vehicleBrand: "Toyota", vehicleModel: "Corolla", yearStart: 2008, yearEnd: 2025, engine: "1.8L 2ZR-FE" },
  { productName: "Motor de Arranque Toyota", vehicleBrand: "Toyota", vehicleModel: "Hilux", yearStart: 2010, yearEnd: 2025, engine: "2.8L 1GD-FTV" },
  { productName: "Motor de Arranque Nissan", vehicleBrand: "Nissan", vehicleModel: "Sentra", yearStart: 2013, yearEnd: 2025, engine: "1.8L MR18DE" },
  { productName: "Motor de Arranque Nissan", vehicleBrand: "Nissan", vehicleModel: "Versa", yearStart: 2013, yearEnd: 2025, engine: "1.6L HR16DE" },
  { productName: "Bomba de Dirección Hilux", vehicleBrand: "Toyota", vehicleModel: "Hilux", yearStart: 2015, yearEnd: 2025, engine: "2.8L 1GD-FTV" },
  { productName: "Rótula Suspensión Toyota", vehicleBrand: "Toyota", vehicleModel: "Corolla", yearStart: 2009, yearEnd: 2025, engine: "1.8L 2ZR-FE" },
  { productName: "Rótula Superior Hilux", vehicleBrand: "Toyota", vehicleModel: "Hilux", yearStart: 2005, yearEnd: 2025, engine: "2.8L 1GD-FTV" },
  { productName: "Rótula Superior Hilux", vehicleBrand: "Toyota", vehicleModel: "Fortuner", yearStart: 2010, yearEnd: 2025, engine: "2.8L 1GD-FTV" },
  { productName: "Amortiguador Trasero Hilux", vehicleBrand: "Toyota", vehicleModel: "Hilux", yearStart: 2015, yearEnd: 2025, engine: "2.8L 1GD-FTV" },
  { productName: "Kit de Distribución Completo", vehicleBrand: "Toyota", vehicleModel: "Corolla", yearStart: 2008, yearEnd: 2025, engine: "1.8L 2ZR-FE" },
  { productName: "Sensor MAP Bosch", vehicleBrand: "Toyota", vehicleModel: "Corolla", yearStart: 2008, yearEnd: 2025, engine: "1.8L 2ZR-FE" },
  { productName: "Sensor MAP Bosch", vehicleBrand: "Nissan", vehicleModel: "Sentra", yearStart: 2013, yearEnd: 2025, engine: "1.8L MR18DE" },
  { productName: "Sensor de Oxígeno Bosch", vehicleBrand: "Toyota", vehicleModel: "Corolla", yearStart: 2008, yearEnd: 2025, engine: "1.8L 2ZR-FE" },
  { productName: "Sensor de Oxígeno Denso", vehicleBrand: "Toyota", vehicleModel: "Hilux", yearStart: 2015, yearEnd: 2025, engine: "2.8L 1GD-FTV" },
  { productName: "Neumático 205/55R16", vehicleBrand: "Toyota", vehicleModel: "Corolla", yearStart: 2014, yearEnd: 2025, engine: "1.8L 2ZR-FE" },
  { productName: "Neumático 205/55R16", vehicleBrand: "Honda", vehicleModel: "Civic", yearStart: 2012, yearEnd: 2025, engine: "1.8L R18A" },
  { productName: "Neumático 225/65R17", vehicleBrand: "Toyota", vehicleModel: "Fortuner", yearStart: 2015, yearEnd: 2025, engine: "2.8L 1GD-FTV" },
  { productName: "Neumático 225/65R17", vehicleBrand: "Honda", vehicleModel: "CR-V", yearStart: 2012, yearEnd: 2025, engine: "2.4L K24Z" },
  { productName: "Neumático 265/65R17", vehicleBrand: "Toyota", vehicleModel: "Hilux", yearStart: 2015, yearEnd: 2025, engine: "2.8L 1GD-FTV" },
  { productName: "Neumático 265/65R17", vehicleBrand: "Nissan", vehicleModel: "Frontier", yearStart: 2010, yearEnd: 2025, engine: "2.5L YD25" },
  { productName: "Neumático 175/65R14", vehicleBrand: "Toyota", vehicleModel: "Yaris", yearStart: 2012, yearEnd: 2025, engine: "1.5L 1NZ-FE" },
  { productName: "Neumático 175/65R14", vehicleBrand: "Suzuki", vehicleModel: "Vitara", yearStart: 2010, yearEnd: 2025, engine: "2.0L J20A" },
  { productName: "Amortiguador Trasero KYB", vehicleBrand: "Nissan", vehicleModel: "Sentra", yearStart: 2013, yearEnd: 2025, engine: "1.8L MR18DE" },
  { productName: "Compresor de Aire Acondicionado", vehicleBrand: "Toyota", vehicleModel: "Corolla", yearStart: 2014, yearEnd: 2025, engine: "1.8L 2ZR-FE" },
  { productName: "Faros Delanteros Corolla", vehicleBrand: "Toyota", vehicleModel: "Corolla", yearStart: 2014, yearEnd: 2020, engine: "1.8L 2ZR-FE" },
  { productName: "Faros LED Hilux", vehicleBrand: "Toyota", vehicleModel: "Hilux", yearStart: 2018, yearEnd: 2025, engine: "2.8L 1GD-FTV" },
  { productName: "Disco de Freno Civic", vehicleBrand: "Honda", vehicleModel: "Civic", yearStart: 2012, yearEnd: 2025, engine: "1.8L R18A" },
  { productName: "Pastillas de Freno Nissan Frontier", vehicleBrand: "Nissan", vehicleModel: "Frontier", yearStart: 2010, yearEnd: 2025, engine: "2.5L YD25" },
  { productName: "Amortiguador Delantero Nissan Frontier", vehicleBrand: "Nissan", vehicleModel: "Frontier", yearStart: 2010, yearEnd: 2025, engine: "2.5L YD25" },
  { productName: "Filtro de Aceite Suzuki Vitara", vehicleBrand: "Suzuki", vehicleModel: "Vitara", yearStart: 2010, yearEnd: 2025, engine: "2.0L J20A" },
  { productName: "Filtro de Aire Honda CR-V", vehicleBrand: "Honda", vehicleModel: "CR-V", yearStart: 2012, yearEnd: 2025, engine: "2.4L K24Z" },
  { productName: "Tambor de Freno D-Max", vehicleBrand: "Chevrolet", vehicleModel: "D-Max", yearStart: 2012, yearEnd: 2025, engine: "2.5L 4JK1-TC" },
  { productName: "Tambor de Freno Suzuki", vehicleBrand: "Suzuki", vehicleModel: "Jimny", yearStart: 2010, yearEnd: 2025, engine: "1.3L M13A" },
  { productName: "Radiador Nissan Frontier", vehicleBrand: "Nissan", vehicleModel: "Frontier", yearStart: 2010, yearEnd: 2025, engine: "2.5L YD25" },
  { productName: "Bomba de Agua Hilux", vehicleBrand: "Toyota", vehicleModel: "Hilux", yearStart: 2015, yearEnd: 2025, engine: "2.8L 1GD-FTV" },
  { productName: "Terminal de Dirección Corolla", vehicleBrand: "Toyota", vehicleModel: "Corolla", yearStart: 2009, yearEnd: 2025, engine: "1.8L 2ZR-FE" },
  { productName: "Terminal de Dirección Hilux", vehicleBrand: "Toyota", vehicleModel: "Hilux", yearStart: 2005, yearEnd: 2025, engine: "2.8L 1GD-FTV" },
  { productName: "Bobina de Encendido Hitachi", vehicleBrand: "Honda", vehicleModel: "Civic", yearStart: 2012, yearEnd: 2025, engine: "1.8L R18A" },
  { productName: "Sensor de Velocidad", vehicleBrand: "Toyota", vehicleModel: "Corolla", yearStart: 2008, yearEnd: 2025, engine: "1.8L 2ZR-FE" },
  { productName: "Sensor CKP Bosch", vehicleBrand: "Toyota", vehicleModel: "Corolla", yearStart: 2008, yearEnd: 2025, engine: "1.8L 2ZR-FE" },
  { productName: "Sensor CMP Bosch", vehicleBrand: "Toyota", vehicleModel: "Corolla", yearStart: 2008, yearEnd: 2025, engine: "1.8L 2ZR-FE" },
  { productName: "Inyector de Combustible", vehicleBrand: "Toyota", vehicleModel: "Corolla", yearStart: 2008, yearEnd: 2025, engine: "1.8L 2ZR-FE" },
  { productName: "Bomba de Gasolina Eléctrica", vehicleBrand: "Toyota", vehicleModel: "Corolla", yearStart: 2008, yearEnd: 2025, engine: "1.8L 2ZR-FE" },
  { productName: "Kit de Juntas de Motor", vehicleBrand: "Toyota", vehicleModel: "Corolla", yearStart: 2008, yearEnd: 2025, engine: "1.8L 2ZR-FE" },
  { productName: "Kit de Arrastre Suzuki", vehicleBrand: "Suzuki", vehicleModel: "Vitara", yearStart: 2010, yearEnd: 2025, engine: "2.0L J20A" },
  { productName: "Alternador Toyota Hilux", vehicleBrand: "Toyota", vehicleModel: "Hilux", yearStart: 2005, yearEnd: 2014, engine: "3.0L 5L" },
  { productName: "Amortiguador Trasero Hilux", vehicleBrand: "Toyota", vehicleModel: "Hilux", yearStart: 2005, yearEnd: 2014, engine: "3.0L 5L" },
  { productName: "Sensor MAF Bosch", vehicleBrand: "Toyota", vehicleModel: "Corolla", yearStart: 2014, yearEnd: 2025, engine: "1.8L 2ZR-FE" },
  { productName: "Sensor MAF Bosch", vehicleBrand: "Nissan", vehicleModel: "Sentra", yearStart: 2013, yearEnd: 2025, engine: "1.8L MR18DE" },
  { productName: "Bomba de Dirección Hilux", vehicleBrand: "Toyota", vehicleModel: "Fortuner", yearStart: 2010, yearEnd: 2025, engine: "2.8L 1GD-FTV" },
  { productName: "Pastillas de Freno Traseras Hilux", vehicleBrand: "Toyota", vehicleModel: "Hilux", yearStart: 2015, yearEnd: 2025, engine: "2.8L 1GD-FTV" },
  { productName: "Pastillas de Freno Traseras Hilux", vehicleBrand: "Toyota", vehicleModel: "Fortuner", yearStart: 2015, yearEnd: 2025, engine: "2.8L 1GD-FTV" },
  { productName: "Tensor de Correa SKF", vehicleBrand: "Toyota", vehicleModel: "Corolla", yearStart: 2008, yearEnd: 2025, engine: "1.8L 2ZR-FE" },
  { productName: "Rodamiento de Rueda SKF", vehicleBrand: "Toyota", vehicleModel: "Corolla", yearStart: 2008, yearEnd: 2025, engine: "1.8L 2ZR-FE" },
  { productName: "Rodamiento de Rueda SKF", vehicleBrand: "Nissan", vehicleModel: "Sentra", yearStart: 2013, yearEnd: 2025, engine: "1.8L MR18DE" },
  { productName: "Maza de Rueda Delantera", vehicleBrand: "Toyota", vehicleModel: "Corolla", yearStart: 2014, yearEnd: 2025, engine: "1.8L 2ZR-FE" },
  { productName: "Filtro de Cabina Toyota", vehicleBrand: "Toyota", vehicleModel: "Yaris", yearStart: 2012, yearEnd: 2025, engine: "1.5L 1NZ-FE" },
  { productName: "Filtro de Cabina Toyota", vehicleBrand: "Toyota", vehicleModel: "Corolla", yearStart: 2014, yearEnd: 2025, engine: "1.8L 2ZR-FE" },
  { productName: "Filtro de Aceite 1ZZ-FE", vehicleBrand: "Toyota", vehicleModel: "Corolla", yearStart: 2000, yearEnd: 2007, engine: "1.8L 1ZZ-FE" },
  { productName: "Filtro de Aceite 1ZZ-FE", vehicleBrand: "Toyota", vehicleModel: "Corolla", yearStart: 2008, yearEnd: 2025, engine: "1.8L 2ZR-FE" },
  { productName: "Filtro de Aire Genérico", vehicleBrand: "Toyota", vehicleModel: "Corolla", yearStart: 2008, yearEnd: 2025, engine: "1.8L 2ZR-FE" },
  { productName: "Filtro de Aire Genérico", vehicleBrand: "Nissan", vehicleModel: "Sentra", yearStart: 2013, yearEnd: 2025, engine: "1.8L MR18DE" },
  { productName: "Filtro de Aire Genérico", vehicleBrand: "Suzuki", vehicleModel: "Vitara", yearStart: 2010, yearEnd: 2025, engine: "2.0L J20A" },
  { productName: "Filtro de Combustible Hilux", vehicleBrand: "Toyota", vehicleModel: "Hilux", yearStart: 2015, yearEnd: 2025, engine: "2.8L 1GD-FTV" },
  { productName: "Filtro de Combustible Hilux", vehicleBrand: "Toyota", vehicleModel: "Fortuner", yearStart: 2015, yearEnd: 2025, engine: "2.8L 1GD-FTV" },
  { productName: "Amortiguador Trasero KYB Nissan", vehicleBrand: "Nissan", vehicleModel: "Sentra", yearStart: 2013, yearEnd: 2025, engine: "1.8L MR18DE" },
  { productName: "Bomba de Agua Nissan", vehicleBrand: "Nissan", vehicleModel: "Sentra", yearStart: 2013, yearEnd: 2025, engine: "1.8L MR18DE" },
  { productName: "Bomba de Agua Nissan", vehicleBrand: "Nissan", vehicleModel: "Versa", yearStart: 2013, yearEnd: 2025, engine: "1.6L HR16DE" },
  { productName: "Kit de Embrague Suzuki", vehicleBrand: "Suzuki", vehicleModel: "Vitara", yearStart: 2010, yearEnd: 2025, engine: "2.0L J20A" },
  { productName: "Alternador Suzuki", vehicleBrand: "Suzuki", vehicleModel: "Swift", yearStart: 2017, yearEnd: 2025, engine: "1.2L K12M" },
  { productName: "Batería Bosch 65Ah", vehicleBrand: "Honda", vehicleModel: "CR-V", yearStart: 2012, yearEnd: 2025, engine: "2.4L K24Z" },
  { productName: "Filtro de Aire Toyota Hilux", vehicleBrand: "Toyota", vehicleModel: "Hilux", yearStart: 2015, yearEnd: 2025, engine: "2.8L 1GD-FTV" },
  { productName: "Bujía NGK BKR6E", vehicleBrand: "Honda", vehicleModel: "Civic", yearStart: 2012, yearEnd: 2025, engine: "1.8L R18A" },
  { productName: "Líquido de Frenos DOT 4", vehicleBrand: "Toyota", vehicleModel: "Corolla", yearStart: 2008, yearEnd: 2025, engine: "1.8L 2ZR-FE" },
  { productName: "Líquido de Frenos DOT 4", vehicleBrand: "Toyota", vehicleModel: "Hilux", yearStart: 2010, yearEnd: 2025, engine: "2.8L 1GD-FTV" },
  { productName: "Líquido de Frenos DOT 4", vehicleBrand: "Nissan", vehicleModel: "Sentra", yearStart: 2013, yearEnd: 2025, engine: "1.8L MR18DE" },
  { productName: "Aceite de Motor 10W40", vehicleBrand: "Toyota", vehicleModel: "Corolla", yearStart: 2008, yearEnd: 2025, engine: "1.8L 2ZR-FE" },
  { productName: "Aceite de Motor 10W40", vehicleBrand: "Nissan", vehicleModel: "Sentra", yearStart: 2013, yearEnd: 2025, engine: "1.8L MR18DE" },
  { productName: "Aceite de Motor 15W40", vehicleBrand: "Toyota", vehicleModel: "Hilux", yearStart: 2015, yearEnd: 2025, engine: "2.8L 1GD-FTV" },
  { productName: "Aceite de Motor 15W40", vehicleBrand: "Nissan", vehicleModel: "Frontier", yearStart: 2010, yearEnd: 2025, engine: "2.5L YD25" },
  { productName: "Kit de Correa Alterno", vehicleBrand: "Toyota", vehicleModel: "Corolla", yearStart: 2008, yearEnd: 2025, engine: "1.8L 2ZR-FE" },
  { productName: "Kit de Correa Alterno", vehicleBrand: "Toyota", vehicleModel: "Hilux", yearStart: 2015, yearEnd: 2025, engine: "2.8L 1GD-FTV" },
]

export function seed(db: Database.Database): void {
  if (exists(db, "product_vehicle_compatibility")) return

  const getProductId = db.prepare("SELECT id FROM products WHERE name = ?")
  const getBrandId = db.prepare("SELECT id FROM vehicle_brands WHERE name = ?")
  const getModelId = db.prepare("SELECT vm.id FROM vehicle_models vm JOIN vehicle_brands vb ON vb.id = vm.brand_id WHERE vb.name = ? AND vm.name = ?")
  const getEngineId = db.prepare("SELECT id FROM vehicle_engines WHERE name = ?")

  const stmt = db.prepare(
    `INSERT INTO product_vehicle_compatibility (product_id, brand_id, model_id, engine_id, year_start, year_end, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`
  )

  const insertAll = db.transaction(() => {
    let count = 0
    for (const c of COMPAT) {
      const prodRow = getProductId.get(c.productName) as { id: number } | undefined
      if (!prodRow) continue
      const brandRow = getBrandId.get(c.vehicleBrand) as { id: number } | undefined
      if (!brandRow) continue
      const modelRow = getModelId.get(c.vehicleBrand, c.vehicleModel) as { id: number } | undefined
      if (!modelRow) continue
      const engineRow = getEngineId.get(c.engine) as { id: number } | undefined
      if (!engineRow) continue
      stmt.run(prodRow.id, brandRow.id, modelRow.id, engineRow.id, c.yearStart, c.yearEnd, `Compatibilidad ${c.vehicleBrand} ${c.vehicleModel} ${c.engine}`)
      count++
    }
    console.log(`  ✓ Seeded ${count} vehicle compatibilities`)
  })

  insertAll()
}