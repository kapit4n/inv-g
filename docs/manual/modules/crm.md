# CRM

## Overview

The Customer Relationship Management (CRM) module provides a comprehensive 360-degree view of customers. It extends the basic Customers module with customer types, vehicle tracking, product-vehicle compatibility, service reminders, warranty management, credit accounts, and communication notes.

## Features

### CRM Dashboard
- **Stats Cards**: Total customers, new customers this month, active customers.
- **Customer Type Breakdown**: Workshops, fleet companies, individual customers.
- **Vehicle Stats**: Total vehicles registered.
- **Reminders**: Upcoming service reminders count.
- **Warranties**: Expired warranties count.
- **Credit**: Customers with active credit accounts.
- **Revenue**: Lifetime revenue from CRM-tracked customers.
- **Charts**: Customer type distribution, popular vehicle brands.
- **Top Customers**: By total spending.

### Customers (CRM)
Same CRUD as the [Customers module](customers.md) with additional CRM-specific fields:

**Customer Types:**
- Individual / Workshop / Fleet Company / Dealership / Other.
- Company name, RNC (tax ID), commercial name for business customers.

Features in customer detail:
- Profile information.
- Assigned vehicles list.
- Service reminders for customer vehicles.
- Active warranties.
- Credit account summary.
- Notes (public and private).
- Activity timeline.

### Customer Vehicles
Lists all vehicles registered to a customer. See [Vehicles](vehicles.md) for full field reference.

Actions: Add vehicle, edit, remove, view compatibility.

### Compatibility
Product-vehicle fitment matrix.
- Create compatibility entries linking a product to a specific vehicle (brand + model + generation + engine + transmission + year range).
- Search compatible products for a given vehicle.
- Get product recommendations for a vehicle.
- See [Compatibility](compatibility.md) for full documentation.

### Service Reminders
Reminders for vehicle maintenance based on mileage or date.

| Field | Description |
|-------|-------------|
| Customer | Linked customer |
| Vehicle | Optional linked vehicle |
| Reminder Type | Oil Change, Tire Rotation, Brake Service, Inspection, etc. |
| Title | Reminder title |
| Description | Detailed reminder description |
| Due Date | Calendar-based due date |
| Due Mileage | Mileage-based due threshold |
| Status | Pending, Overdue, Completed, Cancelled |
| Completed At | When the service was completed |
| Completed By | Staff who marked it complete |
| Notes | Completion notes |

Status tracking:
- Reminders auto-update to "Overdue" when past due date or past due mileage.
- Mark as complete with optional notes.

### Warranties
Product warranty tracking with expiration monitoring.

| Field | Description |
|-------|-------------|
| Warranty Number | Unique warranty identifier |
| Sale | Original sale reference |
| Product | Warranted product |
| Customer | Warranty holder |
| Vehicle | Optional linked vehicle |
| Warranty Type | Standard, Extended, Promotional |
| Period | Duration in months |
| Start Date | Warranty effective date |
| Expiration Date | Warranty end date |
| Status | Active, Expiring Soon, Expired, Claimed, Void |

- Auto-calculation of expiration date from start date + period.
- Status monitoring: "Expiring Soon" when within 30 days of expiration.

### Credit Accounts
Customer credit line management.

| Field | Description |
|-------|-------------|
| Credit Limit | Maximum credit allowed |
| Current Balance | Outstanding balance |
| Status | Active, Frozen, Closed |

**Credit Transactions:**
- Type: Purchase (debit), Payment (credit), Refund (credit), Adjustment, Fee.
- Amount, reference type/ID, notes, created by.
- Balance is auto-calculated from transaction history.

### Notes (CRM)
Customer notes with privacy control.

| Field | Description |
|-------|-------------|
| Note Type | General, Follow-up, Complaint, Custom |
| Title | Note title |
| Content | Note body |
| Privacy | Public (visible to all staff) / Private (visible only to creator and admins) |
| Created By | Staff who created the note |

### Timeline
Unified chronological activity feed per customer:
- Sale created, quote sent, reminder completed, warranty claimed, note added, credit transaction, communication logged.
- Filterable by event type.

## Available Actions

| Action | Description |
|--------|-------------|
| CRM Dashboard | View aggregated CRM metrics and charts |
| CRUD Customers | Manage customer records with types |
| Manage Vehicles | Add/edit/remove customer vehicles |
| Manage Compatibility | Create product-vehicle fitment entries |
| Create Reminders | Set service reminders by date or mileage |
| Mark Reminder Complete | Close out a service reminder |
| CRUD Warranties | Create and track product warranties |
| Manage Credit Accounts | View and adjust credit lines |
| Record Credit Transaction | Manual credit entry (payment/adjustment) |
| Add Notes | Create public or private customer notes |
| View Timeline | Customer activity history |
| Export All Lists | Export to CSV/XLSX |

## Validation Rules

- Reminder due date or due mileage is required (at least one).
- Warranty start date is required.
- Warranty expiration is auto-calculated from start date + period.
- Credit limit must be >= 0.
- Credit transaction cannot exceed available credit for purchases.
- Private notes are only visible to creator and users with `crm:view_private_notes` permission.
- Customer type is optional but recommended for reporting.

## Related Modules

- [Customers](customers.md) — Base customer management.
- [Vehicles](vehicles.md) — Vehicle reference data.
- [Compatibility](compatibility.md) — Product fitment.
- [Sales](sales.md) — Sale-linked warranties.
- [Inventory](inventory.md) — Product data for compatibility and warranties.
- [Reports](reports.md) — CRM and customer reports.

## Known Limitations

- No automated reminder notifications (email/SMS).
- No recurring reminder scheduling.
- Warranty claim workflow is manual.
- No customer self-service portal.
- No automated credit scoring or risk assessment.
- No integration with external CRM platforms.
