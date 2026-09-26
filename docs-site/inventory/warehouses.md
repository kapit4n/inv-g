# Warehouses & Storage Locations

## What is it?

Warehouses and storage locations define where your inventory is physically stored.

![Warehouses](/screenshots/light/11-warehouse-list.png)

## Warehouses

### What are Warehouses?

Warehouses represent physical storage facilities (e.g., Main Warehouse, Store Front, Back Room).

### How to Create a Warehouse

1. Go to **Inventory → Warehouses**
2. Click **+ New Warehouse**
3. Enter:
   - **Name** (required)
   - **Code** (short identifier)
   - **Address** (optional)
   - **City, State, Postal Code** (optional)
4. Click **Save**

## Storage Locations

### What are Storage Locations?

Storage locations define specific positions within a warehouse (e.g., Shelf A-3, Bin 12, Rack B).

### How to Create a Storage Location

1. Go to **Inventory → Storage Locations**
2. Click **+ New Location**
3. Enter:
   - **Code** (required, e.g., "A-3-12")
   - **Description**
   - **Warehouse** (select parent warehouse)
4. Click **Save**

## When There Is Only One Warehouse

If your installation has exactly one warehouse, there is nothing to choose, so the
app fills it in for you. The warehouse is preselected in:

- **Storage Locations** — the parent warehouse of a new location
- **Receiving an order** — where the delivered units are booked in
- **Stock Movements** — where the units move
- **Purchase Orders** — where a new order is destined
- **Products** — the primary storage facility of a new product

A warehouse already recorded on the item always wins over the preselection, and a
choice you make yourself is never overwritten. Once a second warehouse is added, the
field is left empty again so the choice stays visible.

::: tip
Report filters are never preselected. Defaulting them would quietly narrow a report
to one warehouse without saying so.
:::

## Assigning Locations to Products

When creating or editing a product:
- Select a **Warehouse** as the primary storage facility
- Select a **Storage Location** for the specific position

## How to Edit

1. Find the warehouse or location in the list
2. Click the **Edit** action
3. Modify fields
4. Save changes

## Considerations

- Each product can be assigned to one warehouse and one storage location
- Storage locations belong to a specific warehouse
- Use consistent naming conventions for easy identification
- Warehouse and location data affects stock reports
- Preselecting only happens with a single warehouse; with two or more you always pick

## Related

- [Products](/inventory/products) — Assign locations to products
- [Stock & Movements](/inventory/stock-movements) — Track stock by location
- [Reports → Warehouses](/reports/) — Warehouse utilization reports
