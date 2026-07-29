import { invoke } from "@tauri-apps/api/core"
import type {
  LoginResponse, SessionInfo, AppSetting,
  AdminUser, AdminRole, AdminPermission, RoleWithPermissions,
  AdminDashboard, UserActivityPoint, DbGrowthPoint,
  BackupRecord, RestoreRecord,
  PrinterSetting, PrinterInput, DeviceSetting, DeviceInput,
  AdminAppSetting, SettingCategory,
  DatabaseStats, TableInfo, MigrationInfo,
  DiagnosticCheck, DiagnosticReport,
  AuditEvent, AuditFilter,
  SystemUpdate, LicenseInfo, MaintenanceLog,
} from "@/types"
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
  VehicleBrand, VehicleModel, VehicleGeneration, VehicleEngine,
  VehicleTransmission, VehicleFuel, CustomerVehicle,
  CompatibilityEntry, ProductRecommendation,
  ServiceReminder, Warranty, CustomerNote, TimelineEntry, CrmDashboard,
  ExecutiveDashboard, DashboardWidgets, ChartData,
  SalesReportFilter, SalesReportRow, SalesByCashier, SalesByPaymentMethod,
  DiscountAnalysis, ReturnsSummary, TaxSummary,
  InventoryReportFilter, InventoryReportRow, InventoryValuation,
  StockStatusItem, MovementSummary, AgingItem,
  PurchaseReportFilter, PurchaseReportRow, PurchaseBySupplier,
  SupplierPerformance as SupplierPerformanceReport, POStatusSummary, ProductToReorder,
  CustomerReportRow, CustomerGrowthRow, CustomerLocation,
  CustomerCreditSummary, CustomerServiceSummary,
  SupplierRanking, LeadTimeAnalysis,
  WarehouseUtilization, WarehouseAdjustmentSummary,
  ProfitSummary, ProfitByEntity,
  KpiValue, KpiDefinition,
  SavedReport, SavedReportInput, ScheduledReport, ReportHistoryEntry, ReportTemplate,
  CostHistoryEntry,
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

// ── Vehicle Brands ──
export async function getVehicleBrands(search?: string): Promise<VehicleBrand[]> {
  return invoke<VehicleBrand[]>("get_vehicle_brands", { search })
}
export async function createVehicleBrand(name: string, description?: string, country?: string): Promise<VehicleBrand> {
  return invoke<VehicleBrand>("create_vehicle_brand", { name, description, country })
}
export async function updateVehicleBrand(id: number, name: string, description?: string, country?: string): Promise<VehicleBrand> {
  return invoke<VehicleBrand>("update_vehicle_brand", { id, name, description, country })
}

// ── Vehicle Models ──
export async function getVehicleModels(brandId?: number, search?: string): Promise<VehicleModel[]> {
  return invoke<VehicleModel[]>("get_vehicle_models", { brandId, search })
}
export async function createVehicleModel(brandId: number, name: string): Promise<VehicleModel> {
  return invoke<VehicleModel>("create_vehicle_model", { brandId, name })
}

// ── Vehicle Generations ──
export async function getVehicleGenerations(modelId: number): Promise<VehicleGeneration[]> {
  return invoke<VehicleGeneration[]>("get_vehicle_generations", { modelId })
}
export async function createVehicleGeneration(modelId: number, name?: string, yearStart?: number, yearEnd?: number): Promise<VehicleGeneration> {
  return invoke<VehicleGeneration>("create_vehicle_generation", { modelId, name, yearStart, yearEnd })
}

// ── Vehicle Engines ──
export async function getVehicleEngines(search?: string): Promise<VehicleEngine[]> {
  return invoke<VehicleEngine[]>("get_vehicle_engines", { search })
}
export async function createVehicleEngine(name: string, displacement?: string, power?: string, fuelType?: string): Promise<VehicleEngine> {
  return invoke<VehicleEngine>("create_vehicle_engine", { name, displacement, power, fuelType })
}

// ── Vehicle Transmissions ──
export async function getVehicleTransmissions(): Promise<VehicleTransmission[]> {
  return invoke<VehicleTransmission[]>("get_vehicle_transmissions")
}
export async function createVehicleTransmission(name: string, type?: string, gears?: number): Promise<VehicleTransmission> {
  return invoke<VehicleTransmission>("create_vehicle_transmission", { name, type, gears })
}

// ── Vehicle Fuels ──
export async function getVehicleFuels(): Promise<VehicleFuel[]> {
  return invoke<VehicleFuel[]>("get_vehicle_fuels")
}
export async function createVehicleFuel(name: string): Promise<VehicleFuel> {
  return invoke<VehicleFuel>("create_vehicle_fuel", { name })
}

// ── Customer Vehicles ──
export async function getCustomerVehicles(customerId: number): Promise<CustomerVehicle[]> {
  return invoke<CustomerVehicle[]>("get_customer_vehicles", { customerId })
}
export async function getCustomerVehicle(id: number): Promise<CustomerVehicle> {
  return invoke<CustomerVehicle>("get_customer_vehicle", { id })
}
export async function createCustomerVehicle(params: { customerId: number; licensePlate?: string; nickname?: string; brandId?: number; modelId?: number; generationId?: number; year?: number; engineId?: number; transmissionId?: number; fuelId?: number; vin?: string; color?: string; mileage?: number; purchaseDate?: string; notes?: string; userId: number }): Promise<CustomerVehicle> {
  return invoke<CustomerVehicle>("create_customer_vehicle", params)
}
export async function updateCustomerVehicle(id: number, params: { customerId: number; licensePlate?: string; nickname?: string; brandId?: number; modelId?: number; generationId?: number; year?: number; engineId?: number; transmissionId?: number; fuelId?: number; vin?: string; color?: string; mileage?: number; purchaseDate?: string; notes?: string; userId: number }): Promise<CustomerVehicle> {
  return invoke<CustomerVehicle>("update_customer_vehicle", { id, ...params })
}
export async function deleteCustomerVehicle(id: number): Promise<void> {
  return invoke<void>("delete_customer_vehicle", { id })
}

// ── Compatibility ──
export async function getProductCompatibility(productId: number): Promise<CompatibilityEntry[]> {
  return invoke<CompatibilityEntry[]>("get_product_compatibility", { productId })
}
export async function createCompatibility(productId: number, brandId?: number, modelId?: number, generationId?: number, engineId?: number, transmissionId?: number, yearStart?: number, yearEnd?: number, notes?: string): Promise<CompatibilityEntry> {
  return invoke<CompatibilityEntry>("create_compatibility", { productId, brandId, modelId, generationId, engineId, transmissionId, yearStart, yearEnd, notes })
}
export async function deleteCompatibility(id: number): Promise<void> {
  return invoke<void>("delete_compatibility", { id })
}
export async function searchCompatibleProducts(brandId?: number, modelId?: number, year?: number, engineId?: number, transmissionId?: number, search?: string): Promise<ProductRecommendation[]> {
  return invoke<ProductRecommendation[]>("search_compatible_products", { brandId, modelId, year, engineId, transmissionId, search })
}
export async function getRecommendationsForVehicle(brandId?: number, modelId?: number, year?: number): Promise<ProductRecommendation[]> {
  return invoke<ProductRecommendation[]>("get_recommendations_for_vehicle", { brandId, modelId, year })
}

// ── Service Reminders ──
export async function getServiceReminders(status?: string, customerId?: number): Promise<ServiceReminder[]> {
  return invoke<ServiceReminder[]>("get_service_reminders", { status, customerId })
}
export async function getServiceReminder(id: number): Promise<ServiceReminder> {
  return invoke<ServiceReminder>("get_service_reminder", { id })
}
export async function createServiceReminder(customerId: number, vehicleId: number | undefined, reminderType: string, title: string, description?: string, dueDate?: string, dueMileage?: number, notes?: string, createdBy: number): Promise<ServiceReminder> {
  return invoke<ServiceReminder>("create_service_reminder", { customerId, vehicleId, reminderType, title, description, dueDate, dueMileage, notes, createdBy })
}
export async function updateServiceReminderStatus(id: number, status: string, userId: number): Promise<ServiceReminder> {
  return invoke<ServiceReminder>("update_service_reminder_status", { id, status, userId })
}
export async function getOverdueReminders(): Promise<ServiceReminder[]> {
  return invoke<ServiceReminder[]>("get_overdue_reminders")
}

// ── Warranties ──
export async function getWarranties(customerId?: number, status?: string): Promise<Warranty[]> {
  return invoke<Warranty[]>("get_warranties", { customerId, status })
}
export async function getWarranty(id: number): Promise<Warranty> {
  return invoke<Warranty>("get_warranty", { id })
}
export async function createWarranty(saleId?: number, productId?: number, customerId: number, vehicleId?: number, warrantyType: string, periodMonths: number, startDate: string, notes?: string, createdBy: number): Promise<Warranty> {
  return invoke<Warranty>("create_warranty", { saleId, productId, customerId, vehicleId, warrantyType, periodMonths, startDate, notes, createdBy })
}
export async function updateWarrantyStatus(id: number, status: string): Promise<Warranty> {
  return invoke<Warranty>("update_warranty_status", { id, status })
}
export async function getExpiringWarranties(days: number): Promise<Warranty[]> {
  return invoke<Warranty[]>("get_expiring_warranties", { days })
}

// ── Customer Notes ──
export async function getCustomerNotes(customerId: number): Promise<CustomerNote[]> {
  return invoke<CustomerNote[]>("get_customer_notes", { customerId })
}
export async function createCustomerNote(customerId: number, noteType: string, title?: string, content?: string, isPrivate: boolean, createdBy: number): Promise<CustomerNote> {
  return invoke<CustomerNote>("create_customer_note", { customerId, noteType, title, content, isPrivate, createdBy })
}

// ── Customer Timeline ──
export async function getCustomerTimeline(customerId: number): Promise<TimelineEntry[]> {
  return invoke<TimelineEntry[]>("get_customer_timeline", { customerId })
}

// ── CRM Dashboard ──
export async function getCrmDashboard(): Promise<CrmDashboard> {
  return invoke<CrmDashboard>("get_crm_dashboard")
}
export async function getCustomersByMonth(months: number): Promise<[string, number][]> {
  return invoke<[string, number][]>("get_customers_by_month", { months })
}

// ── Executive Dashboard ──
export async function getExecutiveDashboard(): Promise<ExecutiveDashboard> {
  return invoke<ExecutiveDashboard>("get_executive_dashboard")
}
export async function getDashboardWidgets(): Promise<DashboardWidgets> {
  return invoke<DashboardWidgets>("get_dashboard_widgets")
}
export async function getChartData(): Promise<ChartData> {
  return invoke<ChartData>("get_chart_data")
}

// ── Sales Reports ──
export async function getSalesReportDaily(f: SalesReportFilter): Promise<SalesReportRow[]> {
  return invoke<SalesReportRow[]>("get_sales_report_daily", { f })
}
export async function getSalesReportWeekly(f: SalesReportFilter): Promise<SalesReportRow[]> {
  return invoke<SalesReportRow[]>("get_sales_report_weekly", { f })
}
export async function getSalesReportMonthly(f: SalesReportFilter): Promise<SalesReportRow[]> {
  return invoke<SalesReportRow[]>("get_sales_report_monthly", { f })
}
export async function getSalesReportYearly(f: SalesReportFilter): Promise<SalesReportRow[]> {
  return invoke<SalesReportRow[]>("get_sales_report_yearly", { f })
}
export async function getSalesByCashier(f: SalesReportFilter): Promise<SalesByCashier[]> {
  return invoke<SalesByCashier[]>("get_sales_by_cashier", { f })
}
export async function getSalesByPaymentMethod(f: SalesReportFilter): Promise<SalesByPaymentMethod[]> {
  return invoke<SalesByPaymentMethod[]>("get_sales_by_payment_method", { f })
}
export async function getSalesDiscountAnalysis(f: SalesReportFilter): Promise<DiscountAnalysis> {
  return invoke<DiscountAnalysis>("get_sales_discount_analysis", { f })
}
export async function getSalesReturnsSummary(f: SalesReportFilter): Promise<ReturnsSummary> {
  return invoke<ReturnsSummary>("get_sales_returns_summary", { f })
}
export async function getSalesTaxSummary(f: SalesReportFilter): Promise<TaxSummary> {
  return invoke<TaxSummary>("get_sales_tax_summary", { f })
}
export async function getSalesQuoteConversion(): Promise<number> {
  return invoke<number>("get_sales_quote_conversion")
}

// ── Inventory Reports ──
export async function getInventoryReport(filter: InventoryReportFilter): Promise<InventoryReportRow[]> {
  return invoke<InventoryReportRow[]>("get_inventory_report", { filter })
}
export async function getInventoryValuation(): Promise<InventoryValuation[]> {
  return invoke<InventoryValuation[]>("get_inventory_valuation")
}
export async function getInventoryLowStock(): Promise<StockStatusItem[]> {
  return invoke<StockStatusItem[]>("get_inventory_low_stock")
}
export async function getInventoryMovementReport(months: number): Promise<MovementSummary[]> {
  return invoke<MovementSummary[]>("get_inventory_movement_report", { months })
}
export async function getInventoryAging(days: number): Promise<AgingItem[]> {
  return invoke<AgingItem[]>("get_inventory_aging", { days })
}
export async function getInventoryOverstock(): Promise<StockStatusItem[]> {
  return invoke<StockStatusItem[]>("get_inventory_overstock")
}
export async function getInventoryFastSlow(days: number): Promise<AgingItem[]> {
  return invoke<AgingItem[]>("get_inventory_fast_slow", { days })
}

// ── Purchasing Reports ──
export async function getPurchasesByMonth(f: PurchaseReportFilter): Promise<PurchaseReportRow[]> {
  return invoke<PurchaseReportRow[]>("get_purchases_by_month", { f })
}
export async function getPurchasesBySupplier(f: PurchaseReportFilter): Promise<PurchaseBySupplier[]> {
  return invoke<PurchaseBySupplier[]>("get_purchases_by_supplier", { f })
}
export async function getSupplierPerformanceReport(): Promise<SupplierPerformanceReport[]> {
  return invoke<SupplierPerformanceReport[]>("get_supplier_performance_report")
}
export async function getPoStatusSummary(): Promise<POStatusSummary[]> {
  return invoke<POStatusSummary[]>("get_po_status_summary")
}
export async function getProductsToReorder(): Promise<ProductToReorder[]> {
  return invoke<ProductToReorder[]>("get_products_to_reorder")
}
export async function getPurchaseCostHistory(productId?: number): Promise<CostHistoryEntry[]> {
  return invoke<CostHistoryEntry[]>("get_purchase_cost_history", { productId })
}

// ── Customer Reports ──
export async function getTopCustomers(limit: number): Promise<CustomerReportRow[]> {
  return invoke<CustomerReportRow[]>("get_top_customers", { limit })
}
export async function getCustomerGrowthReport(): Promise<CustomerGrowthRow[]> {
  return invoke<CustomerGrowthRow[]>("get_customer_growth_report")
}
export async function getCustomerLocations(): Promise<CustomerLocation[]> {
  return invoke<CustomerLocation[]>("get_customer_locations")
}
export async function getInactiveCustomers(days: number): Promise<CustomerReportRow[]> {
  return invoke<CustomerReportRow[]>("get_inactive_customers", { days })
}
export async function getCustomerCreditSummary(): Promise<CustomerCreditSummary> {
  return invoke<CustomerCreditSummary>("get_customer_credit_summary")
}
export async function getCustomerServiceSummary(): Promise<CustomerServiceSummary> {
  return invoke<CustomerServiceSummary>("get_customer_service_summary")
}

// ── Supplier Reports ──
export async function getSupplierRanking(): Promise<SupplierRanking[]> {
  return invoke<SupplierRanking[]>("get_supplier_ranking")
}
export async function getLeadTimeAnalysis(): Promise<LeadTimeAnalysis[]> {
  return invoke<LeadTimeAnalysis[]>("get_lead_time_analysis")
}

// ── Warehouse Reports ──
export async function getWarehouseUtilization(): Promise<WarehouseUtilization[]> {
  return invoke<WarehouseUtilization[]>("get_warehouse_utilization")
}
export async function getWarehouseStockDistribution(warehouseId: number): Promise<InventoryValuation[]> {
  return invoke<InventoryValuation[]>("get_warehouse_stock_distribution", { warehouseId })
}
export async function getWarehouseAdjustments(): Promise<WarehouseAdjustmentSummary[]> {
  return invoke<WarehouseAdjustmentSummary[]>("get_warehouse_adjustments")
}

// ── Profitability ──
export async function getProfitSummary(months: number): Promise<ProfitSummary[]> {
  return invoke<ProfitSummary[]>("get_profit_summary", { months })
}
export async function getProfitByCategory(): Promise<ProfitByEntity[]> {
  return invoke<ProfitByEntity[]>("get_profit_by_category")
}
export async function getProfitByProduct(limit: number): Promise<ProfitByEntity[]> {
  return invoke<ProfitByEntity[]>("get_profit_by_product", { limit })
}
export async function getProfitBySupplier(): Promise<ProfitByEntity[]> {
  return invoke<ProfitByEntity[]>("get_profit_by_supplier")
}
export async function getProfitByBrand(): Promise<ProfitByEntity[]> {
  return invoke<ProfitByEntity[]>("get_profit_by_brand")
}
export async function getProfitByCustomer(limit: number): Promise<ProfitByEntity[]> {
  return invoke<ProfitByEntity[]>("get_profit_by_customer", { limit })
}
export async function getProfitByWarehouse(): Promise<ProfitByEntity[]> {
  return invoke<ProfitByEntity[]>("get_profit_by_warehouse")
}

// ── KPIs ──
export async function getKpiValues(): Promise<KpiValue[]> {
  return invoke<KpiValue[]>("get_kpi_values")
}
export async function getKpiDefinitions(): Promise<KpiDefinition[]> {
  return invoke<KpiDefinition[]>("get_kpi_definitions")
}

// ── Saved / Scheduled Reports ──
export async function getSavedReports(module?: string): Promise<SavedReport[]> {
  return invoke<SavedReport[]>("get_saved_reports", { module })
}
export async function createSavedReport(input: SavedReportInput, createdBy: number): Promise<SavedReport> {
  return invoke<SavedReport>("create_saved_report", { input, createdBy })
}
export async function deleteSavedReport(id: number): Promise<void> {
  return invoke<void>("delete_saved_report", { id })
}
export async function getScheduledReports(): Promise<ScheduledReport[]> {
  return invoke<ScheduledReport[]>("get_scheduled_reports")
}
export async function createScheduledReport(name: string, savedReportId: number | undefined, frequency: string, dayOfWeek: number | undefined, dayOfMonth: number | undefined, time: string, exportFormat: string, createdBy: number): Promise<ScheduledReport> {
  return invoke<ScheduledReport>("create_scheduled_report", { name, savedReportId, frequency, dayOfWeek, dayOfMonth, time, exportFormat, createdBy })
}
export async function toggleScheduledReport(id: number, isActive: boolean): Promise<void> {
  return invoke<void>("toggle_scheduled_report", { id, isActive })
}
export async function getReportHistory(limit: number): Promise<ReportHistoryEntry[]> {
  return invoke<ReportHistoryEntry[]>("get_report_history", { limit })
}
export async function logReportGeneration(reportName: string, module: string, filters: string | undefined, exportFormat: string | undefined, executionTimeMs: number, rowCount: number, filePath: string | undefined, generatedBy: number): Promise<void> {
  return invoke<void>("log_report_generation", { reportName, module, filters, exportFormat, executionTimeMs, rowCount, filePath, generatedBy })
}
export async function getReportTemplates(module?: string): Promise<ReportTemplate[]> {
  return invoke<ReportTemplate[]>("get_report_templates", { module })
}
export async function getDashboardPreferences(userId: number): Promise<string> {
  return invoke<string>("get_dashboard_preferences", { userId })
}
export async function saveDashboardPreferences(userId: number, widgets: string): Promise<void> {
  return invoke<void>("save_dashboard_preferences", { userId, widgets })
}

// ── Admin Dashboard ──

export async function getAdminDashboard(): Promise<AdminDashboard> {
  return invoke<AdminDashboard>("get_admin_dashboard")
}

export async function getUserActivityChart(days?: number): Promise<UserActivityPoint[]> {
  return invoke<UserActivityPoint[]>("get_user_activity_chart", { days })
}

export async function getDatabaseGrowthChart(days?: number): Promise<DbGrowthPoint[]> {
  return invoke<DbGrowthPoint[]>("get_database_growth_chart", { days })
}

export async function getRecentAuditEvents(limit?: number): Promise<AuditEvent[]> {
  return invoke<AuditEvent[]>("get_recent_audit_events", { limit })
}

// ── Admin Users ──

export async function getAdminUsers(search?: string, roleId?: number, isActive?: boolean, page?: number, pageSize?: number): Promise<AdminUser[]> {
  return invoke<AdminUser[]>("get_admin_users", { search, roleId, isActive, page, pageSize })
}

export async function getAdminUser(id: number): Promise<AdminUser> {
  return invoke<AdminUser>("get_admin_user", { id })
}

export async function createAdminUser(input: { username: string; email: string; password: string; fullName: string; phone?: string; roleId?: number; notes?: string }, createdBy: number): Promise<AdminUser> {
  return invoke<AdminUser>("create_admin_user", { input, createdBy })
}

export async function updateAdminUser(input: { id: number; username?: string; email?: string; fullName?: string; phone?: string; roleId?: number; isActive?: boolean; notes?: string }): Promise<AdminUser> {
  return invoke<AdminUser>("update_admin_user", { input })
}

export async function archiveAdminUser(id: number): Promise<void> {
  return invoke<void>("archive_admin_user", { id })
}

export async function restoreAdminUser(id: number): Promise<void> {
  return invoke<void>("restore_admin_user", { id })
}

export async function resetUserPassword(id: number, newPassword: string, requireChange: boolean): Promise<void> {
  return invoke<void>("reset_user_password", { id, newPassword, requireChange })
}

export async function lockUserAccount(id: number, durationMinutes?: number): Promise<void> {
  return invoke<void>("lock_user_account", { id, durationMinutes })
}

export async function unlockUserAccount(id: number): Promise<void> {
  return invoke<void>("unlock_user_account", { id })
}

export async function getUserSessions(userId: number): Promise<{ id: number; user_id: number; token: string; expires_at: string; is_active: boolean; created_at: string }[]> {
  return invoke<{ id: number; user_id: number; token: string; expires_at: string; is_active: boolean; created_at: string }[]>("get_user_sessions", { userId })
}

export async function revokeUserSession(sessionId: number): Promise<void> {
  return invoke<void>("revoke_user_session", { sessionId })
}

export async function getTotalUserCount(): Promise<number> {
  return invoke<number>("get_total_user_count")
}

// ── Admin Roles ──

export async function getAdminRoles(search?: string): Promise<AdminRole[]> {
  return invoke<AdminRole[]>("get_admin_roles", { search })
}

export async function getAdminRole(id: number): Promise<RoleWithPermissions> {
  return invoke<RoleWithPermissions>("get_admin_role", { id })
}

export async function getAllPermissions(search?: string, group?: string): Promise<AdminPermission[]> {
  return invoke<AdminPermission[]>("get_all_permissions", { search, group })
}

export async function getPermissionGroups(): Promise<string[]> {
  return invoke<string[]>("get_permission_groups")
}

export async function createAdminRole(input: { name: string; description?: string; permissions: string[] }): Promise<AdminRole> {
  return invoke<AdminRole>("create_admin_role", { input })
}

export async function updateAdminRole(input: { id: number; name?: string; description?: string; isActive?: boolean; permissions: string[] }): Promise<AdminRole> {
  return invoke<AdminRole>("update_admin_role", { input })
}

export async function cloneAdminRole(id: number, newName: string): Promise<AdminRole> {
  return invoke<AdminRole>("clone_admin_role", { id, newName })
}

export async function archiveAdminRole(id: number): Promise<void> {
  return invoke<void>("archive_admin_role", { id })
}

export async function assignPermissionsToRole(roleId: number, permissionKeys: string[]): Promise<void> {
  return invoke<void>("assign_permissions_to_role", { roleId, permissionKeys })
}

export async function bulkAssignPermissions(roleIds: number[], permissionKeys: string[], assign: boolean): Promise<void> {
  return invoke<void>("bulk_assign_permissions", { roleIds, permissionKeys, assign })
}

// ── Admin Settings ──

export async function getAppSettings(category?: string): Promise<AdminAppSetting[]> {
  return invoke<AdminAppSetting[]>("get_app_settings", { category })
}

export async function getSettingCategories(): Promise<SettingCategory[]> {
  return invoke<SettingCategory[]>("get_setting_categories")
}

export async function updateAppSetting(key: string, value: string): Promise<void> {
  return invoke<void>("update_app_setting", { input: { key, value } })
}

export async function updateAppSettingsBulk(settings: { key: string; value: string }[]): Promise<void> {
  return invoke<void>("update_app_settings_bulk", { settings })
}

export async function getSettingHistory(key: string): Promise<{ id: number; user_id?: number; username: string; action: string; details?: string; created_at: string }[]> {
  return invoke<{ id: number; user_id?: number; username: string; action: string; details?: string; created_at: string }[]>("get_setting_history", { key })
}

export async function resetSettingToDefault(key: string): Promise<void> {
  return invoke<void>("reset_setting_to_default", { key })
}

// ── Admin Printers ──

export async function getPrinters(printerType?: string): Promise<PrinterSetting[]> {
  return invoke<PrinterSetting[]>("get_printers", { printerType })
}

export async function createPrinter(input: PrinterInput): Promise<PrinterSetting> {
  return invoke<PrinterSetting>("create_printer", { input })
}

export async function updatePrinter(id: number, input: PrinterInput): Promise<PrinterSetting> {
  return invoke<PrinterSetting>("update_printer", { id, input })
}

export async function deletePrinter(id: number): Promise<void> {
  return invoke<void>("delete_printer", { id })
}

export async function setDefaultPrinter(id: number): Promise<void> {
  return invoke<void>("set_default_printer", { id })
}

export async function testPrinter(id: number): Promise<string> {
  return invoke<string>("test_printer", { id })
}

export async function getPrinterTypes(): Promise<string[]> {
  return invoke<string[]>("get_printer_types")
}

// ── Admin Devices ──

export async function getDevices(deviceType?: string): Promise<DeviceSetting[]> {
  return invoke<DeviceSetting[]>("get_devices", { deviceType })
}

export async function createDevice(input: DeviceInput): Promise<DeviceSetting> {
  return invoke<DeviceSetting>("create_device", { input })
}

export async function updateDevice(id: number, input: DeviceInput): Promise<DeviceSetting> {
  return invoke<DeviceSetting>("update_device", { id, input })
}

export async function deleteDevice(id: number): Promise<void> {
  return invoke<void>("delete_device", { id })
}

export async function testDevice(id: number): Promise<string> {
  return invoke<string>("test_device", { id })
}

export async function getDeviceTypes(): Promise<string[]> {
  return invoke<string[]>("get_device_types")
}

// ── Admin Backups ──

export async function getBackupHistory(limit?: number): Promise<BackupRecord[]> {
  return invoke<BackupRecord[]>("get_backup_history", { limit })
}

export async function createBackup(backupType: string, notes?: string, createdBy?: number): Promise<BackupRecord> {
  return invoke<BackupRecord>("create_backup", { backupType, notes, createdBy })
}

export async function deleteBackup(id: number): Promise<void> {
  return invoke<void>("delete_backup", { id })
}

export async function getRestoreHistory(limit?: number): Promise<RestoreRecord[]> {
  return invoke<RestoreRecord[]>("get_restore_history", { limit })
}

export async function getScheduledBackupConfig(): Promise<Record<string, string>> {
  return invoke<Record<string, string>>("get_scheduled_backup_config")
}

export async function saveScheduledBackupConfig(config: Record<string, string>): Promise<void> {
  return invoke<void>("save_scheduled_backup_config", { config })
}

export async function getBackupStats(): Promise<{ total_backups: number; total_size_bytes: number; total_size_mb: string; last_backup?: string }> {
  return invoke<{ total_backups: number; total_size_bytes: number; total_size_mb: string; last_backup?: string }>("get_backup_stats")
}

// ── Admin Database ──

export async function getDatabaseStats(): Promise<DatabaseStats> {
  return invoke<DatabaseStats>("get_database_stats")
}

export async function getTableSizes(): Promise<TableInfo[]> {
  return invoke<TableInfo[]>("get_table_sizes")
}

export async function vacuumDatabase(): Promise<string> {
  return invoke<string>("vacuum_database")
}

export async function optimizeDatabase(): Promise<string> {
  return invoke<string>("optimize_database")
}

export async function checkDatabaseIntegrity(): Promise<string> {
  return invoke<string>("check_database_integrity")
}

export async function getMigrationStatus(): Promise<MigrationInfo[]> {
  return invoke<MigrationInfo[]>("get_migration_status")
}

export async function reindexDatabase(): Promise<string> {
  return invoke<string>("reindex_database")
}

// ── Admin Diagnostics ──

export async function runDiagnostics(): Promise<DiagnosticCheck[]> {
  return invoke<DiagnosticCheck[]>("run_diagnostics")
}

export async function getDiagnosticHistory(limit?: number): Promise<DiagnosticReport[]> {
  return invoke<DiagnosticReport[]>("get_diagnostic_history", { limit })
}

export async function saveDiagnosticReport(reportType: string, status: string, summary: string, details: unknown, createdBy: number): Promise<void> {
  return invoke<void>("save_diagnostic_report", { reportType, status, summary, details, createdBy })
}

export async function getDiagnosticSummary(): Promise<{ healthy: number; warning: number; critical: number; total: number; last_report?: string }> {
  return invoke<{ healthy: number; warning: number; critical: number; total: number; last_report?: string }>("get_diagnostic_summary")
}

export async function getSystemLogs(lines?: number): Promise<string> {
  return invoke<string>("get_system_logs", { lines })
}

export async function getSupportPackage(): Promise<string> {
  return invoke<string>("get_support_package")
}

// ── Admin Audit ──

export async function getAuditEvents(filter?: AuditFilter, page?: number, pageSize?: number): Promise<AuditEvent[]> {
  return invoke<AuditEvent[]>("get_audit_events", { filter, page, pageSize })
}

export async function getAuditEvent(id: number): Promise<AuditEvent> {
  return invoke<AuditEvent>("get_audit_event", { id })
}

export async function getAuditSummary(): Promise<{ total_events: number; by_severity: Record<string, number>; by_action: Record<string, number>; by_entity_type: Record<string, number> }> {
  return invoke<{ total_events: number; by_severity: Record<string, number>; by_action: Record<string, number>; by_entity_type: Record<string, number> }>("get_audit_summary")
}

export async function getAuditTimeline(days?: number): Promise<{ date: string; count: number }[]> {
  return invoke<{ date: string; count: number }[]>("get_audit_timeline", { days })
}

export async function getAuditByAction(): Promise<{ action: string; count: number; last_occurrence: string }[]> {
  return invoke<{ action: string; count: number; last_occurrence: string }[]>("get_audit_by_action")
}

export async function getAuditByUser(days?: number): Promise<{ user_id: number; username: string; full_name: string; count: number; last_activity: string }[]> {
  return invoke<{ user_id: number; username: string; full_name: string; count: number; last_activity: string }[]>("get_audit_by_user", { days })
}

export async function exportAuditLogs(filter?: AuditFilter): Promise<string> {
  return invoke<string>("export_audit_logs", { filter })
}

// ── Admin Updates ──

export async function getSystemUpdates(): Promise<SystemUpdate[]> {
  return invoke<SystemUpdate[]>("get_system_updates")
}

export async function checkForUpdates(): Promise<{ current_version: string; latest_version: string; has_update: boolean }> {
  return invoke<{ current_version: string; latest_version: string; has_update: boolean }>("check_for_updates")
}

export async function getCurrentVersion(): Promise<string> {
  return invoke<string>("get_current_version")
}

export async function recordUpdateAvailable(version: string, releaseNotes?: string, downloadUrl?: string): Promise<void> {
  return invoke<void>("record_update_available", { version, releaseNotes, downloadUrl })
}

export async function markUpdateInstalled(updateId: number, installedBy: number): Promise<void> {
  return invoke<void>("mark_update_installed", { updateId, installedBy })
}

// ── Admin License ──

export async function getLicenseInfo(): Promise<LicenseInfo | null> {
  return invoke<LicenseInfo | null>("get_license_info")
}

export async function saveLicense(input: { licenseKey: string; licenseType: string; companyName?: string; contactName?: string; contactEmail?: string; maxUsers: number; maxStores: number; features: string; activationDate?: string; expirationDate?: string }): Promise<LicenseInfo> {
  return invoke<LicenseInfo>("save_license", { input })
}

export async function activateLicense(licenseKey: string): Promise<LicenseInfo> {
  return invoke<LicenseInfo>("activate_license", { licenseKey })
}

export async function deactivateLicense(): Promise<void> {
  return invoke<void>("deactivate_license")
}

export async function validateLicense(): Promise<{ valid: boolean; status: string; expiration_date?: string; expired: boolean }> {
  return invoke<{ valid: boolean; status: string; expiration_date?: string; expired: boolean }>("validate_license")
}

// ── Admin Maintenance ──

export async function getMaintenanceLogs(limit?: number): Promise<MaintenanceLog[]> {
  return invoke<MaintenanceLog[]>("get_maintenance_logs", { limit })
}

export async function runMaintenance(operation: string, createdBy: number): Promise<{ operation: string; status: string; details: string; duration_ms: number; affected_rows: number; error?: string }> {
  return invoke<{ operation: string; status: string; details: string; duration_ms: number; affected_rows: number; error?: string }>("run_maintenance", { operation, createdBy })
}

export async function clearAuditLogs(beforeDays: number): Promise<number> {
  return invoke<number>("clear_audit_logs", { beforeDays })
}

export async function getStorageInfo(): Promise<{ database_size_bytes: number; database_size_mb: string; backup_count: number; backup_total_size_bytes: number; backup_total_size_mb: string; audit_log_count: number; log_size_bytes: number; log_size_mb: string }> {
  return invoke<{ database_size_bytes: number; database_size_mb: string; backup_count: number; backup_total_size_bytes: number; backup_total_size_mb: string; audit_log_count: number; log_size_bytes: number; log_size_mb: string }>("get_storage_info")
}

export async function getSystemInfo(): Promise<{ app_version: string; db_version: number; operating_system: string; architecture: string; hostname: string; timestamp: string }> {
  return invoke<{ app_version: string; db_version: number; operating_system: string; architecture: string; hostname: string; timestamp: string }>("get_system_info")
}
