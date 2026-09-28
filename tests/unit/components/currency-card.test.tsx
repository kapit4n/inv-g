import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, fireEvent, waitFor } from "@tests/helpers/render"
import { setupI18n } from "@/i18n"
import { CurrencyCard } from "@/features/settings/components/currency-card"
import { useAppSettingsStore, useNotificationStore } from "@/stores"

/**
 * The card is the one place a user picks the currency every price in the app is
 * rendered with, so a rejected write has to be legible. It was showing the raw
 * backend sentence -- which is how the Boliviano bug reached the user as
 * "Value 'BOB' is not one of the allowed options: USD, MXN, ..." in an app whose
 * UI language was Spanish.
 */

vi.mock("@/lib/tauri", () => ({
  updateAppSetting: vi.fn(),
}))

import { updateAppSetting } from "@/lib/tauri"

setupI18n("es")

function setting(key: string, value: string) {
  return {
    id: 0, category: "general", key, value, settingType: "string",
    isSystem: false, sortOrder: 0, createdAt: "", updatedAt: "",
  }
}

beforeEach(() => {
  useAppSettingsStore.setState({
    settings: [setting("currency", "USD")],
    loaded: true,
    loading: false,
  })
  useNotificationStore.setState({ notifications: [], unreadCount: 0 })
  vi.mocked(updateAppSetting).mockReset()
})

async function pickCurrency(name: RegExp) {
  fireEvent.click(screen.getByRole("combobox"))
  fireEvent.click(await screen.findByRole("option", { name }))
}

describe("CurrencyCard", () => {
  it("translates a rejected currency instead of showing the backend's English", async () => {
    vi.mocked(updateAppSetting).mockRejectedValue(
      "notAllowed:Value 'BOB' is not one of the allowed options: USD, MXN, EUR, GTQ, CRC, COP"
    )
    render(<CurrencyCard />)

    await pickCurrency(/Boliviano/)

    await waitFor(() =>
      expect(useNotificationStore.getState().notifications[0]?.message).toBe(
        "El valor no está entre las opciones permitidas"
      )
    )
    // The English sentence, and the internal code, are both gone.
    const text = JSON.stringify(useNotificationStore.getState().notifications)
    expect(text).not.toContain("UNIQUE")
    expect(text).not.toContain("notAllowed")
  })

  it("keeps a message that is not a coded validation error", async () => {
    // A database or permission failure is worth reading exactly as it arrived.
    vi.mocked(updateAppSetting).mockRejectedValue("No fields to update")
    render(<CurrencyCard />)

    await pickCurrency(/Euro/)

    await waitFor(() =>
      expect(useNotificationStore.getState().notifications[0]?.message).toBe("No fields to update")
    )
  })

  it("rolls the selector back when the write is refused", async () => {
    vi.mocked(updateAppSetting).mockRejectedValue("notAllowed:Value 'BOB' is not allowed")
    render(<CurrencyCard />)

    await pickCurrency(/Boliviano/)

    // Otherwise the app keeps rendering Bs for every price while the setting on
    // disk still says USD.
    await waitFor(() => expect(useAppSettingsStore.getState().getValue("currency")).toBe("USD"))
  })

  it("saves and confirms when the backend accepts the value", async () => {
    vi.mocked(updateAppSetting).mockResolvedValue(undefined)
    render(<CurrencyCard />)

    await pickCurrency(/Boliviano/)

    await waitFor(() => expect(updateAppSetting).toHaveBeenCalledWith("currency", "BOB"))
    await waitFor(() => expect(useAppSettingsStore.getState().getValue("currency")).toBe("BOB"))
    expect(useNotificationStore.getState().notifications[0]?.type).toBe("success")
  })
})
