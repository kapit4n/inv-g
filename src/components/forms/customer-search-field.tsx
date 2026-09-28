import { useState, useCallback, useRef, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Check, ChevronsUpDown, Plus, Search, Loader2, User, Pencil } from "lucide-react"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TextareaField } from "@/components/forms"
import { cn } from "@/lib/utils"
import { getCustomers, createCustomer, updateCustomer } from "@/lib/tauri"
import { useNotification } from "@/hooks/use-notification"
import { usePermissions } from "@/hooks"
import { useAuthStore } from "@/stores"
import type { Customer } from "@/types"

interface CustomerSearchFieldProps {
  value?: number
  onChange?: (customerId: number | undefined) => void
  label?: string
  placeholder?: string
  disabled?: boolean
}

export function CustomerSearchField({
  value,
  onChange,
  label,
  placeholder,
  disabled,
}: CustomerSearchFieldProps) {
  const notification = useNotification()
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  const effectiveLabel = label ?? t("customer")
  const effectivePlaceholder = placeholder ?? t("searchOrSelectCustomer")
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [selectedName, setSelectedName] = useState("")
  const [selected, setSelected] = useState<Customer | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  // A cashier holds `customers.update` so a name mistyped at the till can be
  // corrected here. They do not hold `customers.view`, so this is the only place
  // a cashier can touch a customer -- the one on the sale in front of them.
  const { hasPermission } = usePermissions()
  const canEdit = hasPermission("customers.update")
  const userId = useAuthStore((s) => s.user?.id)

  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [quickName, setQuickName] = useState("")
  const [quickEmail, setQuickEmail] = useState("")
  const [quickPhone, setQuickPhone] = useState("")
  const [quickNotes, setQuickNotes] = useState("")

  const [showEdit, setShowEdit] = useState(false)
  const [editName, setEditName] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [editPhone, setEditPhone] = useState("")
  const [editNotes, setEditNotes] = useState("")

  const { data: results = [], isFetching } = useQuery({
    queryKey: ["customer-search", search],
    queryFn: () => getCustomers(search || undefined),
    staleTime: 300,
  })

  useEffect(() => {
    if (!open) {
      setSearch("")
    }
  }, [open])

  useEffect(() => {
    if (open && searchRef.current) {
      searchRef.current.focus()
    }
  }, [open])

  useEffect(() => {
    if (value && results.length > 0 && !selectedName) {
      const found = results.find((c) => c.id === value)
      if (found) setSelectedName(found.name)
    }
  }, [value, results, selectedName])

  const quickAddMutation = useMutation({
    mutationFn: () =>
      createCustomer(
        quickName.trim(),
        quickEmail.trim() || undefined,
        quickPhone.trim() || undefined,
        undefined, undefined, undefined, undefined, undefined,
        quickNotes.trim() || undefined,
      ),
    onSuccess: (customer) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] })
      queryClient.invalidateQueries({ queryKey: ["customer-search"] })
      notification.success(t("customerAdded"), t("customerCreatedSuccessfully", { name: customer.name }))
      setShowQuickAdd(false)
      resetQuickForm()
      onChange?.(customer.id)
      setSelectedName(customer.name)
      setOpen(false)
    },
    onError: (err) => {
      notification.error(t("error"), String(err))
    },
  })

  const openEdit = useCallback(() => {
    if (!selected) return
    setEditName(selected.name)
    setEditEmail(selected.email ?? "")
    setEditPhone(selected.phone ?? "")
    setEditNotes(selected.notes ?? "")
    setShowEdit(true)
  }, [selected])

  const editMutation = useMutation({
    // `update_customer` overwrites every column, not just the ones this dialog
    // renders. The address fields are not shown here, so they are passed through
    // from the loaded record: omitting them would make saving a corrected name
    // quietly blank the customer's address.
    mutationFn: () => {
      if (!selected || userId === undefined) {
        return Promise.reject(new Error(t("customerUpdateFailed")))
      }
      return updateCustomer(
        userId, selected.id,
        editName.trim(),
        editEmail.trim() || undefined,
        editPhone.trim() || undefined,
        selected.address ?? undefined,
        selected.city ?? undefined,
        selected.state ?? undefined,
        selected.postalCode ?? undefined,
        selected.country ?? undefined,
        editNotes.trim() || undefined,
      )
    },
    onSuccess: (customer) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] })
      queryClient.invalidateQueries({ queryKey: ["customer-search"] })
      notification.success(t("customerUpdated"), t("customerCreatedSuccessfully", { name: customer.name }))
      setSelectedName(customer.name)
      setSelected(customer)
      setShowEdit(false)
    },
    onError: (err) => {
      notification.error(t("error"), String(err))
    },
  })

  const resetQuickForm = () => {
    setQuickName("")
    setQuickEmail("")
    setQuickPhone("")
    setQuickNotes("")
  }

  const handleSelect = useCallback(
    (customer: Customer) => {
      onChange?.(customer.id)
      setSelectedName(customer.name)
      setSelected(customer)
      setOpen(false)
    },
    [onChange]
  )

  const handleClear = useCallback(() => {
    onChange?.(undefined)
    setSelectedName("")
    setSelected(null)
  }, [onChange])

  return (
    <div className="space-y-2">
      {effectiveLabel && <label className="text-sm font-medium">{effectiveLabel}</label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            disabled={disabled}
            className={cn(
              "w-full justify-between h-9 px-3 py-2 text-sm font-normal",
              !value && "text-muted-foreground"
            )}
          >
            <div className="flex items-center gap-2 min-w-0">
              <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate">{value && selectedName ? selectedName : effectivePlaceholder}</span>
            </div>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <div className="flex items-center border-b px-3">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground mr-2" />
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchCustomers")}
              className="flex h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
            {isFetching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
          <div className="max-h-64 overflow-y-auto p-1">
            {results.length === 0 && !isFetching && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {search ? t("noCustomersFound") : t("typeToSearchCustomers")}
              </div>
            )}
            {results.map((customer) => (
              <button
                key={customer.id}
                className={cn(
                  "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  "focus:bg-accent focus:text-accent-foreground",
                  customer.id === value && "bg-accent text-accent-foreground"
                )}
                onClick={() => handleSelect(customer)}
              >
                <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                  {customer.id === value && <Check className="h-4 w-4" />}
                </span>
                <div className="flex flex-col items-start">
                  <span className="text-sm">{customer.name}</span>
                  {(customer.email || customer.phone) && (
                    <span className="text-xs text-muted-foreground">
                      {[customer.email, customer.phone].filter(Boolean).join(" · ")}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
          <div className="border-t p-1">
            <button
              className="relative flex w-full cursor-default select-none items-center gap-2 rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground text-primary"
              onClick={(e) => {
                e.preventDefault()
                setShowQuickAdd(true)
              }}
            >
              <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                <Plus className="h-4 w-4" />
              </span>
              {t("quickAddCustomer")}
            </button>
          </div>
        </PopoverContent>
      </Popover>
      {value && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-destructive transition-colors"
            onClick={handleClear}
          >
            {t("clearSelection")}
          </button>
          {canEdit && (
            <button
              type="button"
              data-testid="edit-customer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={openEdit}
            >
              <Pencil className="h-3 w-3" /> {t("editCustomerDetails")}
            </button>
          )}
        </div>
      )}

      <Dialog open={showEdit} onOpenChange={(v) => setShowEdit(v)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("editCustomerDetails")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("name")} *</label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder={t("customerName")}
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("email")}</label>
                <Input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder={t("email")}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("phone")}</label>
                <Input
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder={t("phone")}
                />
              </div>
            </div>
            <TextareaField
              label={t("notes")}
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              className="text-xs"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEdit(false)}>
              {t("cancel")}
            </Button>
            <Button
              onClick={() => editMutation.mutate()}
              disabled={!editName.trim() || editMutation.isPending}
            >
              {editMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("saving")}
                </span>
              ) : (
                t("save")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showQuickAdd} onOpenChange={(v) => { setShowQuickAdd(v); if (!v) resetQuickForm() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("quickAddCustomer")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("name")} *</label>
              <Input
                value={quickName}
                onChange={(e) => setQuickName(e.target.value)}
                placeholder={t("customerName")}
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("email")}</label>
                <Input
                  type="email"
                  value={quickEmail}
                  onChange={(e) => setQuickEmail(e.target.value)}
                  placeholder={t("email")}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("phone")}</label>
                <Input
                  value={quickPhone}
                  onChange={(e) => setQuickPhone(e.target.value)}
                  placeholder={t("phone")}
                />
              </div>
            </div>
            <TextareaField
              label={t("notes")}
              value={quickNotes}
              onChange={(e) => setQuickNotes(e.target.value)}
              className="text-xs"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowQuickAdd(false); resetQuickForm() }}>
              {t("cancel")}
            </Button>
            <Button
              onClick={() => quickAddMutation.mutate()}
              disabled={!quickName.trim() || quickAddMutation.isPending}
            >
              {quickAddMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("saving")}
                </span>
              ) : (
                `${t("add")} ${t("customer")}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
