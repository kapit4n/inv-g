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
  isActive: boolean
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
