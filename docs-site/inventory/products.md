# Products

## What is it?

Products are the items you sell and track in inventory. Each product has pricing, stock levels, identifiers, and supplier information.

![Products List](/screenshots/light/04-product-list.png)

## What is it for?

Maintain a complete catalog of all parts and products your business deals with, including automotive parts with OEM cross-references.

## How to Access

**Sidebar → Inventory → Products**. Route: `/inventory/products`.

## How to Create a Product

### Step 1: Click "New Product"

Click the **+ New Product** button on the products page.

### Step 2: Fill in Basic Information

| Field | Required | Description |
|-------|----------|-------------|
| Name | Yes | Product name |
| SKU | Yes | Unique stock-keeping unit (auto-generated or manual) |
| Barcode | No | EAN/UPC barcode for scanning |
| OEM Number | No | Original equipment manufacturer number |
| Internal Code | No | Your internal reference code |
| Description | No | Product description |

### Step 3: Set Pricing

| Field | Description |
|-------|-------------|
| Cost Price | What you pay the supplier |
| Sale Price | Price charged to customers |
| Wholesale Price | Bulk/wholesale price |
| Suggested Retail Price | MSRP reference |
| Tax Rate | Applicable tax percentage |

### Step 4: Set Stock Levels

| Field | Description |
|-------|-------------|
| Stock Quantity | Current physical count |
| Min Stock Level | Minimum before alert |
| Max Stock Level | Maximum capacity |
| Reorder Point | Triggers reorder suggestion |
| Unit | Measurement unit (pcs, kg, L, etc.) |

### Step 5: Assign Organization

- **Category** — Product category (e.g., Brakes)
- **Brand** — Product brand (e.g., Bosch)
- **Manufacturer** — Manufacturing company
- **Warehouse** — Primary storage location
- **Storage Location** — Specific shelf/bin

### Step 6: Save

Click **Save** to create the product.

## Product 360° View

Click any product to see the full detail view with 7 tabs:

| Tab | Content |
|-----|---------|
| Overview | Basic info, pricing, stock summary |
| Inventory | Stock levels, movements history |
| Pricing | Price history, cost changes |
| Suppliers | Supplier associations, lead times |
| Compatibility | Vehicle compatibility matrix |
| Identifiers | Cross-reference numbers (OEM, aftermarket, etc.) |
| Activity | Timeline of changes |

## How to Edit a Product

1. Click the product in the list
2. Click the **Edit** button (pencil icon)
3. Modify fields
4. Save changes

## How to Archive a Product

1. Open the product detail
2. Click **Archive** in the actions
3. The product is removed from active listings but data is preserved

::: tip
Archived products can be restored from the inventory dashboard.
:::

## Search & Filter

- **Search bar** — Search by name, SKU, barcode, OEM number
- **Category filter** — Filter by product category
- **Brand filter** — Filter by brand
- **Stock status** — Filter by in-stock, low-stock, out-of-stock

## Cross References

Products support multiple cross-reference identifiers:
- **OEM Numbers** — Original manufacturer part numbers
- **Aftermarket** — Third-party equivalent numbers
- **Interchange** — Compatible replacement numbers
- **Supersession** — Updated/replacement part numbers

→ See [Cross References](/inventory/cross-references) for searching by identifier.

## Import Reference Template (Example)

A future bulk-import feature needs a stable, complete data shape. The reference
template below is the **extended version** of the demo catalog table used in
`npm run db:demo`: it starts from the original source columns (`Código`,
`Código_2`, `Nombre`, `Precio/u`, `Categoría`, `Marca`, `Cant`) and adds every
field a full product record requires so the file round-trips with the
`products` table (and its `product_identifiers` cross-references).

> 📥 [Download the example workbook](/manual/samples/inventory-gear-product-import-example.xlsx)
> (Open XML `.xlsx`, 2 sheets: `Productos` = 19 real catalog rows, `Maestros de
> referencia` = the categories/brands/supplier/warehouse/locations the importer
> must resolve to IDs)

### Column map

| Excel column | Target table/field | Source/example value |
|--------------|--------------------|----------------------|
| N° | — (row index) | 1 |
| Código | `products.oem_number`, `products.internal_code`, `product_identifiers` (type `oem`) | 860067 |
| Código_2 | `product_identifiers` (type `alternate`) | 124846 |
| SKU | `products.sku` (unique) | `Código_2` ?; falls back to `Código` |
| Nombre | `products.name` | MUÑON DIREC. TOY COROLLA/IPSU 84/95 |
| Descripción | `products.description` | (defaults to name) |
| Categoría | `categories.name` → `products.category_id` | Dirección / Suspensión |
| Marca | `brands.name` → `products.brand_id` | Toyota Genuine / TRW |
| Fabricante | `manufacturers.name` → `products.manufacturer_id` | (empty) |
| Proveedor | `suppliers.company_name` → `products.supplier_id` | Autorepuestos Demo SRL |
| Precio de compra (costo) | `products.cost_price` | 70% of price |
| Precio de venta | `products.sale_price` | price |
| Precio mayorista | `products.wholesale_price` | 85% of price |
| Precio sugerido | `products.suggested_retail_price` | 115% of price |
| Impuesto (%) | `products.tax_rate` | 0 |
| Stock inicial | `products.stock_quantity` | Cant |
| Stock mínimo | `products.min_stock_level` | 1 |
| Stock máximo | `products.max_stock_level` | 3 × stock |
| Punto de reorden | `products.reorder_point` | 2 |
| Unidad | `products.unit` | pcs |
| Peso (kg) | `products.weight` | (empty) |
| Código de barras | `products.barcode` | (empty) |
| Almacén | `warehouses.code` → `products.warehouse_id` | WH-001 |
| Ubicación | `storage_locations.code` → `products.storage_location_id` | WH-001-A-01-A-01 |
| URL imagen | `products.image_url` | (empty) |
| Activo | `products.is_active` | 1 |
| Descontinuado | `products.is_discontinued` | 0 |

### Import rules the importer must honor (from this example)

1. **SKU uniqueness** — `sku` is `UNIQUE`; derive from `Código_2` with fallback to `Código`, and fail on collision.
2. **Reference resolution** — `Categoría`, `Marca`, `Proveedor`, `Almacén`, `Ubicación` arrive as names/codes and must be resolved to IDs (autocreate categories/brands/suppliers/warehouses when missing).
3. **Cross-references** — write one `product_identifiers` row with type `oem` for `Código` and type `alternate` for `Código_2` (when present), so both codes are searchable from the Cross References page.
4. **Defaults** — blank optional fields (description → name, tax → 0, unit → pcs, active → 1) mirror the demo seed behavior.

## Considerations

- SKUs must be unique across all products
- Barcodes should be unique for POS scanning
- Setting accurate stock levels is critical for inventory management
- Use the "Product 360°" view for a complete product overview

## Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "SKU already exists" | Duplicate SKU | Use a unique SKU |
| "Category required" | Missing category | Select or create a category |
| Stock negative | More sold than available | Check physical stock count |

## Related

- [Import / Export](/inventory/import-export) — bulk Excel import/export
- [Categories & Brands](/inventory/categories-brands) — Organize products
- [Cross References](/inventory/cross-references) — OEM number lookup
- [Point of Sale](/sales/pos) — Sell products
