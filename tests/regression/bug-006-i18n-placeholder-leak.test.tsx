import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@tests/helpers/render"
import { MemoryRouter, Routes, Route } from "react-router-dom"
import { setupI18n } from "@/i18n"
import { SaleDetailPage } from "@/features/sales/pages/sale-detail-page"
import { getSale, getSaleItems, getSalePayments, getReceiptsForSale, markReceiptPrinted, refundSale, getPrinters } from "@/lib/tauri"
import type { Sale, SaleItem, SalePayment, Receipt } from "@/types"

/**
 * BUG-006: the sale detail page rendered `{{count}} artículos (1)` under the tab
 * bar instead of the item count.
 *
 * `sales.items` was `"{{count}} artículos"`, and three call sites invoked it with
 * no interpolation argument. i18next substitutes only the keys it is given, so an
 * absent `count` is not replaced - the placeholder is rendered verbatim.
 *
 * The tab names were never the problem: `sales.details`, `sales.payments` and
 * `sales.receipts` resolve to "Detalles" / "Pagos" / "Recibos". The broken string
 * sat immediately below them, which is what made it look like the tabs were
 * wrong.
 *
 * Asserted against the rendered DOM rather than by scanning the source: this
 * uses the real i18next resources, so it also catches a key that stops resolving
 * for any reason, not just a missing interpolation argument.
 */

vi.mock("@/lib/tauri", () => ({
  getSale: vi.fn(), getSaleItems: vi.fn(), getSalePayments: vi.fn(),
  getReceiptsForSale: vi.fn(), markReceiptPrinted: vi.fn(), refundSale: vi.fn(), getPrinters: vi.fn(),
}))

setupI18n("es")

const sale: Sale = {
  id: 1, saleNumber: "SALE-0001", receiptNumber: "RCP-00001", subtotal: 100, taxRate: 0.16,
  taxAmount: 16, discountAmount: 0, total: 116, paymentMethod: "cash", paymentStatus: "paid",
  customerName: "Juan Pérez", createdAt: "2026-08-13T10:00:00Z", updatedAt: "2026-08-13T10:00:00Z",
}
const payments: SalePayment[] = [
  { id: 1, saleId: 1, method: "cash", amount: 116, changeAmount: 0, createdAt: "2026-08-13T10:00:00Z" },
]
const receipts: Receipt[] = [
  { id: 9, saleId: 1, receiptNumber: "RCP-00001", receiptType: "sale", isPrinted: false, createdAt: "2026-08-13T10:00:00Z" },
]
const line = (id: number, qty: number): SaleItem => ({
  id, saleId: 1, productId: id, quantity: qty, unitPrice: 50, discount: 0,
  total: 50 * qty, createdAt: "", updatedAt: "", productName: `Pieza ${id}`, productSku: `SKU-${id}`,
})

function renderPage(count: number) {
  vi.mocked(getSale).mockResolvedValue(sale)
  vi.mocked(getSaleItems).mockResolvedValue(
    Array.from({ length: count }, (_, i) => line(i + 1, 1))
  )
  vi.mocked(getSalePayments).mockResolvedValue(payments)
  vi.mocked(getReceiptsForSale).mockResolvedValue(receipts)
  vi.mocked(getPrinters).mockResolvedValue([])
  return render(
    <MemoryRouter initialEntries={["/sales/1"]}>
      <Routes>
        <Route path="/sales/:id" element={<SaleDetailPage />} />
      </Routes>
    </MemoryRouter>,
    { withRouter: false }
  )
}

describe("BUG-006: unresolved i18n placeholders on the sale detail page", () => {
  beforeEach(() => {
    vi.mocked(getSale).mockReset()
    vi.mocked(getSaleItems).mockReset()
    vi.mocked(getSalePayments).mockReset()
    vi.mocked(getReceiptsForSale).mockReset()
    vi.mocked(markReceiptPrinted).mockReset()
    vi.mocked(refundSale).mockReset()
    vi.mocked(getPrinters).mockReset()
  })

  it("renders the tab names", async () => {
    renderPage(1)
    await screen.findByText("SALE-0001")

    expect(screen.getByRole("tab", { name: "Detalles" })).toBeDefined()
    expect(screen.getByRole("tab", { name: "Pagos" })).toBeDefined()
    expect(screen.getByRole("tab", { name: "Recibos" })).toBeDefined()
  })

  it("never renders a raw {{placeholder}}", async () => {
    renderPage(1)
    await screen.findByText("SALE-0001")

    const text = document.body.textContent ?? ""
    const leaked = text.match(/\{\{[^}]*\}\}/g)
    expect(
      leaked,
      `unresolved i18n placeholders rendered: ${leaked?.join(", ")}`,
    ).toBeNull()
  })

  it("interpolates the count and agrees in number", async () => {
    const { unmount } = renderPage(1)
    await screen.findByText("SALE-0001")
    expect(screen.getByText("1 artículo")).toBeDefined()
    unmount()

    renderPage(3)
    await screen.findByText("SALE-0001")
    expect(screen.getByText("3 artículos")).toBeDefined()
  })
})
