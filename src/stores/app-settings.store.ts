import { create } from "zustand"
import { getAppSettings } from "@/lib/tauri"
import { CURRENCY_SETTING_KEY, setActiveCurrency } from "@/lib/currency"
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
      // Every `formatCurrency` call site reads the currency from here, so the
      // persisted value has to be pushed into the module on load or the app
      // renders USD until something else happens to set it.
      const currency = settings.find((s) => s.key === CURRENCY_SETTING_KEY)?.value
      if (currency) setActiveCurrency(currency)
      set({ settings, loaded: true })
    } finally {
      set({ loading: false })
    }
  },
  getValue: (key) => get().settings.find((s) => s.key === key)?.value,
  /**
   * Upserts rather than patching in place.
   *
   * `hydrate()` is fire-and-forget in a `useEffect` in `App.tsx`, so the router
   * renders before the rows arrive. An admin who reaches Settings, flips
   * "Activar módulo de compras" and saves inside that window used to write the
   * flag to SQLite and update nothing in memory: `map` over an empty array
   * changes nothing, and the page still showed the switch in its new position
   * because the control keeps its own local state. The module then stayed
   * visible with no way to tell that the save had been dropped -- the exact
   * symptom reported for the module toggles.
   *
   * The row is only a stand-in for a value the backend has already persisted;
   * `hydrate()` replaces the whole array with the real rows once it resolves.
   */
  setValue: (key, value) => {
    if (key === CURRENCY_SETTING_KEY) setActiveCurrency(value)
    set((state) => {
      const existing = state.settings.find((s) => s.key === key)
      if (existing) {
        return { settings: state.settings.map((s) => (s.key === key ? { ...s, value } : s)) }
      }
      const now = new Date().toISOString()
      return {
        settings: [
          ...state.settings,
          {
            id: -1,
            category: "",
            key,
            value,
            settingType: "string",
            isSystem: false,
            sortOrder: 0,
            createdAt: now,
            updatedAt: now,
          },
        ],
      }
    })
  },
}))
