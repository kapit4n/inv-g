# Purchase Orders

## What is it?

Purchase Orders (POs) are formal documents sent to suppliers to order stock.

![Purchase Orders](/screenshots/light/24-purchase-orders.png)

## How to Access

**Sidebar → Purchases → Orders**. Route: `/purchases/orders`.

## How to Create a Purchase Order

### Step 1: Click "New Order"

Click the **+ New Purchase Order** button.

### Step 2: Select Supplier

Choose the supplier from the dropdown.

### Step 3: Add Products

- Search for products
- Enter **quantity** and **unit cost**
- Add multiple line items

### Step 4: Review

- Check subtotal, tax, and total
- Add **notes** if needed
- Set **expected delivery date**

### Step 5: Save & Send

Click **Save** to create the PO. Status: **Draft**.

Change status to **Sent** when sent to the supplier.

## PO Status Flow

```
Draft → Sent → Confirmed → Partially Received → Received → Closed
                    ↓
                Cancelled
```

| Status | Meaning |
|--------|---------|
| Draft | Being prepared |
| Sent | Sent to supplier |
| Confirmed | Supplier confirmed |
| Partially Received | Some items received |
| Fully Received | All items received |
| Closed | PO completed |
| Cancelled | PO cancelled |

## Receiving a PO

→ See [Receiving & Returns](/purchases/receiving)

## Considerations

- POs update stock when items are received
- Partial receiving is supported
- PO history is maintained for auditing
- Supplier products can be auto-populated from saved catalog

## Related

- [Receiving](/purchases/receiving) — Receive goods
- [Supplier Products](/purchases/supplier-products) — Supplier catalog
- [Inventory](/inventory/) — Stock updates
