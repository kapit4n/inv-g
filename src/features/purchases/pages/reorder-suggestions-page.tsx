import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { ShoppingCart, AlertTriangle, Package } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/loading-skeleton"
import { getReorderSuggestions } from "@/lib/tauri"
import type { ReorderSuggestion } from "@/types"

export function ReorderSuggestionsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const { data: suggestions = [], isLoading } = useQuery({
    queryKey: ["reorder-suggestions"],
    queryFn: getReorderSuggestions,
  })

  const sorted = useMemo(() => {
    return [...suggestions].sort((a, b) => {
      const aUrgent = a.currentStock <= a.reorderPoint ? 0 : 1
      const bUrgent = b.currentStock <= b.reorderPoint ? 0 : 1
      return aUrgent - bUrgent
    })
  }, [suggestions])

  const urgentCount = suggestions.filter(
    (s) => s.currentStock <= s.reorderPoint,
  ).length
  const warningCount = suggestions.filter(
    (s) =>
      s.currentStock > s.reorderPoint &&
      s.currentStock <= s.minStockLevel,
  ).length

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={t("purchases.reorderSuggestions")}
          description={t("purchases.reorderSuggestionsDescription")}
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6 space-y-3">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("purchases.reorderSuggestions")}
        description={t("purchases.reorderSuggestionsDescription")}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("purchases.totalSuggestions")}
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{suggestions.length}</span>
          </CardContent>
        </Card>
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-destructive">
              {t("purchases.urgentReorder")}
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-destructive">
              {urgentCount}
            </span>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 dark:border-yellow-900">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
              {t("purchases.warningReorder")}
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {warningCount}
            </span>
          </CardContent>
        </Card>
      </div>

      {sorted.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-4 mb-4">
              <Package className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold mb-1">
              {t("purchases.stockHealthy")}
            </h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              {t("purchases.noReorderNeeded")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sorted.map((item) => {
            const isUrgent = item.currentStock <= item.reorderPoint
            const isWarning =
              !isUrgent && item.currentStock <= item.minStockLevel

            return (
              <Card
                key={item.productId}
                className={
                  isUrgent
                    ? "border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20"
                    : isWarning
                      ? "border-yellow-200 dark:border-yellow-900 bg-yellow-50/50 dark:bg-yellow-950/20"
                      : ""
                }
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="space-y-1">
                      <h3 className="font-semibold leading-tight">
                        {item.productName}
                      </h3>
                      <p className="font-mono text-xs text-muted-foreground">
                        {item.productSku}
                      </p>
                    </div>
                    {isUrgent && (
                      <Badge variant="destructive" className="shrink-0">
                        {t("purchases.urgent")}
                      </Badge>
                    )}
                    {isWarning && !isUrgent && (
                      <Badge variant="warning" className="shrink-0">
                        {t("purchases.lowStock")}
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground text-xs block">
                        {t("inventory.stock")}
                      </span>
                      <span
                        className={`font-semibold tabular-nums ${
                          isUrgent
                            ? "text-destructive"
                            : isWarning
                              ? "text-yellow-600 dark:text-yellow-400"
                              : ""
                        }`}
                      >
                        {item.currentStock}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs block">
                        {t("inventory.minStock")}
                      </span>
                      <span className="tabular-nums">{item.minStockLevel}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs block">
                        {t("purchases.reorderPoint")}
                      </span>
                      <span className="tabular-nums">{item.reorderPoint}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs block">
                        {t("inventory.maxStock")}
                      </span>
                      <span className="tabular-nums">{item.maxStockLevel}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs block">
                        {t("purchases.pendingPO")}
                      </span>
                      <span className="tabular-nums">
                        {item.pendingPoQuantity}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs block">
                        {t("purchases.suggestedOrder")}
                      </span>
                      <span className="font-semibold tabular-nums text-primary">
                        {item.suggestedOrder}
                      </span>
                    </div>
                  </div>

                  {item.preferredSupplierName && (
                    <div className="mt-3 text-xs text-muted-foreground">
                      <span className="font-medium">
                        {t("purchases.preferredSupplier")}:
                      </span>{" "}
                      {item.preferredSupplierName}
                    </div>
                  )}

                  <div className="mt-4 flex justify-end">
                    <Button
                      size="sm"
                      onClick={() =>
                        navigate("/purchases/orders/new", {
                          state: {
                            productId: item.productId,
                            productName: item.productName,
                            suggestedOrder: item.suggestedOrder,
                            preferredSupplierId: item.preferredSupplierId,
                          },
                        })
                      }
                    >
                      <ShoppingCart className="h-4 w-4 mr-1" />
                      {t("purchases.createPO")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
