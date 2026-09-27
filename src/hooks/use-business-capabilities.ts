import { useEffect, useMemo } from "react"
import type { Dispatch, SetStateAction } from "react"
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

/**
 * The instance's only warehouse, or `null` when it has more than one.
 *
 * A store *is* a warehouse: `business.rs` builds its store list from the
 * `warehouses` table, and the backend only fills `defaultStoreId` when the
 * instance has a single active warehouse. That is exactly the "nothing to
 * choose" case, so it is what forms should preselect.
 *
 * `useCurrentStoreId` is deliberately not reused here. It also falls back to the
 * first store in a multi-store instance, and silently preselecting one of
 * several warehouses would bury a choice the user still has to make.
 */
export function useSoleWarehouseId(): number | null {
  return useBusinessStore((s) => s.context?.defaultStoreId ?? null)
}

/**
 * Preselects the sole warehouse for as long as nothing has been chosen.
 *
 * `ready` defers the effect until the record being edited has finished loading,
 * so a warehouse already stored on the record always wins over the default. The
 * state is only ever written while it is still `undefined`, so a later manual
 * choice is never overwritten.
 */
export function useSoleWarehouseDefault(
  setSelected: Dispatch<SetStateAction<number | undefined>>,
  ready = true,
): void {
  const soleId = useSoleWarehouseId()
  useEffect(() => {
    if (!ready || soleId == null) return
    setSelected((current) => current ?? soleId)
  }, [ready, soleId, setSelected])
}
