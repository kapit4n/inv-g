import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, fireEvent, waitFor, userEvent } from "@tests/helpers/render"
import { setupI18n } from "@/i18n"
import { CommandPalette } from "@/components/command-palette"
import { useSettingsStore } from "@/stores"
import { useAuthStore } from "@/stores"
import type { User } from "@/types"

setupI18n("en")

const user: User = {
  id: 1, username: "admin", email: "admin@test.com", fullName: "Admin User",
  roleId: 1, roleName: "Administrator", isActive: true, createdAt: "2025-01-01T00:00:00Z",
}

const ALL_MODULE_PERMISSIONS = [
  "dashboard.view",
  "sales.view",
  "inventory.view",
  "purchases.view",
  "customers.view",
  "vehicles.view",
  "warehouse.view",
  "reports.view",
  "admin.users.manage",
]

function renderPalette(open = true) {
  if (open) {
    useSettingsStore.getState().setCommandPaletteOpen(true)
  }
  return render(<CommandPalette />)
}

describe("CommandPalette", () => {
  beforeEach(() => {
    useSettingsStore.getState().setCommandPaletteOpen(false)
    // The palette hides entries for modules the role may not open, so a session
    // with the full set of module permissions is the default starting point.
    useAuthStore.getState().setSession(user, "token", ALL_MODULE_PERMISSIONS)
    vi.clearAllMocks()
  })

  it("does not render when closed", () => {
    renderPalette(false)
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("renders when open", () => {
    renderPalette(true)
    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })

  it("shows search input with placeholder", () => {
    renderPalette(true)
    expect(screen.getByPlaceholderText(/command or search/i)).toBeInTheDocument()
  })

  it("shows navigation commands when open with no query", () => {
    renderPalette(true)
    expect(screen.getByText("Dashboard")).toBeInTheDocument()
    expect(screen.getAllByText(/Inventory/i).length).toBeGreaterThan(0)
  })

  it("shows category headers", () => {
    renderPalette(true)
    expect(screen.getByText("Navigation")).toBeInTheDocument()
    expect(screen.getByText("Quick Actions")).toBeInTheDocument()
    expect(screen.getByText("Appearance")).toBeInTheDocument()
  })

  it("filters commands by query", async () => {
    const user = userEvent.setup()
    renderPalette(true)
    const input = screen.getByPlaceholderText(/command or search/i)
    await user.clear(input)
    await user.type(input, "dashboard")
    await waitFor(() => {
      expect(screen.getByText("Dashboard")).toBeInTheDocument()
    })
    const options = screen.getAllByRole("option")
    expect(options.length).toBeLessThan(50)
  })

  it("filters by keywords", async () => {
    const user = userEvent.setup()
    renderPalette(true)
    const input = screen.getByPlaceholderText(/command or search/i)
    await user.clear(input)
    await user.type(input, "pos")
    await waitFor(() => {
      expect(screen.getByText(/Point of Sale/i)).toBeInTheDocument()
    })
  })

  it("shows no results message when query matches nothing", async () => {
    const user = userEvent.setup()
    renderPalette(true)
    const input = screen.getByPlaceholderText(/command or search/i)
    await user.clear(input)
    await user.type(input, "zzznonexistent")
    await waitFor(() => {
      expect(screen.getByText(/No commands found/i)).toBeInTheDocument()
    })
  })

  it("shows keyboard shortcuts for action commands", () => {
    renderPalette(true)
    expect(screen.getByText("Ctrl+N")).toBeInTheDocument()
  })

  it("shows Esc key in footer", () => {
    renderPalette(true)
    expect(screen.getByText("Esc")).toBeInTheDocument()
  })

  it("shows result count", () => {
    renderPalette(true)
    expect(screen.getByText(/results/)).toBeInTheDocument()
  })

  it("arrow keys change selection", async () => {
    renderPalette(true)
    const input = screen.getByPlaceholderText(/command or search/i)
    await waitFor(() => {
      expect(input).toHaveFocus()
    })
    const options = screen.getAllByRole("option")
    expect(options[0]).toHaveAttribute("aria-selected", "true")
    expect(options[1]).toHaveAttribute("aria-selected", "false")
    fireEvent.keyDown(input, { key: "ArrowDown" })
    await waitFor(() => {
      expect(options[1]).toHaveAttribute("aria-selected", "true")
    })
  })

  it("Enter executes selected command and closes palette", async () => {
    renderPalette(true)
    const input = screen.getByPlaceholderText(/command or search/i)
    input.focus()
    fireEvent.keyDown(input, { key: "Enter" })
    await waitFor(() => {
      expect(useSettingsStore.getState().commandPaletteOpen).toBe(false)
    })
  })

  it("offers only the sales module to a cashier", () => {
    useAuthStore.getState().setSession(user, "token", [
      "dashboard.view",
      "sales.view",
      "sales.create",
      "sales.quotes",
      "sales.register",
      "sales.receipts",
    ])
    renderPalette(true)
    // Sales destinations and the landing page are offered…
    expect(screen.getByText("Dashboard")).toBeInTheDocument()
    expect(screen.getByText(/Point of Sale/i)).toBeInTheDocument()
    expect(screen.getByText(/Cash Register/i)).toBeInTheDocument()
    // …while the modules a cashier may not open are not.
    expect(screen.queryByText("Products")).not.toBeInTheDocument()
    expect(screen.queryByText(/Purchase Orders/i)).not.toBeInTheDocument()
    expect(screen.queryByText("Vehicles")).not.toBeInTheDocument()
  })
})
