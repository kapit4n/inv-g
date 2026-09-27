import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, waitFor } from "@tests/helpers/render"
import { Route, Routes } from "react-router-dom"
import userEvent from "@testing-library/user-event"
import { CustomerDetailPage } from "@/features/customers/pages/customer-detail-page"
import {
  getCustomerDetail, getCustomerSales, getCreditAccount, getCreditTransactions,
  getCommunications, createCreditAccount, addCreditTransaction, createCommunication,
} from "@/lib/tauri"
import { useAuthStore } from "@/stores/auth.store"
import { setupI18n } from "@/i18n"
import type { CreditAccount, CustomerDetail } from "@/types"

vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}))

import toast from "react-hot-toast"

/**
 * The Customers-module counterpart to the CRM customer detail screen. The two
 * pages cover the same ground with a hand-written fan-out, so the same
 * behaviours are asserted here: the load shape, the conditional credit
 * transaction query, and the sign convention on a credit transaction.
 *
 * What is different from the CRM page, and is asserted separately:
 *
 * - **Communications are fetched after the main fan-out, not with it.** So the
 *   profile appears before the log is in, and a communications failure surfaces
 *   as a failed load rather than degrading the rest of the page.
 * - **A communication is appended locally**, so the log is not refetched and the
 *   entry must carry the fields the table renders.
 * - Every user-facing string goes through i18n here, unlike the CRM page.
 */

setupI18n("en")

const CUSTOMER_ID = 42

const detail = {
  customer: {
    id: CUSTOMER_ID, name: "Taller Norte", email: "norte@example.com",
    phone: "555-0100", address: "Av. Central 1", city: "Madrid",
    state: "Madrid", postalCode: "28001", country: "ES", taxId: null,
    notes: null, isActive: true, createdAt: "2025-01-01T00:00:00Z",
    totalSales: 1500, saleCount: 12,
  },
  totalSales: 1500, totalSpent: 1400, lastPurchase: "2025-09-01T00:00:00Z",
  creditLimit: 0, creditBalance: 0, recentSales: [], communications: [],
} as unknown as CustomerDetail

const account = {
  id: 7, customerId: CUSTOMER_ID, customerName: "Taller Norte",
  creditLimit: 500, currentBalance: 120, status: "active",
  createdAt: "2025-01-01T00:00:00Z", updatedAt: "2025-09-01T00:00:00Z",
} as unknown as CreditAccount

function renderPage() {
  window.history.pushState({}, "", `/customers/${CUSTOMER_ID}`)
  return render(
    <Routes>
      <Route path="/customers/:id" element={<CustomerDetailPage />} />
    </Routes>,
  )
}

async function openTab(user: ReturnType<typeof userEvent.setup>, name: RegExp) {
  await user.click(screen.getByRole("tab", { name }))
  await screen.findByRole("tabpanel")
}

function toasts() {
  return {
    success: vi.mocked(toast.success).mock.calls.map((c) => String(c[0])),
    error: vi.mocked(toast.error).mock.calls.map((c) => String(c[0])),
  }
}

beforeEach(() => {
  vi.mocked(getCustomerDetail).mockResolvedValue(detail as never)
  vi.mocked(getCustomerSales).mockResolvedValue([] as never)
  vi.mocked(getCreditAccount).mockResolvedValue(null as never)
  vi.mocked(getCreditTransactions).mockResolvedValue([] as never)
  vi.mocked(getCommunications).mockResolvedValue([] as never)
  vi.mocked(createCreditAccount).mockResolvedValue(account as never)
  vi.mocked(addCreditTransaction).mockResolvedValue({
    id: 11, amount: -200, transactionType: "charge", createdAt: "2025-09-02T00:00:00Z",
    referenceType: null, referenceId: null, notes: null,
  } as never)
  vi.mocked(createCommunication).mockResolvedValue({
    id: 21, customerId: CUSTOMER_ID, communicationType: "email",
    subject: "Presupuesto enviado", message: null,
    createdByName: "Admin", createdAt: "2025-09-02T00:00:00Z",
  } as never)
  useAuthStore.setState({
    user: { id: 1, username: "admin", email: "a@b.c", fullName: "Admin", roleId: 1, roleName: "Admin", isActive: true, createdAt: "2025-01-01T00:00:00Z" },
  } as never)
})

afterEach(() => {
  vi.clearAllMocks()
})

describe("CustomerDetailPage", () => {
  it("loads the customer, their sales and the communication log", async () => {
    renderPage()

    await waitFor(() => expect(getCustomerDetail).toHaveBeenCalledWith(CUSTOMER_ID))
    expect(getCustomerSales).toHaveBeenCalledWith(CUSTOMER_ID)
    expect(getCommunications).toHaveBeenCalledWith(CUSTOMER_ID)
    await waitFor(() => expect(screen.getAllByText("Taller Norte").length).toBeGreaterThan(0))
  })

  it("does not ask for credit transactions without a credit account", async () => {
    renderPage()

    await waitFor(() => expect(getCreditAccount).toHaveBeenCalledWith(CUSTOMER_ID))
    expect(getCreditTransactions).not.toHaveBeenCalled()
  })

  it("loads transactions once the account arrives", async () => {
    vi.mocked(getCreditAccount).mockResolvedValue(account as never)
    renderPage()

    await waitFor(() => expect(getCreditTransactions).toHaveBeenCalledWith(7))
  })

  it("renders the customer even when the credit lookup fails", async () => {
    vi.mocked(getCreditAccount).mockRejectedValue(new Error("no account") as never)
    renderPage()

    await waitFor(() => expect(getCustomerDetail).toHaveBeenCalled())
    await waitFor(() => expect(screen.getAllByText("Taller Norte").length).toBeGreaterThan(0))
  })

  it("shows a not-found message rather than a broken page when the customer is gone", async () => {
    vi.mocked(getCustomerDetail).mockResolvedValue({ customer: null } as never)
    renderPage()

    await waitFor(() => expect(screen.getByText("Customer not found")).toBeInTheDocument())
  })

  it("surfaces a load failure", async () => {
    vi.mocked(getCustomerDetail).mockRejectedValue(new Error("boom") as never)
    renderPage()

    await waitFor(() => expect(toasts().error).toContain("boom"))
  })

  it("shows an empty state for sales and for the communication log", async () => {
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => expect(getCustomerDetail).toHaveBeenCalled())

    await openTab(user, /Sales History/)
    expect(screen.getByText("No sales found")).toBeInTheDocument()

    await openTab(user, /Communication Log/)
    expect(screen.getByText("No communications")).toBeInTheDocument()
  })

  describe("credit", () => {
    it("refuses a credit limit that is not positive", async () => {
      const user = userEvent.setup()
      renderPage()
      await waitFor(() => expect(getCustomerDetail).toHaveBeenCalled())

      await openTab(user, /Credit Account/)
      const limit = screen.getByLabelText("Credit Limit")
      await user.type(limit, "0")
      await user.click(screen.getByRole("button", { name: "Create Credit Account" }))

      expect(createCreditAccount).not.toHaveBeenCalled()
      expect(toasts().error).toContain("Invalid credit limit")
    })

    it("creates the account with the limit that was typed", async () => {
      const user = userEvent.setup()
      renderPage()
      await waitFor(() => expect(getCustomerDetail).toHaveBeenCalled())

      await openTab(user, /Credit Account/)
      await user.type(screen.getByLabelText("Credit Limit"), "400")
      await user.click(screen.getByRole("button", { name: "Create Credit Account" }))

      await waitFor(() => expect(createCreditAccount).toHaveBeenCalledWith(CUSTOMER_ID, 400))
      expect(toasts().success).toContain("Credit account created")
    })

    it("negates a charge and keeps a payment positive", async () => {
      const user = userEvent.setup()
      vi.mocked(getCreditAccount).mockResolvedValue(account as never)
      renderPage()
      await waitFor(() => expect(getCreditTransactions).toHaveBeenCalledWith(7))

      await openTab(user, /Credit Account/)
      await user.selectOptions(screen.getByLabelText("Type"), "charge")
      await user.type(screen.getByLabelText("Amount"), "200")
      await user.click(screen.getByRole("button", { name: "Save" }))

      await waitFor(() => expect(addCreditTransaction).toHaveBeenCalled())
      expect(vi.mocked(addCreditTransaction).mock.calls[0][1]).toBe(-200)

      await user.clear(screen.getByLabelText("Amount"))
      await user.selectOptions(screen.getByLabelText("Type"), "payment")
      await user.type(screen.getByLabelText("Amount"), "50")
      await user.click(screen.getByRole("button", { name: "Save" }))

      await waitFor(() => expect(addCreditTransaction).toHaveBeenCalledTimes(2))
      expect(vi.mocked(addCreditTransaction).mock.calls[1][1]).toBe(50)
    })

    it("refuses a transaction of zero or less", async () => {
      const user = userEvent.setup()
      vi.mocked(getCreditAccount).mockResolvedValue(account as never)
      renderPage()
      await waitFor(() => expect(getCreditTransactions).toHaveBeenCalledWith(7))

      await openTab(user, /Credit Account/)
      await user.type(screen.getByLabelText("Amount"), "0")
      await user.click(screen.getByRole("button", { name: "Save" }))

      expect(addCreditTransaction).not.toHaveBeenCalled()
      expect(toasts().error).toContain("Invalid amount")
    })
  })

  describe("communication log", () => {
    it("refuses a communication with no subject", async () => {
      const user = userEvent.setup()
      renderPage()
      await waitFor(() => expect(getCustomerDetail).toHaveBeenCalled())

      await openTab(user, /Communication Log/)
      // The form is inline on the tab rather than behind an "add" button.
      expect(screen.getByText("Add Communication")).toBeInTheDocument()
      await user.click(screen.getByRole("button", { name: "Save" }))

      expect(createCommunication).not.toHaveBeenCalled()
      expect(toasts().error).toContain("Subject is required")
    })

    it("trims the subject and sends an empty message as undefined", async () => {
      const user = userEvent.setup()
      renderPage()
      await waitFor(() => expect(getCustomerDetail).toHaveBeenCalled())

      await openTab(user, /Communication Log/)
      await user.selectOptions(screen.getByLabelText("Type"), "email")
      await user.type(screen.getByLabelText("Subject"), "   Presupuesto enviado   ")
      await user.click(screen.getByRole("button", { name: "Save" }))

      await waitFor(() => expect(createCommunication).toHaveBeenCalled())
      const [payload, userId] = vi.mocked(createCommunication).mock.calls[0]
      expect(payload.customerId).toBe(CUSTOMER_ID)
      expect(payload.type).toBe("email")
      expect(payload.subject).toBe("Presupuesto enviado")
      expect(payload.message).toBeUndefined()
      expect(userId).toBe(1)
    })

    it("appends the new entry to the log without refetching it", async () => {
      const user = userEvent.setup()
      renderPage()
      await waitFor(() => expect(getCommunications).toHaveBeenCalled())

      await openTab(user, /Communication Log/)
      const before = vi.mocked(getCommunications).mock.calls.length
      await user.type(screen.getByLabelText("Subject"), "Presupuesto enviado")
      await user.click(screen.getByRole("button", { name: "Save" }))

      await waitFor(() => expect(screen.getByText("Presupuesto enviado")).toBeInTheDocument())
      // The entry is added to local state rather than re-read from the database.
      expect(vi.mocked(getCommunications).mock.calls.length).toBe(before)
    })
  })
})
