import { describe, it, expect, vi, beforeEach } from "vitest"
import { useState } from "react"
import { render, screen, waitFor } from "@tests/helpers/render"
import userEvent from "@testing-library/user-event"
import { CustomerSearchField } from "@/components/forms/customer-search-field"
import { getCustomers, createCustomer, updateCustomer } from "@/lib/tauri"
import { useAuthStore, useNotificationStore } from "@/stores"
import type { Customer } from "@/types"
import { setupI18n } from "@/i18n"

/**
 * The POS customer field, which is where a cashier registers a customer and
 * where a mistake in that registration has to be correctable.
 *
 * `cashier` deliberately holds `customers.update` but not `customers.view`:
 * the cashier may fix the customer on the sale in front of them, and may not
 * open the Customers module. These tests pin both halves of that, because the
 * failure mode of getting the grant wrong is silent -- a cashier either cannot
 * correct a typo, or can browse every customer's contact details and credit
 * balance.
 */

setupI18n("en")

const customer: Customer = {
  id: 1,
  name: "Jhoan P.",
  email: "jhoan@example.com",
  phone: "555-0100",
  address: "Av. Ballivián 142",
  city: "La Paz",
  state: "La Paz",
  postalCode: null,
  country: "BO",
  notes: "original",
  isActive: true,
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
} as Customer

/**
 * The POS holds the selected id in its own state and passes it down, so the
 * component is controlled and the edit/clear row only appears once something is
 * selected. Rendering it bare would never show that row.
 */
function Harness() {
  const [value, setValue] = useState<number | undefined>(undefined)
  return <CustomerSearchField value={value} onChange={setValue} />
}

/** Select `customer` in the combobox, as a cashier would at the till. */
async function selectCustomer(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("combobox"))
  await user.click(await screen.findByRole("button", { name: /Jhoan P\./ }))
}

beforeEach(() => {
  // The suite-wide mock keeps call history between tests, so an assertion on
  // "not called" would otherwise see the previous test's writes.
  vi.mocked(updateCustomer).mockClear()
  vi.mocked(createCustomer).mockClear()
  vi.mocked(getCustomers).mockResolvedValue([customer] as never)
  vi.mocked(createCustomer).mockResolvedValue({ id: 2 } as never)
  vi.mocked(updateCustomer).mockResolvedValue({ ...customer, name: "Jhohan Perez" } as never)
  useNotificationStore.setState({ notifications: [], unreadCount: 0 })
})

describe("CustomerSearchField — editing from the till", () => {
  it("offers the edit affordance to a role holding customers.update", async () => {
    useAuthStore.setState({
      user: { id: 3 } as never,
      permissions: ["dashboard.view", "sales.view", "sales.create", "customers.update"],
      isAuthenticated: true,
    })
    const user = userEvent.setup()
    render(<Harness />)

    await selectCustomer(user)
    expect(await screen.findByTestId("edit-customer")).toBeInTheDocument()
  })

  it("hides the edit affordance from a role without customers.update", async () => {
    // The seeded `viewer` role: it can see customers but not change one.
    useAuthStore.setState({
      user: { id: 5 } as never,
      permissions: ["customers.view"],
      isAuthenticated: true,
    })
    const user = userEvent.setup()
    render(<Harness />)

    await selectCustomer(user)
    await waitFor(() => expect(screen.getByRole("combobox")).toBeInTheDocument())
    expect(screen.queryByTestId("edit-customer")).not.toBeInTheDocument()
  })

  it("saves a corrected name with the acting user's id", async () => {
    useAuthStore.setState({
      user: { id: 3 } as never,
      permissions: ["customers.update"],
      isAuthenticated: true,
    })
    const user = userEvent.setup()
    render(<Harness />)

    await selectCustomer(user)
    await user.click(await screen.findByTestId("edit-customer"))

    const nameInput = await screen.findByPlaceholderText("Customer name")
    expect(nameInput).toHaveValue("Jhoan P.")
    await user.clear(nameInput)
    await user.type(nameInput, "Jhohan Perez")
    await user.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(() => expect(updateCustomer).toHaveBeenCalled())
    // userId first: the backend checks `customers.update` against it.
    expect(vi.mocked(updateCustomer).mock.calls[0][0]).toBe(3)
    expect(vi.mocked(updateCustomer).mock.calls[0][1]).toBe(1)
    expect(vi.mocked(updateCustomer).mock.calls[0][2]).toBe("Jhohan Perez")
  })

  it("passes the fields the dialog does not render through untouched", async () => {
    // `update_customer` overwrites every column. The address fields are not in
    // this dialog, so omitting them would make saving a corrected name silently
    // blank the customer's address.
    useAuthStore.setState({
      user: { id: 3 } as never,
      permissions: ["customers.update"],
      isAuthenticated: true,
    })
    const user = userEvent.setup()
    render(<Harness />)

    await selectCustomer(user)
    await user.click(await screen.findByTestId("edit-customer"))
    const nameInput = await screen.findByPlaceholderText("Customer name")
    await user.clear(nameInput)
    await user.type(nameInput, "Jhohan Perez")
    await user.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(() => expect(updateCustomer).toHaveBeenCalled())
    const call = vi.mocked(updateCustomer).mock.calls[0]
    // updateCustomer(userId, id, name, email, phone, address, city, state, ...)
    expect(call[5]).toBe("Av. Ballivián 142") // address
    expect(call[6]).toBe("La Paz") // city
    expect(call[9]).toBe("BO") // country
  })

  it("refuses to save a blank name", async () => {
    useAuthStore.setState({
      user: { id: 3 } as never,
      permissions: ["customers.update"],
      isAuthenticated: true,
    })
    const user = userEvent.setup()
    render(<Harness />)

    await selectCustomer(user)
    await user.click(await screen.findByTestId("edit-customer"))
    const nameInput = await screen.findByPlaceholderText("Customer name")
    await user.clear(nameInput)

    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled()
    expect(updateCustomer).not.toHaveBeenCalled()
  })

  it("still offers quick add, which a cashier has always been able to do", async () => {
    useAuthStore.setState({
      user: { id: 3 } as never,
      permissions: ["customers.update"],
      isAuthenticated: true,
    })
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole("combobox"))
    expect(await screen.findByRole("button", { name: /Quick Add Customer/ })).toBeInTheDocument()
  })
})
