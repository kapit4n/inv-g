import type Database from "better-sqlite3"

// This seed ensures dashboard-related data is properly generated
// All data for dashboards comes from the other seed modules
// (products, sales, movements, customers, etc.)

export function seed(_db: Database.Database): void {
  // Dashboard data is derived from seeded entities
  // No direct seeding needed - the other seeds provide all data
  console.log("  ✓ Dashboard data available from seeded entities")
}
