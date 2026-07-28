# Milestone 07 - Sales & POS (Full Implementation)

## Status: Complete

## Summary
Complete rewrite of the Sales & POS module with service-oriented architecture. Three-panel POS with split payments, quotes management, cash register sessions, daily closings, receipt tracking, returns processing, and sales dashboard with chart data.

## Deliverables

### Database Schema (`src-tauri/src/db/schema.rs`)
- **Bumped to v3**: Added 6 new tables + updated sales table with `receipt_number` and `warehouse_id`
- New tables: `sale_payments`, `quotes`, `quote_items`, `cash_register_sessions`, `daily_closings`, `receipts`

### Rust Backend (`src-tauri/src/commands/sales.rs`)
- **Service-oriented architecture**: ~900 lines with clear sections
- **POS Search**: `search_products_for_pos` — searches by name, sku, barcode, internal_code, oem_number
- **Checkout**: `process_checkout` — creates sale + items + payments + inventory movements + receipt in one transaction. Supports split payments (cash/card/transfer/mixed)
- **Sales Queries**: `get_sales`, `get_sale`, `get_sale_items`, `get_sale_payments` — all with customer name and item count joins
- **Search**: `search_sales` — by invoice number or customer name
- **Refunds**: `refund_sale` — returns stock, creates inventory movements, generates refund receipt
- **Daily Closeout**: `get_daily_closeout` — aggregates today's totals including split payments from `sale_payments`, backward compatible with legacy `payment_method`
- **Sales Summary**: `get_sales_summary` — today/week/month stats + top products
- **Chart Data**: `get_sales_chart_data` — daily revenue/order counts for N-day range
- **Quotes CRUD**: `get_quotes`, `get_quote`, `get_quote_items`, `create_quote`, `update_quote`, `delete_quote`, `update_quote_status`
- **Quote→Sale**: `convert_quote_to_sale` — converts quote to sale via checkout
- **Cash Register**: `get_cash_register_status`, `open_cash_register`, `close_cash_register` (calculates expected vs actual difference), `get_cash_register_sessions`
- **Daily Closings**: `close_daily_shift` (saves to DB, prevents duplicates), `get_daily_closings`
- **Receipts**: `get_receipts_for_sale`, `get_receipt`, `mark_receipt_printed`

### Permissions (`src-tauri/src/db/seed.rs`)
- Added: `sales.quotes`, `sales.register`, `sales.closeout`, `sales.receipts`
- Assigned to owner, admin, and cashier roles

### Tauri Bindings (`src/lib/tauri.ts`)
- 27 new functions: searchProductsForPos, processCheckout, getSalePayments, getSalesSummary, getSalesChartData, searchSales, getQuotes, getQuote, getQuoteItems, createQuote, updateQuote, deleteQuote, updateQuoteStatus, convertQuoteToSale, getCashRegisterStatus, openCashRegister, closeCashRegister, getCashRegisterSessions, closeDailyShift, getDailyClosings, getReceiptsForSale, getReceipt, markReceiptPrinted

### TypeScript Types (`src/types/index.ts`)
- Updated: Sale (saleNumber, receiptNumber, warehouseId, customerName, itemCount), SaleItem (discount, productName, productSku, updatedAt), DailyCloseout (netRevenue)
- New: SalePayment, PaymentInput, CheckoutInput, CheckoutResult, ProductForPos, SaleItemInput, Quote, QuoteItem, QuoteInput, CashRegisterSession, DailyClosing, Receipt, SalesSummary, ProductSalesStat, SalesChartData

### Frontend Pages

#### POS Terminal (`pos-page.tsx`)
- Three-panel layout: product search (barcode/SKU via `searchProductsForPos`) | cart (quantity +/-/delete, discount input) | checkout (customer select, split payments, change calculation, notes)
- Process via `processCheckout`

#### Sales History (`sales-page.tsx`)
- Summary stats from `getSalesSummary`, debounced search via `searchSales`
- DataTable with payment status badges
- Quick links: New Sale, Quotes, Closeout

#### Sale Detail (`sale-detail-page.tsx`)
- Tabbed: Details | Payments | Receipts | Refund
- Payment method breakdown with icons
- Receipt listing with "Mark Printed"
- Refund mode with confirmation dialog

#### Daily Closeout (`closeout-page.tsx`)
- Stats grid + payment method breakdown cards
- Refunds section, net revenue summary
- "Close Day" button calling `closeDailyShift`
- Closing history table from `getDailyClosings`
- Thermal receipt print format (80mm)

#### Quotes List (`quotes-page.tsx`)
- Status color-coded badges, DataTable, "New Quote" button

#### Quote Detail (`quote-detail-page.tsx`)
- Items table, summary, status actions (Send/Accept/Reject), Convert to Sale

#### Quote Form (`quote-form-page.tsx`)
- Create/edit with product search, line items, tax, discount, terms

#### Returns (`returns-page.tsx`)
- Search sales, process refund with reason dialog, refund history

#### Cash Register (`cash-register-page.tsx`)
- Active session status card, open/close dialogs with balance difference calculation
- Session history DataTable

#### Receipts (`receipts-page.tsx`)
- Per-sale receipt listing, mark printed action

### Routes
- `/sales` — list, `/sales/new` — POS, `/sales/:id` — detail
- `/sales/quotes`, `/sales/quotes/new`, `/sales/quotes/:id`, `/sales/quotes/:id/edit`
- `/sales/returns`, `/sales/register`, `/sales/receipts`, `/sales/closeout`

### Sidebar
- Sales section now has expandable sub-items: Point of Sale, Sales History, Quotes, Returns, Cash Register, Receipts, Daily Closeout

### i18n
- EN/ES expanded with 30+ new keys for quotes, returns, register, receipts, daily closing

## Files Created
```
docs/progress/MILESTONE_07.md
src/features/sales/pages/quotes-page.tsx
src/features/sales/pages/quote-detail-page.tsx
src/features/sales/pages/quote-form-page.tsx
src/features/sales/pages/returns-page.tsx
src/features/sales/pages/receipts-page.tsx
src/features/sales/pages/cash-register-page.tsx
```

## Files Modified
```
src-tauri/src/db/schema.rs — v3 with 6 new tables + receipt_number/warehouse_id on sales
src-tauri/src/commands/sales.rs — full rewrite with service architecture
src-tauri/src/db/seed.rs — 4 new POS permissions
src-tauri/src/lib.rs — 27 new command registrations
src/types/index.ts — new SalePayment, Quote, CashRegisterSession, DailyClosing, Receipt, etc.
src/lib/tauri.ts — 27 new bindings
src/features/sales/index.ts — 6 new page exports
src/features/sales/pages/pos-page.tsx — three-panel rewrite
src/features/sales/pages/sales-page.tsx — full history rewrite
src/features/sales/pages/sale-detail-page.tsx — enhanced rewrite
src/features/sales/pages/closeout-page.tsx — enhanced rewrite
src/routes/index.tsx — 6 new sales routes
src/layouts/sidebar.tsx — expandable Sales nav with 7 sub-items
src/i18n/locales/en/sales.json — 30+ new keys
src/i18n/locales/es/sales.json — 30+ new keys
```

## Note
- `cargo check` was not run (no Rust toolchain in environment). Run `cargo check && cargo build` before launching the app.

## Known Issues
- No purchase-order integration (planned for M8)
- No accounting ledger integration (planned for M8)
- Cash register does not track individual cash transactions (only aggregate)
- No barcode scanner hardware integration (front-end keyboard event listener only)
