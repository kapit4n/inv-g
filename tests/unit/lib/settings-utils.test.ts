import { describe, it, expect } from "vitest"
import {
  parseSettingOptions,
  parseSettingValidation,
  validateSettingValue,
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
