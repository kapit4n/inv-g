import type { FilterRequest, FilterOperator } from "@/types/crud"

export function createFilter(
  field: string,
  operator: FilterOperator,
  value: unknown
): FilterRequest {
  return { field, operator, value }
}

export function applyFilters<T>(
  data: T[],
  filters: FilterRequest[]
): T[] {
  return data.filter((item) => {
    return filters.every((filter) => {
      const value = (item as Record<string, unknown>)[filter.field]
      return evaluateFilter(value, filter.operator, filter.value)
    })
  })
}

function evaluateFilter(
  value: unknown,
  operator: FilterOperator,
  filterValue: unknown
): boolean {
  switch (operator) {
    case "eq":
      return value === filterValue
    case "neq":
      return value !== filterValue
    case "gt":
      return typeof value === "number" && typeof filterValue === "number" && value > filterValue
    case "gte":
      return typeof value === "number" && typeof filterValue === "number" && value >= filterValue
    case "lt":
      return typeof value === "number" && typeof filterValue === "number" && value < filterValue
    case "lte":
      return typeof value === "number" && typeof filterValue === "number" && value <= filterValue
    case "contains":
      return typeof value === "string" && typeof filterValue === "string" && value.toLowerCase().includes(filterValue.toLowerCase())
    case "startsWith":
      return typeof value === "string" && typeof filterValue === "string" && value.startsWith(filterValue)
    case "endsWith":
      return typeof value === "string" && typeof filterValue === "string" && value.endsWith(filterValue)
    case "in":
      return Array.isArray(filterValue) && filterValue.includes(value)
    case "notIn":
      return Array.isArray(filterValue) && !filterValue.includes(value)
    case "between":
      return Array.isArray(filterValue) && filterValue.length === 2 && Number(value) >= Number(filterValue[0]) && Number(value) <= Number(filterValue[1])
    case "isNull":
      return value === null || value === undefined
    case "isNotNull":
      return value !== null && value !== undefined
    default:
      return true
  }
}

export function getActiveFilters(filters: FilterRequest[]): FilterRequest[] {
  return filters.filter((f) => f.value !== undefined && f.value !== null && f.value !== "")
}

export function removeFilter(filters: FilterRequest[], field: string): FilterRequest[] {
  return filters.filter((f) => f.field !== field)
}

export function clearFilters(): FilterRequest[] {
  return []
}
