import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, fireEvent, waitFor } from "@tests/helpers/render"
import { within } from "@testing-library/react"
import { MemoryRouter, Routes, Route } from "react-router-dom"
import { setupI18n } from "@/i18n"
import { SaleDetailPage } from "@/features/sales/pages/sale-detail-page"
import { PrintHost } from "@/components/print/print-host"
import { NotificationCenter } from "@/components/notification-center"
import { usePrintStore } from "@/stores"
import {
  getSale,
  getSaleItems,
  getSalePayments,
  getReceiptsForSale,
  markReceiptPrinted,
  refundSale,
  getPrinters,
} from "@/lib/tauri"
import type { Sale, SaleItem, SalePayment, Receipt } from "@/types"

const sale: Sale = {
  id: 1,
  saleNumber: "SALE-0001",
  receiptNumber: "RCP-00001",
  subtotal: 100,
  taxRate: 0.16,
  taxAmount: 16,
  discountAmount: 0,
  total: 116,
  paymentMethod: "cash",
  paymentStatus: "paid",
  customerName: "Juan Pérez",
  createdAt: "2026-08-13T10:00:00Z",
  updatedAt: "2026-08-13T10:00:00Z",
}

const items: SaleItem[] = [
  { id: 1, saleId: 1, productId: 1, quantity: 2, unitPrice: 50, discount: 0, total: 100, createdAt: "", updatedAt: "", productName: "Brake Pads", productSku: "BRK-100" },
]

const payments: SalePayment[] = [
  { id: 1, saleId: 1, method: "cash", amount: 116, changeAmount: 0, createdAt: "2026-08-13T10:00:00Z" },
]

const receipts: Receipt[] = [
  { id: 9, saleId: 1, receiptNumber: "RCP-00001", receiptType: "sale", isPrinted: false, createdAt: "2026-08-13T10:00:00Z" },
]

const printers = [
  { id: 1, name: "Thermal A", printerType: "receipt", interfaceType: "usb", paperSize: "80mm", margins: "{}", copies: 1, orientation: "portrait", isDefault: true, isActive: true, config: "{}", createdAt: "", updatedAt: "" },
]

vi.mock("@/lib/tauri", () => ({
  getSale: vi.fn(),
  getSaleItems: vi.fn(),
  getSalePayments: vi.fn(),
  getReceiptsForSale: vi.fn(),
  markReceiptPrinted: vi.fn(),
  refundSale: vi.fn(),
  getPrinters: vi.fn(),
}))

setupI18n("en")

function renderSaleDetail() {
  return render(
    <MemoryRouter initialEntries={["/sales/1"]}>
      <Routes>
        <Route path="/sales/:id" element={<SaleDetailPage />} />
      </Routes>
      <PrintHost />
      <NotificationCenter />
    </MemoryRouter>,
    { withRouter: false },
  )
}

describe("SaleDetailPage printing", () => {
  beforeEach(() => {
    usePrintStore.setState({ request: null })
    vi.mocked(getSale).mockReset()
    vi.mocked(getSaleItems).mockReset()
    vi.mocked(getSalePayments).mockReset()
    vi.mocked(getReceiptsForSale).mockReset()
    vi.mocked(markReceiptPrinted).mockReset()
    vi.mocked(refundSale).mockReset()
    vi.mocked(getPrinters).mockReset()

    vi.mocked(getSale).mockResolvedValue(sale)
    vi.mocked(getSaleItems).mockResolvedValue(items)
    vi.mocked(getSalePayments).mockResolvedValue(payments)
    vi.mocked(getReceiptsForSale).mockResolvedValue(receipts)
    vi.mocked(markReceiptPrinted).mockResolvedValue(undefined)
    vi.mocked(getPrinters).mockResolvedValue(printers)
  })

  it("renders sale details with items and totals", async () => {
    renderSaleDetail()
    expect(await screen.findByText("SALE-0001")).toBeDefined()
    expect(screen.getByText("Brake Pads")).toBeDefined()
    expect(screen.getAllByText("$116.00").length).toBeGreaterThanOrEqual(1)
  })

  it("opens the print dialog and marks the receipt printed after printing", async () => {
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => {})
    renderSaleDetail()
    await screen.findByText("SALE-0001")

    fireEvent.click(screen.getByRole("button", { name: "Print" }))

    expect(await screen.findByText("Print — Receipt")).toBeDefined()
    const dialog = screen.getByRole("dialog")
    const dialogPrint = within(dialog).getByRole("button", { name: "Print" })
    fireEvent.click(dialogPrint)

    await waitFor(() => expect(printSpy).toHaveBeenCalled())
    await waitFor(() => expect(markReceiptPrinted).toHaveBeenCalledWith(9))
    printSpy.mockRestore()
  })
})
