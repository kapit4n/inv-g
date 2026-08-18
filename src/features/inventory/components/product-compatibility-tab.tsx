import { useTranslation } from "react-i18next"
import { useQuery } from "@tanstack/react-query"
import { getProductCompatibility, getProductImages } from "@/lib/tauri"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { CompatibilityEntry } from "@/types"

interface Props {
  productId: number
}

export function ProductCompatibilityTab({ productId }: Props) {
  const { t } = useTranslation()

  const { data: compatibility = [] } = useQuery({
    queryKey: ["inventory-product-compatibility", productId],
    queryFn: () => getProductCompatibility(productId),
    enabled: !!productId,
  })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("inventory.vehicleCompatibility")}</CardTitle>
        </CardHeader>
        <CardContent>
          {compatibility.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("common.noData")}</p>
          ) : (
            <div className="space-y-3">
              {compatibility.map((c: CompatibilityEntry) => (
                <div key={c.id} className="border-b pb-3 last:border-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">
                      {c.brandName || "-"} {c.modelName || ""}
                    </p>
                    {c.yearStart && (
                      <Badge variant="outline" className="text-xs">
                        {c.yearStart}{c.yearEnd ? `-${c.yearEnd}` : ""}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {c.generationName && <span>{c.generationName}</span>}
                    {c.engineName && <span>· {c.engineName}</span>}
                    {c.transmissionName && <span>· {c.transmissionName}</span>}
                    {c.notes && <span>· {c.notes}</span>}
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
