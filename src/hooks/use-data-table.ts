import { useState, useCallback, useMemo } from "react"
import type { SortRequest } from "@/types/crud"

interface UseDataTableOptions {
  initialPage?: number
  initialPageSize?: number
  initialSort?: SortRequest
  initialSearch?: string
}

export function useDataTable(options: UseDataTableOptions = {}) {
  const [page, setPage] = useState(options.initialPage ?? 1)
  const [pageSize, setPageSize] = useState(options.initialPageSize ?? 20)
  const [sort, setSort] = useState<SortRequest | undefined>(options.initialSort)
  const [search, setSearch] = useState(options.initialSearch ?? "")
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set())

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage)
    setSelectedIds(new Set())
  }, [])

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize)
    setPage(1)
    setSelectedIds(new Set())
  }, [])

  const handleSort = useCallback((newSort: SortRequest | undefined) => {
    setSort(newSort)
    setPage(1)
  }, [])

  const handleSearch = useCallback((newSearch: string) => {
    setSearch(newSearch)
    setPage(1)
    setSelectedIds(new Set())
  }, [])

  const resetSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const queryParams = useMemo(
    () => ({
      page,
      pageSize,
      sort,
      search,
    }),
    [page, pageSize, sort, search]
  )

  return {
    page,
    pageSize,
    sort,
    search,
    selectedIds,
    setPage: handlePageChange,
    setPageSize: handlePageSizeChange,
    setSort: handleSort,
    setSearch: handleSearch,
    setSelectedIds,
    resetSelection,
    queryParams,
  }
}
