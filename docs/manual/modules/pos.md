# Point of Sale (POS)

## Overview

The Point of Sale module is the cashier-facing checkout interface. It supports fast product lookup, cart management, customer assignment, split payments, discount application, notes, and receipt printing. Designed for high-speed retail environments with full keyboard navigation.

## Features

### Product Search
- Search by name, SKU, barcode, or OEM number.
- Results display product name, SKU, sale price, stock quantity, category, and image.
- Keyboard shortcut: `Ctrl+F` or `/` to focus search.
- Barcode scanner input is supported via the search field (auto-submit on barcode match).

### Cart Management
- Add products by clicking search results or pressing `Enter`.
- Adjust quantity inline with +/- buttons or direct entry.
- Remove line items with the delete button.
- Line discount per item (percentage or fixed amount).
- Each line shows: product name, SKU, unit price, quantity, discount, line total.
- Running subtotal, tax, discount, and grand total are displayed.

### Customer Selection
- **CustomerSearchField** — Searchable combobox with server-side debounced search.
- Quick Add Customer dialog — Inline form to create a new customer without leaving the POS.
- Auto-selects the newly created customer.
- Customer name appears on receipt and sale record.

### Payment Split
Up to three payment methods per transaction:
- **Cash** — Enter amount tendered; change due is calculated automatically.
- **Card** — Optional reference number for card transaction ID.
- **Transfer** — Bank transfer with optional reference.

Each payment tile shows the allocated amount. The split must sum to the grand total before checkout is enabled.

### Discount
- Global discount on the entire sale (applied before tax).
- Percentage or fixed amount.
- Permission-gated — requires `sales:discount` permission.

### Notes
- Optional sale note visible on the sale record and receipt.
- Internal note (not printed) for staff reference.

### Checkout Flow
1. Validate cart has items.
2. Select payment method(s) and enter amounts.
3. Tender cash (if applicable) — change is computed.
4. Confirm checkout.
5. Backend: creates sale record, sale items, sale payments, decrements stock, generates receipt number.
6. Success dialog shows receipt number and change amount.

### Receipt Printing
- Auto-print option triggered after successful checkout.
- Receipt type configured in printer settings.
- Falls back to view-only if no printer is configured.

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+F` / `/` | Focus product search |
| `Enter` | Add selected product / confirm |
| `Ctrl+Enter` | Complete checkout |
| `Escape` | Clear search / close dialogs |
| `F2` | Quick add customer |
| `F4` | Apply discount |
| `F8` | Print receipt |
| `+` / `-` | Increase / decrease quantity |
| `Delete` | Remove selected line item |

## Validation Rules

- Cart must contain at least one item.
- Payment total must equal the grand total (within 0.01 tolerance).
- Quantity must be a positive integer.
- Quantity must not exceed available stock.
- Customer email (quick add) must be valid format if provided.
- Discount cannot exceed subtotal.
- Cash tendered must be >= cash payment amount.

## Related Modules

- [Sales](sales.md) — Sale history and invoice view.
- [Receipts](receipts.md) — Receipt management.
- [Cash Register](cash-register.md) — Session management for POS cash handling.
- [Customers](customers.md) — Customer database.
- [Inventory](inventory.md) — Product catalog and stock levels.
- [Settings](settings.md) — Receipt and printing configuration.

## Known Limitations

- No layaway or hold-sale functionality.
- No multi-store inventory check — only the current warehouse.
- Maximum of three payment splits per transaction.
- No offline mode for POS — requires database connectivity.
- Barcode scanning relies on system input; no dedicated scanner API.
