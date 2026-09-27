import { describe, it, expect, beforeAll } from "vitest"
import { setupI18n } from "@/i18n/config"

/**
 * The settings page names its rows after their `application_settings` key, which
 * is an internal slug ("default margin percent"). The readable names live in
 * `admin.json` as *flat* dotted keys (`settings.keys.<key>`), reached through
 * `nsSeparator: "."` so the `admin.` prefix selects the namespace.
 *
 * That combination is easy to break silently: ask for the key without the
 * namespace and i18next quietly returns the fallback slug instead.
 */
describe("application settings translations", () => {
  let i18n: ReturnType<typeof setupI18n>

  beforeAll(async () => {
    i18n = setupI18n("es")
    if (!i18n.isInitialized) await new Promise((resolve) => i18n.on("initialized", resolve))
  })

  it("names the global profit setting", async () => {
    await i18n.changeLanguage("es")
    expect(i18n.t("admin.settings.keys.default_margin_percent")).toBe("Ganancia global (%)")
    expect(i18n.t("admin.settings.keys.default_margin_percent.description")).toBe(
      "Ganancia que se usa en los productos que no traen la suya"
    )

    await i18n.changeLanguage("en")
    expect(i18n.t("admin.settings.keys.default_margin_percent")).toBe("Global profit (%)")
  })

  it("falls back to the key for a setting nobody has translated", () => {
    expect(i18n.t("admin.settings.keys.some_future_setting", { defaultValue: "some future setting" })).toBe(
      "some future setting"
    )
  })

  it("translates the category of the global profit setting", async () => {
    await i18n.changeLanguage("es")
    expect(i18n.t("admin.settings.business")).toBe("Negocio")
    await i18n.changeLanguage("en")
    expect(i18n.t("admin.settings.business")).toBeTruthy()
  })
})
