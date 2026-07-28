import { useTranslation } from "react-i18next"
import { useLocation } from "react-router-dom"
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
import { useThemeStore, useSettingsStore, useAuthStore, useNotificationStore } from "@/stores"
import { NotificationPanel } from "@/components/notification-panel"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

const routeNameKeys: Record<string, string> = {
  "/dashboard": "dashboard.title",
  "/sales": "sales.title",
  "/inventory": "inventory.title",
  "/purchases": "purchases.title",
  "/customers": "customers.title",
  "/suppliers": "suppliers.title",
  "/vehicles": "vehicles.title",
  "/warehouse": "warehouse.title",
  "/reports": "reports.title",
  "/employees": "employees.title",
  "/settings": "settings.title",
  "/help": "help.title",
}

export function TopBar() {
  const location = useLocation()
  const { t } = useTranslation()
  const { theme, setTheme } = useThemeStore()
  const { setCommandPaletteOpen } = useSettingsStore()
  const { user } = useAuthStore()
  const { unreadCount } = useNotificationStore()

  const themes = ["light", "dark", "system"] as const

  const cycleTheme = () => {
    const idx = themes.indexOf(theme as typeof themes[number])
    const next = themes[idx === -1 ? 0 : (idx + 1) % themes.length]
    setTheme(next as Theme)
  }

  const currentPageKey = routeNameKeys[location.pathname] || "dashboard.title"
  const ThemeIcon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/80 backdrop-blur-sm px-6">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold">{t(currentPageKey)}</h2>
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
                  {user?.name?.charAt(0) || "A"}
                </AvatarFallback>
              </Avatar>
              <span className="hidden md:inline text-sm font-medium">{user?.name || "Admin"}</span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user?.name || "Admin"}</p>
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
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              {t("auth.logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
