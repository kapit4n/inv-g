# Seed Data — Inventory Gear

## Overview

This directory contains modular, idempotent TypeScript seed scripts that populate the Inventory Gear database with **realistic automotive parts data** for the Bolivian market.

The data is designed to make the application feel like a production system that has been operating for several months — with ~100 products, ~150 customers, ~500 sales, ~2000 inventory movements, and 5000+ audit log entries.

## Seed Architecture

```
database/seed/
├── index.ts              # Orchestrator — runs all seeds in dependency order
├── run.ts                # CLI entry point — finds DB, runs seeds, prints stats
├── helpers.ts            # Shared utilities (dates, random, phone, addresses)
├── categories.seed.ts    # 20 automotive categories
├── brands.seed.ts        # 30 brands
├── suppliers.seed.ts     # 20 suppliers
├── warehouses.seed.ts    # 4 warehouses
├── locations.seed.ts     # 100+ storage locations
├── products.seed.ts      # 100 products with realistic Bolivian-market data
├── compatibility.seed.ts # Vehicle compatibility matrix
├── customers.seed.ts     # 150 customers
├── movements.seed.ts     # 2000+ inventory movements
├── transfers.seed.ts     # 100 warehouse transfers
├── reservations.seed.ts  # 50 reservations
├── adjustments.seed.ts   # 100 adjustments
├── sales.seed.ts         # 500 completed sales
├── payments.seed.ts      # Payment records (integrated with sales)
├── quotes.seed.ts        # 100 quotes
├── audit.seed.ts         # 5000+ audit log entries
├── users.seed.ts         # User login history
└── dashboard.seed.ts     # Dashboard data verification
```

## Data Generation Strategy

### Geographic Context
- **Country**: Bolivia
- **Currency**: Bs (Bolivianos)
- **Cities**: Cochabamba, Santa Cruz, La Paz, Sucre, Oruro, Tarija, Potosí, Beni, Pando
- **Phone format**: +591 XXXXXXXXX
- **Addresses**: Real street names per city with random numbers

### Products
- 100 realistic automotive parts with real OEM-style names
- Prices in Bolivianos (Bs) reflecting Bolivian market: lower than US/EU prices
- Mix of fast-moving (filters, oils, spark plugs) and slow-moving (alternators, compressors)
- Stock levels: fast-moving 50-300 units, medium 20-80, expensive 2-15
- Some products deliberately below reorder point (to test low-stock alerts)
- Barcodes use Bolivia prefix (770)

### Sales
- 500 sales spread over 365 days
- 1-8 products per sale
- Mix of payment methods: cash (~50%), card (~25%), transfer (~15%), QR (~10%)
- Cash payments include small change amounts
- Card/transfer payments include authorization references
- Each sale generates: sale record, items, payments, inventory movements, receipt

### Inventory Movements
- 2000+ movements across all types:
  - Initial stock (one per product)
  - Sales movements (linked to sale numbers)
  - Adjustments (cyclic counts, corrections)
  - Damages (shipping, storage, handling)
  - Losses (miscounts, misplaced)
  - Found inventory (rediscovered items)
  - Transfers (between warehouses)
  - Reservations (customer holds)

### Audit Logs
- 5000+ entries spanning 365 days
- Covers: logins, sales, products, inventory, customers, quotes, payments, settings
- Realistic distribution: login events daily, product updates periodic, system events scattered

## Idempotency

Each seed module checks if data already exists before inserting:

```typescript
if (exists(db, "products")) return
```

This means:
- **First run**: All data is inserted fresh
- **Subsequent runs**: Exiting data is preserved; only empty tables are populated
- **Partial runs**: If some seeds ran but others didn't, missing data is added
- **Safe to re-run**: Running seeds multiple times will never corrupt or duplicate data

## Relationships

```
Categories ──┐
Brands ───────┤
Manufacturers ┤── Products ──┬── Sale Items ── Sales ── Payments
Suppliers ────┤              ├── Quote Items ── Quotes
Warehouses ───┘              ├── Product Vehicle Compatibility
Storage Locations ───────────┘── Inventory Movements
                                  ├── Transfers
                                  ├── Adjustments
                                  └── Reservations

Users ──── Sales, Quotes, Movements, Audit Logs
Customers ─ Sales, Quotes
```

## How to Execute Seeds

### Prerequisites
- Node.js 18+
- `pnpm install` completed (or `npm install`)
- Database file must exist (run the app once to create it)

### CLI (Recommended)

```bash
# Auto-detect database location
pnpm run db:seed

# Or specify database path manually
npx tsx database/seed/run.ts --db /path/to/inventory_gear.db
```

### Via Tauri App (from UI)

The app exposes a `run_seeds` command that can be called from the frontend:

```typescript
import { runSeeds } from "@/lib/tauri"
const result = await runSeeds()
```

### Via Rust Backend

```bash
cargo run -- run_seeds
```

## Regenerating Demo Data

To start fresh:

1. Delete the existing database:
   ```bash
   rm ~/.local/share/inventory-gear/inventory_gear.db
   ```
2. Restart the app (creates fresh DB with schema)
3. Run seeds:
   ```bash
   pnpm run db:seed
   ```

## Expected Record Counts

| Entity | Count |
|--------|-------|
| Categories | 20 |
| Brands | 30 |
| Suppliers | 20 |
| Warehouses | 4 |
| Storage Locations | 100+ |
| Products | 100 |
| Vehicle Compatibilities | ~100 |
| Customers | 150 |
| Sales | 500 |
| Sale Items | ~2000 |
| Payments | 500+ |
| Quotes | 100 |
| Inventory Movements | 2000+ |
| Audit Logs | 5000+ |
| Users | 6 |

## Extending Datasets

To add more products:

1. Open `database/seed/products.seed.ts`
2. Add a new entry to the `PRODUCTS` array following the existing format
3. Add vehicle compatibility in `compatibility.seed.ts` if applicable

To add more customers:

1. Open `database/seed/customers.seed.ts`
2. Modify `FIRST_NAMES`, `LAST_NAMES`, or `BUSINESS_NAMES` arrays

To modify price ranges:

1. Edit the `cost`, `salePrice`, `wholesalePrice` fields in `products.seed.ts`

## Verification

After seeding, you can verify data integrity:

```bash
# Count records
sqlite3 ~/.local/share/inventory-gear/inventory_gear.db "SELECT COUNT(*) FROM products;"
sqlite3 ~/.local/share/inventory-gear/inventory_gear.db "SELECT COUNT(*) FROM sales;"
sqlite3 ~/.local/share/inventory-gear/inventory_gear.db "SELECT COUNT(*) FROM inventory_movements;"

# Check relationships
sqlite3 ~/.local/share/inventory-gear/inventory_gear.db \
  "SELECT COUNT(*) FROM sale_items si JOIN sales s ON si.sale_id = s.id;"

# Check stock consistency
sqlite3 ~/.local/share/inventory-gear/inventory_gear.db \
  "SELECT p.name, p.stock_quantity, SUM(im.quantity) as moved
   FROM products p
   JOIN inventory_movements im ON im.product_id = p.id
   GROUP BY p.id
   HAVING ABS(p.stock_quantity - moved) > 0;"
```

## Known Limitations

- **No actual images**: Image URLs reference filenames only (`products/*.jpg`)
- **Synthetic sales**: Sales are generated algorithmically, not from real transactions
- **Simplified reservations**: Reservations are tracked via inventory movements, not a dedicated table
- **Cash register sessions**: Not seeded with detailed transactions (relies on sales data)
- **Daily closings**: Not seeded separately (can be generated from sales data)
- **Password hashes**: All users have password `123456` (from Rust seed)
- **Static timestamps**: Dates are randomized but not timezone-aware
