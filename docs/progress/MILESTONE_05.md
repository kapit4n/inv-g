# Milestone 05 - Inventory Management Module

## Status: Complete

## Summary
Full inventory management module with database schema, Rust backend CRUD commands, seed data, and complete frontend pages for all sub-entities.

## Deliverables

### Database Schema (v2)
- **New tables**: `brands`, `manufacturers`, `warehouses`, `storage_locations`, `product_images`, `product_vehicle_compatibility`, `inventory_movements`
- **Expanded tables**: `products` (barcode, oem_number, internal_code, brand_id, manufacturer_id, warehouse_id, storage_location_id, sale_price, wholesale_price, suggested_retail_price, tax_rate, reorder_point, is_discontinued), `suppliers` (company_name, mobile, tax_number, website)
- **Schema versioning**: PRAGMA user_version with automatic table drop/recreate on version mismatch

### Seed Data
- 10 categories, 8 brands, 6 manufacturers, 4 suppliers, 3 warehouses, 7 storage locations, 15 products
- 6 new inventory permissions assigned to owner and administrator roles

### Rust Backend (`src-tauri/src/commands/inventory.rs`)
- CRUD commands for all entities: categories, brands, manufacturers, suppliers, warehouses, storage locations, products, product images, product compatibility
- Server-side pagination with search for products (`get_products`)
- Dashboard stats aggregation (`get_dashboard_stats`)
- Archive/restore support for categories, brands, suppliers, products
- Proper error handling with Result types

### Frontend

#### Types & Bindings
- `src/types/inventory.ts` — TypeScript interfaces for all 10 inventory entities
- `src/lib/tauri.ts` — 30+ Tauri command wrappers with proper typing

#### Pages (14 components in `src/features/inventory/pages/`)
- **Inventory Dashboard** (`inventory-dashboard-page.tsx`): Live stats cards from backend (total products, active/inactive, inventory value, categories, brands, suppliers, warehouses, low stock, out of stock)
- **Categories** (`categories-page.tsx` + `category-form-page.tsx`): List with DataTable, create/edit form
- **Brands** (`brands-page.tsx` + `brand-form-page.tsx`): List with DataTable, create/edit form
- **Manufacturers** (`manufacturers-page.tsx` + `manufacturer-form-page.tsx`): List with DataTable, create/edit form
- **Suppliers** (`suppliers-page.tsx` + `supplier-form-page.tsx`): List with DataTable, create/edit form
- **Warehouses** (`warehouses-page.tsx` + `warehouse-form-page.tsx`): List with DataTable, create/edit form
- **Storage Locations** (`storage-locations-page.tsx` + `storage-location-form-page.tsx`): List with DataTable, create form
- **Products** (`products-page.tsx` + `product-form-page.tsx` + `product-detail-page.tsx`): Server-side paginated list with search, full create/edit form with all fields, detail view

#### i18n
- Expanded `inventory.json` (es/en) with 150+ translation keys covering all sub-modules
- Added `yes`/`no` keys to `common.json`

#### Routing (`src/routes/index.tsx`)
- 22 inventory sub-routes under `/inventory/*` with proper URL parameters

#### Navigation (`src/layouts/sidebar.tsx`)
- Collapsible inventory sub-navigation with 7 child items (categories, brands, manufacturers, suppliers, warehouses, storage locations, products)
- Expanded by default for easy access

#### DataTable Improvement
- Relaxed generic constraint `Record<string, unknown>` → `object` to support strongly-typed entity interfaces

## Architecture Decisions
1. **Direct Tauri invoke** pattern instead of Repository/CrudService abstraction — simpler for CRUD pages since the Rust backend already provides command-oriented API
2. **Client-side pagination** for small entities (categories, brands, etc.) — all data fetched once, sliced for display
3. **Server-side pagination with search** for products — supports large datasets efficiently
4. **React Query** for all data fetching with automatic cache invalidation after mutations
5. **Entity layout components** (EntityListPage, EntityFormPage, EntityDetailPage, EntityInfoCard, EntityActionBar) used for consistent UI

## Files Created
```
src/types/inventory.ts
src/features/inventory/pages/inventory-dashboard-page.tsx
src/features/inventory/pages/categories-page.tsx
src/features/inventory/pages/category-form-page.tsx
src/features/inventory/pages/brands-page.tsx
src/features/inventory/pages/brand-form-page.tsx
src/features/inventory/pages/manufacturers-page.tsx
src/features/inventory/pages/manufacturer-form-page.tsx
src/features/inventory/pages/suppliers-page.tsx
src/features/inventory/pages/supplier-form-page.tsx
src/features/inventory/pages/warehouses-page.tsx
src/features/inventory/pages/warehouse-form-page.tsx
src/features/inventory/pages/storage-locations-page.tsx
src/features/inventory/pages/storage-location-form-page.tsx
src/features/inventory/pages/products-page.tsx
src/features/inventory/pages/product-form-page.tsx
src/features/inventory/pages/product-detail-page.tsx
docs/progress/MILESTONE_05.md
```

## Files Modified
```
src/lib/tauri.ts — Added 30+ inventory command bindings
src/i18n/locales/es/inventory.json — Expanded with sub-module keys
src/i18n/locales/en/inventory.json — Expanded with sub-module keys
src/i18n/locales/es/common.json — Added yes/no keys
src/i18n/locales/en/common.json — Added yes/no keys
src/routes/index.tsx — Added 22 inventory sub-routes
src/layouts/sidebar.tsx — Collapsible inventory sub-navigation
src/types/crud.ts — Relaxed generic constraint
src/components/data-table/data-table.tsx — Relaxed generic constraint
src/features/inventory/index.ts — Added 16 page exports
src-tauri/src/commands/mod.rs — Added inventory module
src-tauri/src/lib.rs — Registered inventory commands
src-tauri/src/commands/inventory.rs — Fixed compilation errors
```

## Known Issues
- Storage location editing not yet supported (backend only has create/list)
- Product images and vehicle compatibility not yet exposed in frontend UI
- Hardware/electronic categories from seed Spanish names need review
- Inventory movements (stock in/out) not yet implemented in UI

## Next Milestone
Milestone 6 – Sales & Point of Sale Module
