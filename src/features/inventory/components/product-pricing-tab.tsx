import { useTranslation } from "react-i18next"
import { useQuery } from "@tanstack/react-query"
import { EntityInfoCard, InfoRow } from "@/components/entity"
import { getCostHistory, getSuppliers } from "@/lib/tauri"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { InventoryProduct } from "@/types/inventory"
import type { CostHistory } from "@/types"

interface Props {
  product: InventoryProduct
}

export function ProductPricingTab({ product }: Props) {
  const { t } = useTranslation()

  const margin = product.salePrice > 0
    ? ((product.salePrice - product.costPrice) / product.salePrice * 100)
    : 0

  const { data: costHistory = [] } = useQuery({
    queryKey: ["cost-history", product.id],
    queryFn: () => getCostHistory(product.id),
    enabled: !!product.id,
  })

  const { data: suppliers = [] } = useQuery({ queryKey: ["inventory-suppliers"], queryFn: getSuppliers })
  const supLookup = (id?: number) => suppliers.find((s) => s.id === id)?.companyName ?? "-"

  return (
    <div className="space-y-6">
      <EntityInfoCard title={t("inventory.costPrice")} columns={2}>
        <InfoRow label={t("inventory.costPrice")} value={`$${product.costPrice.toFixed(2)}`} />
        <InfoRow label={t("inventory.salePrice")} value={`$${product.salePrice.toFixed(2)}`} />
        <InfoRow label={t("inventory.wholesalePrice")} value={`$${product.wholesalePrice.toFixed(2)}`} />
        <InfoRow label={t("inventory.suggestedRetailPrice")} value={`$${product.suggestedRetailPrice.toFixed(2)}`} />
        <InfoRow label={t("inventory.taxRate")} value={`${(product.taxRate * 100).toFixed(1)}%`} />
        <InfoRow label={t("inventory.pricing.margin")} value={
          <span className={margin > 0 ? "text-green-600 font-semibold" : "text-muted-foreground"}>
            {margin.toFixed(1)}%
          </span>
        } />
      </EntityInfoCard>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("inventory.pricing.costHistory")}</CardTitle>
        </CardHeader>
        <CardContent>
          {costHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("common.noData")}</p>
          ) : (
            <div className="space-y-2">
              {costHistory.slice(0, 20).map((c: CostHistory) => (
                <div key={c.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div>
                    <p className="text-sm font-medium">
                      ${c.oldCost.toFixed(2)} → ${c.newCost.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {supLookup(c.supplierId)} · {c.quantity} {t("inventory.quantity")}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
