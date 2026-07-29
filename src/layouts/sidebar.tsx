import { useState } from "react"
import { NavLink, useLocation } from "react-router-dom"
import {
  LayoutDashboard, ShoppingCart, Package, ShoppingBag, Users, Truck, Car,
  Warehouse, BarChart3, Settings, HelpCircle, UsersRound,
  ChevronLeft, ChevronRight, ChevronDown, ChevronRight as ChevronRightIcon,
  Layers, Tag, Cog, Briefcase, MapPin, Box, ArrowUpDown,
  FileText, RotateCcw, DollarSign, Printer, Receipt,
  GitCompare, BellRing, ShieldCheck, CreditCard, StickyNote,
  TrendingUp, Monitor, HardDrive, Wifi, Database, Shield, Activity,
  Smartphone, ScanLine,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useSettingsStore } from "@/stores"
import { cn } from "@/lib/utils"

interface NavItemConfig {
  nameKey: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  children?: { nameKey: string; href: string; icon?: React.ComponentType<{ className?: string }> }[]
}

const navigation: NavItemConfig[] = [
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
  { nameKey: "warehouse.title", href: "/warehouse", icon: Warehouse },
]

const secondaryNavigation: NavItemConfig[] = [
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
  { nameKey: "help.title", href: "/help", icon: HelpCircle },
]

function isActivePath(location: ReturnType<typeof useLocation>, href: string): boolean {
  return location.pathname === href || location.pathname.startsWith(href + "/")
}

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useSettingsStore()
  const location = useLocation()
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState<string[]>(["/inventory", "/sales", "/purchases"])

  const toggleExpand = (href: string) => {
    setExpanded((prev) =>
      prev.includes(href) ? prev.filter((h) => h !== href) : [...prev, href]
    )
  }

  const NavLinkContent = ({ item }: { item: NavItemConfig }) => {
    const Icon = item.icon
    return (
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4 shrink-0" />
        {!sidebarCollapsed && <span>{t(item.nameKey)}</span>}
      </div>
    )
  }

  const NavItem = ({ item }: { item: NavItemConfig }) => {
    const isActive = isActivePath(location, item.href)
    const hasChildren = !!item.children?.length
    const isExpanded = expanded.includes(item.href)

    const link = (
      <div
        className={cn(
          "flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 cursor-pointer",
          isActive
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        )}
      >
        <NavLinkContent item={item} />
        {hasChildren && !sidebarCollapsed && (
          <button onClick={(e) => { e.stopPropagation(); toggleExpand(item.href) }}>
            {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRightIcon className="h-3 w-3" />}
          </button>
        )}
      </div>
    )

    return (
      <div>
        {sidebarCollapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <NavLink to={item.href} className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200", isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground")}>
                <item.icon className="h-4 w-4 shrink-0" />
              </NavLink>
            </TooltipTrigger>
            <TooltipContent side="right">{t(item.nameKey)}</TooltipContent>
          </Tooltip>
        ) : (
          <NavLink to={item.href} className="block">
            {link}
          </NavLink>
        )}
        {hasChildren && isExpanded && !sidebarCollapsed && (
          <div className="ml-4 mt-1 space-y-1 border-l pl-3">
            {item.children!.map((child) => {
              const childActive = isActivePath(location, child.href)
              const ChildIcon = child.icon
              return (
                <NavLink
                  key={child.href}
                  to={child.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm transition-all duration-200",
                    childActive
                      ? "bg-primary/5 text-primary font-medium"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  {ChildIcon && <ChildIcon className="h-3.5 w-3.5 shrink-0" />}
                  <span>{t(child.nameKey)}</span>
                </NavLink>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-300",
        sidebarCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-14 items-center border-b px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
            IG
          </div>
          {!sidebarCollapsed && (
            <span className="text-sm font-bold tracking-tight">{t("common.appName")}</span>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navigation.map((item) => (
            <NavItem key={item.href} item={item} />
          ))}
        </nav>

        <Separator className="my-4" />

        <nav className="space-y-1">
          {secondaryNavigation.map((item) => (
            <NavItem key={item.href} item={item} />
          ))}
        </nav>
      </ScrollArea>

      <div className="border-t p-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center"
          onClick={toggleSidebar}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span className="ml-1">{t("common.toggle")}</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  )
}