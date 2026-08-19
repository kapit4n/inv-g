import { useEffect, useCallback } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useSettingsStore } from "@/stores"
import { useHotkey } from "@/hooks/use-hotkey"
import { useCycleTheme } from "@/lib/theme-cycle"

export function ShortcutProvider() {
  const navigate = useNavigate()
  const location = useLocation()
  const { commandPaletteOpen, setCommandPaletteOpen, toggleSidebar } = useSettingsStore()
  const cycleTheme = useCycleTheme()

  const isPosPage = location.pathname === "/sales/new"

  const toggleCommandPalette = useCallback(() => {
    setCommandPaletteOpen(!commandPaletteOpen)
  }, [commandPaletteOpen, setCommandPaletteOpen])

  const focusGlobalSearch = useCallback(() => {
    const searchInput = document.querySelector("[data-testid='global-search']") as HTMLInputElement | null
    if (searchInput) {
      searchInput.focus()
    } else {
      setCommandPaletteOpen(true)
    }
  }, [setCommandPaletteOpen])

  const triggerPrint = useCallback(() => {
    window.dispatchEvent(new CustomEvent("shortcut:print"))
  }, [])

  const triggerSave = useCallback(() => {
    window.dispatchEvent(new CustomEvent("shortcut:save"))
  }, [])

  // Global shortcuts (always active)
  useHotkey("Ctrl+K", toggleCommandPalette, { deps: [toggleCommandPalette] })
  useHotkey("Ctrl+F", focusGlobalSearch, { deps: [focusGlobalSearch] })
  useHotkey("Ctrl+N", () => navigate("/sales/new"))
  useHotkey("Ctrl+Shift+P", () => navigate("/purchases/orders/new"))
  useHotkey("Ctrl+Shift+D", cycleTheme, { deps: [cycleTheme] })
  useHotkey("Ctrl+B", toggleSidebar, { deps: [toggleSidebar] })
  useHotkey("Ctrl+S", triggerSave, { deps: [triggerSave] })
  useHotkey("Ctrl+P", triggerPrint, { deps: [triggerPrint] })

  // Escape: priority order — command palette first, then page-specific
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return

      if (commandPaletteOpen) {
        e.preventDefault()
        setCommandPaletteOpen(false)
        return
      }

      const activeDialog = document.querySelector("[role='dialog'][data-state='open']")
      if (activeDialog) {
        return
      }

      window.dispatchEvent(new CustomEvent("shortcut:escape"))
    }

    window.addEventListener("keydown", handleEscape)
    return () => window.removeEventListener("keydown", handleEscape)
  }, [commandPaletteOpen, setCommandPaletteOpen])

  // POS-specific shortcuts
  useEffect(() => {
    if (!isPosPage) return

    const handlePosShortcut = (e: KeyboardEvent) => {
      if (commandPaletteOpen) return

      if (e.key === "F2") {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent("shortcut:pos", { detail: "product" }))
      } else if (e.key === "F4") {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent("shortcut:pos", { detail: "customer" }))
      } else if (e.key === "F6") {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent("shortcut:pos", { detail: "vehicle" }))
      } else if (e.key === "F10") {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent("shortcut:pos", { detail: "payment" }))
      }
    }

    window.addEventListener("keydown", handlePosShortcut)
    return () => window.removeEventListener("keydown", handlePosShortcut)
  }, [isPosPage, commandPaletteOpen])

  return null
}
