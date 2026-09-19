import { describe, it, expect, beforeEach, vi } from "vitest"
import { useBusinessStore } from "@/stores/business.store"
import { getBusinessContext } from "@/lib/tauri"
import type { BusinessContext } from "@/types"

vi.mock("@/lib/tauri", () => ({
  getBusinessContext: vi.fn(),
}))

const multiStoreContext: BusinessContext = {
  activeProfile: "multi-store",
  databasePath: "/tmp/inventory-gear-multi.db",
  multiStore: true,
  storeCount: 3,
  defaultStoreId: null,
  stores: [
    { id: 1, name: "Central Store", code: "WH-001", isActive: true, isDefault: true },
    { id: 2, name: "North Branch", code: "WH-002", isActive: true, isDefault: false },
    { id: 3, name: "South Branch", code: "WH-003", isActive: true, isDefault: false },
  ],
  capabilities: { multiStore: true, storeSelection: true, storeManagement: true, storeTransfers: true, crossStoreReports: true },
  devMode: true,
}

const singleStoreContext: BusinessContext = {
  ...multiStoreContext,
  activeProfile: "single-store",
  multiStore: false,
  storeCount: 1,
  defaultStoreId: 1,
  stores: multiStoreContext.stores.slice(0, 1),
  capabilities: { multiStore: false, storeSelection: false, storeManagement: false, storeTransfers: false, crossStoreReports: false },
}

describe("BusinessStore", () => {
  beforeEach(() => {
    useBusinessStore.setState({ context: null, loaded: false, loading: false, currentStoreId: null })
    localStorage.clear()
    vi.mocked(getBusinessContext).mockReset()
  })

  it("hydrates context and picks the persisted store in multi-store mode", async () => {
    localStorage.setItem("ig.currentStoreId", "2")
    vi.mocked(getBusinessContext).mockResolvedValue(multiStoreContext)
    await useBusinessStore.getState().hydrate()

    expect(useBusinessStore.getState().context?.multiStore).toBe(true)
    expect(useBusinessStore.getState().currentStoreId).toBe(2)
    expect(useBusinessStore.getState().loaded).toBe(true)
  })

  it("single-store always resolves to the only store, ignoring persisted selection", async () => {
    localStorage.setItem("ig.currentStoreId", "999")
    vi.mocked(getBusinessContext).mockResolvedValue(singleStoreContext)
    await useBusinessStore.getState().hydrate()

    expect(useBusinessStore.getState().currentStoreId).toBe(1)
  })

  it("defaults to the first store when no valid persisted selection exists", async () => {
    vi.mocked(getBusinessContext).mockResolvedValue(multiStoreContext)
    await useBusinessStore.getState().hydrate()

    expect(useBusinessStore.getState().currentStoreId).toBe(1)
  })

  it("selectStore updates the current store only when selection is supported", async () => {
    vi.mocked(getBusinessContext).mockResolvedValue(multiStoreContext)
    await useBusinessStore.getState().hydrate()

    useBusinessStore.getState().selectStore(3)
    expect(useBusinessStore.getState().currentStoreId).toBe(3)
    expect(localStorage.getItem("ig.currentStoreId")).toBe("3")
  })

  it("selectStore is a no-op in single-store mode", async () => {
    vi.mocked(getBusinessContext).mockResolvedValue(singleStoreContext)
    await useBusinessStore.getState().hydrate()

    useBusinessStore.getState().selectStore(3)
    expect(useBusinessStore.getState().currentStoreId).toBe(1)
  })

  it("capabilities() fall back to conservative single-store before hydration", () => {
    const caps = useBusinessStore.getState().capabilities()
    expect(caps.multiStore).toBe(false)
    expect(caps.storeSelection).toBe(false)
  })

  it("currentStore() returns the selected store", async () => {
    vi.mocked(getBusinessContext).mockResolvedValue(multiStoreContext)
    await useBusinessStore.getState().hydrate()
    useBusinessStore.getState().selectStore(2)

    expect(useBusinessStore.getState().currentStore()?.name).toBe("North Branch")
  })
})