import { useState, useCallback, useMemo, useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Search, Plus, Minus, Trash2, ShoppingCart, X, Percent, DollarSign, User, CreditCard, Banknote, Landmark, Receipt, Printer } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { SelectField, TextareaField } from "@/components/forms"
import { searchProductsForPos, getCustomers, processCheckout } from "@/lib/tauri"
import { useNotification } from "@/hooks/use-notification"
import type { ProductForPos, PaymentInput } from "@/types"

interface CartItem {
  productId: number
  name: string
  sku: string
  quantity: number
  unitPrice: number
  taxRate: number
  total: number
}

interface PaymentRow {
  method: string
  amount: number
  reference: string
  changeAmount: number
}

export function PosPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const notification = useNotification()
  const searchRef = useRef<HTMLInputElement>(null)

  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [cart, setCart] = useState<CartItem[]>([])
  const [customerId, setCustomerId] = useState<number | undefined>(undefined)
  const [payments, setPayments] = useState<PaymentRow[]>([{ method: "cash", amount: 0, reference: "", changeAmount: 0 }])
  const [notes, setNotes] = useState("")
  const [discount, setDiscount] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const { data: products = [] } = useQuery({
    queryKey: ["pos-search", debouncedSearch],
    queryFn: () => searchProductsForPos(debouncedSearch),
    enabled: debouncedSearch.length >= 0,
  })

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: getCustomers,
  })

  const filteredProducts = useMemo(() => {
    if (!debouncedSearch) return products.filter((p) => p.isActive)
    return products.filter((p) => p.isActive)
  }, [products, debouncedSearch])

  const addToCart = useCallback((product: ProductForPos) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id)
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unitPrice }
            : item
        )
      }
      return [...prev, { productId: product.id, name: product.name, sku: product.sku, quantity: 1, unitPrice: product.salePrice, taxRate: product.taxRate, total: product.salePrice }]
    })
  }, [])

  const updateQuantity = useCallback((productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId !== productId) return item
          const newQty = Math.max(0, item.quantity + delta)
          return newQty === 0 ? null : { ...item, quantity: newQty, total: newQty * item.unitPrice }
        })
        .filter(Boolean) as CartItem[]
    )
  }, [])

  const removeFromCart = useCallback((productId: number) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId))
  }, [])

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.total, 0), [cart])
  const discountAmount = useMemo(() => (discount > 0 ? subtotal * (discount / 100) : 0), [subtotal, discount])
  const taxAmount = useMemo(() => cart.reduce((sum, item) => sum + item.total * (item.taxRate / 100), 0), [cart])
  const total = useMemo(() => subtotal + taxAmount - discountAmount, [subtotal, taxAmount, discountAmount])

  const totalPaid = useMemo(() => payments.reduce((sum, p) => sum + Number(p.amount || 0), 0), [payments])
  const changeDue = useMemo(() => {
    const cashChange = payments
      .filter((p) => p.method === "cash")
      .reduce((sum, p) => sum + (Number(p.amount || 0) - totalPaid + totalPaid), 0)
    return Math.max(0, totalPaid - total)
  }, [payments, total, totalPaid])

  const updatePayment = useCallback((index: number, field: keyof PaymentRow, value: string | number) => {
    setPayments((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    )
  }, [])

  const addPayment = useCallback(() => {
    setPayments((prev) => [...prev, { method: "cash", amount: 0, reference: "", changeAmount: 0 }])
  }, [])

  const removePayment = useCallback((index: number) => {
    setPayments((prev) => prev.filter((_, i) => i !== index))
  }, [])

  useEffect(() => {
    setPayments((prev) =>
      prev.map((p) => {
        if (p.method === "cash") {
          const cashPortion = Math.min(p.amount || 0, total)
          const change = p.method === "cash" ? Math.max(0, (p.amount || 0) - total) : 0
          return { ...p, changeAmount: change }
        }
        return { ...p, changeAmount: 0 }
      })
    )
  }, [total])

  const checkoutMutation = useMutation({
    mutationFn: (input: { customerId?: number; items: CartItem[]; payments: PaymentRow[]; notes?: string }) => {
      const paymentInputs: PaymentInput[] = input.payments.map((p) => ({
        method: p.method,
        amount: Number(p.amount) || 0,
        reference: p.reference || undefined,
        changeAmount: p.method === "cash" ? changeDue : 0,
      }))
      const saleItems = input.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: 0,
        total: item.total,
      }))
      return processCheckout({
        customerId: input.customerId,
        items: saleItems,
        payments: paymentInputs,
        notes: input.notes || undefined,
      })
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["sales"] })
      queryClient.invalidateQueries({ queryKey: ["pos-search"] })
      queryClient.invalidateQueries({ queryKey: ["daily-closeout"] })
      notification.success(t("common.success"), t("sales.invoiceCreated"))
      navigate(`/sales/${result.sale.id}`)
    },
    onError: (err) => {
      notification.error(t("common.error"), String(err))
    },
  })

  const handleCheckout = useCallback(() => {
    if (cart.length === 0) return
    if (totalPaid < total) {
      notification.warning(t("common.warning"), t("sales.insufficientPayment"))
      return
    }
    checkoutMutation.mutate({ customerId, items: cart, payments, notes })
  }, [cart, totalPaid, total, customerId, payments, notes, checkoutMutation, notification, t])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSearch("")
        searchRef.current?.focus()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const customerOptions = useMemo(
    () => customers.map((c) => ({ label: c.name, value: c.id })),
    [customers]
  )

  const paymentMethods = useMemo(
    () => [
      { label: t("sales.cash"), value: "cash" },
      { label: t("sales.card"), value: "card" },
      { label: t("sales.transfer"), value: "transfer" },
    ],
    [t]
  )

  const formatCurrency = (value: number) =>
    value.toLocaleString("en-US", { style: "currency", currency: "USD" })

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("sales.newSale")}
        description={t("sales.description")}
        actions={
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden md:inline">Esc {t("common.clear")} | F1-F4 {t("common.actions")}</span>
            <Button variant="ghost" size="sm" onClick={() => navigate("/sales")}>
              <X className="h-4 w-4 mr-1" /> {t("common.cancel")}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
        <div className="xl:col-span-2 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchRef}
              placeholder={t("sales.searchProducts")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            {filteredProducts.slice(0, 60).map((product) => (
              <Card
                key={product.id}
                className="cursor-pointer hover:bg-accent hover:border-primary/50 transition-all active:scale-[0.98]"
                onClick={() => addToCart(product)}
              >
                <CardContent className="p-3 space-y-1">
                  <div className="font-medium text-sm truncate leading-tight">{product.name}</div>
                  <div className="text-xs text-muted-foreground font-mono">{product.sku}</div>
                  <div className="text-sm font-bold text-primary">{formatCurrency(product.salePrice)}</div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant={product.stockQuantity <= 5 ? "destructive" : "outline"}
                      className="text-xs"
                    >
                      {product.stockQuantity} {product.unit}
                    </Badge>
                    {product.taxRate > 0 && (
                      <span className="text-[10px] text-muted-foreground">TAX {product.taxRate}%</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredProducts.length === 0 && (
              <div className="col-span-full py-16 text-center text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">{search ? t("common.noResults") : t("sales.typeToSearch")}</p>
              </div>
            )}
          </div>
        </div>

        <div className="xl:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShoppingCart className="h-4 w-4" /> {t("sales.cart")} ({cart.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {cart.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">{t("sales.cartEmpty")}</p>
              ) : (
                <>
                  <div className="max-h-[360px] overflow-y-auto space-y-2 pr-1">
                    {cart.map((item) => (
                      <div key={item.productId} className="flex items-center justify-between gap-2 rounded-lg border p-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{formatCurrency(item.unitPrice)}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateQuantity(item.productId, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-medium tabular-nums">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateQuantity(item.productId, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="text-sm font-medium w-20 text-right tabular-nums">
                          {formatCurrency(item.total)}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive shrink-0"
                          onClick={() => removeFromCart(item.productId)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="space-y-2 text-sm">
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("sales.subtotal")}</span>
                        <span className="tabular-nums">{formatCurrency(subtotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("sales.tax")}</span>
                        <span className="tabular-nums">{formatCurrency(taxAmount)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">{t("sales.discount")}</span>
                        <div className="flex items-center gap-1 w-32">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            value={discount || ""}
                            onChange={(e) => setDiscount(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                            className="h-7 text-xs text-right"
                            placeholder="0"
                          />
                          <Percent className="h-3 w-3 text-muted-foreground shrink-0" />
                        </div>
                      </div>
                      {discountAmount > 0 && (
                        <div className="flex justify-between text-destructive">
                          <span>{t("sales.discountAmount")}</span>
                          <span className="tabular-nums">-{formatCurrency(discountAmount)}</span>
                        </div>
                      )}
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-base">
                      <span>{t("sales.total")}</span>
                      <span className="tabular-nums">{formatCurrency(total)}</span>
                    </div>
                  </div>
                </>
              )}

              <Separator />

              <div className="space-y-3">
                <SelectField
                  label={t("sales.customer")}
                  options={customerOptions}
                  value={customerId}
                  onChange={(v) => setCustomerId(v ? Number(v) : undefined)}
                  placeholder={t("common.selectOptional")}
                />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">{t("sales.payments")}</label>
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={addPayment}>
                      <Plus className="h-3 w-3 mr-1" /> {t("common.add")}
                    </Button>
                  </div>
                  {payments.map((payment, index) => (
                    <div key={index} className="flex items-start gap-2 rounded-lg border p-2">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <select
                            value={payment.method}
                            onChange={(e) => updatePayment(index, "method", e.target.value)}
                            className="h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                          >
                            {paymentMethods.map((pm) => (
                              <option key={pm.value} value={pm.value}>
                                {pm.label}
                              </option>
                            ))}
                          </select>
                          <div className="relative flex-1">
                            <DollarSign className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={payment.amount || ""}
                              onChange={(e) => updatePayment(index, "amount", Number(e.target.value) || 0)}
                              className="h-8 pl-6 text-xs text-right"
                              placeholder="0.00"
                            />
                          </div>
                          {payments.length > 1 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive shrink-0"
                              onClick={() => removePayment(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        {payment.method === "transfer" && (
                          <Input
                            placeholder={t("sales.reference")}
                            value={payment.reference}
                            onChange={(e) => updatePayment(index, "reference", e.target.value)}
                            className="h-7 text-xs"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{t("sales.totalPaid")}</span>
                    <span className="tabular-nums">{formatCurrency(totalPaid)}</span>
                  </div>
                  {changeDue > 0 && (
                    <div className="flex justify-between text-xs font-medium text-emerald-600">
                      <span>{t("sales.changeDue")}</span>
                      <span className="tabular-nums">{formatCurrency(changeDue)}</span>
                    </div>
                  )}
                </div>

                <TextareaField
                  label={t("inventory.notes")}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="text-xs"
                />
              </div>

              <Button
                className="w-full h-11 text-base"
                size="lg"
                onClick={handleCheckout}
                disabled={cart.length === 0 || checkoutMutation.isPending || totalPaid < total}
              >
                {checkoutMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    {t("common.processing")}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Receipt className="h-4 w-4" />
                    {t("sales.completeSale")} {total > 0 && `- ${formatCurrency(total)}`}
                  </span>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
