import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, waitFor, within } from "@tests/helpers/render"
import { Route, Routes } from "react-router-dom"
import userEvent from "@testing-library/user-event"
import { CrmCustomerDetailPage } from "@/features/crm/pages/crm-customer-detail-page"
import {
  getCustomerDetail, getCustomerSales, getCustomerVehicles, getCustomerNotes,
  getCustomerTimeline, getCommunications, getCreditAccount, getCreditTransactions,
  createCreditAccount, addCreditTransaction,
  getVehicleBrands, getVehicleModels, createCustomerVehicle, deleteCustomerVehicle,
  createCustomerNote,
} from "@/lib/tauri"
import { useAuthStore } from "@/stores/auth.store"
import { setupI18n } from "@/i18n"
import type { CreditAccount, CustomerDetail, CustomerNote, CustomerVehicle } from "@/types"

vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}))

import toast from "react-hot-toast"

/**
 * The customer detail screen is the one page that gathers everything the shop
 * knows about a customer: profile, vehicles, purchase history, credit, notes and
 * the activity timeline. It loads all of that itself with a hand-written fan-out
 * rather than through react-query, so most of these assertions are about that
 * fan-out and about the credit arithmetic.
 *
 * What is asserted, and why:
 *
 * - **The load is one fan-out, and credit transactions are conditional.** A
 *   customer with no credit account must not trigger a transaction query,
 *   because there is no account id to send.
 * - **A missing credit account is not an error.** The page deliberately swallows
 *   that one failure, so a customer without credit still renders.
 * - **A charge is stored as a negative amount.** The sign flip is invisible on
 *   screen — the balance just moves — which makes it the easiest thing in this
 *   file to break and the hardest to notice.
 * - **Blank input never reaches the database**: a non-positive credit limit, a
 *   non-positive transaction, and a note with no title are all refused.
 * - **Empty vehicle fields are sent as undefined**, and mileage defaults to 0
 *   rather than null, because the backend column is not nullable.
 * - **Changing the brand clears the model**, so a model from another brand can
 *   never be submitted against a brand that was just changed.
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

const vehicle = {
  id: 3, customerId: CUSTOMER_ID, licensePlate: "1234ABC", nickname: "La Furgoneta",
  brandId: 1, modelId: 2, brandName: "Renault", modelName: "Kangoo",
  year: 2019, vin: null, color: "Blanco", mileage: 84000, isDefault: true,
} as unknown as CustomerVehicle

const note = {
  id: 9, customerId: CUSTOMER_ID, noteType: "general", title: "Prefers morning calls",
  content: null, isPrivate: false, createdByName: "Admin", createdAt: "2025-09-01T00:00:00Z",
} as unknown as CustomerNote

function renderPage() {
  window.history.pushState({}, "", `/crm/customers/${CUSTOMER_ID}`)
  return render(
    <Routes>
      <Route path="/crm/customers/:id" element={<CrmCustomerDetailPage />} />
    </Routes>,
  )
}

/** Open a tab and wait for its panel, since Radix only mounts the active one. */
async function openTab(user: ReturnType<typeof userEvent.setup>, name: RegExp) {
  await user.click(screen.getByRole("tab", { name }))
  await screen.findByRole("tabpanel")
}

/** The page's own toasts, which is how every failure here is surfaced. */
function toasts() {
  return {
    success: vi.mocked(toast.success).mock.calls.map((c) => String(c[0])),
    error: vi.mocked(toast.error).mock.calls.map((c) => String(c[0])),
  }
}

beforeEach(() => {
  vi.mocked(getCustomerDetail).mockResolvedValue(detail as never)
  vi.mocked(getCustomerSales).mockResolvedValue([] as never)
  vi.mocked(getCustomerVehicles).mockResolvedValue([] as never)
  vi.mocked(getCustomerNotes).mockResolvedValue([] as never)
  vi.mocked(getCustomerTimeline).mockResolvedValue([] as never)
  vi.mocked(getCommunications).mockResolvedValue([] as never)
  vi.mocked(getCreditAccount).mockResolvedValue(null as never)
  vi.mocked(getCreditTransactions).mockResolvedValue([] as never)
  vi.mocked(getVehicleBrands).mockResolvedValue([{ id: 1, name: "Renault" }] as never)
  vi.mocked(getVehicleModels).mockResolvedValue([{ id: 2, name: "Kangoo", brandId: 1 }] as never)
  vi.mocked(createCustomerVehicle).mockResolvedValue(vehicle as never)
  vi.mocked(deleteCustomerVehicle).mockResolvedValue(undefined as never)
  vi.mocked(createCustomerNote).mockResolvedValue(note as never)
  vi.mocked(createCreditAccount).mockResolvedValue(account as never)
  vi.mocked(addCreditTransaction).mockResolvedValue({ id: 11, amount: -200, transactionType: "charge", createdAt: "2025-09-02T00:00:00Z", referenceType: null, referenceId: null, notes: null } as never)
  useAuthStore.setState({
    user: { id: 1, username: "admin", email: "a@b.c", fullName: "Admin", roleId: 1, roleName: "Admin", isActive: true, createdAt: "2025-01-01T00:00:00Z" },
  } as never)
})

afterEach(() => {
  vi.clearAllMocks()
})

describe("CrmCustomerDetailPage", () => {
  it("loads every panel of the customer in one pass", async () => {
    renderPage()

    await waitFor(() => expect(getCustomerDetail).toHaveBeenCalledWith(CUSTOMER_ID))
    // Profile, history, vehicles, notes, timeline and comms are all requested
    // together; none of them gates another.
    for (const fn of [getCustomerSales, getCustomerVehicles, getCustomerNotes, getCustomerTimeline, getCommunications]) {
      expect(fn).toHaveBeenCalledWith(CUSTOMER_ID)
    }
    await waitFor(() => expect(screen.getAllByText("Taller Norte").length).toBeGreaterThan(0))
  })

  it("does not ask for credit transactions when the customer has no credit account", async () => {
    renderPage()

    await waitFor(() => expect(getCustomerDetail).toHaveBeenCalled())
    expect(getCreditAccount).toHaveBeenCalledWith(CUSTOMER_ID)
    expect(getCreditTransactions).not.toHaveBeenCalled()
  })

  it("loads the transaction history once a credit account exists", async () => {
    vi.mocked(getCreditAccount).mockResolvedValue(account as never)
    renderPage()

    // The account arrives with the first fan-out, and its id then drives a
    // second, dependent query.
    await waitFor(() => expect(getCreditTransactions).toHaveBeenCalledWith(7))
  })

  it("still renders when the credit account lookup fails", async () => {
    // This one failure is swallowed on purpose: having no credit is normal, not
    // an error state.
    vi.mocked(getCreditAccount).mockRejectedValue(new Error("no such account") as never)
    renderPage()

    await waitFor(() => expect(getCustomerDetail).toHaveBeenCalled())
    expect(toasts().error).not.toContain("no such account")
    await waitFor(() => expect(screen.getAllByText("Taller Norte").length).toBeGreaterThan(0))
  })

  it("surfaces a failure to load the customer itself", async () => {
    vi.mocked(getCustomerDetail).mockRejectedValue(new Error("customer not found") as never)
    renderPage()

    await waitFor(() => expect(toasts().error).toContain("customer not found"))
  })

  it("shows an empty state for each panel that has nothing in it", async () => {
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => expect(getCustomerDetail).toHaveBeenCalled())

    await openTab(user, /Vehicles/)
    expect(screen.getByText(/no vehicles/i)).toBeInTheDocument()

    await openTab(user, /Purchase History/)
    expect(screen.getByText(/no sales found/i)).toBeInTheDocument()

    await openTab(user, /Notes/)
    expect(screen.getByText(/no notes/i)).toBeInTheDocument()

    await openTab(user, /Timeline/)
    expect(screen.getByText(/no activity recorded/i)).toBeInTheDocument()
  })

  describe("credit", () => {
    it("refuses a credit limit that is not a positive number", async () => {
      const user = userEvent.setup()
      renderPage()
      await waitFor(() => expect(getCustomerDetail).toHaveBeenCalled())

      await openTab(user, /Customer Credit/)
      const limit = screen.getByLabelText("Credit Limit")

      for (const bad of ["0", "-50"]) {
        await user.clear(limit)
        await user.type(limit, bad)
        await user.click(screen.getByRole("button", { name: "Create Account" }))
        expect(createCreditAccount).not.toHaveBeenCalled()
      }
      // An empty field parses to NaN and is refused the same way.
      await user.clear(limit)
      await user.click(screen.getByRole("button", { name: "Create Account" }))
      expect(createCreditAccount).not.toHaveBeenCalled()

      expect(toasts().error).toContain("Invalid credit limit")
    })

    it("creates the account with the limit that was typed", async () => {
      const user = userEvent.setup()
      renderPage()
      await waitFor(() => expect(getCustomerDetail).toHaveBeenCalled())

      await openTab(user, /Customer Credit/)
      await user.type(screen.getByLabelText("Credit Limit"), "750.50")
      await user.click(screen.getByRole("button", { name: "Create Account" }))

      await waitFor(() => expect(createCreditAccount).toHaveBeenCalledWith(CUSTOMER_ID, 750.5))
      expect(toasts().success).toContain("Credit account created")
    })

    it("stores a charge as a negative amount so the balance moves the right way", async () => {
      const user = userEvent.setup()
      vi.mocked(getCreditAccount).mockResolvedValue(account as never)
      renderPage()
      await waitFor(() => expect(getCreditTransactions).toHaveBeenCalledWith(7))

      await openTab(user, /Customer Credit/)
      await user.selectOptions(screen.getByLabelText("Type"), "charge")
      await user.type(screen.getByLabelText("Amount"), "200")
      await user.click(screen.getByRole("button", { name: "Save" }))

      await waitFor(() => expect(addCreditTransaction).toHaveBeenCalled())
      const [accountId, amount, type] = vi.mocked(addCreditTransaction).mock.calls[0]
      expect(accountId).toBe(7)
      expect(type).toBe("charge")
      // The sign is the whole point: a charge reduces what the customer owes.
      expect(amount).toBe(-200)
    })

    it("stores a payment as a positive amount", async () => {
      const user = userEvent.setup()
      vi.mocked(getCreditAccount).mockResolvedValue(account as never)
      renderPage()
      await waitFor(() => expect(getCreditTransactions).toHaveBeenCalledWith(7))

      await openTab(user, /Customer Credit/)
      await user.type(screen.getByLabelText("Amount"), "50")
      await user.click(screen.getByRole("button", { name: "Save" }))

      await waitFor(() => expect(addCreditTransaction).toHaveBeenCalled())
      expect(vi.mocked(addCreditTransaction).mock.calls[0][1]).toBe(50)
    })

    it("refuses a transaction of zero or less", async () => {
      const user = userEvent.setup()
      vi.mocked(getCreditAccount).mockResolvedValue(account as never)
      renderPage()
      await waitFor(() => expect(getCreditTransactions).toHaveBeenCalledWith(7))

      await openTab(user, /Customer Credit/)
      await user.type(screen.getByLabelText("Amount"), "0")
      await user.click(screen.getByRole("button", { name: "Save" }))

      expect(addCreditTransaction).not.toHaveBeenCalled()
      expect(toasts().error).toContain("Invalid amount")
    })

    it("shows the limit, the balance and what is left to spend", async () => {
      const user = userEvent.setup()
      vi.mocked(getCreditAccount).mockResolvedValue(account as never)
      renderPage()
      await waitFor(() => expect(getCreditTransactions).toHaveBeenCalledWith(7))

      await openTab(user, /Customer Credit/)
      expect(screen.getByText("$500.00")).toBeInTheDocument()   // limit
      expect(screen.getByText("$120.00")).toBeInTheDocument()   // current balance
      expect(screen.getByText("$380.00")).toBeInTheDocument()   // 500 - 120
    })
  })

  describe("vehicles", () => {
    it("clears the selected model when the brand changes", async () => {
      const user = userEvent.setup()
      renderPage()
      await waitFor(() => expect(getCustomerDetail).toHaveBeenCalled())

      await openTab(user, /Vehicles/)
      await user.click(screen.getByRole("button", { name: /Add Vehicle/i }))
      await waitFor(() => expect(getVehicleBrands).toHaveBeenCalled())

      await user.selectOptions(screen.getByLabelText("Brand"), "1")
      await waitFor(() => expect(getVehicleModels).toHaveBeenCalledWith(1))
      await user.selectOptions(screen.getByLabelText("Model"), "2")
      expect(screen.getByLabelText("Model")).toHaveValue("2")

      // Re-picking the brand must not leave a model from the previous brand
      // selected, or the pair could be saved inconsistent.
      await user.selectOptions(screen.getByLabelText("Brand"), "")
      await waitFor(() => expect(screen.getByLabelText("Model")).toHaveValue(""))
    })

    it("sends blank vehicle fields as undefined and defaults mileage to zero", async () => {
      const user = userEvent.setup()
      renderPage()
      await waitFor(() => expect(getCustomerDetail).toHaveBeenCalled())

      await openTab(user, /Vehicles/)
      await user.click(screen.getByRole("button", { name: /Add Vehicle/i }))
      await waitFor(() => expect(getVehicleBrands).toHaveBeenCalled())
      await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Save" }))

      await waitFor(() => expect(createCustomerVehicle).toHaveBeenCalled())
      const payload = vi.mocked(createCustomerVehicle).mock.calls[0][0] as Record<string, unknown>
      expect(payload.customerId).toBe(CUSTOMER_ID)
      for (const key of ["licensePlate", "nickname", "brandId", "modelId", "year", "vin", "color"]) {
        expect(payload[key]).toBeUndefined()
      }
      // The column is NOT NULL, so mileage is zero rather than absent.
      expect(payload.mileage).toBe(0)
      expect(payload.userId).toBe(1)
    })

    it("converts the numeric and text fields it did receive", async () => {
      const user = userEvent.setup()
      renderPage()
      await waitFor(() => expect(getCustomerDetail).toHaveBeenCalled())

      await openTab(user, /Vehicles/)
      await user.click(screen.getByRole("button", { name: /Add Vehicle/i }))
      await waitFor(() => expect(getVehicleBrands).toHaveBeenCalled())
      await user.type(screen.getByLabelText("License Plate"), "1234ABC")
      await user.type(screen.getByLabelText("Year"), "2019")
      await user.type(screen.getByLabelText("Mileage"), "84000")
      await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Save" }))

      await waitFor(() => expect(createCustomerVehicle).toHaveBeenCalled())
      const payload = vi.mocked(createCustomerVehicle).mock.calls[0][0] as Record<string, unknown>
      expect(payload.licensePlate).toBe("1234ABC")
      expect(payload.year).toBe(2019)
      expect(payload.mileage).toBe(84000)
    })

    it("reloads the vehicle list after a delete", async () => {
      const user = userEvent.setup()
      vi.mocked(getCustomerVehicles).mockResolvedValue([vehicle] as never)
      renderPage()
      await waitFor(() => expect(getCustomerVehicles).toHaveBeenCalledWith(CUSTOMER_ID))

      await openTab(user, /Vehicles/)
      const before = vi.mocked(getCustomerVehicles).mock.calls.length
      // Walk up from the plate to the card that owns the delete button,
      // rather than hard-coding the nesting of the card markup.
      let card: HTMLElement | null = screen.getByText(/1234ABC/)
      while (card && within(card).queryAllByRole("button").length === 0) {
        card = card.parentElement
      }
      expect(card).not.toBeNull()
      await user.click(within(card as HTMLElement).getByRole("button"))

      await waitFor(() => expect(deleteCustomerVehicle).toHaveBeenCalledWith(3))
      // The list is refetched rather than patched locally, so the count in the
      // tab label cannot drift from the rows.
      await waitFor(() => expect(vi.mocked(getCustomerVehicles).mock.calls.length).toBeGreaterThan(before))
    })
  })

  describe("notes", () => {
    it("refuses a note with no title", async () => {
      const user = userEvent.setup()
      renderPage()
      await waitFor(() => expect(getCustomerDetail).toHaveBeenCalled())

      await openTab(user, /Notes/)
      await user.click(screen.getByRole("button", { name: /Add Note/i }))
      await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Save" }))

      expect(createCustomerNote).not.toHaveBeenCalled()
      expect(toasts().error).toContain("Title is required")
    })

    it("trims the title and sends an empty body as undefined", async () => {
      const user = userEvent.setup()
      renderPage()
      await waitFor(() => expect(getCustomerDetail).toHaveBeenCalled())

      await openTab(user, /Notes/)
      await user.click(screen.getByRole("button", { name: /Add Note/i }))
      await user.type(screen.getByLabelText(/^Title/), "   Llama por la mañana   ")
      await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Save" }))

      await waitFor(() => expect(createCustomerNote).toHaveBeenCalled())
      const args = vi.mocked(createCustomerNote).mock.calls[0]
      expect(args[0]).toBe(CUSTOMER_ID)
      expect(args[4]).toBe("Llama por la mañana")
      expect(args[5]).toBeUndefined()
    })

    it("records the note type, privacy flag and author", async () => {
      const user = userEvent.setup()
      renderPage()
      await waitFor(() => expect(getCustomerDetail).toHaveBeenCalled())

      await openTab(user, /Notes/)
      await user.click(screen.getByRole("button", { name: /Add Note/i }))
      await user.selectOptions(screen.getByLabelText("Type"), "complaint")
      await user.type(screen.getByLabelText(/^Title/), "Rueda pinchada")
      await user.type(screen.getByLabelText("Content"), "Se quejó en la última visita")
      await user.click(screen.getByRole("checkbox"))
      await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Save" }))

      await waitFor(() => expect(createCustomerNote).toHaveBeenCalled())
      const [customerId, type, isPrivate, userId, title, content] = vi.mocked(createCustomerNote).mock.calls[0]
      expect(customerId).toBe(CUSTOMER_ID)
      expect(type).toBe("complaint")
      expect(isPrivate).toBe(true)
      expect(userId).toBe(1)
      expect(title).toBe("Rueda pinchada")
      expect(content).toBe("Se quejó en la última visita")
    })
  })
})
