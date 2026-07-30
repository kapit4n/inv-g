import type { Page } from "@playwright/test"

export const ROUTES = {
  login: "/login",
  dashboard: "/dashboard",
  // inventory
  inventoryDashboard: "/inventory",
  categories: "/inventory/categories",
  brands: "/inventory/brands",
  manufacturers: "/inventory/manufacturers",
  inventorySuppliers: "/inventory/suppliers",
  warehouses: "/inventory/warehouses",
  storageLocations: "/inventory/storage-locations",
  products: "/inventory/products",
  productNew: "/inventory/products/new",
  productDetail: "/inventory/products/1",
  movements: "/inventory/movements",
  // sales
  sales: "/sales",
  pos: "/sales/new",
  saleDetail: "/sales/1",
  quotes: "/sales/quotes",
  quoteNew: "/sales/quotes/new",
  returns: "/sales/returns",
  cashRegister: "/sales/register",
  receipts: "/sales/receipts",
  closeout: "/sales/closeout",
  // purchases
  purchasingDashboard: "/purchases",
  purchaseOrders: "/purchases/orders",
  purchaseOrderNew: "/purchases/orders/new",
  purchaseOrderDetail: "/purchases/orders/1",
  purchaseRequests: "/purchases/requests",
  purchaseReceipts: "/purchases/receipts",
  purchaseReceiptDetail: "/purchases/receipts/1",
  purchaseReturns: "/purchases/returns",
  supplierProducts: "/purchases/supplier-products",
  costHistory: "/purchases/cost-history",
  reorderSuggestions: "/purchases/reorder-suggestions",
  // crm
  crmDashboard: "/crm",
  crmCustomers: "/crm/customers",
  crmCustomerDetail: "/crm/customers/1",
  crmVehicles: "/crm/vehicles",
  crmCompatibility: "/crm/compatibility",
  crmReminders: "/crm/reminders",
  crmWarranties: "/crm/warranties",
  crmCredit: "/crm/credit",
  crmNotes: "/crm/notes",
  // customers
  customers: "/customers",
  customerDetail: "/customers/1",
  // suppliers
  suppliers: "/suppliers",
  // vehicles
  vehicles: "/vehicles",
  // warehouse
  warehouse: "/warehouse",
  // reports
  reports: "/reports",
  reportsSales: "/reports/sales",
  reportsInventory: "/reports/inventory",
  reportsPurchasing: "/reports/purchasing",
  reportsCustomers: "/reports/customers",
  reportsSuppliers: "/reports/suppliers",
  reportsWarehouses: "/reports/warehouses",
  reportsProfitability: "/reports/profitability",
  reportsKpis: "/reports/kpis",
  reportsCustom: "/reports/custom",
  reportsScheduled: "/reports/scheduled",
  reportsExports: "/reports/exports",
  // admin
  adminDashboard: "/admin",
  adminUsers: "/admin/users",
  adminUserNew: "/admin/users/new",
  adminRoles: "/admin/roles",
  adminRoleNew: "/admin/roles/new",
  adminSettings: "/admin/settings",
  adminPrinters: "/admin/printers",
  adminDevices: "/admin/devices",
  adminBackups: "/admin/backups",
  adminRestore: "/admin/restore",
  adminDatabase: "/admin/database",
  adminDiagnostics: "/admin/diagnostics",
  adminAudit: "/admin/audit",
  adminUpdates: "/admin/updates",
  adminLicensing: "/admin/license",
  adminMaintenance: "/admin/maintenance",
  adminAbout: "/admin/about",
  // other
  employees: "/employees",
  settings: "/settings",
  help: "/help",
} as const

export type RouteKey = keyof typeof ROUTES

export async function navigateAndWait(page: Page, route: string): Promise<void> {
  await page.goto(route)
  await page.waitForLoadState("networkidle")
  const spinners = page.locator(
    '[role="status"], .spinner, .loading, [data-testid="loader"], .animate-spin'
  )
  if ((await spinners.count()) > 0) {
    await spinners.first().waitFor({ state: "hidden", timeout: 30_000 })
  }
}
