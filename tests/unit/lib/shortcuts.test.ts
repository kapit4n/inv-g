import { describe, it, expect } from "vitest"
import { shortcuts, shortcutCategories } from "@/lib/shortcuts/shortcuts"
import type { ShortcutScope, ShortcutCategory } from "@/lib/shortcuts/shortcuts"

describe("shortcuts registry", () => {
  it("contains all expected shortcuts", () => {
    const ids = shortcuts.map((s) => s.id)
    expect(ids).toContain("commandPalette")
    expect(ids).toContain("globalSearch")
    expect(ids).toContain("toggleSidebar")
    expect(ids).toContain("newSale")
    expect(ids).toContain("newPurchaseOrder")
    expect(ids).toContain("toggleTheme")
    expect(ids).toContain("save")
    expect(ids).toContain("print")
    expect(ids).toContain("close")
    expect(ids).toContain("productSearch")
    expect(ids).toContain("customerSearch")
    expect(ids).toContain("vehicleSearch")
    expect(ids).toContain("focusPayment")
  })

  it("has 13 shortcuts total", () => {
    expect(shortcuts.length).toBe(13)
  })

  it("every shortcut has valid scope", () => {
    const validScopes: ShortcutScope[] = ["global", "pos"]
    shortcuts.forEach((s) => {
      expect(validScopes).toContain(s.scope)
    })
  })

  it("every shortcut has valid category", () => {
    const validCategories: ShortcutCategory[] = ["navigation", "actions", "pos", "appearance"]
    shortcuts.forEach((s) => {
      expect(validCategories).toContain(s.category)
    })
  })

  it("every shortcut has a non-empty keys string", () => {
    shortcuts.forEach((s) => {
      expect(s.keys.trim().length).toBeGreaterThan(0)
    })
  })

  it("every shortcut has a non-empty actionKey", () => {
    shortcuts.forEach((s) => {
      expect(s.actionKey.trim().length).toBeGreaterThan(0)
    })
  })

  it("global shortcuts include Ctrl+K, Ctrl+F, Ctrl+N, Ctrl+B", () => {
    const globalShortcuts = shortcuts.filter((s) => s.scope === "global")
    const keys = globalShortcuts.map((s) => s.keys)
    expect(keys).toContain("Ctrl+K")
    expect(keys).toContain("Ctrl+F")
    expect(keys).toContain("Ctrl+N")
    expect(keys).toContain("Ctrl+B")
  })

  it("POS shortcuts include F2, F4, F6, F10", () => {
    const posShortcuts = shortcuts.filter((s) => s.scope === "pos")
    const keys = posShortcuts.map((s) => s.keys)
    expect(keys).toContain("F2")
    expect(keys).toContain("F4")
    expect(keys).toContain("F6")
    expect(keys).toContain("F10")
  })
})

describe("shortcut categories", () => {
  it("contains navigation, actions, pos, appearance", () => {
    const ids = shortcutCategories.map((c) => c.id)
    expect(ids).toContain("navigation")
    expect(ids).toContain("actions")
    expect(ids).toContain("pos")
    expect(ids).toContain("appearance")
  })

  it("every category has a label key", () => {
    shortcutCategories.forEach((c) => {
      expect(c.label.trim().length).toBeGreaterThan(0)
    })
  })
})
