# Inventory Management

## What is it?

The Inventory module is the backbone of Inventory Gear. It manages all products, categories, brands, warehouses, storage locations, stock levels, and movements.

![Inventory Dashboard](/screenshots/light/03-inventory-dashboard.png)

## What is it for?

Track every product in your business — from procurement to sale. Maintain accurate stock levels, prevent stockouts, and optimize warehouse organization.

## How to Access

Click **Inventory** in the sidebar. Route: `/inventory`.

## Sub-modules

| Module | Route | Purpose |
|--------|-------|---------|
| [Products](/inventory/products) | `/inventory/products` | Product catalog management |
| [Categories & Brands](/inventory/categories-brands) | `/inventory/categories` | Organize products |
| [Warehouses & Locations](/inventory/warehouses) | `/inventory/warehouses` | Storage management |
| [Stock & Movements](/inventory/stock-movements) | `/inventory/movements` | Stock tracking |
| [Cross References](/inventory/cross-references) | `/inventory/cross-references` | OEM/cross-reference lookup |
| [Import / Export](/inventory/import-export) | `/inventory/import-export` | Bulk Excel import/export |

## Inventory Dashboard

The inventory dashboard shows:
- Total products count
- Total stock value
- Low stock alerts
- Recent movements

## Tips

- Use **SKUs** for unique product identification
- Set **min/max stock levels** to trigger reorder alerts
- Use **barcodes** for fast POS scanning
- Organize with **categories** for reporting

## Related

- [Part Finder](/manual/part-finder) — Vehicle-to-part search
- [Purchasing](/purchases/) — Order new stock
