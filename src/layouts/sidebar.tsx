import { useState } from "react"
import { NavLink, useLocation } from "react-router-dom"
import {
  ChevronLeft, ChevronRight, ChevronDown, ChevronRightIcon,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useSettingsStore } from "@/stores"
import { useBusinessCapabilities } from "@/hooks"
import { cn } from "@/lib/utils"
import { navigation, secondaryNavigation } from "@/config/navigation"
import type { NavItemConfig } from "@/config/navigation"

function isActivePath(location: ReturnType<typeof useLocation>, href: string): boolean {
  return location.pathname === href || location.pathname.startsWith(href + "/")
}

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useSettingsStore()
  const capabilities = useBusinessCapabilities()
  const location = useLocation()
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState<string[]>(["/inventory", "/sales", "/purchases"])

  // Single-store hides store-management features; transfers appear only when
  // the profile supports them (derived from the number of stores).
  const gatedNavigation: NavItemConfig[] = navigation
    .map((item) => {
      if (item.href === "/inventory") {
        const children = item.children!.filter((child) => {
          if (child.href === "/inventory/warehouses" || child.href === "/inventory/storage-locations") {
            return capabilities.storeManagement
          }
          if (child.href === "/inventory/transfers") {
            return capabilities.storeTransfers
          }
          return true
        })
        return { ...item, children }
      }
      if (item.href === "/warehouse") {
        return capabilities.storeManagement ? item : null
      }
      return item
    })
    .filter((item): item is NavItemConfig => item !== null)

  const gatedSecondaryNavigation: NavItemConfig[] = secondaryNavigation
    .map((item) => {
      if (item.href === "/reports") {
        const children = item.children!.filter((child) => {
          if (child.href === "/reports/warehouses") return capabilities.crossStoreReports
          return true
        })
        return { ...item, children }
      }
      return item
    })
    .filter((item): item is NavItemConfig => item !== null)

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
          {gatedNavigation.map((item) => (
            <NavItem key={item.href} item={item} />
          ))}
        </nav>

        <Separator className="my-4" />

        <nav className="space-y-1">
          {gatedSecondaryNavigation.map((item) => (
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