# Seed Data

> **See also**: `docs/SEED_DATA.md` for the high-level seed pipeline overview and `docs/database/SCHEMA.md` for table definitions.

This document provides a detailed breakdown of every record inserted during the seed process. The seeds are defined in `database/seed/` and executed by `npx tsx database/seed/run.ts`.

## Running Seeds

```bash
npx tsx database/seed/run.ts
```

Auto-detects the database at `~/.local/share/inventory-gear/inventory_gear.db`. Override with `--db <path>`.

All seed modules are **additive** — they check for existing data before inserting. Safe to re-run.

---

## Roles (6)

Seeded in `roles` and `permissions` + `role_permissions` tables.

| Role | Description | Key Permissions |
|---|---|---|
| `owner` | Full system access | All permissions |
| `administrator` | Management access | User/role admin, settings, reports, all operational |
| `cashier` | POS operations | Sales view/create, customer view, quotes |
| `warehouse` | Inventory management | Products CRUD, movements, transfers, warehouse view |
| `purchasing` | Purchase management | Purchase orders CRUD, supplier management, cost history |
| `viewer` | Read-only | View dashboards, reports, no create/update/delete |

Each role maps to a set of ~60+ permissions across all system modules (inventory, sales, purchases, customers, CRM, vehicles, reports, admin).

---

## Users (6)

| Username | Password | Role | Full Name |
|---|---|---|---|
| `admin` | `admin123` | owner | Admin User |
| `admin2` | `admin123` | administrator | Admin Secondary |
| `cashier` | `cashier123` | cashier | Cashier User |
| `cashier2` | `cashier123` | cashier | Cashier Secondary |
| `warehouse` | `warehouse123` | warehouse | Warehouse User |
| `purchasing` | `purchasing123` | purchasing | Purchasing User |

Passwords are hashed with **bcrypt** before storage.

---

## Products, Brands & Categories

### Categories (30)

Auto parts categories organized hierarchically:

| ID | Category Name | Parent |
|---|---|---|
| 1 | Filtros | NULL |
| 2 | Frenos | NULL |
| 3 | Motor | NULL |
| 4 | Suspensión | NULL |
| 5 | Eléctrico | NULL |
| 6 | Transmisión | NULL |
| 7 | Dirección | NULL |
| 8 | Refrigeración | NULL |
| 9 | Escape | NULL |
| 10 | Lubricantes | NULL |
| ... | (20 more sub-categories) | |

### Brands (31)

Product brands seeded:

| Brand Name | Country | Description |
|---|---|---|
| Bosch | Germany | Automotive parts and systems |
| NGK | Japan | Spark plugs, sensors |
| KYB | Japan | Shock absorbers, suspension |
| SKF | Sweden | Bearings, seals |
| Gates | USA | Belts, hoses |
| Valeo | France | Lighting, thermal systems |
| Continental | Germany | Tires, belts, hoses |
| Denso | Japan | Sensors, electrical |
| Monroe | USA | Shock absorbers |
| Brembo | Italy | Brake systems |
| Mann-Filter | Germany | Oil/air/fuel filters |
| Febi | Germany | Suspension, steering |
| Sachs | Germany | Clutches, suspension |
| TRW | USA | Braking, steering |
| Hella | Germany | Lighting, electronics |
| Mahle | Germany | Engine parts, filters |
| Dayco | USA | Belts, tensioners |
| ACDelco | USA | GM parts, electrical |
| Mobil | USA | Lubricants |
| Castrol | UK | Lubricants |
| Shell | UK/Netherlands | Lubricants |
| Total | France | Lubricants |
| Liqui Moly | Germany | Lubricants, additives |
| Valvoline | USA | Lubricants |
| Motul | France | Lubricants |
| Repsol | Spain | Lubricants |
| Elf | France | Lubricants |
| Wynns | USA | Additives, lubricants |
| STP | USA | Additives |
| Bardahl | USA | Additives |
| 3M | USA | Adhesives, tapes, chemicals |

### Products (144)

Sample breakdown by category:

| Category | Product Count | Examples |
|---|---|---|
| Filters | 18 | Oil filters, air filters, fuel filters, cabin filters |
| Brakes | 16 | Brake pads (front/rear), brake discs, brake shoes |
| Spark Plugs | 8 | Various NGK and Bosch models |
| Lubricants | 20 | Engine oils (5W-30, 10W-40, etc.), gear oils, hydraulic fluids |
| Belts | 8 | Timing belts, serpentine belts, V-belts |
| Suspension | 10 | Shock absorbers, struts, bushings |
| Cooling | 8 | Radiators, thermostats, coolant |
| Lighting | 6 | Headlights, taillights, bulbs |
| Bearings | 6 | Wheel bearings, clutch bearings |
| Gaskets | 4 | Head gaskets, valve cover gaskets |
| Batteries | 4 | Various capacities |
| Wipers | 4 | Wiper blades, arms |
| Sensors | 6 | O2 sensors, MAF sensors, knock sensors |
| Additives | 8 | Fuel injector cleaner, oil additives |
| Chemicals | 10 | Brake cleaner, degreaser, sealants |
| Tools | 8 | Oil filters wrenches, socket sets |

Each product has:
- Unique SKU
- Barcode (generated)
- Cost price, sale price, wholesale price
- Stock quantity (some at 0 to trigger reorder suggestions)
- Min/max stock levels and reorder points
- Link to category, brand, and warehouse/location

---

## Suppliers (24)

| Company | City | Country | Product Focus |
|---|---|---|---|
| AutoParts Bolivia SRL | Santa Cruz | BO | General auto parts |
| Distribuidora Bosch Bolivia | La Paz | BO | Bosch products |
| Importadora NGK Bolivia | Cochabamba | BO | NGK spark plugs |
| Lubricantes Mobil Bolivia | Santa Cruz | BO | Mobil oils |
| Repuestos Originales | La Paz | BO | OEM parts |
| ... (19 more) | | | |

Each supplier has contact person, phone, email, address, and tax number.

---

## Warehouses (4)

| Warehouse | Code | City | Storage Locations |
|---|---|---|---|
| Almacén Central | WH-CEN | Santa Cruz | 32 |
| Almacén Norte | WH-NOR | La Paz | 28 |
| Almacén Sur | WH-SUR | Cochabamba | 28 |
| Almacén Este | WH-EST | Beni | 24 |

Each storage location uses a zone-aisle-shelf-bin pattern (e.g. `WH-CEN-A-01-01`).

---

## Customers (347)

Mixed between individual consumers and business customers:

| Type | Count |
|---|---|
| Individuals (`individual`) | 247 |
| Workshops (`workshop`) | 50 |
| Businesses (`business`) | 30 |
| Fleet Companies (`fleet`) | 20 |

Customers are spread across Bolivian cities: Santa Cruz (~120), La Paz (~90), Cochabamba (~70), Beni (~35), others (~32).

Each customer includes:
- Name (first + last for individuals, company name for businesses)
- Phone and mobile
- Email
- Address, city, state
- Tax number (RUC/NIT) for businesses
- Preferred contact method

---

## Sales (500)

| Metric | Value |
|---|---|
| Total sales | 500 |
| Total items sold | 2,207 |
| Total revenue | ~$804,000 |
| Average ticket | ~$1,608 |
| Payment methods | Cash (55%), Card (30%), Transfer (15%) |
| Date range | Last 12 months |

Each sale has:
- Unique `sale_number`
- Customer link (most sales have a customer)
- Cashier (user) link
- Proper subtotal, tax, discount, total calculations
- Payment records
- Items deducted from inventory (movement records created)

---

## Quotes (100)

| Metric | Value |
|---|---|
| Total quotes | 100 |
| Statuses | draft (30), sent (40), accepted (15), converted (10), rejected (5) |
| Conversion rate | ~10% to sale |

Each quote has 1-5 items, proper totals, and valid-until dates.

---

## Vehicle Reference Data

### Vehicle Brands (20)

| Brand | Country | Models |
|---|---|---|
| Toyota | Japan | 6 |
| Honda | Japan | 4 |
| Nissan | Japan | 4 |
| Suzuki | Japan | 4 |
| Hyundai | South Korea | 4 |
| Kia | South Korea | 3 |
| Chevrolet | USA | 4 |
| Ford | USA | 3 |
| Volkswagen | Germany | 4 |
| BMW | Germany | 3 |
| Mercedes-Benz | Germany | 3 |
| Mitsubishi | Japan | 3 |
| Mazda | Japan | 2 |
| Subaru | Japan | 2 |
| Renault | France | 2 |
| Peugeot | France | 2 |
| Fiat | Italy | 2 |
| Jeep | USA | 2 |
| Audi | Germany | 2 |
| Lexus | Japan | 1 |

### Vehicle Models (53)

2-6 models per brand, e.g.:
- Toyota: Corolla, Hilux, Land Cruiser, Yaris, RAV4, Etios
- Honda: Civic, CR-V, Accord, City
- Nissan: Sentra, Versa, NP300, X-Trail

### Vehicle Generations (30)

15 models have 2 generations each (year ranges), e.g.:
- Toyota Corolla: 2000-2006 (9th gen), 2007-2013 (10th gen)
- Honda Civic: 2001-2005, 2006-2011

### Vehicle Engines (26)

| Engine | Displacement | Power | Fuel Type |
|---|---|---|---|
| 1.5L VVT-i | 1.5L | 108 hp | Gasoline |
| 1.8L VVT-i | 1.8L | 132 hp | Gasoline |
| 2.0L VVT-i | 2.0L | 152 hp | Gasoline |
| 2.4L VVT-i | 2.4L | 158 hp | Gasoline |
| 2.7L VVT-i | 2.7L | 161 hp | Gasoline |
| 3.0L D-4D | 3.0L | 161 hp | Diesel |
| 1.3L i-VTEC | 1.3L | 99 hp | Gasoline |
| 1.8L i-VTEC | 1.8L | 140 hp | Gasoline |
| 2.0L i-VTEC | 2.0L | 155 hp | Gasoline |
| 1.6L CRDi | 1.6L | 126 hp | Diesel |
| 2.0L CRDi | 2.0L | 184 hp | Diesel |
| ... (15 more) | | | |

### Vehicle Transmissions (9)

| Transmission | Type | Gears |
|---|---|---|
| 5-Speed Manual | manual | 5 |
| 6-Speed Manual | manual | 6 |
| 4-Speed Automatic | automatic | 4 |
| 5-Speed Automatic | automatic | 5 |
| 6-Speed Automatic | automatic | 6 |
| 8-Speed Automatic | automatic | 8 |
| CVT | CVT | — |
| 6-Speed DCT | DCT | 6 |
| 7-Speed DCT | DCT | 7 |

### Vehicle Fuels (4)

| Fuel |
|---|
| Gasoline |
| Diesel |
| Electric |
| Hybrid |

### Customer Vehicles (300)

300 vehicles assigned to customers, each with:
- Link to customer
- Brand, model, generation, engine, transmission, fuel
- License plate (generated)
- VIN (generated)
- Color, mileage, year
- Purchase date

---

## Other Seed Data

### Inventory Movements (~4,500)

- ~2,700 sale movements (outbound, from sales)
- ~1,800 manual adjustments (inbound/outbound)
- Transfers between warehouses

### Transfers (129)

Stock transfers between warehouses, each with source/destination and quantity.

### Reservations (50)

Product reservations against customers, with status tracking.

### Audit Logs (~8,900)

Comprehensive audit trail covering all seed operations:
- User creation, role changes
- Product CRUD
- Sales creation
- Inventory movements
- Quote operations

---

## Validation Report

The validation seed (`validate.seed.ts`) runs 18 checks and reports:

```
✓ Database file exists
✓ All 65 tables exist
✓ Schema version = 8
✓ ≥1 warehouse present
✓ ≥100 active products
✓ ≥50 products with stock
✓ ≥100 customers
✓ ≥10 sales
✓ ≥3 users
✓ ≥3 roles
✓ FK constraints valid
✓ No duplicate SKUs
✓ No NULL product prices
✓ All sales have items
✓ Customers have valid data
✓ Products have valid categories
✓ Price consistency (cost < sale)
✓ Stock integrity (no negative stock)
Status: 18/18 checks passed, 0 errors
```
