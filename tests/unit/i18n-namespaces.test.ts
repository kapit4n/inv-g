import { describe, it, expect, beforeAll } from "vitest"
import { setupI18n } from "@/i18n/config"

import esCommon from "@/i18n/locales/es/common.json"
import esBusiness from "@/i18n/locales/es/business.json"
import esDashboard from "@/i18n/locales/es/dashboard.json"
import esInventory from "@/i18n/locales/es/inventory.json"
import esSales from "@/i18n/locales/es/sales.json"
import esPurchases from "@/i18n/locales/es/purchases.json"
import esCustomers from "@/i18n/locales/es/customers.json"
import esVehicles from "@/i18n/locales/es/vehicles.json"
import esWarehouse from "@/i18n/locales/es/warehouse.json"
import esReports from "@/i18n/locales/es/reports.json"
import esSettings from "@/i18n/locales/es/settings.json"
import esAuth from "@/i18n/locales/es/auth.json"
import esEmployees from "@/i18n/locales/es/employees.json"
import esValidation from "@/i18n/locales/es/validation.json"
import esErrors from "@/i18n/locales/es/errors.json"
import esHelp from "@/i18n/locales/es/help.json"
import esCrm from "@/i18n/locales/es/crm.json"
import esAdmin from "@/i18n/locales/es/admin.json"
import esPrint from "@/i18n/locales/es/print.json"
import esPartFinder from "@/i18n/locales/es/part-finder.json"

/**
 * Regression: the `business` namespace was bundled in both locales but never listed
 * in `setupI18n`'s `ns` array. i18next therefore had no store to resolve
 * `business.errors.*` from and returned the key verbatim, so the transfers page
 * greeted a shopkeeper who tried to move stock between the same store with the
 * literal string `business.errors.transferSameStore`.
 *
 * Nothing caught it because every key-level test asserts on namespaces that
 * happened to be registered, and a missing namespace fails *open* — it returns
 * the key instead of throwing. This test closes that door structurally: a
 * namespace that exists in a locale file must also be registered, and it must
 * resolve through the real `t()` in every shipped locale.
 */

const esBundles: Record<string, unknown> = {
  common: esCommon,
  business: esBusiness,
  dashboard: esDashboard,
  inventory: esInventory,
  sales: esSales,
  purchases: esPurchases,
  customers: esCustomers,
  vehicles: esVehicles,
  warehouse: esWarehouse,
  reports: esReports,
  settings: esSettings,
  auth: esAuth,
  employees: esEmployees,
  validation: esValidation,
  errors: esErrors,
  help: esHelp,
  crm: esCrm,
  admin: esAdmin,
  print: esPrint,
  "part-finder": esPartFinder,
}

describe("i18n namespace registration", () => {
  let i18n: ReturnType<typeof setupI18n>

  beforeAll(async () => {
    i18n = setupI18n("es")
    if (!i18n.isInitialized) await new Promise((resolve) => i18n.on("initialized", resolve))
  })

  it("registers every namespace that a locale file provides", () => {
    const registered = new Set(i18n.options.ns ?? [])
    const missing = Object.keys(esBundles).filter((ns) => !registered.has(ns))
    expect(missing).toEqual([])
  })

  it("registers no namespace that has no locale file", () => {
    // Guards the other direction, so a typo in `ns` cannot leave a namespace
    // that silently resolves to nothing.
    const orphans = (i18n.options.ns ?? []).filter((ns) => !(ns in esBundles))
    expect(orphans).toEqual([])
  })

  it.each(Object.keys(esBundles))("serves the %s namespace in every shipped locale", async (ns) => {
    const bundle = esBundles[ns] as Record<string, unknown>
    const leaf = Object.keys(bundle)[0]
    // `nsSeparator` is ".", not the i18next default ":", so a namespace is
    // selected by a leading dotted segment.
    const fullKey = `${ns}.${leaf}`

    for (const locale of ["es", "en"]) {
      await i18n.changeLanguage(locale)
      const value = i18n.t(fullKey)
      // A missing namespace or a missing key both come back as the key itself.
      expect(value, fullKey + " in " + locale).not.toBe(fullKey)
    }
  })
})
