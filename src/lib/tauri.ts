import { invoke } from "@tauri-apps/api/core"
import type { LoginResponse, SessionInfo, AppSetting } from "@/types"
import type {
  InventoryCategory, Brand, Manufacturer, InventorySupplier,
  Warehouse, StorageLocation, InventoryProduct, ProductImage,
  ProductCompatibility, DashboardStats, InventoryPaginatedResult,
} from "@/types/inventory"

export async function getAppVersion(): Promise<string> {
  return invoke<string>("get_app_version")
}

export async function healthCheck(): Promise<string> {
  return invoke<string>("health_check")
}

export async function greet(name: string): Promise<string> {
  return invoke<string>("greet", { name })
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  return invoke<LoginResponse>("login", { username, password })
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

// ── Product Relations ──

export async function getProductCompatibility(productId: number): Promise<ProductCompatibility[]> {
  return invoke<ProductCompatibility[]>("get_product_compatibility", { productId })
}

export async function getProductImages(productId: number): Promise<ProductImage[]> {
  return invoke<ProductImage[]>("get_product_images", { productId })
}
