import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { readFileSync } from "node:fs"
import { join } from "node:path"

import {
  createOrderFromSuggestionUrl,
  parseOrderFromSuggestion,
  ORDER_FROM_SUGGESTION_PATH,
} from "@/features/purchases/order-from-suggestion"
import { PurchaseOrderFormPage } from "@/features/purchases/pages/purchase-order-form-page"
import { useAuthStore } from "@/stores"
import { setupI18n } from "@/i18n"
import type { ReorderSuggestion } from "@/types"

/**
 * "Crear orden de compra desde sugerencias" opened an EMPTY order.
 *
 * The suggestion page pushed its payload through router `location.state` and
 * the order form never read it, so `items` stayed `[]`, the page rendered
 * "Sin artículos" and Save was disabled. These tests pin both halves of the
 * contract so a one-sided change cannot reintroduce it.
 */

const SUGGESTION: ReorderSuggestion = {
  productId: 42,
  productName: "Pastilla de Freno",
  productSku: "FR-0042",
  currentStock: 2,
  minStockLevel: 5,
  reorderPoint: 8,
  maxStockLevel: 40,
  salePrice: 120,
  costPrice: 65.5,
  pendingPoQuantity: 0,
  reservedQuantity: 0,
  suggestedOrder: 30,
  preferredSupplierId: 7,
  preferredSupplierName: "BrakeMaster Inc.",
}

setupI18n("en")

// `createOrderFromSuggestionUrl` returns a root-relative path.
const BASE = "http://localhost"

const createPurchaseOrder = vi.fn().mockResolvedValue(undefined)
const updatePurchaseOrder = vi.fn().mockResolvedValue(undefined)
const searchProductsForPos = vi.fn().mockResolvedValue([])

vi.mock("@/lib/tauri", () => ({
  getSuppliers: vi.fn().mockResolvedValue([
    { id: 7, companyName: "BrakeMaster Inc.", isActive: true },
  ]),
  getWarehouses: vi.fn().mockResolvedValue([{ id: 1, name: "Principal", isActive: true }]),
  getPurchaseOrder: vi.fn().mockResolvedValue({
    id: 5, supplierId: 3, warehouseId: 1, buyer: "Ana", paymentTerms: "30d",
    shippingMethod: "Courier", referenceNumber: "REF-5", notes: "",
    expectedDeliveryDate: "2026-10-01",
  }),
  createPurchaseOrder: (...args: unknown[]) => createPurchaseOrder(...args),
  updatePurchaseOrder: (...args: unknown[]) => updatePurchaseOrder(...args),
  searchProductsForPos: (...args: unknown[]) => searchProductsForPos(...(args as [string])),
}))

function renderForm(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path={ORDER_FROM_SUGGESTION_PATH} element={<PurchaseOrderFormPage />} />
        <Route path="/purchases/orders" element={<div>orders list</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  createPurchaseOrder.mockResolvedValue(undefined)
  // The real store is used; mocking the whole module would also have to
  // re-provide useNotificationStore, which the page pulls in for toasts.
  useAuthStore.setState({ user: { id: 11 } as never, isAuthenticated: true })
})

describe("suggestion handoff contract", () => {
  it("round-trips a suggestion through the URL", () => {
    const draft = parseOrderFromSuggestion(
      new URL(createOrderFromSuggestionUrl(SUGGESTION), BASE).search,
    )
    expect(draft).toEqual({
      productId: 42,
      name: "Pastilla de Freno",
      sku: "FR-0042",
      quantity: 30,
      unitCost: 65.5,
      supplierId: 7,
    })
  })

  it("omits a supplier when the suggestion has none", () => {
    const url = createOrderFromSuggestionUrl({ ...SUGGESTION, preferredSupplierId: undefined })
    expect(parseOrderFromSuggestion(new URL(url, BASE).search)?.supplierId).toBeUndefined()
  })

  it("omits a unit cost when the product has none", () => {
    const url = createOrderFromSuggestionUrl({ ...SUGGESTION, costPrice: 0 })
    expect(parseOrderFromSuggestion(new URL(url, BASE).search)?.unitCost).toBe(0)
  })

  it("ignores a URL with no product", () => {
    expect(parseOrderFromSuggestion("")).toBeNull()
    expect(parseOrderFromSuggestion("?qty=5")).toBeNull()
    expect(parseOrderFromSuggestion("?productId=0")).toBeNull()
    expect(parseOrderFromSuggestion("?productId=abc")).toBeNull()
  })

  it("refuses a zero or negative quantity from a hand-edited URL", () => {
    expect(parseOrderFromSuggestion("?productId=1&qty=0")?.quantity).toBe(1)
    expect(parseOrderFromSuggestion("?productId=1&qty=-5")?.quantity).toBe(1)
  })

  it("the producer no longer relies on router state", () => {
    // `location.state` is lost on refresh and cannot be linked to, and it was
    // the half of the pair that was never consumed.
    const source = readFileSync(
      join(process.cwd(), "src/features/purchases/pages/reorder-suggestions-page.tsx"),
      "utf8",
    )
    expect(source).not.toMatch(/navigate\([^)]*\{\s*state:/s)
    expect(source).toContain("createOrderFromSuggestionUrl")
  })
})

describe("PurchaseOrderFormPage opened from a suggestion", () => {
  it("shows the suggested product instead of an empty order", async () => {
    renderForm(createOrderFromSuggestionUrl(SUGGESTION))

    // The bug rendered this instead of the line item.
    await waitFor(() => expect(screen.queryByText("No items")).not.toBeInTheDocument())
    expect(await screen.findByText("Pastilla de Freno")).toBeInTheDocument()
    expect(screen.getByText("FR-0042")).toBeInTheDocument()
  })

  it("prefills the suggested quantity and cost", async () => {
    renderForm(createOrderFromSuggestionUrl(SUGGESTION))
    await screen.findByText("Pastilla de Freno")

    const quantity = screen.getByDisplayValue("30")
    const cost = screen.getByDisplayValue("65.5")
    expect(quantity).toBeInTheDocument()
    expect(cost).toBeInTheDocument()
  })

  it("enables Save, which the empty order left disabled", async () => {
    renderForm(createOrderFromSuggestionUrl(SUGGESTION))
    await screen.findByText("Pastilla de Freno")

    const save = screen.getByRole("button", { name: /guardar|save/i })
    await waitFor(() => expect(save).toBeEnabled())
  })

  it("saves the suggested product under the logged-in user", async () => {
    renderForm(createOrderFromSuggestionUrl(SUGGESTION))
    await screen.findByText("Pastilla de Freno")

    await userEvent.click(screen.getByRole("button", { name: /guardar|save/i }))

    await waitFor(() => expect(createPurchaseOrder).toHaveBeenCalled())
    const [userId, input] = createPurchaseOrder.mock.calls[0] as [number, { items: unknown[] }]
    // Was hardcoded to 1, so every order was attributed to user 1.
    expect(userId).toBe(11)
    expect(input.items).toEqual([
      expect.objectContaining({ productId: 42, quantity: 30, unitCost: 65.5 }),
    ])
  })

  it("still opens an empty order when there is no suggestion", async () => {
    renderForm(ORDER_FROM_SUGGESTION_PATH)
    expect(await screen.findByText("No items")).toBeInTheDocument()
    const save = screen.getByRole("button", { name: /guardar|save/i })
    expect(save).toBeDisabled()
  })

  it("ignores the suggestion params while editing an existing order", async () => {
    render(
      <MemoryRouter initialEntries={["/purchases/orders/5/edit?productId=42&qty=30"]}>
        <Routes>
          <Route path="/purchases/orders/:id/edit" element={<PurchaseOrderFormPage />} />
        </Routes>
      </MemoryRouter>,
    )
    // The edit path loads the stored order, so the draft must not pre-empt it
    // with the suggestion's product.
    expect(await screen.findByDisplayValue("Ana")).toBeInTheDocument()
    expect(screen.queryByText("Pastilla de Freno")).not.toBeInTheDocument()
  })
})
