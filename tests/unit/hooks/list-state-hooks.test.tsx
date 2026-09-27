import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useSearch } from "@/hooks/use-search"
import { useSelection } from "@/hooks/use-selection"
import { useFilters } from "@/hooks/use-filters"
import { usePagination } from "@/hooks/use-pagination"

/**
 * The state hooks the list screens are built from. Each one guards a specific
 * way a list screen misbehaves: a search that fires on every keystroke, a
 * "select all" checkbox that lies, a filter applied twice, or a page counter
 * that walks off the end of the result set.
 */

describe("useSearch", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("starts empty and exposes both the raw and the debounced value", () => {
    const { result } = renderHook(() => useSearch())
    expect(result.current.value).toBe("")
    expect(result.current.debouncedValue).toBe("")
  })

  it("adopts an initial value as both raw and debounced", () => {
    const { result } = renderHook(() => useSearch({ initialValue: "brake" }))
    expect(result.current.value).toBe("brake")
    expect(result.current.debouncedValue).toBe("brake")
  })

  it("updates the raw value immediately but holds the debounced one back", () => {
    const { result } = renderHook(() => useSearch({ debounceMs: 300 }))

    act(() => {
      result.current.setValue("o")
    })
    act(() => {
      result.current.setValue("oi")
    })

    expect(result.current.value).toBe("oi")
    expect(result.current.debouncedValue).toBe("")

    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(result.current.debouncedValue).toBe("oi")
  })

  it("notifies the caller once, after the debounce elapses", () => {
    const onSearch = vi.fn()
    const { result } = renderHook(() => useSearch({ debounceMs: 200, onSearch }))

    act(() => {
      result.current.onChange("a")
    })
    act(() => {
      result.current.onChange("ab")
    })
    act(() => {
      result.current.onChange("abc")
    })

    expect(onSearch).not.toHaveBeenCalled()
    act(() => {
      vi.advanceTimersByTime(200)
    })
    // Three keystrokes, one query: a backend hit per keystroke is the bug the
    // debounce exists to prevent.
    expect(onSearch).toHaveBeenCalledTimes(1)
    expect(onSearch).toHaveBeenCalledWith("abc")
  })

  it("does not fire a pending search after the component unmounts", () => {
    const onSearch = vi.fn()
    const { result, unmount } = renderHook(() => useSearch({ debounceMs: 200, onSearch }))

    act(() => {
      result.current.setValue("half-typed")
    })
    unmount()
    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(onSearch).not.toHaveBeenCalled()
  })

  it("clears both values and tells the caller immediately", () => {
    const onSearch = vi.fn()
    const { result } = renderHook(() => useSearch({ debounceMs: 200, onSearch }))

    act(() => {
      result.current.setValue("brake")
    })
    act(() => {
      vi.advanceTimersByTime(200)
    })
    onSearch.mockClear()

    act(() => {
      result.current.clear()
    })

    // Clearing is a deliberate user action, so it must not also wait on the
    // timer — the list has to empty now.
    expect(result.current.value).toBe("")
    expect(result.current.debouncedValue).toBe("")
    expect(onSearch).toHaveBeenCalledWith("")
  })
})

describe("useSelection", () => {
  const items = [{ id: 1 }, { id: 2 }, { id: 3 }]

  it("starts with nothing selected", () => {
    const { result } = renderHook(() => useSelection())
    expect(result.current.selected.size).toBe(0)
    expect(result.current.isSelected(1)).toBe(false)
  })

  it("toggles an id on and off without disturbing the rest", () => {
    const { result } = renderHook(() => useSelection())

    act(() => {
      result.current.toggle(1)
    })
    act(() => {
      result.current.toggle(3)
    })
    expect([...result.current.selected]).toEqual([1, 3])

    act(() => {
      result.current.toggle(1)
    })
    expect([...result.current.selected]).toEqual([3])
  })

  it("treats a numeric id 1 and a string id \"1\" as different rows", () => {
    // Both id types exist in this schema, and a Set that conflated them would
    // let a bulk action hit the wrong record.
    const { result } = renderHook(() => useSelection())
    act(() => {
      result.current.toggle(1)
    })
    act(() => {
      result.current.toggle("1")
    })
    expect(result.current.selected.size).toBe(2)
  })

  it("selects every id in a list", () => {
    const { result } = renderHook(() => useSelection())
    act(() => {
      result.current.selectAll(items)
    })
    expect([...result.current.selected]).toEqual([1, 2, 3])
    expect(result.current.allSelected(items)).toBe(true)
  })

  it("replaces a previous selection on re-select-all rather than merging", () => {
    const { result } = renderHook(() => useSelection())
    act(() => {
      result.current.toggle(99)
    })
    act(() => {
      result.current.selectAll(items)
    })
    expect(result.current.isSelected(99)).toBe(false)
  })

  it("clears the selection", () => {
    const { result } = renderHook(() => useSelection())
    act(() => {
      result.current.selectAll(items)
    })
    act(() => {
      result.current.clearSelection()
    })
    expect(result.current.selected.size).toBe(0)
  })

  it("reports allSelected as false for an empty list", () => {
    // An empty page has nothing to select, so the header checkbox must not show
    // as ticked.
    const { result } = renderHook(() => useSelection())
    act(() => {
      result.current.selectAll(items)
    })
    expect(result.current.allSelected([])).toBe(false)
  })

  it("reports allSelected by count, so a selection from a previous page reads as complete", () => {
    // Documented limitation rather than a desired behaviour: `allSelected`
    // compares sizes, not identities. With a stale selection of the same length
    // as the new list, the header checkbox shows as ticked for rows the user
    // never selected. Pinned so a fix to compare identities is a visible diff.
    const { result } = renderHook(() => useSelection())
    act(() => {
      result.current.selectAll([{ id: 7 }, { id: 8 }])
    })
    expect(result.current.allSelected([{ id: 1 }, { id: 2 }])).toBe(true)
    expect(result.current.isSelected(1)).toBe(false)
  })
})

describe("useFilters", () => {
  it("starts with no filters", () => {
    const { result } = renderHook(() => useFilters())
    expect(result.current.filters).toEqual([])
    expect(result.current.hasActiveFilters).toBe(false)
  })

  it("appends a filter for a new field", () => {
    const { result } = renderHook(() => useFilters())
    act(() => {
      result.current.addFilter("category", "eq", "brakes")
    })
    act(() => {
      result.current.addFilter("stock", "lt", 5)
    })

    expect(result.current.filters).toEqual([
      { field: "category", operator: "eq", value: "brakes" },
      { field: "stock", operator: "lt", value: 5 },
    ])
    expect(result.current.hasActiveFilters).toBe(true)
  })

  it("replaces the existing filter when the same field is set again", () => {
    // A second click on the same column is a change of operator, not a second
    // filter; keeping both would AND two conditions on one field.
    const { result } = renderHook(() => useFilters())
    act(() => {
      result.current.addFilter("price", "gt", 10)
    })
    act(() => {
      result.current.addFilter("price", "lt", 100)
    })

    expect(result.current.filters).toEqual([{ field: "price", operator: "lt", value: 100 }])
  })

  it("keeps the position of a replaced filter", () => {
    const { result } = renderHook(() => useFilters())
    act(() => {
      result.current.addFilter("a", "eq", 1)
    })
    act(() => {
      result.current.addFilter("b", "eq", 2)
    })
    act(() => {
      result.current.addFilter("a", "eq", 9)
    })
    expect(result.current.filters.map((f) => f.field)).toEqual(["a", "b"])
  })

  it("removes a filter by field and leaves the others alone", () => {
    const { result } = renderHook(() => useFilters())
    act(() => {
      result.current.addFilter("a", "eq", 1)
    })
    act(() => {
      result.current.addFilter("b", "eq", 2)
    })
    act(() => {
      result.current.removeFilter("a")
    })

    expect(result.current.filters.map((f) => f.field)).toEqual(["b"])
  })

  it("clears every filter", () => {
    const { result } = renderHook(() => useFilters())
    act(() => {
      result.current.addFilter("a", "eq", 1)
    })
    act(() => {
      result.current.clearFilters()
    })

    expect(result.current.filters).toEqual([])
    expect(result.current.hasActiveFilters).toBe(false)
  })

  it("can be seeded and replaced wholesale through setFilters", () => {
    const { result } = renderHook(() => useFilters())
    act(() => {
      result.current.setFilters([{ field: "z", operator: "isNull", value: true }])
    })
    expect(result.current.filters).toHaveLength(1)
    expect(result.current.hasActiveFilters).toBe(true)
  })
})

describe("usePagination", () => {
  it("starts on page 1 with a default size of 20", () => {
    const { result } = renderHook(() => usePagination())
    expect(result.current.page).toBe(1)
    expect(result.current.pageSize).toBe(20)
    expect(result.current.totalPages).toBe(1)
  })

  it("adopts initial page and size", () => {
    const { result } = renderHook(() => usePagination({ initialPage: 3, initialPageSize: 50, total: 500 }))
    expect(result.current.page).toBe(3)
    expect(result.current.pageSize).toBe(50)
    expect(result.current.totalPages).toBe(10)
  })

  it("rounds a partial last page up", () => {
    const { result } = renderHook(() => usePagination({ total: 41, initialPageSize: 20 }))
    expect(result.current.totalPages).toBe(3)
  })

  it("clamps navigation to the available range", () => {
    const { result } = renderHook(() => usePagination({ total: 45, initialPageSize: 20 }))

    act(() => {
      result.current.setPage(99)
    })
    expect(result.current.page).toBe(3)

    act(() => {
      result.current.setPage(0)
    })
    expect(result.current.page).toBe(1)

    act(() => {
      result.current.setPage(-5)
    })
    expect(result.current.page).toBe(1)
  })

  it("walks forwards and backwards one page at a time", () => {
    const { result } = renderHook(() => usePagination({ total: 100, initialPageSize: 20 }))

    act(() => {
      result.current.nextPage()
    })
    expect(result.current.page).toBe(2)

    act(() => {
      result.current.prevPage()
    })
    expect(result.current.page).toBe(1)

    act(() => {
      result.current.prevPage()
    })
    expect(result.current.page).toBe(1)
  })

  it("jumps to the first and last page", () => {
    const { result } = renderHook(() => usePagination({ total: 100, initialPageSize: 20 }))
    act(() => {
      result.current.lastPage()
    })
    expect(result.current.page).toBe(5)
    act(() => {
      result.current.firstPage()
    })
    expect(result.current.page).toBe(1)
  })

  it("returns to page 1 when the page size changes", () => {
    // Otherwise switching 20 -> 100 while on page 5 lands past the end.
    const { result } = renderHook(() => usePagination({ total: 100, initialPageSize: 20 }))
    act(() => {
      result.current.nextPage()
    })
    act(() => {
      result.current.nextPage()
    })
    expect(result.current.page).toBe(3)

    act(() => {
      result.current.setPageSize(100)
    })
    expect(result.current.pageSize).toBe(100)
    expect(result.current.page).toBe(1)
    expect(result.current.totalPages).toBe(1)
  })

  it("reports the visible range for the current page", () => {
    const { result } = renderHook(() => usePagination({ total: 45, initialPageSize: 20 }))
    expect(result.current.from).toBe(1)
    expect(result.current.to).toBe(20)

    act(() => {
      result.current.nextPage()
    })
    expect(result.current.from).toBe(21)
    // Clamped to the real total so the footer never claims 60 of 45.
    expect(result.current.to).toBe(40)

    act(() => {
      result.current.nextPage()
    })
    expect(result.current.from).toBe(41)
    expect(result.current.to).toBe(45)
  })

  it("reports a from above to when there is nothing to show", () => {
    // Empty result set: a caller rendering "from - to of total" needs to
    // recognise this and print the empty state instead of "1 - 0 of 0".
    const { result } = renderHook(() => usePagination({ total: 0 }))
    expect(result.current.from).toBe(1)
    expect(result.current.to).toBe(0)
  })
})
