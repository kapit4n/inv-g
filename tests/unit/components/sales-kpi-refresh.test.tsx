import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, fireEvent, waitFor } from "@tests/helpers/render"
import { MemoryRouter, Routes, Route, useNavigate } from "react-router-dom"
import { QueryClient } from "@tanstack/react-query"
import { setupI18n } from "@/i18n"
import { SalesPage } from "@/features/sales/pages/sales-page"
import { PosPage } from "@/features/sales/pages/pos-page"
import { PrintHost } from "@/components/print/print-host"
import { NotificationCenter } from "@/components/notification-center"
import { usePrintStore, useNotificationStore } from "@/stores"
import {
  getSales,
  getSalesSummary,
  searchSales,
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
import type { Sale, ProductForPos, CheckoutResult, SalesSummary } from "@/types"

// Reproduce the production query client (5-minute staleness) so this regression
// actually catches the bug where the sales list refreshes after checkout but the
// summary cache stays "fresh" and never refetches when the user returns.
const STALE_MS = 1000 * 60 * 5

const product: ProductForPos = {
  id: 1,
  name: "Brake Pads",
  sku: "BRK-100",
  salePrice: 100,
  wholesalePrice: 70,
  stockQuantity: 10,
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
  createdAt: "2026-09-24 04:00:00",
  updatedAt: "2026-09-24 04:00:00",
  customerName: undefined,
  itemCount: 1,
}

const checkoutResult: CheckoutResult = {
  sale: newSale,
  items: [
    { id: 1, saleId: 1, productId: 1, quantity: 1, unitPrice: 100, discount: 0, total: 100, createdAt: "", updatedAt: "", productName: "Brake Pads", productSku: "BRK-100" },
  ],
  payments: [
    { id: 1, saleId: 1, method: "cash", amount: 100, reference: undefined, changeAmount: 0, createdAt: "2026-09-24 04:00:00" },
  ],
  receiptNumber: "RCP-00001",
}

const sum = (partial: Partial<SalesSummary>): SalesSummary => ({
  totalSalesToday: 0,
  revenueToday: 0,
  totalSalesWeek: 0,
  revenueWeek: 0,
  totalSalesMonth: 0,
  revenueMonth: 0,
  averageOrderValue: 0,
  topProducts: [],
  ...partial,
})

vi.mock("@/lib/tauri", () => ({
  getSales: vi.fn(),
  getSalesSummary: vi.fn(),
  searchSales: vi.fn(),
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
      <button type="button" onClick={() => navigate("/sales/new")}>go-pos</button>
      <button type="button" onClick={() => navigate("/sales")}>goto-sales</button>
      <Routes>
        <Route path="/sales" element={<SalesPage />} />
        <Route path="/sales/new" element={<PosPage />} />
      </Routes>
      <PrintHost />
      <NotificationCenter />
    </>
  )
}

describe("Sales dashboard KPI refresh after creating a sale", () => {
  beforeEach(() => {
    usePrintStore.setState({ request: null })
    useNotificationStore.setState({ notifications: [], unreadCount: 0 })
    vi.mocked(getSales).mockReset()
    vi.mocked(getSalesSummary).mockReset()
    vi.mocked(searchSales).mockReset()
    vi.mocked(globalProductSearch).mockReset()
    vi.mocked(processCheckout).mockReset()
    vi.mocked(getSaleItems).mockReset()
    vi.mocked(getPrinters).mockReset()
    vi.mocked(getCustomers).mockReset()
    vi.mocked(getHeldSales).mockReset()
    vi.mocked(getHeldSaleItems).mockReset()
    vi.mocked(holdSale).mockReset()
    vi.mocked(resumeHeldSale).mockReset()
    vi.mocked(deleteHeldSale).mockReset()

    vi.mocked(searchSales).mockResolvedValue([])
    vi.mocked(globalProductSearch).mockResolvedValue([product])
    vi.mocked(processCheckout).mockResolvedValue(checkoutResult)
    vi.mocked(getSaleItems).mockResolvedValue(checkoutResult.items)
    vi.mocked(getPrinters).mockResolvedValue([{ id: 1, name: "Thermal A", printerType: "receipt", interfaceType: "usb", paperSize: "80mm", margins: "{}", copies: 1, orientation: "portrait", isDefault: true, isActive: true, config: "{}", createdAt: "", updatedAt: "" }])
    vi.mocked(getCustomers).mockResolvedValue([])
    vi.mocked(getHeldSales).mockResolvedValue([])
    vi.mocked(getHeldSaleItems).mockResolvedValue([])
    vi.mocked(holdSale).mockResolvedValue({} as never)
    vi.mocked(resumeHeldSale).mockResolvedValue({} as never)
    vi.mocked(deleteHeldSale).mockResolvedValue(undefined)
  })

  it("updates the four KPI cards from persisted sales when returning to Ventas", async () => {
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => {})

    // Sales list: empty on first load, then contains the newly created sale.
    let listCalls = 0
    vi.mocked(getSales).mockImplementation(async () => {
      listCalls += 1
      return listCalls === 1 ? [] : [newSale]
    })

    // Summary: zero before the sale, $100 / 1 txn / $100 avg / $100 month after.
    let summaryCalls = 0
    vi.mocked(getSalesSummary).mockImplementation(async () => {
      summaryCalls += 1
      return summaryCalls === 1
        ? sum({})
        : sum({ totalSalesToday: 1, revenueToday: 100, totalSalesMonth: 1, revenueMonth: 100, averageOrderValue: 100 })
    })

    render(
      <MemoryRouter initialEntries={["/sales"]}>
        <Workflow />
      </MemoryRouter>,
      { withRouter: false, queryClient: createWorkflowClient() },
    )

    // Initial KPI values on an empty store.
    expect(await screen.findByText("Today's Revenue")).toBeDefined()
    expect(screen.getAllByText("$0.00").length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText("0").length).toBeGreaterThanOrEqual(1)

    // Go to POS and complete a $100 paid sale.
    fireEvent.click(screen.getByRole("button", { name: "go-pos" }))
    const card = await screen.findByTestId("pos-product-1", {}, { timeout: 3000 })
    fireEvent.click(card)
    await waitFor(() => expect(screen.queryByText("Cart (1)")).toBeTruthy(), { timeout: 3000 })
    fireEvent.change(screen.getByRole("spinbutton", { name: "Payment 1" }), { target: { value: "100" } })
    fireEvent.click(screen.getByRole("button", { name: "Complete Sale - $100.00" }))

    await screen.findByTestId("checkout-success", {}, { timeout: 3000 })

    // Close the receipt print dialog so the app behind it is no longer inert,
    // then return to the Sales dashboard.
    fireEvent.click(screen.getByRole("button", { name: "Close" }))
    fireEvent.click(screen.getByRole("button", { name: "goto-sales", hidden: true }))

    // The sales table shows the new invoice…
    await screen.findByText("INV-00001", {}, { timeout: 3000 })

    // …and the four KPI cards reflect the persisted sale (revenue + average +
    // month + table total all render $100.00).
    await waitFor(() => {
      expect(getSalesSummary).toHaveBeenCalledTimes(2)
    }, { timeout: 3000 })
    expect(screen.getAllByText("$100.00").length).toBeGreaterThanOrEqual(3)
    expect(screen.getAllByText("1").length).toBeGreaterThanOrEqual(1)
    printSpy.mockRestore()
  })

  it("shows the KPI cards from real summary data (render regression)", async () => {
    vi.mocked(getSales).mockResolvedValue([newSale])
    vi.mocked(getSalesSummary).mockResolvedValue(
      sum({ totalSalesToday: 2, revenueToday: 196, averageOrderValue: 98, totalSalesMonth: 2, revenueMonth: 196 }),
    )

    render(
      <MemoryRouter initialEntries={["/sales"]}>
        <Workflow />
      </MemoryRouter>,
      { withRouter: false, queryClient: createWorkflowClient() },
    )

    await screen.findByText("INV-00001")
    expect(screen.getAllByText("$196.00").length).toBeGreaterThanOrEqual(2)
    expect(screen.getAllByText("2").length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText("$98.00").length).toBeGreaterThanOrEqual(1)
  })
})