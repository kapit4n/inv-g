import { useTranslation } from "react-i18next"
import { useQuery } from "@tanstack/react-query"
import { EntityInfoCard, InfoRow } from "@/components/entity"
import { getInventoryMovements, getWarehouses } from "@/lib/tauri"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { InventoryProduct, InventoryMovement } from "@/types/inventory"

interface Props {
  product: InventoryProduct
  whName?: string
  storageLocName?: string
}

function movementTypeBadge(type: string, t: (key: string) => string) {
  switch (type) {
    case "in": return <Badge variant="default">{t("inventory.movementTypeIn")}</Badge>
    case "out": return <Badge variant="destructive">{t("inventory.movementTypeOut")}</Badge>
    default: return <Badge variant="secondary">{t("inventory.movementTypeAdjustment")}</Badge>
  }
}

export function ProductInventoryTab({ product, whName, storageLocName }: Props) {
  const { t } = useTranslation()

  const { data: movements = [] } = useQuery({
    queryKey: ["inventory-movements", product.id],
    queryFn: () => getInventoryMovements(product.id),
    enabled: !!product.id,
  })

  const { data: warehouses = [] } = useQuery({ queryKey: ["inventory-warehouses"], queryFn: getWarehouses })
  const whLookup = (id: number | null) => warehouses.find((w) => w.id === id)?.name ?? "-"

  const stockStatus =
    product.stockQuantity === 0 ? "outOfStock" :
    product.stockQuantity <= product.minStockLevel ? "lowStock" : "inStock"

  return (
    <div className="space-y-6">
      <EntityInfoCard title={t("inventory.stock")} columns={2}>
        <InfoRow label={t("inventory.stockQuantity")} value={
          <span className="font-semibold">
            {product.stockQuantity} {product.unit}
            <Badge variant={stockStatus === "outOfStock" ? "destructive" : stockStatus === "lowStock" ? "secondary" : "default"} className="ml-2 text-xs">
              {t(`inventory.${stockStatus}`)}
            </Badge>
          </span>
        } />
        <InfoRow label={t("inventory.minStockLevel")} value={product.minStockLevel} />
        <InfoRow label={t("inventory.maxStockLevel")} value={product.maxStockLevel} />
        <InfoRow label={t("inventory.reorderPoint")} value={product.reorderPoint} />
        <InfoRow label={t("inventory.warehouse")} value={whName} />
        <InfoRow label={t("inventory.storageLocation")} value={storageLocName} />
      </EntityInfoCard>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("inventory.inventoryMovements")}</CardTitle>
        </CardHeader>
        <CardContent>
          {movements.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("common.noData")}</p>
          ) : (
            <div className="space-y-2">
              {movements.slice(0, 20).map((m: InventoryMovement) => (
                <div key={m.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div className="flex items-center gap-3">
                    {movementTypeBadge(m.type, t)}
                    <div>
                      <p className="text-sm font-medium">{m.notes || t(`inventory.movementType${m.type === "in" ? "In" : m.type === "out" ? "Out" : "Adjustment"}`)}</p>
                      <p className="text-xs text-muted-foreground">{whLookup(m.warehouseId)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${m.type === "out" ? "text-red-600" : m.type === "in" ? "text-green-600" : ""}`}>
                      {m.type === "out" ? "-" : "+"}{Math.abs(m.quantity)}
                    </p>
                    <p className="text-xs text-muted-foreground">{new Date(m.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
