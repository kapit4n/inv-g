import { useState, useCallback, useRef, useEffect } from "react"

interface UseSearchOptions {
  initialValue?: string
  debounceMs?: number
  onSearch?: (query: string) => void
}

export function useSearch(options: UseSearchOptions = {}) {
  const { initialValue = "", debounceMs = 300, onSearch } = options
  const [value, setValue] = useState(initialValue)
  const [debouncedValue, setDebouncedValue] = useState(initialValue)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setDebouncedValue(value)
      onSearch?.(value)
    }, debounceMs)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [value, debounceMs, onSearch])

  const handleChange = useCallback((newValue: string) => {
    setValue(newValue)
  }, [])

  const clear = useCallback(() => {
    setValue("")
    setDebouncedValue("")
    onSearch?.("")
  }, [onSearch])

  return {
    value,
    debouncedValue,
    setValue: handleChange,
    clear,
    onChange: handleChange,
  }
}
