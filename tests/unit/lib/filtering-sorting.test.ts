import { describe, it, expect } from "vitest"
import { createFilter, applyFilters, getActiveFilters, removeFilter, clearFilters } from "@/lib/filtering"
import { toggleSort, getSortIcon, applySort } from "@/lib/sorting"
import type { FilterOperator } from "@/types/crud"

/**
 * The in-memory query layer that `use-crud`, the list screens and the data
 * table all sit on. Every operator is exercised against a mixed-type record,
 * because the interesting behaviour is what happens when an operator meets a
 * value it cannot compare — a shop's product list is never uniformly typed
 * (a discontinued line has no `reorderPoint`, an archived one has no `price`),
 * and those rows must not vanish or throw.
 */

interface Row {
  id: number
  name: string
  price: number
  stock: number | null
  category: string | null
  tags: string[]
}

const rows: Row[] = [
  { id: 1, name: "Brake Pad Set", price: 45.5, stock: 12, category: "brakes", tags: ["front", "ceramic"] },
  { id: 2, name: "Oil Filter", price: 8.25, stock: 0, category: "filters", tags: ["engine"] },
  { id: 3, name: "Air Filter", price: 19.99, stock: null, category: "filters", tags: [] },
  { id: 4, name: "Spark Plugs", price: 32, stock: 40, category: null, tags: ["ignition", "ceramic"] },
]

describe("createFilter", () => {
  it("builds a filter request in field/operator/value order", () => {
    expect(createFilter("price", "gte", 10)).toEqual({ field: "price", operator: "gte", value: 10 })
  })
})

describe("applyFilters", () => {
  it("returns every row when there are no filters", () => {
    expect(applyFilters(rows, [])).toEqual(rows)
  })

  it("requires every filter to match, not just one", () => {
    const filters = [createFilter("category", "eq", "filters"), createFilter("stock", "eq", 0)]
    expect(applyFilters(rows, filters).map((r) => r.id)).toEqual([2])
  })

  describe("comparison operators", () => {
    it("eq / neq", () => {
      expect(applyFilters(rows, [createFilter("category", "eq", "filters")]).map((r) => r.id)).toEqual([2, 3])
      expect(applyFilters(rows, [createFilter("category", "neq", "filters")]).map((r) => r.id)).toEqual([1, 4])
    })

    it("gt / gte", () => {
      expect(applyFilters(rows, [createFilter("price", "gt", 32)]).map((r) => r.id)).toEqual([1])
      expect(applyFilters(rows, [createFilter("price", "gte", 32)]).map((r) => r.id)).toEqual([1, 4])
    })

    it("lt / lte", () => {
      expect(applyFilters(rows, [createFilter("price", "lt", 19.99)]).map((r) => r.id)).toEqual([2])
      expect(applyFilters(rows, [createFilter("price", "lte", 19.99)]).map((r) => r.id)).toEqual([2, 3])
  })

    it("treats a numeric operator against a null column as no match rather than coercing", () => {
      // Row 3 has `stock: null`. A naive `value > n` would coerce null to 0 and
      // silently surface out-of-stock rows as in-stock ones.
      expect(applyFilters(rows, [createFilter("stock", "gt", 0)]).map((r) => r.id)).toEqual([1, 4])
      expect(applyFilters(rows, [createFilter("stock", "lt", 100)]).map((r) => r.id)).toEqual([1, 2, 4])
    })

    it("does not compare a numeric column against a non-numeric filter value", () => {
      expect(applyFilters(rows, [createFilter("price", "gt", "cheap")])).toEqual([])
    })
  })

  describe("string operators", () => {
    it("contains is case-insensitive", () => {
      expect(applyFilters(rows, [createFilter("name", "contains", "FILTER")]).map((r) => r.id)).toEqual([2, 3])
    })

    it("contains does not match a non-string column", () => {
      expect(applyFilters(rows, [createFilter("price", "contains", "8")])).toEqual([])
    })

    it("startsWith and endsWith are case-sensitive", () => {
      expect(applyFilters(rows, [createFilter("name", "startsWith", "Brake")]).map((r) => r.id)).toEqual([1])
      expect(applyFilters(rows, [createFilter("name", "startsWith", "brake")])).toEqual([])
      expect(applyFilters(rows, [createFilter("name", "endsWith", "Plugs")]).map((r) => r.id)).toEqual([4])
    })
  })

  describe("membership operators", () => {
    it("in and notIn", () => {
      expect(applyFilters(rows, [createFilter("category", "in", ["filters", null])]).map((r) => r.id)).toEqual([2, 3, 4])
      expect(applyFilters(rows, [createFilter("category", "notIn", ["filters"])]).map((r) => r.id)).toEqual([1, 4])
    })

    it("matches nothing when the membership value is not an array", () => {
      expect(applyFilters(rows, [createFilter("category", "in", "filters")])).toEqual([])
      expect(applyFilters(rows, [createFilter("category", "notIn", "filters")])).toEqual([])
    })

    it("between is inclusive on both bounds and requires exactly two bounds", () => {
      expect(applyFilters(rows, [createFilter("price", "between", [8.25, 32])]).map((r) => r.id)).toEqual([2, 3, 4])
      expect(applyFilters(rows, [createFilter("price", "between", [8.25, 19.99, 999])])).toEqual([])
      expect(applyFilters(rows, [createFilter("price", "between", [8.25])])).toEqual([])
    })
  })

  describe("null operators", () => {
    it("isNull matches null and undefined alike", () => {
      expect(applyFilters(rows, [createFilter("category", "isNull", true)]).map((r) => r.id)).toEqual([4])
      const withUndefined = [{ ...rows[0], category: undefined }]
      expect(applyFilters(withUndefined, [createFilter("category", "isNull", true)])).toHaveLength(1)
    })

    it("isNotNull", () => {
      expect(applyFilters(rows, [createFilter("category", "isNotNull", true)]).map((r) => r.id)).toEqual([1, 2, 3])
    })
  })

  it("keeps every row for an unrecognised operator instead of dropping the result set", () => {
    // A screen that adds an operator without teaching `evaluateFilter` about it
    // must not silently show an empty table.
    const bogus = [{ field: "price", operator: "soundsLike" as FilterOperator, value: 1 }]
    expect(applyFilters(rows, bogus)).toEqual(rows)
  })

  it("does not mutate the input array", () => {
    const input = [...rows]
    applyFilters(input, [createFilter("id", "eq", 1)])
    expect(input).toEqual(rows)
  })
})

describe("getActiveFilters", () => {
  it("drops filters whose value is undefined, null or an empty string", () => {
    const filters = [
      createFilter("a", "eq", "set"),
      createFilter("b", "eq", undefined),
      createFilter("c", "eq", null),
      createFilter("d", "contains", ""),
      createFilter("e", "eq", 0),
      createFilter("f", "eq", false),
    ]
    expect(getActiveFilters(filters).map((f) => f.field)).toEqual(["a", "e", "f"])
  })
})

describe("removeFilter", () => {
  it("removes every filter on the named field", () => {
    const filters = [createFilter("a", "eq", 1), createFilter("b", "eq", 2), createFilter("a", "eq", 3)]
    expect(removeFilter(filters, "a").map((f) => f.field)).toEqual(["b"])
  })

  it("is a no-op for an unknown field", () => {
    const filters = [createFilter("a", "eq", 1)]
    expect(removeFilter(filters, "zzz")).toEqual(filters)
  })
})

describe("clearFilters", () => {
  it("returns an empty list", () => {
    expect(clearFilters()).toEqual([])
  })
})

describe("toggleSort", () => {
  it("starts a new sort ascending", () => {
    expect(toggleSort(undefined, "name")).toEqual({ field: "name", direction: "asc" })
  })

  it("flips the direction when the same field is re-toggled", () => {
    expect(toggleSort({ field: "name", direction: "asc" }, "name")).toEqual({ field: "name", direction: "desc" })
    expect(toggleSort({ field: "name", direction: "desc" }, "name")).toEqual({ field: "name", direction: "asc" })
  })

  it("resets to ascending when a different field is chosen", () => {
    expect(toggleSort({ field: "name", direction: "desc" }, "price")).toEqual({ field: "price", direction: "asc" })
  })
})

describe("getSortIcon", () => {
  it("maps direction to an icon name", () => {
    expect(getSortIcon("asc")).toBe("arrow-up")
    expect(getSortIcon("desc")).toBe("arrow-down")
  })
})

describe("applySort", () => {
  it("returns the input untouched when there is no sort", () => {
    expect(applySort(rows, undefined)).toBe(rows)
  })

  it("sorts strings with locale rules, not raw codepoint order", () => {
    const names = [{ n: "banana" }, { n: "Apple" }, { n: "cherry" }]
    expect(applySort(names, { field: "n", direction: "asc" }).map((x) => x.n)).toEqual(["Apple", "banana", "cherry"])
    expect(applySort(names, { field: "n", direction: "desc" }).map((x) => x.n)).toEqual(["cherry", "banana", "Apple"])
  })

  it("sorts numbers ascending and descending", () => {
    expect(applySort(rows, { field: "price", direction: "asc" }).map((r) => r.id)).toEqual([2, 3, 4, 1])
    expect(applySort(rows, { field: "price", direction: "desc" }).map((r) => r.id)).toEqual([1, 4, 3, 2])
  })

  it("sinks null and undefined values to the end of an ascending sort", () => {
    // The stockless row must not lead the list: a shopkeeper reading the top of
    // a sorted stock column would otherwise see rows that cannot be reordered.
    const sorted = applySort(rows, { field: "stock", direction: "asc" })
    expect(sorted[sorted.length - 1].stock).toBeNull()
    expect(sorted.map((r) => r.id)).toEqual([2, 1, 4, 3])
  })

  it("keeps nulls last in a descending sort too", () => {
    const sorted = applySort(rows, { field: "stock", direction: "desc" })
    expect(sorted[sorted.length - 1].id).toBe(3)
  })

  it("does not mutate the input array", () => {
    const input = [...rows]
    applySort(input, { field: "price", direction: "asc" })
    expect(input.map((r) => r.id)).toEqual([1, 2, 3, 4])
  })
})
