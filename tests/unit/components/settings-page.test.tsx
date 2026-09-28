import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, fireEvent, waitFor } from "@tests/helpers/render"
import { setupI18n } from "@/i18n"
import { SettingsPage } from "@/features/settings/pages/settings-page"
import { updateAppSetting } from "@/lib/tauri"

vi.mock("@/lib/tauri", async () => {
  const actual = await vi.importActual<Record<string, unknown>>("@/lib/tauri")
  const mock: Record<string, unknown> = {}
  for (const command of Object.keys(actual)) {
    mock[command] = vi.fn().mockResolvedValue(undefined)
  }
  mock.updateAppSetting = vi.fn()
  return mock
})

setupI18n("en")

describe("SettingsPage", () => {
  beforeEach(() => {
    vi.mocked(updateAppSetting).mockReset()
    vi.mocked(updateAppSetting).mockResolvedValue(undefined)
  })

  it("persists the low stock alert toggle", async () => {
    render(<SettingsPage />)
    const toggle = screen.getByRole("switch", { name: /low stock/i })
    fireEvent.click(toggle)
    await waitFor(() => {
      expect(updateAppSetting).toHaveBeenCalledWith("notify_low_stock", "false")
    })
  })

  it("persists the auto backup toggle", async () => {
    render(<SettingsPage />)
    const toggle = screen.getByRole("switch", { name: /backup/i })
    fireEvent.click(toggle)
    await waitFor(() => {
      expect(updateAppSetting).toHaveBeenCalledWith("auto_backup", "false")
    })
  })

  it("persists dark mode toggle as a theme setting", async () => {
    render(<SettingsPage />)
    const toggle = screen.getByRole("switch", { name: /dark mode/i })
    fireEvent.click(toggle)
    await waitFor(() => {
      expect(updateAppSetting).toHaveBeenCalledWith("theme", "dark")
    })
  })
})
