# Purchasing

## Overview

The Purchasing module manages the full procurement lifecycle: purchase requests, purchase orders, goods receiving, purchase returns, cost history tracking, and reorder suggestions. It also includes a supplier product catalog and supplier performance analytics.

## Features

### Purchasing Dashboard
- Pending orders count.
- Orders awaiting approval.
- Orders awaiting delivery.
- Today's expected receipts.
- Monthly purchase total and order count.
- Recent orders list.
- Reorder suggestions summary.
- Top suppliers by volume.

### Purchase Orders
Full purchase order lifecycle with status workflow:

```
Draft → Sent → Approved → Received → Completed
  ↓        ↓        ↓
Cancelled Cancelled Cancelled
```

**Purchase Order Fields:**
- PO number (auto-generated).
- Supplier, Warehouse, Buyer.
- Order date, expected delivery date.
- Currency, payment terms, shipping method.
- Reference number (e.g., customer PO#).
- Items: product, supplier SKU, quantity, unit cost, discount, tax, line total.
- Subtotal, tax, discount, shipping cost, grand total.
- Notes, approval tracking (approved by, approved at, sent at).
- Status tracking with timestamps.

**Available Actions:**
- Create PO (status: Draft).
- Edit PO (Draft only).
- Submit PO (Draft → Sent).
- Approve PO (Sent → Approved).
- Cancel PO (any status except Received/Completed).
- Receive PO (Approved → Received) — opens the Purchase Receipt form.
- Complete PO (Received → Completed).
- Print PO.
- Duplicate PO.

### Purchase Requests
Internal requests to procure stock.

- Request number, requester, warehouse, priority (Low/Normal/High/Urgent).
- Status: Pending, Approved, Ordered, Rejected.
- Items: product, requested quantity, current stock, min stock level.
- Reason for request and required date.

### Purchase Receipts
Goods receiving against a purchase order.

1. Select a Pending/Approved PO.
2. For each line item, enter:
   - Expected quantity (pre-filled from PO).
   - Received quantity (actual goods received).
   - Damaged quantity (defective items).
   - Accepted quantity = received - damaged (auto-calculated).
3. Optional notes about the receipt.
4. Confirm receipt.
5. Backend:
   - Updates PO item received/damaged quantities.
   - Updates PO status if all items fully received.
   - Creates inventory movement of type "purchase" for accepted quantity.
   - Updates product cost price (if cost differs from previous).
   - Records cost history entry.

### Purchase Returns
Return goods to a supplier.

- Create return against a purchase order or directly for a supplier.
- Select items and quantities to return.
- Provide reason for return.
- Status: Pending, Approved, Shipped, Refunded, Closed.

### Supplier Products Catalog
A cross-reference of products available from each supplier.

- Supplier product SKU mapping.
- Preferred supplier flag.
- Minimum order quantity.
- Lead time in days.
- Default cost and currency.
- Status tracking.

### Cost History
Tracks every change in product cost price.

- Product, supplier, purchase order reference.
- Old cost → New cost transition.
- Quantity at which the cost was set.
- Who made the change and when.

### Reorder Suggestions
Automatically generated restock recommendations.

- Products where stock quantity ≤ reorder point.
- Displays: current stock, min stock, reorder point, max stock, sale price, cost price.
- Pending PO quantity and reserved quantity factored in.
- Suggested order quantity calculated.
- Preferred supplier displayed for one-click PO creation.

### Supplier Performance
Analytics on each supplier:

- Total orders, completed, cancelled.
- Average delivery days.
- Total amount purchased.
- Average cost, return rate.
- Late delivery count.
- Composite preferred score for ranking.

## Available Actions

| Action | Description |
|--------|-------------|
| CRUD Purchase Orders | Create, edit, delete, approve, cancel POs |
| Create Purchase Request | Submit a new stock request |
| Receive PO | Process goods receipt against a PO |
| Create Purchase Return | Return goods to supplier |
| Manage Supplier Products | Link products to suppliers with pricing |
| View Cost History | Track product cost changes over time |
| View Reorder Suggestions | Generate and act on restock recommendations |
| View Supplier Performance | Analytics dashboard per supplier |
| Export All Lists | Export to CSV/XLSX |

## Validation Rules

- PO must have at least one line item.
- PO item quantity must be a positive integer.
- Received quantity cannot exceed ordered quantity.
- Damaged quantity cannot exceed received quantity.
- Cannot receive more than the ordered quantity for any line.
- Purchase request priority is required.
- Product-supplier link is unique (one product per supplier once).
- Cost history is auto-recorded; manual entries not allowed.

## Related Modules

- [Inventory](inventory.md) — Stock updates on receipt, product catalog.
- [Suppliers](suppliers.md) — Supplier profiles.
- [Reports](reports.md) — Purchasing and supplier reports.
- [Inventory Movements](inventory.md#inventory-movements) — Auto-generated on receipt/return.

## Known Limitations

- No partial receipt workflow (receipt is all-or-nothing per line).
- No automated PO generation from reorder suggestions (manual conversion).
- No landed cost calculation (shipping, duties, etc. not split across items).
- No EDI or electronic PO transmission.
- No drop-ship workflow.
