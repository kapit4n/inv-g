import { useState, useCallback, useMemo, useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Search, Plus, Minus, Trash2, ShoppingCart, X, Percent, DollarSign, CreditCard, Banknote, Landmark, Receipt, Pause, Play, Clock, Tag, CheckCircle, ChevronDown, ChevronUp } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CustomerSearchField, TextareaField } from "@/components/forms"
import { processCheckout, getSaleItems, getHeldSales, getHeldSaleItems, holdSale, resumeHeldSale, deleteHeldSale } from "@/lib/tauri"
import { useNotification } from "@/hooks/use-notification"
import { useHotkey } from "@/hooks/use-hotkey"
import { usePrint, usePrintConfig, useProductSearch } from "@/hooks"
import { buildSaleReceiptModel, type ReceiptLabels } from "@/lib/print"
import { cn } from "@/lib/utils"
import type { ProductForPos, PaymentInput, CheckoutResult, HeldSale } from "@/types"

interface CartItem {
  productId: number
  name: string
  sku: string
  quantity: number
  unitPrice: number
  taxRate: number
  total: number
  stockQuantity: number
  unit: string
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
  const paymentRef = useRef<HTMLInputElement>(null)
  const print = usePrint()
  const config = usePrintConfig()

  const { query: search, setQuery: setSearch, products: searchResults, isLoading: searchLoading } = useProductSearch({ debounceMs: 200, queryAllWhenEmpty: true })
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [cart, setCart] = useState<CartItem[]>([])
  const [customerId, setCustomerId] = useState<number | undefined>(undefined)
  const [payments, setPayments] = useState<PaymentRow[]>([{ method: "cash", amount: 0, reference: "", changeAmount: 0 }])
  const [notes, setNotes] = useState("")
  const [discount, setDiscount] = useState(0)
  const [heldSalesOpen, setHeldSalesOpen] = useState(false)
  const [holdLabel, setHoldLabel] = useState("")
  const [holdDialogOpen, setHoldDialogOpen] = useState(false)
  const [completedSale, setCompletedSale] = useState<CheckoutResult | null>(null)
  const [notesExpanded, setNotesExpanded] = useState(false)

  const { data: heldSales = [], refetch: refetchHeld } = useQuery({
    queryKey: ["held-sales"],
    queryFn: getHeldSales,
  })

  const holdMutation = useMutation({
    mutationFn: () => {
      const items = cart.map((item) => ({
        productId: item.productId,
        name: item.name,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate,
        total: item.total,
        stockQuantity: item.stockQuantity,
        unit: item.unit,
      }))
      return holdSale({ customerId, items, discountPercent: discount, notes, label: holdLabel || undefined })
    },
    onSuccess: () => {
      setCart([])
      setCustomerId(undefined)
      setPayments([{ method: "cash", amount: 0, reference: "", changeAmount: 0 }])
      setNotes("")
      setDiscount(0)
      setHoldLabel("")
      setHoldDialogOpen(false)
      refetchHeld()
      notification.success(t("common.success"), t("sales.saleHeld"))
    },
    onError: (err) => {
      notification.error(t("common.error"), String(err))
    },
  })

  const resumeMutation = useMutation({
    mutationFn: (heldSaleId: number) => getHeldSaleItems(heldSaleId).then(async (items) => {
      await deleteHeldSale(heldSaleId)
      return items
    }),
    onSuccess: (items) => {
      if (items.length === 0) {
        refetchHeld()
        return
      }
      const restored: CartItem[] = items.map((item) => ({
        productId: item.productId,
        name: item.name,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate,
        total: item.total,
        stockQuantity: item.stockQuantity,
        unit: item.unit,
      }))
      setCart(restored)
      refetchHeld()
      notification.success(t("common.success"), t("sales.saleResumed"))
    },
    onError: (err) => {
      notification.error(t("common.error"), String(err))
    },
  })

  const cancelHoldMutation = useMutation({
    mutationFn: (heldSaleId: number) => deleteHeldSale(heldSaleId),
    onSuccess: () => {
      refetchHeld()
      notification.success(t("common.success"), t("sales.saleHoldCancelled"))
    },
    onError: (err) => {
      notification.error(t("common.error"), String(err))
    },
  })

  const filteredProducts = useMemo(() => searchResults.filter((p) => p.isActive), [searchResults])

  useEffect(() => {
    setSelectedIndex(0)
  }, [search])

  useEffect(() => {
    searchRef.current?.focus()
  }, [])

  const addToCart = useCallback((product: ProductForPos) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id)
      const inCart = existing?.quantity ?? 0
      if (product.stockQuantity <= 0 || inCart >= product.stockQuantity) {
        return prev
      }
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unitPrice }
            : item
        )
      }
      return [...prev, {
        productId: product.id,
        name: product.name,
        sku: product.sku,
        quantity: 1,
        unitPrice: product.salePrice,
        taxRate: product.taxRate,
        total: product.salePrice,
        stockQuantity: product.stockQuantity,
        unit: product.unit,
      }]
    })
  }, [])

  const handleProductClick = useCallback((product: ProductForPos) => {
    const inCart = cart.find((item) => item.productId === product.id)?.quantity ?? 0
    if (product.stockQuantity <= 0) {
      notification.warning(t("sales.stockOut"), product.name)
      return
    }
    if (inCart >= product.stockQuantity) {
      notification.warning(t("sales.stockOnly", { count: product.stockQuantity }), product.name)
      return
    }
    addToCart(product)
  }, [cart, addToCart, notification, t])

  const updateQuantity = useCallback((productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId !== productId) return item
          const nextQty = Math.max(0, Math.min(item.stockQuantity, item.quantity + delta))
          return nextQty === 0 ? null : { ...item, quantity: nextQty, total: nextQty * item.unitPrice }
        })
        .filter(Boolean) as CartItem[]
    )
  }, [])

  const setCartQuantity = useCallback((productId: number, quantity: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId !== productId) return item
          const nextQty = Math.max(0, Math.min(item.stockQuantity, quantity))
          return nextQty === 0 ? null : { ...item, quantity: nextQty, total: nextQty * item.unitPrice }
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
  const changeDue = useMemo(() => Math.max(0, totalPaid - total), [totalPaid, total])

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

  const printReceiptForSale = useCallback(async (result: CheckoutResult) => {
    const labels: ReceiptLabels = {
      title: t("sales.receipt"),
      subtotal: t("sales.subtotal"),
      tax: t("sales.tax"),
      discount: t("sales.discount"),
      total: t("sales.total"),
      customer: t("sales.customer"),
      methods: {
        cash: t("sales.cash"),
        card: t("sales.card"),
        transfer: t("sales.transfer"),
      },
    }
    try {
      const items = await getSaleItems(result.sale.id)
      const document = buildSaleReceiptModel(result.sale, items, result.payments, config, labels)
      print(document)
    } catch {
      // Receipt printing is best-effort; the sale is already complete.
    }
  }, [t, config, print])

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
      void printReceiptForSale(result)
      setCompletedSale(result)
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

  const resetNewSale = useCallback(() => {
    setCart([])
    setCustomerId(undefined)
    setPayments([{ method: "cash", amount: 0, reference: "", changeAmount: 0 }])
    setNotes("")
    setDiscount(0)
    setCompletedSale(null)
    setNotesExpanded(false)
    setTimeout(() => searchRef.current?.focus(), 0)
  }, [])

  useHotkey("Escape", () => {
    if (completedSale) {
      resetNewSale()
      return
    }
    setSearch("")
    searchRef.current?.focus()
  }, { deps: [setSearch, completedSale, resetNewSale] })

  useHotkey("F2", () => {
    if (completedSale) return
    const customerBtn = document.querySelector("[data-testid='customer-search'] button") as HTMLButtonElement | null
    customerBtn?.click()
  }, { deps: [completedSale] })

  useHotkey("F4", () => {
    if (completedSale) return
    paymentRef.current?.focus()
  }, { deps: [completedSale] })

  useHotkey("F10", () => {
    if (completedSale) return
    handleCheckout()
  }, { deps: [completedSale, handleCheckout] })

  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((i) => (filteredProducts.length === 0 ? 0 : Math.min(Math.max(i, 0) + 1, filteredProducts.length - 1)))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(Math.max(i, 0) - 1, 0))
    } else if (e.key === "Enter") {
      const target = filteredProducts[selectedIndex]
      if (target) {
        e.preventDefault()
        handleProductClick(target)
      }
    }
  }, [filteredProducts, selectedIndex, handleProductClick])

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
            {heldSales.length > 0 && (
              <Button variant="outline" size="sm" onClick={() => setHeldSalesOpen(!heldSalesOpen)} data-testid="held-sales-toggle">
                <Clock className="h-4 w-4 mr-1" />
                {t("sales.heldSalesCount", { count: heldSales.length })}
              </Button>
            )}
            <span className="text-xs text-muted-foreground hidden md:inline">{t("sales.posShortcuts")}</span>
            <Button variant="ghost" size="sm" onClick={() => navigate("/sales")}>
              <X className="h-4 w-4 mr-1" /> {t("common.cancel")}
            </Button>
          </div>
        }
      />

      {heldSalesOpen && (
        <Card data-testid="held-sales-panel">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4" /> {t("sales.heldSales")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {heldSales.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">{t("sales.noHeldSales")}</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {heldSales.map((held) => (
                  <div key={held.id} className="flex items-center justify-between gap-2 rounded-lg border p-2" data-testid={`held-sale-${held.id}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{held.holdNumber}</span>
                        {held.label && (
                          <Badge variant="outline" className="text-xs">
                            <Tag className="h-3 w-3 mr-1" />{held.label}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {held.customerName && <span>{held.customerName} · </span>}
                        {t("sales.items", { count: held.itemCount ?? 0 })} · {formatCurrency(held.total)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => resumeMutation.mutate(held.id)} disabled={resumeMutation.isPending} data-testid={`resume-held-${held.id}`}>
                        <Play className="h-3 w-3 mr-1" /> {t("sales.resumeSale")}
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={() => cancelHoldMutation.mutate(held.id)} disabled={cancelHoldMutation.isPending} data-testid={`cancel-held-${held.id}`}>
                        <X className="h-3 w-3 mr-1" /> {t("sales.cancelHold")}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {holdDialogOpen && (
        <Card data-testid="hold-dialog">
          <CardContent className="pt-6 space-y-3">
            <div>
              <label className="text-sm font-medium">{t("sales.holdSaleLabel")}</label>
              <Input
                value={holdLabel}
                onChange={(e) => setHoldLabel(e.target.value)}
                placeholder={t("sales.holdSaleLabelPlaceholder")}
                className="mt-1"
                data-testid="hold-label-input"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => holdMutation.mutate()} disabled={holdMutation.isPending} data-testid="confirm-hold">
                {holdMutation.isPending ? t("common.processing") : t("sales.holdSale")}
              </Button>
              <Button variant="ghost" onClick={() => { setHoldDialogOpen(false); setHoldLabel("") }} data-testid="cancel-hold-dialog">
                {t("common.cancel")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {completedSale && (
        <Card data-testid="checkout-success" className="border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950">
          <CardContent className="pt-6 space-y-4 text-center">
            <CheckCircle className="h-12 w-12 mx-auto text-emerald-600" />
            <div>
              <h3 className="text-lg font-bold">{t("sales.saleComplete")}</h3>
              <p className="text-sm text-muted-foreground">{t("sales.saleCompleteMsg", { number: completedSale.sale.saleNumber })}</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(completedSale.sale.total)}</p>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Button onClick={resetNewSale} data-testid="new-sale-button">
                {t("sales.newSaleButton")}
              </Button>
              <Button variant="outline" onClick={() => navigate(`/sales/${completedSale.sale.id}`)} data-testid="view-sale-button">
                {t("sales.viewSale")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!completedSale && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
        <div className="xl:col-span-2 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchRef}
              placeholder={t("sales.searchProducts")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="pl-9 h-10"
              aria-label={t("sales.searchProducts")}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            {filteredProducts.slice(0, 60).map((product, index) => (
              <Card
                key={product.id}
                className={cn(
                  "cursor-pointer transition-all active:scale-[0.98]",
                  index === selectedIndex
                    ? "ring-2 ring-primary border-primary bg-accent"
                    : "hover:bg-accent hover:border-primary/50"
                )}
                data-selected={index === selectedIndex}
                data-testid={`pos-product-${product.id}`}
                onClick={() => handleProductClick(product)}
              >
                <CardContent className="p-3 space-y-1">
                  <div className="font-medium text-sm truncate leading-tight">{product.name}</div>
                  <div className="text-xs text-muted-foreground font-mono">{product.sku}</div>
                  <div className="text-sm font-bold text-primary">{formatCurrency(product.salePrice)}</div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant={product.stockQuantity <= 0 ? "destructive" : product.stockQuantity <= 5 ? "warning" : "outline"}
                      className="text-xs"
                    >
                      {product.stockQuantity <= 0 ? t("sales.stockOut") : `${product.stockQuantity} ${product.unit}`}
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
                <p className="text-sm">{search ? t("common.noResults") : t("common.typeToSearch")}</p>
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
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(item.unitPrice)}
                            {item.stockQuantity - item.quantity > 0 && (
                              <span className="ml-2">
                                {t("sales.stockLeft", { count: item.stockQuantity - item.quantity, unit: item.unit })}
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateQuantity(item.productId, -1)}
                            aria-label={`${t("common.remove")} ${item.name}`}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            type="number"
                            min={1}
                            max={item.stockQuantity}
                            value={item.quantity}
                            onChange={(e) => setCartQuantity(item.productId, Number(e.target.value) || 0)}
                            className="h-7 w-12 px-1 text-center text-sm tabular-nums"
                            aria-label={`${t("inventory.quantity")} ${item.name}`}
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateQuantity(item.productId, 1)}
                            aria-label={`${t("common.add")} ${item.name}`}
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
                          aria-label={`${t("common.remove")} ${item.name}`}
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
                            aria-label={t("sales.discount")}
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
                <div data-testid="customer-search">
                  <CustomerSearchField
                    label={t("sales.customer")}
                    value={customerId}
                    onChange={setCustomerId}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">{t("sales.payments")}</label>
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={addPayment} data-testid="add-payment">
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
                            aria-label={t("sales.payment")}
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
                              ref={index === 0 ? paymentRef : undefined}
                              type="number"
                              min="0"
                              step="0.01"
                              value={payment.amount || ""}
                              onChange={(e) => updatePayment(index, "amount", Number(e.target.value) || 0)}
                              className="h-8 pl-6 text-xs text-right"
                              placeholder="0.00"
                              aria-label={`${t("sales.payment")} ${index + 1}`}
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
                        {payment.method === "cash" && total > 0 && index === 0 && (
                          <div className="flex items-center gap-1 mt-1" data-testid="quick-pay">
                            <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={() => updatePayment(0, "amount", Math.ceil(total))} data-testid="quick-pay-exact">
                              {t("sales.exactAmount")}
                            </Button>
                            {[20, 50, 100].map((denom) => (
                              <Button key={denom} variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={() => updatePayment(0, "amount", denom)} data-testid={`quick-pay-${denom}`}>
                                ${denom}
                              </Button>
                            ))}
                          </div>
                        )}
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

                <div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs w-full justify-between"
                    onClick={() => setNotesExpanded(!notesExpanded)}
                    data-testid="toggle-notes"
                  >
                    <span>{notesExpanded ? t("sales.notesExpanded") : t("sales.notesCollapsed")}</span>
                    {notesExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </Button>
                  {notesExpanded && (
                    <TextareaField
                      label=""
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="text-xs mt-1"
                      data-testid="notes-textarea"
                    />
                  )}
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setHoldDialogOpen(true)}
                disabled={cart.length === 0}
                data-testid="hold-sale-button"
              >
                <Pause className="h-4 w-4 mr-2" />
                {t("sales.holdSale")}
              </Button>

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
      )}
    </div>
  )
}
