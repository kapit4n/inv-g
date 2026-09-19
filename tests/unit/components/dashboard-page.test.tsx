import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@tests/helpers/render"
import { setupI18n } from "@/i18n"
import { DashboardPage } from "@/features/dashboard/pages/dashboard-page"

vi.mock("@/lib/tauri", () => ({
  getDashboardWidgets: vi.fn(),
  getPurchaseDashboard: vi.fn(),
  getCrmDashboard: vi.fn(),
  getDashboardStats: vi.fn(),
  getSales: vi.fn(),
  getStoreSales: vi.fn().mockResolvedValue([]),
  getStoreInventory: vi.fn().mockResolvedValue([]),
}))

import {
  getDashboardWidgets,
  getPurchaseDashboard,
  getCrmDashboard,
  getDashboardStats,
  getSales,
} from "@/lib/tauri"

setupI18n("en")

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.mocked(getDashboardWidgets).mockResolvedValue({
      todayRevenue: 1240,
      monthlyRevenue: 48200,
      netProfitEstimate: 23450,
      inventoryValue: 284920,
      lowStockCount: 8,
      pendingPurchases: 3,
      topCustomers: [],
      topProducts: [],
      bestCategories: [],
      recentSalesCount: 5,
      cashRegisterSummary: { openSessions: 1, todayCash: 800, todayCard: 440, todayTransfer: 0 },
      supplierPerformanceAvg: 4.2,
      averageTicket: 248,
      salesGrowth: 12.5,
      inventoryTurnover: 3.1,
      customerGrowth: 8,
    })
    vi.mocked(getPurchaseDashboard).mockResolvedValue({
      pendingOrders: 2,
      awaitingApproval: 1,
      awaitingDelivery: 3,
      todayReceipts: 1,
      monthlyPurchased: 38000,
      monthlyOrderCount: 12,
      recentOrders: [],
      reorderSuggestions: [],
      supplierPerformances: [],
      topSuppliers: [],
    })
    vi.mocked(getCrmDashboard).mockResolvedValue({
      totalCustomers: 120,
      newCustomersMonth: 8,
      activeCustomers: 95,
      workshops: 30,
      fleetCompanies: 5,
      vehiclesRegistered: 80,
      upcomingReminders: 2,
      expiredWarranties: 1,
      customersWithCredit: 12,
      lifetimeRevenue: 500000,
      customersByType: [],
      vehicleBrands: [],
      topCustomers: [],
    })
    vi.mocked(getDashboardStats).mockResolvedValue({
      totalProducts: 450,
      activeProducts: 420,
      inactiveProducts: 30,
      totalCategories: 25,
      totalBrands: 40,
      totalSuppliers: 15,
      totalWarehouses: 3,
      lowStockProducts: 8,
      outOfStockProducts: 4,
      inventoryValue: 284920,
    })
    vi.mocked(getSales).mockResolvedValue([
      {
        id: 1,
        saleNumber: "SALE-00045",
        subtotal: 100,
        taxRate: 0.18,
        taxAmount: 18,
        discountAmount: 0,
        total: 118,
        paymentMethod: "cash",
        paymentStatus: "paid",
        createdAt: "2026-08-18T10:30:00Z",
        updatedAt: "2026-08-18T10:30:00Z",
      },
    ])
  })

  it("renders the dashboard page title", async () => {
    render(<DashboardPage />)
    expect(screen.getByText("Dashboard")).toBeInTheDocument()
  })

  it("renders quick action buttons", async () => {
    render(<DashboardPage />)
    expect(screen.getByTestId("quick-action-sales-new")).toBeInTheDocument()
    expect(screen.getByTestId("quick-action-purchases-receipts-new")).toBeInTheDocument()
    expect(screen.getByTestId("quick-action-inventory-products")).toBeInTheDocument()
    expect(screen.getByTestId("quick-action-crm-customers-new")).toBeInTheDocument()
    expect(screen.getByTestId("quick-action-purchases-orders-new")).toBeInTheDocument()
    expect(screen.getByTestId("quick-action-inventory")).toBeInTheDocument()
  })

  it("renders today's summary stats", async () => {
    render(<DashboardPage />)
    await waitFor(() => {
      expect(screen.getByText("Today's Revenue")).toBeInTheDocument()
    })
    expect(screen.getByText("Sales")).toBeInTheDocument()
    expect(screen.getByText("Low Stock")).toBeInTheDocument()
    expect(screen.getByText("New Customers")).toBeInTheDocument()
  })

  it("displays attention items for out-of-stock and low-stock", async () => {
    render(<DashboardPage />)
    await waitFor(() => {
      expect(screen.getByText("Out of Stock")).toBeInTheDocument()
    })
    expect(screen.getAllByText("Low Stock").length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText("Pending Purchase Orders")).toBeInTheDocument()
  })

  it("displays recent sales", async () => {
    render(<DashboardPage />)
    await waitFor(() => {
      expect(screen.getByText("SALE-00045")).toBeInTheDocument()
    })
  })

  it("shows all-clear state when no attention items", async () => {
    vi.mocked(getDashboardStats).mockResolvedValue({
      totalProducts: 450,
      activeProducts: 420,
      inactiveProducts: 30,
      totalCategories: 25,
      totalBrands: 40,
      totalSuppliers: 15,
      totalWarehouses: 3,
      lowStockProducts: 0,
      outOfStockProducts: 0,
      inventoryValue: 284920,
    })
    vi.mocked(getPurchaseDashboard).mockResolvedValue({
      pendingOrders: 0,
      awaitingApproval: 0,
      awaitingDelivery: 0,
      todayReceipts: 0,
      monthlyPurchased: 38000,
      monthlyOrderCount: 12,
      recentOrders: [],
      reorderSuggestions: [],
      supplierPerformances: [],
      topSuppliers: [],
    })
    vi.mocked(getCrmDashboard).mockResolvedValue({
      totalCustomers: 120,
      newCustomersMonth: 8,
      activeCustomers: 95,
      workshops: 30,
      fleetCompanies: 5,
      vehiclesRegistered: 80,
      upcomingReminders: 0,
      expiredWarranties: 0,
      customersWithCredit: 12,
      lifetimeRevenue: 500000,
      customersByType: [],
      vehicleBrands: [],
      topCustomers: [],
    })
    render(<DashboardPage />)
    await waitFor(() => {
      expect(screen.getByText("All clear!")).toBeInTheDocument()
    })
  })
})
