# Part Finder (Vehicle-to-Part Search)

## What is it?

Part Finder lets you find the right parts for a specific vehicle by selecting the vehicle configuration and seeing compatible products.

## What is it for?

In the automotive parts business, the most common question is: "Which part fits this vehicle?" Part Finder answers that question by letting you select the vehicle and see all compatible parts.

## How to Access

**Sidebar → Part Finder**. Route: `/part-finder`.

## Before you start: record what fits what

Part Finder does not guess. It searches the **vehicle compatibility** records
attached to your products, so a part that nobody has mapped to a vehicle will
not appear — no matter how the search is filtered.

This is the one thing to check first if a search returns nothing:

1. Open the product (**Inventario → Products**).
2. Go to the **Compatibilidad** tab.
3. Click **Agregar compatibilidad** and record which vehicles it fits.

Each record is a set of optional filters — brand, model, generation, engine,
transmission, and a year range. Leave a field empty to mean "any". For example
a brake pad that fits any Toyota Corolla from 2015 to 2024 needs only a brand, a
model and the year range.

::: warning
Before this was possible, there was no way to record a fitment at all, so a
fresh database had an empty compatibility table and **every** search returned
"No se encontraron partes compatibles". If the pickers are empty too, the
vehicle catalog itself needs filling in first — see
[Vehicles](/crm/vehicles).
:::

### How matching works

A recorded fitment matches a search when every dimension you selected either
**equals** the recorded value **or was left empty** on the record. So a fitment
recorded as "Toyota, any engine" still matches a search for *Toyota Corolla,
1.8 VVT-i*; a fitment recorded for a *different* brand does not.

This is why a partially filled record is useful: the fewer dimensions you pin
down, the more vehicles the part matches.

## How to Use

### Step 1: Select Vehicle Brand

Choose the vehicle manufacturer (e.g., Toyota, Honda, Ford).

### Step 2: Select Model

Choose the model (e.g., Corolla, Civic, Focus).

### Step 3: Select Generation

Choose the generation (e.g., E210, 11th Gen).

### Step 4: Select Year

Choose the production year.

### Step 5: Select Engine (Optional)

Choose the engine type if known.

### Step 6: Select Transmission (Optional)

Choose the transmission type if known.

### Step 7: Search

Type a **part name or SKU** in the search box (e.g. `Brake Pad`, `BP-1002`) and
click **Buscar**. Results show:
- Product name and SKU
- Category
- Price and stock
- Compatibility notes

The text box is optional: leaving it empty lists everything that matches the
vehicle you selected.

::: tip
Leave the selectors empty to search wider. Each one you fill in narrows the
result set, so a brand-only search returns every part recorded for that brand
across all models.
:::

## Recommended Parts

The **Recomendadas para Este Vehículo** panel fills in as soon as you pick a
brand or a model, and lists the parts recorded for it, most-widely-applicable
first. It deliberately does not filter by category — the parts a given vehicle
"needs" are whatever your catalog happens to stock for it.

## Considerations

- All 7 selectors cascade — each selection filters the next
- Engine and Transmission are optional, as is every field on a fitment record
- The search box matches **part name or SKU**
- With no vehicle selected, the search is a plain catalog lookup and finds any
  active product, whether or not a fitment is recorded for it
- Once any vehicle dimension is selected, only parts with a matching fitment
  are returned
- Inactive (archived) products never appear
- Click any result to view full product details

## Troubleshooting

| Symptom | Cause |
| --- | --- |
| No results at all | The product has no fitment recorded — add one in the product's **Compatibilidad** tab |
| Dropdowns are empty | The vehicle catalog is empty — add brands and models in **CRM → Vehículos** |
| Recommendations panel is blank | No brand or model selected yet, or nothing is recorded for that vehicle |
| A part you know fits is missing | Its fitment record names a *different* value for a dimension you selected; clear that dimension on the record or leave it empty in the search |

## Related

- [Products](/inventory/products) — where fitments are recorded
- [Vehicles](/crm/vehicles) — the vehicle catalog (brands, models)
- [Cross References](/inventory/cross-references) — OEM number search
