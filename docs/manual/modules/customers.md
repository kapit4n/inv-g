# Customers

## Overview

The Customers module manages the customer database. It stores full contact information, tracks purchase history, manages credit accounts, and logs all communications and interactions with customers.

## Features

### Customer List
- Paginated table with columns: Name, Email, Phone, City, Total Spent, Last Purchase, Status.
- Search by name, email, phone.
- Filter by status (Active/Inactive), date range of last purchase.
- Row click navigates to customer detail.

### Customer CRUD
Full contact information:

| Field | Description |
|-------|-------------|
| Name | Customer full name or company name |
| Email | Email address |
| Phone | Primary phone number |
| Mobile | Mobile phone number |
| Address | Street address |
| City | City |
| State | State/province |
| Postal Code | ZIP/postal code |
| Country | Country |
| Tax ID | Tax registration number |
| Notes | Free-form notes |
| Active | Enable/disable account |

### Customer Detail Page

**Profile Section:**
- Customer name, contact details, tax ID.
- Account created date, last purchase date.
- Total sales count and total spent.
- Active/inactive status badge.

**Sales History:**
- Paginated table of all customer purchases.
- Columns: Sale Number, Date, Items, Total, Payment Method, Status.
- Row click navigates to sale detail.

**Credit Account:**
- Current balance, credit limit, available credit.
- Status: Active, Frozen, Closed.
- Credit utilization percentage.
- **Transactions:** Paginated list of all credit transactions (purchases on credit, payments, adjustments).
- Transaction types: Purchase, Payment, Refund, Adjustment, Fee.

**Communications Log:**
- Chronological list of all communications.
- Types: Call, Email, Meeting, Note, System.
- Subject, message preview, created by, timestamp.
- Add new communication entry.

**Timeline:**
- Unified activity feed showing all customer events.
- Sale created, quote sent, note added, payment received, etc.
- Filterable by event type.

## Available Actions

| Action | Description |
|--------|-------------|
| Create Customer | Add a new customer record |
| Edit Customer | Update customer information |
| Delete Customer | Soft delete (deactivate) customer |
| View Customer Detail | Full profile and history page |
| Add Communication | Log a call, email, or meeting |
| View Credit Account | See credit balance and transactions |
| Add Credit Transaction | Manual credit adjustment |
| Export Customer List | Export to CSV/XLSX |
| Import Customers | Bulk import from CSV |

## Validation Rules

- Customer name is required.
- Email format validation if provided.
- Phone format validation if provided.
- Cannot delete a customer with active sales (soft deactivate instead).
- Credit limit must be >= 0.
- Credit transaction amount cannot exceed available credit for purchases.

## Related Modules

- [POS](pos.md) — Customer selection during checkout.
- [CRM](crm.md) — Full CRM features including customer types, vehicles, reminders.
- [Sales](sales.md) — Customer purchase history.
- [Quotes](quotes.md) — Customer-linked quotations.
- [Returns](returns.md) — Customer returns.

## Known Limitations

- No duplicate detection on import.
- No customer grouping/segmentation.
- No automated communication (email/SMS).
- No customer portal or self-service.
