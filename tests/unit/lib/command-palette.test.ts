import { describe, it, expect, vi } from "vitest"
import { setupI18n } from "@/i18n"
import { buildCommands, commandCategories } from "@/lib/command-palette/commands"

const t = setupI18n("en").t

const mockNavigate = vi.fn()
const mockCycleTheme = vi.fn()
const mockToggleSidebar = vi.fn()

const defaultDeps = {
  navigate: mockNavigate,
  cycleTheme: mockCycleTheme,
  sidebarCollapsed: false,
  toggleSidebar: mockToggleSidebar,
  t,
}

describe("commandCategories", () => {
  it("has three categories", () => {
    expect(commandCategories).toHaveLength(3)
    expect(commandCategories.map((c) => c.id)).toEqual(["navigation", "action", "appearance"])
  })
})

describe("buildCommands", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns an array of commands", () => {
    const commands = buildCommands(defaultDeps)
    expect(commands.length).toBeGreaterThan(0)
  })

  it("each command has required fields", () => {
    const commands = buildCommands(defaultDeps)
    for (const cmd of commands) {
      expect(cmd.id).toBeTruthy()
      expect(cmd.label).toBeTruthy()
      expect(cmd.category).toBeDefined()
      expect(typeof cmd.action).toBe("function")
      expect(cmd.icon).toBeDefined()
    }
  })

  it("navigation commands call navigate with correct path", () => {
    const commands = buildCommands(defaultDeps)
    const dashboardCmd = commands.find((c) => c.id === "nav.dashboard")
    expect(dashboardCmd).toBeDefined()
    dashboardCmd!.action()
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard")
  })

  it("POS navigation command navigates to /sales/new", () => {
    const commands = buildCommands(defaultDeps)
    const posCmd = commands.find((c) => c.id === "nav.sales.pos")
    expect(posCmd).toBeDefined()
    posCmd!.action()
    expect(mockNavigate).toHaveBeenCalledWith("/sales/new")
  })

  it("new sale action navigates to /sales/new", () => {
    const commands = buildCommands(defaultDeps)
    const newSaleCmd = commands.find((c) => c.id === "action.newSale")
    expect(newSaleCmd).toBeDefined()
    expect(newSaleCmd!.shortcut).toBe("Ctrl+N")
    newSaleCmd!.action()
    expect(mockNavigate).toHaveBeenCalledWith("/sales/new")
  })

  it("new purchase order action navigates to /purchases/orders/new", () => {
    const commands = buildCommands(defaultDeps)
    const cmd = commands.find((c) => c.id === "action.newPurchaseOrder")
    expect(cmd).toBeDefined()
    cmd!.action()
    expect(mockNavigate).toHaveBeenCalledWith("/purchases/orders/new")
  })

  it("new product action navigates to /inventory/products/new", () => {
    const commands = buildCommands(defaultDeps)
    const cmd = commands.find((c) => c.id === "action.newProduct")
    expect(cmd).toBeDefined()
    cmd!.action()
    expect(mockNavigate).toHaveBeenCalledWith("/inventory/products/new")
  })

  it("new customer action navigates to /crm/customers/new", () => {
    const commands = buildCommands(defaultDeps)
    const cmd = commands.find((c) => c.id === "action.newCustomer")
    expect(cmd).toBeDefined()
    cmd!.action()
    expect(mockNavigate).toHaveBeenCalledWith("/crm/customers/new")
  })

  it("toggle theme action calls cycleTheme", () => {
    const commands = buildCommands(defaultDeps)
    const cmd = commands.find((c) => c.id === "appearance.toggleTheme")
    expect(cmd).toBeDefined()
    cmd!.action()
    expect(mockCycleTheme).toHaveBeenCalled()
  })

  it("toggle sidebar action calls toggleSidebar", () => {
    const commands = buildCommands(defaultDeps)
    const cmd = commands.find((c) => c.id === "appearance.toggleSidebar")
    expect(cmd).toBeDefined()
    cmd!.action()
    expect(mockToggleSidebar).toHaveBeenCalled()
  })

  it("sidebar label changes based on collapsed state", () => {
    const expandedCommands = buildCommands(defaultDeps)
    const expandedCmd = expandedCommands.find((c) => c.id === "appearance.toggleSidebar")
    expect(expandedCmd!.label).toContain("Collapse")

    const collapsedCommands = buildCommands({ ...defaultDeps, sidebarCollapsed: true })
    const collapsedCmd = collapsedCommands.find((c) => c.id === "appearance.toggleSidebar")
    expect(collapsedCmd!.label).toContain("Expand")
  })

  it("commands have keywords for search", () => {
    const commands = buildCommands(defaultDeps)
    const posCmd = commands.find((c) => c.id === "nav.sales.pos")
    expect(posCmd!.keywords).toContain("pos")
    expect(posCmd!.keywords).toContain("venta")
  })

  it("action commands have keyboard shortcuts", () => {
    const commands = buildCommands(defaultDeps)
    const newSale = commands.find((c) => c.id === "action.newSale")
    expect(newSale!.shortcut).toBe("Ctrl+N")
    const toggleTheme = commands.find((c) => c.id === "appearance.toggleTheme")
    expect(toggleTheme!.shortcut).toBeDefined()
  })

  it("includes all major navigation targets", () => {
    const commands = buildCommands(defaultDeps)
    const navIds = commands.filter((c) => c.category === "navigation").map((c) => c.id)
    expect(navIds).toContain("nav.dashboard")
    expect(navIds).toContain("nav.inventory")
    expect(navIds).toContain("nav.inventory.products")
    expect(navIds).toContain("nav.sales.pos")
    expect(navIds).toContain("nav.purchases")
    expect(navIds).toContain("nav.crm")
    expect(navIds).toContain("nav.reports")
    expect(navIds).toContain("nav.admin")
    expect(navIds).toContain("nav.settings")
    expect(navIds).toContain("nav.help")
  })
})
