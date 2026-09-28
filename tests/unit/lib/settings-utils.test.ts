import { describe, it, expect } from "vitest"
import {
  parseSettingOptions,
  parseSettingValidation,
  parseSettingError,
  translateSettingError,
  validateSettingValue,
  SETTING_ERROR_CODES,
} from "@/lib/settings-utils"
import type { AdminAppSetting } from "@/types"

function setting(overrides: Partial<AdminAppSetting>): AdminAppSetting {
  return {
    id: 1,
    category: "general",
    key: "test",
    value: "",
    settingType: "string",
    description: undefined,
    options: undefined,
    validation: undefined,
    isSystem: false,
    sortOrder: 0,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
    ...overrides,
  }
}

describe("parseSettingOptions", () => {
  it("parses a plain JSON array", () => {
    expect(parseSettingOptions('["es","en"]')).toEqual(["es", "en"])
  })

  it("parses a JSON object with an options key", () => {
    expect(parseSettingOptions('{"options":["cash","card"]}')).toEqual(["cash", "card"])
  })

  it("falls back to comma separated values", () => {
    expect(parseSettingOptions("a, b ,c")).toEqual(["a", "b", "c"])
  })

  it("returns an empty array for undefined or empty input", () => {
    expect(parseSettingOptions(undefined)).toEqual([])
    expect(parseSettingOptions("")).toEqual([])
  })
})

describe("parseSettingValidation", () => {
  it("parses numeric constraints", () => {
    expect(parseSettingValidation('{"min":0,"max":100}')).toEqual({ min: 0, max: 100 })
  })

  it("parses length constraints", () => {
    expect(parseSettingValidation('{"minLength":3,"maxLength":30}')).toEqual({ minLength: 3, maxLength: 30 })
  })

  it("returns an empty object for invalid input", () => {
    expect(parseSettingValidation("not-json")).toEqual({})
    expect(parseSettingValidation(undefined)).toEqual({})
  })
})

describe("validateSettingValue", () => {
  it("accepts a valid number within range", () => {
    const s = setting({ settingType: "number", validation: '{"min":0,"max":100}' })
    expect(validateSettingValue(s, "50")).toBeNull()
  })

  it("rejects numbers out of range", () => {
    const s = setting({ settingType: "number", validation: '{"min":0,"max":100}' })
    expect(validateSettingValue(s, "150")).toBe("max")
    expect(validateSettingValue(s, "-5")).toBe("min")
  })

  it("rejects non-numeric numbers", () => {
    const s = setting({ settingType: "number" })
    expect(validateSettingValue(s, "abc")).toBe("notNumber")
  })

  it("accepts only true/false for booleans", () => {
    const s = setting({ settingType: "boolean" })
    expect(validateSettingValue(s, "true")).toBeNull()
    expect(validateSettingValue(s, "false")).toBeNull()
    expect(validateSettingValue(s, "yes")).toBe("notBoolean")
  })

  it("rejects values not in the allowed options", () => {
    const s = setting({ options: '{"options":["cash","card"]}' })
    expect(validateSettingValue(s, "cash")).toBeNull()
    expect(validateSettingValue(s, "crypto")).toBe("notAllowed")
  })

  it("allows empty values when options are defined", () => {
    const s = setting({ options: '["cash","card"]' })
    expect(validateSettingValue(s, "")).toBeNull()
  })

  it("enforces string length constraints", () => {
    const s = setting({ validation: '{"maxLength":30}' })
    expect(validateSettingValue(s, "x".repeat(31))).toBe("maxLength")
    expect(validateSettingValue(s, "ok")).toBeNull()
  })
})

describe("translateSettingError", () => {
  /**
   * Commands return failures as plain strings, so the only machine-readable
   * part is the code the backend prefixes. These use the exact strings
   * `validate_value` produces in `commands/admin/settings.rs`.
   */
  const en = {
    t: (key: string, params?: Record<string, unknown>) => {
      const table: Record<string, string> = {
        "admin.settings.errors.min": `Minimum value is ${params?.min}`,
        "admin.settings.errors.max": `Maximum value is ${params?.max}`,
        "admin.settings.errors.minLength": `Must be at least ${params?.min} characters`,
        "admin.settings.errors.maxLength": `Must be at most ${params?.max} characters`,
        "admin.settings.errors.notAllowed": "Value is not one of the allowed options",
        "admin.settings.errors.notNumber": "Must be a valid number",
        "admin.settings.errors.notBoolean": "Must be true or false",
      }
      return table[key] ?? key
    },
  }

  it("translates the currency error this was written for", () => {
    // The exact message behind the Boliviano bug, now in the user's language
    // instead of the backend's English.
    const raw =
      "notAllowed:Value 'BOB' is not one of the allowed options: USD, MXN, EUR, GTQ, CRC, COP"
    expect(translateSettingError(raw, en.t)).toBe("Value is not one of the allowed options")
  })

  it("does not mistake the colon inside the prose for a bound", () => {
    // "allowed options: USD" contains a colon, and notAllowed takes no bound.
    const parsed = parseSettingError("notAllowed:a: b: c")
    expect(parsed?.params).toBeUndefined()
    expect(parsed?.prose).toBe("a: b: c")
  })

  it("interpolates the bound for the codes that carry one", () => {
    expect(translateSettingError("min:5:Value must be at least 5", en.t)).toBe("Minimum value is 5")
    expect(translateSettingError("max:30:Value must be at most 30", en.t)).toBe("Maximum value is 30")
    expect(translateSettingError("minLength:3:Value must be at least 3 characters", en.t)).toBe(
      "Must be at least 3 characters"
    )
    expect(translateSettingError("maxLength:30:Value must be at most 30 characters", en.t)).toBe(
      "Must be at most 30 characters"
    )
  })

  it("keeps a fractional bound intact", () => {
    expect(parseSettingError("max:0.5:Value must be at most 0.5")?.params).toEqual({ max: 0.5 })
  })

  it("translates the unbounded codes", () => {
    expect(translateSettingError("notNumber:Value 'abc' is not a valid number", en.t)).toBe(
      "Must be a valid number"
    )
    expect(translateSettingError("notBoolean:Value 'yes' is not a valid boolean", en.t)).toBe(
      "Must be true or false"
    )
  })

  it("returns an uncoded message untouched, because it is worth reading", () => {
    const permission = "No tienes permiso para crear usuarios."
    expect(translateSettingError(permission, en.t)).toBe(permission)
    expect(parseSettingError(permission)).toBeNull()
    // A future code with no translation yet must not become the raw key.
    expect(translateSettingError("brandNewCode:something broke", en.t)).toBe("brandNewCode:something broke")
  })

  it("falls back to the prose when the key has no translation", () => {
    const t = (key: string) => (key === "admin.settings.errors.notAllowed" ? key : "translated")
    expect(translateSettingError("notAllowed:something specific", t)).toBe("something specific")
  })

  it("catches the real currency write path, not just the helper", () => {
    // The codes the backend emits must all be ones this function knows.
    for (const code of SETTING_ERROR_CODES) {
      expect(parseSettingError(`${code}:detail`)).not.toBeNull()
    }
  })
})
