import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, fireEvent, waitFor } from "@tests/helpers/render"
import { setupI18n } from "@/i18n"
import { AdminSettingsPage } from "@/features/admin/pages/admin-settings-page"
import { getAppSettings, getSettingCategories, updateAppSettingsBulk } from "@/lib/tauri"
import type { AdminAppSetting } from "@/types"

const companySettings: AdminAppSetting[] = [
  { id: 1, category: "company", key: "business_name", value: "Autopartes Test", settingType: "string", description: "Legal business name", isSystem: false, sortOrder: 1, createdAt: "2025-01-01T00:00:00Z", updatedAt: "2025-01-01T00:00:00Z" },
  { id: 2, category: "company", key: "tax_id", value: "ABC-123", settingType: "string", description: "Tax ID", validation: '{"maxLength":30}', isSystem: false, sortOrder: 2, createdAt: "2025-01-01T00:00:00Z", updatedAt: "2025-01-01T00:00:00Z" },
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
    ])
    vi.mocked(getAppSettings).mockImplementation((category?: string) =>
      Promise.resolve(category === "tax" ? taxSettings : companySettings)
    )
    vi.mocked(updateAppSettingsBulk).mockResolvedValue(undefined)
  })

  it("renders categories and settings for the active category", async () => {
    render(<AdminSettingsPage />)
    await screen.findByDisplayValue("Autopartes Test")
    expect(screen.getAllByText("Company").length).toBe(2)
    expect(screen.getByText("business name")).toBeDefined()
  })

  it("renders a select control with parsed options", async () => {
    render(<AdminSettingsPage />)
    await screen.findByDisplayValue("Autopartes Test")
    fireEvent.click(screen.getByText("Tax"))
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
    fireEvent.click(screen.getByText("Tax"))
    const input = await screen.findByDisplayValue("16")
    fireEvent.change(input, { target: { value: "150" } })
    fireEvent.click(screen.getByText("Save Changes"))
    expect(screen.getByText("Maximum value is 100")).toBeDefined()
    expect(updateAppSettingsBulk).not.toHaveBeenCalled()
  })
})
