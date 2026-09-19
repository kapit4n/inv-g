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
import { seed as seedVehicles } from "./vehicles.seed"
import { seed as seedValidate } from "./validate.seed"

export type DatabaseProfile = "default" | "single-store" | "multi-store" | "empty"

export const DEFAULT_PROFILE: DatabaseProfile = "default"

function isKnownProfile(value: string): value is DatabaseProfile {
  return value === "default" || value === "single-store" || value === "multi-store" || value === "empty"
}

export function resolveProfile(value?: string): DatabaseProfile {
  if (value && isKnownProfile(value)) {
    return value
  }
  return DEFAULT_PROFILE
}

export async function seedAll(db: Database.Database, profile: DatabaseProfile = DEFAULT_PROFILE): Promise<void> {
  console.log(`\n🌱 Seeding Inventory Gear database (profile: ${profile})...\n`)

  // The `empty` profile intentionally keeps the database free of business
  // data; the app seeds users/roles/permissions/settings during init.
  if (profile === "empty") {
    console.log("  ℹ Skipping business seed for empty profile (schema is created by the app).")
    console.log("\n✅ Seed completed!\n")
    return
  }

  const order = [
    { name: "Categories", fn: seedCategories },
    { name: "Brands", fn: seedBrands },
    { name: "Suppliers", fn: seedSuppliers },
    { name: "Warehouses", fn: (db: Database.Database) => seedWarehouses(db, profile) },
    { name: "Storage Locations", fn: (db: Database.Database) => seedLocations(db, profile) },
    { name: "Products", fn: seedProducts },
    { name: "Vehicle Compatibility", fn: seedCompatibility },
    { name: "Customers", fn: seedCustomers },
    { name: "Users", fn: seedUsers },
    { name: "Inventory Movements", fn: seedMovements },
    { name: "Transfers", fn: (db: Database.Database) => seedTransfers(db, profile) },
    { name: "Adjustments", fn: seedAdjustments },
    { name: "Reservations", fn: seedReservations },
    { name: "Sales", fn: seedSales },
    { name: "Payments", fn: seedPayments },
    { name: "Quotes", fn: seedQuotes },
    { name: "Audit Logs", fn: seedAudit },
    { name: "Dashboard", fn: seedDashboard },
    { name: "Vehicles", fn: seedVehicles },
    { name: "Validation", fn: seedValidate },
  ]

  for (const { name, fn } of order) {
    try {
      fn(db)
    } catch (err) {
      console.error(`  ✗ Error seeding ${name}:`, err)
    }
  }

  console.log("\n✅ Seed completed!\n")
}