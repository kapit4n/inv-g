import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, fireEvent, waitFor } from "@tests/helpers/render"
import { MemoryRouter, Routes, Route, useNavigate } from "react-router-dom"
import { QueryClient } from "@tanstack/react-query"
import { setupI18n } from "@/i18n"
import { DashboardPage } from "@/features/dashboard/pages/dashboard-page"
import { PosPage } from "@/features/sales/pages/pos-page"
import { PrintHost } from "@/components/print/print-host"
import { NotificationCenter } from "@/components/notification-center"
import { usePrintStore, useNotificationStore } from "@/stores"
import {
  getDashboardWidgets,
  getPurchaseDashboard,
  getCrmDashboard,
  getDashboardStats,
  getSales,
  getStoreSales,
  getStoreInventory,
  globalProductSearch,
  processCheckout,
  getSaleItems,
  getPrinters,
  getCustomers,
  getHeldSales,
  getHeldSaleItems,
  holdSale,
  resumeHeldSale,
  deleteHeldSale,
} from "@/lib/tauri"
import type { ProductForPos, CheckoutResult, Sale } from "@/types"

// The dashboard's "Needs attention" list is built from the `inventory-stats`
// query, and nothing used to invalidate that key. The backend does decrement
// products.stock_quantity inside the checkout transaction, so after selling the
// last unit the count in the database was right and the number on screen was
// wrong until the page was reloaded — the tile still read 0 out-of-stock.
//
// Production runs a 5-minute staleTime, so the cached value has to be treated as
// fresh; the client reproduces that here.
const STALE_MS = 1000 * 60 * 5

const product: ProductForPos = {
  id: 1,
  name: "Brake Pads",
  sku: "BRK-100",
  salePrice: 100,
  wholesalePrice: 70,
  // The last unit on hand.
  stockQuantity: 1,
  unit: "set",
  taxRate: 0,
  isActive: true,
}

const newSale: Sale = {
  id: 1,
  saleNumber: "INV-00001",
  receiptNumber: "RCP-00001",
  customerId: undefined,
  subtotal: 100,
  taxRate: 0,
  taxAmount: 0,
  discountAmount: 0,
  total: 100,
  paymentMethod: "cash",
  paymentStatus: "paid",
  notes: undefined,
  createdAt: "2026-09-26 04:00:00",
  updatedAt: "2026-09-26 04:00:00",
  customerName: undefined,
  itemCount: 1,
}

const checkoutResult: CheckoutResult = {
  sale: newSale,
  items: [
    { id: 1, saleId: 1, productId: 1, quantity: 1, unitPrice: 100, discount: 0, total: 100, createdAt: "", updatedAt: "", productName: "Brake Pads", productSku: "BRK-100" },
  ],
  payments: [
    { id: 1, saleId: 1, method: "cash", amount: 100, reference: undefined, changeAmount: 0, createdAt: "2026-09-26 04:00:00" },
  ],
  receiptNumber: "RCP-00001",
}

const emptyStats = {
  totalProducts: 12,
  totalCategories: 3,
  totalWarehouses: 1,
  inventoryValue: 5000,
  lowStockProducts: 0,
  outOfStockProducts: 0,
  totalSuppliers: 4,
  totalCustomers: 9,
}

vi.mock("@/lib/tauri", () => ({
  getDashboardWidgets: vi.fn(),
  getPurchaseDashboard: vi.fn(),
  getCrmDashboard: vi.fn(),
  getDashboardStats: vi.fn(),
  getSales: vi.fn(),
  getStoreSales: vi.fn(),
  getStoreInventory: vi.fn(),
  globalProductSearch: vi.fn(),
  processCheckout: vi.fn(),
  getSaleItems: vi.fn(),
  getPrinters: vi.fn(),
  getCustomers: vi.fn(),
  getHeldSales: vi.fn(),
  getHeldSaleItems: vi.fn(),
  holdSale: vi.fn(),
  resumeHeldSale: vi.fn(),
  deleteHeldSale: vi.fn(),
}))

setupI18n("en")

function createWorkflowClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: STALE_MS, retry: false, gcTime: STALE_MS },
      mutations: { retry: false },
    },
  })
}

function Workflow() {
  const navigate = useNavigate()
  return (
    <>
      <button type="button" onClick={() => navigate("/")}>go-dashboard</button>
      <button type="button" onClick={() => navigate("/sales/new")}>go-pos</button>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/sales/new" element={<PosPage />} />
      </Routes>
      <PrintHost />
      <NotificationCenter />
    </>
  )
}

/** Sells the single remaining unit through the POS, then returns to the dashboard. */
async function sellLastUnit() {
  fireEvent.click(screen.getByRole("button", { name: "go-pos" }))
  const card = await screen.findByTestId("pos-product-1", {}, { timeout: 3000 })
  fireEvent.click(card)
  await waitFor(() => expect(screen.queryByText("Cart (1)")).toBeTruthy(), { timeout: 3000 })
  fireEvent.change(screen.getByRole("spinbutton", { name: "Payment 1" }), { target: { value: "100" } })
  fireEvent.click(screen.getByRole("button", { name: "Complete Sale - $100.00" }))
  await screen.findByTestId("checkout-success", {}, { timeout: 3000 })

  // Dismiss the receipt dialog so the page behind it is interactive again.
  fireEvent.click(screen.getByRole("button", { name: "Close" }))
  fireEvent.click(screen.getByRole("button", { name: "go-dashboard", hidden: true }))
}

describe("out-of-stock count after selling a product out", () => {
  beforeEach(() => {
    usePrintStore.setState({ request: null })
    useNotificationStore.setState({ notifications: [], unreadCount: 0 })
    vi.spyOn(window, "print").mockImplementation(() => {})

    for (const fn of [
      getDashboardWidgets, getPurchaseDashboard, getCrmDashboard, getDashboardStats,
      getSales, getStoreSales, getStoreInventory, globalProductSearch, processCheckout,
      getSaleItems, getPrinters, getCustomers, getHeldSales, getHeldSaleItems,
      holdSale, resumeHeldSale, deleteHeldSale,
    ]) {
      vi.mocked(fn).mockReset()
    }

    vi.mocked(getDashboardWidgets).mockResolvedValue({} as never)
    vi.mocked(getPurchaseDashboard).mockResolvedValue({} as never)
    vi.mocked(getCrmDashboard).mockResolvedValue({} as never)
    vi.mocked(getSales).mockResolvedValue([])
    vi.mocked(getStoreSales).mockResolvedValue([])
    vi.mocked(getStoreInventory).mockResolvedValue([])
    vi.mocked(globalProductSearch).mockResolvedValue([product])
    vi.mocked(processCheckout).mockResolvedValue(checkoutResult)
    vi.mocked(getSaleItems).mockResolvedValue(checkoutResult.items)
    vi.mocked(getPrinters).mockResolvedValue([])
    vi.mocked(getCustomers).mockResolvedValue([])
    vi.mocked(getHeldSales).mockResolvedValue([])
    vi.mocked(getHeldSaleItems).mockResolvedValue([])
    vi.mocked(holdSale).mockResolvedValue({} as never)
    vi.mocked(resumeHeldSale).mockResolvedValue({} as never)
    vi.mocked(deleteHeldSale).mockResolvedValue(undefined)
  })

  it("moves the product into 'Needs attention / Out of stock' after the sale", async () => {
    // The backend only knows the product is out of stock once the sale is saved.
    let statsCalls = 0
    vi.mocked(getDashboardStats).mockImplementation(async () => {
      statsCalls += 1
      return statsCalls === 1 ? emptyStats : { ...emptyStats, outOfStockProducts: 1 }
    })

    render(
      <MemoryRouter initialEntries={["/"]}>
        <Workflow />
      </MemoryRouter>,
      { withRouter: false, queryClient: createWorkflowClient() },
    )

    // Before the sale there is nothing out of stock, so the tile is absent.
    await waitFor(() => expect(getDashboardStats).toHaveBeenCalled())
    expect(screen.queryByTestId("attention-out-of-stock")).toBeNull()

    await sellLastUnit()

    // The tile now exists and is labelled with the number of products that ran out.
    const tile = await screen.findByTestId("attention-out-of-stock")
    expect(tile.textContent).toContain("Out of Stock")
    expect(tile.textContent).toContain("1")
  })

  it("refetches the stock counts instead of reusing the cached ones", async () => {
    vi.mocked(getDashboardStats).mockResolvedValue(emptyStats)

    const client = createWorkflowClient()
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Workflow />
      </MemoryRouter>,
      { withRouter: false, queryClient: client },
    )
    await waitFor(() => expect(getDashboardStats).toHaveBeenCalledTimes(1))

    await sellLastUnit()

    // The invalidation has to reach the backend, not just drop the cache entry.
    await waitFor(() => expect(getDashboardStats).toHaveBeenCalledTimes(2))
  })
})
