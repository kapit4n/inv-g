import { useCallback } from "react"
import { useQueryClient } from "@tanstack/react-query"

/**
 * Query keys whose data is derived from `products.stock_quantity`.
 *
 * Entries are *prefixes*: react-query matches a key when the supplied key is a
 * leading segment of the cached one, so `["inventory-products"]` also covers
 * `["inventory-products", page, pageSize, search]`, `inventory-products-all` and
 * `inventory-products-active`. Adding a variant under one of these prefixes needs
 * no change here.
 */
export const STOCK_QUERY_KEYS: readonly (readonly string[])[] = [
  // Counts of out-of-stock / low-stock products. This is what the dashboard's
  // "Needs attention" list and the inventory KPIs read.
  ["inventory-stats"],
  ["inventory-dashboard-stats"],
  // Product rows and detail, each of which carries the current quantity.
  ["inventory-products"],
  ["inventory-product"],
  ["products"],
  // Searches surface stock per row, so a stale result shows a quantity the
  // product no longer has. This is the one the product-search hook uses;
  // ["pos-search"] was also invalidated here before, but no query has ever used
  // that key.
  ["global-product-search"],
  ["reorder-suggestions"],
  // Movement history and the held/transfer views that read stock.
  ["inventory-movements"],
  ["store-inventory"],
  ["held-sales"],
]

/**
 * Invalidate everything that displays a stock level.
 *
 * Every operation that moves stock — a checkout, a refund, receiving a purchase
 * order, a supplier return, a manual adjustment, a transfer — must call this
 * once it succeeds. Stock is written by the backend in the same transaction that
 * records the movement, so the only thing that can be stale is the client cache.
 *
 * This exists because that list was previously written out by hand at each call
 * site, and the dashboard's "Needs attention" out-of-stock count was not on it:
 * selling the last unit of a product left the tile showing the pre-sale number
 * until the page was reloaded.
 */
export function useInvalidateStock(): () => void {
  const queryClient = useQueryClient()

  return useCallback(() => {
    for (const queryKey of STOCK_QUERY_KEYS) {
      queryClient.invalidateQueries({ queryKey })
    }
  }, [queryClient])
}
