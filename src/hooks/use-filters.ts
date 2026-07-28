import { useState, useCallback } from "react"
import type { FilterRequest, FilterOperator } from "@/types/crud"

export function useFilters() {
  const [filters, setFilters] = useState<FilterRequest[]>([])

  const addFilter = useCallback((field: string, operator: FilterOperator, value: unknown) => {
    setFilters((prev) => {
      const existing = prev.findIndex((f) => f.field === field)
      if (existing >= 0) {
        const next = [...prev]
        next[existing] = { field, operator, value }
        return next
      }
      return [...prev, { field, operator, value }]
    })
  }, [])

  const removeFilter = useCallback((field: string) => {
    setFilters((prev) => prev.filter((f) => f.field !== field))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters([])
  }, [])

  const hasActiveFilters = filters.length > 0

  return {
    filters,
    setFilters,
    addFilter,
    removeFilter,
    clearFilters,
    hasActiveFilters,
  }
}
