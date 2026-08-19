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

- [Categories & Brands](/inventory/categories-brands) — Organize products
- [Cross References](/inventory/cross-references) — OEM number lookup
- [Point of Sale](/sales/pos) — Sell products
