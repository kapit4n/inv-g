# Inventory

## Overview

The Inventory module is the core of the product catalog and stock management system. It manages hierarchical categories, brands, manufacturers, suppliers, warehouses, storage locations, products (with full pricing and tax data), and all inventory movements with automatic stock updates.

## Features

### Categories
- Hierarchical category tree with parent-child relationships.
- Fields: name, description, parent category, icon, sort order, active status.
- Used to organize products for browsing and reporting.

### Brands
- Product brands with optional country of origin, website, logo.
- Used for product identification and vehicle compatibility filtering.

### Manufacturers
- Product manufacturers with contact details (phone, email, website).
- Distinct from brands (e.g., a brand can be owned by a manufacturer).

### Suppliers (Inventory)
- Supplier records with full contact information: company name, contact person, phone, mobile, email, website, tax ID, address (city, state, postal code, country).
- Active/inactive status for supplier management.
- Note: distinct from the standalone Suppliers module.

### Warehouses
- Multi-warehouse support with code, name, address, manager, phone.
- Each warehouse can have multiple storage locations.
- Products are assigned to a warehouse for stock tracking.

### Storage Locations
- Hierarchical location addressing: Warehouse → Zone → Aisle → Shelf → Bin.
- Auto-generated location code.
- Each location can store multiple products.
- Used for pick-pack optimization.

### Products
Complete product record with all fields:

| Field | Description |
|-------|-------------|
| Name | Product display name |
| SKU | Stock Keeping Unit (unique) |
| Barcode | Universal product code / EAN |
| OEM Number | Original Equipment Manufacturer number |
| Internal Code | Internal reference code |
| Description | Detailed product description |
| Category | Product category (from Categories) |
| Brand | Product brand (from Brands) |
| Manufacturer | Product manufacturer (from Manufacturers) |
| Supplier | Default supplier (from Suppliers) |
| Cost Price | Unit cost from supplier |
| Sale Price | Retail price |
| Wholesale Price | Wholesale/B2B price |
| Suggested Retail Price | MSRP |
| Tax Rate | Applicable tax percentage |
| Stock Quantity | Current on-hand quantity |
| Min Stock Level | Minimum before reorder alert |
| Max Stock Level | Maximum capacity |
| Reorder Point | Quantity triggering reorder suggestion |
| Unit | Unit of measure (pcs, box, kg, etc.) |
| Weight | Product weight |
| Warehouse | Assigned warehouse |
| Storage Location | Specific bin location |
| Image URL | Main product image |
| Active Status | Enable/disable for sale |
| Discontinued | Mark as discontinued |

- Products support multiple images (primary + additional).
- Product-vehicle compatibility is managed via the Compatibility module.

### Inventory Movements
All stock changes are recorded as inventory movements with automatic stock quantity updates.

**Movement Types:**

| Type | Description | Stock Effect |
|------|-------------|-------------|
| `initial_stock` | Initial stock entry | + |
| `adjustment` | Manual stock correction | +/- |
| `sale` | Product sold | - |
| `purchase` | Purchase order received | + |
| `transfer` | Warehouse transfer | - (source) / + (destination) |
| `damage` | Damaged/write-off | - |
| `loss` | Inventory loss | - |
| `found` | Inventory found/surplus | + |
| `correction` | Systematic correction | +/- |

Each movement records:
- Product and warehouse.
- Quantity (positive for inbound, negative for outbound for display).
- Movement type.
- Reference type and ID (e.g., "sale" + sale ID).
- Notes and user who created it.

**Auto Stock Update:** When a movement is created, the product's `stockQuantity` is automatically adjusted. This is handled at the database level to ensure consistency.

### Inventory Dashboard
- Total products, active/inactive counts.
- Category, brand, supplier, warehouse counts.
- Low stock and out-of-stock alerts.
- Total inventory value (cost price × stock quantity).

## Available Actions

| Action | Description |
|--------|-------------|
| CRUD Categories | Create, edit, delete product categories |
| CRUD Brands | Create, edit, delete brands |
| CRUD Manufacturers | Create, edit, delete manufacturers |
| CRUD Suppliers | Create, edit, delete inventory suppliers |
| CRUD Warehouses | Create, edit, delete warehouses |
| CRUD Storage Locations | Create, edit, delete locations |
| CRUD Products | Create, edit, delete products |
| View Product Detail | Full product information page |
| Manage Product Images | Upload and set primary image |
| Create Movement | Record an inventory movement |
| View Movements | Filterable movement history |
| Export Products | Export product list to CSV/XLSX |
| Import Products | Bulk product creation via CSV upload |
| Stock Adjustment | Create adjustment movements |

## Validation Rules

- SKU must be unique across all products.
- Barcode should be unique (warning on duplicate, not blocking).
- Sale price >= Cost price (configurable warning).
- Stock quantity is updated automatically — manual edits to stock are done via movements.
- Movement quantity cannot be zero.
- Cannot delete a product with existing sale or purchase history (soft delete via deactivation).
- Category hierarchy max depth: unlimited (but UI displays best with <= 3 levels).
- Warehouse code must be unique.
- Storage location code must be unique per warehouse.

## Related Modules

- [Purchasing](purchasing.md) — Purchase movements and stock receiving.
- [Compatibility](compatibility.md) — Product-vehicle fitment.
- [Sales](sales.md) — Sale movements.
- [Returns](returns.md) — Return movements.
- [Reports](reports.md) — Inventory reporting.
- [Vehicles](vehicles.md) — Vehicle reference data for compatibility.

## Known Limitations

- No batch/lot tracking.
- No expiry date tracking for perishable items.
- No serial number tracking.
- No consignment inventory.
- Transfer movements between warehouses require two movement records.
- Image management is URL-based (no built-in image storage).
