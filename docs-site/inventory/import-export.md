# Import / Export (Excel)

## What is it?

Bulk move your product catalog in and out of Inventory Gear using Excel
(`.xlsx`) files. The feature has three parts:

- **Export inventory** — download your catalog as an Excel workbook
- **Download template** — get a blank file with the official format
- **Import inventory** — preview and execute bulk inserts / updates

## What is it for?

- Bring an existing catalog (spreadsheet, supplier price list, old system) into
  Inventory Gear in one pass instead of entering products one by one.
- Send an up-to-date catalog to a supplier, another branch, or an external
  system.
- Update prices or stock in bulk using the official format.

## How to Access

**Sidebar → Inventory → Import / Export.** Route: `/inventory/import-export`.

The page requires at least one of these permissions:

| Permission | Allowed actions |
|------------|-----------------|
| `inventory.export` | Export inventory, download template |
| `inventory.import` | Download template, import inventory |

Owner, Administrator and Warehouse roles have both by default; Purchasing has
export only. Users without any of the two permissions see a "permission
required" message.

## How to Export

### Step 1: Choose a scope

- **Active** — only products with *Activo = 1* (default).
- **All** — every product, including inactive and discontinued ones.

### Step 2: Export

Click **Export** and choose where to save the `.xlsx` file. A notification
confirms how many products were exported.

The workbook contains two sheets:

- **Productos** — one row per product with the 29 official columns (see
  [Reference format](#reference-format) below).
- **Maestros de referencia** — the reference values (categories, brands,
  manufacturers, suppliers, warehouses, storage locations) the importer must
  resolve, in `Tabla destino | Campo | Valor` form.

## How to Download the Template

The **Download template** card generates the same official workbook with an
empty *Productos* sheet. It is available to every user on the page (no
permission required) so anyone can prepare a file. The sample workbook
[`inventory-gear-product-import-example.xlsx`](/manual/samples/inventory-gear-product-import-example.xlsx)
in the docs shows the format filled with real data.

## How to Import

### Step 1: Choose a data source

Pick what the import will read:

| Source | What it does |
|--------|--------------|
| **File (Excel)** | Opens a file dialog to pick an `.xlsx` workbook (default). |
| **Demo catalog** | Uses the bundled example workbook — the same 19-product catalog as the
[sample file](/manual/samples/inventory-gear-product-import-example.xlsx) — without needing to select a file. Useful to try the import flow or to seed a fresh catalog. The same 19 products are also the **default seed** shown when the app is installed / after a schema-major upgrade, so this source simply re-imports the starter catalog. |

When **File (Excel)** is selected, the workbook must contain a *Productos*
sheet whose first row has the official headers (order flexible, unused columns
ignored).

### Step 2: Choose the mode

| Mode | Behavior |
|------|----------|
| **Append** (Add) | Adds new products. A row whose product already exists is **skipped** ("Existing"). |
| **Update** | Applies row values onto existing products. Only **non-empty** columns are written; **Stock inicial is the absolute resulting stock** (the difference is recorded as an inventory movement). Rows that match nothing are **skipped**. |

In a multi-store business the **store selector** appears; the import runs
against that store and rows must belong to that warehouse.

### Step 3: Preview

Click **Preview**. Every row is classified with no data being written:

- **Create** — will insert a new product
- **Update** — will update an existing product
- **Skip** — will be ignored (already exists in Append, or no match in Update)
- **Error** — will block the import (see below)

The preview shows per-row SKU, name, action, reason, current/new stock and the
stock change. Summary badges show insert/update/skip/error counts and
stock-increase/decrease counts. If more than 500 rows are present, only the
first 500 are shown and a "truncated" badge is displayed.

Rows are identified by **SKU**, then **Código** (OEM / internal / identifier),
then **Código de barras** — the first match in that order wins.

### Step 4: Import

If every row is valid (zero errors), click **Import now**. The import is
**all-or-nothing**:

- The file is re-validated on the server before anything is written.
- All inserts/updates and their stock movements happen in a single
  transaction. If anything fails midway, the whole import is rolled back.
- Success records a **stock movement** per changed product (type *import*) and
  an entry in the **import history**.

If any row has a blocking error, the **Import now** button is disabled and the
errors are listed under *Errors in file*. Correct the file and preview again.

### Import history

Every executed import is recorded: file name, mode, created/updated/skipped
counts, errors, stock delta, who ran it, and when.

## Reference Format

The *Productos* sheet uses these 29 columns (the order of the official
template):

| # | Column | Notes |
|---|--------|-------|
| 1 | N° | Row index (ignored) |
| 2 | Código | `oem_number`, `internal_code` and a cross-reference of type *oem* |
| 3 | Código_2 | Cross-reference of type *alternate* |
| 4 | SKU | Unique SKU; if empty it is derived from Código_2, then Código |
| 5 | Nombre | Product name |
| 6 | Descripción | Product description |
| 7 | Categoría | Category name (from refs sheet) |
| 8 | Marca | Brand name (from refs sheet) |
| 9 | Fabricante | Manufacturer name (from refs sheet) |
| 10 | Proveedor | Supplier name (from refs sheet) |
| 11 | Precio de compra (costo) | Cost price |
| 12 | Precio de venta | Sale price (final display price) |
| 13 | Precio mayorista | Wholesale price |
| 14 | Precio sugerido | Suggested retail price (reference only) |
| 15 | % de ganancia | Per-product gain margin over cost (empty = use the global default) |
| 16 | Precio editado | Optional manual price override (empty = automatic) |
| 17 | Impuesto (%) | Tax rate |
| 18 | Stock inicial | Initial/absolute stock quantity |
| 19 | Stock mínimo | Min stock level |
| 20 | Stock máximo | Max stock level |
| 21 | Punto de reorden | Reorder point |
| 22 | Unidad | Unit (pcs, kg, L, …) |
| 23 | Peso (kg) | Weight in kg |
| 24 | Código de barras | Barcode (used to match rows) |
| 25 | Almacén | Warehouse code (from refs sheet) |
| 26 | Ubicación | Storage location code (from refs sheet) |
| 27 | URL imagen | Image URL |
| 28 | Activo | `1`/`0` (1 = active) |
| 29 | Descontinuado | `1`/`0` (0 = not discontinued) |

### How prices are decided on import

The final sale price of a product is its **effective price**:

`Precio editado` → if provided, it wins (it locks the sales price).
`% de ganancia` → otherwise, if provided, the sale price is calculated as
`costo × (1 + %/100)`.
`Precio de venta` → otherwise, if provided (legacy files), it is stored as an
**edited** price so the price is preserved.
Nothing → existing values are kept (Update mode), or the price is suggested
from the global default gain (Append mode).

Import rules:

1. **Identification** — rows match by SKU → Código → barcode, in that order.
2. **References** — Categoría, Marca, Fabricante, Proveedor, Almacén and
   Ubicación values must match the names/codes in the *Maestros de referencia*
   sheet; the errors suggest the closest existing value when the spelling is
   close.
3. **Required identity** — a row without SKU, Código or barcode is an error.
4. **Numbers** — a cell that should be numeric but is not is a row error; the
   entire import is blocked until cleared.
5. **Stock absolutes** — in Update mode, Stock inicial is the resulting stock,
   not an increment; the movement is the difference.
6. **Pricing precedence** — `Precio editado` > `% de ganancia` > `Precio de
   venta` (legacy) > existing value / suggested from the global default. See
   [How prices are decided on import](#how-prices-are-decided-on-import).

## Considerations

- Always **preview** before importing; nothing is written until you click
  **Import now**.
- The import is transactional — a partial import never leaves the database in
  a half-applied state.
- Run a **backup** before large bulk imports (Settings → Database → Backup).
- In multi-store setups, pick the correct store first; rows from another
  warehouse will error.
- Empty cells keep the current value in Update mode, so you can update only
  prices (one column) without touching anything else.
- Files created with the previous 27-column layout are not recognized
  automatically: add the two new columns **% de ganancia** and **Precio
  editado** (after **Precio sugerido**) before importing, or re-export a fresh
  template.
- `% de ganancia` and `Precio editado` export exactly what is stored — an
  empty `% de ganancia` means the product follows the global default
  configured in Settings → Business.

## Related

- [Products](/inventory/products) — single-product management
- [Stock & Movements](/inventory/stock-movements) — how stock is tracked
- [Cross References](/inventory/cross-references) — OEM/cross-reference lookup