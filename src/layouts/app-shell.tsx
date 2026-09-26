import { Outlet } from "react-router-dom"
import { Sidebar } from "./sidebar"
import { TopBar } from "./top-bar"
import { StatusBar } from "./status-bar"
import { CommandPalette } from "@/components/command-palette"
import { ShortcutProvider } from "@/components/shortcut-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useSettingsStore } from "@/stores"
import { cn } from "@/lib/utils"

export function AppShell() {
  const { sidebarCollapsed } = useSettingsStore()

  return (
    <TooltipProvider>
      <ShortcutProvider />
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <div className={cn(
          "flex min-w-0 flex-1 flex-col overflow-hidden transition-all duration-300",
          sidebarCollapsed ? "ml-16" : "ml-64"
        )}>
          <TopBar />
          <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
            <div className="min-h-full p-6">
              <Outlet />
            </div>
          </main>
          <StatusBar />
        </div>
        <CommandPalette />
      </div>
    </TooltipProvider>
  )
}
