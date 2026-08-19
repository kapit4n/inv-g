# Stock & Movements

## What is it?

Stock management tracks the quantity and location of every product. Inventory movements record every change — sales, purchases, adjustments, and transfers.

![Inventory Movements](/screenshots/light/13-inventory-movements.png)

## Stock Overview

### Viewing Stock Levels

- **Products page** — Shows stock quantity for each product
- **Inventory dashboard** — Summary of total stock value and alerts
- **Stock alerts** — Products below reorder point

### Stock Status Indicators

| Status | Meaning |
|--------|---------|
| In Stock | Stock above reorder point |
| Low Stock | Stock at or below reorder point |
| Out of Stock | Stock is zero |
| Overstock | Stock exceeds maximum level |

## Inventory Movements

### What are Movements?

Every change to stock quantity is recorded as a movement with full audit trail.

### Movement Types

| Type | Description | Example |
|------|-------------|---------|
| Stock In | Product quantity increases | Receiving a purchase order |
| Stock Out | Product quantity decreases | Processing a sale |
| Adjustment | Manual correction | Physical count correction |
| Transfer | Moving between locations | Warehouse A → Warehouse B |

### How to Record a Movement

1. Go to **Inventory → Movements**
2. Click **+ New Movement**
3. Select:
   - **Product**
   - **Type** (In, Out, Adjustment)
   - **Quantity**
   - **Reference** (PO number, sale number, etc.)
   - **Notes** (optional)
4. Click **Save**

### Viewing Movement History

1. Open a product's **360° view**
2. Click the **Activity** tab
3. See all movements with timestamps and references

## Minimum Stock & Reorder

### Setting Reorder Points

On each product, set:
- **Min Stock Level** — Minimum acceptable quantity
- **Reorder Point** — Triggers reorder suggestions
- **Max Stock Level** — Maximum capacity

### Reorder Suggestions

Inventory Gear automatically suggests products to reorder based on:
- Current stock vs. reorder point
- Average sales velocity
- Supplier lead times

→ See [Purchasing → Reorder Suggestions](/purchases/supplier-products)

## Considerations

- Every stock change creates an audit trail
- Manual adjustments should include a reason in the notes
- Regular physical counts help maintain accuracy
- Movement history cannot be deleted (audit requirement)

## Related

- [Products](/inventory/products) — Product stock settings
- [Purchasing](/purchases/) — Order new stock
- [Reports → Inventory](/reports/inventory) — Stock valuation and aging
