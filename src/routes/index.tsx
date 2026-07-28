import { createBrowserRouter, Navigate } from "react-router-dom"
import { AppShell } from "@/layouts/app-shell"
import { DashboardPage } from "@/features/dashboard"
import { InventoryPage } from "@/features/inventory"
import { SalesPage } from "@/features/sales"
import { PurchasesPage } from "@/features/purchases"
import { CustomersPage } from "@/features/customers"
import { SuppliersPage } from "@/features/suppliers"
import { VehiclesPage } from "@/features/vehicles"
import { WarehousePage } from "@/features/warehouse"
import { ReportsPage } from "@/features/reports"
import { EmployeesPage } from "@/features/employees"
import { SettingsPage } from "@/features/settings"
import { HelpPage } from "@/features/help"

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", element: <DashboardPage /> },
      { path: "inventory", element: <InventoryPage /> },
      { path: "sales", element: <SalesPage /> },
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
