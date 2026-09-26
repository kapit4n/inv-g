import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, fireEvent, waitFor } from "@tests/helpers/render"
import { setupI18n } from "@/i18n"
import { AdminSettingsPage } from "@/features/admin/pages/admin-settings-page"
import { getAppSettings, getSettingCategories, updateAppSettingsBulk } from "@/lib/tauri"
import { useAppSettingsStore } from "@/stores"
import type { AdminAppSetting } from "@/types"

const companySettings: AdminAppSetting[] = [
  { id: 1, category: "company", key: "business_name", value: "Autopartes Test", settingType: "string", description: "Legal business name", isSystem: false, sortOrder: 1, createdAt: "2025-01-01T00:00:00Z", updatedAt: "2025-01-01T00:00:00Z" },
  { id: 2, category: "company", key: "tax_id", value: "ABC-123", settingType: "string", description: "Tax ID", validation: '{"maxLength":30}', isSystem: false, sortOrder: 2, createdAt: "2025-01-01T00:00:00Z", updatedAt: "2025-01-01T00:00:00Z" },
]

const businessSettings: AdminAppSetting[] = [
  { id: 5, category: "business", key: "default_margin_percent", value: "30", settingType: "number", description: "Default sale margin percentage", validation: '{"min":0,"max":90}', isSystem: false, sortOrder: 1, createdAt: "2025-01-01T00:00:00Z", updatedAt: "2025-01-01T00:00:00Z" },
]

const moduleSettings: AdminAppSetting[] = [
  { id: 6, category: "business", key: "enable_purchasing", value: "true", settingType: "boolean", description: "Enable purchasing module", isSystem: true, sortOrder: 1, createdAt: "2025-01-01T00:00:00Z", updatedAt: "2025-01-01T00:00:00Z" },
]

const taxSettings: AdminAppSetting[] = [
  { id: 3, category: "tax", key: "tax_rate", value: "16", settingType: "number", description: "Tax rate (%)", validation: '{"min":0,"max":100}', isSystem: true, sortOrder: 1, createdAt: "2025-01-01T00:00:00Z", updatedAt: "2025-01-01T00:00:00Z" },
  { id: 4, category: "tax", key: "business_type", value: "auto_parts", settingType: "string", description: "Business type", options: '{"options":["auto_parts","tire_shop","retail"]}', isSystem: false, sortOrder: 2, createdAt: "2025-01-01T00:00:00Z", updatedAt: "2025-01-01T00:00:00Z" },
]

vi.mock("@/lib/tauri", () => ({
  getAppSettings: vi.fn(),
  getSettingCategories: vi.fn(),
  updateAppSettingsBulk: vi.fn(),
  updateAppSetting: vi.fn(),
}))

setupI18n("en")

describe("AdminSettingsPage", () => {
  beforeEach(() => {
    vi.mocked(getSettingCategories).mockReset()
    vi.mocked(getAppSettings).mockReset()
    vi.mocked(updateAppSettingsBulk).mockReset()
    vi.mocked(getSettingCategories).mockResolvedValue([
      { category: "company", count: 2 },
      { category: "tax", count: 2 },
      { category: "business", count: 2 },
    ])
    vi.mocked(getAppSettings).mockImplementation((category?: string) => {
      if (category === "tax") return Promise.resolve(taxSettings)
      if (category === "business") return Promise.resolve([...businessSettings, ...moduleSettings])
      return Promise.resolve(companySettings)
    })
    vi.mocked(updateAppSettingsBulk).mockResolvedValue(undefined)
  })

  it("renders categories and settings for the active category", async () => {
    render(<AdminSettingsPage />)
    await screen.findByDisplayValue("Autopartes Test")
    expect(screen.getAllByText("Business details").length).toBe(2)
    expect(screen.getByText("Legal business name")).toBeDefined()
  })

  it("renders a select control with parsed options", async () => {
    render(<AdminSettingsPage />)
    await screen.findByDisplayValue("Autopartes Test")
    fireEvent.click(screen.getByText("Taxes"))
    await screen.findByDisplayValue("16")
    const businessType = await screen.findByDisplayValue("auto_parts")
    expect(businessType.tagName).toBe("SELECT")
  })

  it("saves changed values via the bulk endpoint", async () => {
    render(<AdminSettingsPage />)
    const input = await screen.findByDisplayValue("Autopartes Test")
    fireEvent.change(input, { target: { value: "Nuevo Negocio" } })
    fireEvent.click(screen.getByText("Save Changes"))
    await waitFor(() => {
      expect(updateAppSettingsBulk).toHaveBeenCalledWith(
        [
          { key: "business_name", value: "Nuevo Negocio" },
          { key: "tax_id", value: "ABC-123" },
        ],
        undefined
      )
    })
  })

  it("blocks saving when a value fails validation", async () => {
    render(<AdminSettingsPage />)
    await screen.findByDisplayValue("Autopartes Test")
    fireEvent.click(screen.getByText("Taxes"))
    const input = await screen.findByDisplayValue("16")
    fireEvent.change(input, { target: { value: "150" } })
    fireEvent.click(screen.getByText("Save Changes"))
    expect(screen.getByText("Maximum value is 100")).toBeDefined()
    expect(updateAppSettingsBulk).not.toHaveBeenCalled()
  })

  /**
   * The module flags were write-only: this page could flip "Activar módulo de
   * compras" and persist it, but nothing read the value back, so the whole
   * module stayed reachable. `use-modules.ts` is now the single reader, and it
   * reads the app-settings store -- the same store this page writes on save.
   *
   * So the seam worth pinning down is the join between the two halves: flipping
   * the switch must persist "false" *and* land in the store, or the gate in
   * `module-gating.test.tsx` is reading a value this page never updated.
   */
  it("turning off a module persists the flag and lands it in the store the gate reads", async () => {
    useAppSettingsStore.setState({ settings: [], loaded: true })

    render(<AdminSettingsPage />)
    fireEvent.click(await screen.findByText("Business"))

    const label = await screen.findByText("Enable purchasing module")
    expect(label).toBeDefined()

    // The switch is a sibling of the label, not a descendant of it.
    fireEvent.click(screen.getByRole("switch"))

    fireEvent.click(screen.getByText("Save Changes"))

    await waitFor(() => {
      expect(updateAppSettingsBulk).toHaveBeenCalledWith(
        expect.arrayContaining([{ key: "enable_purchasing", value: "false" }]),
        undefined
      )
    })
    expect(useAppSettingsStore.getState().settings).toEqual(
      expect.arrayContaining([expect.objectContaining({ key: "enable_purchasing", value: "false" })])
    )
  })

  /**
   * The global profit percentage was already stored, validated and applied to
   * every product that does not set its own margin, but the page labelled the row
   * with its raw key, so it read as "default margin percent" and nobody could
   * find it. It now has a real name in the user's language.
   */
  it("names the global profit setting so it can be found and edited", async () => {
    render(<AdminSettingsPage />)
    await screen.findByDisplayValue("Autopartes Test")
    fireEvent.click(screen.getByText("Business"))

    const input = await screen.findByDisplayValue("30")
    expect(screen.getByText("Global profit (%)")).toBeDefined()
    expect(screen.queryByText("default margin percent")).toBeNull()

    fireEvent.change(input, { target: { value: "35" } })
    fireEvent.click(screen.getByText("Save Changes"))
    await waitFor(() => {
      // The bulk endpoint sends every value of the active category, so the
      // untouched `enable_purchasing` row rides along with the edit.
      expect(updateAppSettingsBulk).toHaveBeenCalledWith(
        [
          { key: "default_margin_percent", value: "35" },
          { key: "enable_purchasing", value: "true" },
        ],
        undefined
      )
    })
  })
})
