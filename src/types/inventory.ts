export interface InventoryCategory {
  id: number
  name: string
  description: string | null
  parentId: number | null
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Brand {
  id: number
  name: string
  description: string | null
  country: string | null
  website: string | null
  logoUrl: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Manufacturer {
  id: number
  name: string
  country: string | null
  phone: string | null
  email: string | null
  website: string | null
  notes: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface InventorySupplier {
  id: number
  companyName: string
  contactPerson: string | null
  phone: string | null
  mobile: string | null
  email: string | null
  website: string | null
  taxNumber: string | null
  address: string | null
  city: string | null
  state: string | null
  postalCode: string | null
  country: string | null
  notes: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Warehouse {
  id: number
  name: string
  code: string
  address: string | null
  city: string | null
  state: string | null
  country: string | null
  manager: string | null
  phone: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface StorageLocation {
  id: number
  warehouseId: number
  zone: string | null
  aisle: string | null
  shelf: string | null
  bin: string | null
  code: string
  description: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface InventoryProduct {
  id: number
  name: string
  sku: string
  barcode: string | null
  oemNumber: string | null
  internalCode: string | null
  description: string | null
  categoryId: number | null
  brandId: number | null
  manufacturerId: number | null
  supplierId: number | null
  costPrice: number
  salePrice: number
  wholesalePrice: number
  suggestedRetailPrice: number
  taxRate: number
  stockQuantity: number
  minStockLevel: number
  maxStockLevel: number
  reorderPoint: number
  unit: string
  weight: number | null
  warehouseId: number | null
  storageLocationId: number | null
  imageUrl: string | null
  isActive: boolean
  isDiscontinued: boolean
  createdAt: string
  updatedAt: string
  /** Product-specific profit margin percentage; `null` = follow the app-wide default. */
  profitMarginPct: number | null
  /** Manually edited selling price override; `null` = auto (derived from margin). */
  editedPrice: number | null
  /** Computed suggested price = `cost × (1 + effectiveMargin / 100)`. */
  suggestedPrice: number
  /** Effective margin applied to this product (individual ?? global default). */
  effectiveMarginPct: number
}

export interface ProductImage {
  id: number
  productId: number
  filePath: string
  isPrimary: boolean
  sortOrder: number
  createdAt: string
}

export interface ProductCompatibility {
  id: number
  productId: number
  vehicleBrand: string
  vehicleModel: string
  yearStart: number | null
  yearEnd: number | null
  engine: string | null
  transmission: string | null
  notes: string | null
  createdAt: string
}

export interface DashboardStats {
  totalProducts: number
  activeProducts: number
  inactiveProducts: number
  totalCategories: number
  totalBrands: number
  totalSuppliers: number
  totalWarehouses: number
  lowStockProducts: number
  outOfStockProducts: number
  inventoryValue: number
}

export interface InventoryMovement {
  id: number
  productId: number
  warehouseId: number | null
  quantity: number
  type: string
  referenceType: string | null
  referenceId: string | null
  notes: string | null
  createdBy: number | null
  createdAt: string
}

export interface InventoryPaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export type ImportAction = "insert" | "update" | "skip" | "error"
export type ImportMode = "append" | "update"
export type ExportScope = "active" | "all"

export interface RowPreview {
  rowNumber: number
  sku: string
  name: string
  action: ImportAction
  reason: string | null
  errors: string[]
  currentStock: number | null
  newStock: number | null
  stockChange: number | null
}

export interface RowError {
  rowNumber: number
  sku: string
  message: string
}

export interface ImportPreview {
  filename: string
  storeId: number | null
  mode: string
  totalRows: number
  insertCount: number
  updateCount: number
  skipCount: number
  errorCount: number
  stockIncreaseCount: number
  stockDecreaseCount: number
  stockUnchangedCount: number
  rows: RowPreview[]
  errorRows: RowError[]
  rowsTruncated: boolean
}

export interface ImportResult {
  ok: boolean
  filename: string
  mode: string
  totalRows: number
  inserted: number
  updated: number
  skipped: number
  errors: number
  stockIncreased: number
  stockDecreased: number
  errorRows: RowError[]
  importId: number | null
  message: string | null
}

export interface ExportResult {
  path: string
  filename: string
  productCount: number
}

export interface ImportHistoryRow {
  id: number
  filename: string
  importMode: string
  totalRows: number
  inserted: number
  updated: number
  skipped: number
  errors: number
  stockIncreased: number
  stockDecreased: number
  createdBy: string | null
  createdAt: string
}
