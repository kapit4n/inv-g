import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, fireEvent, waitFor } from "@tests/helpers/render"
import { within } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { setupI18n } from "@/i18n"
import { PosPage } from "@/features/sales/pages/pos-page"
import { PrintHost } from "@/components/print/print-host"
import { NotificationCenter } from "@/components/notification-center"
import { usePrintStore, useNotificationStore } from "@/stores"
import { globalProductSearch, processCheckout, getSaleItems, getPrinters, getCustomers } from "@/lib/tauri"
import type { ProductForPos, CheckoutResult } from "@/types"

const products: ProductForPos[] = [
  { id: 1, name: "Brake Pads", sku: "BRK-100", barcode: "750100", salePrice: 100, wholesalePrice: 70, stockQuantity: 10, unit: "set", taxRate: 16, isActive: true, brandName: "Bosch" },
  { id: 2, name: "Oil Filter", sku: "OIL-200", barcode: "750200", salePrice: 50, wholesalePrice: 35, stockQuantity: 8, unit: "unit", taxRate: 16, isActive: true, brandName: "Mann" },
  { id: 3, name: "Spark Plug", sku: "SPK-300", barcode: "750300", salePrice: 20, wholesalePrice: 12, stockQuantity: 0, unit: "unit", taxRate: 16, isActive: true },
  { id: 4, name: "Discontinued Part", sku: "DISC-400", barcode: "750400", salePrice: 5, wholesalePrice: 2, stockQuantity: 100, unit: "unit", taxRate: 0, isActive: false },
]

const checkoutResult: CheckoutResult = {
  sale: {
    id: 5, saleNumber: "SALE-0005", receiptNumber: "RCP-00005",
    subtotal: 100, taxRate: 0.16, taxAmount: 16, discountAmount: 0, total: 116,
    paymentMethod: "cash", paymentStatus: "paid",
    createdAt: "2026-08-13T10:00:00Z", updatedAt: "2026-08-13T10:00:00Z",
  },
  items: [
    { id: 1, saleId: 5, productId: 1, quantity: 1, unitPrice: 100, discount: 0, total: 100, createdAt: "", updatedAt: "", productName: "Brake Pads", productSku: "BRK-100" },
  ],
  payments: [
    { id: 1, saleId: 5, method: "cash", amount: 116, reference: undefined, changeAmount: 0, createdAt: "2026-08-13T10:00:00Z" },
  ],
  receiptNumber: "RCP-00005",
}

vi.mock("@/lib/tauri", () => ({
  globalProductSearch: vi.fn(),
  processCheckout: vi.fn(),
  getSaleItems: vi.fn(),
  getPrinters: vi.fn(),
  getCustomers: vi.fn(),
}))

setupI18n("en")

function renderPos() {
  return render(
    <MemoryRouter>
      <PosPage />
      <PrintHost />
      <NotificationCenter />
    </MemoryRouter>,
    { withRouter: false },
  )
}

async function addProduct(name = "Brake Pads") {
  fireEvent.click(await screen.findByTestId(`pos-product-${name === "Brake Pads" ? 1 : name === "Oil Filter" ? 2 : 3}`))
  await waitFor(() => expect(screen.queryByText("Cart (1)")).toBeTruthy(), { timeout: 3000 })
}

describe("PosPage", () => {
  beforeEach(() => {
    usePrintStore.setState({ request: null })
    useNotificationStore.setState({ notifications: [], unreadCount: 0 })
    vi.mocked(globalProductSearch).mockReset()
    vi.mocked(processCheckout).mockReset()
    vi.mocked(getSaleItems).mockReset()
    vi.mocked(getPrinters).mockReset()
    vi.mocked(getCustomers).mockReset()

    vi.mocked(globalProductSearch).mockImplementation(async (q: string) =>
      products.filter((p) => p.isActive && (!q || p.name.toLowerCase().includes(q.toLowerCase()) || p.sku.toLowerCase().includes(q.toLowerCase())))
    )
    vi.mocked(processCheckout).mockResolvedValue(checkoutResult)
    vi.mocked(getSaleItems).mockResolvedValue(checkoutResult.items)
    vi.mocked(getPrinters).mockResolvedValue([{ id: 1, name: "Thermal A", printerType: "receipt", interfaceType: "usb", paperSize: "80mm", margins: "{}", copies: 1, orientation: "portrait", isDefault: true, isActive: true, config: "{}", createdAt: "", updatedAt: "" }])
    vi.mocked(getCustomers).mockResolvedValue([])
  })

  it("shows active products and hides inactive ones", async () => {
    renderPos()
    expect(await screen.findByText("Brake Pads")).toBeDefined()
    expect(screen.getByText("Oil Filter")).toBeDefined()
    expect(screen.queryByText("Discontinued Part")).toBeNull()
  })

  it("filters products as the user types (debounced)", async () => {
    renderPos()
    await screen.findByText("Brake Pads")
    fireEvent.change(screen.getByRole("textbox", { name: "Search products..." }), { target: { value: "oil" } })
    await waitFor(() => {
      expect(screen.queryByText("Brake Pads")).toBeNull()
      expect(screen.getByText("Oil Filter")).toBeTruthy()
    }, { timeout: 2000 })
  })

  it("adds a product to the cart on click and updates totals", async () => {
    renderPos()
    await addProduct()
    expect(screen.getByText("Cart (1)")).toBeDefined()
    expect(screen.getAllByText("$100.00").length).toBeGreaterThan(0)
    expect(screen.getByText("$116.00")).toBeDefined()
  })

  it("blocks adding an out-of-stock product and warns", async () => {
    renderPos()
    await screen.findByTestId("pos-product-3")
    fireEvent.click(screen.getByTestId("pos-product-3"))
    expect(screen.queryByText("Cart (1)")).toBeNull()
  })

  it("caps quantity at available stock", async () => {
    vi.mocked(globalProductSearch).mockImplementation(async () => [
      { ...products[0], stockQuantity: 2 },
    ])
    renderPos()
    const card = await screen.findByTestId("pos-product-1")
    fireEvent.click(card)
    fireEvent.click(card)
    fireEvent.click(card)
    await waitFor(() => expect((screen.getByRole("spinbutton", { name: "Quantity Brake Pads" }) as HTMLInputElement).value).toBe("2"), { timeout: 3000 })
    expect(screen.getByText("Only 2 left")).toBeDefined()
  })

  it("navigates products with arrow keys and adds with Enter", async () => {
    renderPos()
    await screen.findByText("Brake Pads")
    const searchInput = screen.getByRole("textbox", { name: "Search products..." })
    fireEvent.keyDown(searchInput, { key: "ArrowDown" })
    fireEvent.keyDown(searchInput, { key: "Enter" })
    await waitFor(() => expect(screen.queryByText("Cart (1)")).toBeTruthy(), { timeout: 3000 })
  })

  it("clears the search with Escape", async () => {
    renderPos()
    const searchInput = await screen.findByRole("textbox", { name: "Search products..." })
    fireEvent.change(searchInput, { target: { value: "oil" } })
    await waitFor(() => {
      expect(screen.queryByText("Brake Pads")).toBeNull()
      expect(screen.getByText("Oil Filter")).toBeTruthy()
    }, { timeout: 3000 })
    fireEvent.keyDown(window, { key: "Escape" })
    await waitFor(() => {
      expect((searchInput as HTMLInputElement).value).toBe("")
      expect(screen.getByText("Brake Pads")).toBeTruthy()
    }, { timeout: 3000 })
  })

  it("applies a percentage discount to the total", async () => {
    renderPos()
    await addProduct()
    fireEvent.change(screen.getByRole("spinbutton", { name: "Discount" }), { target: { value: "10" } })
    expect(screen.getByText("-$10.00")).toBeDefined()
    expect(screen.getByText("$106.00")).toBeDefined()
  })

  it("disables checkout until payment covers the total", async () => {
    renderPos()
    await addProduct()
    const checkout = screen.getByRole("button", { name: "Complete Sale - $116.00" })
    expect((checkout as HTMLButtonElement).disabled).toBe(true)
    fireEvent.click(checkout)
    expect(processCheckout).not.toHaveBeenCalled()
  })

  it("completes a sale, opens the receipt print dialog and prints", async () => {
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => {})
    renderPos()
    await addProduct()

    fireEvent.change(screen.getByRole("spinbutton", { name: "Payment 1" }), { target: { value: "116" } })
    fireEvent.click(screen.getByRole("button", { name: "Complete Sale - $116.00" }))

    await waitFor(() => {
      expect(processCheckout).toHaveBeenCalledWith(
        expect.objectContaining({
          items: [{ productId: 1, quantity: 1, unitPrice: 100, discount: 0, total: 100 }],
          payments: [{ method: "cash", amount: 116, reference: undefined, changeAmount: 0 }],
        })
      )
    }, { timeout: 3000 })

    expect(await screen.findByText("Print — Receipt", {}, { timeout: 3000 })).toBeDefined()
    const dialog = screen.getByRole("dialog")
    fireEvent.click(within(dialog).getByRole("button", { name: "Print" }))
    await waitFor(() => expect(printSpy).toHaveBeenCalled(), { timeout: 3000 })
    printSpy.mockRestore()
  })
})
