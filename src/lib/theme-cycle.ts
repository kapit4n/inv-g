import { useThemeStore } from "@/stores"

const THEMES = ["light", "dark", "system"] as const

export type Theme = (typeof THEMES)[number]

export function cycleTheme(): Theme {
  const root = document.documentElement
  const current: Theme = root.classList.contains("dark")
    ? "dark"
    : root.classList.contains("light")
      ? "light"
      : "system"
  const idx = THEMES.indexOf(current)
  const next = THEMES[(idx + 1) % THEMES.length]
  root.classList.remove("light", "dark")
  root.setAttribute("data-theme", next)
  if (next === "dark") root.classList.add("dark")
  else if (next === "light") root.classList.remove("dark")
  return next
}

export function useCycleTheme() {
  const setTheme = useThemeStore((s) => s.setTheme)

  return () => {
    const next = cycleTheme()
    setTheme(next)
  }
}
