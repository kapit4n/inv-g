export interface User {
  id: number
  username: string
  email: string
  fullName: string
  roleId?: number
  roleName?: string
  isActive: boolean
  lastLoginAt?: string
  createdAt: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  user: User
  token: string
  permissions: string[]
}

export interface SessionInfo {
  user: User
  permissions: string[]
  expiresAt: string
}

export interface Role {
  id: number
  name: string
  description?: string
  isSystem: boolean
  isActive: boolean
}

export interface Permission {
  id: number
  key: string
  name: string
  groupName: string
  description?: string
}

export interface RolePermission {
  roleId: number
  permissionId: number
}

export interface AppSetting {
  key: string
  value?: string
  groupName: string
  settingType: string
  description?: string
}

export interface Product {
  id: number
  name: string
  sku: string
  barcode?: string
  description?: string
  categoryId?: number
  supplierId?: number
  costPrice: number
  sellPrice: number
  stockQuantity: number
  minStock: number
  maxStock?: number
  unit: string
  weight?: number
  image?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ProductEquivalent {
  id: number
  productId: number
  equivalentProductId: number
  note?: string
  createdAt: string
  name: string
  sku: string
  brandName?: string
  categoryName?: string
  stockQuantity: number
  unit: string
  salePrice: number
  wholesalePrice: number
  taxRate: number
  imageUrl?: string
  isActive: boolean
}

export interface Category {
  id: number
  name: string
  description?: string
  parentId?: number
  icon?: string
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface Customer {
  id: number
  name: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
  notes?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CustomerSale {
  id: number
  saleNumber: string
  total: number
  paymentMethod: string
  paymentStatus: string
  itemCount?: number
  createdAt: string
}

export interface CustomerDetail {
  customer: Customer
  totalSales: number
  totalSpent: number
  lastPurchase?: string
  creditLimit?: number
  creditBalance?: number
  recentSales: CustomerSale[]
  communications: CommunicationEntry[]
}

export interface CreditAccount {
  id: number
  customerId: number
  customerName?: string
  creditLimit: number
  currentBalance: number
  status: string
  createdAt: string
  updatedAt: string
}

export interface CreditTransaction {
  id: number
  accountId: number
  amount: number
  transactionType: string
  referenceType?: string
  referenceId?: string
  notes?: string
  createdBy?: number
  createdByName?: string
  createdAt: string
}

export interface CommunicationEntry {
  id: number
  customerId: number
  type: string
  subject: string
  message?: string
  createdBy?: number
  createdByName?: string
  createdAt: string
}

export interface CommunicationInput {
  customerId: number
  type: string
  subject: string
  message?: string
}

export interface Supplier {
  id: number
  name: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  website?: string
  contactPerson?: string
  notes?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Sale {
  id: number
  saleNumber: string
  receiptNumber?: string
  customerId?: number
  userId?: number
  warehouseId?: number
  subtotal: number
  taxRate: number
  taxAmount: number
  discountAmount: number
  total: number
  paymentMethod: string
  paymentStatus: string
  notes?: string
  createdAt: string
  updatedAt: string
  customerName?: string
  itemCount?: number
}

export interface SalePayment {
  id: number
  saleId: number
  method: string
  amount: number
  reference?: string
  changeAmount: number
  createdAt: string
}

export interface PaymentInput {
  method: string
  amount: number
  reference?: string
  changeAmount: number
}

export interface CheckoutInput {
  customerId?: number
  userId?: number
  warehouseId?: number
  items: SaleItemInput[]
  payments: PaymentInput[]
  notes?: string
}

export interface CheckoutResult {
  sale: Sale
  items: SaleItem[]
  payments: SalePayment[]
  receiptNumber: string
}

// ── Business capabilities & store profiles ──

export type DatabaseProfile = "default" | "single-store" | "multi-store" | "empty"

export interface BusinessCapabilities {
  multiStore: boolean
  storeSelection: boolean
  storeManagement: boolean
  storeTransfers: boolean
  crossStoreReports: boolean
}

export interface BusinessStoreInfo {
  id: number
  name: string
  code: string
  address?: string
  city?: string
  isActive: boolean
  isDefault: boolean
}

export interface BusinessContext {
  activeProfile: DatabaseProfile
  databasePath: string
  multiStore: boolean
  storeCount: number
  defaultStoreId?: number
  stores: BusinessStoreInfo[]
  capabilities: BusinessCapabilities
  devMode: boolean
}

export interface StoreSalesRow {
  storeId: number
  storeName: string
  storeCode: string
  salesCount: number
  totalRevenue: number
  cashTotal: number
  cardTotal: number
  transferTotal: number
}

export interface StoreInventoryRow {
  storeId: number
  storeName: string
  storeCode: string
  productCount: number
  totalStockUnits: number
  inventoryValue: number
}

export interface TransferInput {
  productId: number
  fromStoreId: number
  toStoreId: number
  quantity: number
  notes?: string
  createdBy?: number
}

export interface HeldSale {
  id: number
  holdNumber: string
  customerId?: number
  userId?: number
  subtotal: number
  taxAmount: number
  discountAmount: number
  total: number
  discountPercent: number
  notes?: string
  label?: string
  createdAt: string
  customerName?: string
  itemCount?: number
}

export interface HeldSaleItem {
  id: number
  heldSaleId: number
  productId: number
  name: string
  sku: string
  quantity: number
  unitPrice: number
  taxRate: number
  total: number
  stockQuantity: number
  unit: string
  createdAt: string
}

export interface HoldSaleInput {
  customerId?: number
  userId?: number
  items: HeldSaleItemInput[]
  discountPercent?: number
  notes?: string
  label?: string
}

export interface HeldSaleItemInput {
  productId: number
  name: string
  sku: string
  quantity: number
  unitPrice: number
  taxRate: number
  total: number
  stockQuantity: number
  unit: string
}

export interface ProductForPos {
  id: number
  name: string
  sku: string
  barcode?: string
  salePrice: number
  wholesalePrice: number
  stockQuantity: number
  unit: string
  imageUrl?: string
  taxRate: number
  categoryName?: string
  brandName?: string
  isActive: boolean
  equivalentCount: number
}

export interface DailyCloseout {
  totalSales: number
  totalRevenue: number
  totalTax: number
  totalDiscount: number
  cashTotal: number
  cardTotal: number
  transferTotal: number
  cashCount: number
  cardCount: number
  transferCount: number
  refundedCount: number
  refundedTotal: number
  netRevenue: number
}

export interface SaleItem {
  id: number
  saleId: number
  productId: number
  quantity: number
  unitPrice: number
  discount: number
  total: number
  createdAt: string
  updatedAt: string
  productName?: string
  productSku?: string
}

export interface SaleItemInput {
  productId: number
  quantity: number
  unitPrice: number
  discount: number
  total: number
}

export interface Quote {
  id: number
  quoteNumber: string
  customerId?: number
  userId?: number
  subtotal: number
  taxRate: number
  taxAmount: number
  discountAmount: number
  total: number
  status: string
  validUntil?: string
  notes?: string
  termsConditions?: string
  createdAt: string
  updatedAt: string
  customerName?: string
  itemCount?: number
}

export interface QuoteItem {
  id: number
  quoteId: number
  productId: number
  quantity: number
  unitPrice: number
  discount: number
  total: number
  createdAt: string
  productName?: string
  productSku?: string
}

export interface QuoteInput {
  customerId?: number
  userId?: number
  items: SaleItemInput[]
  taxRate: number
  discountAmount: number
  validUntil?: string
  notes?: string
  termsConditions?: string
}

export interface CashRegisterSession {
  id: number
  userId: number
  openedAt: string
  closedAt?: string
  openingBalance: number
  closingBalance?: number
  expectedBalance?: number
  difference?: number
  status: string
  notes?: string
  userName?: string
}

export interface DailyClosing {
  id: number
  closedBy: number
  closedAt: string
  date: string
  totalSales: number
  totalRevenue: number
  totalTax: number
  totalDiscount: number
  cashTotal: number
  cardTotal: number
  transferTotal: number
  cashCount: number
  cardCount: number
  transferCount: number
  refundedCount: number
  refundedTotal: number
  netRevenue: number
  notes?: string
  closedByName?: string
}

export interface Receipt {
  id: number
  saleId: number
  receiptNumber: string
  receiptType: string
  printedAt?: string
  isPrinted: boolean
  createdAt: string
}

export interface SalesSummary {
  totalSalesToday: number
  revenueToday: number
  totalSalesWeek: number
  revenueWeek: number
  totalSalesMonth: number
  revenueMonth: number
  averageOrderValue: number
  topProducts: ProductSalesStat[]
}

export interface ProductSalesStat {
  productId: number
  productName: string
  totalQuantity: number
  totalRevenue: number
}

export interface SalesChartData {
  labels: string[]
  revenue: number[]
  orders: number[]
}

// ── Purchasing Types ──

export interface PurchaseOrder {
  id: number
  poNumber: string
  supplierId?: number
  supplierName?: string
  userId?: number
  userName?: string
  warehouseId?: number
  warehouseName?: string
  orderDate: string
  expectedDeliveryDate?: string
  currency: string
  paymentTerms?: string
  shippingMethod?: string
  referenceNumber?: string
  buyer?: string
  subtotal: number
  taxRate: number
  taxAmount: number
  discountAmount: number
  shippingCost: number
  total: number
  status: string
  notes?: string
  approvedBy?: number
  approvedByName?: string
  approvedAt?: string
  sentAt?: string
  itemCount?: number
  createdAt: string
  updatedAt: string
}

export interface PurchaseOrderItem {
  id: number
  purchaseOrderId: number
  productId: number
  productName?: string
  productSku?: string
  supplierSku?: string
  quantity: number
  unitCost: number
  discount: number
  tax: number
  total: number
  receivedQuantity: number
  damagedQuantity: number
  createdAt: string
  updatedAt: string
}

export interface PurchaseOrderInput {
  supplierId?: number
  warehouseId?: number
  paymentTerms?: string
  shippingMethod?: string
  referenceNumber?: string
  buyer?: string
  notes?: string
  expectedDeliveryDate?: string
  items: PurchaseOrderItemInput[]
}

export interface PurchaseOrderItemInput {
  productId: number
  supplierSku?: string
  quantity: number
  unitCost: number
  discount: number
  tax: number
  total: number
}

export interface PurchaseRequest {
  id: number
  requestNumber: string
  requestedBy?: number
  requestedByName?: string
  warehouseId?: number
  warehouseName?: string
  priority: string
  status: string
  reason?: string
  requiredDate?: string
  itemCount?: number
  createdAt: string
  updatedAt: string
}

export interface PurchaseRequestItem {
  id: number
  requestId: number
  productId: number
  productName?: string
  productSku?: string
  requestedQuantity: number
  currentStock: number
  minStockLevel: number
  supplierSuggestion?: string
  createdAt: string
}

export interface PurchaseRequestInput {
  warehouseId: number
  priority: string
  reason: string
  requiredDate?: string
  items: { productId: number; requestedQuantity: number }[]
}

export interface PurchaseReceipt {
  id: number
  receiptNumber: string
  purchaseOrderId: number
  poNumber?: string
  receivedBy?: number
  receivedByName?: string
  warehouseId?: number
  warehouseName?: string
  notes?: string
  status: string
  itemCount?: number
  createdAt: string
  updatedAt: string
}

export interface PurchaseReceiptItem {
  id: number
  receiptId: number
  poItemId: number
  productId: number
  productName?: string
  productSku?: string
  expectedQuantity: number
  receivedQuantity: number
  damagedQuantity: number
  acceptedQuantity: number
  createdAt: string
}

export interface ReceivePOInput {
  poItemId: number
  productId: number
  receivedQuantity: number
  damagedQuantity: number
}

export interface PurchaseReturn {
  id: number
  returnNumber: string
  purchaseOrderId?: number
  poNumber?: string
  supplierId: number
  supplierName?: string
  reason?: string
  status: string
  createdBy?: number
  createdByName?: string
  itemCount?: number
  createdAt: string
  updatedAt: string
}

export interface PurchaseReturnItem {
  id: number
  returnId: number
  productId: number
  productName?: string
  productSku?: string
  quantity: number
  unitCost: number
  reason?: string
  createdAt: string
}

export interface PurchaseReturnInput {
  poId?: number
  supplierId: number
  reason: string
  items: { productId: number; quantity: number; unitCost: number; reason?: string }[]
}

export interface SupplierProduct {
  id: number
  supplierId: number
  supplierName?: string
  productId: number
  productName?: string
  productSku?: string
  brandName?: string
  supplierSku?: string
  isPreferred: boolean
  minimumOrderQuantity: number
  leadTimeDays: number
  defaultCost: number
  currency: string
  status: string
  createdAt: string
  updatedAt: string
}

export interface SupplierProductInput {
  supplierId: number
  productId: number
  supplierSku?: string
  isPreferred: boolean
  minimumOrderQuantity: number
  leadTimeDays: number
  defaultCost: number
  currency: string
  status: string
}

export interface CostHistory {
  id: number
  productId: number
  productName?: string
  productSku?: string
  supplierId?: number
  supplierName?: string
  purchaseOrderId?: number
  poNumber?: string
  oldCost: number
  newCost: number
  quantity: number
  createdBy?: number
  createdByName?: string
  createdAt: string
}

export interface ReorderSuggestion {
  productId: number
  productName: string
  productSku: string
  currentStock: number
  minStockLevel: number
  reorderPoint: number
  maxStockLevel: number
  salePrice: number
  costPrice: number
  pendingPoQuantity: number
  reservedQuantity: number
  suggestedOrder: number
  preferredSupplierId?: number
  preferredSupplierName?: string
}

export interface SupplierPerformance {
  supplierId: number
  supplierName: string
  totalOrders: number
  completedOrders: number
  cancelledOrders: number
  avgDeliveryDays?: number
  totalPurchased: number
  avgCost: number
  returnRate: number
  lateDeliveries: number
  preferredScore: number
}

export interface PurchaseDashboard {
  pendingOrders: number
  awaitingApproval: number
  awaitingDelivery: number
  todayReceipts: number
  monthlyPurchased: number
  monthlyOrderCount: number
  recentOrders: PurchaseOrder[]
  reorderSuggestions: ReorderSuggestion[]
  supplierPerformances: SupplierPerformance[]
  topSuppliers: [string, number][]
}

export type Theme = "light" | "dark" | "system"

export interface AppNotification {
  id: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "error"
  read: boolean
  createdAt: string
  actions?: { label: string; onClick: () => void }[]
  duration?: number
}

export interface DialogConfig {
  open: boolean
  title: string
  description?: string
  type: "confirm" | "delete" | "warning" | "info" | "generic"
  confirmLabel?: string
  cancelLabel?: string
  onConfirm?: () => void
  onCancel?: () => void
  children?: React.ReactNode
}

export type PageTitle = {
  title: string
  description?: string
}

export type PermissionCheck = string | string[]

export interface AuthState {
  user: User | null
  token: string | null
  permissions: string[]
  isAuthenticated: boolean
  isLoading: boolean
}

// ── Vehicle Types ──

export interface VehicleBrand {
  id: number
  name: string
  description?: string
  country?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface VehicleModel {
  id: number
  brandId: number
  name: string
  brandName?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface VehicleGeneration {
  id: number
  modelId: number
  name?: string
  yearStart?: number
  yearEnd?: number
  createdAt: string
}

export interface VehicleEngine {
  id: number
  name: string
  displacement?: string
  power?: string
  fuelType?: string
  createdAt: string
}

export interface VehicleTransmission {
  id: number
  name: string
  type?: string
  gears?: number
  createdAt: string
}

export interface VehicleFuel {
  id: number
  name: string
  createdAt: string
}

export interface CustomerVehicle {
  id: number
  customerId: number
  licensePlate?: string
  nickname?: string
  brandId?: number
  modelId?: number
  generationId?: number
  year?: number
  engineId?: number
  transmissionId?: number
  fuelId?: number
  vin?: string
  color?: string
  mileage: number
  purchaseDate?: string
  notes?: string
  status: string
  createdAt: string
  updatedAt: string
  brandName?: string
  modelName?: string
  engineName?: string
  transmissionName?: string
  fuelName?: string
  customerName?: string
}

export interface CompatibilityEntry {
  id: number
  productId: number
  productName?: string
  productSku?: string
  brandId?: number
  brandName?: string
  modelId?: number
  modelName?: string
  generationId?: number
  generationName?: string
  engineId?: number
  engineName?: string
  transmissionId?: number
  transmissionName?: string
  yearStart?: number
  yearEnd?: number
  notes?: string
  createdAt: string
}

export interface ProductRecommendation {
  productId: number
  productName: string
  productSku: string
  salePrice: number
  stockQuantity: number
  categoryName?: string
  brandName?: string
  compatibilityCount: number
}

export interface ServiceReminder {
  id: number
  customerId: number
  vehicleId?: number
  reminderType: string
  title: string
  description?: string
  dueDate?: string
  dueMileage?: number
  status: string
  completedAt?: string
  completedBy?: number
  completedByName?: string
  notes?: string
  createdBy?: number
  createdByName?: string
  createdAt: string
  updatedAt: string
  customerName?: string
  vehicleInfo?: string
}

export interface Warranty {
  id: number
  warrantyNumber: string
  saleId?: number
  productId?: number
  customerId: number
  vehicleId?: number
  warrantyType: string
  periodMonths: number
  startDate: string
  expirationDate: string
  status: string
  notes?: string
  createdBy?: number
  createdAt: string
  updatedAt: string
  productName?: string
  customerName?: string
  vehicleInfo?: string
  saleNumber?: string
}

export interface CustomerNote {
  id: number
  customerId: number
  noteType: string
  title?: string
  content?: string
  isPrivate: boolean
  createdBy?: number
  createdByName?: string
  createdAt: string
  updatedAt: string
}

export interface TimelineEntry {
  id: number
  customerId: number
  eventType: string
  title: string
  description?: string
  referenceType?: string
  referenceId?: string
  createdBy?: number
  createdByName?: string
  createdAt: string
}

export interface CrmDashboard {
  totalCustomers: number
  newCustomersMonth: number
  activeCustomers: number
  workshops: number
  fleetCompanies: number
  vehiclesRegistered: number
  upcomingReminders: number
  expiredWarranties: number
  customersWithCredit: number
  lifetimeRevenue: number
  customersByType: [string, number][]
  vehicleBrands: [string, number][]
  topCustomers: [string, number][]
}

export interface CustomerType {
  id: number
  customerId: number
  type: string
  companyName?: string
  rnc?: string
  commercialName?: string
  createdAt: string
}

// ── Reporting Types ──

export interface ExecutiveDashboard {
  todayRevenue: number
  monthlyRevenue: number
  netProfitEstimate: number
  inventoryValue: number
  lowStockCount: number
  pendingPurchases: number
  averageTicket: number
  salesGrowth: number
  inventoryTurnover: number
  customerGrowth: number
}

export interface DashboardWidgets {
  todayRevenue: number
  monthlyRevenue: number
  netProfitEstimate: number
  inventoryValue: number
  lowStockCount: number
  pendingPurchases: number
  topCustomers: TopCustomer[]
  topProducts: TopProduct[]
  bestCategories: CategoryBreakdown[]
  recentSalesCount: number
  cashRegisterSummary: CashRegisterSummary
  supplierPerformanceAvg: number
  averageTicket: number
  salesGrowth: number
  inventoryTurnover: number
  customerGrowth: number
}

export interface CashRegisterSummary {
  openSessions: number
  todayCash: number
  todayCard: number
  todayTransfer: number
}

export interface RevenueByMonth {
  month: string
  revenue: number
  cost: number
  profit: number
  count: number
}

export interface CategoryBreakdown {
  category: string
  value: number
  count: number
}

export interface TopProduct {
  productId: number
  productName: string
  sku: string
  quantitySold: number
  revenue: number
}

export interface TopCustomer {
  customerId: number
  customerName: string
  totalSpent: number
  orderCount: number
}

export interface TopSupplier {
  supplierId: number
  supplierName: string
  totalPurchases: number
  orderCount: number
}

export interface WarehouseDistribution {
  warehouse: string
  productCount: number
  stockValue: number
}

export interface PurchaseVsSale {
  month: string
  purchases: number
  sales: number
}

export interface CustomerGrowthPoint {
  month: string
  count: number
}

export interface ChartData {
  revenueByMonth: RevenueByMonth[]
  salesByCategory: CategoryBreakdown[]
  salesByBrand: CategoryBreakdown[]
  profitTrend: RevenueByMonth[]
  inventoryTrend: RevenueByMonth[]
  customerGrowth: CustomerGrowthPoint[]
  warehouseDistribution: WarehouseDistribution[]
  topProductsChart: TopProduct[]
  topSuppliersChart: TopSupplier[]
  purchasesVsSales: PurchaseVsSale[]
}

export interface SalesReportFilter {
  dateFrom?: string
  dateTo?: string
  warehouseId?: number
  cashierId?: number
  customerId?: number
  categoryId?: number
  brandId?: number
  productId?: number
  paymentMethod?: string
}

export interface SalesReportRow {
  period: string
  transactionCount: number
  subtotal: number
  discount: number
  tax: number
  total: number
  cost: number
  profit: number
}

export interface SalesByCashier {
  userId: number
  cashierName: string
  transactionCount: number
  total: number
}

export interface SalesByPaymentMethod {
  method: string
  count: number
  total: number
}

export interface DiscountAnalysis {
  totalDiscounts: number
  avgDiscountPerSale: number
  salesWithDiscount: number
  maxDiscount: number
  discountPercentage: number
}

export interface ReturnsSummary {
  totalReturns: number
  totalRefunded: number
  avgRefund: number
}

export interface TaxSummary {
  totalTax: number
  avgTaxPerSale: number
  taxableSalesCount: number
}

export interface InventoryReportFilter {
  warehouseId?: number
  categoryId?: number
  brandId?: number
}

export interface InventoryReportRow {
  productId: number
  productName: string
  sku: string
  category?: string
  brand?: string
  warehouse?: string
  stockQuantity: number
  minStock: number
  maxStock: number
  reorderPoint: number
  costPrice: number
  salePrice: number
  stockValue: number
  stockValueSale: number
}

export interface InventoryValuation {
  category?: string
  productCount: number
  totalStock: number
  avgCost: number
  totalCostValue: number
  totalSaleValue: number
  potentialProfit: number
}

export interface StockStatusItem {
  productId: number
  productName: string
  sku: string
  stockQuantity: number
  minStock: number
  reorderPoint: number
  status: string
}

export interface ProductIdentifier {
  id: number
  productId: number
  identifier: string
  identifierType: string
  brandName?: string
  notes?: string
  createdAt: string
}

export interface CrossReferenceResult {
  productId: number
  productName: string
  productSku: string
  salePrice: number
  stockQuantity: number
  categoryName?: string
  brandName?: string
  matchedIdentifier: string
  matchedType: string
}

export interface MovementSummary {
  period: string
  inbound: number
  outbound: number
  adjustments: number
  netChange: number
}

export interface AgingItem {
  productId: number
  productName: string
  sku: string
  stockQuantity: number
  daysSinceLastMovement: number
  stockValue: number
}

export interface PurchaseReportFilter {
  dateFrom?: string
  dateTo?: string
  supplierId?: number
  status?: string
}

export interface PurchaseReportRow {
  period: string
  orderCount: number
  total: number
  itemCount: number
  avgOrderValue: number
}

export interface PurchaseBySupplier {
  supplierId: number
  supplierName: string
  orderCount: number
  total: number
  avgCost: number
}

export interface SupplierPerformance {
  supplierId: number
  supplierName: string
  orderCount: number
  completedCount: number
  onTimeDelivery: number
  avgLeadTimeDays: number
  returnRate: number
  totalSpent: number
}

export interface POStatusSummary {
  status: string
  count: number
  total: number
}

export interface ProductToReorder {
  productId: number
  productName: string
  sku: string
  stockQuantity: number
  reorderPoint: number
  preferredSupplier?: string
  lastCost: number
}

export interface CustomerReportRow {
  customerId: number
  customerName: string
  customerType: string
  email?: string
  phone?: string
  city?: string
  totalSpent: number
  orderCount: number
  lastPurchase?: string
  avgTicket: number
  lifetimeValue: number
}

export interface CustomerGrowthRow {
  month: string
  newCustomers: number
  totalCustomers: number
}

export interface CustomerLocation {
  city?: string
  state?: string
  count: number
}

export interface CustomerCreditSummary {
  totalAccounts: number
  totalCreditLimit: number
  totalBalance: number
  availableCredit: number
  utilizationRate: number
  overdueAccounts: number
}

export interface CustomerServiceSummary {
  totalReminders: number
  pendingReminders: number
  completedReminders: number
  overdueReminders: number
  totalVehicles: number
  totalWarranties: number
  activeWarranties: number
}

export interface SupplierRanking {
  supplierId: number
  supplierName: string
  totalPurchases: number
  orderCount: number
  avgCost: number
  onTimeRate: number
  returnRate: number
  avgLeadTime: number
  score: number
}

export interface LeadTimeAnalysis {
  supplierId: number
  supplierName: string
  minLeadTime: number
  maxLeadTime: number
  avgLeadTime: number
  orderCount: number
}

export interface WarehouseUtilization {
  warehouseId: number
  warehouseName: string
  productCount: number
  totalStock: number
  stockValue: number
  locationCount: number
  utilizationPct: number
}

export interface WarehouseAdjustmentSummary {
  warehouseId: number
  warehouseName: string
  adjustmentCount: number
  totalAdjusted: number
  positiveAdjustments: number
  negativeAdjustments: number
}

export interface ProfitSummary {
  grossRevenue: number
  estimatedCost: number
  grossProfit: number
  marginPct: number
  period?: string
}

export interface ProfitByEntity {
  entityId: number
  entityName: string
  revenue: number
  cost: number
  profit: number
  margin: number
  quantity: number
}

export interface KpiValue {
  key: string
  name: string
  value: number
  unit?: string
  target?: number
  trend?: string
  category: string
  status: string
}

export interface KpiDefinition {
  id: number
  name: string
  key: string
  description?: string
  category: string
  unit?: string
  target?: number
  warningThreshold?: number
  criticalThreshold?: number
  sortOrder: number
}

export interface SavedReport {
  id: number
  name: string
  description?: string
  module: string
  config: string
  columns?: string
  filters?: string
  sorting?: string
  isFavorite: boolean
  version: number
  createdBy?: number
  createdAt: string
  updatedAt: string
}

export interface SavedReportInput {
  name: string
  description?: string
  module: string
  config?: string
  columns?: string
  filters?: string
  sorting?: string
  isFavorite?: boolean
}

export interface ScheduledReport {
  id: number
  savedReportId?: number
  name: string
  frequency: string
  dayOfWeek?: number
  dayOfMonth?: number
  time: string
  exportFormat: string
  destination: string
  recipients?: string
  isActive: boolean
  lastRunAt?: string
  nextRunAt?: string
  createdBy?: number
}

export interface ReportHistoryEntry {
  id: number
  reportName: string
  module: string
  filters?: string
  exportFormat?: string
  executionTimeMs: number
  rowCount: number
  filePath?: string
  generatedBy?: number
  generatedByName?: string
  createdAt: string
}

export interface ReportTemplate {
  id: number
  name: string
  description?: string
  module: string
  config: string
  isSystem: boolean
}

export interface CostHistoryEntry {
  id: number
  productId: number
  productName: string
  productSku: string
  supplierId?: number
  supplierName?: string
  oldCost: number
  newCost: number
  quantity: number
  createdByName?: string
  createdAt: string
}

// ── Admin Types ──

export interface AdminUser {
  id: number
  username: string
  email: string
  fullName: string
  phone?: string
  roleId?: number
  roleName?: string
  isActive: boolean
  isLocked: boolean
  lockedUntil?: string
  failedLoginAttempts: number
  passwordExpiresAt?: string
  passwordChangeRequired: boolean
  lastLoginAt?: string
  notes?: string
  createdBy?: number
  createdByName?: string
  createdAt: string
  updatedAt: string
}

export interface CreateUserInput {
  username: string
  email: string
  password: string
  fullName: string
  phone?: string
  roleId?: number
  notes?: string
}

export interface UpdateUserInput {
  id: number
  username?: string
  email?: string
  fullName?: string
  phone?: string
  roleId?: number
  isActive?: boolean
  notes?: string
}

export interface AdminRole {
  id: number
  name: string
  description?: string
  isSystem: boolean
  isActive: boolean
  permissionCount: number
  userCount: number
  createdAt: string
  updatedAt: string
}

export interface AdminPermission {
  id: number
  key: string
  name: string
  groupName: string
  description?: string
}

export interface RoleWithPermissions {
  role: AdminRole
  permissions: string[]
}

export interface CreateRoleInput {
  name: string
  description?: string
  permissions: string[]
}

export interface UpdateRoleInput {
  id: number
  name?: string
  description?: string
  isActive?: boolean
  permissions: string[]
}

export interface AdminDashboard {
  activeUsers: number
  totalUsers: number
  databaseSize: string
  databaseSizeBytes: number
  lastBackup?: string
  backupStatus: string
  storageUsage: string
  storageUsedBytes: number
  appVersion: string
  connectedPrinters: number
  recentLogins: number
  recentErrors: number
  auditEventsToday: number
  systemHealth: string
  licenseStatus: string
}

export interface UserActivityPoint {
  date: string
  count: number
}

export interface DbGrowthPoint {
  date: string
  sizeBytes: number
}

export interface BackupRecord {
  id: number
  fileName: string
  filePath: string
  fileSize: number
  backupType: string
  compression: string
  encryption: string
  status: string
  checksum?: string
  notes?: string
  createdBy?: number
  createdByName?: string
  createdAt: string
}

export interface RestoreRecord {
  id: number
  backupId?: number
  fileName: string
  filePath: string
  restoreType: string
  status: string
  tablesRestored?: string
  errorMessage?: string
  createdBy?: number
  createdByName?: string
  createdAt: string
}

export interface BackupValidation {
  fileName: string
  filePath: string
  fileSize: number
  valid: boolean
  sqliteValid: boolean
  integrityOk: boolean
  checksum: string
  checksumMatch?: boolean
  message: string
}

export interface RestoreBackupInput {
  backupId?: number
  filePath?: string
  restoreType?: string
  createdBy: number
}

export interface PrinterSetting {
  id: number
  name: string
  printerType: string
  driverName?: string
  deviceName?: string
  interfaceType: string
  ipAddress?: string
  port?: number
  paperSize: string
  margins: string
  copies: number
  orientation: string
  isDefault: boolean
  isActive: boolean
  config: string
  createdAt: string
  updatedAt: string
}

export interface PrinterInput {
  name: string
  printerType: string
  driverName?: string
  deviceName?: string
  interfaceType: string
  ipAddress?: string
  port?: number
  paperSize: string
  margins: string
  copies: number
  orientation: string
  isDefault: boolean
  config: string
}

export interface DeviceSetting {
  id: number
  name: string
  deviceType: string
  identifier?: string
  interfaceType: string
  config: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface DeviceInput {
  name: string
  deviceType: string
  identifier?: string
  interfaceType: string
  config: string
}

export interface AdminAppSetting {
  id: number
  category: string
  key: string
  value?: string
  settingType: string
  description?: string
  options?: string
  validation?: string
  isSystem: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface SettingCategory {
  category: string
  count: number
}

export interface DatabaseStats {
  pageSize: number
  pageCount: number
  totalSize: number
  tableCount: number
  indexCount: number
  integrityOk: boolean
  freelistCount: number
  schemaVersion: number
}

export interface TableInfo {
  name: string
  rowCount: number
  pageCount: number
}

export interface MigrationInfo {
  version: number
  appliedAt?: string
}

export interface DiagnosticCheck {
  name: string
  status: string
  message: string
  details?: string
}

export interface DiagnosticReport {
  id: number
  reportType: string
  status: string
  summary?: string
  details: unknown
  issuesFound: number
  warnings: number
  createdBy?: number
  createdAt: string
}

export interface AuditEvent {
  id: number
  userId?: number
  username: string
  fullName: string
  action: string
  entityType?: string
  entityId?: string
  details?: string
  severity: string
  createdAt: string
}

export interface AuditFilter {
  action?: string
  entityType?: string
  severity?: string
  userId?: number
  dateFrom?: string
  dateTo?: string
  search?: string
}

export interface SystemUpdate {
  id: number
  version: string
  releaseDate?: string
  releaseNotes?: string
  downloadUrl?: string
  fileName?: string
  fileSize?: number
  checksum?: string
  status: string
  installedAt?: string
  installedBy?: number
  createdAt: string
}

export interface LicenseInfo {
  id: number
  licenseKey: string
  licenseType: string
  companyName?: string
  contactName?: string
  contactEmail?: string
  maxUsers: number
  maxStores: number
  features: string
  activationDate?: string
  expirationDate?: string
  status: string
  createdAt: string
  updatedAt: string
}

export interface LicenseInput {
  licenseKey: string
  licenseType: string
  companyName?: string
  contactName?: string
  contactEmail?: string
  maxUsers: number
  maxStores: number
  features: string
  activationDate?: string
  expirationDate?: string
}

export interface MaintenanceLog {
  id: number
  operation: string
  details?: string
  status: string
  durationMs: number
  affectedRows: number
  errorMessage?: string
  createdBy?: number
  createdByName?: string
  createdAt: string
}
