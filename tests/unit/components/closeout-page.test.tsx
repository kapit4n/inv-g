import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, fireEvent, waitFor } from "@tests/helpers/render"
import { within } from "@testing-library/react"
import { setupI18n } from "@/i18n"
import { CloseoutPage } from "@/features/sales/pages/closeout-page"
import { PrintHost } from "@/components/print/print-host"
import { NotificationCenter } from "@/components/notification-center"
import { usePrintStore } from "@/stores"
import { getDailyCloseout, getDailyClosings, closeDailyShift, getPrinters } from "@/lib/tauri"
import type { DailyCloseout, DailyClosing } from "@/types"

const closeout: DailyCloseout = {
  totalSales: 12,
  totalRevenue: 1000,
  totalTax: 160,
  totalDiscount: 40,
  cashTotal: 600,
  cardTotal: 300,
  transferTotal: 100,
  cashCount: 7,
  cardCount: 3,
  transferCount: 2,
  refundedCount: 1,
  refundedTotal: 50,
  netRevenue: 950,
  date: "2026-08-13",
}

const closings: DailyClosing[] = []

const printers = [
  { id: 1, name: "Thermal A", printerType: "receipt", interfaceType: "usb", paperSize: "80mm", margins: "{}", copies: 1, orientation: "portrait", isDefault: true, isActive: true, config: "{}", createdAt: "", updatedAt: "" },
]

vi.mock("@/lib/tauri", () => ({
  getDailyCloseout: vi.fn(),
  getDailyClosings: vi.fn(),
  closeDailyShift: vi.fn(),
  getPrinters: vi.fn(),
}))

setupI18n("en")

function renderCloseout() {
  return render(
    <>
      <CloseoutPage />
      <PrintHost />
      <NotificationCenter />
    </>,
  )
}

describe("CloseoutPage printing", () => {
  beforeEach(() => {
    usePrintStore.setState({ request: null })
    vi.mocked(getDailyCloseout).mockReset()
    vi.mocked(getDailyClosings).mockReset()
    vi.mocked(closeDailyShift).mockReset()
    vi.mocked(getPrinters).mockReset()

    vi.mocked(getDailyCloseout).mockResolvedValue(closeout)
    vi.mocked(getDailyClosings).mockResolvedValue(closings)
    vi.mocked(closeDailyShift).mockResolvedValue(undefined)
    vi.mocked(getPrinters).mockResolvedValue(printers)
  })

  it("renders closeout statistics", async () => {
    renderCloseout()
    expect(await screen.findByText("Daily Closeout")).toBeDefined()
    expect(screen.getByText("12")).toBeDefined()
    expect(screen.getAllByText("$1,000.00").length).toBeGreaterThanOrEqual(1)
  })

  it("opens the print dialog with the closeout report", async () => {
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => {})
    renderCloseout()
    await screen.findByText("Daily Closeout")

    fireEvent.click(screen.getByRole("button", { name: "Print" }))

    expect(await screen.findByText("Print — Daily Closeout")).toBeDefined()
    const dialog = screen.getByRole("dialog")
    fireEvent.click(within(dialog).getByRole("button", { name: "Print" }))

    await waitFor(() => expect(printSpy).toHaveBeenCalled())
    printSpy.mockRestore()
  })
})
