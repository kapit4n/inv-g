import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor, within } from "@tests/helpers/render"
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom"
import { setupI18n } from "@/i18n"
import { SalesCustomersPage } from "@/features/sales/pages/sales-customers-page"
import { getCustomers } from "@/lib/tauri"
import type { Customer } from "@/types"

vi.mock("@/lib/tauri", () => ({
  getCustomers: vi.fn(),
}))

setupI18n("en")

/**
 * The Sales > Customers screen: four summary cards computed from the fetched
 * list, a debounced search box, and a table whose rows open the customer detail.
 *
 * - **Stats must match the rows** — each card derives from the same array the
 *   table renders, so a mismatch between the two is the screen being wrong.
 * - **Search is debounced** — every keystroke hitting the back end would make
 *   this the most expensive box in the app.
 * - **Rows and actions navigate** — with the `/sales/:id` route registered
 *   above the new `/sales/customers` route, a mis-navigating click would land
 *   on the sale detail and fail silently.
 */

const activeCustomer: Customer = {
  id: 1,
  name: "Taller Norte",
  email: "norte@example.com",
  phone: "555-0100",
  address: "Av. Central 1",
  city: "Madrid",
  state: "Madrid",
  postalCode: "28001",
  country: "ES",
  notes: null,
  isActive: true,
  createdAt: new Date().toISOString(),
  totalSales: 1500,
  saleCount: 12,
}

const inactiveCustomer: Customer = {
  id: 2,
  name: "Taller Sur",
  email: null,
  phone: null,
  address: null,
  city: "Sevilla",
  state: null,
  postalCode: null,
  country: "ES",
  notes: null,
  isActive: false,
  createdAt: "2020-01-01T00:00:00Z",
  totalSales: 0,
  saleCount: 0,
}

/** The bold value under a stat card title, located via the title's parent row. */
function cardValue(title: string): HTMLElement {
  // "Active"/"Inactive" also render as row badges (a <div>); the stat title is a <p>.
  const titleEl = screen.getAllByText(title).find((el) => el.tagName === "P")
  if (!titleEl) throw new Error(`No stat card titled ${title}`)
  return within(titleEl.parentElement as HTMLElement).getByText(/^\d+$/)
}

function LocationProbe() {
  const location = useLocation()
  return <div data-testid="location-probe">{location.pathname}</div>
}

function renderPage(customers: Customer[] = []) {
  vi.mocked(getCustomers).mockResolvedValue(customers)
  render(
    <MemoryRouter initialEntries={["/sales/customers"]}>
      <Routes>
        <Route path="/sales/customers" element={<SalesCustomersPage />} />
        <Route path="/customers/:id" element={<LocationProbe />} />
        <Route path="/sales/new" element={<LocationProbe />} />
        <Route path="/crm/customers" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
    { withRouter: false },
  )
}

describe("SalesCustomersPage", () => {
  beforeEach(() => {
    vi.mocked(getCustomers).mockReset()
  })

  it("loads customers on mount without an initial search term", async () => {
    renderPage([activeCustomer])
    expect(await screen.findByText("Taller Norte")).toBeDefined()
    expect(getCustomers).toHaveBeenCalledWith(undefined)
  })

  it("renders the four summary cards from the fetched rows", async () => {
    renderPage([activeCustomer, inactiveCustomer])

    await screen.findByText("Taller Norte")
    expect(cardValue("Total Customers").textContent).toBe("2")
    expect(cardValue("Active").textContent).toBe("1")
    expect(cardValue("Inactive").textContent).toBe("1")
    expect(cardValue("New this month").textContent).toBe("1")
  })

  it("shows the empty message when there are no customers", async () => {
    renderPage([])
    expect(await screen.findByText("No customers found")).toBeDefined()
    expect(screen.queryByText("Taller Norte")).toBeNull()
  })

  it("refetches the list with the debounced search term", async () => {
    renderPage([activeCustomer])
    await screen.findByText("Taller Norte")

    fireEvent.change(screen.getByPlaceholderText("Search customers..."), {
      target: { value: "Norte" },
    })

    await waitFor(() => {
      const calls = vi.mocked(getCustomers).mock.calls
      expect(calls.at(-1)).toEqual(["Norte"])
    })
  })

  it("navigates to the customer detail when a row is clicked", async () => {
    renderPage([activeCustomer])
    fireEvent.click(await screen.findByText("Taller Norte"))
    expect(await screen.findByTestId("location-probe")).toHaveTextContent("/customers/1")
  })

  it("navigates to the new sale action", async () => {
    renderPage([activeCustomer])
    await screen.findByText("Taller Norte")

    fireEvent.click(screen.getByRole("button", { name: "New Sale" }))
    expect(await screen.findByTestId("location-probe")).toHaveTextContent("/sales/new")
  })

  it("navigates to the customer management action", async () => {
    renderPage([activeCustomer])
    await screen.findByText("Taller Norte")

    fireEvent.click(screen.getByRole("button", { name: "Manage customers" }))
    expect(await screen.findByTestId("location-probe")).toHaveTextContent("/crm/customers")
  })
})