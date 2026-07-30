# Sales

## Overview

The Sales module displays the complete history of POS transactions. Users can search, filter, view detailed sale information, process refunds, and print invoices.

## Features

### Sales List
- Paginated data table with sortable columns.
- Columns: Sale Number, Customer, Total, Payment Method, Payment Status, Items, Date.
- Search by sale number, customer name, or notes.
- Filter by date range, payment method, payment status, warehouse, or cashier.
- Row click navigates to sale detail.

### Sale Detail
- **Header**: Sale number, receipt number, date, status, cashier name.
- **Customer Info**: Name, contact details, credit account balance (if applicable).
- **Items Table**: Product name, SKU, quantity, unit price, discount, line total.
- **Payments**: List of payments with method, amount, reference, change given.
- **Totals**: Subtotal, discount, tax, grand total.
- **Notes**: Customer-facing and internal notes.
- **Actions**: Print receipt, view invoice, process refund.

### Refund Workflow
1. Navigate to sale detail.
2. Click "Process Refund".
3. Select items and quantities to refund.
4. Select refund reason from predefined list.
5. Choose refund method (original payment method or store credit).
6. Confirm refund.
7. Backend: creates refund record, reverses stock, updates sale status.
8. Receipt is generated for the refund transaction.

### Invoice View
- Printable invoice layout with company header, customer info, itemized table, totals, and payment details.
- Print and PDF export options.

### Sale Statuses
- **Paid** — Completed and fully paid.
- **Partially Refunded** — One or more items have been returned.
- **Fully Refunded** — Entire sale has been returned.
- **Cancelled** — Sale voided before fulfillment.

## Available Actions

| Action | Description |
|--------|-------------|
| View Detail | Click any row to open the sale detail page |
| Print Receipt | Reprint the original sale receipt |
| View Invoice | Open the invoice view for printing/PDF |
| Process Refund | Initiate a partial or full refund |
| Export Sale List | Export the current filtered list to CSV/XLSX |

## Validation Rules

- Refund quantity cannot exceed the original sale quantity.
- Refund reason is required.
- A fully refunded sale cannot be refunded again.
- Refund amount cannot exceed the original total minus previous refunds.

## Related Modules

- [POS](pos.md) — Creating new sales.
- [Returns](returns.md) — Dedicated returns interface.
- [Receipts](receipts.md) — Receipt management.
- [Customers](customers.md) — Customer purchase history.
- [Closeout](closeout.md) — End-of-day sales summary.

## Known Limitations

- No bulk refund (multiple sales at once).
- No exchange workflow — exchanges are handled as refund + new sale.
- Refund cannot be partially processed across different payment methods.
