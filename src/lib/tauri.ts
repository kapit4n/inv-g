import { invoke } from "@tauri-apps/api/core"
import type { LoginResponse, SessionInfo, AppSetting } from "@/types"
import type {
  InventoryCategory, Brand, Manufacturer, InventorySupplier,
  Warehouse, StorageLocation, InventoryProduct, ProductImage,
  ProductCompatibility, InventoryMovement, DashboardStats, InventoryPaginatedResult,
} from "@/types/inventory"
import type {
  Customer, CustomerDetail, CustomerSale, CreditAccount, CreditTransaction,
  CommunicationEntry, CommunicationInput,
  Sale, SaleItem, SalePayment, DailyCloseout, Quote, QuoteItem,
  CashRegisterSession, DailyClosing, Receipt, ProductForPos, CheckoutResult,
  CheckoutInput, SalesSummary, SalesChartData, QuoteInput,
  PurchaseOrder, PurchaseOrderItem, PurchaseOrderInput, PurchaseOrderItemInput,
  PurchaseRequest, PurchaseRequestItem, PurchaseRequestInput,
  PurchaseReceipt, PurchaseReceiptItem, ReceivePOInput,
  PurchaseReturn, PurchaseReturnItem, PurchaseReturnInput,
  SupplierProduct, SupplierProductInput,
  CostHistory, ReorderSuggestion, SupplierPerformance, PurchaseDashboard,
} from "@/types"

export async function getAppVersion(): Promise<string> {
  return invoke<string>("get_app_version")
}

export async function healthCheck(): Promise<string> {
  return invoke<string>("health_check")
}

export async function greet(name: string): Promise<string> {
  return invoke<string>("greet", { name })
}

export async function runSeeds(): Promise<string> {
  return invoke<string>("run_seeds")
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  return invoke<LoginResponse>("login", { username, password })
}

export async function loginByRole(roleName: string): Promise<LoginResponse> {
  return invoke<LoginResponse>("login_by_role", { roleName })
}

export async function logout(token: string): Promise<void> {
  return invoke<void>("logout", { token })
}

export async function getCurrentUser(token: string): Promise<SessionInfo> {
  return invoke<SessionInfo>("get_current_user", { token })
}

export async function checkSession(token: string): Promise<boolean> {
  return invoke<boolean>("check_session", { token })
}

export async function getUserPermissionsList(token: string): Promise<string[]> {
  return invoke<string[]>("get_user_permissions_list", { token })
}

export async function getSettings(): Promise<AppSetting[]> {
  return invoke<AppSetting[]>("get_settings")
}

export async function getSetting(key: string): Promise<AppSetting | null> {
  return invoke<AppSetting | null>("get_setting", { key })
}

export async function updateSetting(key: string, value: string): Promise<void> {
  return invoke<void>("update_setting", { key, value })
}

export async function getSettingsByGroup(group: string): Promise<AppSetting[]> {
  return invoke<AppSetting[]>("get_settings_by_group", { group })
}

// ── Categories ──

export async function getCategories(): Promise<InventoryCategory[]> {
  return invoke<InventoryCategory[]>("get_categories")
}

export async function createCategory(data: { name: string; description?: string; parentId?: number; sortOrder?: number }): Promise<InventoryCategory> {
  return invoke<InventoryCategory>("create_category", data)
}

export async function updateCategory(data: { id: number; name: string; description?: string; parentId?: number; sortOrder?: number }): Promise<InventoryCategory> {
  return invoke<InventoryCategory>("update_category", data)
}

export async function archiveCategory(id: number): Promise<void> {
  return invoke<void>("archive_category", { id })
}

export async function restoreCategory(id: number): Promise<void> {
  return invoke<void>("restore_category", { id })
}

// ── Brands ──

export async function getBrands(): Promise<Brand[]> {
  return invoke<Brand[]>("get_brands")
}

export async function createBrand(data: { name: string; description?: string; country?: string; website?: string }): Promise<Brand> {
  return invoke<Brand>("create_brand", data)
}

export async function updateBrand(data: { id: number; name: string; description?: string; country?: string; website?: string }): Promise<Brand> {
  return invoke<Brand>("update_brand", data)
}

export async function archiveBrand(id: number): Promise<void> {
  return invoke<void>("archive_brand", { id })
}

// ── Manufacturers ──

export async function getManufacturers(): Promise<Manufacturer[]> {
  return invoke<Manufacturer[]>("get_manufacturers")
}

export async function createManufacturer(data: { name: string; country?: string; phone?: string; email?: string; website?: string; notes?: string }): Promise<Manufacturer> {
  return invoke<Manufacturer>("create_manufacturer", data)
}

export async function updateManufacturer(data: { id: number; name: string; country?: string; phone?: string; email?: string; website?: string; notes?: string }): Promise<Manufacturer> {
  return invoke<Manufacturer>("update_manufacturer", data)
}

// ── Suppliers ──

export async function getSuppliers(): Promise<InventorySupplier[]> {
  return invoke<InventorySupplier[]>("get_suppliers")
}

export async function createSupplier(data: {
  companyName: string; contactPerson?: string; phone?: string; mobile?: string;
  email?: string; website?: string; taxNumber?: string; address?: string;
  city?: string; stateProvince?: string; country?: string
}): Promise<InventorySupplier> {
  return invoke<InventorySupplier>("create_supplier", data)
}

export async function updateSupplier(data: {
  id: number; companyName: string; contactPerson?: string; phone?: string; mobile?: string;
  email?: string; website?: string; taxNumber?: string; address?: string;
  city?: string; stateProvince?: string; country?: string
}): Promise<InventorySupplier> {
  return invoke<InventorySupplier>("update_supplier", data)
}

export async function archiveSupplier(id: number): Promise<void> {
  return invoke<void>("archive_supplier", { id })
}

// ── Warehouses ──

export async function getWarehouses(): Promise<Warehouse[]> {
  return invoke<Warehouse[]>("get_warehouses")
}

export async function createWarehouse(data: {
  name: string; code: string; address?: string; city?: string;
  stateProvince?: string; country?: string; manager?: string; phone?: string
}): Promise<Warehouse> {
  return invoke<Warehouse>("create_warehouse", data)
}

export async function updateWarehouse(data: {
  id: number; name: string; code: string; address?: string; city?: string;
  stateProvince?: string; country?: string; manager?: string; phone?: string
}): Promise<Warehouse> {
  return invoke<Warehouse>("update_warehouse", data)
}

// ── Storage Locations ──

export async function getStorageLocations(warehouseId?: number): Promise<StorageLocation[]> {
  return invoke<StorageLocation[]>("get_storage_locations", { warehouseId })
}

export async function createStorageLocation(data: {
  warehouseId: number; zone?: string; aisle?: string; shelf?: string;
  bin?: string; code: string; description?: string
}): Promise<StorageLocation> {
  return invoke<StorageLocation>("create_storage_location", data)
}

export async function updateStorageLocation(data: {
  id: number; warehouseId: number; zone?: string; aisle?: string; shelf?: string;
  bin?: string; code: string; description?: string
}): Promise<StorageLocation> {
  return invoke<StorageLocation>("update_storage_location", data)
}

export async function archiveStorageLocation(id: number): Promise<void> {
  return invoke<void>("archive_storage_location", { id })
}

// ── Products ──

export async function getProducts(page: number, pageSize: number, search?: string): Promise<InventoryPaginatedResult<InventoryProduct>> {
  return invoke<InventoryPaginatedResult<InventoryProduct>>("get_products", { page, pageSize, search })
}

export async function getProduct(id: number): Promise<InventoryProduct> {
  return invoke<InventoryProduct>("get_product", { id })
}

export async function createProduct(data: Partial<InventoryProduct>): Promise<InventoryProduct> {
  return invoke<InventoryProduct>("create_product", data)
}

export async function updateProduct(data: Partial<InventoryProduct> & { id: number }): Promise<InventoryProduct> {
  return invoke<InventoryProduct>("update_product", data)
}

export async function archiveProduct(id: number): Promise<void> {
  return invoke<void>("archive_product", { id })
}

export async function restoreProduct(id: number): Promise<void> {
  return invoke<void>("restore_product", { id })
}

// ── Dashboard ──

export async function getDashboardStats(): Promise<DashboardStats> {
  return invoke<DashboardStats>("get_dashboard_stats")
}

// ── Inventory Movements ──

export async function getInventoryMovements(productId?: number): Promise<InventoryMovement[]> {
  return invoke<InventoryMovement[]>("get_inventory_movements", { productId })
}

export async function createInventoryMovement(data: {
  productId: number; warehouseId?: number; quantity: number; type: string;
  referenceType?: string; referenceId?: string; notes?: string; createdBy?: number
}): Promise<InventoryMovement> {
  return invoke<InventoryMovement>("create_inventory_movement", data)
}

// ── Customers ──

export async function getCustomers(search?: string): Promise<Customer[]> {
  return invoke<Customer[]>("get_customers", { search })
}

export async function createCustomer(
  name: string, email?: string, phone?: string, address?: string,
  city?: string, state?: string, postalCode?: string,
  country?: string, notes?: string
): Promise<Customer> {
  return invoke<Customer>("create_customer", {
    name, email, phone, address, city, state, postalCode, country, notes,
  })
}

export async function updateCustomer(
  id: number, name: string, email?: string, phone?: string, address?: string,
  city?: string, state?: string, postalCode?: string,
  country?: string, notes?: string
): Promise<Customer> {
  return invoke<Customer>("update_customer", {
    id, name, email, phone, address, city, state, postalCode, country, notes,
  })
}

export async function archiveCustomer(id: number): Promise<void> {
  return invoke<void>("archive_customer", { id })
}

export async function getCustomerDetail(id: number): Promise<CustomerDetail> {
  return invoke<CustomerDetail>("get_customer_detail", { id })
}

export async function getCustomerSales(customerId: number): Promise<CustomerSale[]> {
  return invoke<CustomerSale[]>("get_customer_sales", { customerId })
}

export async function getCreditAccount(customerId: number): Promise<CreditAccount> {
  return invoke<CreditAccount>("get_credit_account", { customerId })
}

export async function createCreditAccount(customerId: number, creditLimit: number): Promise<CreditAccount> {
  return invoke<CreditAccount>("create_credit_account", { customerId, creditLimit })
}

export async function getCreditTransactions(accountId: number): Promise<CreditTransaction[]> {
  return invoke<CreditTransaction[]>("get_credit_transactions", { accountId })
}

export async function addCreditTransaction(
  accountId: number, amount: number, transactionType: string,
  referenceType?: string, referenceId?: string, notes?: string, createdBy?: number,
): Promise<CreditTransaction> {
  return invoke<CreditTransaction>("add_credit_transaction", {
    accountId, amount, transactionType, referenceType, referenceId, notes, createdBy,
  })
}

export async function getCommunications(customerId: number): Promise<CommunicationEntry[]> {
  return invoke<CommunicationEntry[]>("get_communications", { customerId })
}

export async function createCommunication(input: CommunicationInput, createdBy: number): Promise<CommunicationEntry> {
  return invoke<CommunicationEntry>("create_communication", { input, createdBy })
}

// ── Sales ──

export async function getSales(): Promise<Sale[]> {
  return invoke<Sale[]>("get_sales")
}

export async function getSale(id: number): Promise<Sale> {
  return invoke<Sale>("get_sale", { id })
}

export async function getSaleItems(saleId: number): Promise<SaleItem[]> {
  return invoke<SaleItem[]>("get_sale_items", { saleId })
}

export async function getSalePayments(saleId: number): Promise<SalePayment[]> {
  return invoke<SalePayment[]>("get_sale_payments", { saleId })
}

export async function getDailyCloseout(): Promise<DailyCloseout> {
  return invoke<DailyCloseout>("get_daily_closeout")
}

export async function refundSale(saleId: number, reason?: string): Promise<Sale> {
  return invoke<Sale>("refund_sale", { saleId, reason })
}

export async function createSale(data: {
  customerId?: number; userId?: number; subtotal: number; taxRate: number;
  taxAmount: number; discountAmount: number; total: number;
  paymentMethod: string; paymentStatus: string; notes?: string;
  items: { productId: number; quantity: number; unitPrice: number; discount: number; total: number }[]
}): Promise<Sale> {
  return invoke<Sale>("create_sale", data)
}

export async function searchProductsForPos(search: string): Promise<ProductForPos[]> {
  return invoke<ProductForPos[]>("search_products_for_pos", { search })
}

export async function processCheckout(input: CheckoutInput): Promise<CheckoutResult> {
  return invoke<CheckoutResult>("process_checkout", { input })
}

export async function getSalesSummary(): Promise<SalesSummary> {
  return invoke<SalesSummary>("get_sales_summary")
}

export async function getSalesChartData(days: number): Promise<SalesChartData> {
  return invoke<SalesChartData>("get_sales_chart_data", { days })
}

export async function searchSales(query: string): Promise<Sale[]> {
  return invoke<Sale[]>("search_sales", { query })
}

// ── Quotes ──

export async function getQuotes(): Promise<Quote[]> {
  return invoke<Quote[]>("get_quotes")
}

export async function getQuote(id: number): Promise<Quote> {
  return invoke<Quote>("get_quote", { id })
}

export async function getQuoteItems(quoteId: number): Promise<QuoteItem[]> {
  return invoke<QuoteItem[]>("get_quote_items", { quoteId })
}

export async function createQuote(input: QuoteInput): Promise<Quote> {
  return invoke<Quote>("create_quote", { input })
}

export async function updateQuote(id: number, input: QuoteInput): Promise<Quote> {
  return invoke<Quote>("update_quote", { id, input })
}

export async function deleteQuote(id: number): Promise<void> {
  return invoke<void>("delete_quote", { id })
}

export async function updateQuoteStatus(id: number, status: string): Promise<Quote> {
  return invoke<Quote>("update_quote_status", { id, status })
}

export async function convertQuoteToSale(quoteId: number, userId?: number): Promise<CheckoutResult> {
  return invoke<CheckoutResult>("convert_quote_to_sale", { quoteId, userId })
}

// ── Cash Register ──

export async function getCashRegisterStatus(): Promise<CashRegisterSession | null> {
  return invoke<CashRegisterSession | null>("get_cash_register_status")
}

export async function openCashRegister(userId: number, openingBalance: number, notes?: string): Promise<CashRegisterSession> {
  return invoke<CashRegisterSession>("open_cash_register", { userId, openingBalance, notes })
}

export async function closeCashRegister(id: number, closingBalance: number, notes?: string): Promise<CashRegisterSession> {
  return invoke<CashRegisterSession>("close_cash_register", { id, closingBalance, notes })
}

export async function getCashRegisterSessions(): Promise<CashRegisterSession[]> {
  return invoke<CashRegisterSession[]>("get_cash_register_sessions")
}

// ── Daily Closings ──

export async function closeDailyShift(closedBy: number, notes?: string): Promise<DailyClosing> {
  return invoke<DailyClosing>("close_daily_shift", { closedBy, notes })
}

export async function getDailyClosings(): Promise<DailyClosing[]> {
  return invoke<DailyClosing[]>("get_daily_closings")
}

// ── Receipts ──

export async function getReceiptsForSale(saleId: number): Promise<Receipt[]> {
  return invoke<Receipt[]>("get_receipts_for_sale", { saleId })
}

export async function getReceipt(id: number): Promise<Receipt> {
  return invoke<Receipt>("get_receipt", { id })
}

export async function markReceiptPrinted(id: number): Promise<Receipt> {
  return invoke<Receipt>("mark_receipt_printed", { id })
}

// ── Product Relations ──

export async function getProductCompatibility(productId: number): Promise<ProductCompatibility[]> {
  return invoke<ProductCompatibility[]>("get_product_compatibility", { productId })
}

export async function getProductImages(productId: number): Promise<ProductImage[]> {
  return invoke<ProductImage[]>("get_product_images", { productId })
}

export async function createProductImage(data: {
  productId: number; filePath: string; isPrimary?: boolean; sortOrder?: number
}): Promise<ProductImage> {
  return invoke<ProductImage>("create_product_image", data)
}

export async function deleteProductImage(id: number): Promise<void> {
  return invoke<void>("delete_product_image", { id })
}

// ── Product Compatibility ──

export async function createProductCompatibility(data: {
  productId: number; vehicleBrand: string; vehicleModel: string;
  yearStart?: number; yearEnd?: number; engine?: string;
  transmission?: string; notes?: string
}): Promise<ProductCompatibility> {
  return invoke<ProductCompatibility>("create_product_compatibility", data)
}

export async function deleteProductCompatibility(id: number): Promise<void> {
  return invoke<void>("delete_product_compatibility", { id })
}

// ── Purchase Orders ──
export async function getPurchaseOrders(params?: { search?: string; status?: string; supplierId?: number; warehouseId?: number; buyer?: string; dateFrom?: string; dateTo?: string }): Promise<PurchaseOrder[]> {
  return invoke<PurchaseOrder[]>("get_purchase_orders", params || {})
}
export async function getPurchaseOrder(id: number): Promise<PurchaseOrder> {
  return invoke<PurchaseOrder>("get_purchase_order", { id })
}
export async function createPurchaseOrder(userId: number, input: PurchaseOrderInput): Promise<PurchaseOrder> {
  return invoke<PurchaseOrder>("create_purchase_order", { userId, input })
}
export async function updatePurchaseOrder(id: number, input: PurchaseOrderInput): Promise<PurchaseOrder> {
  return invoke<PurchaseOrder>("update_purchase_order", { id, input })
}
export async function updatePurchaseOrderStatus(id: number, status: string, userId: number): Promise<PurchaseOrder> {
  return invoke<PurchaseOrder>("update_purchase_order_status", { id, status, userId })
}
export async function deletePurchaseOrder(id: number): Promise<void> {
  return invoke<void>("delete_purchase_order", { id })
}
export async function getPurchaseOrderItems(purchaseOrderId: number): Promise<PurchaseOrderItem[]> {
  return invoke<PurchaseOrderItem[]>("get_purchase_order_items", { purchaseOrderId })
}

// ── Purchase Requests ──
export async function getPurchaseRequests(status?: string): Promise<PurchaseRequest[]> {
  return invoke<PurchaseRequest[]>("get_purchase_requests", { status })
}
export async function getPurchaseRequest(id: number): Promise<PurchaseRequest> {
  return invoke<PurchaseRequest>("get_purchase_request", { id })
}
export async function createPurchaseRequest(userId: number, input: PurchaseRequestInput): Promise<PurchaseRequest> {
  return invoke<PurchaseRequest>("create_purchase_request", { userId, input })
}
export async function updatePurchaseRequestStatus(id: number, status: string): Promise<PurchaseRequest> {
  return invoke<PurchaseRequest>("update_purchase_request_status", { id, status })
}

// ── Receiving ──
export async function getPurchaseReceipts(purchaseOrderId?: number): Promise<PurchaseReceipt[]> {
  return invoke<PurchaseReceipt[]>("get_purchase_receipts", { purchaseOrderId })
}
export async function getPurchaseReceipt(id: number): Promise<PurchaseReceipt> {
  return invoke<PurchaseReceipt>("get_purchase_receipt", { id })
}
export async function receivePurchaseOrder(poId: number, userId: number, warehouseId: number, notes: string | undefined, items: ReceivePOInput[]): Promise<PurchaseReceipt> {
  return invoke<PurchaseReceipt>("receive_purchase_order", { poId, userId, warehouseId, notes, items })
}

// ── Purchase Returns ──
export async function getPurchaseReturns(supplierId?: number): Promise<PurchaseReturn[]> {
  return invoke<PurchaseReturn[]>("get_purchase_returns", { supplierId })
}
export async function getPurchaseReturn(id: number): Promise<PurchaseReturn> {
  return invoke<PurchaseReturn>("get_purchase_return", { id })
}
export async function createPurchaseReturn(userId: number, input: PurchaseReturnInput): Promise<PurchaseReturn> {
  return invoke<PurchaseReturn>("create_purchase_return", { userId, input })
}

// ── Supplier Catalog ──
export async function getSupplierProducts(supplierId?: number, productId?: number): Promise<SupplierProduct[]> {
  return invoke<SupplierProduct[]>("get_supplier_products", { supplierId, productId })
}
export async function createSupplierProduct(input: SupplierProductInput): Promise<SupplierProduct> {
  return invoke<SupplierProduct>("create_supplier_product", { input })
}
export async function updateSupplierProduct(id: number, input: SupplierProductInput): Promise<SupplierProduct> {
  return invoke<SupplierProduct>("update_supplier_product", { id, input })
}
export async function deleteSupplierProduct(id: number): Promise<void> {
  return invoke<void>("delete_supplier_product", { id })
}

// ── Cost History ──
export async function getCostHistory(productId?: number, supplierId?: number): Promise<CostHistory[]> {
  return invoke<CostHistory[]>("get_cost_history", { productId, supplierId })
}

// ── Dashboard ──
export async function getPurchaseDashboard(): Promise<PurchaseDashboard> {
  return invoke<PurchaseDashboard>("get_purchase_dashboard")
}
export async function getReorderSuggestions(): Promise<ReorderSuggestion[]> {
  return invoke<ReorderSuggestion[]>("get_reorder_suggestions")
}
export async function getSupplierPerformance(supplierId?: number): Promise<SupplierPerformance[]> {
  return invoke<SupplierPerformance[]>("get_supplier_performance", { supplierId })
}
