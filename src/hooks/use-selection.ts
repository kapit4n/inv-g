import { useState, useCallback } from "react"

export function useSelection<T extends { id: number | string }>() {
  const [selected, setSelected] = useState<Set<string | number>>(new Set())

  const toggle = useCallback((id: string | number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const selectAll = useCallback((items: T[]) => {
    setSelected(new Set(items.map((i) => i.id)))
  }, [])

  const clearSelection = useCallback(() => {
    setSelected(new Set())
  }, [])

  const isSelected = useCallback(
    (id: string | number) => selected.has(id),
    [selected]
  )

  const allSelected = useCallback(
    (items: T[]) => items.length > 0 && selected.size === items.length,
    [selected]
  )

  return {
    selected,
    setSelected,
    toggle,
    selectAll,
    clearSelection,
    isSelected,
    allSelected: (items: T[]) => allSelected(items),
  }
}
