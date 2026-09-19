import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@tests/helpers/render"
import { setupI18n } from "@/i18n"
import { StoreSelector } from "@/components/store-selector"
import { DashboardPage } from "@/features/dashboard/pages/dashboard-page"
import { useBusinessStore } from "@/stores"
import type { BusinessContext } from "@/types"

vi.mock("@/lib/tauri", () => ({
  getDashboardWidgets: vi.fn(),
  getPurchaseDashboard: vi.fn(),
  getCrmDashboard: vi.fn(),
  getDashboardStats: vi.fn(),
  getSales: vi.fn(),
  getStoreSales: vi.fn().mockResolvedValue([
    { storeId: 1, storeName: "Central Store", storeCode: "WH-001", salesCount: 10, totalRevenue: 1200, cashTotal: 800, cardTotal: 400, transferTotal: 0 },
  ]),
  getStoreInventory: vi.fn().mockResolvedValue([
    { storeId: 1, storeName: "Central Store", storeCode: "WH-001", productCount: 80, totalStockUnits: 950, inventoryValue: 25000 },
  ]),
}))

setupI18n("en")

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

const singleStoreContext: BusinessContext = {
  ...multiStoreContext,
  activeProfile: "single-store",
  multiStore: false,
  storeCount: 1,
  defaultStoreId: 1,
  stores: multiStoreContext.stores.slice(0, 1),
  capabilities: { multiStore: false, storeSelection: false, storeManagement: false, storeTransfers: false, crossStoreReports: false },
}

beforeEach(() => {
  useBusinessStore.setState({ context: null, loaded: false, loading: false, currentStoreId: null })
})

describe("StoreSelector", () => {
  it("renders nothing when no store selection capability", () => {
    useBusinessStore.setState({ context: singleStoreContext, loaded: true, currentStoreId: 1 })
    const { container } = render(<StoreSelector />)
    expect(container.innerHTML).toBe("")
  })

  it("renders store options when store selection is enabled", async () => {
    useBusinessStore.setState({ context: multiStoreContext, loaded: true, currentStoreId: 1 })
    render(<StoreSelector />)
    expect(screen.getByRole("combobox")).toBeInTheDocument()
  })

  it("switches the current store via selectStore", async () => {
    useBusinessStore.setState({ context: multiStoreContext, loaded: true, currentStoreId: 1 })
    render(<StoreSelector />)
    fireEvent.click(screen.getByRole("combobox"))
    const option = await screen.findByRole("option", { name: /South Branch/ })
    fireEvent.click(option)
    expect(useBusinessStore.getState().currentStoreId).toBe(3)
  })
})

describe("DashboardPage store gating", () => {
  it("hides the per-store section on a single-store profile", () => {
    useBusinessStore.setState({ context: singleStoreContext, loaded: true, currentStoreId: 1 })
    render(<DashboardPage />)
    expect(screen.queryByText("Stores Overview")).not.toBeInTheDocument()
  })

  it("shows the per-store section on a multi-store profile", async () => {
    useBusinessStore.setState({ context: multiStoreContext, loaded: true, currentStoreId: 1 })
    render(<DashboardPage />)
    expect(screen.getByText("Stores Overview")).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getAllByText(/Central Store/).length).toBeGreaterThan(0)
    })
  })
})