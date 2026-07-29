import type Database from "better-sqlite3"
import { seed as seedCategories } from "./categories.seed"
import { seed as seedBrands } from "./brands.seed"
import { seed as seedSuppliers } from "./suppliers.seed"
import { seed as seedWarehouses } from "./warehouses.seed"
import { seed as seedLocations } from "./locations.seed"
import { seed as seedProducts } from "./products.seed"
import { seed as seedCompatibility } from "./compatibility.seed"
import { seed as seedCustomers } from "./customers.seed"
import { seed as seedMovements } from "./movements.seed"
import { seed as seedTransfers } from "./transfers.seed"
import { seed as seedAdjustments } from "./adjustments.seed"
import { seed as seedSales } from "./sales.seed"
import { seed as seedPayments } from "./payments.seed"
import { seed as seedQuotes } from "./quotes.seed"
import { seed as seedAudit } from "./audit.seed"
import { seed as seedUsers } from "./users.seed"
import { seed as seedDashboard } from "./dashboard.seed"
import { seed as seedReservations } from "./reservations.seed"

export const SEED_ORDER = [
  { name: "Categories", fn: seedCategories },
  { name: "Brands", fn: seedBrands },
  { name: "Suppliers", fn: seedSuppliers },
  { name: "Warehouses", fn: seedWarehouses },
  { name: "Storage Locations", fn: seedLocations },
  { name: "Products", fn: seedProducts },
  { name: "Vehicle Compatibility", fn: seedCompatibility },
  { name: "Customers", fn: seedCustomers },
  { name: "Users", fn: seedUsers },
  { name: "Inventory Movements", fn: seedMovements },
  { name: "Transfers", fn: seedTransfers },
  { name: "Adjustments", fn: seedAdjustments },
  { name: "Reservations", fn: seedReservations },
  { name: "Sales", fn: seedSales },
  { name: "Payments", fn: seedPayments },
  { name: "Quotes", fn: seedQuotes },
  { name: "Audit Logs", fn: seedAudit },
  { name: "Dashboard", fn: seedDashboard },
]

export async function seedAll(db: Database.Database): Promise<void> {
  console.log("\n🌱 Seeding Inventory Gear database...\n")

  for (const { name, fn } of SEED_ORDER) {
    try {
      fn(db)
    } catch (err) {
      console.error(`  ✗ Error seeding ${name}:`, err)
    }
  }

  console.log("\n✅ Seed completed!\n")
}
