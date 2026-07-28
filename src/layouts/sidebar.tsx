import { NavLink, useLocation } from "react-router-dom"
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  ShoppingBag,
  Users,
  Truck,
  Car,
  Warehouse,
  BarChart3,
  Settings,
  HelpCircle,
  UsersRound,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useSettingsStore } from "@/stores"
import { cn } from "@/lib/utils"

const navigation = [
  { nameKey: "dashboard.title", href: "/dashboard", icon: LayoutDashboard },
  { nameKey: "sales.title", href: "/sales", icon: ShoppingCart },
  { nameKey: "inventory.title", href: "/inventory", icon: Package },
  { nameKey: "purchases.title", href: "/purchases", icon: ShoppingBag },
  { nameKey: "customers.title", href: "/customers", icon: Users },
  { nameKey: "suppliers.title", href: "/suppliers", icon: Truck },
  { nameKey: "vehicles.title", href: "/vehicles", icon: Car },
  { nameKey: "warehouse.title", href: "/warehouse", icon: Warehouse },
]

const secondaryNavigation = [
  { nameKey: "reports.title", href: "/reports", icon: BarChart3 },
  { nameKey: "employees.title", href: "/employees", icon: UsersRound },
  { nameKey: "settings.title", href: "/settings", icon: Settings },
  { nameKey: "help.title", href: "/help", icon: HelpCircle },
]

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useSettingsStore()
  const location = useLocation()
  const { t } = useTranslation()

  const NavItem = ({ item }: { item: typeof navigation[0] }) => {
    const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + "/")
    const Icon = item.icon

    const link = (
      <NavLink
        to={item.href}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
          isActive
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {!sidebarCollapsed && <span>{t(item.nameKey)}</span>}
      </NavLink>
    )

    if (sidebarCollapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{link}</TooltipTrigger>
          <TooltipContent side="right">{t(item.nameKey)}</TooltipContent>
        </Tooltip>
      )
    }

    return link
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
