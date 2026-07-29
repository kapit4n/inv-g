import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router-dom"
import { Plus, Trash2, Search, X } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SelectField, TextField, TextareaField, NumberField, DateField } from "@/components/forms"
import { Separator } from "@/components/ui/separator"
import {
  getPurchaseOrder,
  getSuppliers,
  getWarehouses,
  createPurchaseOrder,
  updatePurchaseOrder,
  searchProductsForPos,
} from "@/lib/tauri"
import { useNotification } from "@/hooks/use-notification"
import type { InventorySupplier, Warehouse, ProductForPos } from "@/types"

interface LineItem {
  productId: number
  name: string
  sku: string
  quantity: number
  unitCost: number
  discount: number
  tax: number
  total: number
}

export function PurchaseOrderFormPage() {
  const { t } = useTranslation("purchases")
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const notification = useNotification()
  const isEdit = !!id

  const [suppliers, setSuppliers] = useState<InventorySupplier[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [supplierId, setSupplierId] = useState<number | undefined>()
  const [warehouseId, setWarehouseId] = useState<number | undefined>()
  const [buyer, setBuyer] = useState("")
  const [paymentTerms, setPaymentTerms] = useState("")
  const [shippingMethod, setShippingMethod] = useState("")
  const [referenceNumber, setReferenceNumber] = useState("")
  const [notes, setNotes] = useState("")
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("")
  const [items, setItems] = useState<LineItem[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(isEdit)

  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<ProductForPos[]>([])
  const [addingProduct, setAddingProduct] = useState(false)

  useEffect(() => {
    getSuppliers().then(setSuppliers)
    getWarehouses().then(setWarehouses)
  }, [])

  useEffect(() => {
    if (!id) return
    getPurchaseOrder(Number(id)).then((po) => {
      setSupplierId(po.supplierId)
      setWarehouseId(po.warehouseId)
      setBuyer(po.buyer || "")
      setPaymentTerms(po.paymentTerms || "")
      setShippingMethod(po.shippingMethod || "")
      setReferenceNumber(po.referenceNumber || "")
      setNotes(po.notes || "")
      setExpectedDeliveryDate(po.expectedDeliveryDate || "")
      setLoading(false)
    })
  }, [id])

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return }
    const timer = setTimeout(async () => {
      try {
        const results = await searchProductsForPos(searchQuery)
        setSearchResults(results)
      } catch {
        setSearchResults([])
      }
    }, 200)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const addItem = (product: ProductForPos) => {
    setItems((prev) => {
      if (prev.find((i) => i.productId === product.id)) return prev
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          sku: product.sku,
          quantity: 1,
          unitCost: product.wholesalePrice || product.salePrice,
          discount: 0,
          tax: 0,
          total: product.wholesalePrice || product.salePrice,
        },
      ]
    })
    setSearchQuery("")
    setSearchResults([])
    setAddingProduct(false)
  }

  const updateItem = (productId: number, field: keyof LineItem, value: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.productId !== productId) return item
        const updated = { ...item, [field]: value }
        updated.total = updated.quantity * updated.unitCost - updated.discount + updated.tax
        return updated
      })
    )
  }

  const removeItem = (productId: number) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId))
  }

  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitCost, 0)
  const taxAmount = items.reduce((sum, i) => sum + i.tax, 0)
  const discountAmount = items.reduce((sum, i) => sum + i.discount, 0)
  const total = items.reduce((sum, i) => sum + i.total, 0)

  const handleSave = async () => {
    setSaving(true)
    try {
      const input = {
        supplierId,
        warehouseId,
        paymentTerms: paymentTerms || undefined,
        shippingMethod: shippingMethod || undefined,
        referenceNumber: referenceNumber || undefined,
        buyer: buyer || undefined,
        notes: notes || undefined,
        expectedDeliveryDate: expectedDeliveryDate || undefined,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitCost: i.unitCost,
          discount: i.discount,
          tax: i.tax,
          total: i.total,
        })),
      }

      if (isEdit) {
        await updatePurchaseOrder(Number(id), input)
        notification.success(t("common.success"), t("poUpdated"))
      } else {
        await createPurchaseOrder(1, input)
        notification.success(t("common.success"), t("poCreated"))
      }
      navigate("/purchases/orders")
    } catch (err) {
      notification.error(t("common.error"), String(err))
    } finally {
      setSaving(false)
    }
  }

  const supplierOptions = suppliers.map((s) => ({ label: s.companyName, value: s.id }))
  const warehouseOptions = warehouses.map((w) => ({ label: w.name, value: w.id }))

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title={isEdit ? t("editPurchaseOrder") : t("newPurchaseOrder")} />
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-10 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEdit ? t("editPurchaseOrder") : t("newPurchaseOrder")}
        description={isEdit ? t("editPODescription") : t("newPODescription")}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("orderDetails")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SelectField
              label={t("supplier")}
              options={supplierOptions}
              value={supplierId}
              onChange={(v) => setSupplierId(v ? Number(v) : undefined)}
              placeholder={t("common.select")}
              required
            />
            <SelectField
              label={t("warehouse")}
              options={warehouseOptions}
              value={warehouseId}
              onChange={(v) => setWarehouseId(v ? Number(v) : undefined)}
              placeholder={t("common.select")}
            />
            <TextField
              label={t("buyer")}
              value={buyer}
              onChange={(e) => setBuyer(e.target.value)}
            />
            <TextField
              label={t("paymentTerms")}
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              placeholder="Net 30"
            />
            <TextField
              label={t("shippingMethod")}
              value={shippingMethod}
              onChange={(e) => setShippingMethod(e.target.value)}
            />
            <TextField
              label={t("referenceNumber")}
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
            />
            <DateField
              label={t("expectedDeliveryDate")}
              value={expectedDeliveryDate}
              onChange={(e) => setExpectedDeliveryDate(e.target.value)}
            />
          </div>
          <div className="mt-4">
            <TextareaField
              label={t("notes")}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">{t("items")}</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAddingProduct(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            {t("addItem")}
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {addingProduct && (
            <div className="border-b p-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("searchProducts")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                  autoFocus
                />
              </div>
              {searchResults.length > 0 && (
                <div className="mt-2 max-h-48 overflow-y-auto rounded border">
                  {searchResults.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className="flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-muted transition-colors text-left"
                      onClick={() => addItem(p)}
                    >
                      <div>
                        <span className="font-medium">{p.name}</span>
                        <span className="ml-2 text-muted-foreground">({p.sku})</span>
                      </div>
                      <span className="text-muted-foreground">
                        ${(p.wholesalePrice || p.salePrice).toFixed(2)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => { setAddingProduct(false); setSearchQuery(""); setSearchResults([]) }}
              >
                <X className="h-4 w-4 mr-1" />
                {t("common.cancel")}
              </Button>
            </div>
          )}

          {items.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              {t("noItems")}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="p-4 font-medium w-[30%]">{t("product")}</th>
                    <th className="p-4 font-medium text-right w-[12%]">{t("quantity")}</th>
                    <th className="p-4 font-medium text-right w-[14%]">{t("unitCost")}</th>
                    <th className="p-4 font-medium text-right w-[12%]">{t("discount")}</th>
                    <th className="p-4 font-medium text-right w-[12%]">{t("tax")}</th>
                    <th className="p-4 font-medium text-right w-[14%]">{t("total")}</th>
                    <th className="p-4 w-[6%]" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.productId} className="border-b last:border-0">
                      <td className="p-4">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.sku}</p>
                      </td>
                      <td className="p-4">
                        <Input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => updateItem(item.productId, "quantity", Number(e.target.value))}
                          className="h-8 w-20 ml-auto text-right"
                        />
                      </td>
                      <td className="p-4">
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          value={item.unitCost}
                          onChange={(e) => updateItem(item.productId, "unitCost", Number(e.target.value))}
                          className="h-8 w-24 ml-auto text-right"
                        />
                      </td>
                      <td className="p-4">
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          value={item.discount}
                          onChange={(e) => updateItem(item.productId, "discount", Number(e.target.value))}
                          className="h-8 w-20 ml-auto text-right"
                        />
                      </td>
                      <td className="p-4">
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          value={item.tax}
                          onChange={(e) => updateItem(item.productId, "tax", Number(e.target.value))}
                          className="h-8 w-20 ml-auto text-right"
                        />
                      </td>
                      <td className="p-4 text-right font-medium">${item.total.toFixed(2)}</td>
                      <td className="p-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => removeItem(item.productId)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <Separator />
          <div className="p-4 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("subtotal")}</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("discountAmount")}</span>
              <span className="text-destructive">-${discountAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("taxAmount")}</span>
              <span>${taxAmount.toFixed(2)}</span>
            </div>
            <Separator className="my-1" />
            <div className="flex justify-between text-base font-bold">
              <span>{t("total")}</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3 justify-end">
        <Button variant="outline" onClick={() => navigate("/purchases/orders")}>
          {t("common.cancel")}
        </Button>
        <Button onClick={handleSave} disabled={saving || items.length === 0}>
          {saving ? t("common.saving") : t("common.save")}
        </Button>
      </div>
    </div>
  )
}
