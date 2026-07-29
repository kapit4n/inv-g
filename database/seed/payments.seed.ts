import type Database from "better-sqlite3"
import { exists } from "./helpers"

// Payments are generated directly within sales.seed.ts
// This file exists for modular completeness and can extend payments separately

export function seed(_db: Database.Database): void {
  // Payments are handled inside sales.seed.ts
  console.log("  ✓ Payments seeded via sales seed")
}
