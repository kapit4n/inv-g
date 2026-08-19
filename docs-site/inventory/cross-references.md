# Cross References

## What is it?

Cross References let you search for products using any identifier — OEM numbers, aftermarket part numbers, interchange numbers, or custom codes.

![Cross References](/screenshots/light/13-inventory-movements.png)

## What is it for?

In the automotive parts industry, the same part may have multiple numbers:
- **OEM Number** — Original manufacturer part number
- **Aftermarket** — Third-party equivalent
- **Interchange** — Compatible replacement from different brand
- **Supersession** — Updated/replacement part number
- **Cross Reference** — Alternative identifier

Cross References lets you find the right product regardless of which number you have.

## How to Access

**Sidebar → Inventory → Cross References**. Route: `/inventory/cross-references`.

## How to Search

### Step 1: Enter an Identifier

Type any identifier into the search box:
- OEM number (e.g., "04465-33471")
- Barcode
- SKU
- Product name
- Aftermarket part number

### Step 2: Click Search

Results show matching products from:
- Product fields (SKU, barcode, OEM, name)
- Product identifiers table (all types)

### Step 3: View Results

Each result shows:
- Product name and SKU
- Category and brand
- Price and stock quantity
- Matched identifier and type

## Adding Identifiers to Products

### Step 1: Open Product Detail

Navigate to a product's 360° view.

### Step 2: Click Identifiers Tab

Click the **Identifiers** tab.

### Step 3: Add Identifier

1. Click **+ Add**
2. Enter the **Identifier** (the part number)
3. Select the **Type** (OEM, aftermarket, etc.)
4. Optionally add **Brand name** and **Notes**
5. Click **Save**

## Identifier Types

| Type | Description |
|------|-------------|
| OEM Number | Original equipment manufacturer number |
| Aftermarket | Third-party equivalent number |
| Interchange | Compatible replacement number |
| Supersession | Updated/replacement part number |
| Cross Reference | Alternative identifier |

## Considerations

- Identifiers are linked to specific products
- One product can have many identifiers
- Search is exact-match with LIKE fallback
- Identifiers group by type in the product view

## Related

- [Products](/inventory/products) — Product management
- [Part Finder](/manual/part-finder) — Vehicle-to-part search
