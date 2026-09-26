import type { ReorderSuggestion } from "@/types"

/**
 * Contract for "create a purchase order from a reorder suggestion".
 *
 * The suggestion page used to hand its payload to the order form through router
 * `location.state`, but the form never read it: `items` initialised to `[]` and
 * `supplierId` to `undefined`, so the button opened an empty order showing
 * "Sin artículos" with Save disabled. `location.state` is also lost on refresh
 * and cannot be linked to, so the payload now travels in the query string --
 * the same mechanism the receiving form already uses for `?poId=`.
 *
 * Both sides go through this module so the producer and the consumer cannot
 * drift apart again.
 */

export const ORDER_FROM_SUGGESTION_PATH = "/purchases/orders/new"

/** A single pre-filled line, as the order form understands it. */
export interface SuggestionDraft {
  productId: number
  name: string
  sku: string
  quantity: number
  unitCost: number
  supplierId?: number
}

export function createOrderFromSuggestionUrl(suggestion: ReorderSuggestion): string {
  const params = new URLSearchParams({
    productId: String(suggestion.productId),
    name: suggestion.productName,
    sku: suggestion.productSku,
    qty: String(suggestion.suggestedOrder),
  })

  // A supplier with a recorded cost gives the line a real unit cost; without
  // one the form falls back to the product price rather than seeding 0.
  if (suggestion.costPrice > 0) params.set("unitCost", String(suggestion.costPrice))
  if (suggestion.preferredSupplierId) {
    params.set("supplierId", String(suggestion.preferredSupplierId))
  }

  return `${ORDER_FROM_SUGGESTION_PATH}?${params.toString()}`
}

/** Reads the draft back. Returns null when the URL carries no usable product. */
export function parseOrderFromSuggestion(search: string | URLSearchParams): SuggestionDraft | null {
  const params = typeof search === "string" ? new URLSearchParams(search) : search

  const productId = Number(params.get("productId"))
  if (!Number.isFinite(productId) || productId <= 0) return null

  const quantity = Number(params.get("qty"))
  const unitCost = Number(params.get("unitCost"))
  const supplierId = Number(params.get("supplierId"))

  return {
    productId,
    name: params.get("name") ?? "",
    sku: params.get("sku") ?? "",
    // A suggestion always carries a positive quantity, but a hand-edited URL
    // must not be able to create a zero-quantity line.
    quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
    unitCost: Number.isFinite(unitCost) && unitCost > 0 ? unitCost : 0,
    supplierId: Number.isFinite(supplierId) && supplierId > 0 ? supplierId : undefined,
  }
}
