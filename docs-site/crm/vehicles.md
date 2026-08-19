# Vehicles & Compatibility

## What is it?

Track customer vehicles and manage part-to-vehicle compatibility data. This is the core of the automotive parts business — knowing which parts fit which vehicles.

![Vehicles](/screenshots/light/36-customer-vehicles.png)

## How to Access

**Sidebar → CRM → Vehicles**. Route: `/crm/vehicles`.

## Vehicle Management

### Adding a Vehicle to a Customer

1. Open a customer's detail page
2. Click the **Vehicles** tab
3. Click **+ Add Vehicle**
4. Enter:
   - **Brand** (e.g., Toyota)
   - **Model** (e.g., Corolla)
   - **Generation** (e.g., E210)
   - **Year** (e.g., 2020)
   - **Engine** (e.g., 1.8L Hybrid)
   - **Transmission** (e.g., CVT)
   - **VIN** (Vehicle Identification Number)
   - **License Plate**
5. Save

## Compatibility

### What is it?

The compatibility system maps which parts fit which vehicles. This is used by:
- Part Finder — Search compatible parts for a vehicle
- Product detail — See which vehicles a part fits
- Sales — Suggest correct parts

### How to Access

**Sidebar → CRM → Compatibility**. Route: `/crm/compatibility`.

### How to Add Compatibility

1. Open a product's **360° view**
2. Click the **Compatibility** tab
3. Add vehicle combinations (brand + model + generation + engine)
4. Save

## Vehicle Data Hierarchy

```
Brand → Model → Generation → Year → Engine → Transmission
```

Each level narrows down the specific vehicle configuration.

## Related

- [Part Finder](/manual/part-finder) — Search parts by vehicle
- [Products](/inventory/products) — Product compatibility tab
