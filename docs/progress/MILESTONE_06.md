# Milestone 06 - Sales & Point of Sale

## Status: Complete

## Summary
Full sales module with CRUD backend, POS terminal, sale detail view, customer management, and inventory movement tracking. Also addresses all Milestone 5 known issues.

## M5 Loose Ends Addressed

### Storage Location Editing
- **Backend**: Added `update_storage_location` and `archive_storage_location` commands
- **Frontend**: Updated form to support edit mode with `:id` param, added `onRowClick` to list page, added edit route
- **i18n**: Added `storageUpdated` key

### Product Images & Vehicle Compatibility
- **Backend**: Added `create_product_image`, `delete_product_image`, `create_product_compatibility`, `delete_product_compatibility` commands
- **Frontend**: Added image management and compatibility sections to product form (edit mode only), display on product detail page
- **i18n**: Added image/compatibility keys

### Inventory Movements UI
- **Backend**: Added `InventoryMovement` struct + `get_inventory_movements`, `create_inventory_movement` commands (auto-updates stock)
- **Types**: Added `InventoryMovement` interface
- **Frontend**: Created list page and movement form (stock in/out/adjustment)
- **Routes/Sidebar**: Added `/inventory/movements` with nav item
- **i18n**: Added movement keys

### Storage Location on Product Form
- Added `storageLocationId` SelectField to product form (filtered by selected warehouse)
- Displayed on product detail page

## Milestone 6 Deliverables

### Rust Backend (`src-tauri/src/commands/sales.rs`)
- **Customer CRUD**: `get_customers`, `create_customer`, `update_customer`, `archive_customer`
- **Sales CRUD**: `get_sales`, `get_sale`, `get_sale_items`, `create_sale`
- `create_sale` auto-generates invoice numbers (`INV-00001`) and decrements stock
- `SaleItemInput` struct for bulk item creation

### Tauri Bindings (`src/lib/tauri.ts`)
- 8 new functions: `getCustomers`, `createCustomer`, `updateCustomer`, `archiveCustomer`, `getSales`, `getSale`, `getSaleItems`, `createSale`

### Frontend

#### Sales List Page (`sales-page.tsx`)
- Real data from backend with `useQuery`
- Today's revenue/transactions/average/cash stat cards
- DataTable with row click → detail navigation
- "New Sale" button → POS terminal

#### POS Terminal (`pos-page.tsx`)
- Product search with live filtering
- Product grid cards with add-to-cart
- Cart with quantity +/- and remove
- Subtotal/tax/total calculation
- Customer and payment method selection
- Creates sale via `createSale` (deducts stock)

#### Sale Detail Page (`sale-detail-page.tsx`)
- Sale info header with status badge
- Items table
- Summary card (customer, payment, totals)

### Routes
- `/sales` — list
- `/sales/new` — POS terminal
- `/sales/:id` — detail

### i18n
- Expanded `sales.json` (en/es) with POS keys (cart, subtotal, tax, complete sale, etc.)
- Added `selectOptional`, `processing`, `notFound`, `createdAt` to `common.json`

## Files Created
```
src-tauri/src/commands/sales.rs
src/features/sales/pages/pos-page.tsx
src/features/sales/pages/sale-detail-page.tsx
src/features/inventory/pages/inventory-movements-page.tsx
src/features/inventory/pages/inventory-movement-form-page.tsx
docs/progress/MILESTONE_06.md
```

## Files Modified
```
src-tauri/src/commands/inventory.rs — update/archive storage location, product image/compatibility CRUD, inventory movements
src-tauri/src/commands/mod.rs — added sales module
src-tauri/src/lib.rs — registered all new commands
src/lib/tauri.ts — added all new bindings
src/types/inventory.ts — added InventoryMovement interface
src/routes/index.tsx — added storage edit, movements, POS, sale detail routes
src/layouts/sidebar.tsx — added inventory movements nav item
src/features/inventory/index.ts — added movement page exports
src/features/sales/index.ts — added POS and detail page exports
src/features/sales/pages/sales-page.tsx — real backend data
src/features/inventory/pages/storage-location-form-page.tsx — edit mode support
src/features/inventory/pages/storage-locations-page.tsx — row click navigation
src/features/inventory/pages/product-form-page.tsx — storage location, images, compatibility sections
src/features/inventory/pages/product-detail-page.tsx — storage location, images, compatibility display
src/i18n/locales/en/inventory.json — storageUpdated, image, compatibility, movement keys
src/i18n/locales/es/inventory.json — storageUpdated, image, compatibility, movement keys
src/i18n/locales/en/sales.json — POS keys
src/i18n/locales/es/sales.json — POS keys
src/i18n/locales/en/common.json — selectOptional, processing, notFound, createdAt
src/i18n/locales/es/common.json — selectOptional, processing, notFound, createdAt
```

## Later Additions (within same milestone)
- **Refunds**: Backend `refund_sale` command with stock return + inventory movements; Refund UI on sale detail page with reason + confirmation
- **Receipt printing**: Print-style receipt area with `@media print` CSS; prints a formatted receipt (80mm) with items, totals, payment info
- **Daily closeout**: Backend `get_daily_closeout` aggregation command; Frontend closeout page with totals by payment method, refunds, net revenue; print support

## Known Issues
- No customer purchase history view
- Sale edit/cancel not implemented
