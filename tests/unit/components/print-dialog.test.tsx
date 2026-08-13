import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, fireEvent, waitFor } from "@tests/helpers/render"
import { setupI18n } from "@/i18n"
import { PrintDialog } from "@/components/print/print-dialog"
import { useAppSettingsStore } from "@/stores"
import { getPrinters } from "@/lib/tauri"
import type { PrintDocumentModel, AdminAppSetting } from "@/types"

const documentModel: PrintDocumentModel = {
  id: "receipt-1",
  kind: "receipt",
  paperSize: "80mm",
  title: "Receipt",
  documentNumber: "SALE-0001",
  secondaryNumber: "RCP-00001",
  date: "8/13/2026, 10:00:00 AM",
  lineItems: [
    { name: "Brake Pads", sku: "BRK-100", quantity: 2, unitPrice: 30, discount: 0, total: 60 },
  ],
  totals: [
    { label: "Subtotal", value: 60 },
    { label: "Total", value: 60, bold: true },
  ],
  metaLines: [],
  store: { name: "Auto Parts SA", currency: "USD" },
}

const printers = [
  { id: 1, name: "Thermal A", printerType: "receipt", interfaceType: "usb", paperSize: "80mm", margins: "{}", copies: 1, orientation: "portrait", isDefault: true, isActive: true, config: "{}", createdAt: "", updatedAt: "" },
  { id: 2, name: "Label Printer", printerType: "label", interfaceType: "usb", paperSize: "58mm", margins: "{}", copies: 1, orientation: "portrait", isDefault: false, isActive: true, config: "{}", createdAt: "", updatedAt: "" },
]

function setting(key: string, value: string): AdminAppSetting {
  return { id: 0, category: "general", key, value, settingType: "string", isSystem: false, sortOrder: 0, createdAt: "", updatedAt: "" }
}

vi.mock("@/lib/tauri", () => ({
  getPrinters: vi.fn(),
}))

setupI18n("en")

describe("PrintDialog", () => {
  beforeEach(() => {
    vi.mocked(getPrinters).mockReset()
    vi.mocked(getPrinters).mockResolvedValue(printers)
    useAppSettingsStore.setState({ settings: [setting("receipt_printer", "Thermal A")], loaded: true, loading: false })
  })

  it("renders a live preview of the document", async () => {
    render(<PrintDialog document={documentModel} onClose={() => {}} />)
    expect(await screen.findByText("Auto Parts SA")).toBeDefined()
    expect(screen.getAllByText("SALE-0001").length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(/Brake Pads/)).toBeDefined()
  })

  it("lists printers and preselects the configured default", async () => {
    render(<PrintDialog document={documentModel} onClose={() => {}} />)
    const select = await screen.findByTestId("print-printer-select") as HTMLSelectElement
    expect(select.options).toHaveLength(2)
    expect(select.value).toBe("1")
  })

  it("prints the document and closes after success", async () => {
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => {})
    const onPrinted = vi.fn()
    const onClose = vi.fn()

    render(<PrintDialog document={documentModel} onPrinted={onPrinted} onClose={onClose} />)
    await screen.findByTestId("print-printer-select")

    fireEvent.click(screen.getByRole("button", { name: "Print" }))

    await waitFor(() => expect(printSpy).toHaveBeenCalled())
    expect(onPrinted).toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
    printSpy.mockRestore()
  })

  it("shows a warning and config link when no printers are configured", async () => {
    vi.mocked(getPrinters).mockResolvedValue([])
    render(<PrintDialog document={documentModel} onClose={() => {}} />)
    expect(await screen.findByText("No printers configured")).toBeDefined()
    expect(screen.getByText("Configure printers")).toBeDefined()
    expect(screen.queryByTestId("print-printer-select")).toBeNull()
  })
})
