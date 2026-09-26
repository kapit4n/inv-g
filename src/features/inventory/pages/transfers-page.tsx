import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { useQuery, useMutation } from "@tanstack/react-query"
import { EntityListPage } from "@/components/entity"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { NumberField, SelectField, TextareaField } from "@/components/forms"
import { getProducts, getInventoryMovements, transferInventoryBetweenStores } from "@/lib/tauri"
import { useBusinessStore, useAuthStore } from "@/stores"
import { useBusinessCapabilities, useInvalidateStock } from "@/hooks"
import { useNotification } from "@/hooks/use-notification"
import { businessErrorMessage } from "@/lib/business-errors"

export function TransfersPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const invalidateStock = useInvalidateStock()
  const notification = useNotification()
  const capabilities = useBusinessCapabilities()
  const stores = useBusinessStore((s) => s.context?.stores ?? [])
  const currentStoreId = useBusinessStore((s) => s.currentStoreId)
  const user = useAuthStore((s) => s.user)

  const [productId, setProductId] = useState<number | undefined>(undefined)
  const [fromStoreId, setFromStoreId] = useState<number | undefined>(currentStoreId ?? undefined)
  const [toStoreId, setToStoreId] = useState<number | undefined>(undefined)
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState("")

  const { data: products } = useQuery({
    queryKey: ["inventory-products-active"],
    queryFn: () => getProducts(1, 1000),
  })

  const { data: movements = [] } = useQuery({
    queryKey: ["inventory-movements-transfers"],
    queryFn: () => getInventoryMovements(),
  })

  const transferMutation = useMutation({
    mutationFn: transferInventoryBetweenStores,
    onSuccess: () => {
      // A transfer moves stock between warehouses.
      invalidateStock()
      notification.success(t("common.success"), t("inventory.transferCreated"))
      setToStoreId(undefined)
      setNotes("")
    },
    onError: (err) => {
      notification.error(t("common.error"), businessErrorMessage(t, err))
    },
  })

  if (!capabilities.storeTransfers) {
    navigate("/inventory", { replace: true })
    return null
  }

  const productOptions = (products?.data || [])
    .filter((p) => Number(p.stockQuantity) > 0)
    .map((p) => ({ label: `${p.name} (${p.sku}) · stock ${p.stockQuantity}`, value: p.id }))
  const storeOptions = stores.map((s) => ({ label: `${s.name} (${s.code})`, value: s.id }))

  const transferHistory = movements
    .filter((m) => m.referenceType === "transfer")
    .slice(0, 20)

  const canSubmit = productId != null && fromStoreId != null && toStoreId != null && fromStoreId !== toStoreId && quantity > 0

  const handleTransfer = () => {
    if (!canSubmit) return
    transferMutation.mutate({
      productId: productId!,
      fromStoreId: fromStoreId!,
      toStoreId: toStoreId!,
      quantity,
      notes: notes.trim() || undefined,
      createdBy: user?.id,
    })
  }

  return (
    <EntityListPage title={t("inventory.transfersTitle")} description={t("inventory.transfersDesc")}>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("inventory.newTransfer")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SelectField label={t("inventory.product")} options={productOptions} value={productId} onChange={(v) => setProductId(v ? Number(v) : undefined)} required placeholder={t("common.select")} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SelectField label={t("inventory.transferFrom")} options={storeOptions} value={fromStoreId} onChange={(v) => setFromStoreId(v ? Number(v) : undefined)} required placeholder={t("common.select")} />
            <SelectField label={t("inventory.transferTo")} options={storeOptions} value={toStoreId} onChange={(v) => setToStoreId(v ? Number(v) : undefined)} required placeholder={t("common.select")} />
          </div>
          <NumberField label={t("inventory.quantity")} value={quantity} onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))} required min={1} />
          <TextareaField label={t("inventory.notes")} value={notes} onChange={(e) => setNotes(e.target.value)} />
          <div className="flex justify-end">
            <Button onClick={handleTransfer} disabled={!canSubmit}>
              {t("inventory.transferNow")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("inventory.recentTransfers")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {transferHistory.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{t("inventory.noTransfers")}</p>
          ) : (
            transferHistory.map((m) => (
              <div key={m.id} className="flex items-center justify-between border-b py-2 text-sm last:border-0">
                <div>
                  <Badge variant={m.type === "transfer_out" ? "outline" : "secondary"} className="mr-2 text-[10px]">
                    {m.type}
                  </Badge>
                  <span className="font-medium">{m.referenceId}</span>
                  <span className="ml-2 text-muted-foreground">{new Date(m.createdAt).toLocaleDateString()}</span>
                </div>
                <span className={m.quantity < 0 ? "text-destructive" : "text-emerald-600"}>
                  {m.quantity > 0 ? "+" : ""}{m.quantity}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </EntityListPage>
  )
}