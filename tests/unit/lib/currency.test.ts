import { describe, it, expect } from "vitest"
import { SUPPORTED_CURRENCIES, resolveCurrency, isSupportedCurrency, FALLBACK_CURRENCY } from "@/lib/currency"
import en from "@/i18n/locales/en/settings.json"
import es from "@/i18n/locales/es/settings.json"

/**
 * The currency selector is built from `SUPPORTED_CURRENCIES`, but the backend
 * validates against the `options` column of the `currency` application setting
 * and rejects anything outside it. Nothing connected the two, which is how they
 * ended up as different sets: BOB was offered by the UI and refused by the
 * backend, while ARS/CLP/PEN/UYU/PYG/GBP/CHF/JPY/BRL were offered by the UI and
 * refused by the backend on every installation, and GTQ/CRC were allowed by the
 * backend with no label to render them.
 *
 * The backend half of that contract is asserted in
 * `src-tauri/src/db/schema.rs::seeded_currency_options_match_the_frontend_currency_list`.
 * These tests cover what is checkable from this side.
 */

const SEED_OPTIONS = [
  "BOB", "USD", "EUR", "MXN", "COP", "ARS", "CLP", "PEN", "UYU", "PYG", "GBP", "CHF", "JPY", "BRL",
]

const labels = (locale: typeof en) => locale.currencies as Record<string, string>

describe("SUPPORTED_CURRENCIES", () => {
  it("lists each currency exactly once", () => {
    const codes = SUPPORTED_CURRENCIES.map((c) => c.code)
    expect(new Set(codes).size).toBe(codes.length)
  })

  it("matches the codes the backend seeds as allowed", () => {
    // A divergence here is the exact bug that produced "Value 'BOB' is not one
    // of the allowed options": the dropdown offers a code the backend refuses.
    expect(SUPPORTED_CURRENCIES.map((c) => c.code).sort()).toEqual([...SEED_OPTIONS].sort())
  })

  it("offers Boliviano first, as the seeded default", () => {
    expect(SUPPORTED_CURRENCIES[0].code).toBe("BOB")
  })

  it("has a label in every locale for every code", () => {
    for (const locale of [labels(en), labels(es)]) {
      for (const currency of SUPPORTED_CURRENCIES) {
        expect(locale[currency.code], `missing label for ${currency.code}`).toBeTruthy()
      }
    }
  })

  it("gives every currency a symbol and a locale for formatting", () => {
    for (const currency of SUPPORTED_CURRENCIES) {
      expect(currency.symbol, `${currency.code} has no symbol`).toBeTruthy()
      // A malformed locale makes Intl.NumberFormat throw at render time.
      expect(() => new Intl.NumberFormat(currency.locale, { style: "currency", currency: currency.code }))
        .not.toThrow()
    }
  })
})

describe("resolveCurrency", () => {
  it("resolves a supported code", () => {
    expect(resolveCurrency("BOB").symbol).toBe("Bs")
  })

  it("falls back rather than throwing on an unknown or missing code", () => {
    expect(resolveCurrency("XXX").code).toBe(FALLBACK_CURRENCY.code)
    expect(resolveCurrency(null).code).toBe(FALLBACK_CURRENCY.code)
    expect(resolveCurrency(undefined).code).toBe(FALLBACK_CURRENCY.code)
  })

  it("reports support for exactly the listed codes", () => {
    expect(isSupportedCurrency("BOB")).toBe(true)
    expect(isSupportedCurrency("GTQ")).toBe(false)
    expect(isSupportedCurrency("XXX")).toBe(false)
  })
})
