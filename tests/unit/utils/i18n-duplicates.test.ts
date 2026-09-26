import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { findDuplicateKeys } from "../../../scripts/check-i18n-duplicates.mjs"

const LOCALES_DIR = join(process.cwd(), "src/i18n/locales")

const localeFiles = () =>
  readdirSync(LOCALES_DIR)
    .filter((locale) => {
      try {
        return readdirSync(join(LOCALES_DIR, locale)).some((f) => f.endsWith(".json"))
      } catch {
        return false
      }
    })
    .flatMap((locale) =>
      readdirSync(join(LOCALES_DIR, locale))
        .filter((f) => f.endsWith(".json"))
        .map((f) => join(LOCALES_DIR, locale, f))
    )

describe("findDuplicateKeys", () => {
  it("returns nothing for a file with unique keys", () => {
    const text = `{\n  "a": "one",\n  "b": { "c": "two" }\n}`
    expect(findDuplicateKeys(text)).toEqual([])
  })

  it("reports a repeated top-level key with both line numbers", () => {
    const text = `{\n  "title": "CRM",\n  "notes": "Notes",\n  "title": "Title"\n}`
    expect(findDuplicateKeys(text)).toEqual([{ key: "title", declarations: [2, 4] }])
  })

  it("does not confuse a nested key with a top-level key of the same name", () => {
    // `commandPalette.actions` and `actions` are different keys. This was a real
    // false positive: the scanner lost the parent prefix after a nested block.
    const text = `{\n  "actions": "Actions",\n  "commandPalette": {\n    "categories": {\n      "actions": "Quick Actions"\n    },\n    "actions": {\n      "newSale": "New Sale"\n    }\n  }\n}`
    expect(findDuplicateKeys(text)).toEqual([])
  })

  it("keeps prefixes across sibling blocks", () => {
    const text = `{\n  "x": { "y": { "z": 1 } },\n  "w": {\n    "v": 1\n  },\n  "x": { "y": { "z": 2 } }\n}`
    expect(findDuplicateKeys(text)).toEqual([
      { key: "x", declarations: [2, 6] },
      { key: "x.y", declarations: [2, 6] },
      { key: "x.y.z", declarations: [2, 6] },
    ])
  })

  it("treats array elements as separate scopes", () => {
    const text = `{\n  "a": [\n    { "b": 1 },\n    { "b": 2 }\n  ]\n}`
    expect(findDuplicateKeys(text)).toEqual([])
  })

  it("still reports a duplicate inside a single array element", () => {
    const text = `{\n  "a": [\n    { "b": 1, "b": 2 }\n  ]\n}`
    expect(findDuplicateKeys(text)).toEqual([{ key: "a[0].b", declarations: [3, 3] }])
  })

  it("ignores string values that merely look like keys", () => {
    const text = `{\n  "greeting": "a: b",\n  "other": "{\\"nested\\": 1}"\n}`
    expect(findDuplicateKeys(text)).toEqual([])
  })
})

describe("translation files", () => {
  it("declares no duplicate keys in any locale file", () => {
    const offenders: string[] = []
    for (const file of localeFiles()) {
      const duplicates = findDuplicateKeys(readFileSync(file, "utf8"))
      if (duplicates.length > 0) {
        offenders.push(
          `${file}: ${duplicates.map((d) => `${d.key} (lines ${d.declarations.join(", ")})`).join("; ")}`
        )
      }
    }
    // A duplicate key is silently resolved by JSON.parse, so a locale file can
    // look fine in review while the wrong value wins at runtime.
    expect(offenders).toEqual([])
  })
})
