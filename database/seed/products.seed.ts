import type Database from "better-sqlite3"
import { exists, generateSKU, generateBarcode, randomInt, randomDate } from "./helpers"

interface ProductDef {
  name: string
  description: string
  categoryName: string
  brandName: string
  manufacturerName: string
  cost: number
  salePrice: number
  wholesalePrice: number
  stock: number
  minStock: number
  maxStock: number
  reorderPoint: number
  imageFile: string
}

const PRODUCTS: ProductDef[] = [
  { name: "Filtro de Aceite Toyota Corolla", description: "Filtro de aceite para Toyota Corolla 1.8L", categoryName: "Filtros", brandName: "Bosch", manufacturerName: "Bosch GmbH", cost: 18, salePrice: 45, wholesalePrice: 35, stock: 85, minStock: 15, maxStock: 200, reorderPoint: 30, imageFile: "filtro_aceite_toyota_corolla.jpg" },
  { name: "Filtro de Aceite Nissan Sentra", description: "Filtro de aceite para Nissan Sentra B17", categoryName: "Filtros", brandName: "Mann", manufacturerName: "Mann+Hummel GmbH", cost: 15, salePrice: 38, wholesalePrice: 28, stock: 60, minStock: 10, maxStock: 150, reorderPoint: 25, imageFile: "filtro_aceite_nissan_sentra.jpg" },
  { name: "Filtro de Aceite Suzuki Vitara", description: "Filtro de aceite para Suzuki Vitara 2.0", categoryName: "Filtros", brandName: "Fram", manufacturerName: "Mann+Hummel GmbH", cost: 12, salePrice: 32, wholesalePrice: 24, stock: 40, minStock: 10, maxStock: 100, reorderPoint: 20, imageFile: "filtro_aceite_suzuki_vitara.jpg" },
  { name: "Filtro de Aire Toyota Hilux", description: "Filtro de aire motor para Hilux 2.8L", categoryName: "Filtros", brandName: "Denso", manufacturerName: "Denso Corporation", cost: 35, salePrice: 85, wholesalePrice: 65, stock: 50, minStock: 8, maxStock: 100, reorderPoint: 20, imageFile: "filtro_aire_hilux.jpg" },
  { name: "Filtro de Aire Honda CR-V", description: "Filtro de aire para Honda CR-V 2.4", categoryName: "Filtros", brandName: "Mahle", manufacturerName: "Mann+Hummel GmbH", cost: 28, salePrice: 70, wholesalePrice: 52, stock: 30, minStock: 5, maxStock: 80, reorderPoint: 15, imageFile: "filtro_aire_honda_crv.jpg" },
  { name: "Filtro de Combustible Bosch", description: "Filtro de combustible Bosch universal", categoryName: "Filtros", brandName: "Bosch", manufacturerName: "Bosch GmbH", cost: 22, salePrice: 55, wholesalePrice: 42, stock: 45, minStock: 10, maxStock: 120, reorderPoint: 20, imageFile: "filtro_combustible_bosch.jpg" },
  { name: "Filtro de Cabina Toyota", description: "Filtro de cabina para Toyota Yaris", categoryName: "Filtros", brandName: "Toyota Genuine", manufacturerName: "Denso Corporation", cost: 25, salePrice: 65, wholesalePrice: 48, stock: 25, minStock: 5, maxStock: 80, reorderPoint: 12, imageFile: "filtro_cabina_toyota.jpg" },
  { name: "Filtro de Combustible Denso", description: "Filtro de combustible Denso para common rail", categoryName: "Filtros", brandName: "Denso", manufacturerName: "Denso Corporation", cost: 40, salePrice: 95, wholesalePrice: 72, stock: 20, minStock: 5, maxStock: 60, reorderPoint: 12, imageFile: "filtro_combustible_denso.jpg" },
  { name: "Pastillas de Freno Delanteras Corolla", description: "Pastillas de freno delanteras Toyota Corolla", categoryName: "Frenos", brandName: "Bosch", manufacturerName: "Bosch GmbH", cost: 55, salePrice: 140, wholesalePrice: 105, stock: 35, minStock: 8, maxStock: 80, reorderPoint: 15, imageFile: "pastillas_freno_corolla.jpg" },
  { name: "Pastillas de Freno Traseras Hilux", description: "Pastillas de freno traseras Toyota Hilux", categoryName: "Frenos", brandName: "Brembo", manufacturerName: "Bosch GmbH", cost: 65, salePrice: 160, wholesalePrice: 120, stock: 20, minStock: 5, maxStock: 60, reorderPoint: 12, imageFile: "pastillas_freno_hilux.jpg" },
  { name: "Pastillas de Freno Nissan Frontier", description: "Pastillas de freno delanteras Nissan Frontier", categoryName: "Frenos", brandName: "Ferodo", manufacturerName: "Bosch GmbH", cost: 50, salePrice: 130, wholesalePrice: 98, stock: 15, minStock: 5, maxStock: 50, reorderPoint: 10, imageFile: "pastillas_freno_frontier.jpg" },
  { name: "Disco de Freno Delantero Corolla", description: "Disco de freno ventilado Corolla 1.8", categoryName: "Frenos", brandName: "TRW", manufacturerName: "Valeo SA", cost: 85, salePrice: 210, wholesalePrice: 160, stock: 12, minStock: 3, maxStock: 30, reorderPoint: 8, imageFile: "disco_freno_corolla.jpg" },
  { name: "Disco de Freno Hilux", description: "Disco de freno delantero Hilux 4x4", categoryName: "Frenos", brandName: "Brembo", manufacturerName: "Bosch GmbH", cost: 120, salePrice: 300, wholesalePrice: 225, stock: 10, minStock: 2, maxStock: 25, reorderPoint: 6, imageFile: "disco_freno_hilux.jpg" },
  { name: "Tambor de Freno D-Max", description: "Tambor de freno trasero Chevrolet D-Max", categoryName: "Frenos", brandName: "Delphi", manufacturerName: "Valeo SA", cost: 70, salePrice: 175, wholesalePrice: 132, stock: 8, minStock: 2, maxStock: 20, reorderPoint: 5, imageFile: "tambor_freno_dmax.jpg" },
  { name: "Kit de Embrague Toyota Corolla", description: "Kit de embrague completo Toyota Corolla 1.8", categoryName: "Transmisión", brandName: "Valeo", manufacturerName: "Valeo SA", cost: 180, salePrice: 450, wholesalePrice: 340, stock: 8, minStock: 2, maxStock: 20, reorderPoint: 5, imageFile: "kit_embrague_corolla.jpg" },
  { name: "Kit de Embrague Hilux", description: "Kit de embrague Hilux 2.8 diesel", categoryName: "Transmisión", brandName: "Valeo", manufacturerName: "Valeo SA", cost: 220, salePrice: 550, wholesalePrice: 415, stock: 6, minStock: 2, maxStock: 15, reorderPoint: 4, imageFile: "kit_embrague_hilux.jpg" },
  { name: "Bujía NGK BKR6E", description: "Bujía de encendido NGK BKR6E estándar", categoryName: "Encendido", brandName: "NGK", manufacturerName: "NGK Spark Plug Co.", cost: 8, salePrice: 22, wholesalePrice: 16, stock: 200, minStock: 30, maxStock: 500, reorderPoint: 60, imageFile: "bujia_ngk_bkr6e.jpg" },
  { name: "Bujía Iridium NGK", description: "Bujía de iridio NGK de larga duración", categoryName: "Encendido", brandName: "NGK", manufacturerName: "NGK Spark Plug Co.", cost: 15, salePrice: 38, wholesalePrice: 28, stock: 120, minStock: 20, maxStock: 300, reorderPoint: 40, imageFile: "bujia_iridium_ngk.jpg" },
  { name: "Bujía Denso Iridium TT", description: "Bujía de iridio Denso TT twin tip", categoryName: "Encendido", brandName: "Denso", manufacturerName: "Denso Corporation", cost: 18, salePrice: 45, wholesalePrice: 34, stock: 80, minStock: 15, maxStock: 200, reorderPoint: 30, imageFile: "bujia_denso_iridium.jpg" },
  { name: "Cables de Bujías Bosch", description: "Juego de cables de bujías Bosch 4 cilindros", categoryName: "Encendido", brandName: "Bosch", manufacturerName: "Bosch GmbH", cost: 30, salePrice: 75, wholesalePrice: 56, stock: 25, minStock: 5, maxStock: 60, reorderPoint: 12, imageFile: "cables_bujias_bosch.jpg" },
  { name: "Bobina de Encendido Denso", description: "Bobina de encendido Denso para Corolla", categoryName: "Encendido", brandName: "Denso", manufacturerName: "Denso Corporation", cost: 55, salePrice: 140, wholesalePrice: 105, stock: 15, minStock: 3, maxStock: 40, reorderPoint: 8, imageFile: "bobina_encendido_denso.jpg" },
  { name: "Alternador Toyota Hilux", description: "Alternador 120A para Toyota Hilux 2.8", categoryName: "Sistema Eléctrico", brandName: "Bosch", manufacturerName: "Bosch GmbH", cost: 280, salePrice: 700, wholesalePrice: 525, stock: 5, minStock: 1, maxStock: 12, reorderPoint: 3, imageFile: "alternador_hilux.jpg" },
  { name: "Alternador Nissan Frontier", description: "Alternador 110A Nissan Frontier 2.5", categoryName: "Sistema Eléctrico", brandName: "Denso", manufacturerName: "Denso Corporation", cost: 250, salePrice: 620, wholesalePrice: 465, stock: 4, minStock: 1, maxStock: 10, reorderPoint: 2, imageFile: "alternador_frontier.jpg" },
  { name: "Motor de Arranque Toyota", description: "Motor de arranque 12V Toyota Corolla/Hilux", categoryName: "Sistema Eléctrico", brandName: "Bosch", manufacturerName: "Bosch GmbH", cost: 200, salePrice: 500, wholesalePrice: 375, stock: 6, minStock: 2, maxStock: 15, reorderPoint: 4, imageFile: "motor_arranque_toyota.jpg" },
  { name: "Motor de Arranque Nissan", description: "Motor de arranque Nissan Sentra/Versa", categoryName: "Sistema Eléctrico", brandName: "Hitachi", manufacturerName: "Bosch GmbH", cost: 180, salePrice: 450, wholesalePrice: 340, stock: 5, minStock: 1, maxStock: 12, reorderPoint: 3, imageFile: "motor_arranque_nissan.jpg" },
  { name: "Batería Bosch 65Ah", description: "Batería Bosch 65Ah 12V mantenimiento libre", categoryName: "Baterías", brandName: "Bosch", manufacturerName: "Bosch GmbH", cost: 160, salePrice: 400, wholesalePrice: 300, stock: 20, minStock: 5, maxStock: 50, reorderPoint: 10, imageFile: "bateria_bosch_65ah.jpg" },
  { name: "Batería Bosch 45Ah", description: "Batería Bosch 45Ah 12V para vehículos pequeños", categoryName: "Baterías", brandName: "Bosch", manufacturerName: "Bosch GmbH", cost: 110, salePrice: 280, wholesalePrice: 210, stock: 15, minStock: 3, maxStock: 40, reorderPoint: 8, imageFile: "bateria_bosch_45ah.jpg" },
  { name: "Batería Exide 75Ah", description: "Batería Exide 75Ah 12V alta capacidad", categoryName: "Baterías", brandName: "Exide", manufacturerName: "Bosch GmbH", cost: 190, salePrice: 480, wholesalePrice: 360, stock: 10, minStock: 2, maxStock: 30, reorderPoint: 6, imageFile: "bateria_exide_75ah.jpg" },
  { name: "Radiador Toyota Hilux", description: "Radiador de aluminio Toyota Hilux 2.8", categoryName: "Refrigeración", brandName: "Valeo", manufacturerName: "Valeo SA", cost: 160, salePrice: 400, wholesalePrice: 300, stock: 8, minStock: 2, maxStock: 20, reorderPoint: 5, imageFile: "radiador_hilux.jpg" },
  { name: "Radiador Nissan Frontier", description: "Radiador de aluminio Nissan Frontier 2.5", categoryName: "Refrigeración", brandName: "Valeo", manufacturerName: "Valeo SA", cost: 145, salePrice: 360, wholesalePrice: 270, stock: 6, minStock: 1, maxStock: 15, reorderPoint: 4, imageFile: "radiador_frontier.jpg" },
  { name: "Bomba de Agua Toyota", description: "Bomba de agua Toyota Corolla 1.8", categoryName: "Refrigeración", brandName: "SKF", manufacturerName: "SKF Group", cost: 60, salePrice: 150, wholesalePrice: 112, stock: 12, minStock: 3, maxStock: 30, reorderPoint: 8, imageFile: "bomba_agua_toyota.jpg" },
  { name: "Bomba de Agua Hilux", description: "Bomba de agua Toyota Hilux 2.8 diesel", categoryName: "Refrigeración", brandName: "SKF", manufacturerName: "SKF Group", cost: 75, salePrice: 190, wholesalePrice: 142, stock: 8, minStock: 2, maxStock: 20, reorderPoint: 5, imageFile: "bomba_agua_hilux.jpg" },
  { name: "Termostato Motor", description: "Termostato universal 82°C", categoryName: "Refrigeración", brandName: "Mahle", manufacturerName: "Mann+Hummel GmbH", cost: 10, salePrice: 28, wholesalePrice: 20, stock: 40, minStock: 8, maxStock: 100, reorderPoint: 15, imageFile: "termostato_motor.jpg" },
  { name: "Amortiguador Delantero KYB Corolla", description: "Amortiguador delantero KYB Toyota Corolla", categoryName: "Suspensión", brandName: "KYB", manufacturerName: "Valeo SA", cost: 90, salePrice: 230, wholesalePrice: 172, stock: 15, minStock: 3, maxStock: 35, reorderPoint: 8, imageFile: "amortiguador_delantero_corolla.jpg" },
  { name: "Amortiguador Trasero Hilux", description: "Amortiguador trasero Toyota Hilux 4x4", categoryName: "Suspensión", brandName: "Monroe", manufacturerName: "Valeo SA", cost: 100, salePrice: 250, wholesalePrice: 188, stock: 12, minStock: 3, maxStock: 30, reorderPoint: 6, imageFile: "amortiguador_trasero_hilux.jpg" },
  { name: "Amortiguador Delantero Nissan Frontier", description: "Amortiguador delantero Nissan Frontier 4x4", categoryName: "Suspensión", brandName: "KYB", manufacturerName: "Valeo SA", cost: 105, salePrice: 265, wholesalePrice: 198, stock: 8, minStock: 2, maxStock: 20, reorderPoint: 5, imageFile: "amortiguador_frontier.jpg" },
  { name: "Rótula Suspensión Toyota", description: "Rótula de suspensión inferior Toyota Corolla", categoryName: "Suspensión", brandName: "SKF", manufacturerName: "SKF Group", cost: 25, salePrice: 65, wholesalePrice: 48, stock: 30, minStock: 5, maxStock: 80, reorderPoint: 12, imageFile: "rotula_suspension_toyota.jpg" },
  { name: "Rótula Superior Hilux", description: "Rótula superior Toyota Hilux 4x4", categoryName: "Suspensión", brandName: "TRW", manufacturerName: "SKF Group", cost: 35, salePrice: 90, wholesalePrice: 68, stock: 18, minStock: 3, maxStock: 50, reorderPoint: 10, imageFile: "rotula_hilux.jpg" },
  { name: "Terminal de Dirección Corolla", description: "Terminal de dirección interior/exterior Corolla", categoryName: "Dirección", brandName: "TRW", manufacturerName: "Valeo SA", cost: 20, salePrice: 55, wholesalePrice: 40, stock: 25, minStock: 5, maxStock: 60, reorderPoint: 12, imageFile: "terminal_direccion_corolla.jpg" },
  { name: "Terminal de Dirección Hilux", description: "Terminal de dirección Toyota Hilux", categoryName: "Dirección", brandName: "TRW", manufacturerName: "Valeo SA", cost: 28, salePrice: 72, wholesalePrice: 54, stock: 20, minStock: 3, maxStock: 50, reorderPoint: 10, imageFile: "terminal_direccion_hilux.jpg" },
  { name: "Bomba de Dirección Hilux", description: "Bomba de dirección hidráulica Toyota Hilux", categoryName: "Dirección", brandName: "TRW", manufacturerName: "Valeo SA", cost: 160, salePrice: 400, wholesalePrice: 300, stock: 5, minStock: 1, maxStock: 12, reorderPoint: 3, imageFile: "bomba_direccion_hilux.jpg" },
  { name: "Aceite Mobil 20W50", description: "Aceite de motor Mobil 20W50 mineral 4L", categoryName: "Lubricantes", brandName: "Mobil", manufacturerName: "Bosch GmbH", cost: 35, salePrice: 85, wholesalePrice: 65, stock: 60, minStock: 12, maxStock: 150, reorderPoint: 25, imageFile: "aceite_mobil_20w50.jpg" },
  { name: "Aceite Castrol 10W40", description: "Aceite de motor Castrol GTX 10W40 4L", categoryName: "Lubricantes", brandName: "Castrol", manufacturerName: "Bosch GmbH", cost: 40, salePrice: 100, wholesalePrice: 75, stock: 50, minStock: 10, maxStock: 120, reorderPoint: 20, imageFile: "aceite_castrol_10w40.jpg" },
  { name: "Aceite Total 15W40 Diesel", description: "Aceite para motor diesel Total 15W40 4L", categoryName: "Lubricantes", brandName: "Total", manufacturerName: "Bosch GmbH", cost: 38, salePrice: 95, wholesalePrice: 72, stock: 40, minStock: 8, maxStock: 100, reorderPoint: 16, imageFile: "aceite_total_15w40.jpg" },
  { name: "Aceite Mobil 5W30 Sintético", description: "Aceite sintético Mobil 1 5W30 4L", categoryName: "Lubricantes", brandName: "Mobil", manufacturerName: "Bosch GmbH", cost: 60, salePrice: 150, wholesalePrice: 112, stock: 35, minStock: 8, maxStock: 80, reorderPoint: 15, imageFile: "aceite_mobil_5w30.jpg" },
  { name: "Anticongelante Total", description: "Anticongelante Total concentrado 3L", categoryName: "Lubricantes", brandName: "Total", manufacturerName: "Bosch GmbH", cost: 20, salePrice: 52, wholesalePrice: 38, stock: 45, minStock: 10, maxStock: 100, reorderPoint: 20, imageFile: "anticongelante_total.jpg" },
  { name: "Líquido de Frenos DOT4", description: "Líquido de frenos DOT4 500ml", categoryName: "Frenos", brandName: "Bosch", manufacturerName: "Bosch GmbH", cost: 10, salePrice: 28, wholesalePrice: 20, stock: 70, minStock: 15, maxStock: 150, reorderPoint: 30, imageFile: "liquido_frenos_dot4.jpg" },
  { name: "Líquido de Frenos DOT5.1", description: "Líquido de frenos DOT5.1 500ml alta performance", categoryName: "Frenos", brandName: "Castrol", manufacturerName: "Bosch GmbH", cost: 18, salePrice: 45, wholesalePrice: 34, stock: 25, minStock: 5, maxStock: 60, reorderPoint: 12, imageFile: "liquido_frenos_dot51.jpg" },
  { name: "Correa de Distribución Gates", description: "Correa de distribución Gates para Corolla 1.8", categoryName: "Correas", brandName: "Gates", manufacturerName: "Bosch GmbH", cost: 35, salePrice: 88, wholesalePrice: 66, stock: 20, minStock: 5, maxStock: 50, reorderPoint: 10, imageFile: "correa_distribucion_gates.jpg" },
  { name: "Correa Poly-V Bosch", description: "Correa poly-V Bosch 6PK 1775", categoryName: "Correas", brandName: "Bosch", manufacturerName: "Bosch GmbH", cost: 15, salePrice: 40, wholesalePrice: 30, stock: 35, minStock: 8, maxStock: 80, reorderPoint: 15, imageFile: "correa_polyv_bosch.jpg" },
  { name: "Correa de Distribución Dayco", description: "Correa de distribución Dayco Honda Civic 1.8", categoryName: "Correas", brandName: "Dayco", manufacturerName: "Bosch GmbH", cost: 38, salePrice: 95, wholesalePrice: 72, stock: 15, minStock: 3, maxStock: 40, reorderPoint: 8, imageFile: "correa_distribucion_dayco.jpg" },
  { name: "Tensor de Correa SKF", description: "Tensor automático de correa SKF", categoryName: "Correas", brandName: "SKF", manufacturerName: "SKF Group", cost: 45, salePrice: 115, wholesalePrice: 86, stock: 12, minStock: 3, maxStock: 30, reorderPoint: 6, imageFile: "tensor_correa_skf.jpg" },
  { name: "Kit de Distribución Completo", description: "Kit distribución completo Corolla 1.8 (correa+tensor+bomba)", categoryName: "Correas", brandName: "Gates", manufacturerName: "Bosch GmbH", cost: 120, salePrice: 300, wholesalePrice: 225, stock: 8, minStock: 2, maxStock: 20, reorderPoint: 5, imageFile: "kit_distribucion_completo.jpg" },
  { name: "Rodamiento de Rueda SKF", description: "Rodamiento de rueda delantero SKF universal", categoryName: "Rodamientos", brandName: "SKF", manufacturerName: "SKF Group", cost: 40, salePrice: 100, wholesalePrice: 75, stock: 20, minStock: 5, maxStock: 50, reorderPoint: 10, imageFile: "rodamiento_rueda_skf.jpg" },
  { name: "Rodamiento Trasero SKF", description: "Rodamiento de rueda trasero SKF", categoryName: "Rodamientos", brandName: "SKF", manufacturerName: "SKF Group", cost: 38, salePrice: 95, wholesalePrice: 72, stock: 18, minStock: 3, maxStock: 45, reorderPoint: 10, imageFile: "rodamiento_trasero_skf.jpg" },
  { name: "Rodamiento de Transmisión", description: "Rodamiento de transmisión SKF 6205", categoryName: "Rodamientos", brandName: "SKF", manufacturerName: "SKF Group", cost: 15, salePrice: 40, wholesalePrice: 30, stock: 50, minStock: 10, maxStock: 120, reorderPoint: 20, imageFile: "rodamiento_transmision.jpg" },
  { name: "Sensor MAP Bosch", description: "Sensor de presión absoluta MAP Bosch", categoryName: "Sensores", brandName: "Bosch", manufacturerName: "Bosch GmbH", cost: 28, salePrice: 72, wholesalePrice: 54, stock: 12, minStock: 3, maxStock: 30, reorderPoint: 6, imageFile: "sensor_map_bosch.jpg" },
  { name: "Sensor MAF Bosch", description: "Sensor de flujo de aire MAF Bosch", categoryName: "Sensores", brandName: "Bosch", manufacturerName: "Bosch GmbH", cost: 55, salePrice: 140, wholesalePrice: 105, stock: 8, minStock: 2, maxStock: 20, reorderPoint: 5, imageFile: "sensor_maf_bosch.jpg" },
  { name: "Sensor de Oxígeno Bosch", description: "Sensor lambda de oxígeno Bosch universal", categoryName: "Sensores", brandName: "Bosch", manufacturerName: "Bosch GmbH", cost: 35, salePrice: 90, wholesalePrice: 68, stock: 15, minStock: 3, maxStock: 35, reorderPoint: 8, imageFile: "sensor_oxigeno_bosch.jpg" },
  { name: "Sensor de Oxígeno Denso", description: "Sensor de oxígeno Denso para Toyota", categoryName: "Sensores", brandName: "Denso", manufacturerName: "Denso Corporation", cost: 38, salePrice: 95, wholesalePrice: 72, stock: 10, minStock: 2, maxStock: 25, reorderPoint: 6, imageFile: "sensor_oxigeno_denso.jpg" },
  { name: "Sensor de Velocidad", description: "Sensor de velocidad VSS universal", categoryName: "Sensores", brandName: "Delphi", manufacturerName: "Bosch GmbH", cost: 20, salePrice: 55, wholesalePrice: 40, stock: 20, minStock: 5, maxStock: 50, reorderPoint: 10, imageFile: "sensor_velocidad.jpg" },
  { name: "Faros Delanteros Corolla", description: "Faros delanteros completos Toyota Corolla 2014+", categoryName: "Iluminación", brandName: "Philips", manufacturerName: "Valeo SA", cost: 120, salePrice: 300, wholesalePrice: 225, stock: 6, minStock: 1, maxStock: 15, reorderPoint: 4, imageFile: "faros_corolla.jpg" },
  { name: "Bombilla LED Philips", description: "Bombilla LED Philips H4 6000K", categoryName: "Iluminación", brandName: "Philips", manufacturerName: "Valeo SA", cost: 40, salePrice: 100, wholesalePrice: 75, stock: 30, minStock: 8, maxStock: 80, reorderPoint: 15, imageFile: "bombilla_led_philips.jpg" },
  { name: "Bombilla H4 Osram", description: "Bombilla halógena Osram H4 60/55W", categoryName: "Iluminación", brandName: "Osram", manufacturerName: "Valeo SA", cost: 8, salePrice: 22, wholesalePrice: 16, stock: 80, minStock: 20, maxStock: 200, reorderPoint: 40, imageFile: "bombilla_h4_osram.jpg" },
  { name: "Faros LED Hilux", description: "Faros LED completos Toyota Hilux 2018+", categoryName: "Iluminación", brandName: "Philips", manufacturerName: "Valeo SA", cost: 250, salePrice: 620, wholesalePrice: 465, stock: 4, minStock: 1, maxStock: 10, reorderPoint: 2, imageFile: "faros_led_hilux.jpg" },
  { name: "Aceite de Transmisión ATF", description: "Aceite de transmisión automática ATF Dexron III 4L", categoryName: "Lubricantes", brandName: "Mobil", manufacturerName: "Bosch GmbH", cost: 35, salePrice: 88, wholesalePrice: 66, stock: 25, minStock: 5, maxStock: 60, reorderPoint: 12, imageFile: "aceite_transmision_atf.jpg" },
  { name: "Grasa de Litio SKF", description: "Grasa de litio SKF para rodamientos 400g", categoryName: "Lubricantes", brandName: "SKF", manufacturerName: "SKF Group", cost: 12, salePrice: 32, wholesalePrice: 24, stock: 40, minStock: 8, maxStock: 100, reorderPoint: 16, imageFile: "grasa_litio_skf.jpg" },
  { name: "Silenciador Universal", description: "Silenciador universal trasero 36mm", categoryName: "Escape", brandName: "Bosch", manufacturerName: "Bosch GmbH", cost: 65, salePrice: 165, wholesalePrice: 124, stock: 8, minStock: 2, maxStock: 20, reorderPoint: 5, imageFile: "silenciador_universal.jpg" },
  { name: "Tubo de Escape Hilux", description: "Tubo de escape central Toyota Hilux", categoryName: "Escape", brandName: "Bosch", manufacturerName: "Bosch GmbH", cost: 55, salePrice: 140, wholesalePrice: 105, stock: 6, minStock: 1, maxStock: 15, reorderPoint: 4, imageFile: "tubo_escape_hilux.jpg" },
  { name: "Kit de Fusibles", description: "Juego de fusibles automotrices estándar", categoryName: "Sistema Eléctrico", brandName: "Bosch", manufacturerName: "Bosch GmbH", cost: 8, salePrice: 22, wholesalePrice: 16, stock: 100, minStock: 20, maxStock: 250, reorderPoint: 40, imageFile: "kit_fusibles.jpg" },
  { name: "Relé Multiusos", description: "Relé automotriz 12V 30A multiusos", categoryName: "Sistema Eléctrico", brandName: "Bosch", manufacturerName: "Bosch GmbH", cost: 6, salePrice: 18, wholesalePrice: 12, stock: 80, minStock: 15, maxStock: 200, reorderPoint: 30, imageFile: "rele_multiusos.jpg" },
  { name: "Compresor de Aire Acondicionado", description: "Compresor de A/C Toyota Corolla 1.8", categoryName: "Motor", brandName: "Denso", manufacturerName: "Denso Corporation", cost: 320, salePrice: 800, wholesalePrice: 600, stock: 3, minStock: 1, maxStock: 8, reorderPoint: 2, imageFile: "compresor_ac_corolla.jpg" },
  { name: "Kit de Arrastre Suzuki", description: "Kit de arrastre (relación) Suzuki Vitara", categoryName: "Transmisión", brandName: "SKF", manufacturerName: "SKF Group", cost: 85, salePrice: 215, wholesalePrice: 162, stock: 6, minStock: 2, maxStock: 15, reorderPoint: 4, imageFile: "kit_arrastre_suzuki.jpg" },
  { name: "Amortiguador Trasero KYB", description: "Amortiguador trasero KYB Nissan Sentra", categoryName: "Suspensión", brandName: "KYB", manufacturerName: "Valeo SA", cost: 80, salePrice: 200, wholesalePrice: 150, stock: 12, minStock: 3, maxStock: 30, reorderPoint: 6, imageFile: "amortiguador_trasero_sentra.jpg" },
  { name: "Filtro de Aceite Bosch Universal", description: "Filtro de aceite Bosch universal premium", categoryName: "Filtros", brandName: "Bosch", manufacturerName: "Bosch GmbH", cost: 14, salePrice: 36, wholesalePrice: 27, stock: 95, minStock: 20, maxStock: 250, reorderPoint: 40, imageFile: "filtro_aceite_bosch_universal.jpg" },
  { name: "Filtro de Aire K&N Universal", description: "Filtro de aire K&N deportivo universal", categoryName: "Filtros", brandName: "K&N", manufacturerName: "Mann+Hummel GmbH", cost: 65, salePrice: 165, wholesalePrice: 124, stock: 10, minStock: 2, maxStock: 25, reorderPoint: 5, imageFile: "filtro_aire_kn.jpg" },
  { name: "Pastillas de Freno Honda Civic", description: "Pastillas de freno delanteras Honda Civic 1.8", categoryName: "Frenos", brandName: "Bosch", manufacturerName: "Bosch GmbH", cost: 50, salePrice: 125, wholesalePrice: 94, stock: 18, minStock: 4, maxStock: 45, reorderPoint: 10, imageFile: "pastillas_freno_civic.jpg" },
  { name: "Disco de Freno Civic", description: "Disco de freno delantero Honda Civic 1.8", categoryName: "Frenos", brandName: "Brembo", manufacturerName: "Bosch GmbH", cost: 90, salePrice: 225, wholesalePrice: 170, stock: 8, minStock: 2, maxStock: 20, reorderPoint: 5, imageFile: "disco_freno_civic.jpg" },
  { name: "Tambor de Freno Suzuki", description: "Tambor de freno trasero Suzuki Jimny", categoryName: "Frenos", brandName: "Delphi", manufacturerName: "Valeo SA", cost: 55, salePrice: 140, wholesalePrice: 105, stock: 6, minStock: 1, maxStock: 15, reorderPoint: 4, imageFile: "tambor_freno_suzuki.jpg" },
  { name: "Rodamiento de Rueda NSK", description: "Rodamiento de rueda NSK 6205", categoryName: "Rodamientos", brandName: "SKF", manufacturerName: "SKF Group", cost: 12, salePrice: 32, wholesalePrice: 24, stock: 60, minStock: 15, maxStock: 150, reorderPoint: 25, imageFile: "rodamiento_nsk.jpg" },
  { name: "Bobina de Encendido Hitachi", description: "Bobina de encendido Hitachi para Honda", categoryName: "Encendido", brandName: "Hitachi", manufacturerName: "Bosch GmbH", cost: 50, salePrice: 125, wholesalePrice: 94, stock: 12, minStock: 3, maxStock: 30, reorderPoint: 6, imageFile: "bobina_hitachi.jpg" },
  { name: "Sensor CKP Bosch", description: "Sensor de posición del cigüeñal Bosch", categoryName: "Sensores", brandName: "Bosch", manufacturerName: "Bosch GmbH", cost: 22, salePrice: 58, wholesalePrice: 44, stock: 15, minStock: 3, maxStock: 35, reorderPoint: 8, imageFile: "sensor_ckp_bosch.jpg" },
  { name: "Sensor CMP Bosch", description: "Sensor de posición del árbol de levas Bosch", categoryName: "Sensores", brandName: "Bosch", manufacturerName: "Bosch GmbH", cost: 25, salePrice: 65, wholesalePrice: 48, stock: 12, minStock: 2, maxStock: 30, reorderPoint: 6, imageFile: "sensor_cmp_bosch.jpg" },
  { name: "Manguera de Radiador", description: "Manguera inferior de radiador universal 36mm", categoryName: "Refrigeración", brandName: "Continental", manufacturerName: "Valeo SA", cost: 12, salePrice: 32, wholesalePrice: 24, stock: 30, minStock: 8, maxStock: 80, reorderPoint: 15, imageFile: "manguera_radiador.jpg" },
  { name: "Ventilador de Radiador", description: "Ventilador eléctrico de radiador 12\" universal", categoryName: "Refrigeración", brandName: "Bosch", manufacturerName: "Bosch GmbH", cost: 55, salePrice: 140, wholesalePrice: 105, stock: 8, minStock: 2, maxStock: 20, reorderPoint: 5, imageFile: "ventilador_radiador.jpg" },
  { name: "Bomba de Agua Eléctrica", description: "Bomba de agua eléctrica auxiliar 12V", categoryName: "Refrigeración", brandName: "Bosch", manufacturerName: "Bosch GmbH", cost: 45, salePrice: 115, wholesalePrice: 86, stock: 10, minStock: 2, maxStock: 25, reorderPoint: 5, imageFile: "bomba_agua_electrica.jpg" },
  { name: "Kit de Juntas de Motor", description: "Kit de juntas para motor Toyota Corolla 1.8", categoryName: "Motor", brandName: "Mahle", manufacturerName: "Mann+Hummel GmbH", cost: 60, salePrice: 150, wholesalePrice: 112, stock: 5, minStock: 1, maxStock: 12, reorderPoint: 3, imageFile: "kit_juntas_motor.jpg" },
  { name: "Anillos de Pistón", description: "Juego de anillos de pistón std 83mm", categoryName: "Motor", brandName: "Mahle", manufacturerName: "Mann+Hummel GmbH", cost: 35, salePrice: 90, wholesalePrice: 68, stock: 8, minStock: 2, maxStock: 20, reorderPoint: 4, imageFile: "anillos_piston.jpg" },
  { name: "Bomba de Gasolina Eléctrica", description: "Bomba de gasolina eléctrica universal 12V", categoryName: "Motor", brandName: "Bosch", manufacturerName: "Bosch GmbH", cost: 45, salePrice: 115, wholesalePrice: 86, stock: 10, minStock: 2, maxStock: 25, reorderPoint: 5, imageFile: "bomba_gasolina_electrica.jpg" },
  { name: "Inyector de Combustible", description: "Inyector de combustible Bosch para Corolla", categoryName: "Motor", brandName: "Bosch", manufacturerName: "Bosch GmbH", cost: 55, salePrice: 140, wholesalePrice: 105, stock: 12, minStock: 3, maxStock: 30, reorderPoint: 6, imageFile: "inyector_combustible.jpg" },
  { name: "Maza de Rueda Delantera", description: "Maza de rueda delantera con rodamiento integrado", categoryName: "Rodamientos", brandName: "SKF", manufacturerName: "SKF Group", cost: 65, salePrice: 165, wholesalePrice: 124, stock: 8, minStock: 2, maxStock: 20, reorderPoint: 4, imageFile: "maza_rueda.jpg" },
  { name: "Faros Antiniebla LED", description: "Faros antiniebla LED universales 12V", categoryName: "Iluminación", brandName: "Philips", manufacturerName: "Valeo SA", cost: 60, salePrice: 150, wholesalePrice: 112, stock: 15, minStock: 3, maxStock: 35, reorderPoint: 8, imageFile: "faros_antiniebla_led.jpg" },
  { name: "Bocina Eléctrica", description: "Bocina eléctrica 12V doble tono", categoryName: "Sistema Eléctrico", brandName: "Bosch", manufacturerName: "Bosch GmbH", cost: 15, salePrice: 40, wholesalePrice: 30, stock: 25, minStock: 5, maxStock: 60, reorderPoint: 12, imageFile: "bocina_electrica.jpg" },
  { name: "Limpiaparabrisas Bosch", description: "Juego de limpiaparabrisas Bosch 24\"+20\"", categoryName: "Accesorios", brandName: "Bosch", manufacturerName: "Bosch GmbH", cost: 12, salePrice: 32, wholesalePrice: 24, stock: 40, minStock: 10, maxStock: 100, reorderPoint: 20, imageFile: "limpiaparabrisas_bosch.jpg" },
  { name: "Espejo Retrovisor", description: "Espejo retrovisor interior universal", categoryName: "Accesorios", brandName: "Bosch", manufacturerName: "Bosch GmbH", cost: 18, salePrice: 48, wholesalePrice: 36, stock: 15, minStock: 3, maxStock: 40, reorderPoint: 8, imageFile: "espejo_retrovisor.jpg" },
  { name: "Cargador de Batería", description: "Cargador de batería automático 12V 6A", categoryName: "Herramientas", brandName: "Bosch", manufacturerName: "Bosch GmbH", cost: 60, salePrice: 150, wholesalePrice: 112, stock: 8, minStock: 2, maxStock: 20, reorderPoint: 4, imageFile: "cargador_bateria.jpg" },
  { name: "Gato Hidráulico 2T", description: "Gato hidráulico de botella 2 toneladas", categoryName: "Herramientas", brandName: "Bosch", manufacturerName: "Bosch GmbH", cost: 45, salePrice: 115, wholesalePrice: 86, stock: 10, minStock: 2, maxStock: 25, reorderPoint: 5, imageFile: "gato_hidraulico.jpg" },
  { name: "LLave de Bujías", description: "Llave para bujías 5/8\" con mango", categoryName: "Herramientas", brandName: "Bosch", manufacturerName: "Bosch GmbH", cost: 8, salePrice: 22, wholesalePrice: 16, stock: 50, minStock: 10, maxStock: 120, reorderPoint: 20, imageFile: "llave_bujias.jpg" },
  { name: "Cepillo de Terminales", description: "Cepillo limpiador de terminales de batería", categoryName: "Herramientas", brandName: "Bosch", manufacturerName: "Bosch GmbH", cost: 5, salePrice: 15, wholesalePrice: 10, stock: 60, minStock: 15, maxStock: 150, reorderPoint: 25, imageFile: "cepillo_terminales.jpg" },
  { name: "Shampoo Automotriz", description: "Shampoo para autos con cera 1L", categoryName: "Limpieza Automotriz", brandName: "Bosch", manufacturerName: "Bosch GmbH", cost: 10, salePrice: 28, wholesalePrice: 20, stock: 35, minStock: 8, maxStock: 80, reorderPoint: 15, imageFile: "shampoo_automotriz.jpg" },
  { name: "Cera Liquida", description: "Cera líquida para autos 500ml", categoryName: "Limpieza Automotriz", brandName: "Bosch", manufacturerName: "Bosch GmbH", cost: 15, salePrice: 38, wholesalePrice: 28, stock: 20, minStock: 5, maxStock: 50, reorderPoint: 10, imageFile: "cera_liquida.jpg" },
  { name: "Correa Poly-V Gates", description: "Correa poly-V Gates 5PK 1210", categoryName: "Correas", brandName: "Gates", manufacturerName: "Bosch GmbH", cost: 14, salePrice: 36, wholesalePrice: 27, stock: 30, minStock: 8, maxStock: 80, reorderPoint: 15, imageFile: "correa_polyv_gates.jpg" },
  { name: "Neumático 205/55R16", description: "Neumático 205/55 R16 91H para vehículos sedan", categoryName: "Neumáticos", brandName: "Continental", manufacturerName: "Bosch GmbH", cost: 120, salePrice: 300, wholesalePrice: 225, stock: 12, minStock: 2, maxStock: 30, reorderPoint: 6, imageFile: "neumatico_205_55r16.jpg" },
  { name: "Neumático 225/65R17", description: "Neumático 225/65 R17 102H para SUV", categoryName: "Neumáticos", brandName: "Continental", manufacturerName: "Bosch GmbH", cost: 160, salePrice: 400, wholesalePrice: 300, stock: 8, minStock: 2, maxStock: 20, reorderPoint: 5, imageFile: "neumatico_225_65r17.jpg" },
  { name: "Neumático 265/65R17", description: "Neumático 265/65 R17 todo terreno para Hilux", categoryName: "Neumáticos", brandName: "Continental", manufacturerName: "Bosch GmbH", cost: 200, salePrice: 500, wholesalePrice: 375, stock: 6, minStock: 1, maxStock: 15, reorderPoint: 3, imageFile: "neumatico_265_65r17.jpg" },
  { name: "Neumático 175/65R14", description: "Neumático 175/65 R14 para vehículos económicos", categoryName: "Neumáticos", brandName: "Continental", manufacturerName: "Bosch GmbH", cost: 75, salePrice: 190, wholesalePrice: 142, stock: 20, minStock: 4, maxStock: 50, reorderPoint: 10, imageFile: "neumatico_175_65r14.jpg" },
  { name: "Producto para Limpieza de Inyectores", description: "Aditivo limpiador de inyectores 300ml", categoryName: "Limpieza Automotriz", brandName: "Bosch", manufacturerName: "Bosch GmbH", cost: 8, salePrice: 22, wholesalePrice: 16, stock: 45, minStock: 10, maxStock: 100, reorderPoint: 20, imageFile: "limpieza_inyectores.jpg" },
  { name: "Silicona para Juntas", description: "Silicona selladora de juntas automotriz", categoryName: "Accesorios", brandName: "Bosch", manufacturerName: "Bosch GmbH", cost: 6, salePrice: 18, wholesalePrice: 12, stock: 55, minStock: 12, maxStock: 120, reorderPoint: 25, imageFile: "silicona_juntas.jpg" },
]

const MANUFACTURERS = [
  { name: "Bosch GmbH", country: "Alemania", phone: "+49 711 8110", email: "info@bosch.com", website: "https://www.bosch.com" },
  { name: "NGK Spark Plug Co.", country: "Japón", phone: "+81 52 872 8211", email: "info@ngk.co.jp", website: "https://www.ngk.com" },
  { name: "Denso Corporation", country: "Japón", phone: "+81 566 25 5511", email: "info@denso.com", website: "https://www.denso.com" },
  { name: "Valeo SA", country: "Francia", phone: "+33 1 40 55 20 20", email: "contact@valeo.com", website: "https://www.valeo.com" },
  { name: "SKF Group", country: "Suecia", phone: "+46 31 337 1000", email: "info@skf.com", website: "https://www.skf.com" },
  { name: "Mann+Hummel GmbH", country: "Alemania", phone: "+49 7141 98 0", email: "info@mann-hummel.com", website: "https://www.mann-filter.com" },
]

export function seed(db: Database.Database): void {
  // Seed manufacturers (idempotent)
  const mfCheck = db.prepare("SELECT id FROM manufacturers WHERE name = ?")
  const mfStmt = db.prepare("INSERT OR IGNORE INTO manufacturers (name, country, phone, email, website) VALUES (?, ?, ?, ?, ?)")
  for (const m of MANUFACTURERS) {
    const row = mfCheck.get(m.name) as { id: number } | undefined
    if (!row) mfStmt.run(m.name, m.country, m.phone, m.email, m.website)
  }

  // Check if we already have all 100 products
  const existing = db.prepare("SELECT COUNT(*) as cnt FROM products").get() as { cnt: number }
  if (existing.cnt >= PRODUCTS.length) return

  // Delete old products and dependents to re-seed cleanly
  // Use deferred FK to allow deletion in any order
  db.pragma("defer_foreign_keys = ON")
  const delAll = db.transaction(() => {
    db.prepare("DELETE FROM product_vehicle_compatibility").run()
    db.prepare("DELETE FROM product_images").run()
    db.prepare("DELETE FROM inventory_movements").run()
    db.prepare("DELETE FROM quote_items").run()
    db.prepare("DELETE FROM quotes").run()
    db.prepare("DELETE FROM sale_items").run()
    db.prepare("DELETE FROM sale_payments").run()
    db.prepare("DELETE FROM receipts").run()
    db.prepare("DELETE FROM sales").run()
    db.prepare("DELETE FROM products").run()
  })
  delAll()
  db.pragma("defer_foreign_keys = OFF")

  // Re-seed all products
  const getCategoryId = db.prepare("SELECT id FROM categories WHERE name = ?")
  const getBrandId = db.prepare("SELECT id FROM brands WHERE name = ?")
  const getManufacturerId = db.prepare("SELECT id FROM manufacturers WHERE name = ?")
  const getSupplierId = db.prepare("SELECT id FROM suppliers ORDER BY RANDOM() LIMIT 1")
  const getWarehouseId = db.prepare("SELECT id FROM warehouses ORDER BY RANDOM() LIMIT 1")
  const getLocationId = db.prepare("SELECT id FROM storage_locations WHERE warehouse_id = ? ORDER BY RANDOM() LIMIT 1")

  const stmt = db.prepare(
    `INSERT INTO products (name, sku, barcode, oem_number, description, category_id, brand_id, manufacturer_id, supplier_id,
     cost_price, sale_price, wholesale_price, suggested_retail_price, tax_rate, stock_quantity, min_stock_level, max_stock_level,
     reorder_point, unit, warehouse_id, storage_location_id, image_url, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`
  )

  const insertAll = db.transaction(() => {
    for (let i = 0; i < PRODUCTS.length; i++) {
      const p = PRODUCTS[i]
      const catRow = getCategoryId.get(p.categoryName) as { id: number } | undefined
      const brandRow = getBrandId.get(p.brandName) as { id: number } | undefined
      const mfRow = getManufacturerId.get(p.manufacturerName) as { id: number } | undefined
      const supRow = getSupplierId.get() as { id: number } | undefined
      const whRow = getWarehouseId.get() as { id: number } | undefined

      const categoryId = catRow?.id ?? null
      const brandId = brandRow?.id ?? null
      const manufacturerId = mfRow?.id ?? null
      const supplierId = supRow?.id ?? null
      const warehouseId = whRow?.id ?? 1

      let locationId: number | null = null
      if (warehouseId) {
        const locRow = getLocationId.get(warehouseId) as { id: number } | undefined
        locationId = locRow?.id ?? null
      }

      const sku = generateSKU(p.categoryName, p.brandName, i + 1)
      const barcode = generateBarcode()
      const createdAt = randomDate(365, 1)
      const salePrice = p.salePrice
      const wholesalePrice = p.wholesalePrice
      const suggestedRetail = Math.round(salePrice * 1.15)

      stmt.run(
        p.name, sku, barcode, `OEM-${sku}`, p.description,
        categoryId, brandId, manufacturerId, supplierId,
        p.cost, salePrice, wholesalePrice, suggestedRetail, 0,
        p.stock, p.minStock, p.maxStock, p.reorderPoint, "pcs",
        warehouseId, locationId, p.imageFile,
        createdAt, createdAt
      )
    }
  })

  insertAll()
  console.log(`  ✓ Seeded ${PRODUCTS.length} products (replaced old data)`)
}

export const PRODUCT_DEFS = PRODUCTS
