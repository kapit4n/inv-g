import type { TFunction } from "i18next"
import {
  LayoutDashboard, ShoppingCart, Package, ShoppingBag, Users, Truck,
  Car, Warehouse, BarChart3, Settings, HelpCircle, UsersRound,
  Layers, Tag, Cog, Briefcase, MapPin, Box, ArrowUpDown,
  FileText, RotateCcw, DollarSign, Printer, Receipt,
  GitCompare, BellRing, ShieldCheck, CreditCard, StickyNote,
  TrendingUp, HardDrive, Database, Shield, Activity,
  Moon, PanelLeftClose, PanelLeft,
  Plus,
} from "lucide-react"
import type { Command, CommandCategoryConfig } from "./types"

export const commandCategories: CommandCategoryConfig[] = [
  { id: "navigation", label: "commandPalette.categories.navigation" },
  { id: "action", label: "commandPalette.categories.actions" },
  { id: "appearance", label: "commandPalette.categories.appearance" },
]

interface CommandRegistryDeps {
  navigate: (path: string) => void
  cycleTheme: () => void
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  t: TFunction
}

export function buildCommands(deps: CommandRegistryDeps): Command[] {
  const { navigate, cycleTheme, sidebarCollapsed, toggleSidebar, t } = deps

  const nav = (id: string, label: string, path: string, icon: typeof LayoutDashboard, keywords?: string[]): Command => ({
    id,
    label,
    category: "navigation",
    icon,
    keywords,
    action: () => navigate(path),
  })

  return [
    nav("nav.dashboard", t("dashboard.title"), "/dashboard", LayoutDashboard),
    nav("nav.sales.pos", t("sales.pointOfSale"), "/sales/new", ShoppingCart, ["pos", "point of sale", "venta"]),
    nav("nav.sales.history", t("sales.salesHistory"), "/sales", Receipt, ["ventas"]),
    nav("nav.sales.quotes", t("sales.quotes"), "/sales/quotes", FileText, ["cotizaciones", "presupuesto"]),
    nav("nav.sales.returns", t("sales.returns"), "/sales/returns", RotateCcw, ["devoluciones"]),
    nav("nav.sales.register", t("sales.cashRegister"), "/sales/register", DollarSign, ["caja", "cash"]),
    nav("nav.sales.closeout", t("sales.dailyCloseout"), "/sales/closeout", BarChart3, ["cierre", "daily"]),
    nav("nav.inventory", t("inventory.title"), "/inventory", Package),
    nav("nav.inventory.categories", t("inventory.categories"), "/inventory/categories", Layers),
    nav("nav.inventory.brands", t("inventory.brands"), "/inventory/brands", Tag),
    nav("nav.inventory.manufacturers", t("inventory.manufacturers"), "/inventory/manufacturers", Cog),
    nav("nav.inventory.suppliers", t("inventory.suppliers"), "/inventory/suppliers", Briefcase),
    nav("nav.inventory.warehouses", t("inventory.warehouses"), "/inventory/warehouses", Warehouse),
    nav("nav.inventory.locations", t("inventory.storageLocations"), "/inventory/storage-locations", MapPin),
    nav("nav.inventory.products", t("inventory.products"), "/inventory/products", Box, ["productos"]),
    nav("nav.inventory.movements", t("inventory.inventoryMovements"), "/inventory/movements", ArrowUpDown),
    nav("nav.purchases", t("purchases.title"), "/purchases", ShoppingBag),
    nav("nav.purchases.orders", t("purchases.orders"), "/purchases/orders", FileText, ["ordenes", "purchase orders"]),
    nav("nav.purchases.requests", t("purchases.requests"), "/purchases/requests", Layers),
    nav("nav.purchases.receipts", t("purchases.receipts"), "/purchases/receipts", Package),
    nav("nav.purchases.returns", t("purchases.returns"), "/purchases/returns", RotateCcw),
    nav("nav.purchases.supplierProducts", t("purchases.supplierProducts"), "/purchases/supplier-products", Briefcase),
    nav("nav.purchases.reorder", t("purchases.reorderSuggestions"), "/purchases/reorder-suggestions", TrendingUp),
    nav("nav.crm", t("crm.title"), "/crm", Users),
    nav("nav.crm.customers", t("crm.customers"), "/crm/customers", Users, ["clientes"]),
    nav("nav.crm.vehicles", t("crm.vehicles"), "/crm/vehicles", Car, ["vehiculos", "autos"]),
    nav("nav.crm.compatibility", t("crm.compatibility"), "/crm/compatibility", GitCompare),
    nav("nav.crm.reminders", t("crm.reminders"), "/crm/reminders", BellRing),
    nav("nav.crm.warranties", t("crm.warranties"), "/crm/warranties", ShieldCheck),
    nav("nav.crm.credit", t("crm.credit"), "/crm/credit", CreditCard),
    nav("nav.crm.notes", t("crm.notes"), "/crm/notes", StickyNote),
    nav("nav.suppliers", t("suppliers.title"), "/suppliers", Truck),
    nav("nav.warehouse", t("warehouse.title"), "/warehouse", Warehouse),
    nav("nav.reports", t("reports.title"), "/reports", BarChart3),
    nav("nav.reports.sales", t("reports.sales"), "/reports/sales", ShoppingCart),
    nav("nav.reports.inventory", t("reports.inventory"), "/reports/inventory", Package),
    nav("nav.reports.purchasing", t("reports.purchasing"), "/reports/purchasing", ShoppingBag),
    nav("nav.reports.customers", t("reports.customers"), "/reports/customers", Users),
    nav("nav.reports.profitability", t("reports.profitability"), "/reports/profitability", DollarSign),
    nav("nav.reports.kpis", t("reports.kpis"), "/reports/kpis", BarChart3),
    nav("nav.admin", t("admin.title"), "/admin", Shield),
    nav("nav.admin.users", t("admin.users"), "/admin/users", Users),
    nav("nav.admin.roles", t("admin.roles"), "/admin/roles", ShieldCheck),
    nav("nav.admin.settings", t("admin.settings"), "/admin/settings", Settings),
    nav("nav.admin.printers", t("admin.printers"), "/admin/printers", Printer),
    nav("nav.admin.backups", t("admin.backups"), "/admin/backups", HardDrive),
    nav("nav.admin.database", t("admin.database"), "/admin/database", Database),
    nav("nav.admin.diagnostics", t("admin.diagnostics"), "/admin/diagnostics", Activity),
    nav("nav.admin.audit", t("admin.audit"), "/admin/audit", FileText),
    nav("nav.employees", t("employees.title"), "/employees", UsersRound),
    nav("nav.settings", t("settings.title"), "/settings", Settings),
    nav("nav.help", t("help.title"), "/help", HelpCircle),

    {
      id: "action.newSale",
      label: t("commandPalette.actions.newSale"),
      category: "action",
      icon: Plus,
      shortcut: "Ctrl+N",
      keywords: ["venta", "nueva", "new", "pos"],
      action: () => navigate("/sales/new"),
    },
    {
      id: "action.newPurchaseOrder",
      label: t("commandPalette.actions.newPurchaseOrder"),
      category: "action",
      icon: Plus,
      shortcut: "Ctrl+Shift+P",
      keywords: ["purchase", "order", "compra", "orden"],
      action: () => navigate("/purchases/orders/new"),
    },
    {
      id: "action.newProduct",
      label: t("commandPalette.actions.newProduct"),
      category: "action",
      icon: Plus,
      keywords: ["product", "producto", "agregar"],
      action: () => navigate("/inventory/products/new"),
    },
    {
      id: "action.newCustomer",
      label: t("commandPalette.actions.newCustomer"),
      category: "action",
      icon: Plus,
      keywords: ["customer", "cliente", "agregar"],
      action: () => navigate("/crm/customers/new"),
    },

    {
      id: "appearance.toggleTheme",
      label: t("commandPalette.appearance.toggleTheme"),
      category: "appearance",
      icon: Moon,
      shortcut: "Ctrl+Shift+D",
      keywords: ["dark", "light", "tema", "theme", "oscuro"],
      action: cycleTheme,
    },
    {
      id: "appearance.toggleSidebar",
      label: sidebarCollapsed
        ? t("commandPalette.appearance.expandSidebar")
        : t("commandPalette.appearance.collapseSidebar"),
      category: "appearance",
      icon: sidebarCollapsed ? PanelLeft : PanelLeftClose,
      shortcut: "Ctrl+B",
      keywords: ["sidebar", "panel", "menu", "barra"],
      action: toggleSidebar,
    },
  ]
}
