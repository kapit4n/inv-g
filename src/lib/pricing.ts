// Pricing domain logic — mirrors `src-tauri/src/pricing.rs` 1:1.
//
// Rules:
// * `suggestedPrice = round2(cost * (1 + marginPct / 100))`
// * `effectiveMargin = product.margin ?? global.defaultMargin`
// * `effectivePrice = editedPrice ?? suggestedPrice`
//
// The backend is the source of truth; this module powers instant feedback in
// the UI (previewing suggested/effective prices as the user types).

export const MARGIN_MIN = 0
export const MARGIN_MAX = 90
export const DEFAULT_MARGIN_VALUE = 30

export function round2(x: number): number {
  return Math.round(x * 100) / 100
}

export function roundMargin(x: number): number {
  return Math.round(x * 10) / 10
}

/** Selling price suggested by a cost and a profit margin percentage. */
export function suggestedPrice(cost: number, marginPct: number): number {
  return round2(cost * (1 + marginPct / 100))
}

/** Resolve the effective margin: the product's own margin or the default. */
export function effectiveMargin(marginPct: number | null | undefined, defaultMarginPct: number): number {
  return marginPct ?? defaultMarginPct
}

/** Effective selling price: manual override or the computed suggested price. */
export function effectivePrice(suggested: number, editedPrice: number | null | undefined): number {
  return editedPrice ?? suggested
}

/** Convenience: effective price straight from a product's inputs. */
export function resolveEffectivePrice(
  cost: number,
  marginPct: number | null | undefined,
  defaultMarginPct: number,
  editedPrice: number | null | undefined,
): number {
  return effectivePrice(suggestedPrice(cost, effectiveMargin(marginPct, defaultMarginPct)), editedPrice)
}

/** Whether a margin percentage is inside the allowed range. */
export function isValidMargin(pct: number | null | undefined): boolean {
  if (pct === null || pct === undefined) return true
  if (Number.isNaN(pct)) return false
  return pct >= MARGIN_MIN && pct <= MARGIN_MAX
}

/** Whether an amount is negative (invalid). */
export function isNonNegative(amount: number): boolean {
  return !Number.isNaN(amount) && amount >= 0
}