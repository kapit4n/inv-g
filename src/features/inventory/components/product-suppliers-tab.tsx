import { useTranslation } from "react-i18next"
import { useQuery } from "@tanstack/react-query"
import { getSupplierProducts, getSuppliers } from "@/lib/tauri"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { InventoryProduct } from "@/types/inventory"
import type { SupplierProduct } from "@/types"

interface Props {
  product: InventoryProduct
}

export function ProductSuppliersTab({ product }: Props) {
  const { t } = useTranslation()

  const { data: supplierProducts = [] } = useQuery({
    queryKey: ["supplier-products", product.id],
    queryFn: () => getSupplierProducts(undefined, product.id),
    enabled: !!product.id,
  })

  const { data: suppliers = [] } = useQuery({ queryKey: ["inventory-suppliers"], queryFn: getSuppliers })
  const supLookup = (id: number) => suppliers.find((s) => s.id === id)?.companyName ?? "-"

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("inventory.suppliers")}</CardTitle>
        </CardHeader>
        <CardContent>
          {supplierProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("common.noData")}</p>
          ) : (
            <div className="space-y-3">
              {supplierProducts.map((sp: SupplierProduct) => (
                <div key={sp.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{sp.supplierName || supLookup(sp.supplierId)}</p>
                      {sp.isPreferred && <Badge variant="default" className="text-xs">{t("inventory.supplierProduct.preferred")}</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {sp.supplierSku && `SKU: ${sp.supplierSku}`}
                      {sp.supplierSku && sp.leadTimeDays > 0 && " · "}
                      {sp.leadTimeDays > 0 && `${sp.leadTimeDays}d ${t("inventory.supplierProduct.leadTime")}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">${sp.defaultCost.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{sp.currency} · MOQ {sp.minimumOrderQuantity}</p>
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
