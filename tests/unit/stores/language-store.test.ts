import { describe, it, expect, beforeEach, vi } from "vitest"
import { useLanguageStore } from "@/stores/language.store"

vi.mock("i18next", () => ({
  default: { changeLanguage: vi.fn() },
}))

import i18n from "i18next"

describe("LanguageStore", () => {
  beforeEach(() => {
    useLanguageStore.setState({ language: "es" })
    vi.clearAllMocks()
  })

  it("defaults to es", () => {
    expect(useLanguageStore.getState().language).toBe("es")
  })

  it("setLanguage updates language and calls i18n", () => {
    useLanguageStore.getState().setLanguage("en")
    expect(useLanguageStore.getState().language).toBe("en")
    expect(i18n.changeLanguage).toHaveBeenCalledWith("en")
  })

  it("setLanguage to fr calls i18n", () => {
    useLanguageStore.getState().setLanguage("fr")
    expect(i18n.changeLanguage).toHaveBeenCalledWith("fr")
  })
})
