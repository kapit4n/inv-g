# Receiving & Returns

## What is it?

Receive goods against purchase orders, process purchase returns, and manage incoming inventory.

![Purchase Receipts](/screenshots/light/28-purchase-receipts.png)

## Receiving Goods

### How to Receive

1. Go to **Purchases → Receipts**
2. Click **+ New Receipt**
3. Select the **Purchase Order**
4. Verify items and quantities received
5. Enter any **discrepancies**
6. Assign **storage locations**
7. Click **Receive**

### What Happens

- Stock quantities are updated
- PO status changes to Received (or Partially Received)
- A receipt record is created
- Movement entries are logged

## Purchase Returns

### How to Return

1. Go to **Purchases → Returns**
2. Select the receipt or PO
3. Choose items and quantities to return
4. Enter return reason
5. Process the return

### What Happens

- Stock quantities are reduced
- A return record is created
- Supplier is notified (if configured)

## Considerations

- Always verify quantities against the PO before receiving
- Discrepancies should be documented
- Partial receiving is supported for large orders
- Returns require a reason for audit trail

## Related

- [Purchase Orders](/purchases/orders) — Create POs
- [Inventory](/inventory/) — Stock movements
