import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, fireEvent } from "@tests/helpers/render"
import { MemoryRouter } from "react-router-dom"
import { setupI18n } from "@/i18n"
import { ShortcutProvider } from "@/components/shortcut-provider"
import { useSettingsStore } from "@/stores"

setupI18n("en")

function renderProvider(path = "/dashboard") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ShortcutProvider />
    </MemoryRouter>,
    { withRouter: false },
  )
}

describe("ShortcutProvider", () => {
  beforeEach(() => {
    useSettingsStore.setState({ commandPaletteOpen: false, sidebarCollapsed: false })
  })

  it("renders without crashing", () => {
    renderProvider()
  })

  it("toggles command palette on Ctrl+K", () => {
    renderProvider()
    expect(useSettingsStore.getState().commandPaletteOpen).toBe(false)
    fireEvent.keyDown(window, { key: "k", ctrlKey: true })
    expect(useSettingsStore.getState().commandPaletteOpen).toBe(true)
    fireEvent.keyDown(window, { key: "k", ctrlKey: true })
    expect(useSettingsStore.getState().commandPaletteOpen).toBe(false)
  })

  it("toggles sidebar on Ctrl+B", () => {
    renderProvider()
    expect(useSettingsStore.getState().sidebarCollapsed).toBe(false)
    fireEvent.keyDown(window, { key: "b", ctrlKey: true })
    expect(useSettingsStore.getState().sidebarCollapsed).toBe(true)
  })

  it("dispatches shortcut:escape event on Escape", () => {
    renderProvider()
    const handler = vi.fn()
    window.addEventListener("shortcut:escape", handler)
    fireEvent.keyDown(window, { key: "Escape" })
    expect(handler).toHaveBeenCalled()
    window.removeEventListener("shortcut:escape", handler)
  })

  it("dispatches shortcut:print on Ctrl+P", () => {
    renderProvider()
    const handler = vi.fn()
    window.addEventListener("shortcut:print", handler)
    fireEvent.keyDown(window, { key: "p", ctrlKey: true })
    expect(handler).toHaveBeenCalled()
    window.removeEventListener("shortcut:print", handler)
  })

  it("dispatches shortcut:save on Ctrl+S", () => {
    renderProvider()
    const handler = vi.fn()
    window.addEventListener("shortcut:save", handler)
    fireEvent.keyDown(window, { key: "s", ctrlKey: true })
    expect(handler).toHaveBeenCalled()
    window.removeEventListener("shortcut:save", handler)
  })

  it("dispatches POS shortcuts when on POS page", () => {
    renderProvider("/sales/new")
    const handler = vi.fn()
    window.addEventListener("shortcut:pos", handler)

    fireEvent.keyDown(window, { key: "F2" })
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ detail: "product" }))

    fireEvent.keyDown(window, { key: "F4" })
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ detail: "customer" }))

    fireEvent.keyDown(window, { key: "F6" })
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ detail: "vehicle" }))

    fireEvent.keyDown(window, { key: "F10" })
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ detail: "payment" }))

    window.removeEventListener("shortcut:pos", handler)
  })

  it("does not dispatch POS shortcuts when not on POS page", () => {
    renderProvider("/dashboard")
    const handler = vi.fn()
    window.addEventListener("shortcut:pos", handler)

    fireEvent.keyDown(window, { key: "F2" })
    fireEvent.keyDown(window, { key: "F4" })
    fireEvent.keyDown(window, { key: "F10" })

    expect(handler).not.toHaveBeenCalled()
    window.removeEventListener("shortcut:pos", handler)
  })
})
