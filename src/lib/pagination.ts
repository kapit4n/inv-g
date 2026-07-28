import type { PaginatedResult, PaginationRequest } from "@/types/crud"

export function createEmptyPaginatedResult<T>(): PaginatedResult<T> {
  return {
    data: [],
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0,
  }
}

export function createPaginatedResult<T>(
  data: T[],
  total: number,
  request: PaginationRequest
): PaginatedResult<T> {
  return {
    data,
    total,
    page: request.page,
    pageSize: request.pageSize,
    totalPages: Math.max(1, Math.ceil(total / request.pageSize)),
  }
}

export function getPaginationParams(request: PaginationRequest) {
  return {
    limit: request.pageSize,
    offset: (request.page - 1) * request.pageSize,
  }
}

export function getPageNumbers(
  currentPage: number,
  totalPages: number,
  maxVisible = 7
): (number | "...")[] {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const pages: (number | "...")[] = []
  const half = Math.floor(maxVisible / 2)
  let start = Math.max(1, currentPage - half)
  let end = Math.min(totalPages, currentPage + half)

  if (currentPage - half <= 1) {
    end = Math.min(totalPages, maxVisible)
  }
  if (currentPage + half >= totalPages) {
    start = Math.max(1, totalPages - maxVisible + 1)
  }

  if (start > 1) {
    pages.push(1)
    if (start > 2) pages.push("...")
  }

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  if (end < totalPages) {
    if (end < totalPages - 1) pages.push("...")
    pages.push(totalPages)
  }

  return pages
}
