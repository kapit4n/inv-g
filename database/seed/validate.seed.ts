import type Database from "better-sqlite3"

interface ValidationCheck {
  name: string
  sql: string
  threshold: { min: number }
  severity: "error" | "warn" | "info"
}

const CHECKS: ValidationCheck[] = [
  { name: "Categories", sql: "SELECT COUNT(*) as cnt FROM categories", threshold: { min: 5 }, severity: "error" },
  { name: "Brands", sql: "SELECT COUNT(*) as cnt FROM brands", threshold: { min: 5 }, severity: "error" },
  { name: "Suppliers", sql: "SELECT COUNT(*) as cnt FROM suppliers", threshold: { min: 5 }, severity: "error" },
  { name: "Warehouses", sql: "SELECT COUNT(*) as cnt FROM warehouses", threshold: { min: 1 }, severity: "error" },
  { name: "Storage locations", sql: "SELECT COUNT(*) as cnt FROM storage_locations", threshold: { min: 5 }, severity: "warn" },
  { name: "Products", sql: "SELECT COUNT(*) as cnt FROM products WHERE is_active = 1", threshold: { min: 100 }, severity: "error" },
  { name: "Products with stock", sql: "SELECT COUNT(*) as cnt FROM products WHERE stock_quantity > 0", threshold: { min: 50 }, severity: "error" },
  { name: "Product compatibility records", sql: "SELECT COUNT(*) as cnt FROM product_vehicle_compatibility", threshold: { min: 80 }, severity: "warn" },
  { name: "Customers", sql: "SELECT COUNT(*) as cnt FROM customers WHERE is_active = 1", threshold: { min: 100 }, severity: "error" },
  { name: "Customer vehicles", sql: "SELECT COUNT(*) as cnt FROM customer_vehicles WHERE status = 'active'", threshold: { min: 100 }, severity: "warn" },
  { name: "Vehicle brands", sql: "SELECT COUNT(*) as cnt FROM vehicle_brands", threshold: { min: 5 }, severity: "warn" },
  { name: "Vehicle models", sql: "SELECT COUNT(*) as cnt FROM vehicle_models", threshold: { min: 10 }, severity: "warn" },
  { name: "Users", sql: "SELECT COUNT(*) as cnt FROM users WHERE is_active = 1", threshold: { min: 3 }, severity: "error" },
  { name: "Inventory movements (sale)", sql: "SELECT COUNT(*) as cnt FROM inventory_movements WHERE reference_type = 'sale'", threshold: { min: 50 }, severity: "warn" },
  { name: "Sales", sql: "SELECT COUNT(*) as cnt FROM sales", threshold: { min: 10 }, severity: "error" },
  { name: "Sale items", sql: "SELECT COUNT(*) as cnt FROM sale_items", threshold: { min: 20 }, severity: "warn" },
  { name: "Payments", sql: "SELECT COUNT(*) as cnt FROM sale_payments", threshold: { min: 10 }, severity: "warn" },
  { name: "Transfers (movements)", sql: "SELECT COUNT(*) as cnt FROM inventory_movements WHERE reference_type = 'transfer'", threshold: { min: 5 }, severity: "warn" },
  { name: "Quotes", sql: "SELECT COUNT(*) as cnt FROM quotes", threshold: { min: 5 }, severity: "warn" },
]

export function seed(db: Database.Database): void {
  console.log("\n=== VALIDATION REPORT ===")

  let errors = 0
  let warnings = 0
  let passed = 0

  for (const check of CHECKS) {
    let row: { cnt: number } | undefined
    try {
      row = db.prepare(check.sql).get() as { cnt: number } | undefined
    } catch {
      row = { cnt: 0 }
    }

    const count = row?.cnt ?? 0
    const ok = count >= check.threshold.min

    if (!ok) {
      if (check.severity === "error") {
        console.log(`  ❌ ERROR: ${check.name} — got ${count}, need ≥${check.threshold.min}`)
        errors++
      } else {
        console.log(`  ⚠ WARN:  ${check.name} — got ${count}, need ≥${check.threshold.min}`)
        warnings++
      }
    } else {
      console.log(`  ✅ ${check.name}: ${count}`)
      passed++
    }
  }

  console.log(`\n  Summary: ${passed} passed, ${warnings} warnings, ${errors} errors`)

  if (errors > 0) {
    console.log("  ⚠ Some checks failed — data may be insufficient for the app.")
  } else if (warnings > 0) {
    console.log("  ⚠ All critical checks pass, but some data is below recommended thresholds.")
  } else {
    console.log("  🎉 All checks passed! The app should work properly.")
  }

  // Verify a few spot checks
  console.log("\n=== SPOT CHECKS ===")
  try {
    const posProducts = db.prepare("SELECT COUNT(*) as cnt FROM products WHERE is_active = 1 AND stock_quantity > 0 AND sale_price > 0").get() as { cnt: number }
    console.log(`  📦 Products available for POS: ${posProducts.cnt}`)
  } catch { /* skip */ }

  try {
    const posCustomers = db.prepare("SELECT COUNT(*) as cnt FROM customers WHERE is_active = 1").get() as { cnt: number }
    console.log(`  👥 Customers available for POS: ${posCustomers.cnt}`)
  } catch { /* skip */ }

  try {
    const users = db.prepare("SELECT COUNT(*) as cnt FROM users WHERE is_active = 1").get() as { cnt: number }
    console.log(`  👤 Active users: ${users.cnt}`)
  } catch { /* skip */ }

  try {
    const salesCount = db.prepare("SELECT COUNT(*) as cnt FROM sales").get() as { cnt: number }
    if (salesCount.cnt > 0) {
      const totalRevenue = db.prepare("SELECT COALESCE(SUM(total), 0) as total FROM sales").get() as { total: number }
      console.log(`  💰 Total sales: ${salesCount.cnt} — Revenue: $${totalRevenue.total.toFixed(2)}`)
    }
  } catch { /* skip */ }

  console.log("") // trailing newline
}