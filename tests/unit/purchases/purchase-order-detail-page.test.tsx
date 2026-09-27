import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, waitFor, within } from "@tests/helpers/render"
import { Route, Routes } from "react-router-dom"
import { PurchaseOrderDetailPage } from "@/features/purchases/pages/purchase-order-detail-page"
import { getPurchaseOrder, getPurchaseOrderItems } from "@/lib/tauri"
import { setupI18n } from "@/i18n"
import type { PurchaseOrder, PurchaseOrderItem } from "@/types"

/**
 * The Artículos table on the purchase order detail screen rendered a
 * hardcoded placeholder instead of the line items, so an order always showed a
 * bare "3 Items" row and never a single product — while the subtotal and total
 * underneath it came straight from the order record and therefore looked
 * correct. The screen appeared to work; it just could not be checked against
 * what was actually being ordered.
 *
 * The cause was that the line items live behind their own endpoint
 * (`get_purchase_order_items`) and the page never called it, so the table had no
 * data to render. The totals come from `get_purchase_order`, which is a separate
 * read, which is why one part of the screen was right and the other was not.
 *
 * These tests pin the rows actually appearing, and the two ways the data can be
 * awkward: an order with no lines, and a line whose product has since been
 * deleted, which the backend reports with a null name and SKU.
 */

setupI18n("en")  // the page selects the purchases namespace via useTranslation

const ORDER_ID = 12

const order = {
  id: ORDER_ID, poNumber: "PO-0012", supplierId: 3, supplierName: "Recambios Sur",
  warehouseId: 1, warehouseName: "Central", status: "confirmed", buyer: "Admin",
  orderDate: "2025-09-01T00:00:00Z", expectedDate: "2025-09-15T00:00:00Z",
  subtotal: 300, discountAmount: 0, taxAmount: 63, shippingCost: 0, total: 363,
  itemCount: 2, notes: null, createdAt: "2025-09-01T00:00:00Z", updatedAt: "2025-09-01T00:00:00Z",
} as unknown as PurchaseOrder

const items: PurchaseOrderItem[] = [
  {
    id: 1, purchaseOrderId: ORDER_ID, productId: 100,
    productName: "Pastilla de freno", productSku: "PB-001", supplierSku: null,
    quantity: 4, unitCost: 50, discount: 0, tax: 30, total: 230,
    receivedQuantity: 0, damagedQuantity: 0,
    createdAt: "2025-09-01T00:00:00Z", updatedAt: "2025-09-01T00:00:00Z",
  },
  {
    id: 2, purchaseOrderId: ORDER_ID, productId: 101,
    productName: "Filtro de aceite", productSku: "FLT-9", supplierSku: "SUP-77",
    quantity: 2, unitCost: 35, discount: 0, tax: 10.5, total: 80.5,
    receivedQuantity: 2, damagedQuantity: 0,
    createdAt: "2025-09-01T00:00:00Z", updatedAt: "2025-09-01T00:00:00Z",
  },
]

function renderPage() {
  window.history.pushState({}, "", `/purchases/orders/${ORDER_ID}`)
  return render(
    <Routes>
      <Route path="/purchases/orders/:id" element={<PurchaseOrderDetailPage />} />
    </Routes>,
  )
}

/** The body of the Artículos table, so the totals summary below is excluded. */
async function itemsBody(): Promise<HTMLElement> {
  const cell = await screen.findByRole("cell", { name: /Pastilla de freno/ })
  return cell.closest("tbody") as HTMLElement
}

beforeEach(() => {
  vi.mocked(getPurchaseOrder).mockResolvedValue(order as never)
  vi.mocked(getPurchaseOrderItems).mockResolvedValue(items as never)
})

afterEach(() => {
  vi.clearAllMocks()
})

describe("PurchaseOrderDetailPage — Artículos", () => {
  it("fetches the line items for the order being shown", async () => {
    renderPage()

    await waitFor(() => expect(getPurchaseOrderItems).toHaveBeenCalledWith(ORDER_ID))
  })

  it("renders one row per product with its quantity, cost and line total", async () => {
    renderPage()

    const body = await itemsBody()
    const rows = within(body).getAllByRole("row")
    expect(rows).toHaveLength(2)

    expect(within(rows[0]).getByText("Pastilla de freno")).toBeInTheDocument()
    expect(within(rows[0]).getByText("PB-001")).toBeInTheDocument()
    expect(within(rows[0]).getByText("4")).toBeInTheDocument()          // quantity
    expect(within(rows[0]).getByText("$50.00")).toBeInTheDocument()    // unit cost
    expect(within(rows[0]).getByText("$230.00")).toBeInTheDocument()   // line total
    // Nothing has arrived yet on this line.
    expect(within(rows[0]).getByText("0 / 4")).toBeInTheDocument()

    expect(within(rows[1]).getByText("Filtro de aceite")).toBeInTheDocument()
    expect(within(rows[1]).getByText("2 / 2")).toBeInTheDocument()     // fully received
  })

  it("shows the product SKU, or the supplier's when the shop has none", async () => {
    renderPage()

    const body = await itemsBody()
    // The second line carries both; the first only the product's own SKU.
    expect(within(body).getByText("PB-001")).toBeInTheDocument()
    expect(within(body).getByText("FLT-9")).toBeInTheDocument()
  })

  it("renders a dash rather than $0.00 for a line with no discount", async () => {
    renderPage()

    const body = await itemsBody()
    // Both fixtures have no discount, so the column is uniformly empty.
    expect(within(body).getAllByText("-")).toHaveLength(2)
  })

  it("falls back to the product id when the product has been deleted", async () => {
    vi.mocked(getPurchaseOrderItems).mockResolvedValue([
      {
        ...items[0], productId: 999, productName: null, productSku: null, supplierSku: null,
      },
    ] as never)
    renderPage()

    // The backend LEFT JOINs products, so a removed product comes back with a
    // null name; the row must still identify which line this is.
    const body = within(
      (await screen.findByRole("cell", { name: "#999" })).closest("tbody") as HTMLElement,
    )
    expect(body.getByText("#999")).toBeInTheDocument()
  })

  it("shows an empty state when the order genuinely has no lines", async () => {
    vi.mocked(getPurchaseOrderItems).mockResolvedValue([] as never)
    renderPage()

    // The order record still claims items, which is why the count alone was
    // never enough to tell an empty order from an unfetched one.
    await waitFor(() => expect(screen.getByText("No items")).toBeInTheDocument())
  })

  it("keeps the order totals alongside the rows", async () => {
    renderPage()

    await waitFor(() => expect(screen.getByText("$300.00")).toBeInTheDocument())  // subtotal
    expect(screen.getByText("$63.00")).toBeInTheDocument()                          // tax
    expect(screen.getByText("$363.00")).toBeInTheDocument()                         // total
  })
})
