import { describe, it, expect } from "vitest"
import { formatCurrency, formatNumber, formatDate, formatDateTime } from "@/lib/utils"

describe("formatCurrency", () => {
  it("formats positive amounts", () => {
    expect(formatCurrency(1234.56)).toBe("$1,234.56")
  })

  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("$0.00")
  })

  it("formats negative amounts", () => {
    expect(formatCurrency(-500)).toBe("-$500.00")
  })

  it("formats large numbers", () => {
    expect(formatCurrency(1_000_000)).toBe("$1,000,000.00")
  })

  it("rounds to 2 decimal places", () => {
    expect(formatCurrency(10.999)).toBe("$11.00")
  })
})

describe("formatNumber", () => {
  it("formats integers", () => {
    expect(formatNumber(1000)).toBe("1,000")
  })

  it("formats decimals", () => {
    expect(formatNumber(1234.56)).toBe("1,234.56")
  })

  it("formats zero", () => {
    expect(formatNumber(0)).toBe("0")
  })
})

describe("formatDate", () => {
  it("formats Date object", () => {
    const date = new Date("2025-06-15T10:30:00Z")
    const result = formatDate(date)
    expect(result).toContain("Jun")
    expect(result).toContain("15")
    expect(result).toContain("2025")
  })

  it("formats ISO string", () => {
    const result = formatDate("2025-06-15T10:30:00Z")
    expect(result).toContain("Jun")
    expect(result).toContain("15")
    expect(result).toContain("2025")
  })

  it("throws on invalid date", () => {
    expect(() => formatDate("invalid")).toThrow()
  })
})

describe("formatDateTime", () => {
  it("includes time component", () => {
    const result = formatDateTime("2025-06-15T14:30:00Z")
    expect(result).toContain("Jun")
    expect(result).toContain("15")
    expect(result).toContain("2025")
    expect(result).toMatch(/AM|PM/)
  })
})
