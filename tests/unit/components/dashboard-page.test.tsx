import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@tests/helpers/render"
import { setupI18n } from "@/i18n"
import { DashboardPage } from "@/features/dashboard/pages/dashboard-page"
import { useAuthStore, useBusinessStore } from "@/stores"
import type { BusinessContext, User } from "@/types"

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
  getStoreSales,
  getStoreInventory,
} from "@/lib/tauri"

setupI18n("en")

const user: User = {
  id: 1, username: "admin", email: "admin@test.com", fullName: "Admin User",
  roleId: 2, roleName: "Administrator", isActive: true, createdAt: "2025-01-01T00:00:00Z",
}

/** Multi-store profile, the only one that enables the cross-store dashboard section. */
const multiStoreContext: BusinessContext = {
  activeProfile: "multi-store",
  databasePath: "/tmp/inventory-gear-multi.db",
  multiStore: true,
  storeCount: 3,
  defaultStoreId: null,
  stores: [
    { id: 1, name: "Central Store", code: "WH-001", isActive: true, isDefault: true },
    { id: 2, name: "North Branch", code: "WH-002", isActive: true, isDefault: false },
    { id: 3, name: "South Branch", code: "WH-003", isActive: true, isDefault: false },
  ],
  capabilities: { multiStore: true, storeSelection: true, storeManagement: true, storeTransfers: true, crossStoreReports: true },
  devMode: true,
}

/**
 * The dashboard hides every card, tile and section the signed-in role may not
 * use, so the tests below start from a session that can reach all six modules —
 * the `administrator` role from src-tauri/src/db/seed.rs, flattened. Without it
 * the store holds an empty permission list and the page would correctly render
 * nothing but its title.
 */
const ADMINISTRATOR_PERMISSIONS = [
  "dashboard.view",
  "sales.view", "sales.create", "sales.refund", "sales.quotes", "sales.register", "sales.closeout", "sales.receipts",
  "inventory.view", "inventory.create", "inventory.update", "inventory.delete",
  "inventory.export", "inventory.import", "inventory.warehouses.manage",
  "purchases.view", "purchases.create", "purchases.update", "purchases.approve", "purchases.receive",
  "customers.view", "customers.create", "customers.update",
  "suppliers.view",
  "reports.view",
  "warehouse.view",
  "vehicles.view",
  "reminders.view",
  "warranty.view",
]

/** The seeded `cashier` role: dashboard + sales, nothing else. */
const CASHIER_PERMISSIONS = [
  "dashboard.view",
  "sales.view", "sales.create", "sales.quotes", "sales.register", "sales.receipts",
]

function signIn(permissions: string[]) {
  useAuthStore.getState().setSession(user, "token", permissions)
}

beforeEach(() => {
  // Every test starts from a single-store profile with no session and a clean
  // call count, so a test that asserts "this query never runs" is meaningful.
  useAuthStore.getState().clearSession()
  useBusinessStore.setState({ context: null, loaded: false, loading: false, currentStoreId: null })
  vi.clearAllMocks()
})

/** Every module has something to show: alerts, tiles and a sale all firing. */
function seedDashboardData() {
  vi.mocked(getStoreSales).mockResolvedValue([])
  vi.mocked(getStoreInventory).mockResolvedValue([])
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
}

describe("DashboardPage", () => {
  beforeEach(() => {
    signIn(ADMINISTRATOR_PERMISSIONS)
    seedDashboardData()
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

  it("gives every summary tile a test id of its own", async () => {
    render(<DashboardPage />)
    await waitFor(() => {
      expect(screen.getByTestId("stat-today-revenue")).toBeInTheDocument()
    })
    for (const id of ["today-revenue", "sales-count", "low-stock", "new-customers"]) {
      expect(screen.getByTestId(`stat-${id}`), id).toBeInTheDocument()
    }
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

/**
 * "A cashier should only be able to use the sales modules."
 *
 * tests/unit/components/permission-gating.test.tsx proves the router sends that
 * role to /forbidden for every other module, and the sidebar hides those modules.
 * The dashboard was the remaining hole: it advertised the whole application
 * regardless of role, so a cashier was handed five quick-action cards and four
 * summary tiles that could only ever end on the forbidden screen. The same is
 * true of a read-only role being offered a "New sale" button, which is why the
 * cards are gated on the exact write permission rather than the module's read
 * one.
 */
describe("DashboardPage for the cashier role", () => {
  beforeEach(() => {
    signIn(CASHIER_PERMISSIONS)
    seedDashboardData()
  })

  it("keeps the only action the role can perform, new sale", () => {
    render(<DashboardPage />)
    expect(screen.getByTestId("quick-action-sales-new")).toBeInTheDocument()
  })

  it("hides every quick action pointing outside the sales module", () => {
    render(<DashboardPage />)
    for (const testId of [
      "quick-action-purchases-receipts-new",
      "quick-action-purchases-orders-new",
      "quick-action-crm-customers-new",
      "quick-action-inventory-products",
      "quick-action-inventory",
    ]) {
      expect(screen.queryByTestId(testId), testId).not.toBeInTheDocument()
    }
  })

  it("keeps the sales figures and drops the inventory and customer ones", async () => {
    render(<DashboardPage />)
    await waitFor(() => {
      expect(screen.getByTestId("stat-today-revenue")).toBeInTheDocument()
    })
    expect(screen.getByTestId("stat-sales-count")).toBeInTheDocument()
    expect(screen.queryByTestId("stat-low-stock")).not.toBeInTheDocument()
    expect(screen.queryByTestId("stat-new-customers")).not.toBeInTheDocument()
  })

  it("hides the needs-attention list, whose every alert lives in another module", async () => {
    render(<DashboardPage />)
    // The sale is what the page waits on, so the section would have been on screen.
    await waitFor(() => {
      expect(screen.getByTestId("recent-sale-1")).toBeInTheDocument()
    })
    expect(screen.queryByTestId("attention-out-of-stock")).not.toBeInTheDocument()
    expect(screen.queryByTestId("attention-low-stock")).not.toBeInTheDocument()
    expect(screen.queryByTestId("attention-pending-orders")).not.toBeInTheDocument()
    expect(screen.queryByTestId("attention-awaiting-approval")).not.toBeInTheDocument()
    expect(screen.queryByTestId("attention-reminders")).not.toBeInTheDocument()
    expect(screen.queryByTestId("attention-warranties")).not.toBeInTheDocument()
    // No section header either, and no "All clear!" standing in for six alerts
    // the role is not allowed to see.
    expect(screen.queryByText("Needs Attention")).not.toBeInTheDocument()
    expect(screen.queryByText("All clear!")).not.toBeInTheDocument()
  })

  it("keeps the recent sales list", async () => {
    render(<DashboardPage />)
    await waitFor(() => {
      expect(screen.getByTestId("recent-sale-1")).toBeInTheDocument()
    })
    expect(screen.getByText("SALE-00045")).toBeInTheDocument()
  })

  it("never queries the inventory, purchasing or CRM dashboards", async () => {
    render(<DashboardPage />)
    await waitFor(() => {
      expect(getSales).toHaveBeenCalled()
    })
    expect(getDashboardStats).not.toHaveBeenCalled()
    expect(getPurchaseDashboard).not.toHaveBeenCalled()
    expect(getCrmDashboard).not.toHaveBeenCalled()
    expect(getStoreSales).not.toHaveBeenCalled()
    expect(getStoreInventory).not.toHaveBeenCalled()
  })

  it("hides the cross-store totals, which are a management view", () => {
    useBusinessStore.setState({
      context: multiStoreContext,
      loaded: true,
      currentStoreId: 1,
    })
    render(<DashboardPage />)
    expect(screen.queryByText("Stores Overview")).not.toBeInTheDocument()
    useBusinessStore.setState({ context: null, loaded: false, loading: false, currentStoreId: null })
  })
})

describe("DashboardPage for a read-only role", () => {
  beforeEach(() => {
    // The seeded `viewer` role: every module readable, nothing writable.
    signIn([
      "dashboard.view",
      "inventory.view",
      "sales.view",
      "purchases.view",
      "customers.view",
      "suppliers.view",
      "reports.view",
      "warehouse.view",
      "vehicles.view",
      "settings.view",
    ])
    seedDashboardData()
  })

  it("offers the read shortcuts but none of the write ones", () => {
    render(<DashboardPage />)
    expect(screen.getByTestId("quick-action-inventory-products")).toBeInTheDocument()
    expect(screen.getByTestId("quick-action-inventory")).toBeInTheDocument()
    expect(screen.queryByTestId("quick-action-sales-new")).not.toBeInTheDocument()
    expect(screen.queryByTestId("quick-action-purchases-receipts-new")).not.toBeInTheDocument()
    expect(screen.queryByTestId("quick-action-purchases-orders-new")).not.toBeInTheDocument()
    expect(screen.queryByTestId("quick-action-crm-customers-new")).not.toBeInTheDocument()
  })

  it("keeps every module's figures, because reading them is allowed", async () => {
    render(<DashboardPage />)
    await waitFor(() => {
      expect(screen.getByTestId("stat-today-revenue")).toBeInTheDocument()
    })
    for (const id of ["today-revenue", "sales-count", "low-stock", "new-customers"]) {
      expect(screen.getByTestId(`stat-${id}`), id).toBeInTheDocument()
    }
    await waitFor(() => {
      expect(screen.getByTestId("attention-out-of-stock")).toBeInTheDocument()
    })
  })

  it("omits the new-sale shortcut on the empty recent-sales card", async () => {
    vi.mocked(getSales).mockResolvedValue([])
    render(<DashboardPage />)
    await waitFor(() => {
      expect(screen.getByText("No sales today")).toBeInTheDocument()
    })
    expect(screen.queryByRole("button", { name: "New Sale" })).not.toBeInTheDocument()
  })
})
