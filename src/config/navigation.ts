import type { ComponentType } from "react"
import {
  LayoutDashboard, ShoppingCart, Package, ShoppingBag, Users, Truck, Car,
  Warehouse, BarChart3, Settings, HelpCircle, UsersRound,
  Layers, Tag, Cog, Briefcase, MapPin, Box, ArrowUpDown,
  FileText, RotateCcw, DollarSign, Printer, Receipt,
  GitCompare, BellRing, ShieldCheck, CreditCard, StickyNote,
  Monitor, HardDrive, Wifi, Database, Shield, Activity,
  Smartphone, ScanLine, Link2, Book, FileSpreadsheet,
} from "lucide-react"

export interface NavChildConfig {
  nameKey: string
  href: string
  icon?: ComponentType<{ className?: string }>
}

export interface NavItemConfig {
  nameKey: string
  href: string
  icon: ComponentType<{ className?: string }>
  children?: NavChildConfig[]
}

export const navigation: NavItemConfig[] = [
  { nameKey: "dashboard.title", href: "/dashboard", icon: LayoutDashboard },
  {
    nameKey: "sales.title", href: "/sales", icon: ShoppingCart,
    children: [
      { nameKey: "sales.pointOfSale", href: "/sales/new", icon: ShoppingCart },
      { nameKey: "sales.salesHistory", href: "/sales", icon: Receipt },
      { nameKey: "sales.quotes", href: "/sales/quotes", icon: FileText },
      { nameKey: "sales.returns", href: "/sales/returns", icon: RotateCcw },
      { nameKey: "sales.cashRegister", href: "/sales/register", icon: DollarSign },
      { nameKey: "sales.receipts", href: "/sales/receipts", icon: Printer },
      { nameKey: "sales.dailyCloseout", href: "/sales/closeout", icon: BarChart3 },
    ],
  },
  {
    nameKey: "inventory.title", href: "/inventory", icon: Package,
    children: [
      { nameKey: "inventory.categories", href: "/inventory/categories", icon: Layers },
      { nameKey: "inventory.brands", href: "/inventory/brands", icon: Tag },
      { nameKey: "inventory.manufacturers", href: "/inventory/manufacturers", icon: Cog },
      { nameKey: "inventory.suppliers", href: "/inventory/suppliers", icon: Briefcase },
      { nameKey: "inventory.warehouses", href: "/inventory/warehouses", icon: Warehouse },
      { nameKey: "inventory.storageLocations", href: "/inventory/storage-locations", icon: MapPin },
      { nameKey: "inventory.products", href: "/inventory/products", icon: Box },
      { nameKey: "inventory.inventoryMovements", href: "/inventory/movements", icon: ArrowUpDown },
      { nameKey: "inventory.storeTransfers", href: "/inventory/transfers", icon: ArrowUpDown },
      { nameKey: "inventory.crossReferences", href: "/inventory/cross-references", icon: Link2 },
      { nameKey: "inventory.importExport", href: "/inventory/import-export", icon: FileSpreadsheet },
    ],
  },
  {
    nameKey: "purchases.title", href: "/purchases", icon: ShoppingBag,
    children: [
      { nameKey: "purchases.dashboard", href: "/purchases", icon: LayoutDashboard },
      { nameKey: "purchases.orders", href: "/purchases/orders", icon: FileText },
      { nameKey: "purchases.requests", href: "/purchases/requests", icon: Layers },
      { nameKey: "purchases.receipts", href: "/purchases/receipts", icon: Package },
      { nameKey: "purchases.returns", href: "/purchases/returns", icon: RotateCcw },
      { nameKey: "purchases.supplierProducts", href: "/purchases/supplier-products", icon: Briefcase },
      { nameKey: "purchases.costHistory", href: "/purchases/cost-history", icon: DollarSign },
      { nameKey: "purchases.reorderSuggestions", href: "/purchases/reorder-suggestions", icon: ArrowUpDown },
    ],
  },
  {
    nameKey: "crm.title", href: "/crm", icon: Users,
    children: [
      { nameKey: "crm.dashboard", href: "/crm", icon: LayoutDashboard },
      { nameKey: "crm.customers", href: "/crm/customers", icon: Users },
      { nameKey: "crm.vehicles", href: "/crm/vehicles", icon: Car },
      { nameKey: "crm.compatibility", href: "/crm/compatibility", icon: GitCompare },
      { nameKey: "crm.reminders", href: "/crm/reminders", icon: BellRing },
      { nameKey: "crm.warranties", href: "/crm/warranties", icon: ShieldCheck },
      { nameKey: "crm.credit", href: "/crm/credit", icon: CreditCard },
      { nameKey: "crm.notes", href: "/crm/notes", icon: StickyNote },
    ],
  },
  { nameKey: "suppliers.title", href: "/suppliers", icon: Truck },
  { nameKey: "part-finder.title", href: "/part-finder", icon: ScanLine },
  { nameKey: "warehouse.title", href: "/warehouse", icon: Warehouse },
]

export const secondaryNavigation: NavItemConfig[] = [
  {
    nameKey: "reports.title", href: "/reports", icon: BarChart3,
    children: [
      { nameKey: "reports.executiveDashboard", href: "/reports", icon: LayoutDashboard },
      { nameKey: "reports.sales", href: "/reports/sales", icon: ShoppingCart },
      { nameKey: "reports.inventory", href: "/reports/inventory", icon: Package },
      { nameKey: "reports.purchasing", href: "/reports/purchasing", icon: ShoppingBag },
      { nameKey: "reports.customers", href: "/reports/customers", icon: Users },
      { nameKey: "reports.suppliers", href: "/reports/suppliers", icon: Truck },
      { nameKey: "reports.warehouses", href: "/reports/warehouses", icon: Warehouse },
      { nameKey: "reports.profitability", href: "/reports/profitability", icon: DollarSign },
      { nameKey: "reports.kpis", href: "/reports/kpis", icon: BarChart3 },
      { nameKey: "reports.customReports", href: "/reports/custom", icon: FileText },
      { nameKey: "reports.scheduledReports", href: "/reports/scheduled", icon: BellRing },
      { nameKey: "reports.exports", href: "/reports/exports", icon: Printer },
    ],
  },
  {
    nameKey: "admin.title", href: "/admin", icon: Shield,
    children: [
      { nameKey: "admin.dashboard", href: "/admin", icon: Monitor },
      { nameKey: "admin.users", href: "/admin/users", icon: Users },
      { nameKey: "admin.roles", href: "/admin/roles", icon: ShieldCheck },
      { nameKey: "admin.permissions", href: "/admin/roles", icon: Shield },
      { nameKey: "admin.settings", href: "/admin/settings", icon: Settings },
      { nameKey: "admin.printers", href: "/admin/printers", icon: Printer },
      { nameKey: "admin.devices", href: "/admin/devices", icon: Smartphone },
      { nameKey: "admin.backups", href: "/admin/backups", icon: HardDrive },
      { nameKey: "admin.restore", href: "/admin/restore", icon: RotateCcw },
      { nameKey: "admin.database", href: "/admin/database", icon: Database },
      { nameKey: "admin.diagnostics", href: "/admin/diagnostics", icon: Activity },
      { nameKey: "admin.audit", href: "/admin/audit", icon: FileText },
      { nameKey: "admin.updates", href: "/admin/updates", icon: Wifi },
      { nameKey: "admin.licensing", href: "/admin/licensing", icon: Shield },
      { nameKey: "admin.maintenance", href: "/admin/maintenance", icon: Cog },
      { nameKey: "admin.about", href: "/admin/about", icon: HelpCircle },
    ],
  },
  { nameKey: "employees.title", href: "/employees", icon: UsersRound },
  { nameKey: "settings.title", href: "/settings", icon: Settings },
  { nameKey: "help.userManual", href: "/manual", icon: Book },
  { nameKey: "help.title", href: "/help", icon: HelpCircle },
]

function flatten(items: NavItemConfig[]): { nameKey: string; href: string }[] {
  return items.flatMap((item) => [item, ...(item.children ?? [])])
}

const allNavItems = [...flatten(navigation), ...flatten(secondaryNavigation)].sort(
  (a, b) => b.href.length - a.href.length
)

/**
 * Resolves the i18n key of the sidebar entry that owns a pathname, matching the
 * longest href prefix so a nested page such as /inventory/manufacturers/1/edit
 * reports "Fabricantes" instead of the parent section.
 */
export function resolveRouteNameKey(pathname: string): string | null {
  const normalized = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname
  for (const item of allNavItems) {
    if (normalized === item.href || normalized.startsWith(item.href + "/")) return item.nameKey
  }
  return null
}
