import { useState, useCallback, useRef, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Check, ChevronsUpDown, Plus, Search, Loader2, User } from "lucide-react"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TextareaField } from "@/components/forms"
import { cn } from "@/lib/utils"
import { getCustomers, createCustomer } from "@/lib/tauri"
import { useNotification } from "@/hooks/use-notification"
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
  label = "Customer",
  placeholder = "Search or select customer...",
  disabled,
}: CustomerSearchFieldProps) {
  const notification = useNotification()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [selectedName, setSelectedName] = useState("")
  const searchRef = useRef<HTMLInputElement>(null)

  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [quickName, setQuickName] = useState("")
  const [quickEmail, setQuickEmail] = useState("")
  const [quickPhone, setQuickPhone] = useState("")
  const [quickNotes, setQuickNotes] = useState("")

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
      notification.success("Customer added", `${customer.name} created successfully`)
      setShowQuickAdd(false)
      resetQuickForm()
      onChange?.(customer.id)
      setSelectedName(customer.name)
      setOpen(false)
    },
    onError: (err) => {
      notification.error("Error", String(err))
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
      setOpen(false)
    },
    [onChange]
  )

  const handleClear = useCallback(() => {
    onChange?.(undefined)
    setSelectedName("")
  }, [onChange])

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium">{label}</label>}
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
              <span className="truncate">{value && selectedName ? selectedName : placeholder}</span>
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
              placeholder="Search customers..."
              className="flex h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
            {isFetching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
          <div className="max-h-64 overflow-y-auto p-1">
            {results.length === 0 && !isFetching && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {search ? "No customers found" : "Type to search customers"}
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
              Quick Add Customer
            </button>
          </div>
        </PopoverContent>
      </Popover>
      {value && (
        <button
          type="button"
          className="text-xs text-muted-foreground hover:text-destructive transition-colors"
          onClick={handleClear}
        >
          Clear selection
        </button>
      )}

      <Dialog open={showQuickAdd} onOpenChange={(v) => { setShowQuickAdd(v); if (!v) resetQuickForm() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quick Add Customer</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name *</label>
              <Input
                value={quickName}
                onChange={(e) => setQuickName(e.target.value)}
                placeholder="Customer name"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={quickEmail}
                  onChange={(e) => setQuickEmail(e.target.value)}
                  placeholder="Email"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone</label>
                <Input
                  value={quickPhone}
                  onChange={(e) => setQuickPhone(e.target.value)}
                  placeholder="Phone"
                />
              </div>
            </div>
            <TextareaField
              label="Notes"
              value={quickNotes}
              onChange={(e) => setQuickNotes(e.target.value)}
              className="text-xs"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowQuickAdd(false); resetQuickForm() }}>
              Cancel
            </Button>
            <Button
              onClick={() => quickAddMutation.mutate()}
              disabled={!quickName.trim() || quickAddMutation.isPending}
            >
              {quickAddMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </span>
              ) : (
                "Add Customer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
