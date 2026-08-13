import { describe, it, expect, beforeEach, vi } from "vitest"
import { useAppSettingsStore } from "@/stores/app-settings.store"
import { getAppSettings } from "@/lib/tauri"
import type { AdminAppSetting } from "@/types"

const mockSettings: AdminAppSetting[] = [
  { id: 1, category: "company", key: "business_name", value: "Autopartes Test", settingType: "string", isSystem: false, sortOrder: 1, createdAt: "2025-01-01T00:00:00Z", updatedAt: "2025-01-01T00:00:00Z" },
  { id: 2, category: "tax", key: "tax_rate", value: "16", settingType: "number", isSystem: true, sortOrder: 1, createdAt: "2025-01-01T00:00:00Z", updatedAt: "2025-01-01T00:00:00Z" },
]

vi.mock("@/lib/tauri", () => ({
  getAppSettings: vi.fn(),
}))

describe("AppSettingsStore", () => {
  beforeEach(() => {
    useAppSettingsStore.setState({ settings: [], loaded: false, loading: false })
    vi.mocked(getAppSettings).mockReset()
  })

  it("hydrates settings from the backend exactly once", async () => {
    vi.mocked(getAppSettings).mockResolvedValue(mockSettings)
    await useAppSettingsStore.getState().hydrate()
    expect(useAppSettingsStore.getState().settings).toHaveLength(2)
    expect(useAppSettingsStore.getState().loaded).toBe(true)

    await useAppSettingsStore.getState().hydrate()
    expect(getAppSettings).toHaveBeenCalledTimes(1)
  })

  it("getValue returns the value for a known key", async () => {
    vi.mocked(getAppSettings).mockResolvedValue(mockSettings)
    await useAppSettingsStore.getState().hydrate()
    expect(useAppSettingsStore.getState().getValue("tax_rate")).toBe("16")
    expect(useAppSettingsStore.getState().getValue("missing")).toBeUndefined()
  })

  it("setValue patches a setting value in place", async () => {
    vi.mocked(getAppSettings).mockResolvedValue(mockSettings)
    await useAppSettingsStore.getState().hydrate()
    useAppSettingsStore.getState().setValue("tax_rate", "18")
    expect(useAppSettingsStore.getState().getValue("tax_rate")).toBe("18")
  })
})
