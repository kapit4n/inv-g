import { describe, it, expect } from "vitest"
import {
  formatCurrency,
  formatNumber,
  formatDate,
  formatDateTime,
} from "@/lib/print"

describe("print format helpers", () => {
  it("formats currency with symbol and two decimals", () => {
    expect(formatCurrency(12.5)).toBe("$12.50")
    expect(formatCurrency(0)).toBe("$0.00")
    expect(formatCurrency(1234.567)).toBe("$1,234.57")
  })

  it("handles null and NaN safely", () => {
    expect(formatCurrency(null as unknown as number)).toBe("0.00")
    expect(formatCurrency(undefined as unknown as number)).toBe("0.00")
    expect(formatCurrency(Number.NaN)).toBe("0.00")
  })

  it("honors a custom currency and locale", () => {
    expect(formatCurrency(12.5, "MXN", "es-MX")).toBe("$12.50")
  })

  it("formats numbers with up to two decimals", () => {
    expect(formatNumber(42)).toBe("42")
    expect(formatNumber(3.14159)).toBe("3.14")
    expect(formatNumber(Number.NaN)).toBe("0")
  })

  it("formats ISO dates", () => {
    expect(formatDate("2026-08-13T10:00:00Z")).toBe("8/13/2026")
    expect(formatDateTime("2026-08-13T10:00:00Z")).toContain("2026")
  })

  it("returns empty string for missing or invalid dates", () => {
    expect(formatDate(undefined)).toBe("")
    expect(formatDate("not-a-date")).toBe("")
    expect(formatDateTime("")).toBe("")
  })
})
