import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useLocation, useNavigate } from "react-router-dom"
import {
  Bell,
  Moon,
  Sun,
  Monitor,
  Search,
  LogOut,
  User,
  Settings,
  ChevronDown,
  Database,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import type { Theme } from "@/types"
import { useThemeStore, useSettingsStore, useAuthStore, useNotificationStore, useAppSettingsStore, useBusinessStore } from "@/stores"
import { useAuth } from "@/hooks"
import { runSeeds } from "@/lib/tauri"
import { NotificationPanel } from "@/components/notification-panel"
import { StoreSelector } from "@/components/store-selector"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { resolveRouteNameKey } from "@/config/navigation"

/**
 * Section labels used when a route has no sidebar entry of its own, so an
 * unmapped page never borrows the dashboard title.
 */
const sectionNameKeys: Record<string, string> = {
  dashboard: "dashboard.title",
  sales: "sales.title",
  inventory: "inventory.title",
  purchases: "purchases.title",
  crm: "crm.title",
  suppliers: "suppliers.title",
  "part-finder": "part-finder.title",
  warehouse: "warehouse.title",
  reports: "reports.title",
  employees: "employees.title",
  settings: "settings.title",
  manual: "help.userManual",
  help: "help.title",
}

export function TopBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { theme, setTheme } = useThemeStore()
  const { setCommandPaletteOpen } = useSettingsStore()
  const { user } = useAuthStore()
  const { logout } = useAuth()
  const { unreadCount } = useNotificationStore()
  const storeName = useAppSettingsStore((s) => s.getValue("store_name"))
  const storeSelectionEnabled = useBusinessStore((s) => s.context?.capabilities.storeSelection ?? false)
  const [seeding, setSeeding] = useState(false)

  const themes = ["light", "dark", "system"] as const

  const cycleTheme = () => {
    const idx = themes.indexOf(theme as typeof themes[number])
    const next = themes[idx === -1 ? 0 : (idx + 1) % themes.length]
    setTheme(next as Theme)
  }

  const sectionKey = location.pathname.split("/")[1] ?? ""
  const currentPageKey =
    resolveRouteNameKey(location.pathname) ??
    sectionNameKeys[sectionKey] ??
    "dashboard.title"
  const ThemeIcon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/80 backdrop-blur-sm px-6">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold">{t(currentPageKey)}</h2>
        <StoreSelector />
        {!storeSelectionEnabled && storeName && (
          <>
            <span className="text-muted-foreground/40">·</span>
            <span className="text-xs text-muted-foreground">{storeName}</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground gap-2"
          onClick={() => setCommandPaletteOpen(true)}
        >
          <Search className="h-4 w-4" />
          <span className="hidden md:inline">{t("common.search")}</span>
          <kbd className="hidden md:inline-flex items-center rounded border bg-muted px-1.5 py-0.5 text-[10px] font-mono">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>

        <Button variant="ghost" size="icon" onClick={cycleTheme}>
          <ThemeIcon className="h-4 w-4" />
        </Button>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <NotificationPanel />
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2 px-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {user?.fullName?.charAt(0) || "A"}
                </AvatarFallback>
              </Avatar>
              <span className="hidden md:inline text-sm font-medium">{user?.fullName || "Admin"}</span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user?.fullName || "Admin"}</p>
                <p className="text-xs text-muted-foreground">{user?.email || "admin@inventorygear.com"}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              <User className="mr-2 h-4 w-4" />
              {t("common.profile")}
              <Badge variant="secondary" className="ml-auto text-[10px]">{t("common.comingSoon")}</Badge>
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              <Settings className="mr-2 h-4 w-4" />
              {t("common.settings")}
              <Badge variant="secondary" className="ml-auto text-[10px]">{t("common.comingSoon")}</Badge>
            </DropdownMenuItem>
            {/* Development-only: `run_seeds` shells out to `npx`, which does not
                exist on an end user's machine. The in-app demo catalog under
                Inventario → Importar/Exportar is the supported path and is pure
                Rust, so it works in production. */}
            {import.meta.env.DEV && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={async () => { setSeeding(true); try { await runSeeds(); alert("Seed completed!"); } catch (e) { alert("Seed failed: " + e); } finally { setSeeding(false); } }}>
                  {seeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
                  {seeding ? "Seeding..." : "Seed Demo Data"}
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={async () => { await logout(); navigate("/login", { replace: true }) }}>
              <LogOut className="mr-2 h-4 w-4" />
              {t("auth.logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
