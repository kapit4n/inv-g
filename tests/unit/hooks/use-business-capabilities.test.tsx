import { describe, it, expect, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useState } from "react"
import { useBusinessStore } from "@/stores"
import { useSoleWarehouseId, useSoleWarehouseDefault } from "@/hooks/use-business-capabilities"
import type { BusinessContext } from "@/types"

function context(overrides: Partial<BusinessContext> = {}): BusinessContext {
  return {
    activeProfile: "single-store",
    databasePath: "/tmp/test.db",
    multiStore: false,
    storeCount: 1,
    defaultStoreId: 1,
    capabilities: {
      multiStore: false,
      storeSelection: false,
      storeManagement: false,
      storeTransfers: false,
      crossStoreReports: false,
    },
    stores: [],
    devMode: false,
    ...overrides,
  }
}

function setContext(ctx: BusinessContext | null) {
  useBusinessStore.setState({ context: ctx, loaded: ctx != null })
}

describe("useSoleWarehouseId", () => {
  beforeEach(() => setContext(null))

  it("returns the only warehouse of a single-store instance", () => {
    setContext(context())
    const { result } = renderHook(() => useSoleWarehouseId())
    expect(result.current).toBe(1)
  })

  it("returns null while the business context has not hydrated", () => {
    const { result } = renderHook(() => useSoleWarehouseId())
    expect(result.current).toBeNull()
  })

  it("returns null when the instance has several warehouses", () => {
    // `defaultStoreId` is only filled in for a single active warehouse, so a
    // multi-store instance leaves it null and the user must choose.
    setContext(context({ multiStore: true, storeCount: 3, defaultStoreId: undefined }))
    const { result } = renderHook(() => useSoleWarehouseId())
    expect(result.current).toBeNull()
  })
})

describe("useSoleWarehouseDefault", () => {
  beforeEach(() => setContext(null))

  it("preselects the sole warehouse while nothing is chosen", () => {
    setContext(context())
    const { result } = renderHook(() => {
      const [warehouseId, setWarehouseId] = useState<number | undefined>(undefined)
      useSoleWarehouseDefault(setWarehouseId)
      return warehouseId
    })
    expect(result.current).toBe(1)
  })

  it("leaves the field empty when the instance has several warehouses", () => {
    setContext(context({ multiStore: true, storeCount: 2, defaultStoreId: undefined }))
    const { result } = renderHook(() => {
      const [warehouseId, setWarehouseId] = useState<number | undefined>(undefined)
      useSoleWarehouseDefault(setWarehouseId)
      return warehouseId
    })
    expect(result.current).toBeUndefined()
  })

  it("never overwrites a warehouse already chosen", () => {
    setContext(context())
    const { result } = renderHook(() => {
      const [warehouseId, setWarehouseId] = useState<number | undefined>(7)
      useSoleWarehouseDefault(setWarehouseId)
      return { warehouseId, setWarehouseId }
    })
    expect(result.current.warehouseId).toBe(7)
  })

  it("waits for the record to load before defaulting", () => {
    setContext(context())
    const { result, rerender } = renderHook(
      ({ ready }: { ready: boolean }) => {
        const [warehouseId, setWarehouseId] = useState<number | undefined>(undefined)
        useSoleWarehouseDefault(setWarehouseId, ready)
        return warehouseId
      },
      { initialProps: { ready: false } }
    )
    expect(result.current).toBeUndefined()

    // The record finishes loading and already carries a warehouse: it wins.
    rerender({ ready: true })
    expect(result.current).toBe(1)
  })

  it("keeps a manual choice made after the default was applied", () => {
    setContext(context())
    const { result } = renderHook(() => {
      const [warehouseId, setWarehouseId] = useState<number | undefined>(undefined)
      useSoleWarehouseDefault(setWarehouseId)
      return { warehouseId, setWarehouseId }
    })
    expect(result.current.warehouseId).toBe(1)
    act(() => result.current.setWarehouseId(9))
    expect(result.current.warehouseId).toBe(9)
  })
})
