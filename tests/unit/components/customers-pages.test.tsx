import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, waitFor, within } from "@tests/helpers/render"
import userEvent from "@testing-library/user-event"
import { CustomersPage } from "@/features/customers/pages/customers-page"
import { CrmCustomersPage } from "@/features/crm/pages/crm-customers-page"
import { getCustomers, createCustomer, updateCustomer, archiveCustomer } from "@/lib/tauri"
import type { Customer } from "@/types"
import { setupI18n } from "@/i18n"
import { useAuthStore } from "@/stores"

vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}))

import toast from "react-hot-toast"

/**
 * The customers list, as it appears in the Customers module and in the CRM
 * module. Both are hand-rolled screens with the same shape: load on mount,
 * debounce the search box, and drive create/edit/archive from a dialog.
 *
 * What is asserted per screen, and why:
 *
 * - **How many reads a page load costs.** Both screens ran a mount effect *and*
 *   a debounced search effect, so every visit issued two identical queries. That
 *   is invisible on screen and only shows up as doubled load on the busiest
 *   screen in the shop.
 * - **That summary counts match the rows returned**, since they are computed
 *   separately from the table body.
 * - **That a blank name never reaches the database.**
 * - **That a failed save keeps the dialog open**, so the typed name is not lost.
 *
 * The two screens are near-copies with different i18n namespaces, so the labels
 * differ but the assertions must not.
 */

setupI18n("en")

const customers: Customer[] = [
  {
    id: 1, name: "Taller Norte", email: "norte@example.com", phone: "555-0100",
    address: "Av. Central 1", city: "Madrid", state: "Madrid", postalCode: "28001",
    country: "ES", notes: null, isActive: true, createdAt: "2025-01-01T00:00:00Z",
    totalSales: 1500, saleCount: 12,
  },
  {
    id: 2, name: "Taller Sur", email: null, phone: null,
    address: null, city: "Sevilla", state: null, postalCode: null,
    country: "ES", notes: null, isActive: false, createdAt: "2025-02-01T00:00:00Z",
    totalSales: 0, saleCount: 0,
  },
]

const screens = [
  { name: "CustomersPage", Page: CustomersPage, add: "Add Customer", empty: "No customers found" },
  { name: "CrmCustomersPage", Page: CrmCustomersPage, add: "New Customer", empty: "No results found" },
] as const

/** The name input, addressed by its id rather than its translated label. */
function nameInput(): HTMLInputElement {
  const input = document.querySelector<HTMLInputElement>("#name")
  if (!input) throw new Error("customer name input is not in the document")
  return input
}

beforeEach(() => {
  // `updateCustomer` needs an acting user: the backend checks the caller's
  // `customers.update` grant against this id before writing.
  useAuthStore.setState({ user: { id: 7 } as never, isAuthenticated: true })
  vi.mocked(getCustomers).mockResolvedValue(customers as never)
  vi.mocked(createCustomer).mockResolvedValue({ id: 3 } as never)
  vi.mocked(updateCustomer).mockResolvedValue({ id: 1 } as never)
  vi.mocked(archiveCustomer).mockResolvedValue(undefined as never)
})

afterEach(() => {
  vi.clearAllMocks()
})

describe.each(screens)("$name", ({ Page, add, empty }) => {
  it("reads the customer list exactly once when the page opens", async () => {
    render(<Page />)
    await waitFor(() => expect(screen.getByText("Taller Norte")).toBeInTheDocument())

    // Long enough for the 300ms search debounce to fire, so a second read would
    // have landed by now.
    await new Promise((resolve) => setTimeout(resolve, 400))
    expect(getCustomers).toHaveBeenCalledTimes(1)
  })

  it("shows the total and active counts derived from the loaded rows", async () => {
    render(<Page />)
    await waitFor(() => expect(screen.getByText("Taller Norte")).toBeInTheDocument())

    // Two customers in total, one of them active.
    expect(screen.getByText("Total Customers")).toBeInTheDocument()
    expect(screen.getByText("2")).toBeInTheDocument()
    expect(screen.getByText("1")).toBeInTheDocument()
  })

  it("renders a dash instead of null for missing contact details", async () => {
    render(<Page />)
    await waitFor(() => expect(screen.getByText("Taller Norte")).toBeInTheDocument())

    const full = screen.getByText("Taller Norte").closest("tr") as HTMLElement
    expect(within(full).getByText("norte@example.com")).toBeInTheDocument()

    const sparse = screen.getByText("Taller Sur").closest("tr") as HTMLElement
    expect(within(sparse).getAllByText("-").length).toBeGreaterThanOrEqual(2)
  })

  it("shows the empty state rather than a blank table when there are no customers", async () => {
    vi.mocked(getCustomers).mockResolvedValue([] as never)
    render(<Page />)

    await waitFor(() => expect(screen.getByText(empty)).toBeInTheDocument())
    expect(screen.queryByText("Taller Norte")).not.toBeInTheDocument()
  })

  it("settles on the empty state when the list fails to load", async () => {
    vi.mocked(getCustomers).mockRejectedValue(new Error("Database is locked"))
    render(<Page />)

    // The screen toasts the failure and stops loading; it must not spin forever
    // and it must not render a stale table.
    await waitFor(() => expect(screen.getByText(empty)).toBeInTheDocument())
    expect(toast.error).toHaveBeenCalled()
  })

  it("re-queries with the search term once the debounce elapses", async () => {
    const user = userEvent.setup()
    render(<Page />)
    await waitFor(() => expect(screen.getByText("Taller Norte")).toBeInTheDocument())

    await user.type(screen.getByPlaceholderText("Search customers..."), "Norte")

    await waitFor(() => expect(getCustomers).toHaveBeenCalledWith("Norte"), { timeout: 2000 })
  })

  it("refuses to save a customer with no name", async () => {
    const user = userEvent.setup()
    render(<Page />)
    await waitFor(() => expect(screen.getByText("Taller Norte")).toBeInTheDocument())

    await user.click(screen.getByRole("button", { name: add }))
    await user.click(screen.getByRole("button", { name: "Save" }))

    expect(createCustomer).not.toHaveBeenCalled()
  })

  it("creates a customer from the dialog and reloads the list", async () => {
    const user = userEvent.setup()
    render(<Page />)
    await waitFor(() => expect(screen.getByText("Taller Norte")).toBeInTheDocument())

    const readsBefore = vi.mocked(getCustomers).mock.calls.length
    await user.click(screen.getByRole("button", { name: add }))
    await user.type(nameInput(), "Taller Este")
    await user.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(() => expect(createCustomer).toHaveBeenCalled())
    const args = vi.mocked(createCustomer).mock.calls[0]
    // The name is trimmed on the way in, and an untouched optional field is sent
    // as undefined rather than an empty string.
    expect(args[0]).toBe("Taller Este")
    expect(args[1]).toBeUndefined()
    // Exactly one refresh after the save, to pick up the new row.
    await waitFor(() => expect(getCustomers).toHaveBeenCalledTimes(readsBefore + 1))
  })

  it("trims surrounding whitespace from the name", async () => {
    const user = userEvent.setup()
    render(<Page />)
    await waitFor(() => expect(screen.getByText("Taller Norte")).toBeInTheDocument())

    await user.click(screen.getByRole("button", { name: add }))
    await user.type(nameInput(), "   Taller Este   ")
    await user.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(() => expect(createCustomer).toHaveBeenCalled())
    expect(vi.mocked(createCustomer).mock.calls[0][0]).toBe("Taller Este")
  })

  it("prefills the dialog from the row being edited and saves an update", async () => {
    const user = userEvent.setup()
    render(<Page />)
    await waitFor(() => expect(screen.getByText("Taller Norte")).toBeInTheDocument())

    const row = screen.getByText("Taller Norte").closest("tr") as HTMLElement
    await user.click(within(row).getAllByRole("button")[0])

    await waitFor(() => expect(nameInput().value).toBe("Taller Norte"))
    expect(nameInput().value).toBe("Taller Norte")

    await user.clear(nameInput())
    await user.type(nameInput(), "Taller Norte SL")
    await user.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(() => expect(updateCustomer).toHaveBeenCalled())
    // The acting user is sent first: the backend checks `customers.update`
    // against it before writing, so the id is part of the call, not implied.
    expect(vi.mocked(updateCustomer).mock.calls[0][0]).toBe(7)
    expect(vi.mocked(updateCustomer).mock.calls[0][1]).toBe(1)
    expect(vi.mocked(updateCustomer).mock.calls[0][2]).toBe("Taller Norte SL")
    // Editing must not be mistaken for creating a duplicate.
    expect(createCustomer).not.toHaveBeenCalled()
  })

  it("opens a blank dialog for a new customer after an edit", async () => {
    // resetForm is what stops the previous customer's name reappearing in the
    // "add" form.
    const user = userEvent.setup()
    render(<Page />)
    await waitFor(() => expect(screen.getByText("Taller Norte")).toBeInTheDocument())

    const row = screen.getByText("Taller Norte").closest("tr") as HTMLElement
    await user.click(within(row).getAllByRole("button")[0])
    await waitFor(() => expect(nameInput().value).toBe("Taller Norte"))

    // A modal marks the rest of the page aria-hidden, so the add button is only
    // reachable once the edit dialog is closed — the real user path.
    await user.click(screen.getByRole("button", { name: "Cancel" }))
    await waitFor(() => expect(screen.queryByRole("button", { name: "Save" })).not.toBeInTheDocument())

    await user.click(screen.getByRole("button", { name: add }))
    await waitFor(() => expect(nameInput().value).toBe(""))
  })

  it("discards the typed name when the dialog is cancelled", async () => {
    const user = userEvent.setup()
    render(<Page />)
    await waitFor(() => expect(screen.getByText("Taller Norte")).toBeInTheDocument())

    await user.click(screen.getByRole("button", { name: add }))
    await user.type(nameInput(), "Half typed")
    await user.click(screen.getByRole("button", { name: "Cancel" }))

    await waitFor(() => expect(screen.queryByRole("button", { name: "Save" })).not.toBeInTheDocument())
    expect(createCustomer).not.toHaveBeenCalled()

    await user.click(screen.getByRole("button", { name: add }))
    await waitFor(() => expect(nameInput().value).toBe(""))
  })

  it("archives a customer straight from the row action and reloads the list", async () => {
    const user = userEvent.setup()
    render(<Page />)
    await waitFor(() => expect(screen.getByText("Taller Norte")).toBeInTheDocument())

    const readsBefore = vi.mocked(getCustomers).mock.calls.length
    const row = screen.getByText("Taller Norte").closest("tr") as HTMLElement
    const buttons = within(row).getAllByRole("button")
    await user.click(buttons[buttons.length - 1])

    await waitFor(() => expect(archiveCustomer).toHaveBeenCalledWith(1))
    await waitFor(() => expect(getCustomers).toHaveBeenCalledTimes(readsBefore + 1))
  })

  it("keeps the dialog open and toasts the reason when a save is rejected", async () => {
    vi.mocked(createCustomer).mockRejectedValue(new Error("UNIQUE constraint failed: customers.name"))
    const user = userEvent.setup()
    render(<Page />)
    await waitFor(() => expect(screen.getByText("Taller Norte")).toBeInTheDocument())

    await user.click(screen.getByRole("button", { name: add }))
    await user.type(nameInput(), "Taller Este")
    await user.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(expect.stringContaining("UNIQUE constraint failed")))
    // Still open, so the typed name is not lost and the save can be retried.
    expect(nameInput().value).toBe("Taller Este")
  })

  it("does not reload the list when a save fails", async () => {
    vi.mocked(createCustomer).mockRejectedValue(new Error("nope"))
    const user = userEvent.setup()
    render(<Page />)
    await waitFor(() => expect(screen.getByText("Taller Norte")).toBeInTheDocument())
    const readsBefore = vi.mocked(getCustomers).mock.calls.length

    await user.click(screen.getByRole("button", { name: add }))
    await user.type(nameInput(), "Taller Este")
    await user.click(screen.getByRole("button", { name: "Save" }))
    await waitFor(() => expect(toast.error).toHaveBeenCalled())

    expect(vi.mocked(getCustomers).mock.calls.length).toBe(readsBefore)
  })
})
