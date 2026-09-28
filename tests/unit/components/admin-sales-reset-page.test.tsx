import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, fireEvent, waitFor } from "@tests/helpers/render"
import { setupI18n } from "@/i18n"
import { AdminSalesResetPage } from "@/features/admin/pages/admin-sales-reset-page"
import { getSalesResetPreview, resetSales } from "@/lib/tauri"
import { useAuthStore, useAppSettingsStore } from "@/stores"
import type { SalesResetPreview, SalesResetResult, User } from "@/types"

const preview: SalesResetPreview = {
  sales: 3,
  salesRevenue: 250.5,
  saleItems: 5,
  salePayments: 3,
  receipts: 3,
  quotes: 2,
  quoteItems: 4,
  heldSales: 1,
  heldSaleItems: 2,
  cashRegisterSessions: 1,
  dailyClosings: 1,
  inventoryMovements: 4,
}

const result: SalesResetResult = {
  deletedSales: 3,
  deletedSaleItems: 5,
  deletedSalePayments: 3,
  deletedReceipts: 3,
  deletedQuotes: 2,
  deletedQuoteItems: 4,
  deletedHeldSales: 1,
  deletedHeldSaleItems: 2,
  deletedCashRegisterSessions: 1,
  deletedDailyClosings: 1,
  deletedInventoryMovements: 4,
}

vi.mock("@/lib/tauri", () => ({
  getSalesResetPreview: vi.fn(),
  resetSales: vi.fn(),
}))

setupI18n("en")

function setFlag(enabled: boolean) {
  useAppSettingsStore.setState({
    settings: [
      {
        id: 1,
        category: "admin",
        key: "enable_sales_reset",
        value: enabled ? "true" : "false",
        settingType: "boolean",
        isSystem: false,
        sortOrder: 1,
        createdAt: "",
        updatedAt: "",
      },
    ],
    loaded: true,
  })
}

function setPermissions(permissions: string[]) {
  const user: User = {
    id: 1,
    username: "admin",
    email: "admin@test.com",
    fullName: "Admin",
    isActive: true,
    passwordChangeRequired: false,
    createdAt: "2026-01-01T00:00:00Z",
  }
  useAuthStore.setState({ isAuthenticated: true, permissions, user })
}

describe("AdminSalesResetPage", () => {
  beforeEach(() => {
    vi.mocked(getSalesResetPreview).mockReset()
    vi.mocked(resetSales).mockReset()
    vi.mocked(getSalesResetPreview).mockResolvedValue(preview)
    vi.mocked(resetSales).mockResolvedValue(result)
    setFlag(true)
    setPermissions(["*", "admin.database.manage"])
  })

  it("redirects away and never loads the preview when the flag is disabled", () => {
    setFlag(false)
    render(<AdminSalesResetPage />)
    expect(screen.queryByText("Reset all sales")).not.toBeInTheDocument()
    expect(getSalesResetPreview).not.toHaveBeenCalled()
  })

  it("shows the exact blast radius from the preview", async () => {
    render(<AdminSalesResetPage />)
    expect(await screen.findByText("250.50")).toBeDefined()
    expect(screen.getByText("250.50")).toBeDefined()
    expect(screen.getByText("Will be removed")).toBeDefined()
    expect(screen.getByText("Will NOT be touched")).toBeDefined()
  })

  it("keeps the reset button locked until RESET is typed", async () => {
    render(<AdminSalesResetPage />)
    await screen.findByText("250.50")

    const button = () => screen.getByRole("button", { name: /Reset all sales/ })
    const input = screen.getByLabelText("Confirmation text")
    expect(button()).toBeDisabled()

    fireEvent.change(input, { target: { value: "reset" } })
    expect(button()).toBeDisabled()

    fireEvent.change(input, { target: { value: "RESET" } })
    expect(button()).not.toBeDisabled()
  })

  it("executes the reset and reports what was removed", async () => {
    render(<AdminSalesResetPage />)
    await screen.findByText("250.50")

    fireEvent.change(screen.getByLabelText("Confirmation text"), { target: { value: "RESET" } })
    fireEvent.click(screen.getByRole("button", { name: /Reset all sales/ }))

    await waitFor(() => expect(resetSales).toHaveBeenCalledWith("RESET", 1))
    expect(await screen.findByText("Reset completed")).toBeDefined()
  })

  it("hides the confirm card without the database permission", async () => {
    setPermissions(["*"])
    render(<AdminSalesResetPage />)
    await screen.findByText("250.50")
    expect(screen.queryByRole("button", { name: /Reset all sales/ })).not.toBeInTheDocument()
  })
})