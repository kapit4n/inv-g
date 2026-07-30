# Compatibility

## Overview

The Compatibility module manages product-vehicle fitment data. It enables the creation of compatibility entries that link products to specific vehicle configurations (brand, model, generation, engine, transmission, and year range). This allows auto parts stores to quickly find parts that fit a customer's vehicle.

## Features

### Compatibility Entries
Each entry defines that a product is compatible with a specific vehicle configuration:

| Field | Description |
|-------|-------------|
| Product | The compatible product |
| Brand | Vehicle brand (e.g., Toyota) |
| Model | Vehicle model (e.g., Corolla) |
| Generation | Optional generation (e.g., E210) |
| Engine | Optional engine type (e.g., 2.0L) |
| Transmission | Optional transmission type (e.g., 6-Speed Manual) |
| Year Start | Start year of compatibility |
| Year End | End year of compatibility |
| Notes | Optional fitment notes (e.g., "Requires adapter bracket") |

- Entries can be as specific or as broad as needed.
- Leaving generation/engine/transmission null means "all variations of that model."
- Year range can define a specific period or leave open-ended.

### Create Compatibility
1. Select a product from the product catalog.
2. Select vehicle brand, then model (filtered by brand), then optional generation/engine/transmission (filtered by preceding selections).
3. Set optional year start and year end.
4. Add optional fitment notes.
5. Save entry.
6. Bulk creation: apply one product to multiple vehicle configurations at once.

### Search Compatible Products
- Search by vehicle: select brand → model → generation → engine → transmission → year.
- System returns all compatible products.
- Results show product name, SKU, sale price, stock quantity, category, brand.
- Results include how many compatibility entries match.

### Vehicle Recommendations
- When viewing a customer vehicle in CRM, click "Find Compatible Products."
- System uses the vehicle's brand, model, generation, engine, transmission, and year to filter compatibility entries.
- Returns ranked product recommendations.

### Compatibility Matrix View
- Table view showing all compatibility entries.
- Searchable by product name/SKU or vehicle details.
- Filter by product, brand, model.
- Edit or delete individual entries.

## Available Actions

| Action | Description |
|--------|-------------|
| Create Entry | Link a product to a vehicle configuration |
| Bulk Create | Add multiple compatibility entries at once |
| Edit Entry | Modify an existing compatibility entry |
| Delete Entry | Remove a compatibility link |
| Search by Vehicle | Find products that fit a vehicle |
| Get Recommendations | Suggested products for a customer's vehicle |
| Export Compatibility | Export matrix to CSV/XLSX |
| Import Compatibility | Bulk import from CSV |

## Validation Rules

- Product is required and must exist and be active.
- Vehicle brand and model are required.
- Year start must be <= year end (if both provided).
- Duplicate entry (same product + same vehicle config) is not allowed.
- Year range must be within the generation's year range (if generation selected).
- Engine and transmission selections must be compatible with the model (validation by existing data).

## Related Modules

- [Inventory](inventory.md) — Product catalog.
- [Vehicles](vehicles.md) — Vehicle reference data.
- [CRM](crm.md) — Customer vehicle recommendations.
- [POS](pos.md) — Quick vehicle-based product search during sale.

## Known Limitations

- No automatic compatibility data import from TecAlliance or similar services.
- No fitment notes templates.
- No "does not fit" exclusion entries.
- No OEM cross-reference for compatibility.
- Year range validation against generation years is not enforced.
