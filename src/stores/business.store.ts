import { create } from "zustand"
import { getBusinessContext } from "@/lib/tauri"
import type { BusinessContext, BusinessCapabilities, BusinessStoreInfo } from "@/types"

const STORE_SELECTION_KEY = "ig.currentStoreId"

const CONSERVATIVE_CAPABILITIES: BusinessCapabilities = {
  multiStore: false,
  storeSelection: false,
  storeManagement: false,
  storeTransfers: false,
  crossStoreReports: false,
}

interface BusinessStore {
  context: BusinessContext | null
  loaded: boolean
  loading: boolean
  currentStoreId: number | null
  hydrate: () => Promise<void>
  selectStore: (storeId: number) => void
  capabilities: () => BusinessCapabilities
  currentStore: () => BusinessStoreInfo | null
}

function readSavedStoreId(stores: BusinessStoreInfo[]): number | null {
  try {
    const saved = Number(localStorage.getItem(STORE_SELECTION_KEY))
    return stores.some((s) => s.id === saved) ? saved : null
  } catch {
    return null
  }
}

export const useBusinessStore = create<BusinessStore>()((set, get) => ({
  context: null,
  loaded: false,
  loading: false,
  currentStoreId: null,

  hydrate: async () => {
    if (get().loaded) return
    set({ loading: true })
    try {
      const context = await getBusinessContext()
      let effective: number | null = null
      if (context.defaultStoreId != null) {
        // Single-store (no selection): the only store wins.
        effective = context.defaultStoreId
      } else if (context.stores.length > 0) {
        effective = readSavedStoreId(context.stores) ?? context.stores[0]!.id
      }
      set({ context, currentStoreId: effective, loaded: true })
    } finally {
      set({ loading: false })
    }
  },

  selectStore: (storeId) => {
    const context = get().context
    if (context && !context.capabilities.storeSelection) return
    set({ currentStoreId: storeId })
    try {
      localStorage.setItem(STORE_SELECTION_KEY, String(storeId))
    } catch {
      /* non-browser env */
    }
  },

  capabilities: () => get().context?.capabilities ?? CONSERVATIVE_CAPABILITIES,

  currentStore: () => {
    const { context, currentStoreId } = get()
    if (!context) return null
    return context.stores.find((s) => s.id === currentStoreId) ?? context.stores[0] ?? null
  },
}))