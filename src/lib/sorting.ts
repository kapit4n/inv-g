import type { SortRequest } from "@/types/crud"

export function toggleSort(
  current: SortRequest | undefined,
  field: string
): SortRequest {
  if (current?.field === field) {
    return {
      field,
      direction: current.direction === "asc" ? "desc" : "asc",
    }
  }
  return { field, direction: "asc" }
}

export function getSortIcon(direction: "asc" | "desc"): string {
  return direction === "asc" ? "arrow-up" : "arrow-down"
}

export function applySort<T>(
  data: T[],
  sort: SortRequest | undefined
): T[] {
  if (!sort) return data
  return [...data].sort((a, b) => {
    const aVal = (a as Record<string, unknown>)[sort.field]
    const bVal = (b as Record<string, unknown>)[sort.field]
    const direction = sort.direction === "asc" ? 1 : -1
    if (aVal == null) return 1
    if (bVal == null) return -1
    if (typeof aVal === "string" && typeof bVal === "string") {
      return aVal.localeCompare(bVal) * direction
    }
    return (aVal < bVal ? -1 : aVal > bVal ? 1 : 0) * direction
  })
}
