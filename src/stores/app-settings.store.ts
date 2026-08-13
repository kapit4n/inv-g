import { create } from "zustand"
import { getAppSettings } from "@/lib/tauri"
import type { AdminAppSetting } from "@/types"

interface AppSettingsStore {
  settings: AdminAppSetting[]
  loaded: boolean
  loading: boolean
  hydrate: () => Promise<void>
  getValue: (key: string) => string | undefined
  setValue: (key: string, value: string) => void
}

export const useAppSettingsStore = create<AppSettingsStore>()((set, get) => ({
  settings: [],
  loaded: false,
  loading: false,
  hydrate: async () => {
    if (get().loaded) return
    set({ loading: true })
    try {
      const settings = await getAppSettings()
      set({ settings, loaded: true })
    } finally {
      set({ loading: false })
    }
  },
  getValue: (key) => get().settings.find((s) => s.key === key)?.value,
  setValue: (key, value) =>
    set((state) => ({
      settings: state.settings.map((s) => (s.key === key ? { ...s, value } : s)),
    })),
}))
