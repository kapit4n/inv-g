import { useState, useCallback, useMemo } from "react"

interface UsePaginationOptions {
  initialPage?: number
  initialPageSize?: number
  total?: number
}

export function usePagination(options: UsePaginationOptions = {}) {
  const { initialPage = 1, initialPageSize = 20, total = 0 } = options
  const [page, setPage] = useState(initialPage)
  const [pageSize, setPageSize] = useState(initialPageSize)

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize]
  )

  const goToPage = useCallback(
    (newPage: number) => {
      setPage(Math.max(1, Math.min(newPage, totalPages)))
    },
    [totalPages]
  )

  const nextPage = useCallback(() => {
    goToPage(page + 1)
  }, [page, goToPage])

  const prevPage = useCallback(() => {
    goToPage(page - 1)
  }, [page, goToPage])

  const firstPage = useCallback(() => {
    goToPage(1)
  }, [goToPage])

  const lastPage = useCallback(() => {
    goToPage(totalPages)
  }, [totalPages, goToPage])

  const changePageSize = useCallback((newSize: number) => {
    setPageSize(newSize)
    setPage(1)
  }, [])

  const from = useMemo(() => (page - 1) * pageSize + 1, [page, pageSize])
  const to = useMemo(() => Math.min(page * pageSize, total), [page, pageSize, total])

  return {
    page,
    pageSize,
    totalPages,
    from,
    to,
    total,
    setPage: goToPage,
    setPageSize: changePageSize,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
  }
}
