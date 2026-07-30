# Suppliers

## Overview

The Suppliers module manages the supplier directory, storing contact information and tracking sourcing relationships. It serves as the supplier master data for the purchasing module.

## Features

### Supplier List
- Paginated table with columns: Company Name, Contact Person, Phone, Email, City, Active Status.
- Search by company name, contact person, email, phone.
- Filter by status (Active/Inactive).

### Supplier CRUD
Full supplier contact information:

| Field | Description |
|-------|-------------|
| Name | Company name |
| Contact Person | Primary contact at the supplier |
| Phone | Office phone number |
| Mobile | Mobile phone number |
| Email | Email address |
| Website | Company website URL |
| Tax ID | Supplier tax registration number |
| Address | Street address |
| City | City |
| State | State/province |
| Postal Code | ZIP/postal code |
| Country | Country |
| Notes | Free-form notes about the supplier |
| Active | Enable/disable supplier |

### Supplier Detail (Future)
Planned for future releases:
- Product catalog (products sourced from this supplier).
- Purchase order history.
- Performance metrics.
- Communication log.

## Available Actions

| Action | Description |
|--------|-------------|
| Create Supplier | Add a new supplier record |
| Edit Supplier | Update supplier information |
| Delete Supplier | Soft delete (deactivate) supplier |
| Export Supplier List | Export to CSV/XLSX |

## Validation Rules

- Supplier name is required.
- Email format validation if provided.
- Cannot delete a supplier with active purchase orders (soft deactivate instead).
- Tax ID should be unique (warning on duplicate).

## Related Modules

- [Purchasing](purchasing.md) — Purchase orders and supplier product catalog.
- [Inventory](inventory.md) — Supplier assignment to products.
- [Reports](reports.md) — Supplier performance reports.

## Known Limitations

- No multi-currency supplier pricing.
- No supplier document/attachment storage.
- No automated RFQ workflow.
- Supplier detail page is basic (no integrated PO history or performance charts).
