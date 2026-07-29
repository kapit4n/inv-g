# Milestone 07: Purchasing & Supplier Procurement

**Status:** ✅ Complete

## Summary

Implemented a complete Purchasing & Supplier Procurement module covering the full purchase lifecycle: purchase requests → purchase orders → receiving → returns, along with supplier catalog, cost history tracking, reorder suggestions, and supplier performance analytics.

## Deliverables

### Database (Schema v4)
- 8 new tables: `purchase_requests`, `purchase_request_items`, `purchase_receipts`, `purchase_receipt_items`, `purchase_returns`, `purchase_return_items`, `supplier_products`, `product_cost_history`
- Extended `purchase_orders` and `purchase_order_items` with warehouse, currency, payment terms, shipping, supplier SKU, discount, tax, damaged quantity columns
- Seed data: 10 new purchase permissions across 6 roles

### Rust Backend (`src-tauri/src/commands/purchases.rs`)
- 28 Tauri commands covering:
  - **PO CRUD**: list (filtered), get, create, update, delete, status transitions (draft→pending_approval→approved/sent→partially_received→completed, any→cancelled)
  - **Requests**: list, get, create, status transitions (draft→submitted→approved/rejected→converted)
  - **Receiving**: receive PO with validation, auto-stock update, inventory movements, cost history recording, PO status progression
  - **Returns**: create return with negative inventory movement and stock deduction
  - **Supplier catalog**: CRUD for supplier-product mappings
  - **Cost history**: query with product/supplier filters
  - **Dashboard**: aggregated stats, recent orders, reorder suggestions, supplier performance, top suppliers
  - **Auto-reorder**: products below reorder point, including pending PO quantities, preferred supplier lookup
  - **Supplier performance**: avg delivery days, return rate, late deliveries, total spend

### Frontend Pages (`src/features/purchases/pages/`)
| Page | Route | Purpose |
|------|-------|---------|
| PurchasesDashboardPage | `/purchases` | Dashboard with stats, recent orders, reorder alerts, top suppliers |
| PurchaseOrdersPage | `/purchases/orders` | Filterable list of purchase orders |
| PurchaseOrderFormPage | `/purchases/orders/new`, `/purchases/orders/:id/edit` | Create/edit PO with dynamic items |
| PurchaseOrderDetailPage | `/purchases/orders/:id` | Detail view with status-driven actions |
| PurchaseRequestsPage | `/purchases/requests` | List and manage purchase requests |
| PurchaseReceiptsPage | `/purchases/receipts` | List receipts |
| PurchaseReceiptDetailPage | `/purchases/receipts/:id` | Detail view + receive order form |
| PurchaseReturnsPage | `/purchases/returns` | List returns + create return dialog |
| SupplierProductsPage | `/purchases/supplier-products` | Supplier product catalog CRUD |
| CostHistoryPage | `/purchases/cost-history` | Product cost history viewer |
| ReorderSuggestionsPage | `/purchases/reorder-suggestions` | Products needing reorder with action links |

### Other Frontend
- Expanded sidebar with 8 purchase sub-navigation items
- 12 sub-routes registered in router
- Full i18n keys (es/en) for all purchase UI text
- TypeScript interfaces in `src/types/index.ts`
- Tauri binding functions in `src/lib/tauri.ts`

## Files Created/Modified

### New
- `src-tauri/src/commands/purchases.rs`
- `src/features/purchases/pages/purchases-dashboard-page.tsx`
- `src/features/purchases/pages/purchase-orders-page.tsx`
- `src/features/purchases/pages/purchase-order-form-page.tsx`
- `src/features/purchases/pages/purchase-order-detail-page.tsx`
- `src/features/purchases/pages/purchase-requests-page.tsx`
- `src/features/purchases/pages/purchase-receipts-page.tsx`
- `src/features/purchases/pages/purchase-receipt-detail-page.tsx`
- `src/features/purchases/pages/purchase-returns-page.tsx`
- `src/features/purchases/pages/supplier-products-page.tsx`
- `src/features/purchases/pages/cost-history-page.tsx`
- `src/features/purchases/pages/reorder-suggestions-page.tsx`
- `docs/progress/MILESTONE_07.md`

### Modified
- `src-tauri/src/db/schema.rs` — v4 schema with new tables
- `src-tauri/src/db/seed.rs` — 10 new purchase permissions, role updates
- `src-tauri/src/commands/mod.rs` — added purchases module
- `src-tauri/src/lib.rs` — registered 28 purchase commands
- `src/types/index.ts` — 19 purchase-related interfaces
- `src/lib/tauri.ts` — 23 Tauri invoke wrapper functions
- `src/layouts/sidebar.tsx` — 8 purchase sub-items
- `src/routes/index.tsx` — 12 purchase sub-routes
- `src/i18n/locales/en/purchases.json` — full English keys
- `src/i18n/locales/es/purchases.json` — full Spanish keys
- `src/features/purchases/index.ts` — 11 page exports
- `docs/ROADMAP.md` — marked Milestone 7 complete

## Known Issues
- None
