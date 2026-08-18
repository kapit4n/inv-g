import { describe, it, expect } from "vitest"
import { shortcuts, shortcutCategories } from "@/lib/shortcuts/shortcuts"

describe("shortcuts registry", () => {
  it("defines all expected shortcuts", () => {
    expect(shortcuts.length).toBe(9)
  })

  it("every shortcut has required fields", () => {
    for (const s of shortcuts) {
      expect(s.id).toBeTruthy()
      expect(s.keys).toBeTruthy()
      expect(["global", "pos"]).toContain(s.scope)
      expect(["navigation", "actions", "pos", "appearance"]).toContain(s.category)
      expect(s.actionKey).toBeTruthy()
    }
  })

  it("has unique ids", () => {
    const ids = shortcuts.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("Ctrl+K is registered as global navigation shortcut", () => {
    const cmd = shortcuts.find((s) => s.id === "commandPalette")
    expect(cmd).toBeDefined()
    expect(cmd!.keys).toBe("Ctrl+K")
    expect(cmd!.scope).toBe("global")
    expect(cmd!.category).toBe("navigation")
  })

  it("Ctrl+N new sale is registered", () => {
    const cmd = shortcuts.find((s) => s.id === "newSale")
    expect(cmd).toBeDefined()
    expect(cmd!.keys).toBe("Ctrl+N")
    expect(cmd!.scope).toBe("global")
  })

  it("Ctrl+Shift+P new purchase order is registered", () => {
    const cmd = shortcuts.find((s) => s.id === "newPurchaseOrder")
    expect(cmd).toBeDefined()
    expect(cmd!.keys).toBe("Ctrl+Shift+P")
    expect(cmd!.scope).toBe("global")
  })

  it("Ctrl+Shift+D toggle theme is registered", () => {
    const cmd = shortcuts.find((s) => s.id === "toggleTheme")
    expect(cmd).toBeDefined()
    expect(cmd!.keys).toBe("Ctrl+Shift+D")
    expect(cmd!.scope).toBe("global")
    expect(cmd!.category).toBe("appearance")
  })

  it("Ctrl+B toggle sidebar is registered", () => {
    const cmd = shortcuts.find((s) => s.id === "toggleSidebar")
    expect(cmd).toBeDefined()
    expect(cmd!.keys).toBe("Ctrl+B")
    expect(cmd!.scope).toBe("global")
    expect(cmd!.category).toBe("appearance")
  })

  it("F2 customer search is registered as POS scope", () => {
    const cmd = shortcuts.find((s) => s.id === "customerSearch")
    expect(cmd).toBeDefined()
    expect(cmd!.keys).toBe("F2")
    expect(cmd!.scope).toBe("pos")
    expect(cmd!.category).toBe("pos")
  })

  it("F4 focus payment is registered as POS scope", () => {
    const cmd = shortcuts.find((s) => s.id === "focusPayment")
    expect(cmd).toBeDefined()
    expect(cmd!.keys).toBe("F4")
    expect(cmd!.scope).toBe("pos")
  })

  it("F10 checkout is registered as POS scope", () => {
    const cmd = shortcuts.find((s) => s.id === "checkout")
    expect(cmd).toBeDefined()
    expect(cmd!.keys).toBe("F10")
    expect(cmd!.scope).toBe("pos")
  })

  it("Escape is registered as global shortcut", () => {
    const cmd = shortcuts.find((s) => s.id === "close")
    expect(cmd).toBeDefined()
    expect(cmd!.keys).toBe("Escape")
    expect(cmd!.scope).toBe("global")
  })

  it("has 4 shortcut categories", () => {
    expect(shortcutCategories).toHaveLength(4)
    const ids = shortcutCategories.map((c) => c.id)
    expect(ids).toContain("navigation")
    expect(ids).toContain("actions")
    expect(ids).toContain("pos")
    expect(ids).toContain("appearance")
  })

  it("global shortcuts are a subset of shortcuts", () => {
    const globalIds = shortcuts.filter((s) => s.scope === "global").map((s) => s.id)
    expect(globalIds).toContain("commandPalette")
    expect(globalIds).toContain("newSale")
    expect(globalIds).toContain("newPurchaseOrder")
    expect(globalIds).toContain("toggleTheme")
    expect(globalIds).toContain("toggleSidebar")
    expect(globalIds).toContain("close")
  })

  it("POS shortcuts are a subset of shortcuts", () => {
    const posIds = shortcuts.filter((s) => s.scope === "pos").map((s) => s.id)
    expect(posIds).toContain("customerSearch")
    expect(posIds).toContain("focusPayment")
    expect(posIds).toContain("checkout")
  })

  it("every shortcut actionKey follows help.shortcuts.* pattern", () => {
    for (const s of shortcuts) {
      expect(s.actionKey).toMatch(/^help\.shortcuts\./)
    }
  })
})
