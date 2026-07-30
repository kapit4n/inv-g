# Vehicles

## Overview

The Vehicles module manages automotive reference data — brands, models, generations, engines, transmissions, and fuel types — along with customer vehicle records. This data drives the product-vehicle compatibility system.

## Features

### Vehicle Reference Data

**Brands**
- Automotive brand names (e.g., Toyota, Ford, BMW).
- Optional description and country of origin.
- Active/inactive status.

**Models**
- Each model belongs to a brand.
- Model name and active status.

**Generations**
- Vehicle generation tied to a model.
- Optional generation name, start year, end year.
- Example: "Mk3" (2015-2020) for Ford Focus.

**Engines**
- Engine name (e.g., "2.0L Turbo", "1.6L Diesel").
- Displacement, power output, fuel type.

**Transmissions**
- Transmission name (e.g., "6-Speed Manual", "8-Speed Automatic").
- Type (Manual/Automatic/CVT/DCT/AMT).
- Number of gears.

**Fuels**
- Fuel type names (e.g., Gasoline, Diesel, Electric, Hybrid, LPG).

### Customer Vehicles
Each vehicle record is linked to a customer:

| Field | Description |
|-------|-------------|
| License Plate | Vehicle license plate number |
| Nickname | Optional friendly name |
| Brand | Vehicle brand (from reference data) |
| Model | Vehicle model (from reference data) |
| Generation | Vehicle generation (from reference data) |
| Year | Model year |
| Engine | Engine type (from reference data) |
| Transmission | Transmission type (from reference data) |
| Fuel | Fuel type (from reference data) |
| VIN | Vehicle Identification Number |
| Color | Vehicle color |
| Mileage | Current odometer reading |
| Purchase Date | Date of vehicle purchase |
| Notes | Free-form notes |
| Status | Active / Sold / Scrapped |

### Vehicle Search
- Search customer vehicles by license plate, VIN, customer name.
- Filter by brand, model, status.

### Vehicle List
- Paginated table of all customer vehicles.
- Columns: License Plate, Customer, Brand, Model, Year, Mileage, Status.
- Row click opens vehicle detail (if implemented).

## Available Actions

| Action | Description |
|--------|-------------|
| CRUD Vehicle Brands | Create, edit, delete vehicle brands |
| CRUD Vehicle Models | Create, edit, delete models per brand |
| CRUD Vehicle Generations | Create, edit, delete generations per model |
| CRUD Vehicle Engines | Create, edit, delete engine types |
| CRUD Vehicle Transmissions | Create, edit, delete transmission types |
| CRUD Vehicle Fuels | Create, edit, delete fuel types |
| CRUD Customer Vehicles | Create, edit, delete vehicles per customer |
| Search Vehicles | Search by plate, VIN, or customer |
| Export Vehicle List | Export to CSV/XLSX |

## Validation Rules

- Model must belong to an existing brand.
- Generation year start must be <= year end.
- License plate is unique per customer (but can repeat across customers).
- VIN format validation (17 characters, check digit optional).
- Mileage must be >= 0.
- Vehicle status is required.

## Related Modules

- [CRM](crm.md) — Customer vehicle management and service reminders.
- [Compatibility](compatibility.md) — Product fitment based on vehicle.
- [Customers](customers.md) — Vehicle owner relationship.

## Known Limitations

- No automatic VIN decoding (manual entry required).
- Reference data (brands/models/engines) must be seeded manually or via CSV.
- No integration with external vehicle databases (e.g., NHTSA, car.info).
- No vehicle image storage.
- No service history tracking beyond reminders.
