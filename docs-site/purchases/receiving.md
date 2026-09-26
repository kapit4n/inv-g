# Receiving & Returns

## What is it?

Receive goods against purchase orders, process purchase returns, and manage incoming inventory.

![Purchase Receipts](/screenshots/light/28-purchase-receipts.png)

## Receiving Goods

Goods are received against a purchase order that is already with the supplier.
You start from the order, not from this list — the list only shows what has
already been received.

### How to Receive

1. Go to **Purchases → Orders**
2. Open the order you are receiving. It must be **Sent** or **Partially Received**
3. Click **Receive Order**
4. Check the **Outstanding** column — it is what the supplier still owes you
5. Enter how many units arrived in **Received**, and any broken units in **Damaged**
   - each line is pre-filled with the outstanding quantity, so a complete delivery
     is just a click on **Mark Received**
6. Choose the **Warehouse** that receives the goods (the order's own warehouse is
   pre-selected) and add **Notes** if needed
7. Click **Mark Received**

::: tip Only accepted units reach stock
Stock is increased by `Received − Damaged`. A line recorded as fully damaged is
still recorded on the order, but adds nothing to inventory.
:::

### What Happens

- A numbered receipt is created and you are taken to it
- Stock is increased by the accepted units, in the chosen warehouse
- Movement entries are logged
- The PO becomes **Completed** when every ordered unit is accounted for, or
  **Partially Received** while anything is still outstanding
- The order's cost price is updated when the purchase price differs, and the old
  price is kept in the cost history

### Statuses

A purchase order moves through:

| Status | Meaning | Next step |
|--------|---------|-----------|
| Draft | Being written | Submit for approval |
| Pending Approval | Waiting for sign-off | Approve or reject |
| Approved | Signed off, not yet with the supplier | Send to supplier |
| Sent | With the supplier | Receive, or cancel |
| Partially Received | Some units outstanding | Receive the rest |
| Completed | Every ordered unit accounted for | — |
| Cancelled | Order will not go ahead | — |

**Completed** and **Cancelled** are final. An order can only be received once it
has been sent, and sending is only possible once it has been approved.

## Purchase Returns

### How to Return

1. Go to **Purchases → Returns**
2. Select the purchase order to return against
3. Choose items and quantities to return
4. Enter return reason
5. Press **Create Return**

The return is filed against the order's supplier, so an order that has no supplier
cannot be returned: the button stays disabled and says why until you pick an order
that has one.

### What Happens

- Stock quantities are reduced
- A return record is created
- The supplier of the selected order is recorded on it
- Supplier is notified (if configured)

## Considerations

- Always verify quantities against the PO before receiving
- Discrepancies should be documented — use **Notes** and the **Damaged** column
  rather than adjusting the ordered quantity
- Partial receiving is supported for large orders; the order stays open until
  the last unit arrives
- A line cannot claim more units than are outstanding
- Returns require a reason for audit trail
- The return always needs a supplier, which it takes from the selected order
- With a single warehouse it is preselected on the receiving form; see
  [Warehouses](/inventory/warehouses)
- Cancelling an order does not undo stock already received

## Related

- [Purchase Orders](/purchases/orders) — Create POs
- [Inventory](/inventory/) — Stock movements
