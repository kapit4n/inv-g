import { describe, it, expect } from "vitest"
import { readFileSync, existsSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { STOCK_QUERY_KEYS } from "@/hooks/use-stock-invalidation"

const ROOT = join(__dirname, "../..")
const read = (p: string) => readFileSync(join(ROOT, p), "utf8")

/**
 * Stock is written by the backend inside the same transaction that records the
 * movement, so the only thing that can be stale afterwards is the react-query
 * cache. Every operation that moves stock therefore has to invalidate the
 * queries that display it.
 *
 * This list was previously written out by hand at each call site and the
 * dashboard's out-of-stock tile was never on it, so selling the last unit of a
 * product left "Needs attention" showing a stale 0. These assertions fail if a
 * stock-moving flow is added, or loses its invalidation.
 */
const STOCK_MUTATING_FLOWS: { file: string; command: string; what: string }[] = [
  {
    file: "src/features/sales/pages/pos-page.tsx",
    command: "processCheckout",
    what: "a sale",
  },
  {
    file: "src/features/sales/pages/returns-page.tsx",
    command: "refundSale",
    what: "a full-sale refund",
  },
  {
    file: "src/features/sales/pages/sale-detail-page.tsx",
    command: "refundSale",
    what: "a refund from the sale detail page",
  },
  {
    file: "src/features/purchases/pages/purchase-receipt-form-page.tsx",
    command: "receivePurchaseOrder",
    what: "receiving a purchase order",
  },
  {
    file: "src/features/purchases/pages/purchase-returns-page.tsx",
    command: "createPurchaseReturn",
    what: "a supplier return",
  },
  {
    file: "src/features/inventory/pages/inventory-movement-form-page.tsx",
    command: "createInventoryMovement",
    what: "a manual stock adjustment",
  },
  {
    file: "src/features/inventory/pages/transfers-page.tsx",
    command: "transferInventoryBetweenStores",
    what: "an inter-store transfer",
  },
]

describe("stock-changing flows", () => {
  it.each(STOCK_MUTATING_FLOWS)("invalidates stock views after $what", ({ file, command }) => {
    expect(existsSync(join(ROOT, file)), `${file} moved`).toBe(true)
    const source = read(file)

    // Sanity check that the flow still exists; a renamed command would otherwise
    // make the invalidation assertion below pass on an empty page.
    expect(source).toContain(command)
    expect(source).toContain("useInvalidateStock")
    expect(source).toContain("invalidateStock()")
  })
})

describe("stock query keys", () => {
  it("covers the out-of-stock counts the dashboard reads", () => {
    // This is the key that was missing, and the one behind the reported bug.
    expect(STOCK_QUERY_KEYS).toContainEqual(["inventory-stats"])
  })

  it("covers product rows, which carry the current quantity", () => {
    expect(STOCK_QUERY_KEYS).toContainEqual(["inventory-products"])
    expect(STOCK_QUERY_KEYS).toContainEqual(["products"])
  })

  it("covers the searches that show a quantity per row", () => {
    expect(STOCK_QUERY_KEYS).toContainEqual(["global-product-search"])
  })

  it("has no duplicate or empty entries", () => {
    for (const key of STOCK_QUERY_KEYS) {
      expect(key.length).toBeGreaterThan(0)
    }
    const serialized = STOCK_QUERY_KEYS.map((k) => JSON.stringify(k))
    expect(new Set(serialized).size).toBe(serialized.length)
  })

  it("only lists keys that the app actually queries", () => {
    // Guards against a typo or a dead key that would silently never match
    // anything. Scans the whole tree so it stays correct as files move.
    const used = new Set<string>()
    const walk = (dir: string) => {
      for (const entry of readdirSync(join(ROOT, dir), { withFileTypes: true })) {
        const rel = `${dir}/${entry.name}`
        if (entry.isDirectory()) {
          walk(rel)
        } else if (/\.tsx?$/.test(entry.name)) {
          for (const m of read(rel).matchAll(/queryKey:\s*\[\s*"([^"]+)"/g)) {
            used.add(m[1])
          }
        }
      }
    }
    walk("src")

    for (const key of STOCK_QUERY_KEYS) {
      expect(used, `no query uses ${JSON.stringify(key)}`).toContain(key[0])
    }
  })
})
