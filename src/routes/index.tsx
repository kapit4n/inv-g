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
import { PurchasesPage } from "@/features/purchases"
import { CustomersPage } from "@/features/customers"
import { SuppliersPage } from "@/features/suppliers"
import { VehiclesPage } from "@/features/vehicles"
import { WarehousePage } from "@/features/warehouse"
import { ReportsPage } from "@/features/reports"
import { EmployeesPage } from "@/features/employees"
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
      { path: "customers", element: <CustomersPage /> },
      { path: "suppliers", element: <SuppliersPage /> },
      { path: "vehicles", element: <VehiclesPage /> },
      { path: "warehouse", element: <WarehousePage /> },
      { path: "reports", element: <ReportsPage /> },
      { path: "employees", element: <EmployeesPage /> },
      { path: "settings", element: <SettingsPage /> },
      { path: "help", element: <HelpPage /> },
      { path: "*", element: <Navigate to="/dashboard" replace /> },
    ],
  },
])
