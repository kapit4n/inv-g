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
  refresh: () => Promise<void>
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

/**
 * Which store the app operates on.
 *
 * A single active store always wins, so the app never shows a selector for a
 * choice that does not exist. Only when selection is possible — two or more
 * active stores — does a saved choice apply, and an expired choice (the store it
 * pointed at has since been deactivated or deleted) falls back to the first
 * active one instead of leaving a dangling id in the store.
 */
function resolveCurrentStoreId(context: BusinessContext): number | null {
  if (context.defaultStoreId != null) {
    return context.defaultStoreId
  }
  if (context.stores.length === 0) {
    return null
  }
  return readSavedStoreId(context.stores) ?? context.stores[0]!.id
}

async function fetchContext(): Promise<BusinessContext> {
  return getBusinessContext()
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
      const context = await fetchContext()
      set({ context, currentStoreId: resolveCurrentStoreId(context), loaded: true })
    } finally {
      set({ loading: false })
    }
  },

  /**
   * Re-reads the context, unlike `hydrate` which only ever runs once.
   *
   * Creating, deactivating or deleting a store changes how many active stores
   * there are, and that count is what decides single vs multi store mode. Without
   * this, the store selector would keep offering a store that was just
   * deactivated until the app was restarted.
   */
  refresh: async () => {
    set({ loading: true })
    try {
      const context = await fetchContext()
      set({ context, currentStoreId: resolveCurrentStoreId(context), loaded: true })
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