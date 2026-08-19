import { createBrowserRouter, Navigate } from "react-router-dom"
import { AppShell } from "@/layouts/app-shell"
import { AuthenticatedRoute, GuestRoute } from "@/components/auth-guards"
import { DashboardPage } from "@/features/dashboard"
import {
  InventoryDashboardPage,
  CategoriesPage, CategoryFormPage,
  BrandsPage, BrandFormPage,
  ManufacturersPage, ManufacturerFormPage,
  InventorySuppliersPage, SupplierFormPage,
  WarehousesPage, WarehouseFormPage,
  StorageLocationsPage, StorageLocationFormPage,
  ProductsPage, ProductFormPage, ProductDetailPage,
  InventoryMovementsPage, InventoryMovementFormPage,
} from "@/features/inventory"
import { SalesPage, PosPage, SaleDetailPage, CloseoutPage, QuotesPage, QuoteDetailPage, QuoteFormPage, ReturnsPage, CashRegisterPage, ReceiptsPage } from "@/features/sales"
import {
  PurchasesPage,
  PurchaseOrdersPage,
  PurchaseOrderDetailPage,
  PurchaseOrderFormPage,
  PurchaseRequestsPage,
  PurchaseReceiptsPage,
  PurchaseReceiptDetailPage,
  PurchaseReturnsPage,
  SupplierProductsPage,
  CostHistoryPage,
  ReorderSuggestionsPage,
} from "@/features/purchases"
import { CrmDashboardPage, CrmCustomersPage, CrmCustomerDetailPage, CrmVehiclesPage, CrmCompatibilityPage, CrmRemindersPage, CrmWarrantiesPage, CrmCreditPage, CrmNotesPage } from "@/features/crm"
import { CustomersPage, CustomerDetailPage } from "@/features/customers"
import { SuppliersPage } from "@/features/suppliers"
import { WarehousePage } from "@/features/warehouse"
import {
  ReportsPage, ReportsSalesPage, ReportsInventoryPage, ReportsPurchasingPage,
  ReportsCustomersPage, ReportsSuppliersPage, ReportsWarehousesPage,
  ReportsProfitabilityPage, ReportsKpiPage, ReportsCustomPage,
  ReportsScheduledPage, ReportsExportsPage,
} from "@/features/reports"
import {
  AdminDashboardPage, AdminUsersPage, AdminUserFormPage,
  AdminRolesPage, AdminRoleFormPage, AdminSettingsPage,
  AdminPrintersPage, AdminDevicesPage, AdminBackupsPage,
  AdminRestorePage, AdminDatabasePage, AdminDiagnosticsPage,
  AdminAuditPage, AdminUpdatesPage, AdminLicensePage,
  AdminMaintenancePage, AdminAboutPage,
} from "@/features/admin"
import { EmployeesPage } from "@/features/employees"
import { PartFinderPage } from "@/features/part-finder"
import { SettingsPage } from "@/features/settings"
import { HelpPage } from "@/features/help"
import { LoginPage } from "@/features/auth"
import { ForbiddenPage } from "@/components/error-pages"

export const router = createBrowserRouter([
  {
    path: "/login",
    element: (
      <GuestRoute>
        <LoginPage />
      </GuestRoute>
    ),
  },
  {
    path: "/forbidden",
    element: <ForbiddenPage />,
  },
  {
    path: "/",
    element: (
      <AuthenticatedRoute>
        <AppShell />
      </AuthenticatedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", element: <DashboardPage /> },
      { path: "crm", element: <CrmDashboardPage /> },
      { path: "crm/customers", element: <CrmCustomersPage /> },
      { path: "crm/customers/:id", element: <CrmCustomerDetailPage /> },
      { path: "crm/vehicles", element: <CrmVehiclesPage /> },
      { path: "crm/compatibility", element: <CrmCompatibilityPage /> },
      { path: "crm/reminders", element: <CrmRemindersPage /> },
      { path: "crm/warranties", element: <CrmWarrantiesPage /> },
      { path: "crm/credit", element: <CrmCreditPage /> },
      { path: "crm/notes", element: <CrmNotesPage /> },
      { path: "inventory", element: <InventoryDashboardPage /> },
      { path: "inventory/categories", element: <CategoriesPage /> },
      { path: "inventory/categories/new", element: <CategoryFormPage /> },
      { path: "inventory/categories/:id/edit", element: <CategoryFormPage /> },
      { path: "inventory/brands", element: <BrandsPage /> },
      { path: "inventory/brands/new", element: <BrandFormPage /> },
      { path: "inventory/brands/:id/edit", element: <BrandFormPage /> },
      { path: "inventory/manufacturers", element: <ManufacturersPage /> },
      { path: "inventory/manufacturers/new", element: <ManufacturerFormPage /> },
      { path: "inventory/manufacturers/:id/edit", element: <ManufacturerFormPage /> },
      { path: "inventory/suppliers", element: <InventorySuppliersPage /> },
      { path: "inventory/suppliers/new", element: <SupplierFormPage /> },
      { path: "inventory/suppliers/:id/edit", element: <SupplierFormPage /> },
      { path: "inventory/warehouses", element: <WarehousesPage /> },
      { path: "inventory/warehouses/new", element: <WarehouseFormPage /> },
      { path: "inventory/warehouses/:id/edit", element: <WarehouseFormPage /> },
      { path: "inventory/storage-locations", element: <StorageLocationsPage /> },
      { path: "inventory/storage-locations/new", element: <StorageLocationFormPage /> },
      { path: "inventory/storage-locations/:id/edit", element: <StorageLocationFormPage /> },
      { path: "inventory/movements", element: <InventoryMovementsPage /> },
      { path: "inventory/movements/new", element: <InventoryMovementFormPage /> },
      { path: "inventory/products", element: <ProductsPage /> },
      { path: "inventory/products/new", element: <ProductFormPage /> },
      { path: "inventory/products/:id", element: <ProductDetailPage /> },
      { path: "inventory/products/:id/edit", element: <ProductFormPage /> },
      { path: "sales", element: <SalesPage /> },
      { path: "sales/new", element: <PosPage /> },
      { path: "sales/closeout", element: <CloseoutPage /> },
      { path: "sales/quotes", element: <QuotesPage /> },
      { path: "sales/quotes/new", element: <QuoteFormPage /> },
      { path: "sales/quotes/:id", element: <QuoteDetailPage /> },
      { path: "sales/quotes/:id/edit", element: <QuoteFormPage /> },
      { path: "sales/returns", element: <ReturnsPage /> },
      { path: "sales/register", element: <CashRegisterPage /> },
      { path: "sales/receipts", element: <ReceiptsPage /> },
      { path: "sales/:id", element: <SaleDetailPage /> },
      { path: "purchases", element: <PurchasesPage /> },
      { path: "purchases/orders", element: <PurchaseOrdersPage /> },
      { path: "purchases/orders/new", element: <PurchaseOrderFormPage /> },
      { path: "purchases/orders/:id", element: <PurchaseOrderDetailPage /> },
      { path: "purchases/orders/:id/edit", element: <PurchaseOrderFormPage /> },
      { path: "purchases/requests", element: <PurchaseRequestsPage /> },
      { path: "purchases/receipts", element: <PurchaseReceiptsPage /> },
      { path: "purchases/receipts/:id", element: <PurchaseReceiptDetailPage /> },
      { path: "purchases/returns", element: <PurchaseReturnsPage /> },
      { path: "purchases/supplier-products", element: <SupplierProductsPage /> },
      { path: "purchases/cost-history", element: <CostHistoryPage /> },
      { path: "purchases/reorder-suggestions", element: <ReorderSuggestionsPage /> },
      { path: "customers", element: <CustomersPage /> },
      { path: "customers/:id", element: <CustomerDetailPage /> },
      { path: "suppliers", element: <SuppliersPage /> },
      { path: "vehicles", element: <CrmVehiclesPage /> },
      { path: "part-finder", element: <PartFinderPage /> },
      { path: "warehouse", element: <WarehousePage /> },
      { path: "reports", element: <ReportsPage /> },
      { path: "reports/sales", element: <ReportsSalesPage /> },
      { path: "reports/inventory", element: <ReportsInventoryPage /> },
      { path: "reports/purchasing", element: <ReportsPurchasingPage /> },
      { path: "reports/customers", element: <ReportsCustomersPage /> },
      { path: "reports/suppliers", element: <ReportsSuppliersPage /> },
      { path: "reports/warehouses", element: <ReportsWarehousesPage /> },
      { path: "reports/profitability", element: <ReportsProfitabilityPage /> },
      { path: "reports/kpis", element: <ReportsKpiPage /> },
      { path: "reports/custom", element: <ReportsCustomPage /> },
      { path: "reports/scheduled", element: <ReportsScheduledPage /> },
      { path: "reports/exports", element: <ReportsExportsPage /> },
      // ── Admin ──
      { path: "admin", element: <AdminDashboardPage /> },
      { path: "admin/users", element: <AdminUsersPage /> },
      { path: "admin/users/new", element: <AdminUserFormPage /> },
      { path: "admin/users/:id/edit", element: <AdminUserFormPage /> },
      { path: "admin/roles", element: <AdminRolesPage /> },
      { path: "admin/roles/new", element: <AdminRoleFormPage /> },
      { path: "admin/roles/:id/edit", element: <AdminRoleFormPage /> },
      { path: "admin/settings", element: <AdminSettingsPage /> },
      { path: "admin/printers", element: <AdminPrintersPage /> },
      { path: "admin/devices", element: <AdminDevicesPage /> },
      { path: "admin/backups", element: <AdminBackupsPage /> },
      { path: "admin/restore", element: <AdminRestorePage /> },
      { path: "admin/database", element: <AdminDatabasePage /> },
      { path: "admin/diagnostics", element: <AdminDiagnosticsPage /> },
      { path: "admin/audit", element: <AdminAuditPage /> },
      { path: "admin/updates", element: <AdminUpdatesPage /> },
      { path: "admin/licensing", element: <AdminLicensePage /> },
      { path: "admin/maintenance", element: <AdminMaintenancePage /> },
      { path: "admin/about", element: <AdminAboutPage /> },
      { path: "employees", element: <EmployeesPage /> },
      { path: "settings", element: <SettingsPage /> },
      { path: "help", element: <HelpPage /> },
      { path: "*", element: <Navigate to="/dashboard" replace /> },
    ],
  },
])
