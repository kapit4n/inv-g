import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, fireEvent, waitFor } from "@tests/helpers/render"
import { within } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { setupI18n } from "@/i18n"
import { PosPage } from "@/features/sales/pages/pos-page"
import { PrintHost } from "@/components/print/print-host"
import { NotificationCenter } from "@/components/notification-center"
import { usePrintStore, useNotificationStore } from "@/stores"
import { globalProductSearch, processCheckout, getSaleItems, getPrinters, getCustomers, getHeldSales, getHeldSaleItems, holdSale, resumeHeldSale, deleteHeldSale } from "@/lib/tauri"
import type { ProductForPos, CheckoutResult, HeldSale, HeldSaleItem } from "@/types"

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

const heldSales: HeldSale[] = [
  { id: 1, holdNumber: "HOLD-00001", customerId: 1, customerName: "Juan Pérez", subtotal: 100, taxAmount: 16, discountAmount: 0, total: 116, discountPercent: 0, createdAt: "2026-08-16 09:30:00", itemCount: 1, label: "Waiting for parts" },
]

const heldSaleItems: HeldSaleItem[] = [
  { id: 1, heldSaleId: 1, productId: 1, name: "Brake Pads", sku: "BRK-100", quantity: 1, unitPrice: 100, taxRate: 16, total: 100, stockQuantity: 10, unit: "set", createdAt: "2026-08-16 09:30:00" },
]

vi.mock("@/lib/tauri", () => ({
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
    vi.mocked(getHeldSales).mockReset()
    vi.mocked(getHeldSaleItems).mockReset()
    vi.mocked(holdSale).mockReset()
    vi.mocked(resumeHeldSale).mockReset()
    vi.mocked(deleteHeldSale).mockReset()

    vi.mocked(globalProductSearch).mockImplementation(async (q: string) =>
      products.filter((p) => p.isActive && (!q || p.name.toLowerCase().includes(q.toLowerCase()) || p.sku.toLowerCase().includes(q.toLowerCase())))
    )
    vi.mocked(processCheckout).mockResolvedValue(checkoutResult)
    vi.mocked(getSaleItems).mockResolvedValue(checkoutResult.items)
    vi.mocked(getPrinters).mockResolvedValue([{ id: 1, name: "Thermal A", printerType: "receipt", interfaceType: "usb", paperSize: "80mm", margins: "{}", copies: 1, orientation: "portrait", isDefault: true, isActive: true, config: "{}", createdAt: "", updatedAt: "" }])
    vi.mocked(getCustomers).mockResolvedValue([])
    vi.mocked(getHeldSales).mockResolvedValue([])
    vi.mocked(getHeldSaleItems).mockResolvedValue([])
    vi.mocked(holdSale).mockResolvedValue(heldSales[0])
    vi.mocked(deleteHeldSale).mockResolvedValue(undefined)
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

  it("completes a sale and shows inline success card", async () => {
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

    expect(await screen.findByTestId("checkout-success", {}, { timeout: 3000 })).toBeDefined()
    expect(screen.getByText("Sale Complete")).toBeDefined()
    expect(screen.getAllByText("SALE-0005").length).toBeGreaterThanOrEqual(1)
    expect(screen.getByTestId("new-sale-button")).toBeDefined()
    expect(screen.getByTestId("view-sale-button")).toBeDefined()
    printSpy.mockRestore()
  })

  it("new sale button resets cart after checkout", async () => {
    renderPos()
    await addProduct()

    fireEvent.change(screen.getByRole("spinbutton", { name: "Payment 1" }), { target: { value: "116" } })
    fireEvent.click(screen.getByRole("button", { name: "Complete Sale - $116.00" }))

    await screen.findByTestId("checkout-success", {}, { timeout: 3000 })
    fireEvent.click(screen.getByTestId("new-sale-button"))

    await waitFor(() => {
      expect(screen.queryByTestId("checkout-success")).toBeNull()
      expect(screen.getByText("Cart (0)")).toBeDefined()
    }, { timeout: 3000 })
  })

  it("completes a card payment sale", async () => {
    renderPos()
    await addProduct()

    fireEvent.change(screen.getByRole("combobox", { name: "Payment" }), { target: { value: "card" } })
    fireEvent.change(screen.getByRole("spinbutton", { name: "Payment 1" }), { target: { value: "116" } })
    fireEvent.click(screen.getByRole("button", { name: "Complete Sale - $116.00" }))

    await waitFor(() => {
      expect(processCheckout).toHaveBeenCalledWith(
        expect.objectContaining({
          payments: [{ method: "card", amount: 116, reference: undefined, changeAmount: 0 }],
        })
      )
    }, { timeout: 3000 })
  })

  it("completes a transfer payment with reference", async () => {
    renderPos()
    await addProduct()

    fireEvent.change(screen.getByRole("combobox", { name: "Payment" }), { target: { value: "transfer" } })
    fireEvent.change(screen.getByRole("spinbutton", { name: "Payment 1" }), { target: { value: "116" } })
    fireEvent.change(screen.getByPlaceholderText("Reference"), { target: { value: "REF-123" } })
    fireEvent.click(screen.getByRole("button", { name: "Complete Sale - $116.00" }))

    await waitFor(() => {
      expect(processCheckout).toHaveBeenCalledWith(
        expect.objectContaining({
          payments: [{ method: "transfer", amount: 116, reference: "REF-123", changeAmount: 0 }],
        })
      )
    }, { timeout: 3000 })
  })

  it("completes a split payment (cash + card)", async () => {
    renderPos()
    await addProduct()

    fireEvent.change(screen.getByRole("spinbutton", { name: "Payment 1" }), { target: { value: "50" } })
    fireEvent.click(screen.getByTestId("add-payment"))

    const allSelects = screen.getAllByRole("combobox")
    const paymentSelects = allSelects.filter((el) => el.getAttribute("aria-label") === "Payment")
    fireEvent.change(paymentSelects[1], { target: { value: "card" } })

    const allSpinbuttons = screen.getAllByRole("spinbutton")
    const paymentAmounts = allSpinbuttons.filter((el) => el.getAttribute("aria-label")?.startsWith("Payment"))
    fireEvent.change(paymentAmounts[1], { target: { value: "66" } })

    fireEvent.click(screen.getByRole("button", { name: "Complete Sale - $116.00" }))

    await waitFor(() => {
      expect(processCheckout).toHaveBeenCalledWith(
        expect.objectContaining({
          payments: [
            { method: "cash", amount: 50, reference: undefined, changeAmount: 0 },
            { method: "card", amount: 66, reference: undefined, changeAmount: 0 },
          ],
        })
      )
    }, { timeout: 3000 })
  })

  it("quick-pay exact button fills payment amount", async () => {
    renderPos()
    await addProduct()
    fireEvent.click(screen.getByTestId("quick-pay-exact"))
    await waitFor(() => {
      expect((screen.getByRole("spinbutton", { name: "Payment 1" }) as HTMLInputElement).value).toBe("116")
    }, { timeout: 2000 })
  })

  it("quick-pay denomination button fills payment amount", async () => {
    renderPos()
    await addProduct()
    fireEvent.click(screen.getByTestId("quick-pay-100"))
    await waitFor(() => {
      expect((screen.getByRole("spinbutton", { name: "Payment 1" }) as HTMLInputElement).value).toBe("100")
    }, { timeout: 2000 })
  })

  it("F10 keyboard shortcut triggers checkout when payment covers total", async () => {
    renderPos()
    await addProduct()
    fireEvent.change(screen.getByRole("spinbutton", { name: "Payment 1" }), { target: { value: "116" } })
    fireEvent.keyDown(window, { key: "F10" })

    await waitFor(() => {
      expect(processCheckout).toHaveBeenCalled()
    }, { timeout: 3000 })
  })

  it("toggles notes section open and closed", async () => {
    renderPos()
    await addProduct()
    const toggle = screen.getByTestId("toggle-notes")
    expect(screen.queryByTestId("notes-textarea")).toBeNull()
    fireEvent.click(toggle)
    expect(screen.getByTestId("notes-textarea")).toBeDefined()
    fireEvent.click(toggle)
    await waitFor(() => {
      expect(screen.queryByTestId("notes-textarea")).toBeNull()
    }, { timeout: 2000 })
  })

  it("shows hold button disabled when cart is empty", async () => {
    renderPos()
    await screen.findByText("Brake Pads")
    const holdBtn = screen.getByTestId("hold-sale-button")
    expect((holdBtn as HTMLButtonElement).disabled).toBe(true)
  })

  it("opens hold dialog when hold button is clicked", async () => {
    renderPos()
    await addProduct()
    fireEvent.click(screen.getByTestId("hold-sale-button"))
    expect(await screen.findByTestId("hold-dialog")).toBeDefined()
    expect(screen.getByTestId("hold-label-input")).toBeDefined()
  })

  it("holds a sale and clears the cart", async () => {
    vi.mocked(getHeldSales).mockResolvedValue([heldSales[0]])
    renderPos()
    await addProduct()

    fireEvent.click(screen.getByTestId("hold-sale-button"))
    await screen.findByTestId("hold-dialog")

    fireEvent.change(screen.getByTestId("hold-label-input"), { target: { value: "Waiting for parts" } })
    fireEvent.click(screen.getByTestId("confirm-hold"))

    await waitFor(() => {
      expect(holdSale).toHaveBeenCalledWith(
        expect.objectContaining({
          items: [expect.objectContaining({ productId: 1 })],
          label: "Waiting for parts",
        })
      )
    }, { timeout: 3000 })

    await waitFor(() => {
      expect(screen.queryByText("Cart (1)")).toBeNull()
    }, { timeout: 3000 })
  })

  it("shows held sales count badge when there are held sales", async () => {
    vi.mocked(getHeldSales).mockResolvedValue(heldSales)
    renderPos()
    await screen.findByTestId("held-sales-toggle")
    expect(screen.getByText("1 held")).toBeDefined()
  })

  it("toggles held sales panel open and closed", async () => {
    vi.mocked(getHeldSales).mockResolvedValue(heldSales)
    renderPos()
    fireEvent.click(await screen.findByTestId("held-sales-toggle"))
    expect(await screen.findByTestId("held-sales-panel")).toBeDefined()

    fireEvent.click(screen.getByTestId("held-sales-toggle"))
    await waitFor(() => {
      expect(screen.queryByTestId("held-sales-panel")).toBeNull()
    }, { timeout: 3000 })
  })

  it("resumes a held sale into the cart", async () => {
    vi.mocked(getHeldSales).mockResolvedValue(heldSales)
    vi.mocked(getHeldSaleItems).mockResolvedValue(heldSaleItems)
    vi.mocked(resumeHeldSale).mockResolvedValue(heldSales[0])
    renderPos()

    fireEvent.click(await screen.findByTestId("held-sales-toggle"))
    fireEvent.click(await screen.findByTestId("resume-held-1"))

    await screen.findByText("Cart (1)", {}, { timeout: 5000 })
    expect(screen.getAllByText("Brake Pads").length).toBeGreaterThanOrEqual(2)
    expect(getHeldSaleItems).toHaveBeenCalledWith(1)
    expect(deleteHeldSale).toHaveBeenCalledWith(1)
  })

  it("cancels a held sale", async () => {
    vi.mocked(getHeldSales).mockResolvedValue(heldSales)
    renderPos()

    fireEvent.click(await screen.findByTestId("held-sales-toggle"))
    fireEvent.click(await screen.findByTestId("cancel-held-1"))

    await waitFor(() => {
      expect(deleteHeldSale).toHaveBeenCalledWith(1)
    }, { timeout: 3000 })
  })
})
