# Quotes

## Overview

The Quotes module enables the creation and management of customer price quotations. Quotes can be created before a sale, shared with customers, and later converted into sales with a single action.

## Features

### Quote List
- Paginated table with columns: Quote Number, Customer, Total, Status, Valid Until, Items, Date.
- Search by quote number, customer name.
- Filter by status (Draft, Sent, Accepted, Expired, Converted) and date range.
- Quick status badges with color coding.

### Quote Status Workflow

```
Draft → Sent → Accepted → Converted to Sale
  ↓        ↓        ↓
Cancelled Cancelled Expired
```

- **Draft** — Being edited, not yet shared with customer.
- **Sent** — Delivered to customer, awaiting response.
- **Accepted** — Customer approved the quote.
- **Converted** — Quote has been turned into a sale.
- **Expired** — Past the validity date without acceptance.
- **Cancelled** — Voided by staff.

### Create / Edit Quote
- **Header**: Quote number (auto-generated), date, valid until date.
- **Customer**: Select via CustomerSearchField with quick add.
- **Items**: Add products from the product catalog. Each line includes product, quantity, unit price, discount, and line total.
- **Tax**: Global tax rate applied to the subtotal.
- **Discount**: Global discount (percentage or fixed) applied before tax.
- **Notes**: Customer-facing notes (printed on quote).
- **Terms & Conditions**: Free-text terms field.

### Convert Quote to Sale
1. Open the quote detail.
2. Click "Convert to Sale".
3. Optional: modify quantities or prices before conversion.
4. Confirm conversion.
5. Creates a new sale in "Paid" or "Pending" status.
6. Quote status updates to "Converted".
7. User is redirected to the new sale.

### Quote Detail
- Full quote view with header, customer info, line items, totals, and notes.
- Print-friendly layout.
- Actions: Edit, Delete (draft only), Send, Convert to Sale, Print.

## Available Actions

| Action | Description |
|--------|-------------|
| Create Quote | Start a new draft quote |
| Edit Quote | Modify an existing draft or sent quote |
| Delete Quote | Remove a draft quote (soft delete) |
| Send Quote | Mark as sent (triggers no actual email) |
| Convert to Sale | Create a sale from the quote |
| Print Quote | Print the quote document |
| Duplicate Quote | Create a copy of an existing quote |

## Validation Rules

- At least one line item is required.
- Quantity must be a positive integer.
- Valid until date must be in the future (for draft/sent quotes).
- Cannot convert an expired or cancelled quote.
- Cannot edit a converted quote.
- Deleting a quote requires confirmation.

## Related Modules

- [POS](pos.md) — Quotes can be converted to sales.
- [Sales](sales.md) — Result of quote conversion.
- [Customers](customers.md) — Customer linked to quote.

## Known Limitations

- No email integration — "Send" is a status update only.
- No PDF generation on the backend; print uses browser print.
- No quote template customization.
- No bulk quote operations.
