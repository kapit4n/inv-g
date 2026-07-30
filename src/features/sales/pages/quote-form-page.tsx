import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router-dom"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Trash2, Search } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { CustomerSearchField, TextField, TextareaField } from "@/components/forms"
import { getQuote, getQuoteItems, createQuote, updateQuote, searchProductsForPos } from "@/lib/tauri"
import { useNotification } from "@/hooks/use-notification"
import type { SaleItemInput } from "@/types"

interface LineItem extends SaleItemInput {
  name?: string
  sku?: string
}

export function QuoteFormPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = !!id
  const queryClient = useQueryClient()
  const notification = useNotification()

  const [customerId, setCustomerId] = useState<number | undefined>()
  const [items, setItems] = useState<LineItem[]>([])
  const [taxRate, setTaxRate] = useState(0.16)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [validUntil, setValidUntil] = useState("")
  const [notes, setNotes] = useState("")
  const [termsConditions, setTermsConditions] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])

  useEffect(() => {
    if (!id) return
    getQuote(Number(id)).then((q) => {
      setCustomerId(q.customerId)
      setTaxRate(q.taxRate)
      setDiscountAmount(q.discountAmount)
      setValidUntil(q.validUntil || "")
      setNotes(q.notes || "")
      setTermsConditions(q.termsConditions || "")
    })
    getQuoteItems(Number(id)).then((qis) => {
      setItems(qis.map((qi) => ({
        productId: qi.productId, quantity: qi.quantity,
        unitPrice: qi.unitPrice, discount: qi.discount,
        total: qi.total, name: qi.productName, sku: qi.productSku,
      })))
    })
  }, [id])

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return }
    const timer = setTimeout(async () => {
      const results = await searchProductsForPos(searchQuery)
      setSearchResults(results)
    }, 200)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const addProduct = (product: any) => {
    setItems((prev) => {
      if (prev.find((i) => i.productId === product.id)) return prev
      return [...prev, { productId: product.id, name: product.name, sku: product.sku, quantity: 1, unitPrice: product.salePrice, discount: 0, total: product.salePrice }]
    })
    setSearchQuery("")
    setSearchResults([])
  }

  const updateItem = (productId: number, field: string, value: number) => {
    setItems((prev) => prev.map((item) => {
      if (item.productId !== productId) return item
      const updated = { ...item, [field]: value }
      if (field === "quantity" || field === "unitPrice" || field === "discount") {
        updated.total = (updated.quantity * updated.unitPrice) - updated.discount
      }
      return updated
    }))
  }

  const removeItem = (productId: number) => setItems((prev) => prev.filter((i) => i.productId !== productId))

  const subtotal = items.reduce((s, i) => s + i.total, 0)
  const taxAmount = subtotal * taxRate
  const total = subtotal + taxAmount - discountAmount

  const saveMutation = useMutation({
    mutationFn: () => {
      const input = { customerId, items, taxRate, discountAmount, validUntil: validUntil || undefined, notes: notes || undefined, termsConditions: termsConditions || undefined }
      return isEditing ? updateQuote(Number(id), input) : createQuote(input)
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] })
      notification.success(t("common.success"), isEditing ? "Quote updated" : "Quote created")
      navigate(`/sales/quotes/${result.id}`)
    },
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEditing ? "Edit Quote" : "New Quote"}
        actions={<Button variant="outline" size="sm" onClick={() => navigate(-1)}>Cancel</Button>}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
              </div>
              {searchResults.length > 0 && (
                <div className="border rounded-md max-h-48 overflow-y-auto">
                  {searchResults.map((p) => (
                    <div key={p.id} className="flex items-center justify-between px-3 py-2 hover:bg-accent cursor-pointer" onClick={() => addProduct(p)}>
                      <div>
                        <p className="text-sm font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.sku} - ${p.salePrice.toFixed(2)}</p>
                      </div>
                      <Button size="icon" variant="ghost" className="h-7 w-7"><Plus className="h-3 w-3" /></Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="p-3">Product</th><th className="p-3 text-right w-20">Qty</th>
                    <th className="p-3 text-right w-24">Price</th><th className="p-3 text-right w-24">Disc</th>
                    <th className="p-3 text-right w-24">Total</th><th className="p-3 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.productId} className="border-b last:border-0">
                      <td className="p-3">{item.name || `#${item.productId}`}<br /><span className="text-xs text-muted-foreground">{item.sku}</span></td>
                      <td className="p-3"><Input type="number" min={1} value={item.quantity} onChange={(e) => updateItem(item.productId, "quantity", Number(e.target.value))} className="h-8 w-16 text-right" /></td>
                      <td className="p-3"><Input type="number" min={0} step={0.01} value={item.unitPrice} onChange={(e) => updateItem(item.productId, "unitPrice", Number(e.target.value))} className="h-8 w-24 text-right" /></td>
                      <td className="p-3"><Input type="number" min={0} step={0.01} value={item.discount} onChange={(e) => updateItem(item.productId, "discount", Number(e.target.value))} className="h-8 w-24 text-right" /></td>
                      <td className="p-3 text-right font-medium">${item.total.toFixed(2)}</td>
                      <td className="p-3"><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeItem(item.productId)}><Trash2 className="h-3 w-3" /></Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {items.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No items added yet</p>}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card><CardContent className="p-4 space-y-3">
            <CustomerSearchField label={t("sales.customer")} value={customerId} onChange={setCustomerId} />
            <TextField label="Tax Rate (%)" type="number" value={taxRate * 100} onChange={(v) => setTaxRate(Number(v) / 100)} />
            <TextField label="Discount" type="number" value={discountAmount} onChange={(v) => setDiscountAmount(Number(v))} />
            <TextField label="Valid Until" type="date" value={validUntil} onChange={(v) => setValidUntil(v)} />
          </CardContent></Card>

          <Card><CardContent className="p-4 space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>${taxAmount.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span>-${discountAmount.toFixed(2)}</span></div>
            <div className="flex justify-between font-bold text-base pt-1 border-t"><span>Total</span><span>${total.toFixed(2)}</span></div>
          </CardContent></Card>

          <Card><CardContent className="p-4 space-y-3">
            <TextareaField label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            <TextareaField label="Terms & Conditions" value={termsConditions} onChange={(e) => setTermsConditions(e.target.value)} />
          </CardContent></Card>

          <Button className="w-full" size="lg" onClick={() => saveMutation.mutate()} disabled={items.length === 0 || saveMutation.isPending}>
            {saveMutation.isPending ? "Saving..." : isEditing ? "Update Quote" : "Create Quote"}
          </Button>
        </div>
      </div>
    </div>
  )
}
