# Seed Data

This document describes the demo database seed pipeline.

## Running

```bash
npx tsx database/seed/run.ts
```

Auto-detects the database at `~/.local/share/inventory-gear/inventory_gear.db`. Override with `--db <path>`.

## Seed Order

Seeds run in dependency order (defined in `database/seed/index.ts`):

1. **Categories** — 30 categories (auto parts, tools, lubricants, etc.)
2. **Brands** — 31 product brands (Bosch, NGK, KYB, SKF, etc.)
3. **Suppliers** — 24 suppliers
4. **Warehouses** — 4 warehouses
5. **Storage Locations** — 112 locations across warehouses
6. **Products** — 144 products with stock, pricing, barcodes
7. **Vehicle Compatibility** — 96 product-to-vehicle mappings (FK-based)
8. **Customers** — 347 customers (individuals + businesses)
9. **Users** — 6 users (admin, cashier, etc.)
10. **Inventory Movements** — ~2,700 sale movements + ~1,800 manual adjustments
11. **Transfers** — ~129 transfer movements between warehouses
12. **Adjustments** — Inventory adjustments
13. **Reservations** — 50 product reservations
14. **Sales** — 500 sales with 2,207 items and payments (~$804k revenue)
15. **Payments** — Handled inline with sales seed
16. **Quotes** — 100 quotes with items
17. **Audit Logs** — ~8,900 audit entries
18. **Dashboard** — Uses existing data (no dedicated seed)
19. **Vehicles** — 20 brands, 53 models, 30 generations, 26 engines, 9 transmissions, 4 fuels, 300 customer vehicles
20. **Validation** — Reports data health; 18 checks pass, 0 errors

## Additive Design

All seed modules use additive logic — they check for existing data before inserting and only add missing records. Re-running the seed is safe.

## Validation Report

The validation seed (`validate.seed.ts`) checks all critical tables and prints a report:
- ❌ = Error (must fix before app works)
- ⚠ = Warning (below recommended threshold)
- ✅ = Passing

Target thresholds: ≥1 warehouse, ≥100 active products, ≥50 with stock, ≥100 customers, ≥10 sales, ≥3 users.

## Vehicle Reference Data

| Table | Records |
|---|---|
| `vehicle_brands` | 20 |
| `vehicle_models` | 53 |
| `vehicle_generations` | 30 |
| `vehicle_engines` | 26 |
| `vehicle_transmissions` | 9 |
| `vehicle_fuels` | 4 |

Customer vehicles (300) link customers to specific vehicle configurations.

## App Readiness

After seeding:
- **POS**: 118 products with stock + sale price, 347 customers, 500 sales history
- **CRM**: 347 customers, 300 vehicles, 100 quotes
- **Inventory**: 144 products, 4 warehouses, 112 locations, ~4,500 movements
- **Reports**: 500 sales, ~$804k revenue, ~8,900 audit entries
