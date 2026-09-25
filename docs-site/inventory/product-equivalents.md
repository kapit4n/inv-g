# Product Equivalents

## What is it?

Product Equivalents link two products that are interchangeable — the same part sold under a different SKU, brand, or supplier. When one runs out of stock, the other can be offered as a substitute.

## What is it for?

In parts retail, the same physical part is frequently catalogued as several different products. Common cases:

- The same part carried under two brands (aftermarket vs. OEM equivalent)
- An old SKU superseded by a newer one
- The same part in a different unit of measure or packaging

Equivalents let you:

- **Substitute at the register** — POS suggests an in-stock equivalent when a product has no stock
- **Keep the catalog clean** — one relationship instead of relying on staff memory
- **Bulk-load relationships** — import them from a spreadsheet alongside your catalog

## How to Access

**Sidebar → Inventory → Products → open a product → Equivalents tab**. Route: `/inventory/products/:id`.

The Equivalents tab sits between **Identifiers** and **Activity** in the product 360° view.

## How to Use

### Adding an equivalent

1. Open a product and go to the **Equivalents** tab.
2. Click **+ Add**.
3. Search for the other product by name or SKU.
4. Click the result in the list to link it.
5. Optionally type a **Note** before selecting the product (e.g. "same Bosch pad, half price").
6. The relationship is saved immediately and the tab reloads.

### Removing an equivalent

Click the **Delete** button on the equivalent's card.

### Suggesting equivalents at the point of sale

1. In the POS, search for a product.
2. Click a product that shows **Out of stock**.
3. If that product has equivalents, a panel appears listing the ones that are **active and in stock**.
4. Click an equivalent to add it to the cart instead.

If none of the equivalents have stock, the panel says so and nothing is added to the cart.

## Import / Export

Equivalents can be loaded in bulk from the product spreadsheet.

### Spreadsheet format

The workbook has a dedicated **Productos equivalentes** sheet with five columns:

| Producto | SKU producto | Producto equivalente | SKU equivalente | Nota |
|----------|--------------|----------------------|-----------------|------|
| Pastilla Delantero Bosch | BRK-100 | Pastilla Delanero Iridium NGK | BRK-150 | Mismo amortiguador |

- Columns **B** (`SKU producto`) and **D** (`SKU equivalente`) identify the two products by SKU. Both must already exist (or be created earlier in the same import).
- The human-readable **Producto** columns are labels only; matching is done by SKU.
- The order does not matter — a pair is stored once regardless of direction.
- Duplicate pairs are skipped.
- Self-references and unknown SKUs cause a validation error that blocks the import.

::: tip
Download the catalog template from **Import / Export → Download template** to get the sheet with the correct headers and an example row.
:::

### Exporting

Export your catalog to get the current equivalents in a sheet you can edit and re-import.

## Considerations

- Relationships are **one-to-one pairs**, not groups. Linking A–B and B–C does not create an A–C link.
- A product cannot be linked to itself.
- The POS only suggests equivalents that are **active and have stock**.
- Notes are free text and are not interpreted by the app.
- Removing an equivalent only deletes the relationship; the products themselves are untouched.

## Related

- [Products](/inventory/products) — Product management
- [Cross References](/inventory/cross-references) — Search by OEM/aftermarket numbers
- [Import / Export](/inventory/import-export) — Bulk catalog operations
- [POS](/sales/pos) — Point of sale
