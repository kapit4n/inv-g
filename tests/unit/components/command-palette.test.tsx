import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, fireEvent, waitFor, userEvent } from "@tests/helpers/render"
import { setupI18n } from "@/i18n"
import { CommandPalette } from "@/components/command-palette"
import { useSettingsStore } from "@/stores"

setupI18n("en")

function renderPalette(open = true) {
  if (open) {
    useSettingsStore.getState().setCommandPaletteOpen(true)
  }
  return render(<CommandPalette />)
}

describe("CommandPalette", () => {
  beforeEach(() => {
    useSettingsStore.getState().setCommandPaletteOpen(false)
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
})
