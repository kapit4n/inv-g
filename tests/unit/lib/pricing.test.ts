import { describe, it, expect } from "vitest"
import {
  round2,
  roundMargin,
  suggestedPrice,
  effectiveMargin,
  effectivePrice,
  resolveEffectivePrice,
  isValidMargin,
  isNonNegative,
  MARGIN_MIN,
  MARGIN_MAX,
} from "@/lib/pricing"

describe("pricing domain (mirrors backend pricing.rs)", () => {
  it("round2 rounds to two decimals", () => {
    expect(round2(12.345)).toBe(12.35)
    expect(round2(12.344)).toBe(12.34)
    expect(round2(10)).toBe(10)
  })

  it("roundMargin rounds to one decimal", () => {
    expect(roundMargin(42.857)).toBe(42.9)
  })

  it("suggestedPrice = cost * (1 + margin/100)", () => {
    expect(suggestedPrice(100, 30)).toBe(130)
    expect(suggestedPrice(70, 30)).toBe(91)
    expect(suggestedPrice(24.5, 42.9)).toBe(35.01)
  })

  it("effectiveMargin falls back to the default", () => {
    expect(effectiveMargin(15, 30)).toBe(15)
    expect(effectiveMargin(null, 30)).toBe(30)
    expect(effectiveMargin(undefined, 30)).toBe(30)
  })

  it("effectivePrice prefers the edited override", () => {
    expect(effectivePrice(130, null)).toBe(130)
    expect(effectivePrice(130, 150)).toBe(150)
  })

  it("resolveEffectivePrice end-to-end", () => {
    expect(resolveEffectivePrice(100, null, 30, null)).toBe(130)
    expect(resolveEffectivePrice(100, 50, 30, null)).toBe(150)
    expect(resolveEffectivePrice(100, 50, 30, 999)).toBe(999)
  })

  it("isValidMargin enforces the range", () => {
    expect(isValidMargin(MARGIN_MIN)).toBe(true)
    expect(isValidMargin(MARGIN_MAX)).toBe(true)
    expect(isValidMargin(30.5)).toBe(true)
    expect(isValidMargin(-1)).toBe(false)
    expect(isValidMargin(90.1)).toBe(false)
    expect(isValidMargin(Number.NaN)).toBe(false)
    expect(isValidMargin(null)).toBe(true)
  })

  it("isNonNegative rejects negatives", () => {
    expect(isNonNegative(0)).toBe(true)
    expect(isNonNegative(12.5)).toBe(true)
    expect(isNonNegative(-0.01)).toBe(false)
  })
})