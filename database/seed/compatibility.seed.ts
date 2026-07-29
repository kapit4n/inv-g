import type Database from "better-sqlite3"
import { exists, randomInt, pick } from "./helpers"

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
  { productName: "Pastillas de Freno Delanteras Corolla", vehicleBrand: "Toyota", vehicleModel: "Corolla", yearStart: 2014, yearEnd: 2025, engine: "1.8L" },
  { productName: "Pastillas de Freno Delanteras Corolla", vehicleBrand: "Toyota", vehicleModel: "Corolla", yearStart: 2009, yearEnd: 2013, engine: "1.8L" },
  { productName: "Pastillas de Freno Delanteras Corolla", vehicleBrand: "Toyota", vehicleModel: "Yaris", yearStart: 2012, yearEnd: 2025, engine: "1.5L" },
  { productName: "Amortiguador Delantero KYB Corolla", vehicleBrand: "Toyota", vehicleModel: "Corolla", yearStart: 2014, yearEnd: 2025, engine: "1.8L" },
  { productName: "Amortiguador Delantero KYB Corolla", vehicleBrand: "Toyota", vehicleModel: "Corolla", yearStart: 2009, yearEnd: 2013, engine: "1.8L" },
  { productName: "Radiador Toyota Hilux", vehicleBrand: "Toyota", vehicleModel: "Hilux", yearStart: 2015, yearEnd: 2025, engine: "2.8L 1GD-FTV" },
  { productName: "Radiador Toyota Hilux", vehicleBrand: "Toyota", vehicleModel: "Fortuner", yearStart: 2015, yearEnd: 2025, engine: "2.8L 1GD-FTV" },
  { productName: "Bomba de Agua Toyota", vehicleBrand: "Toyota", vehicleModel: "Corolla", yearStart: 2008, yearEnd: 2025, engine: "1.8L 2ZR-FE" },
  { productName: "Alternador Toyota Hilux", vehicleBrand: "Toyota", vehicleModel: "Hilux", yearStart: 2015, yearEnd: 2025, engine: "2.8L 1GD-FTV" },
  { productName: "Alternador Toyota Hilux", vehicleBrand: "Toyota", vehicleModel: "Fortuner", yearStart: 2015, yearEnd: 2025, engine: "2.8L" },
  { productName: "Batería Bosch 65Ah", vehicleBrand: "Toyota", vehicleModel: "Corolla", yearStart: 2008, yearEnd: 2025, engine: "1.8L" },
  { productName: "Batería Bosch 65Ah", vehicleBrand: "Toyota", vehicleModel: "Hilux", yearStart: 2010, yearEnd: 2025, engine: "2.8L" },
  { productName: "Batería Bosch 65Ah", vehicleBrand: "Nissan", vehicleModel: "Frontier", yearStart: 2010, yearEnd: 2025, engine: "2.5L" },
  { productName: "Batería Bosch 45Ah", vehicleBrand: "Toyota", vehicleModel: "Yaris", yearStart: 2012, yearEnd: 2025, engine: "1.5L" },
  { productName: "Batería Bosch 45Ah", vehicleBrand: "Suzuki", vehicleModel: "Vitara", yearStart: 2010, yearEnd: 2025, engine: "2.0L" },
  { productName: "Batería Bosch 45Ah", vehicleBrand: "Nissan", vehicleModel: "Versa", yearStart: 2013, yearEnd: 2025, engine: "1.6L" },
  { productName: "Bujía NGK BKR6E", vehicleBrand: "Toyota", vehicleModel: "Corolla", yearStart: 2008, yearEnd: 2025, engine: "1.8L 2ZR-FE" },
  { productName: "Bujía NGK BKR6E", vehicleBrand: "Toyota", vehicleModel: "Hilux", yearStart: 2005, yearEnd: 2015, engine: "2.7L 2TR-FE" },
  { productName: "Bujía NGK BKR6E", vehicleBrand: "Nissan", vehicleModel: "Sentra", yearStart: 2013, yearEnd: 2025, engine: "1.8L" },
  { productName: "Correa de Distribución Gates", vehicleBrand: "Toyota", vehicleModel: "Corolla", yearStart: 2000, yearEnd: 2007, engine: "1.8L 1ZZ-FE" },
  { productName: "Correa de Distribución Dayco", vehicleBrand: "Honda", vehicleModel: "Civic", yearStart: 2012, yearEnd: 2025, engine: "1.8L R18A" },
  { productName: "Pastillas de Freno Honda Civic", vehicleBrand: "Honda", vehicleModel: "Civic", yearStart: 2012, yearEnd: 2025, engine: "1.8L R18A" },
  { productName: "Alternador Nissan Frontier", vehicleBrand: "Nissan", vehicleModel: "Frontier", yearStart: 2010, yearEnd: 2025, engine: "2.5L YD25" },
  { productName: "Disco de Freno Hilux", vehicleBrand: "Toyota", vehicleModel: "Hilux", yearStart: 2015, yearEnd: 2025, engine: "2.8L" },
  { productName: "Disco de Freno Hilux", vehicleBrand: "Toyota", vehicleModel: "Fortuner", yearStart: 2015, yearEnd: 2025, engine: "2.8L" },
  { productName: "Kit de Embrague Toyota Corolla", vehicleBrand: "Toyota", vehicleModel: "Corolla", yearStart: 2008, yearEnd: 2025, engine: "1.8L" },
  { productName: "Kit de Embrague Hilux", vehicleBrand: "Toyota", vehicleModel: "Hilux", yearStart: 2015, yearEnd: 2025, engine: "2.8L" },
  { productName: "Kit de Embrague Hilux", vehicleBrand: "Toyota", vehicleModel: "Fortuner", yearStart: 2015, yearEnd: 2025, engine: "2.8L" },
  { productName: "Motor de Arranque Toyota", vehicleBrand: "Toyota", vehicleModel: "Corolla", yearStart: 2008, yearEnd: 2025, engine: "1.8L" },
  { productName: "Motor de Arranque Toyota", vehicleBrand: "Toyota", vehicleModel: "Hilux", yearStart: 2010, yearEnd: 2025, engine: "2.8L" },
  { productName: "Motor de Arranque Nissan", vehicleBrand: "Nissan", vehicleModel: "Sentra", yearStart: 2013, yearEnd: 2025, engine: "1.8L" },
  { productName: "Motor de Arranque Nissan", vehicleBrand: "Nissan", vehicleModel: "Versa", yearStart: 2013, yearEnd: 2025, engine: "1.6L" },
  { productName: "Bomba de Dirección Hilux", vehicleBrand: "Toyota", vehicleModel: "Hilux", yearStart: 2015, yearEnd: 2025, engine: "2.8L" },
  { productName: "Rótula Suspensión Toyota", vehicleBrand: "Toyota", vehicleModel: "Corolla", yearStart: 2009, yearEnd: 2025, engine: "1.8L" },
  { productName: "Rótula Superior Hilux", vehicleBrand: "Toyota", vehicleModel: "Hilux", yearStart: 2005, yearEnd: 2025, engine: "2.8L" },
  { productName: "Rótula Superior Hilux", vehicleBrand: "Toyota", vehicleModel: "Fortuner", yearStart: 2010, yearEnd: 2025, engine: "2.8L" },
  { productName: "Amortiguador Trasero Hilux", vehicleBrand: "Toyota", vehicleModel: "Hilux", yearStart: 2015, yearEnd: 2025, engine: "2.8L" },
  { productName: "Kit de Distribución Completo", vehicleBrand: "Toyota", vehicleModel: "Corolla", yearStart: 2008, yearEnd: 2025, engine: "1.8L 2ZR-FE" },
  { productName: "Sensor MAP Bosch", vehicleBrand: "Toyota", vehicleModel: "Corolla", yearStart: 2008, yearEnd: 2025, engine: "1.8L" },
  { productName: "Sensor MAP Bosch", vehicleBrand: "Nissan", vehicleModel: "Sentra", yearStart: 2013, yearEnd: 2025, engine: "1.8L" },
  { productName: "Sensor de Oxígeno Bosch", vehicleBrand: "Toyota", vehicleModel: "Corolla", yearStart: 2008, yearEnd: 2025, engine: "1.8L" },
  { productName: "Sensor de Oxígeno Denso", vehicleBrand: "Toyota", vehicleModel: "Hilux", yearStart: 2015, yearEnd: 2025, engine: "2.8L" },
  { productName: "Neumático 205/55R16", vehicleBrand: "Toyota", vehicleModel: "Corolla", yearStart: 2014, yearEnd: 2025, engine: "" },
  { productName: "Neumático 205/55R16", vehicleBrand: "Honda", vehicleModel: "Civic", yearStart: 2012, yearEnd: 2025, engine: "" },
  { productName: "Neumático 225/65R17", vehicleBrand: "Toyota", vehicleModel: "Fortuner", yearStart: 2015, yearEnd: 2025, engine: "" },
  { productName: "Neumático 225/65R17", vehicleBrand: "Honda", vehicleModel: "CR-V", yearStart: 2012, yearEnd: 2025, engine: "" },
  { productName: "Neumático 265/65R17", vehicleBrand: "Toyota", vehicleModel: "Hilux", yearStart: 2015, yearEnd: 2025, engine: "" },
  { productName: "Neumático 265/65R17", vehicleBrand: "Nissan", vehicleModel: "Frontier", yearStart: 2010, yearEnd: 2025, engine: "" },
  { productName: "Neumático 175/65R14", vehicleBrand: "Toyota", vehicleModel: "Yaris", yearStart: 2012, yearEnd: 2025, engine: "" },
  { productName: "Neumático 175/65R14", vehicleBrand: "Suzuki", vehicleModel: "Vitara", yearStart: 2010, yearEnd: 2025, engine: "" },
  { productName: "Amortiguador Trasero KYB", vehicleBrand: "Nissan", vehicleModel: "Sentra", yearStart: 2013, yearEnd: 2025, engine: "1.8L" },
  { productName: "Compresor de Aire Acondicionado", vehicleBrand: "Toyota", vehicleModel: "Corolla", yearStart: 2014, yearEnd: 2025, engine: "1.8L" },
  { productName: "Faros Delanteros Corolla", vehicleBrand: "Toyota", vehicleModel: "Corolla", yearStart: 2014, yearEnd: 2020, engine: "1.8L" },
  { productName: "Faros LED Hilux", vehicleBrand: "Toyota", vehicleModel: "Hilux", yearStart: 2018, yearEnd: 2025, engine: "2.8L" },
  { productName: "Disco de Freno Civic", vehicleBrand: "Honda", vehicleModel: "Civic", yearStart: 2012, yearEnd: 2025, engine: "1.8L" },
  { productName: "Pastillas de Freno Nissan Frontier", vehicleBrand: "Nissan", vehicleModel: "Frontier", yearStart: 2010, yearEnd: 2025, engine: "2.5L" },
  { productName: "Amortiguador Delantero Nissan Frontier", vehicleBrand: "Nissan", vehicleModel: "Frontier", yearStart: 2010, yearEnd: 2025, engine: "2.5L" },
  { productName: "Filtro de Aceite Suzuki Vitara", vehicleBrand: "Suzuki", vehicleModel: "Vitara", yearStart: 2010, yearEnd: 2025, engine: "2.0L" },
  { productName: "Filtro de Aire Honda CR-V", vehicleBrand: "Honda", vehicleModel: "CR-V", yearStart: 2012, yearEnd: 2025, engine: "2.4L" },
  { productName: "Tambor de Freno D-Max", vehicleBrand: "Chevrolet", vehicleModel: "D-Max", yearStart: 2012, yearEnd: 2025, engine: "2.5L" },
  { productName: "Tambor de Freno Suzuki", vehicleBrand: "Suzuki", vehicleModel: "Jimny", yearStart: 2010, yearEnd: 2025, engine: "1.3L" },
  { productName: "Radiador Nissan Frontier", vehicleBrand: "Nissan", vehicleModel: "Frontier", yearStart: 2010, yearEnd: 2025, engine: "2.5L" },
  { productName: "Bomba de Agua Hilux", vehicleBrand: "Toyota", vehicleModel: "Hilux", yearStart: 2015, yearEnd: 2025, engine: "2.8L" },
  { productName: "Terminal de Dirección Corolla", vehicleBrand: "Toyota", vehicleModel: "Corolla", yearStart: 2009, yearEnd: 2025, engine: "1.8L" },
  { productName: "Terminal de Dirección Hilux", vehicleBrand: "Toyota", vehicleModel: "Hilux", yearStart: 2005, yearEnd: 2025, engine: "2.8L" },
  { productName: "Bobina de Encendido Hitachi", vehicleBrand: "Honda", vehicleModel: "Civic", yearStart: 2012, yearEnd: 2025, engine: "1.8L" },
  { productName: "Sensor de Velocidad", vehicleBrand: "Toyota", vehicleModel: "Corolla", yearStart: 2008, yearEnd: 2025, engine: "1.8L" },
  { productName: "Sensor CKP Bosch", vehicleBrand: "Toyota", vehicleModel: "Corolla", yearStart: 2008, yearEnd: 2025, engine: "1.8L" },
  { productName: "Sensor CMP Bosch", vehicleBrand: "Toyota", vehicleModel: "Corolla", yearStart: 2008, yearEnd: 2025, engine: "1.8L" },
  { productName: "Inyector de Combustible", vehicleBrand: "Toyota", vehicleModel: "Corolla", yearStart: 2008, yearEnd: 2025, engine: "1.8L 2ZR-FE" },
  { productName: "Bomba de Gasolina Eléctrica", vehicleBrand: "Toyota", vehicleModel: "Corolla", yearStart: 2008, yearEnd: 2025, engine: "1.8L" },
  { productName: "Kit de Juntas de Motor", vehicleBrand: "Toyota", vehicleModel: "Corolla", yearStart: 2008, yearEnd: 2025, engine: "1.8L 2ZR-FE" },
  { productName: "Kit de Arrastre Suzuki", vehicleBrand: "Suzuki", vehicleModel: "Vitara", yearStart: 2010, yearEnd: 2025, engine: "2.0L" },
  { productName: "Alternador Toyota Hilux", vehicleBrand: "Toyota", vehicleModel: "Hilux", yearStart: 2005, yearEnd: 2014, engine: "3.0L 5L" },
  { productName: "Amortiguador Delantero KYB Corolla", vehicleBrand: "Toyota", vehicleModel: "Corolla", yearStart: 2009, yearEnd: 2013, engine: "1.8L" },
  { productName: "Amortiguador Trasero Hilux", vehicleBrand: "Toyota", vehicleModel: "Hilux", yearStart: 2005, yearEnd: 2014, engine: "3.0L" },
  { productName: "Sensor MAF Bosch", vehicleBrand: "Toyota", vehicleModel: "Corolla", yearStart: 2014, yearEnd: 2025, engine: "1.8L" },
  { productName: "Sensor MAF Bosch", vehicleBrand: "Nissan", vehicleModel: "Sentra", yearStart: 2013, yearEnd: 2025, engine: "1.8L" },
  { productName: "Bomba de Dirección Hilux", vehicleBrand: "Toyota", vehicleModel: "Fortuner", yearStart: 2010, yearEnd: 2025, engine: "2.8L" },
  { productName: "Pastillas de Freno Traseras Hilux", vehicleBrand: "Toyota", vehicleModel: "Hilux", yearStart: 2015, yearEnd: 2025, engine: "2.8L" },
  { productName: "Pastillas de Freno Traseras Hilux", vehicleBrand: "Toyota", vehicleModel: "Fortuner", yearStart: 2015, yearEnd: 2025, engine: "2.8L" },
  { productName: "Tensor de Correa SKF", vehicleBrand: "Toyota", vehicleModel: "Corolla", yearStart: 2008, yearEnd: 2025, engine: "1.8L" },
  { productName: "Rodamiento de Rueda SKF", vehicleBrand: "Toyota", vehicleModel: "Corolla", yearStart: 2008, yearEnd: 2025, engine: "1.8L" },
  { productName: "Rodamiento de Rueda SKF", vehicleBrand: "Nissan", vehicleModel: "Sentra", yearStart: 2013, yearEnd: 2025, engine: "1.8L" },
  { productName: "Maza de Rueda Delantera", vehicleBrand: "Toyota", vehicleModel: "Corolla", yearStart: 2014, yearEnd: 2025, engine: "1.8L" },
  { productName: "Filtro de Cabina Toyota", vehicleBrand: "Toyota", vehicleModel: "Yaris", yearStart: 2012, yearEnd: 2025, engine: "1.5L" },
  { productName: "Filtro de Cabina Toyota", vehicleBrand: "Toyota", vehicleModel: "Corolla", yearStart: 2014, yearEnd: 2025, engine: "1.8L" },
]

export function seed(db: Database.Database): void {
  if (exists(db, "product_vehicle_compatibility")) return

  const getProductId = db.prepare("SELECT id FROM products WHERE name = ?")

  const stmt = db.prepare(
    `INSERT INTO product_vehicle_compatibility (product_id, vehicle_brand, vehicle_model, year_start, year_end, engine, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`
  )

  const insertAll = db.transaction(() => {
    let count = 0
    for (const c of COMPAT) {
      const prodRow = getProductId.get(c.productName) as { id: number } | undefined
      if (!prodRow) continue
      stmt.run(prodRow.id, c.vehicleBrand, c.vehicleModel, c.yearStart, c.yearEnd, c.engine, `Compatibilidad ${c.vehicleBrand} ${c.vehicleModel}`)
      count++
    }
    console.log(`  ✓ Seeded ${count} vehicle compatibilities`)
  })

  insertAll()
}
