import { describe, it, expect } from "vitest"

describe("BUG-001: Null safety in number formatting", () => {
  function safeFormat(v: number | null | undefined): string {
    return v?.toLocaleString("en-US") ?? "—"
  }

  it("formats valid numbers", () => {
    expect(safeFormat(1234)).toBe("1,234")
    expect(safeFormat(0)).toBe("0")
    expect(safeFormat(-50)).toBe("-50")
  })

  it("handles null", () => {
    expect(safeFormat(null)).toBe("—")
  })

  it("handles undefined", () => {
    expect(safeFormat(undefined)).toBe("—")
  })

  it("handles in array map", () => {
    const values: (number | null)[] = [100, null, 200, undefined as any]
    const result = values.map(safeFormat)
    expect(result).toEqual(["100", "—", "200", "—"])
  })
})
