import { useMemo } from "react"
import { useBusinessStore } from "@/stores"
import type { BusinessCapabilities } from "@/types"

/**
 * Reactive accessor for the business capabilities (multi-store, store
 * selection, transfers, cross-store reports, ...).
 *
 * Until the business context has hydrated, the conservative single-store
 * defaults are returned so no multi-store-only UI flashes on screen.
 */
export function useBusinessCapabilities(): BusinessCapabilities {
  const capabilities = useBusinessStore((s) => s.capabilities)
  return useMemo(() => capabilities(), [capabilities])
}

export function useCurrentStoreId(): number | null {
  return useBusinessStore((s) => s.currentStoreId)
}

export function useCurrentStore() {
  const currentStore = useBusinessStore((s) => s.currentStore)
  return useMemo(() => currentStore(), [currentStore])
}

export function useIsMultiStore(): boolean {
  const caps = useBusinessCapabilities()
  return caps.multiStore
}