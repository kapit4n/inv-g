import { describe, it, expect, beforeEach } from "vitest"
import { useSettingsStore } from "@/stores/settings.store"

describe("SettingsStore", () => {
  beforeEach(() => {
    useSettingsStore.setState({ sidebarCollapsed: false, commandPaletteOpen: false })
  })

  it("initializes with sidebar expanded", () => {
    expect(useSettingsStore.getState().sidebarCollapsed).toBe(false)
  })

  it("toggleSidebar toggles collapse", () => {
    useSettingsStore.getState().toggleSidebar()
    expect(useSettingsStore.getState().sidebarCollapsed).toBe(true)
    useSettingsStore.getState().toggleSidebar()
    expect(useSettingsStore.getState().sidebarCollapsed).toBe(false)
  })

  it("setSidebarCollapsed sets value", () => {
    useSettingsStore.getState().setSidebarCollapsed(true)
    expect(useSettingsStore.getState().sidebarCollapsed).toBe(true)
    useSettingsStore.getState().setSidebarCollapsed(false)
    expect(useSettingsStore.getState().sidebarCollapsed).toBe(false)
  })

  it("command palette starts closed", () => {
    expect(useSettingsStore.getState().commandPaletteOpen).toBe(false)
  })

  it("setCommandPaletteOpen opens and closes", () => {
    useSettingsStore.getState().setCommandPaletteOpen(true)
    expect(useSettingsStore.getState().commandPaletteOpen).toBe(true)
  })

  it("toggleCommandPalette toggles", () => {
    useSettingsStore.getState().toggleCommandPalette()
    expect(useSettingsStore.getState().commandPaletteOpen).toBe(true)
    useSettingsStore.getState().toggleCommandPalette()
    expect(useSettingsStore.getState().commandPaletteOpen).toBe(false)
  })
})
