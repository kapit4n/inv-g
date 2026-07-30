# Returns

## Overview

The Returns module provides a dedicated interface for processing sale returns and refunds. It supports partial and full returns, multiple refund methods, and automatic stock reversal.

## Features

### Select Sale
- Search for the original sale by sale number, receipt number, or customer name.
- Results show sale date, total, payment method, and customer.
- Select a sale to load its items for return processing.

### Return Form
- **Sale Info**: Displays the original sale number, date, customer, and payment method.
- **Items Table**: Lists all items from the original sale with:
  - Product name, SKU, original quantity, unit price.
  - Editable "Return Quantity" field for each item.
  - Non-negative, cannot exceed original quantity minus previously returned quantity.
- **Reason Selection**: Dropdown with predefined reason categories:
  - Defective / Damaged
  - Wrong Item
  - Customer Changed Mind
  - Warranty Claim
  - Other
- **Refund Method**: Choose how to issue the refund:
  - Original Payment Method
  - Store Credit
  - Cash
  - Card
  - Transfer
- **Notes**: Optional internal note about the return.

### Refund Processing
1. Verify the sale and select items to return.
2. Enter return quantities.
3. Select reason and refund method.
4. Confirm return.
5. Backend operations:
   - Creates a return record with the selected items.
   - Reverses stock quantities (adds back to inventory).
   - Generates a credit transaction if store credit.
   - Updates the sale status to Partially/Fully Refunded.
   - Creates an inventory movement of type "return".
6. Success screen shows refund summary.

### Return List
- Paginated table of all returns.
- Columns: Return Number, Sale Number, Customer, Total Refunded, Reason, Status, Date.
- Search and filter by date range, reason, status.

## Available Actions

| Action | Description |
|--------|-------------|
| New Return | Start a new return by selecting a sale |
| View Return | Open return detail |
| Print Return Receipt | Print the return receipt |
| Export Returns | Export return list to CSV/XLSX |

## Validation Rules

- Return quantity must be >= 1.
- Return quantity must not exceed available returnable quantity (original - previously returned).
- A sale must be in "Paid" or "Partially Refunded" status.
- Cannot return items from a cancelled sale.
- Refund reason is required.
- Refund method is required.

## Related Modules

- [Sales](sales.md) — Original sale record and status.
- [Inventory](inventory.md) — Stock reversal on return.
- [Cash Register](cash-register.md) — Refund affects register balance.
- [Customers](customers.md) — Credit transactions for store credit refunds.

## Known Limitations

- No exchange workflow — use return + new sale.
- No restocking fee configuration.
- No approval workflow for high-value returns.
- Returns cannot be partially reversed once processed.
