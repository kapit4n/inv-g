import { describe, it, expect } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useDataTable } from "@/hooks/use-data-table"

describe("useDataTable", () => {
  it("returns default values", () => {
    const { result } = renderHook(() => useDataTable())
    expect(result.current.page).toBe(1)
    expect(result.current.pageSize).toBe(20)
    expect(result.current.sort).toBeUndefined()
    expect(result.current.search).toBe("")
    expect(result.current.selectedIds).toEqual(new Set())
  })

  it("accepts initial options", () => {
    const { result } = renderHook(() =>
      useDataTable({ initialPage: 2, initialPageSize: 50, initialSort: { field: "name", direction: "asc" }, initialSearch: "test" })
    )
    expect(result.current.page).toBe(2)
    expect(result.current.pageSize).toBe(50)
    expect(result.current.sort).toEqual({ field: "name", direction: "asc" })
    expect(result.current.search).toBe("test")
  })

  it("setPage changes page and clears selection", () => {
    const { result } = renderHook(() => useDataTable())
    act(() => result.current.setSelectedIds(new Set([1, 2, 3])))
    act(() => result.current.setPage(3))
    expect(result.current.page).toBe(3)
    expect(result.current.selectedIds.size).toBe(0)
  })

  it("setPageSize changes size and resets to page 1", () => {
    const { result } = renderHook(() => useDataTable({ initialPage: 3 }))
    act(() => result.current.setPageSize(50))
    expect(result.current.pageSize).toBe(50)
    expect(result.current.page).toBe(1)
  })

  it("setSort updates sort and resets to page 1", () => {
    const { result } = renderHook(() => useDataTable({ initialPage: 3 }))
    act(() => result.current.setSort({ field: "name", direction: "desc" }))
    expect(result.current.sort).toEqual({ field: "name", direction: "desc" })
    expect(result.current.page).toBe(1)
  })

  it("setSearch updates search and resets page and selection", () => {
    const { result } = renderHook(() => useDataTable({ initialPage: 3 }))
    act(() => result.current.setSelectedIds(new Set([1])))
    act(() => result.current.setSearch("query"))
    expect(result.current.search).toBe("query")
    expect(result.current.page).toBe(1)
    expect(result.current.selectedIds.size).toBe(0)
  })

  it("resetSelection clears selected ids", () => {
    const { result } = renderHook(() => useDataTable())
    act(() => result.current.setSelectedIds(new Set([1, 2])))
    act(() => result.current.resetSelection())
    expect(result.current.selectedIds.size).toBe(0)
  })

  it("queryParams reflects current state", () => {
    const { result } = renderHook(() =>
      useDataTable({ initialPage: 2, initialPageSize: 25, initialSort: { field: "name", direction: "asc" }, initialSearch: "filter" })
    )
    expect(result.current.queryParams).toEqual({ page: 2, pageSize: 25, sort: { field: "name", direction: "asc" }, search: "filter" })
  })
})
