import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2, Plus, Search, Store, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useNotification } from "@/hooks/use-notification"
import { createSupplier, getSuppliers } from "@/lib/tauri"
import { cn } from "@/lib/utils"
import type { InventorySupplier } from "@/types/inventory"

interface SupplierPickerProps {
  value?: number
  onChange: (supplierId: number | undefined) => void
  label?: string
  placeholder?: string
  disabled?: boolean
  /** Test hook; the list is a plain scroll box otherwise. */
  className?: string
}

/**
 * Supplier picker for the quick-add product dialog.
 *
 * `getSuppliers` takes no search argument and returns the whole book, so the
 * filter runs on the client: the list only appears once there is something to
 * narrow down, which is what keeps this usable inside a dialog that is already
 * a column of fields.
 *
 * A supplier the shop has never bought from can be typed in here instead of
 * making the user abandon a half-filled product for the full supplier form —
 * same idea as the quick-add on `CustomerSearchField`, minus the second dialog.
 */
export function SupplierPicker({
  value,
  onChange,
  label,
  placeholder,
  disabled,
  className,
}: SupplierPickerProps) {
  const { t } = useTranslation()
  const notification = useNotification()
  const queryClient = useQueryClient()

  const [search, setSearch] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [newName, setNewName] = useState("")
  const [newPhone, setNewPhone] = useState("")
  /**
   * Suppliers created here, kept until the refetched list contains them.
   *
   * Without this the pick would appear to fail: `createSupplier` resolves, the
   * id is handed to the parent, and then the lookup still runs against the
   * pre-insert list, so the field drops back to the search box until the
   * invalidated query comes back with the new row.
   */
  const [created, setCreated] = useState<InventorySupplier[]>([])

  const { data: fetchedSuppliers = [], isLoading } = useQuery({
    queryKey: ["inventory-suppliers"],
    queryFn: getSuppliers,
  })

  const suppliers = useMemo(() => {
    const known = new Set(fetchedSuppliers.map((s) => s.id))
    return [...fetchedSuppliers, ...created.filter((s) => !known.has(s.id))]
  }, [fetchedSuppliers, created])

  const selected = suppliers.find((s) => s.id === value)

  const matches = useMemo(() => {
    const term = search.trim().toLowerCase()
    const list = term
      ? suppliers.filter(
          (s) =>
            s.companyName.toLowerCase().includes(term) ||
            (s.contactPerson ?? "").toLowerCase().includes(term) ||
            (s.taxNumber ?? "").toLowerCase().includes(term)
        )
      : suppliers
    return list.slice(0, 50)
  }, [suppliers, search])

  const createMutation = useMutation({
    mutationFn: () =>
      createSupplier({
        companyName: newName.trim(),
        phone: newPhone.trim() || undefined,
      }),
    onSuccess: (supplier) => {
      // `inventory-suppliers` is the key both this picker and the full supplier
      // page read, so one invalidation covers the new row in both places.
      queryClient.invalidateQueries({ queryKey: ["inventory-suppliers"] })
      notification.success(t("common.success"), t("inventory.quickAdd.supplierCreated", { name: supplier.companyName }))
      setCreated((list) => [...list, supplier])
      setIsCreating(false)
      setNewName("")
      setNewPhone("")
      setSearch("")
      onChange(supplier.id)
    },
    onError: (err) => {
      notification.error(t("common.error"), String(err))
    },
  })

  if (isCreating) {
    return (
      <div className={cn("space-y-2", className)} data-testid="supplier-picker-create">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">{t("inventory.quickAdd.newSupplier")}</label>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setIsCreating(false)}
            aria-label={t("common.cancel")}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder={t("inventory.supplierName")}
          autoFocus
          data-testid="supplier-new-name"
        />
        <Input
          value={newPhone}
          onChange={(e) => setNewPhone(e.target.value)}
          placeholder={t("inventory.supplierPhone")}
          data-testid="supplier-new-phone"
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setIsCreating(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => createMutation.mutate()}
            disabled={!newName.trim() || createMutation.isPending}
            data-testid="supplier-new-save"
          >
            {createMutation.isPending && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
            {t("common.add")}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-2", className)}>
      {label && <label className="text-sm font-medium">{label}</label>}

      {selected ? (
        <div
          className="flex h-9 items-center justify-between gap-2 rounded-md border border-input px-3 py-2 text-sm shadow-sm"
          data-testid="supplier-selected"
        >
          <div className="flex min-w-0 items-center gap-2">
            <Store className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">{selected.companyName}</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={() => onChange(undefined)}
            aria-label={t("inventory.quickAdd.clearSupplier")}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : (
        <>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={placeholder ?? t("inventory.quickAdd.searchSupplier")}
              className="pl-9"
              disabled={disabled}
              data-testid="supplier-search"
            />
            {isLoading && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
          </div>

          {search.trim() !== "" && (
            <div
              className="max-h-40 overflow-y-auto rounded-md border p-1"
              data-testid="supplier-results"
            >
              {matches.length === 0 ? (
                <p className="px-2 py-3 text-center text-xs text-muted-foreground">
                  {t("inventory.quickAdd.noSupplierFound")}
                </p>
              ) : (
                matches.map((supplier) => (
                  <button
                    key={supplier.id}
                    type="button"
                    className={cn(
                      "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors",
                      "hover:bg-accent hover:text-accent-foreground"
                    )}
                    onClick={() => onChange(supplier.id)}
                    data-testid={`supplier-option-${supplier.id}`}
                  >
                    <Store className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate">{supplier.companyName}</span>
                  </button>
                ))
              )}
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setIsCreating(true)}
            disabled={disabled}
            data-testid="supplier-new-toggle"
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            {t("inventory.quickAdd.newSupplier")}
          </Button>
        </>
      )}
    </div>
  )
}
