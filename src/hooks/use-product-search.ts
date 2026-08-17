import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { globalProductSearch } from "@/lib/tauri"
import type { ProductForPos } from "@/types"

interface UseProductSearchOptions {
  debounceMs?: number
  limit?: number
  enabled?: boolean
  queryAllWhenEmpty?: boolean
}

export function useProductSearch(options: UseProductSearchOptions = {}) {
  const { debounceMs = 200, limit = 20, enabled = true, queryAllWhenEmpty = false } = options
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), debounceMs)
    return () => clearTimeout(timer)
  }, [query, debounceMs])

  const shouldQuery = queryAllWhenEmpty || debouncedQuery.trim().length > 0

  const { data = [], isLoading, isFetching } = useQuery({
    queryKey: ["global-product-search", debouncedQuery, limit],
    queryFn: () => globalProductSearch(debouncedQuery, limit),
    enabled: enabled && shouldQuery,
    staleTime: 30_000,
  })

  return {
    query,
    setQuery,
    products: data as ProductForPos[],
    isLoading: isLoading || (isFetching && debouncedQuery.length > 0),
    isTyping: query !== debouncedQuery,
  }
}
