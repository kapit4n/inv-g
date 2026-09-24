import { useEffect } from "react"

export interface HotkeyDef {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
}

function parseHotkey(hotkey: string): HotkeyDef {
  const parts = hotkey.toLowerCase().split("+")
  const key = parts[parts.length - 1] ?? ""
  return {
    key,
    ctrl: parts.includes("ctrl") || parts.includes("cmd"),
    shift: parts.includes("shift"),
    alt: parts.includes("alt"),
  }
}

function matchesHotkey(e: KeyboardEvent, def: HotkeyDef): boolean {
  if (e.key.toLowerCase() !== def.key) return false
  if (def.ctrl && !(e.ctrlKey || e.metaKey)) return false
  if (def.shift && !e.shiftKey) return false
  if (def.alt && !e.altKey) return false
  if (def.ctrl && !def.shift && e.shiftKey) return false
  return true
}

export function useHotkey(
  hotkey: string,
  callback: () => void,
  opts?: { enabled?: boolean; deps?: unknown[] }
) {
  const { enabled = true, deps = [] } = opts ?? {}

  useEffect(() => {
    if (!enabled) return

    const def = parseHotkey(hotkey)
    const handler = (e: KeyboardEvent) => {
      if (matchesHotkey(e, def)) {
        e.preventDefault()
        callback()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [hotkey, enabled, callback, ...deps])
}
