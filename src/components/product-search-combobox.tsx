import { useState, useRef, useEffect, useCallback } from "react"
import { Check, ChevronsUpDown, Search, Loader2, Package } from "lucide-react"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useProductSearch } from "@/hooks"
import type { ProductForPos } from "@/types"

interface ProductSearchComboboxProps {
  onSelect: (product: ProductForPos) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function ProductSearchCombobox({
  onSelect,
  placeholder = "Search products by name, SKU, barcode, or brand...",
  disabled,
  className,
}: ProductSearchComboboxProps) {
  const [open, setOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const { query, setQuery, products, isLoading, isTyping } = useProductSearch({ debounceMs: 200 })

  useEffect(() => {
    if (!open) setQuery("")
  }, [open, setQuery])

  useEffect(() => {
    if (open && searchRef.current) searchRef.current.focus()
  }, [open])

  const handleSelect = useCallback(
    (product: ProductForPos) => {
      onSelect(product)
      setOpen(false)
      setQuery("")
    },
    [onSelect, setQuery]
  )

  const formatCurrency = (v: number) => v.toLocaleString("en-US", { style: "currency", currency: "USD" })

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          disabled={disabled}
          className={cn("w-full justify-between h-9 px-3 py-2 text-sm font-normal text-muted-foreground", className)}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Package className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{placeholder}</span>
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <div className="flex items-center border-b px-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground mr-2" />
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown" && products.length > 0) {
                e.preventDefault()
                const first = searchRef.current?.closest("[data-radix-popper-content-wrapper]")?.querySelector("button[role=option]") as HTMLElement
                first?.focus()
              }
            }}
            placeholder="Type to search..."
            className="flex h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {(isLoading || isTyping) && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
        <div className="max-h-72 overflow-y-auto p-1">
          {products.length === 0 && !isLoading && query.length > 0 && (
            <div className="py-6 text-center text-sm text-muted-foreground">No products found</div>
          )}
          {products.length === 0 && query.length === 0 && (
            <div className="py-6 text-center text-sm text-muted-foreground">Type to search products</div>
          )}
          {products.map((product) => (
            <button
              key={product.id}
              role="option"
              className={cn(
                "relative flex w-full cursor-default select-none items-center rounded-sm py-2 pl-8 pr-2 text-sm outline-none transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                "focus:bg-accent focus:text-accent-foreground"
              )}
              onClick={() => handleSelect(product)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  handleSelect(product)
                }
              }}
            >
              <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                <Check className="h-4 w-4 opacity-0" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{product.name}</span>
                  {product.brandName && (
                    <span className="text-xs text-muted-foreground shrink-0">{product.brandName}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-mono text-muted-foreground">{product.sku}</span>
                  {product.barcode && (
                    <span className="text-xs font-mono text-muted-foreground">{product.barcode}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <Badge
                  variant={product.stockQuantity <= 0 ? "destructive" : product.stockQuantity <= 5 ? "warning" : "outline"}
                  className="text-[10px] px-1.5 py-0"
                >
                  {product.stockQuantity <= 0 ? "Out" : `${product.stockQuantity} ${product.unit}`}
                </Badge>
                <span className="text-xs font-bold text-primary whitespace-nowrap">
                  {formatCurrency(product.salePrice)}
                </span>
              </div>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
