import { useState, useEffect, useCallback } from "react"
import { getSettings, updateSetting } from "@/lib/tauri"
import type { AppSetting } from "@/types"

export function useSettings() {
  const [settings, setSettings] = useState<AppSetting[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSettings()
      .then(setSettings)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const getValue = useCallback(
    (key: string): string | undefined => {
      return settings.find((s) => s.key === key)?.value
    },
    [settings]
  )

  const updateValue = useCallback(async (key: string, value: string) => {
    await updateSetting(key, value)
    setSettings((prev) =>
      prev.map((s) => (s.key === key ? { ...s, value } : s))
    )
  }, [])

  return { settings, loading, getValue, updateValue }
}

export function useSetting(key: string) {
  const { settings, loading } = useSettings()
  const setting = settings.find((s) => s.key === key)
  return { value: setting?.value, loading }
}

export function useTheme() {
  const { getValue, updateValue } = useSettings()
  return {
    theme: getValue("theme") ?? "system",
    setTheme: (theme: string) => updateValue("theme", theme),
  }
}
