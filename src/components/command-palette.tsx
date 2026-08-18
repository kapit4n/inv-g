import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Search } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useSettingsStore } from "@/stores"
import { cn } from "@/lib/utils"
import { useHotkey } from "@/hooks/use-hotkey"
import { buildCommands, commandCategories } from "@/lib/command-palette/commands"
import type { Command, CommandCategory } from "@/lib/command-palette/types"

export function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen, sidebarCollapsed, toggleSidebar } = useSettingsStore()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [query, setQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const cycleTheme = useCallback(() => {
    const root = document.documentElement
    const current = root.classList.contains("dark") ? "dark" : root.classList.contains("light") ? "light" : "system"
    const themes = ["light", "dark", "system"] as const
    const idx = themes.indexOf(current)
    const next = themes[(idx + 1) % themes.length]
    root.classList.remove("light", "dark")
    root.setAttribute("data-theme", next)
    if (next === "dark") root.classList.add("dark")
    else if (next === "light") root.classList.remove("dark")
  }, [])

  const commands = useMemo(
    () => buildCommands({ navigate, cycleTheme, sidebarCollapsed, toggleSidebar, t }),
    [navigate, cycleTheme, sidebarCollapsed, toggleSidebar, t]
  )

  const filtered = useMemo(() => {
    if (!query.trim()) return commands
    const q = query.toLowerCase()
    return commands.filter((cmd) => {
      if (cmd.label.toLowerCase().includes(q)) return true
      if (cmd.id.toLowerCase().includes(q)) return true
      if (cmd.keywords?.some((kw) => kw.includes(q))) return true
      return false
    })
  }, [commands, query])

  const grouped = useMemo(() => {
    const groups: Record<CommandCategory, Command[]> = {
      navigation: [],
      action: [],
      appearance: [],
    }
    for (const cmd of filtered) {
      groups[cmd.category].push(cmd)
    }
    return groups
  }, [filtered])

  const flatFiltered = useMemo(() => filtered, [filtered])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery("")
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [commandPaletteOpen])

  useHotkey("Ctrl+K", () => setCommandPaletteOpen(!commandPaletteOpen), { deps: [commandPaletteOpen, setCommandPaletteOpen] })
  useHotkey("Ctrl+N", () => navigate("/sales/new"))
  useHotkey("Ctrl+Shift+P", () => navigate("/purchases/orders/new"))
  useHotkey("Ctrl+Shift+D", cycleTheme)
  useHotkey("Ctrl+B", toggleSidebar)

  const executeCommand = useCallback(
    (cmd: Command) => {
      cmd.action()
      setCommandPaletteOpen(false)
    },
    [setCommandPaletteOpen]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex((i) => Math.min(i + 1, flatFiltered.length - 1))
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((i) => Math.max(i - 1, 0))
      } else if (e.key === "Enter") {
        e.preventDefault()
        if (flatFiltered[selectedIndex]) {
          executeCommand(flatFiltered[selectedIndex])
        }
      } else if (e.key === "Escape") {
        setCommandPaletteOpen(false)
      }
    },
    [flatFiltered, selectedIndex, executeCommand, setCommandPaletteOpen]
  )

  useEffect(() => {
    const handleGlobalEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && commandPaletteOpen) {
        e.preventDefault()
        setCommandPaletteOpen(false)
      }
    }
    window.addEventListener("keydown", handleGlobalEscape)
    return () => window.removeEventListener("keydown", handleGlobalEscape)
  }, [commandPaletteOpen, setCommandPaletteOpen])

  useEffect(() => {
    if (listRef.current) {
      const selected = listRef.current.querySelector(`[data-command-index="${selectedIndex}"]`)
      if (selected && typeof selected.scrollIntoView === "function") {
        selected.scrollIntoView({ block: "nearest" })
      }
    }
  }, [selectedIndex])

  let runningIndex = -1

  return (
    <Dialog open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
      <DialogContent
        className="p-0 max-w-lg gap-0"
        onPointerDownOutside={() => setCommandPaletteOpen(false)}
      >
        <div className="flex items-center border-b px-3">
          <Search className="h-4 w-4 text-muted-foreground mr-2 shrink-0" />
          <input
            ref={inputRef}
            placeholder={t("commandPalette.placeholder")}
            className="flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
            Esc
          </kbd>
        </div>

        <div ref={listRef} className="max-h-80 overflow-auto p-1.5" role="listbox">
          {flatFiltered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {t("commandPalette.noResults")}
            </p>
          ) : (
            commandCategories.map((cat) => {
              const items = grouped[cat.id]
              if (!items.length) return null
              return (
                <div key={cat.id} className="mb-1">
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                    {t(cat.label)}
                  </div>
                  {items.map((cmd) => {
                    runningIndex++
                    const idx = runningIndex
                    const isSelected = idx === selectedIndex
                    return (
                      <div
                        key={cmd.id}
                        data-command-index={idx}
                        role="option"
                        aria-selected={isSelected}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors",
                          isSelected
                            ? "bg-accent text-accent-foreground"
                            : "text-foreground hover:bg-accent/50"
                        )}
                        onClick={() => executeCommand(cmd)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                      >
                        <cmd.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="flex-1 truncate">{cmd.label}</span>
                        {cmd.shortcut && (
                          <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                            {cmd.shortcut}
                          </kbd>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })
          )}
        </div>

        <div className="flex items-center justify-between border-t px-3 py-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="rounded border bg-muted px-1 py-0.5 text-[10px] font-mono">↑↓</kbd>
              {t("commandPalette.navigate")}
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border bg-muted px-1 py-0.5 text-[10px] font-mono">↵</kbd>
              {t("commandPalette.select")}
            </span>
          </div>
          <Badge variant="secondary" className="text-[10px]">
            {flatFiltered.length} {t("commandPalette.results")}
          </Badge>
        </div>
      </DialogContent>
    </Dialog>
  )
}
