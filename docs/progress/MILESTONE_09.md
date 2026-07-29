# Milestone 09 - CRM & Vehicles

## Status: Complete

## Summary
Implemented a full CRM module with vehicle catalog, product-vehicle compatibility system, service reminders, and warranty management. Restructured the sidebar navigation to group all customer-related features (customers, vehicles, compatibility, reminders, warranties, credit, notes) under a unified CRM section.

## Deliverables

### Database (Schema v6)
- **Extended customers table**: Added `customer_code`, `customer_type`, `first_name`, `last_name`, `business_name`, `tax_number`, `mobile`, `whatsapp`, `preferred_contact`, `preferred_language`
- **New vehicle catalog tables**: `vehicle_brands`, `vehicle_models`, `vehicle_generations`, `vehicle_engines`, `vehicle_transmissions`, `vehicle_fuels`
- **New tables**: `customer_vehicles`, `customer_notes`, `customer_timeline`, `service_reminders`, `warranties`
- **Refactored `product_vehicle_compatibility`**: Now uses FK references to `vehicle_brands`, `vehicle_models`, `vehicle_generations`, `vehicle_engines`, `vehicle_transmissions` instead of plain text fields
- **Seed data**: 7 new permissions assigned to owner and administrator roles

### Rust Backend

#### Vehicles (`src-tauri/src/commands/vehicles.rs`)
- CRUD for vehicle brands, models, generations, engines, transmissions, fuels
- Full CRUD for customer vehicles with detailed specs (license plate, VIN, color, mileage, purchase date)
- Customer vehicle list/detail with JOINs for brand/model/engine names

#### Compatibility (`src-tauri/src/commands/compatibility.rs`)
- CRUD for product-vehicle compatibility with FK-based vehicle references
- `search_compatible_products` — find products matching vehicle criteria with stock/price info
- `get_recommendations_for_vehicle` — auto-recommend products based on vehicle brand/model/year

#### Service Reminders (`src-tauri/src/commands/reminders.rs`)
- CRUD for service reminders with status tracking (pending/completed/cancelled)
- Date-based and mileage-based due tracking
- `get_overdue_reminders` — fetch reminders past due date/mileage

#### Warranties (`src-tauri/src/commands/warranty.rs`)
- CRUD for warranties with status tracking (active/expired/claimed/voided)
- `get_expiring_warranties(days)` — find warranties expiring within N days

#### CRM (`src-tauri/src/commands/crm.rs`)
- `get_crm_dashboard` — aggregated stats: totals, new customers, active, workshops, fleet companies, vehicles, reminders, warranties, credit, lifetime revenue, customers by type, vehicle brands, top customers
- `get_customers_by_month` — customer acquisition trend data

#### Customers (extended — `src-tauri/src/commands/customers.rs`)
- `get_customer_notes` / `create_customer_note` — note management with public/private flag
- `get_customer_timeline` — event log for customer activity
- `add_timeline_entry` — internal helper to log events (used by note creation, etc.)

### Frontend Pages (`src/features/crm/pages/`)
| Page | Route | Purpose |
|------|-------|---------|
| CrmDashboardPage | `/crm` | CRM dashboard with stats cards and trend data |
| CrmCustomersPage | `/crm/customers` | Customer list with search |
| CrmCustomerDetailPage | `/crm/customers/:id` | Full customer detail with tabs |
| CrmVehiclesPage | `/crm/vehicles` | Vehicle browser and management |
| CrmCompatibilityPage | `/crm/compatibility` | Product-vehicle compatibility lookup |
| CrmRemindersPage | `/crm/reminders` | Service reminder management |
| CrmWarrantiesPage | `/crm/warranties` | Warranty management |
| CrmCreditPage | `/crm/credit` | Credit account management |
| CrmNotesPage | `/crm/notes` | Customer notes management |

### Other Frontend
- Restructured sidebar: "Customers" → "CRM" with 8 child items (Dashboard, Customers, Vehicles, Compatibility, Reminders, Warranties, Credit, Notes)
- 9 CRM sub-routes registered in router
- Full i18n keys (es/en) in `crm.json` translation files
- New TypeScript interfaces in `src/types/index.ts`: `VehicleBrand`, `VehicleModel`, `VehicleGeneration`, `VehicleEngine`, `VehicleTransmission`, `VehicleFuel`, `CustomerVehicle`, `CompatibilityEntry`, `ProductRecommendation`, `ServiceReminder`, `Warranty`, `CustomerNote`, `TimelineEntry`, `CrmDashboard`, `CustomerType`
- Tauri binding functions in `src/lib/tauri.ts` for all new commands

## Files Created
```
src-tauri/src/commands/compatibility.rs
src-tauri/src/commands/crm.rs
src-tauri/src/commands/reminders.rs
src-tauri/src/commands/vehicles.rs
src-tauri/src/commands/warranty.rs
src/features/crm/index.ts
src/features/crm/pages/crm-dashboard-page.tsx
src/features/crm/pages/crm-customers-page.tsx
src/features/crm/pages/crm-customer-detail-page.tsx
src/features/crm/pages/crm-vehicles-page.tsx
src/features/crm/pages/crm-compatibility-page.tsx
src/features/crm/pages/crm-reminders-page.tsx
src/features/crm/pages/crm-warranties-page.tsx
src/features/crm/pages/crm-credit-page.tsx
src/features/crm/pages/crm-notes-page.tsx
src/i18n/locales/en/crm.json
src/i18n/locales/es/crm.json
docs/progress/MILESTONE_09.md
```

## Files Modified
```
src-tauri/src/db/schema.rs — Schema v6: new tables, refactored compatibility, extended customers
src-tauri/src/db/seed.rs — 7 new permissions, role updates
src-tauri/src/commands/mod.rs — added 5 new modules
src-tauri/src/commands/inventory.rs — removed old compatibility commands (moved to dedicated module)
src-tauri/src/commands/customers.rs — added notes, timeline, and customer note/timeline commands
src-tauri/src/lib.rs — registered all new commands, removed old compatibility commands
src/types/index.ts — 15+ new TypeScript interfaces
src/lib/tauri.ts — 30+ new Tauri invoke wrapper functions
src/layouts/sidebar.tsx — CRM section with 8 sub-items, removed old Customers/Vehicles sections
src/routes/index.tsx — 9 CRM sub-routes
src/i18n/config.ts — added crm namespace
```

## Known Issues
- None

## Dependencies
- React Router for CRM sub-routes
- Tauri invoke pattern from `@/lib/tauri`
- i18next for translation support (es/en)
