import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { EntityFormPage } from "@/components/entity"
import { NumberField, SelectField, TextareaField } from "@/components/forms"
import { EntityActionBar } from "@/components/entity"
import { getProducts, getWarehouses, createInventoryMovement } from "@/lib/tauri"
import { useNotification } from "@/hooks/use-notification"

export function InventoryMovementFormPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const notification = useNotification()

  const { data: products } = useQuery({
    queryKey: ["inventory-products-all"],
    queryFn: () => getProducts(1, 1000),
  })
  const { data: warehouses = [] } = useQuery({
    queryKey: ["inventory-warehouses"],
    queryFn: getWarehouses,
  })

  const [productId, setProductId] = useState<number | undefined>(undefined)
  const [warehouseId, setWarehouseId] = useState<number | undefined>(undefined)
  const [type, setType] = useState<string>("in")
  const [quantity, setQuantity] = useState(0)
  const [notes, setNotes] = useState("")

  const createMutation = useMutation({
    mutationFn: createInventoryMovement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-movements"] })
      queryClient.invalidateQueries({ queryKey: ["inventory-products"] })
      notification.success(t("common.success"), t("inventory.movementCreated"))
      navigate("/inventory/movements")
    },
  })

  const handleSave = () => {
    const finalQty = type === "out" ? -Math.abs(quantity) : Math.abs(quantity)
    createMutation.mutate({
      productId: productId!,
      warehouseId: warehouseId || undefined,
      quantity: finalQty,
      type,
      notes: notes || undefined,
    })
  }

  const productOptions = (products?.data || []).map((p: any) => ({ label: `${p.name} (${p.sku})`, value: p.id }))
  const whOptions = warehouses.map((w) => ({ label: w.name, value: w.id }))
  const typeOptions = [
    { label: t("inventory.movementTypeIn"), value: "in" },
    { label: t("inventory.movementTypeOut"), value: "out" },
    { label: t("inventory.movementTypeAdjustment"), value: "adjustment" },
  ]

  return (
    <EntityFormPage
      title={t("inventory.addMovement")}
      backPath="/inventory/movements"
    >
      <div className="space-y-6">
        <div className="space-y-4">
          <SelectField label={t("inventory.product")} options={productOptions} value={productId} onChange={(v) => setProductId(v ? Number(v) : undefined)} required placeholder={t("common.select")} />
          <SelectField label={t("inventory.movementType")} options={typeOptions} value={type} onChange={(v) => setType(v)} required />
          <NumberField label={t("inventory.quantity")} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} required min={0} />
          <SelectField label={t("inventory.warehouse")} options={whOptions} value={warehouseId} onChange={(v) => setWarehouseId(v ? Number(v) : undefined)} placeholder={t("common.select")} />
          <TextareaField label={t("inventory.notes")} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <EntityActionBar onSave={handleSave} saving={createMutation.isPending} showDelete={false} showArchive={false} showDuplicate={false} />
      </div>
    </EntityFormPage>
  )
}
