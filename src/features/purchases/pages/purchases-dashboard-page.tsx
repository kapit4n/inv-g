import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { ShoppingBag, FileText, Package, RotateCcw, ArrowUpDown, TrendingUp, Truck, AlertTriangle } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getPurchaseDashboard } from "@/lib/tauri"
import type { PurchaseDashboard } from "@/types"

type StatusVariant = "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info"

const statusVariant: Record<string, StatusVariant> = {
  draft: "secondary",
  pending_approval: "warning",
  approved: "info",
  sent: "default",
  partially_received: "warning",
  received: "success",
  cancelled: "destructive",
}

const statusLabel: Record<string, string> = {
  draft: "Draft",
  pending_approval: "Pending Approval",
  approved: "Approved",
  sent: "Sent",
  partially_received: "Partial",
  received: "Received",
  cancelled: "Cancelled",
}

export function PurchasesPage() {
  const { t } = useTranslation("purchases")
  const navigate = useNavigate()
  const [dashboard, setDashboard] = useState<PurchaseDashboard | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPurchaseDashboard()
      .then(setDashboard)
      .finally(() => setLoading(false))
  }, [])

  const statCards = [
    { title: t("pendingOrders"), value: dashboard?.pendingOrders, icon: ShoppingBag, color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400" },
    { title: t("awaitingApproval"), value: dashboard?.awaitingApproval, icon: FileText, color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400" },
    { title: t("awaitingDelivery"), value: dashboard?.awaitingDelivery, icon: Package, color: "text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400" },
    { title: t("todayReceipts"), value: dashboard?.todayReceipts, icon: Truck, color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400" },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("dashboard")}
        description={t("dashboardDescription")}
        actions={
          <Button onClick={() => navigate("/purchases/orders/new")}>
            {t("newPurchaseOrder")}
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <div className={`p-2 rounded-full ${card.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-7 w-16 bg-muted animate-pulse rounded" />
                ) : (
                  <p className="text-2xl font-bold">{card.value ?? 0}</p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
                {t("monthlyPurchased")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-24 bg-muted animate-pulse rounded" />
              ) : (
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-bold">${(dashboard?.monthlyPurchased ?? 0).toFixed(2)}</span>
                  <span className="text-sm text-muted-foreground mb-1">
                    ({dashboard?.monthlyOrderCount ?? 0} {t("orders")})
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <RotateCcw className="h-5 w-5 text-muted-foreground" />
                {t("reorderSuggestions")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-14 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              ) : (dashboard?.reorderSuggestions ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("noReorderSuggestions")}</p>
              ) : (
                <div className="space-y-2">
                  {(dashboard?.reorderSuggestions ?? []).slice(0, 5).map((s) => (
                    <div key={s.productId} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{s.productName}</p>
                        <p className="text-xs text-muted-foreground">
                          {t("stock")}: {s.currentStock} | {t("reorderPoint")}: {s.reorderPoint}
                        </p>
                      </div>
                      <div className="ml-4 text-right flex-shrink-0">
                        <p className="text-sm font-semibold text-amber-600">{t("suggestedOrder")}: {s.suggestedOrder}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ArrowUpDown className="h-5 w-5 text-muted-foreground" />
                {t("recentOrders")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-10 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              ) : (dashboard?.recentOrders ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("noRecentOrders")}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-2 font-medium">{t("poNumber")}</th>
                        <th className="pb-2 font-medium">{t("supplier")}</th>
                        <th className="pb-2 font-medium">{t("items")}</th>
                        <th className="pb-2 font-medium text-right">{t("total")}</th>
                        <th className="pb-2 font-medium">{t("status")}</th>
                        <th className="pb-2 font-medium">{t("date")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(dashboard?.recentOrders ?? []).slice(0, 8).map((po) => (
                        <tr
                          key={po.id}
                          className="border-b last:border-0 cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => navigate(`/purchases/orders/${po.id}`)}
                        >
                          <td className="py-2 font-medium">{po.poNumber}</td>
                          <td className="py-2">{po.supplierName || "-"}</td>
                          <td className="py-2">{po.itemCount ?? "-"}</td>
                          <td className="py-2 text-right">${po.total.toFixed(2)}</td>
                          <td className="py-2">
                            <Badge variant={statusVariant[po.status] || "outline"}>
                              {statusLabel[po.status] || po.status}
                            </Badge>
                          </td>
                          <td className="py-2 text-muted-foreground">
                            {new Date(po.orderDate).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Truck className="h-5 w-5 text-muted-foreground" />
                {t("topSuppliers")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-8 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              ) : (dashboard?.topSuppliers ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("noData")}</p>
              ) : (
                <div className="space-y-3">
                  {(dashboard?.topSuppliers ?? []).slice(0, 5).map(([name, total], i) => (
                    <div key={name} className="flex items-center gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{name}</p>
                        <div className="mt-1 h-1.5 w-full rounded-full bg-muted">
                          <div
                            className="h-1.5 rounded-full bg-primary"
                            style={{ width: `${Math.min((total / ((dashboard?.topSuppliers ?? [])[0]?.[1] || 1)) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-semibold">${total.toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-muted-foreground" />
                {t("supplierPerformance")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-10 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              ) : (dashboard?.supplierPerformances ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("noData")}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-2 font-medium">{t("supplier")}</th>
                        <th className="pb-2 font-medium text-right">{t("orders")}</th>
                        <th className="pb-2 font-medium text-right">{t("avgDays")}</th>
                        <th className="pb-2 font-medium text-right">{t("returns")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(dashboard?.supplierPerformances ?? []).slice(0, 5).map((sp) => (
                        <tr key={sp.supplierId} className="border-b last:border-0">
                          <td className="py-2 font-medium">{sp.supplierName}</td>
                          <td className="py-2 text-right">{sp.completedOrders}/{sp.totalOrders}</td>
                          <td className="py-2 text-right">{sp.avgDeliveryDays ?? "-"}</td>
                          <td className="py-2 text-right">{sp.returnRate.toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
