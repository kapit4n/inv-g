import { useState, useCallback, useMemo, type ReactNode } from "react"
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  X,
  RefreshCw,
  Loader2,
  Download,
  Upload,
  Plus,
  SlidersHorizontal,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { getPageNumbers } from "@/lib/pagination"
import { type TableColumn, type TableAction, type BulkAction, type SortRequest } from "@/types/crud"

const DEFAULT_PAGE_SIZES = [10, 20, 30, 50, 100]

export interface DataTableProps<T extends object> {
  data: T[]
  columns: TableColumn<T>[]
  total?: number
  loading?: boolean
  error?: string
  page?: number
  pageSize?: number
  sort?: SortRequest
  search?: string
  selectedIds?: Set<string | number>
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  onSort?: (sort: SortRequest | undefined) => void
  onSearch?: (query: string) => void
  onRefresh?: () => void
  onRowClick?: (row: T) => void
  onSelectionChange?: (ids: Set<string | number>) => void
  onAdd?: () => void
  onExport?: () => void
  onImport?: () => void
  actions?: TableAction<T>[]
  bulkActions?: BulkAction<T>[]
  pageSizes?: number[]
  rowId?: (row: T) => string | number
  emptyMessage?: string
  emptyIcon?: ReactNode
  searchPlaceholder?: string
  disableSearch?: boolean
  disableColumnToggle?: boolean
  stickyHeader?: boolean
  className?: string
}

export function DataTable<T extends object>({
  data,
  columns,
  total = 0,
  loading = false,
  error,
  page = 1,
  pageSize = 20,
  sort,
  search: searchValue = "",
  selectedIds = new Set(),
  onPageChange,
  onPageSizeChange,
  onSort,
  onSearch,
  onRefresh,
  onRowClick,
  onSelectionChange,
  onAdd,
  onExport,
  onImport,
  actions,
  bulkActions,
  pageSizes = DEFAULT_PAGE_SIZES,
  rowId = (row) => (row as Record<string, unknown> & T).id as string | number,
  emptyMessage = "No hay datos",
  emptyIcon,
  searchPlaceholder = "Buscar...",
  disableSearch = false,
  disableColumnToggle = false,
  stickyHeader = true,
  className,
}: DataTableProps<T>) {
  const [localSearch, setLocalSearch] = useState(searchValue)
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(columns.filter((c) => !c.hidden).map((c) => c.id))
  )
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const debouncedSearch = useMemo(() => {
    let timer: ReturnType<typeof setTimeout> | null = null
    return (value: string) => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        onSearch?.(value)
      }, 300)
    }
  }, [onSearch])

  const handleSearchChange = useCallback(
    (value: string) => {
      setLocalSearch(value)
      debouncedSearch(value)
    },
    [debouncedSearch]
  )

  const handleSort = useCallback(
    (columnId: string) => {
      if (!onSort) return
      if (sort?.field === columnId) {
        if (sort.direction === "asc") {
          onSort({ field: columnId, direction: "desc" })
        } else {
          onSort(undefined)
        }
      } else {
        onSort({ field: columnId, direction: "asc" })
      }
    },
    [sort, onSort]
  )

  const toggleColumn = useCallback((columnId: string) => {
    setVisibleColumns((prev) => {
      const next = new Set(prev)
      if (next.has(columnId)) {
        next.delete(columnId)
      } else {
        next.add(columnId)
      }
      return next
    })
  }, [])

  const toggleAllSelection = useCallback(() => {
    if (!onSelectionChange) return
    if (selectedIds.size === data.length) {
      onSelectionChange(new Set())
    } else {
      onSelectionChange(new Set(data.map(rowId)))
    }
  }, [data, selectedIds, onSelectionChange, rowId])

  const toggleRowSelection = useCallback(
    (id: string | number) => {
      if (!onSelectionChange) return
      const next = new Set(selectedIds)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      onSelectionChange(next)
    },
    [selectedIds, onSelectionChange]
  )

  const visibleColumnsList = columns.filter((c) => visibleColumns.has(c.id))
  const allSelected = data.length > 0 && selectedIds.size === data.length
  const someSelected = selectedIds.size > 0 && selectedIds.size < data.length

  const SortIcon = ({ columnId }: { columnId: string }) => {
    if (!sort || sort.field !== columnId) return <ChevronsUpDown className="h-3 w-3 opacity-50" />
    return sort.direction === "asc" ? (
      <ChevronUp className="h-3 w-3" />
    ) : (
      <ChevronDown className="h-3 w-3" />
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-destructive/10 p-4 mb-4">
          <X className="h-8 w-8 text-destructive" />
        </div>
        <p className="text-lg font-semibold mb-1">Error al cargar datos</p>
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        {onRefresh && (
          <Button variant="outline" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2 flex-wrap">
        {!disableSearch && (
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={localSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 pr-10"
            />
            {localSearch && (
              <button
                onClick={() => handleSearchChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 ml-auto">
          {onRefresh && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={onRefresh} disabled={loading}>
                    <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Actualizar</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {onExport && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={onExport}>
                    <Download className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Exportar</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {onImport && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={onImport}>
                    <Upload className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Importar</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {!disableColumnToggle && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Columnas</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {columns.map((col) => (
                  <DropdownMenuCheckboxItem
                    key={col.id}
                    checked={visibleColumns.has(col.id)}
                    onCheckedChange={() => toggleColumn(col.id)}
                  >
                    {col.header}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {onAdd && (
            <Button onClick={onAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar
            </Button>
          )}
        </div>
      </div>

      {selectedIds.size > 0 && bulkActions && bulkActions.length > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/50 text-sm">
          <span className="font-medium">{selectedIds.size} seleccionados</span>
          {bulkActions.map((action) => (
            <Button
              key={action.label}
              variant={action.variant || "outline"}
              size="sm"
              onClick={() => action.onClick(data.filter((r) => selectedIds.has(rowId(r))) as T[])}
            >
              {action.icon && <action.icon className="h-4 w-4 mr-1" />}
              {action.label}
            </Button>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelectionChange?.(new Set())}
          >
            Limpiar
          </Button>
        </div>
      )}

      <div className="relative overflow-auto rounded-md border">
        <table className="w-full caption-bottom text-sm">
          <thead className={cn(stickyHeader && "sticky top-0 z-10")}>
            <tr className="border-b bg-muted/50">
              {(onSelectionChange || actions) && (
                <th className="h-10 w-10 px-2 text-center align-middle">
                  {onSelectionChange && (
                    <Checkbox
                      checked={allSelected}
                      indeterminate={someSelected}
                      onCheckedChange={toggleAllSelection}
                      aria-label="Seleccionar todos"
                    />
                  )}
                </th>
              )}
              {visibleColumnsList.map((col) => (
                <th
                  key={col.id}
                  className={cn(
                    "h-10 px-3 text-left align-middle font-medium text-muted-foreground",
                    col.sortable !== false && "cursor-pointer select-none hover:text-foreground",
                    col.align === "right" && "text-right",
                    col.align === "center" && "text-center"
                  )}
                  style={{
                    width: col.width,
                    minWidth: col.minWidth,
                    maxWidth: col.maxWidth,
                  }}
                  onClick={() => col.sortable !== false && handleSort(col.id)}
                >
                  <div className="flex items-center gap-1">
                    <span>{col.header}</span>
                    {col.sortable !== false && <SortIcon columnId={col.id} />}
                  </div>
                </th>
              ))}
              {actions && actions.length > 0 && (
                <th className="h-10 w-[100px] px-3 text-right align-middle font-medium text-muted-foreground">
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading && data.length === 0 ? (
              <tr>
                <td
                  colSpan={
                    visibleColumnsList.length +
                    (onSelectionChange || actions ? 1 : 0) +
                    (actions ? 1 : 0)
                  }
                  className="p-8"
                >
                  <div className="flex flex-col items-center gap-3 py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Cargando datos...</p>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={
                    visibleColumnsList.length +
                    (onSelectionChange || actions ? 1 : 0) +
                    (actions ? 1 : 0)
                  }
                  className="p-8"
                >
                  <div className="flex flex-col items-center gap-3 py-12 text-center">
                    {emptyIcon || (
                      <div className="rounded-full bg-muted p-4">
                        <Search className="h-8 w-8 text-muted-foreground/50" />
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row) => {
                const id = rowId(row)
                const isSelected = selectedIds.has(id)
                return (
                  <tr
                    key={id}
                    className={cn(
                      "border-b transition-colors hover:bg-muted/30",
                      isSelected && "bg-muted/50",
                      onRowClick && "cursor-pointer"
                    )}
                    onClick={() => onRowClick?.(row)}
                  >
                    {(onSelectionChange || actions) && (
                      <td className="h-10 w-10 px-2 text-center align-middle">
                        {onSelectionChange && (
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleRowSelection(id)}
                            onClick={(e) => e.stopPropagation()}
                            aria-label="Seleccionar fila"
                          />
                        )}
                      </td>
                    )}
                    {visibleColumnsList.map((col) => {
                      const cellValue = col.accessorFn
                        ? col.accessorFn(row)
                        : col.accessorKey
                          ? (row as Record<string, unknown> & T)[col.accessorKey as string]
                          : undefined
                      return (
                        <td
                          key={col.id}
                          className={cn(
                            "h-10 px-3 align-middle",
                            col.align === "right" && "text-right",
                            col.align === "center" && "text-center"
                          )}
                        >
                          {col.cell ? col.cell(row) : String(cellValue ?? "")}
                        </td>
                      )
                    })}
                    {actions && actions.length > 0 && (
                      <td className="h-10 px-3 text-right align-middle">
                        <div className="flex items-center justify-end gap-1">
                          {actions
                            .filter((a) => !a.hidden?.(row))
                            .map((action) => (
                              <TooltipProvider key={action.label}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant={action.variant || "ghost"}
                                      size="icon"
                                      className="h-8 w-8"
                                      disabled={action.disabled?.(row)}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        action.onClick(row)
                                      }}
                                    >
                                      {action.icon && <action.icon className="h-4 w-4" />}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>{action.label}</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ))}
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            {total > 0 ? (
              <>{(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} de {total}</>
            ) : (
              "0 resultados"
            )}
          </span>
          <span className="text-muted-foreground/50">|</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
            className="h-8 rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {pageSizes.map((size) => (
              <option key={size} value={size}>
                {size} por página
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={page <= 1}
            onClick={() => onPageChange?.(1)}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={page <= 1}
            onClick={() => onPageChange?.(page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {getPageNumbers(page, totalPages).map((p, i) =>
            p === "..." ? (
              <span key={`ellipsis-${i}`} className="px-2 text-muted-foreground text-sm">
                ...
              </span>
            ) : (
              <Button
                key={p}
                variant={page === p ? "default" : "outline"}
                size="icon"
                className="h-8 w-8"
                onClick={() => onPageChange?.(p)}
              >
                {p}
              </Button>
            )
          )}

          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={page >= totalPages}
            onClick={() => onPageChange?.(page + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={page >= totalPages}
            onClick={() => onPageChange?.(totalPages)}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
