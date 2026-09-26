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

Click the date field to open a calendar, then pick a day. The calendar closes on
its own as soon as you pick one, and you can also dismiss it with **Enter**,
**Escape**, or a click outside. To unset a date, reopen it and choose **Clear
date**.

### Step 5: Save

Click **Save** to create the PO. Status: **Draft**.

The order is not sent to the supplier by saving. Walk it through the statuses
below to send it.

## PO Status Flow

```
Draft ──Submit for approval──▶ Pending Approval ──Approve──▶ Approved ──Send to supplier──▶ Sent
  │                                 │  │                        │                            │
  │                                 │  └──Reject──▶ Draft       │                            ├─Receive all──▶ Completed
  │                                 └──Cancel──▶ Cancelled     └──Cancel──▶ Cancelled       │
  └──Cancel──▶ Cancelled                                                                  └─Receive some──▶ Partially Received
                                                                                                  │                      │
                                                                                        Receive all ─┘──────────────────────┘
```

| Status | Meaning | Available actions |
|--------|---------|-------------------|
| Draft | Being prepared | Edit, Submit for approval, Delete |
| Pending Approval | Waiting for sign-off | Approve, Reject (back to Draft), Cancel |
| Approved | Signed off, not yet with the supplier | Send to supplier, Cancel |
| Sent | With the supplier | Receive order, Cancel |
| Partially Received | Some units still outstanding | Receive the rest |
| Completed | Every ordered unit accounted for | — |
| Cancelled | The order will not go ahead | — |

**Completed** and **Cancelled** are final. Steps that are not allowed are refused
by the backend, not just hidden in the interface, so the order's history stays
consistent no matter how it is reached.

## Receiving a PO

→ See [Receiving & Returns](/purchases/receiving)

## Considerations

- POs update stock when items are received
- Partial receiving is supported
- PO history is maintained for auditing
- Supplier products can be auto-populated from saved catalog
- The expected delivery date is optional and can be cleared again after being set
- A PO can only be edited while it is a **Draft**; any other status is refused
  and the line items are left untouched

## Related

- [Receiving](/purchases/receiving) — Receive goods
- [Supplier Products](/purchases/supplier-products) — Supplier catalog
- [Inventory](/inventory/) — Stock updates
