# Tauri Command Reference

**Total commands:** 291 registered across 14 modules  
**Framework:** Tauri v2 + Rust + SQLite (rusqlite)  
**Frontend bridge:** `src/lib/tauri.ts`

---

## Tauri IPC Overview

The frontend communicates with the Rust backend through Tauri's IPC (Inter-Process Communication) mechanism:

1. **`invoke()`** — The frontend calls `invoke("<command_name>", { args })` from `@tauri-apps/api/core`.
2. **Serialization** — The command name and arguments are serialized (JSON) and sent across the IPC bridge.
3. **Tauri Router** — Tauri's runtime maps the command name to the registered `#[tauri::command]` function.
4. **Execution** — The Rust function executes, receives `State<DbState>` for database access, and returns a `Result<T, String>`.
5. **Deserialization** — The response is deserialized from `camelCase` (Rust serde) to the TypeScript types.
6. **Error handling** — Errors are returned as `String` and surface as rejected Promises in the frontend.

The frontend wraps every `invoke()` call in `src/lib/tauri.ts` with typed async functions. These are consumed by React Query hooks (`src/hooks/use-crud.ts`) or called directly in components.

---

## Module: App (4 commands)

| Command | Frontend Function | Description | Input | Output |
|---------|------------------|-------------|-------|--------|
| `get_app_version` | `getAppVersion()` | Get the current application version string | — | `string` |
| `health_check` | `healthCheck()` | Health check endpoint to verify backend is alive | — | `string` |
| `greet` | `greet(name)` | Simple greeting test function | `name: string` | `string` |
| `run_seeds` | `runSeeds()` | Trigger seed data pipeline (idempotent) | — | `string` |

**Related:** auth (for seeding default users), settings (for seeding default settings)

---

## Module: Auth (6 commands)

| Command | Frontend Function | Description | Input | Output |
|---------|------------------|-------------|-------|--------|
| `login` | `login(username, password)` | Authenticate user with bcrypt password verification | `username: string`, `password: string` | `LoginResponse` |
| `login_by_role` | `loginByRole(roleName)` | Quick login as first user of a role (dev/testing) | `roleName: string` | `LoginResponse` |
| `logout` | `logout(token)` | Invalidate user session token | `token: string` | `void` |
| `get_current_user` | `getCurrentUser(token)` | Get current session user info + permissions | `token: string` | `SessionInfo` |
| `check_session` | `checkSession(token)` | Check if a session token is still valid (not expired/active) | `token: string` | `boolean` |
| `get_user_permissions_list` | `getUserPermissionsList(token)` | Get permission keys for the current session | `token: string` | `string[]` |

**Related:** admin/users (user management), admin/roles (RBAC), app (health check)

---

## Module: Settings (4 commands)

| Command | Frontend Function | Description | Input | Output |
|---------|------------------|-------------|-------|--------|
| `get_settings` | `getSettings()` | Get all application settings (legacy table) | — | `AppSetting[]` |
| `get_setting` | `getSetting(key)` | Get a single setting by key | `key: string` | `AppSetting \| null` |
| `update_setting` | `updateSetting(key, value)` | Update a single setting value | `key: string`, `value: string` | `void` |
| `get_settings_by_group` | `getSettingsByGroup(group)` | Get all settings in a group/category | `group: string` | `AppSetting[]` |

**Related:** admin/settings (full application_settings table with categories and history)

---

## Module: Inventory (22 commands)

### Categories

| Command | Frontend Function | Description | Input | Output |
|---------|------------------|-------------|-------|--------|
| `get_categories` | `getCategories()` | Get all categories sorted by sort_order | — | `InventoryCategory[]` |
| `create_category` | `createCategory(data)` | Create a new inventory category | `name`, `description?`, `parentId?`, `sortOrder?` | `InventoryCategory` |
| `update_category` | `updateCategory(data)` | Update category fields | `id`, `name`, `description?`, `parentId?`, `sortOrder?` | `InventoryCategory` |
| `archive_category` | `archiveCategory(id)` | Soft-delete a category (set is_active=0) | `id: number` | `void` |
| `restore_category` | `restoreCategory(id)` | Restore an archived category | `id: number` | `void` |

### Brands

| Command | Frontend Function | Description | Input | Output |
|---------|------------------|-------------|-------|--------|
| `get_brands` | `getBrands()` | Get all brands ordered by name | — | `Brand[]` |
| `create_brand` | `createBrand(data)` | Create a new product brand | `name`, `description?`, `country?`, `website?` | `Brand` |
| `update_brand` | `updateBrand(data)` | Update brand information | `id`, `name`, `description?`, `country?`, `website?` | `Brand` |
| `archive_brand` | `archiveBrand(id)` | Soft-delete a brand | `id: number` | `void` |

### Manufacturers

| Command | Frontend Function | Description | Input | Output |
|---------|------------------|-------------|-------|--------|
| `get_manufacturers` | `getManufacturers()` | Get all manufacturers ordered by name | — | `Manufacturer[]` |
| `create_manufacturer` | `createManufacturer(data)` | Create a new manufacturer | `name`, `country?`, `phone?`, `email?`, `website?`, `notes?` | `Manufacturer` |
| `update_manufacturer` | `updateManufacturer(data)` | Update manufacturer info | `id`, `name`, `country?`, `phone?`, `email?`, `website?`, `notes?` | `Manufacturer` |

### Suppliers

| Command | Frontend Function | Description | Input | Output |
|---------|------------------|-------------|-------|--------|
| `get_suppliers` | `getSuppliers()` | Get all inventory suppliers | — | `InventorySupplier[]` |
| `create_supplier` | `createSupplier(data)` | Create a new supplier | `companyName`, `contactPerson?`, `phone?`, ... | `InventorySupplier` |
| `update_supplier` | `updateSupplier(data)` | Update supplier details | `id`, `companyName`, ... | `InventorySupplier` |
| `archive_supplier` | `archiveSupplier(id)` | Soft-delete a supplier | `id: number` | `void` |

### Warehouses & Storage

| Command | Frontend Function | Description | Input | Output |
|---------|------------------|-------------|-------|--------|
| `get_warehouses` | `getWarehouses()` | Get all warehouses | — | `Warehouse[]` |
| `create_warehouse` | `createWarehouse(data)` | Create a new warehouse | `name`, `code`, `address?`, `city?`, `stateProvince?`, `country?`, `manager?`, `phone?` | `Warehouse` |
| `update_warehouse` | `updateWarehouse(data)` | Update warehouse info | `id`, `name`, `code`, ... | `Warehouse` |
| `get_storage_locations` | `getStorageLocations(warehouseId?)` | Get storage locations, optional filter by warehouse | `warehouseId?: number` | `StorageLocation[]` |
| `create_storage_location` | `createStorageLocation(data)` | Create a storage bin/location | `warehouseId`, `zone?`, `aisle?`, `shelf?`, `bin?`, `code`, `description?` | `StorageLocation` |
| `update_storage_location` | `updateStorageLocation(data)` | Update storage location | `id`, `warehouseId`, `code`, ... | `StorageLocation` |
| `archive_storage_location` | `archiveStorageLocation(id)` | Soft-delete a storage location | `id: number` | `void` |

### Products

| Command | Frontend Function | Description | Input | Output |
|---------|------------------|-------------|-------|--------|
| `get_products` | `getProducts(page, pageSize, search?)` | Paginated product list with search | `page`, `pageSize`, `search?: string` | `InventoryPaginatedResult<InventoryProduct>` |
| `get_product` | `getProduct(id)` | Get a single product by ID | `id: number` | `InventoryProduct` |
| `create_product` | `createProduct(data)` | Create a new product with all fields | `Partial<InventoryProduct>` | `InventoryProduct` |
| `update_product` | `updateProduct(data)` | Update product fields | `Partial<InventoryProduct> & { id }` | `InventoryProduct` |
| `archive_product` | `archiveProduct(id)` | Soft-delete a product | `id: number` | `void` |
| `restore_product` | `restoreProduct(id)` | Restore an archived product | `id: number` | `void` |

### Dashboard & Movements

| Command | Frontend Function | Description | Input | Output |
|---------|------------------|-------------|-------|--------|
| `get_dashboard_stats` | `getDashboardStats()` | Get inventory dashboard statistics | — | `DashboardStats` |
| `get_inventory_movements` | `getInventoryMovements(productId?)` | Get inventory movement history, optional filter | `productId?: number` | `InventoryMovement[]` |
| `create_inventory_movement` | `createInventoryMovement(data)` | Record a stock movement (adjustment) | `productId`, `quantity`, `type`, ... | `InventoryMovement` |

### Product Images

| Command | Frontend Function | Description | Input | Output |
|---------|------------------|-------------|-------|--------|
| `get_product_images` | `getProductImages(productId)` | Get all images for a product | `productId: number` | `ProductImage[]` |
| `create_product_image` | `createProductImage(data)` | Add an image to a product | `productId`, `filePath`, `isPrimary?`, `sortOrder?` | `ProductImage` |
| `delete_product_image` | `deleteProductImage(id)` | Remove a product image | `id: number` | `void` |

**Related:** sales (stock for POS), purchases (receive stock), reports/inventory (valuation, low stock)

---

## Module: Customers (15 commands)

| Command | Frontend Function | Description | Input | Output |
|---------|------------------|-------------|-------|--------|
| `get_customers` | `getCustomers(search?)` | Search/filter customer list | `search?: string` | `Customer[]` |
| `get_customer` | — (not in tauri.ts, but registered) | Get a single customer by ID | `id: number` | `Customer` |
| `create_customer` | `createCustomer(name, email?, phone?, ...)` | Create a new customer | `name`, `email?`, `phone?`, `address?`, `city?`, `state?`, `postalCode?`, `country?`, `notes?` | `Customer` |
| `update_customer` | `updateCustomer(id, name, email?, ...)` | Update customer information | `id`, `name`, `email?`, `phone?`, ... | `Customer` |
| `archive_customer` | `archiveCustomer(id)` | Soft-delete a customer | `id: number` | `void` |
| `get_customer_detail` | `getCustomerDetail(id)` | Get detailed customer info (with stats) | `id: number` | `CustomerDetail` |
| `get_customer_sales` | `getCustomerSales(customerId)` | Get sales history for a customer | `customerId: number` | `CustomerSale[]` |
| `get_credit_accounts` | — (registered but not in tauri.ts) | Get all credit accounts | — | `CreditAccount[]` |
| `get_credit_account` | `getCreditAccount(customerId)` | Get credit account for a customer | `customerId: number` | `CreditAccount` |
| `create_credit_account` | `createCreditAccount(customerId, creditLimit)` | Create a credit account for a customer | `customerId`, `creditLimit` | `CreditAccount` |
| `update_credit_account` | — (registered but not in tauri.ts) | Update credit account details | `id`, ... | `CreditAccount` |
| `get_credit_transactions` | `getCreditTransactions(accountId)` | Get transactions for a credit account | `accountId: number` | `CreditTransaction[]` |
| `add_credit_transaction` | `addCreditTransaction(accountId, amount, ...)` | Add a credit transaction | `accountId`, `amount`, `transactionType`, ... | `CreditTransaction` |
| `get_communications` | `getCommunications(customerId)` | Get communication log for a customer | `customerId: number` | `CommunicationEntry[]` |
| `create_communication` | `createCommunication(input, createdBy)` | Log a communication entry | `input: CommunicationInput`, `createdBy: number` | `CommunicationEntry` |
| `get_customer_notes` | `getCustomerNotes(customerId)` | Get internal notes for a customer | `customerId: number` | `CustomerNote[]` |
| `create_customer_note` | `createCustomerNote(customerId, ...)` | Add an internal note | `customerId`, `noteType`, `title?`, `content?`, `isPrivate`, `createdBy` | `CustomerNote` |
| `get_customer_timeline` | `getCustomerTimeline(customerId)` | Get full customer activity timeline | `customerId: number` | `TimelineEntry[]` |

**Related:** sales (link sales to customers), vehicles (customer vehicles), crm (dashboard), customers/credit

---

## Module: Vehicles (12 commands)

### Brands

| Command | Frontend Function | Description | Input | Output |
|---------|------------------|-------------|-------|--------|
| `get_vehicle_brands` | `getVehicleBrands(search?)` | Get vehicle brands, optional search | `search?: string` | `VehicleBrand[]` |
| `create_vehicle_brand` | `createVehicleBrand(name, desc?, country?)` | Create a vehicle brand (e.g. Toyota) | `name`, `description?`, `country?` | `VehicleBrand` |
| `update_vehicle_brand` | `updateVehicleBrand(id, name, desc?, country?)` | Update vehicle brand | `id`, `name`, `description?`, `country?` | `VehicleBrand` |

### Models

| Command | Frontend Function | Description | Input | Output |
|---------|------------------|-------------|-------|--------|
| `get_vehicle_models` | `getVehicleModels(brandId?, search?)` | Get models, optional filter by brand | `brandId?: number`, `search?: string` | `VehicleModel[]` |
| `create_vehicle_model` | `createVehicleModel(brandId, name)` | Create a vehicle model (e.g. Corolla) | `brandId`, `name` | `VehicleModel` |

### Generations

| Command | Frontend Function | Description | Input | Output |
|---------|------------------|-------------|-------|--------|
| `get_vehicle_generations` | `getVehicleGenerations(modelId)` | Get generations for a model | `modelId: number` | `VehicleGeneration[]` |
| `create_vehicle_generation` | `createVehicleGeneration(modelId, name?, yearStart?, yearEnd?)` | Create a vehicle generation | `modelId`, `name?`, `yearStart?`, `yearEnd?` | `VehicleGeneration` |

### Engines

| Command | Frontend Function | Description | Input | Output |
|---------|------------------|-------------|-------|--------|
| `get_vehicle_engines` | `getVehicleEngines(search?)` | Get engine types, optional search | `search?: string` | `VehicleEngine[]` |
| `create_vehicle_engine` | `createVehicleEngine(name, displacement?, power?, fuelType?)` | Create an engine type | `name`, `displacement?`, `power?`, `fuelType?` | `VehicleEngine` |

### Transmissions

| Command | Frontend Function | Description | Input | Output |
|---------|------------------|-------------|-------|--------|
| `get_vehicle_transmissions` | `getVehicleTransmissions()` | Get all transmission types | — | `VehicleTransmission[]` |
| `create_vehicle_transmission` | `createVehicleTransmission(name, type?, gears?)` | Create a transmission type | `name`, `type?`, `gears?` | `VehicleTransmission` |

### Fuels

| Command | Frontend Function | Description | Input | Output |
|---------|------------------|-------------|-------|--------|
| `get_vehicle_fuels` | `getVehicleFuels()` | Get all fuel types | — | `VehicleFuel[]` |
| `create_vehicle_fuel` | `createVehicleFuel(name)` | Create a fuel type | `name` | `VehicleFuel` |

### Customer Vehicles

| Command | Frontend Function | Description | Input | Output |
|---------|------------------|-------------|-------|--------|
| `get_customer_vehicles` | `getCustomerVehicles(customerId)` | Get vehicles for a customer | `customerId: number` | `CustomerVehicle[]` |
| `get_customer_vehicle` | `getCustomerVehicle(id)` | Get single customer vehicle | `id: number` | `CustomerVehicle` |
| `create_customer_vehicle` | `createCustomerVehicle(params)` | Register a customer vehicle | `customerId`, `licensePlate?`, `brandId?`, `modelId?`, ... | `CustomerVehicle` |
| `update_customer_vehicle` | `updateCustomerVehicle(id, params)` | Update customer vehicle info | `id`, `customerId`, ... | `CustomerVehicle` |
| `delete_customer_vehicle` | `deleteCustomerVehicle(id)` | Remove a customer vehicle | `id: number` | `void` |

**Related:** compatibility (link products to vehicles), reminders (service reminders by vehicle)

---

## Module: Compatibility (5 commands)

| Command | Frontend Function | Description | Input | Output |
|---------|------------------|-------------|-------|--------|
| `get_product_compatibility` | `getProductCompatibility(productId)` | Get compatibility entries for a product | `productId: number` | `CompatibilityEntry[]` |
| `create_compatibility` | `createCompatibility(productId, brandId?, ...)` | Add a compatibility entry | `productId`, `brandId?`, `modelId?`, `generationId?`, `engineId?`, `transmissionId?`, `yearStart?`, `yearEnd?`, `notes?` | `CompatibilityEntry` |
| `delete_compatibility` | `deleteCompatibility(id)` | Remove a compatibility entry | `id: number` | `void` |
| `search_compatible_products` | `searchCompatibleProducts(brandId?, ...)` | Search products compatible with vehicle specs | `brandId?`, `modelId?`, `year?`, `engineId?`, `transmissionId?`, `search?` | `ProductRecommendation[]` |
| `get_recommendations_for_vehicle` | `getRecommendationsForVehicle(brandId?, modelId?, year?)` | Get product recommendations for a vehicle | `brandId?`, `modelId?`, `year?` | `ProductRecommendation[]` |

**Related:** vehicles (brands, models, engines), inventory/products (linked product)

---

## Module: Reminders (5 commands)

| Command | Frontend Function | Description | Input | Output |
|---------|------------------|-------------|-------|--------|
| `get_service_reminders` | `getServiceReminders(status?, customerId?)` | Get service reminders, optional filters | `status?: string`, `customerId?: number` | `ServiceReminder[]` |
| `get_service_reminder` | `getServiceReminder(id)` | Get single reminder by ID | `id: number` | `ServiceReminder` |
| `create_service_reminder` | `createServiceReminder(customerId, vehicleId?, ...)` | Create a new service reminder | `customerId`, `vehicleId?`, `reminderType`, `title`, `description?`, `dueDate?`, `dueMileage?`, `notes?`, `createdBy` | `ServiceReminder` |
| `update_service_reminder_status` | `updateServiceReminderStatus(id, status, userId)` | Update reminder status (completed/cancelled) | `id`, `status`, `userId` | `ServiceReminder` |
| `get_overdue_reminders` | `getOverdueReminders()` | Get all overdue reminders | — | `ServiceReminder[]` |

**Related:** customers (link to customer), vehicles (link to vehicle), warranty (similar lifecycle management)

---

## Module: Warranty (5 commands)

| Command | Frontend Function | Description | Input | Output |
|---------|------------------|-------------|-------|--------|
| `get_warranties` | `getWarranties(customerId?, status?)` | Get warranties, optional filters | `customerId?: number`, `status?: string` | `Warranty[]` |
| `get_warranty` | `getWarranty(id)` | Get single warranty by ID | `id: number` | `Warranty` |
| `create_warranty` | `createWarranty(saleId?, productId?, ...)` | Register a warranty | `saleId?`, `productId?`, `customerId`, `vehicleId?`, `warrantyType`, `periodMonths`, `startDate`, `notes?`, `createdBy` | `Warranty` |
| `update_warranty_status` | `updateWarrantyStatus(id, status)` | Update warranty status (active/expired/claimed) | `id`, `status` | `Warranty` |
| `get_expiring_warranties` | `getExpiringWarranties(days)` | Get warranties expiring within N days | `days: number` | `Warranty[]` |

**Related:** sales (warranty from sale), inventory/products (warranty on product), reminders (similar scheduling)

---

## Module: CRM (2 commands)

| Command | Frontend Function | Description | Input | Output |
|---------|------------------|-------------|-------|--------|
| `get_crm_dashboard` | `getCrmDashboard()` | Get CRM dashboard statistics | — | `CrmDashboard` |
| `get_customers_by_month` | `getCustomersByMonth(months)` | Get customer registration count by month | `months: number` | `[string, number][]` |

**Related:** customers (data source), reports/customers (detailed reports)

---

## Module: Sales (28 commands)

### Sales CRUD

| Command | Frontend Function | Description | Input | Output |
|---------|------------------|-------------|-------|--------|
| `get_sales` | `getSales()` | Get all sales, ordered by created_at DESC | — | `Sale[]` |
| `get_sale` | `getSale(id)` | Get single sale with customer name | `id: number` | `Sale` |
| `get_sale_items` | `getSaleItems(saleId)` | Get items for a sale | `saleId: number` | `SaleItem[]` |
| `get_sale_payments` | `getSalePayments(saleId)` | Get payments for a sale | `saleId: number` | `SalePayment[]` |
| `create_sale` | `createSale(data)` | Legacy: create a sale (internally calls process_checkout) | `customerId?`, `userId?`, `subtotal`, `taxRate`, `total`, `paymentMethod`, `items[]`, ... | `Sale` |
| `refund_sale` | `refundSale(saleId, reason?)` | Refund a sale, restore stock, create movement | `saleId`, `reason?: string` | `Sale` |
| `search_sales` | `searchSales(query)` | Search sales by number or customer name | `query: string` | `Sale[]` |

### POS

| Command | Frontend Function | Description | Input | Output |
|---------|------------------|-------------|-------|--------|
| `search_products_for_pos` | `searchProductsForPos(search)` | Search active products for POS (name/sku/barcode) | `search: string` | `ProductForPos[]` |
| `process_checkout` | `processCheckout(input)` | Full checkout: create sale + items + payments + update stock + create movements + receipt | `input: CheckoutInput` | `CheckoutResult` |

### Quotes

| Command | Frontend Function | Description | Input | Output |
|---------|------------------|-------------|-------|--------|
| `get_quotes` | `getQuotes()` | Get all quotes | — | `Quote[]` |
| `get_quote` | `getQuote(id)` | Get single quote with items count | `id: number` | `Quote` |
| `get_quote_items` | `getQuoteItems(quoteId)` | Get items for a quote | `quoteId: number` | `QuoteItem[]` |
| `create_quote` | `createQuote(input)` | Create a new quote (draft status) | `input: QuoteInput` | `Quote` |
| `update_quote` | `updateQuote(id, input)` | Update quote and replace items | `id`, `input: QuoteInput` | `Quote` |
| `delete_quote` | `deleteQuote(id)` | Delete a quote | `id: number` | `void` |
| `update_quote_status` | `updateQuoteStatus(id, status)` | Update quote status (approved/rejected/converted) | `id`, `status` | `Quote` |
| `convert_quote_to_sale` | `convertQuoteToSale(quoteId, userId?)` | Convert a quote to a sale via checkout pipeline | `quoteId`, `userId?` | `CheckoutResult` |

### Cash Register

| Command | Frontend Function | Description | Input | Output |
|---------|------------------|-------------|-------|--------|
| `get_cash_register_status` | `getCashRegisterStatus()` | Check if a cash register session is open | — | `CashRegisterSession \| null` |
| `open_cash_register` | `openCashRegister(userId, openingBalance, notes?)` | Open a new cash register session | `userId`, `openingBalance`, `notes?` | `CashRegisterSession` |
| `close_cash_register` | `closeCashRegister(id, closingBalance, notes?)` | Close cash register, calculate expected vs actual | `id`, `closingBalance`, `notes?` | `CashRegisterSession` |
| `get_cash_register_sessions` | `getCashRegisterSessions()` | Get all cash register sessions | — | `CashRegisterSession[]` |

### Daily Closings

| Command | Frontend Function | Description | Input | Output |
|---------|------------------|-------------|-------|--------|
| `close_daily_shift` | `closeDailyShift(closedBy, notes?)` | Close the daily shift (one per day) | `closedBy`, `notes?` | `DailyClosing` |
| `get_daily_closings` | `getDailyClosings()` | Get all daily closings | — | `DailyClosing[]` |

### Sales Summary & Charts

| Command | Frontend Function | Description | Input | Output |
|---------|------------------|-------------|-------|--------|
| `get_sales_summary` | `getSalesSummary()` | Get today/week/month sales KPIs, top 10 products | — | `SalesSummary` |
| `get_sales_chart_data` | `getSalesChartData(days)` | Get daily revenue and order count chart data | `days: number` | `SalesChartData` |
| `get_daily_closeout` | `getDailyCloseout()` | Get today's sales breakdown by payment method | — | `DailyCloseout` |

### Receipts

| Command | Frontend Function | Description | Input | Output |
|---------|------------------|-------------|-------|--------|
| `get_receipts_for_sale` | `getReceiptsForSale(saleId)` | Get all receipts for a sale | `saleId: number` | `Receipt[]` |
| `get_receipt` | `getReceipt(id)` | Get single receipt by ID | `id: number` | `Receipt` |
| `mark_receipt_printed` | `markReceiptPrinted(id)` | Mark receipt as printed | `id: number` | `Receipt` |

**Related:** inventory (stock updates), customers (sale history), purchases (similar patterns), reports/sales

---

## Module: Purchases (25 commands)

### Purchase Orders

| Command | Frontend Function | Description | Input | Output |
|---------|------------------|-------------|-------|--------|
| `get_purchase_orders` | `getPurchaseOrders(params?)` | Get purchase orders with optional filters | `search?`, `status?`, `supplierId?`, `warehouseId?`, `buyer?`, `dateFrom?`, `dateTo?` | `PurchaseOrder[]` |
| `get_purchase_order` | `getPurchaseOrder(id)` | Get single purchase order | `id: number` | `PurchaseOrder` |
| `create_purchase_order` | `createPurchaseOrder(userId, input)` | Create a new purchase order | `userId`, `input: PurchaseOrderInput` | `PurchaseOrder` |
| `update_purchase_order` | `updatePurchaseOrder(id, input)` | Update purchase order fields | `id`, `input: PurchaseOrderInput` | `PurchaseOrder` |
| `update_purchase_order_status` | `updatePurchaseOrderStatus(id, status, userId)` | Approve/reject/cancel PO | `id`, `status`, `userId` | `PurchaseOrder` |
| `delete_purchase_order` | `deletePurchaseOrder(id)` | Delete a purchase order | `id: number` | `void` |
| `get_purchase_order_items` | `getPurchaseOrderItems(purchaseOrderId)` | Get items for a PO | `purchaseOrderId: number` | `PurchaseOrderItem[]` |

### Purchase Requests

| Command | Frontend Function | Description | Input | Output |
|---------|------------------|-------------|-------|--------|
| `get_purchase_requests` | `getPurchaseRequests(status?)` | Get purchase requests, optional status filter | `status?: string` | `PurchaseRequest[]` |
| `get_purchase_request` | `getPurchaseRequest(id)` | Get single purchase request | `id: number` | `PurchaseRequest` |
| `get_purchase_request_items` | — (registered but not in tauri.ts) | Get items for a purchase request | `id: number` | `PurchaseRequestItem[]` |
| `create_purchase_request` | `createPurchaseRequest(userId, input)` | Create a purchase request | `userId`, `input: PurchaseRequestInput` | `PurchaseRequest` |
| `update_purchase_request_status` | `updatePurchaseRequestStatus(id, status)` | Approve/reject purchase request | `id`, `status` | `PurchaseRequest` |

### Receiving

| Command | Frontend Function | Description | Input | Output |
|---------|------------------|-------------|-------|--------|
| `get_purchase_receipts` | `getPurchaseReceipts(purchaseOrderId?)` | Get receiving records, optional by PO | `purchaseOrderId?: number` | `PurchaseReceipt[]` |
| `get_purchase_receipt` | `getPurchaseReceipt(id)` | Get single receiving record | `id: number` | `PurchaseReceipt` |
| `get_purchase_receipt_items` | — (registered but not in tauri.ts) | Get items for a receiving record | `id: number` | `PurchaseReceiptItem[]` |
| `receive_purchase_order` | `receivePurchaseOrder(poId, userId, warehouseId, notes, items)` | Receive items from a PO (creates receipt + movement) | `poId`, `userId`, `warehouseId`, `notes`, `items[]` | `PurchaseReceipt` |

### Purchase Returns

| Command | Frontend Function | Description | Input | Output |
|---------|------------------|-------------|-------|--------|
| `get_purchase_returns` | `getPurchaseReturns(supplierId?)` | Get purchase returns, optional by supplier | `supplierId?: number` | `PurchaseReturn[]` |
| `get_purchase_return` | `getPurchaseReturn(id)` | Get single purchase return | `id: number` | `PurchaseReturn` |
| `get_purchase_return_items` | — (registered but not in tauri.ts) | Get items for a return record | `id: number` | `PurchaseReturnItem[]` |
| `create_purchase_return` | `createPurchaseReturn(userId, input)` | Create a return to supplier | `userId`, `input: PurchaseReturnInput` | `PurchaseReturn` |

### Supplier Catalog

| Command | Frontend Function | Description | Input | Output |
|---------|------------------|-------------|-------|--------|
| `get_supplier_products` | `getSupplierProducts(supplierId?, productId?)` | Get supplier-product catalog entries | `supplierId?`, `productId?` | `SupplierProduct[]` |
| `create_supplier_product` | `createSupplierProduct(input)` | Link product to supplier with pricing | `input: SupplierProductInput` | `SupplierProduct` |
| `update_supplier_product` | `updateSupplierProduct(id, input)` | Update supplier product pricing/ref | `id`, `input: SupplierProductInput` | `SupplierProduct` |
| `delete_supplier_product` | `deleteSupplierProduct(id)` | Remove supplier-product link | `id: number` | `void` |

### Cost History & Dashboard

| Command | Frontend Function | Description | Input | Output |
|---------|------------------|-------------|-------|--------|
| `get_cost_history` | `getCostHistory(productId?, supplierId?)` | Get cost price history | `productId?`, `supplierId?` | `CostHistory[]` |
| `get_purchase_dashboard` | `getPurchaseDashboard()` | Get purchasing KPIs and overview | — | `PurchaseDashboard` |
| `get_reorder_suggestions` | `getReorderSuggestions()` | Get suggested products to reorder | — | `ReorderSuggestion[]` |
| `get_supplier_performance` | `getSupplierPerformance(supplierId?)` | Get supplier delivery/quality metrics | `supplierId?` | `SupplierPerformance[]` |

**Related:** inventory (stock updates), reports/purchasing, admin/settings (PO prefix config)

---

## Module: Reports (44+ commands)

### Executive Dashboard

| Command | Frontend Function | Description | Input | Output |
|---------|------------------|-------------|-------|--------|
| `get_executive_dashboard` | `getExecutiveDashboard()` | Get executive dashboard KPIs | — | `ExecutiveDashboard` |
| `get_dashboard_widgets` | `getDashboardWidgets()` | Get dashboard widget configurations | — | `DashboardWidgets` |
| `get_chart_data` | `getChartData()` | Get chart data for all dashboard charts | — | `ChartData` |

### Sales Reports

| Command | Frontend Function | Description | Input | Output |
|---------|------------------|-------------|-------|--------|
| `get_sales_report_daily` | `getSalesReportDaily(f)` | Daily sales report | `f: SalesReportFilter` | `SalesReportRow[]` |
| `get_sales_report_weekly` | `getSalesReportWeekly(f)` | Weekly sales aggregation | `f: SalesReportFilter` | `SalesReportRow[]` |
| `get_sales_report_monthly` | `getSalesReportMonthly(f)` | Monthly sales aggregation | `f: SalesReportFilter` | `SalesReportRow[]` |
| `get_sales_report_yearly` | `getSalesReportYearly(f)` | Yearly sales aggregation | `f: SalesReportFilter` | `SalesReportRow[]` |
| `get_sales_by_cashier` | `getSalesByCashier(f)` | Sales grouped by cashier/user | `f: SalesReportFilter` | `SalesByCashier[]` |
| `get_sales_by_payment_method` | `getSalesByPaymentMethod(f)` | Sales grouped by payment method | `f: SalesReportFilter` | `SalesByPaymentMethod[]` |
| `get_sales_discount_analysis` | `getSalesDiscountAnalysis(f)` | Discount analysis report | `f: SalesReportFilter` | `DiscountAnalysis` |
| `get_sales_returns_summary` | `getSalesReturnsSummary(f)` | Returns and refunds summary | `f: SalesReportFilter` | `ReturnsSummary` |
| `get_sales_tax_summary` | `getSalesTaxSummary(f)` | Tax collected summary | `f: SalesReportFilter` | `TaxSummary` |
| `get_sales_quote_conversion` | `getSalesQuoteConversion()` | Quote-to-sale conversion rate | — | `number` |

### Inventory Reports

| Command | Frontend Function | Description | Input | Output |
|---------|------------------|-------------|-------|--------|
| `get_inventory_report` | `getInventoryReport(filter)` | Full inventory report with filters | `filter: InventoryReportFilter` | `InventoryReportRow[]` |
| `get_inventory_valuation` | `getInventoryValuation()` | Inventory valuation (qty × cost) | — | `InventoryValuation[]` |
| `get_inventory_low_stock` | `getInventoryLowStock()` | Low stock product alerts | — | `StockStatusItem[]` |
| `get_inventory_movement_report` | `getInventoryMovementReport(months)` | Stock movement summary | `months: number` | `MovementSummary[]` |
| `get_inventory_aging` | `getInventoryAging(days)` | Inventory aging (slow movers) | `days: number` | `AgingItem[]` |
| `get_inventory_overstock` | `getInventoryOverstock()` | Overstock product alerts | — | `StockStatusItem[]` |
| `get_inventory_fast_slow` | `getInventoryFastSlow(days)` | Fast vs slow moving analysis | `days: number` | `AgingItem[]` |

### Purchasing Reports

| Command | Frontend Function | Description | Input | Output |
|---------|------------------|-------------|-------|--------|
| `get_purchases_by_month` | `getPurchasesByMonth(f)` | Purchases aggregated by month | `f: PurchaseReportFilter` | `PurchaseReportRow[]` |
| `get_purchases_by_supplier` | `getPurchasesBySupplier(f)` | Purchases grouped by supplier | `f: PurchaseReportFilter` | `PurchaseBySupplier[]` |
| `get_supplier_performance_report` | `getSupplierPerformanceReport()` | Supplier performance metrics | — | `SupplierPerformance[]` |
| `get_po_status_summary` | `getPoStatusSummary()` | PO status breakdown (draft/approved/received) | — | `POStatusSummary[]` |
| `get_products_to_reorder` | `getProductsToReorder()` | Products needing reorder | — | `ProductToReorder[]` |
| `get_purchase_cost_history` | `getPurchaseCostHistory(productId?)` | Product cost trends | `productId?: number` | `CostHistoryEntry[]` |

### Customer Reports

| Command | Frontend Function | Description | Input | Output |
|---------|------------------|-------------|-------|--------|
| `get_top_customers` | `getTopCustomers(limit)` | Top customers by revenue | `limit: number` | `CustomerReportRow[]` |
| `get_customer_growth_report` | `getCustomerGrowthReport()` | Customer acquisition over time | — | `CustomerGrowthRow[]` |
| `get_customer_locations` | `getCustomerLocations()` | Customer geographic distribution | — | `CustomerLocation[]` |
| `get_inactive_customers` | `getInactiveCustomers(days)` | Customers with no activity | `days: number` | `CustomerReportRow[]` |
| `get_customer_credit_summary` | `getCustomerCreditSummary()` | Credit account balances summary | — | `CustomerCreditSummary` |
| `get_customer_service_summary` | `getCustomerServiceSummary()` | Service/warranty summary | — | `CustomerServiceSummary` |

### Supplier Reports

| Command | Frontend Function | Description | Input | Output |
|---------|------------------|-------------|-------|--------|
| `get_supplier_ranking` | `getSupplierRanking()` | Supplier ranking by volume/value | — | `SupplierRanking[]` |
| `get_lead_time_analysis` | `getLeadTimeAnalysis()` | Supplier lead time analysis | — | `LeadTimeAnalysis[]` |

### Warehouse Reports

| Command | Frontend Function | Description | Input | Output |
|---------|------------------|-------------|-------|--------|
| `get_warehouse_utilization` | `getWarehouseUtilization()` | Warehouse capacity utilization | — | `WarehouseUtilization[]` |
| `get_warehouse_stock_distribution` | `getWarehouseStockDistribution(warehouseId)` | Stock value distribution by warehouse | `warehouseId: number` | `InventoryValuation[]` |
| `get_warehouse_adjustments` | `getWarehouseAdjustments()` | Recent stock adjustment summary | — | `WarehouseAdjustmentSummary[]` |

### Profitability

| Command | Frontend Function | Description | Input | Output |
|---------|------------------|-------------|-------|--------|
| `get_profit_summary` | `getProfitSummary(months)` | Profit summary over N months | `months: number` | `ProfitSummary[]` |
| `get_profit_by_category` | `getProfitByCategory()` | Profit by product category | — | `ProfitByEntity[]` |
| `get_profit_by_product` | `getProfitByProduct(limit)` | Profit by product (top N) | `limit: number` | `ProfitByEntity[]` |
| `get_profit_by_supplier` | `getProfitBySupplier()` | Profit by supplier | — | `ProfitByEntity[]` |
| `get_profit_by_brand` | `getProfitByBrand()` | Profit by brand | — | `ProfitByEntity[]` |
| `get_profit_by_customer` | `getProfitByCustomer(limit)` | Profit by customer | `limit: number` | `ProfitByEntity[]` |
| `get_profit_by_warehouse` | `getProfitByWarehouse()` | Profit by warehouse | — | `ProfitByEntity[]` |

### KPIs

| Command | Frontend Function | Description | Input | Output |
|---------|------------------|-------------|-------|--------|
| `get_kpi_values` | `getKpiValues()` | Get current KPI values (dashboard metrics) | — | `KpiValue[]` |
| `get_kpi_definitions` | `getKpiDefinitions()` | Get KPI definitions and formulas | — | `KpiDefinition[]` |

### Saved & Scheduled Reports

| Command | Frontend Function | Description | Input | Output |
|---------|------------------|-------------|-------|--------|
| `get_saved_reports` | `getSavedReports(module?)` | Get saved report configurations | `module?: string` | `SavedReport[]` |
| `create_saved_report` | `createSavedReport(input, createdBy)` | Save a report configuration | `input: SavedReportInput`, `createdBy` | `SavedReport` |
| `delete_saved_report` | `deleteSavedReport(id)` | Delete a saved report | `id: number` | `void` |
| `get_scheduled_reports` | `getScheduledReports()` | Get scheduled report jobs | — | `ScheduledReport[]` |
| `create_scheduled_report` | `createScheduledReport(name, ...)` | Schedule a report for auto-generation | `name`, `savedReportId?`, `frequency`, `dayOfWeek?`, `dayOfMonth?`, `time`, `exportFormat`, `createdBy` | `ScheduledReport` |
| `toggle_scheduled_report` | `toggleScheduledReport(id, isActive)` | Enable/disable a scheduled report | `id`, `isActive` | `void` |
| `get_report_history` | `getReportHistory(limit)` | Get report generation history | `limit: number` | `ReportHistoryEntry[]` |
| `log_report_generation` | `logReportGeneration(reportName, ...)` | Log a report generation event | `reportName`, `module`, `filters?`, `exportFormat?`, `executionTimeMs`, `rowCount`, `filePath?`, `generatedBy` | `void` |
| `get_report_templates` | `getReportTemplates(module?)` | Get report template definitions | `module?: string` | `ReportTemplate[]` |
| `get_dashboard_preferences` | `getDashboardPreferences(userId)` | Get user dashboard layout/JSON | `userId: number` | `string` |
| `save_dashboard_preferences` | `saveDashboardPreferences(userId, widgets)` | Save user dashboard layout | `userId`, `widgets: string` | `void` |

**Related:** sales, purchases, inventory, customers (all are data sources for reports)

---

## Module: Admin (94 commands)

### Admin Dashboard (4)

| Command | Frontend Function | Description | Input | Output |
|---------|------------------|-------------|-------|--------|
| `get_admin_dashboard` | `getAdminDashboard()` | Admin overview KPIs | — | `AdminDashboard` |
| `get_user_activity_chart` | `getUserActivityChart(days?)` | Daily active users chart data | `days?: number` | `UserActivityPoint[]` |
| `get_database_growth_chart` | `getDatabaseGrowthChart(days?)` | DB size growth chart data | `days?: number` | `DbGrowthPoint[]` |
| `get_recent_audit_events` | `getRecentAuditEvents(limit?)` | Recent audit log events | `limit?: number` | `AuditEvent[]` |

### Admin Users (12)

| Command | Frontend Function | Description | Input | Output |
|---------|------------------|-------------|-------|--------|
| `get_admin_users` | `getAdminUsers(search?, roleId?, isActive?, page?, pageSize?)` | List users with search/filter/pagination | `search?`, `roleId?`, `isActive?`, `page?`, `pageSize?` | `AdminUser[]` |
| `get_admin_user` | `getAdminUser(id)` | Get single user details | `id: number` | `AdminUser` |
| `create_admin_user` | `createAdminUser(input, createdBy)` | Create a new system user | `input: { username, email, password, fullName, phone?, roleId?, notes? }`, `createdBy` | `AdminUser` |
| `update_admin_user` | `updateAdminUser(input)` | Update user fields | `input: { id, username?, email?, fullName?, phone?, roleId?, isActive?, notes? }` | `AdminUser` |
| `archive_admin_user` | `archiveAdminUser(id)` | Soft-delete (disable) a user | `id: number` | `void` |
| `restore_admin_user` | `restoreAdminUser(id)` | Re-enable a disabled user | `id: number` | `void` |
| `reset_user_password` | `resetUserPassword(id, newPassword, requireChange)` | Reset a user's password | `id`, `newPassword`, `requireChange` | `void` |
| `lock_user_account` | `lockUserAccount(id, durationMinutes?)` | Lock a user account temporarily | `id`, `durationMinutes?` | `void` |
| `unlock_user_account` | `unlockUserAccount(id)` | Unlock a user account | `id: number` | `void` |
| `get_user_sessions` | `getUserSessions(userId)` | Get active/past sessions for a user | `userId: number` | `SessionRecord[]` |
| `revoke_user_session` | `revokeUserSession(sessionId)` | Force-terminate a session | `sessionId: number` | `void` |
| `get_total_user_count` | `getTotalUserCount()` | Get total number of system users | — | `number` |

### Admin Roles & Permissions (10)

| Command | Frontend Function | Description | Input | Output |
|---------|------------------|-------------|-------|--------|
| `get_admin_roles` | `getAdminRoles(search?)` | List all roles | `search?: string` | `AdminRole[]` |
| `get_admin_role` | `getAdminRole(id)` | Get role with associated permissions | `id: number` | `RoleWithPermissions` |
| `get_all_permissions` | `getAllPermissions(search?, group?)` | List all permissions, optional filter | `search?`, `group?` | `AdminPermission[]` |
| `get_permission_groups` | `getPermissionGroups()` | Get distinct permission groups | — | `string[]` |
| `create_admin_role` | `createAdminRole(input)` | Create a new role | `input: { name, description?, permissions[] }` | `AdminRole` |
| `update_admin_role` | `updateAdminRole(input)` | Update role name/description/permissions | `input: { id, name?, description?, isActive?, permissions[] }` | `AdminRole` |
| `clone_admin_role` | `cloneAdminRole(id, newName)` | Clone an existing role | `id`, `newName` | `AdminRole` |
| `archive_admin_role` | `archiveAdminRole(id)` | Disable a role | `id: number` | `void` |
| `assign_permissions_to_role` | `assignPermissionsToRole(roleId, permissionKeys)` | Set permissions for a role | `roleId`, `permissionKeys: string[]` | `void` |
| `bulk_assign_permissions` | `bulkAssignPermissions(roleIds, permissionKeys, assign)` | Bulk assign/revoke permissions | `roleIds`, `permissionKeys`, `assign: boolean` | `void` |

### Admin Settings (6)

| Command | Frontend Function | Description | Input | Output |
|---------|------------------|-------------|-------|--------|
| `get_app_settings` | `getAppSettings(category?)` | Get application settings, optional by category | `category?: string` | `AdminAppSetting[]` |
| `get_setting_categories` | `getSettingCategories()` | Get setting category groups | — | `SettingCategory[]` |
| `update_app_setting` | `updateAppSetting(key, value)` | Update a single setting | `key`, `value` | `void` |
| `update_app_settings_bulk` | `updateAppSettingsBulk(settings)` | Bulk update settings | `settings: { key, value }[]` | `void` |
| `get_setting_history` | `getSettingHistory(key)` | Get change history for a setting | `key: string` | `SettingHistoryEntry[]` |
| `reset_setting_to_default` | `resetSettingToDefault(key)` | Reset a setting to its default value | `key: string` | `void` |

### Admin Printers (7)

| Command | Frontend Function | Description | Input | Output |
|---------|------------------|-------------|-------|--------|
| `get_printers` | `getPrinters(printerType?)` | List printers, optional type filter | `printerType?: string` | `PrinterSetting[]` |
| `create_printer` | `createPrinter(input)` | Register a printer configuration | `input: PrinterInput` | `PrinterSetting` |
| `update_printer` | `updatePrinter(id, input)` | Update printer configuration | `id`, `input: PrinterInput` | `PrinterSetting` |
| `delete_printer` | `deletePrinter(id)` | Remove a printer config | `id: number` | `void` |
| `set_default_printer` | `setDefaultPrinter(id)` | Set as default printer | `id: number` | `void` |
| `test_printer` | `testPrinter(id)` | Test printer connection | `id: number` | `string` |
| `get_printer_types` | `getPrinterTypes()` | Get available printer types (receipt/invoice/label) | — | `string[]` |

### Admin Devices (5)

| Command | Frontend Function | Description | Input | Output |
|---------|------------------|-------------|-------|--------|
| `get_devices` | `getDevices(deviceType?)` | List connected devices | `deviceType?: string` | `DeviceSetting[]` |
| `create_device` | `createDevice(input)` | Register a device (scanner, etc.) | `input: DeviceInput` | `DeviceSetting` |
| `update_device` | `updateDevice(id, input)` | Update device configuration | `id`, `input: DeviceInput` | `DeviceSetting` |
| `delete_device` | `deleteDevice(id)` | Remove a device config | `id: number` | `void` |
| `test_device` | `testDevice(id)` | Test device connection | `id: number` | `string` |
| `get_device_types` | `getDeviceTypes()` | Get available device types | — | `string[]` |

### Admin Backups (8)

| Command | Frontend Function | Description | Input | Output |
|---------|------------------|-------------|-------|--------|
| `get_backup_history` | `getBackupHistory(limit?)` | Get backup history | `limit?: number` | `BackupRecord[]` |
| `create_backup` | `createBackup(backupType, notes?, createdBy?)` | Create a new backup | `backupType`, `notes?`, `createdBy?` | `BackupRecord` |
| `delete_backup` | `deleteBackup(id)` | Delete a backup record | `id: number` | `void` |
| `get_restore_history` | `getRestoreHistory(limit?)` | Get restore history | `limit?: number` | `RestoreRecord[]` |
| `get_scheduled_backup_config` | `getScheduledBackupConfig()` | Get auto-backup configuration | — | `Record<string, string>` |
| `save_scheduled_backup_config` | `saveScheduledBackupConfig(config)` | Save auto-backup configuration | `config: Record<string, string>` | `void` |
| `get_backup_stats` | `getBackupStats()` | Get backup storage statistics | — | `BackupStats` |

### Admin Database (7)

| Command | Frontend Function | Description | Input | Output |
|---------|------------------|-------------|-------|--------|
| `get_database_stats` | `getDatabaseStats()` | Get database size, table count, page info | — | `DatabaseStats` |
| `get_table_sizes` | `getTableSizes()` | Get row counts and sizes per table | — | `TableInfo[]` |
| `vacuum_database` | `vacuumDatabase()` | Run VACUUM to reclaim space | — | `string` |
| `optimize_database` | `optimizeDatabase()` | Run PRAGMA optimize | — | `string` |
| `check_database_integrity` | `checkDatabaseIntegrity()` | Run integrity_check | — | `string` |
| `get_migration_status` | `getMigrationStatus()` | Get schema migration history | — | `MigrationInfo[]` |
| `reindex_database` | `reindexDatabase()` | Rebuild all database indexes | — | `string` |

### Admin Diagnostics (6)

| Command | Frontend Function | Description | Input | Output |
|---------|------------------|-------------|-------|--------|
| `run_diagnostics` | `runDiagnostics()` | Run all system diagnostic checks | — | `DiagnosticCheck[]` |
| `get_diagnostic_history` | `getDiagnosticHistory(limit?)` | Get previous diagnostic reports | `limit?: number` | `DiagnosticReport[]` |
| `save_diagnostic_report` | `saveDiagnosticReport(reportType, status, summary, details, createdBy)` | Save a manual diagnostic report | `reportType`, `status`, `summary`, `details`, `createdBy` | `void` |
| `get_diagnostic_summary` | `getDiagnosticSummary()` | Get diagnostic summary counts | — | `DiagnosticSummary` |
| `get_system_logs` | `getSystemLogs(lines?)` | Get recent system log entries | `lines?: number` | `string` |
| `get_support_package` | `getSupportPackage()` | Generate support info package | — | `string` |

### Admin Audit (8)

| Command | Frontend Function | Description | Input | Output |
|---------|------------------|-------------|-------|--------|
| `get_audit_events` | `getAuditEvents(filter?, page?, pageSize?)` | Get audit log entries with filter/pagination | `filter?: AuditFilter`, `page?`, `pageSize?` | `AuditEvent[]` |
| `get_audit_event` | `getAuditEvent(id)` | Get single audit event details | `id: number` | `AuditEvent` |
| `get_audit_summary` | `getAuditSummary()` | Get aggregate audit statistics | — | `AuditSummary` |
| `get_audit_timeline` | `getAuditTimeline(days?)` | Get audit event count by day | `days?: number` | `{ date, count }[]` |
| `get_audit_by_action` | `getAuditByAction()` | Get event count grouped by action type | — | `AuditByAction[]` |
| `get_audit_by_user` | `getAuditByUser(days?)` | Get event count grouped by user | `days?: number` | `AuditByUser[]` |
| `export_audit_logs` | `exportAuditLogs(filter?)` | Export audit logs to file | `filter?: AuditFilter` | `string` |

### Admin Updates (5)

| Command | Frontend Function | Description | Input | Output |
|---------|------------------|-------------|-------|--------|
| `get_system_updates` | `getSystemUpdates()` | Get update history | — | `SystemUpdate[]` |
| `check_for_updates` | `checkForUpdates()` | Check for new version available | — | `{ current_version, latest_version, has_update }` |
| `get_current_version` | `getCurrentVersion()` | Get current app version string | — | `string` |
| `record_update_available` | `recordUpdateAvailable(version, releaseNotes?, downloadUrl?)` | Record that an update is available | `version`, `releaseNotes?`, `downloadUrl?` | `void` |
| `mark_update_installed` | `markUpdateInstalled(updateId, installedBy)` | Mark an update as installed | `updateId`, `installedBy` | `void` |

### Admin License (5)

| Command | Frontend Function | Description | Input | Output |
|---------|------------------|-------------|-------|--------|
| `get_license_info` | `getLicenseInfo()` | Get current license information | — | `LicenseInfo \| null` |
| `save_license` | `saveLicense(input)` | Save/update license record | `input: { licenseKey, licenseType, companyName?, ... }` | `LicenseInfo` |
| `activate_license` | `activateLicense(licenseKey)` | Activate a license key | `licenseKey: string` | `LicenseInfo` |
| `deactivate_license` | `deactivateLicense()` | Deactivate current license | — | `void` |
| `validate_license` | `validateLicense()` | Check if license is valid | — | `LicenseValidation` |

### Admin Maintenance (4)

| Command | Frontend Function | Description | Input | Output |
|---------|------------------|-------------|-------|--------|
| `get_maintenance_logs` | `getMaintenanceLogs(limit?)` | Get maintenance operation history | `limit?: number` | `MaintenanceLog[]` |
| `run_maintenance` | `runMaintenance(operation, createdBy)` | Execute a maintenance operation | `operation`, `createdBy` | `MaintenanceResult` |
| `clear_audit_logs` | `clearAuditLogs(beforeDays)` | Purge audit logs older than N days | `beforeDays: number` | `number` |
| `get_storage_info` | `getStorageInfo()` | Get storage utilization details | — | `StorageInfo` |
| `get_system_info` | `getSystemInfo()` | Get system environment info | — | `SystemInfo` |

---

## Permissions Model

Commands do not enforce permissions at the Rust level. Permissions are checked on the frontend using:

- **`PermissionGuard`** — Wraps components, checks user has required permission key
- **`ProtectedButton`** — Disables buttons when user lacks permission
- **Permission keys** follow the pattern `module.action` (e.g., `sales.create`, `admin.users.manage`)

The full permission list is seeded in `src-tauri/src/db/seed.rs` (80+ permissions across 15 groups).

---

## Related Command Patterns

| Pattern | Description | Example Modules |
|---------|-------------|-----------------|
| **CRUD** | get/create/update/archive/restore for entities | inventory, customers, vehicles, admin/users, admin/roles |
| **Detail** | get_<entity>_detail with joined data | customers (get_customer_detail) |
| **Child list** | get_<parent>_<children> | sales (get_sale_items), inventory (get_product_images) |
| **Status transitions** | update_<entity>_status | sales (update_quote_status), purchases (update_purchase_order_status) |
| **Summary/dashboard** | get_<module>_dashboard | sales, purchases, inventory, crm, admin |
| **Chart data** | get_<module>_chart_data | sales, admin |
| **Reports** | get_<module>_report_<granularity> | reports (daily/weekly/monthly/yearly) |
| **Stateful operations** | open/close, start/end | cash_register, daily_closings |
| **Bulk operations** | bulk_<action> | admin (bulk_assign_permissions) |
| **Export** | export_<entity> | admin (export_audit_logs) |
