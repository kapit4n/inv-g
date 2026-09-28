/**
 * System currency.
 *
 * The currency is display configuration only: it decides how amounts are
 * rendered, never their value. Switching USD -> BOB does not convert prices, and
 * nothing here is allowed to look like it does.
 *
 * `formatCurrency` in `lib/utils.ts` reads the active currency from this module,
 * which is how the roughly seventy existing call sites follow the configuration
 * without each one being passed a currency or reaching for the settings store.
 * This is deliberately a module-level value rather than React context: the
 * formatter is called from table cells, report totals and non-React helpers, so
 * a context would mean either a hook at every call site or a second, divergent
 * code path. The tradeoff is that it is not reactive, so `setActiveCurrency` is
 * called wherever the persisted value changes (see `stores/app-settings.store`).
 * Nothing in the UI needs to re-render on its own because every monetary view
 * already re-renders when the settings store updates.
 */

export interface SystemCurrency {
  /** ISO 4217 code, and the value persisted in the `currency` setting. */
  code: string
  /** Human-facing symbol, e.g. `Bs`. */
  symbol: string
  /** Locale used for the number formatting, e.g. `es-BO`. */
  locale: string
  /** i18n key for the currency name, so it is translated rather than hardcoded. */
  labelKey: string
}

/**
 * The currencies offered in Settings. `labelKey` resolves against the
 * `settings.currencies.*` namespace in both locales.
 */
export const SUPPORTED_CURRENCIES: SystemCurrency[] = [
  { code: "BOB", symbol: "Bs", locale: "es-BO", labelKey: "settings.currencies.BOB" },
  { code: "USD", symbol: "$", locale: "en-US", labelKey: "settings.currencies.USD" },
  { code: "EUR", symbol: "€", locale: "es-ES", labelKey: "settings.currencies.EUR" },
  { code: "MXN", symbol: "$", locale: "es-MX", labelKey: "settings.currencies.MXN" },
  { code: "COP", symbol: "$", locale: "es-CO", labelKey: "settings.currencies.COP" },
  { code: "ARS", symbol: "$", locale: "es-AR", labelKey: "settings.currencies.ARS" },
  { code: "CLP", symbol: "$", locale: "es-CL", labelKey: "settings.currencies.CLP" },
  { code: "PEN", symbol: "S/", locale: "es-PE", labelKey: "settings.currencies.PEN" },
  { code: "UYU", symbol: "$", locale: "es-UY", labelKey: "settings.currencies.UYU" },
  { code: "PYG", symbol: "₲", locale: "es-PY", labelKey: "settings.currencies.PYG" },
  { code: "GBP", symbol: "£", locale: "en-GB", labelKey: "settings.currencies.GBP" },
  { code: "CHF", symbol: "CHF", locale: "de-CH", labelKey: "settings.currencies.CHF" },
  { code: "JPY", symbol: "¥", locale: "ja-JP", labelKey: "settings.currencies.JPY" },
  { code: "BRL", symbol: "R$", locale: "pt-BR", labelKey: "settings.currencies.BRL" },
]

/** The persisted setting key. Matches `DEFAULT_SETTINGS` in the Rust seeder. */
export const CURRENCY_SETTING_KEY = "currency"

/** Used when the setting is missing or holds a code we do not know. */
export const FALLBACK_CURRENCY: SystemCurrency = {
  code: "USD",
  symbol: "$",
  locale: "en-US",
  labelKey: "settings.currencies.USD",
}

let activeCurrency: SystemCurrency = FALLBACK_CURRENCY

/**
 * Resolves a persisted code, falling back rather than throwing: an unrecognised
 * value in the database must not break every monetary view in the app.
 */
export function resolveCurrency(code: string | null | undefined): SystemCurrency {
  if (!code) return FALLBACK_CURRENCY
  const found = SUPPORTED_CURRENCIES.find((c) => c.code === code.toUpperCase())
  return found ?? FALLBACK_CURRENCY
}

export function getActiveCurrency(): SystemCurrency {
  return activeCurrency
}

export function setActiveCurrency(code: string | null | undefined): void {
  activeCurrency = resolveCurrency(code)
}

/** True when the code is one the app can display. */
export function isSupportedCurrency(code: string | null | undefined): boolean {
  if (!code) return false
  const upper = code.toUpperCase()
  return SUPPORTED_CURRENCIES.some((c) => c.code === upper)
}
