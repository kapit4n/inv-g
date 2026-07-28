import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Search } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { useSettingsStore } from "@/stores"

export function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen } = useSettingsStore()
  const { t } = useTranslation()
  const [query, setQuery] = useState("")

  const commands = [
    { label: `${t("common.goTo")} ${t("dashboard.title")}`, category: "Navigation" },
    { label: `${t("common.goTo")} ${t("inventory.title")}`, category: "Navigation" },
    { label: `${t("common.goTo")} ${t("sales.title")}`, category: "Navigation" },
    { label: `${t("common.goTo")} ${t("customers.title")}`, category: "Navigation" },
    { label: `${t("common.goTo")} ${t("suppliers.title")}`, category: "Navigation" },
    { label: `${t("common.goTo")} ${t("reports.title")}`, category: "Navigation" },
    { label: `${t("common.goTo")} ${t("settings.title")}`, category: "Navigation" },
    { label: `${t("common.toggle")} ${t("settings.darkMode")}`, category: "Appearance" },
  ]

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setCommandPaletteOpen(!commandPaletteOpen)
      }
      if (e.key === "Escape") {
        setCommandPaletteOpen(false)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [commandPaletteOpen, setCommandPaletteOpen])

  const filteredCommands = commands.filter((cmd) =>
    cmd.label.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <Dialog open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
      <DialogContent className="p-0 max-w-md">
        <div className="flex items-center border-b px-4">
          <Search className="h-4 w-4 text-muted-foreground mr-2" />
          <input
            placeholder={t("common.typeToSearch")}
            className="flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>
        <div className="max-h-80 overflow-auto p-2">
          {filteredCommands.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">{t("common.noCommandsFound")}</p>
          ) : (
            <div className="space-y-1">
              {filteredCommands.map((cmd, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-accent cursor-pointer transition-colors"
                >
                  <span>{cmd.label}</span>
                  <span className="text-xs text-muted-foreground">{cmd.category}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="border-t px-4 py-2 text-xs text-muted-foreground">
          {t("common.pressToClose")}
        </div>
      </DialogContent>
    </Dialog>
  )
}
