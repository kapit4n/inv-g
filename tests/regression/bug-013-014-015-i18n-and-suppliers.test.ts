import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { findDuplicateKeys } from "../../scripts/check-i18n-duplicates.mjs"

const read = (relative: string) => readFileSync(join(process.cwd(), relative), "utf8")
const locale = (name: string, lang: "es" | "en") =>
  JSON.parse(read(`src/i18n/locales/${lang}/${name}`))

/** The locale files use flat dotted keys, so resolve them path by path. */
const tr = (lang: "es" | "en", file: string, key: string): string | undefined =>
  locale(file, lang)[key]

describe("BUG-013: the CRM tab was labelled 'Title' instead of 'CRM'", () => {
  // crm.json declared `title` twice: "CRM" for the section and "Title" for a
  // record field. JSON.parse keeps the last one, so the sidebar tab, the
  // command palette entry and the breadcrumb all rendered "Title".
  it.each(["es", "en"] as const)("declares crm.title exactly once (%s)", (lang) => {
    const duplicates = findDuplicateKeys(read(`src/i18n/locales/${lang}/crm.json`))
    expect(duplicates.map((d) => d.key)).not.toContain("title")
  })

  it.each(["es", "en"] as const)("crm.title is the section name, not a field label (%s)", (lang) => {
    expect(locale("crm.json", lang).title).toBe("CRM")
  })

  it.each(["es", "en"] as const)("keeps the record field label under recordTitle (%s)", (lang) => {
    expect(locale("crm.json", lang).recordTitle).toBe(lang === "es" ? "Título" : "Title")
  })

  it.each([
    "src/config/navigation.ts",
    "src/lib/command-palette/commands.ts",
    "src/layouts/top-bar.tsx",
  ])("%s points the CRM section at crm.title", (file) => {
    expect(read(file)).toContain("crm.title")
  })

  it("the CRM dashboard page header uses the section name", () => {
    expect(read("src/features/crm/pages/crm-dashboard-page.tsx")).toContain('title={t("title")}')
  })

  it("record field labels use recordTitle, not the section name", () => {
    const reminders = read("src/features/crm/pages/crm-reminders-page.tsx")
    const detail = read("src/features/crm/pages/crm-customer-detail-page.tsx")
    expect(reminders).not.toContain('t("title")')
    expect(detail).not.toContain('t("title")')
    expect(reminders).toContain('t("recordTitle")')
    expect(detail).toContain('t("recordTitle")')
  })
})

describe("BUG-014: duplicate i18n keys silently discarded earlier values", () => {
  const files = ["admin", "crm", "customers", "inventory"]

  it.each(["es", "en"] as const)("no locale file declares a duplicate key (%s)", (lang) => {
    for (const file of files) {
      const duplicates = findDuplicateKeys(read(`src/i18n/locales/${lang}/${file}.json`))
      expect(duplicates, `${lang}/${file}.json`).toEqual([])
    }
  })

  it("renames the keys that had to be split", () => {
    expect(tr("en", "admin.json", "roles.fieldDescription")).toBe("Description")
    expect(tr("en", "inventory.json", "descriptionField")).toBe("Description")
    expect(tr("en", "crm.json", "notesPage")).toBe("Customer Notes")
  })

  it("the page subtitles keep the descriptive first values", () => {
    expect(tr("en", "admin.json", "roles.description")).toBe(
      "Manage user roles and configure permissions"
    )
    expect(tr("en", "inventory.json", "description")).toContain("product catalog")
  })

  it("keeps the labels users already see instead of the shadowed duplicates", () => {
    // Removing a duplicate must not change what the UI renders. These were the
    // values that won at runtime, so they are the ones that stay.
    expect(tr("en", "admin.json", "settings.tax")).toBe("Taxes")
    expect(tr("en", "admin.json", "settings.company")).toBe("Business details")
    expect(tr("en", "admin.json", "settings.notifications")).toBe("Notifications")
    expect(tr("en", "admin.json", "settings.tax.description")).toBe(
      "Tax rate and invoicing requirements"
    )
    expect(tr("en", "admin.json", "backups.restore")).toBe("Restore")
    expect(tr("en", "admin.json", "roles.create")).toBe("Create Role")
    expect(tr("en", "crm.json", "notes")).toBe("Notes")
    expect(tr("en", "inventory.json", "description")).not.toBe("Description")
  })

  it("the CRM sub-navigation label is no longer shadowed", () => {
    expect(tr("en", "crm.json", "notesPage")).toBe("Customer Notes")
    expect(read("src/config/navigation.ts")).toContain('"crm.notesPage"')
  })

  it("each renamed key is used and the shadowed one is not", () => {
    const count = (file: string, needle: string) => read(file).split(needle).length - 1

    // The description subtitle keeps the canonical key; only the table header
    // and the form label move to the new field key.
    expect(count("src/features/admin/pages/admin-roles-page.tsx", 't("admin.roles.description")')).toBe(1)
    expect(count("src/features/admin/pages/admin-roles-page.tsx", 't("admin.roles.fieldDescription")')).toBe(1)
    expect(count("src/features/admin/pages/admin-role-form-page.tsx", 't("admin.roles.fieldDescription")')).toBe(1)

    // Restore needs one label everywhere, so no extra key was introduced.
    expect(read("src/features/admin/pages/admin-backups-page.tsx")).not.toContain("restoreAction")
    expect(read("src/features/admin/pages/admin-restore-page.tsx")).not.toContain("restoreAction")
    expect(count("src/features/admin/pages/admin-backups-page.tsx", 't("admin.backups.restore")')).toBe(2)
    expect(count("src/features/admin/pages/admin-restore-page.tsx", 't("admin.backups.restore")')).toBe(1)

    // The inventory page description keeps the canonical key.
    expect(count("src/features/inventory/pages/inventory-page.tsx", 't("inventory.description")')).toBe(1)
    expect(count("src/features/inventory/pages/product-form-page.tsx", 't("inventory.descriptionField")')).toBe(1)
    expect(count("src/features/inventory/components/product-overview-tab.tsx", 't("inventory.descriptionField")')).toBe(1)
  })
})

describe("BUG-015: the /suppliers page showed hardcoded demo data", () => {
  // The top-level page duplicated the real supplier list at
  // /inventory/suppliers while rendering invented rows, so it could never
  // reflect the database.
  it("no /suppliers route is registered", () => {
    expect(read("src/routes/index.tsx")).not.toContain('path="/suppliers"')
  })

  it("no navigation entry points at /suppliers", () => {
    for (const file of [
      "src/config/navigation.ts",
      "src/lib/command-palette/commands.ts",
      "src/layouts/top-bar.tsx",
      "src/services/permission.service.ts",
    ]) {
      // Exact quoted path only: /inventory/suppliers and /reports/suppliers are
      // different pages that must survive.
      expect(read(file), file).not.toMatch(/["'`]\/suppliers["'`]/)
    }
  })

  it("the mock page and its translations are gone", () => {
    for (const file of [
      "src/features/suppliers/index.ts",
      "src/features/suppliers/pages/suppliers-page.tsx",
      "src/i18n/locales/es/suppliers.json",
      "src/i18n/locales/en/suppliers.json",
    ]) {
      expect(() => read(file), file).toThrow()
    }
  })

  it("the real supplier list is still reachable", () => {
    expect(read("src/config/navigation.ts")).toContain('href: "/inventory/suppliers"')
    // Routes are registered relative to the authenticated layout.
    expect(read("src/routes/index.tsx")).toContain('path: "inventory/suppliers"')
    expect(read("src/routes/index.tsx")).not.toMatch(/path:\s*["'`]suppliers["'`]/)
  })
})
