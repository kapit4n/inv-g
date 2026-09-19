import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
  ShoppingCart,
  Package,
  Search,
  UserPlus,
  FileText,
  Warehouse,
  AlertTriangle,
  AlertCircle,
  Clock,
  CheckCircle,
  ShieldCheck,
  ArrowRight,
  DollarSign,
  ShoppingBag,
  Users,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Section } from "@/components/section"
import { getDashboardWidgets, getPurchaseDashboard, getCrmDashboard, getDashboardStats, getSales, getStoreSales, getStoreInventory } from "@/lib/tauri"
import { useBusinessCapabilities } from "@/hooks"

interface AttentionItem {
  id: string
  label: string
  count: number
  severity: "destructive" | "warning" | "info"
  icon: React.ReactNode
  path: string
}

interface QuickAction {
  label: string
  description: string
  icon: React.ReactNode
  path: string
  color: string
}

export function DashboardPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const capabilities = useBusinessCapabilities()

  const { data: storeSales = [] } = useQuery({
    queryKey: ["store-sales"],
    queryFn: getStoreSales,
    enabled: capabilities.crossStoreReports,
  })

  const { data: storeInventory = [] } = useQuery({
    queryKey: ["store-inventory"],
    queryFn: getStoreInventory,
    enabled: capabilities.crossStoreReports,
  })

  const { data: widgets, isLoading: widgetsLoading } = useQuery({
    queryKey: ["dashboard-widgets"],
    queryFn: getDashboardWidgets,
  })

  const { data: purchaseDash } = useQuery({
    queryKey: ["purchase-dashboard"],
    queryFn: getPurchaseDashboard,
  })

  const { data: crmDash } = useQuery({
    queryKey: ["crm-dashboard"],
    queryFn: getCrmDashboard,
  })

  const { data: inventoryStats } = useQuery({
    queryKey: ["inventory-stats"],
    queryFn: getDashboardStats,
  })

  const { data: recentSales = [] } = useQuery({
    queryKey: ["recent-sales"],
    queryFn: getSales,
  })



  const quickActions: QuickAction[] = [
    { label: t("dashboard.actions.newSale"), description: t("dashboard.actions.newSaleDesc"), icon: <ShoppingCart className="h-5 w-5" />, path: "/sales/new", color: "bg-emerald-500" },
    { label: t("dashboard.actions.receivePO"), description: t("dashboard.actions.receivePODesc"), icon: <Package className="h-5 w-5" />, path: "/purchases/receipts/new", color: "bg-blue-500" },
    { label: t("dashboard.actions.searchProduct"), description: t("dashboard.actions.searchProductDesc"), icon: <Search className="h-5 w-5" />, path: "/inventory/products", color: "bg-violet-500" },
    { label: t("dashboard.actions.newCustomer"), description: t("dashboard.actions.newCustomerDesc"), icon: <UserPlus className="h-5 w-5" />, path: "/crm/customers/new", color: "bg-amber-500" },
    { label: t("dashboard.actions.newPO"), description: t("dashboard.actions.newPODesc"), icon: <FileText className="h-5 w-5" />, path: "/purchases/orders/new", color: "bg-orange-500" },
    { label: t("dashboard.actions.inventory"), description: t("dashboard.actions.inventoryDesc"), icon: <Warehouse className="h-5 w-5" />, path: "/inventory", color: "bg-cyan-500" },
  ]

  const attentionItems: AttentionItem[] = []

  if (inventoryStats) {
    if (inventoryStats.outOfStockProducts > 0) {
      attentionItems.push({
        id: "out-of-stock",
        label: t("dashboard.attention.outOfStock"),
        count: inventoryStats.outOfStockProducts,
        severity: "destructive",
        icon: <AlertCircle className="h-4 w-4" />,
        path: "/inventory/products",
      })
    }
    if (inventoryStats.lowStockProducts > 0) {
      attentionItems.push({
        id: "low-stock",
        label: t("dashboard.attention.lowStock"),
        count: inventoryStats.lowStockProducts,
        severity: "warning",
        icon: <AlertTriangle className="h-4 w-4" />,
        path: "/inventory/products",
      })
    }
  }

  if (purchaseDash) {
    if (purchaseDash.pendingOrders > 0) {
      attentionItems.push({
        id: "pending-orders",
        label: t("dashboard.attention.pendingOrders"),
        count: purchaseDash.pendingOrders,
        severity: "info",
        icon: <ShoppingBag className="h-4 w-4" />,
        path: "/purchases/orders",
      })
    }
    if (purchaseDash.awaitingApproval > 0) {
      attentionItems.push({
        id: "awaiting-approval",
        label: t("dashboard.attention.awaitingApproval"),
        count: purchaseDash.awaitingApproval,
        severity: "warning",
        icon: <Clock className="h-4 w-4" />,
        path: "/purchases/requests",
      })
    }
  }

  if (crmDash) {
    if (crmDash.upcomingReminders > 0) {
      attentionItems.push({
        id: "reminders",
        label: t("dashboard.attention.upcomingReminders"),
        count: crmDash.upcomingReminders,
        severity: "info",
        icon: <Clock className="h-4 w-4" />,
        path: "/crm/reminders",
      })
    }
    if (crmDash.expiredWarranties > 0) {
      attentionItems.push({
        id: "warranties",
        label: t("dashboard.attention.expiringWarranties"),
        count: crmDash.expiredWarranties,
        severity: "warning",
        icon: <ShieldCheck className="h-4 w-4" />,
        path: "/crm/warranties",
      })
    }
  }

  const salesForToday = recentSales.slice(0, 5)

  const formatCurrency = (value: number) =>
    value.toLocaleString("en-US", { style: "currency", currency: "USD" })

  return (
    <div className="space-y-6" data-testid="dashboard-page">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("dashboard.title")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("dashboard.description")}
        </p>
      </div>

      <Section title={t("dashboard.quickActions")} description={t("dashboard.quickActionsDesc")}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {quickActions.map((action) => (
            <Card
              key={action.path}
              className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50 active:scale-[0.98]"
              onClick={() => navigate(action.path)}
              data-testid={`quick-action-${action.path.replace(/\//g, "-").slice(1)}`}
            >
              <CardContent className="flex flex-col items-center gap-2 p-4 text-center">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-white ${action.color}`}>
                  {action.icon}
                </div>
                <div>
                  <p className="text-sm font-medium">{action.label}</p>
                  <p className="text-[10px] text-muted-foreground">{action.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      <Section title={t("dashboard.todaySummary")} description={t("dashboard.todaySummaryDesc")}>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("dashboard.stats.todayRevenue")}</p>
                <p className="text-lg font-bold tabular-nums">
                  {widgetsLoading ? "—" : formatCurrency(widgets?.todayRevenue ?? 0)}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("dashboard.stats.salesCount")}</p>
                <p className="text-lg font-bold tabular-nums">
                  {widgetsLoading ? "—" : widgets?.recentSalesCount ?? 0}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("dashboard.stats.lowStock")}</p>
                <p className="text-lg font-bold tabular-nums">
                  {widgetsLoading ? "—" : inventoryStats?.lowStockProducts ?? 0}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("dashboard.stats.newCustomers")}</p>
                <p className="text-lg font-bold tabular-nums">
                  {crmDash ? crmDash.newCustomersMonth : "—"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </Section>

      {capabilities.crossStoreReports && (
        <Section title={t("dashboard.perStore.title")} description={t("dashboard.perStore.desc")}>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardContent className="space-y-3 p-4">
                <p className="text-xs font-medium text-muted-foreground">{t("dashboard.perStore.salesTitle")}</p>
                {storeSales.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">{t("dashboard.perStore.empty")}</p>
                ) : (
                  storeSales.map((row) => (
                    <div key={row.storeId} className="flex items-center justify-between text-sm">
                      <span className="font-medium">{row.storeName} <span className="text-xs text-muted-foreground">{row.storeCode}</span></span>
                      <span className="tabular-nums">{row.salesCount} · {formatCurrency(row.totalRevenue)}</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-3 p-4">
                <p className="text-xs font-medium text-muted-foreground">{t("dashboard.perStore.inventoryTitle")}</p>
                {storeInventory.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">{t("dashboard.perStore.empty")}</p>
                ) : (
                  storeInventory.map((row) => (
                    <div key={row.storeId} className="flex items-center justify-between text-sm">
                      <span className="font-medium">{row.storeName} <span className="text-xs text-muted-foreground">{row.storeCode}</span></span>
                      <span className="tabular-nums">{row.productCount} {t("dashboard.perStore.products")} · {formatCurrency(row.inventoryValue)}</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </Section>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Section
          title={t("dashboard.needsAttention")}
          description={t("dashboard.needsAttentionDesc")}
        >
          {attentionItems.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle className="h-8 w-8 text-emerald-500 mb-2" />
                <p className="text-sm font-medium">{t("dashboard.allClear")}</p>
                <p className="text-xs text-muted-foreground">{t("dashboard.allClearDesc")}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {attentionItems.map((item) => (
                <Card
                  key={item.id}
                  className="cursor-pointer transition-all hover:shadow-sm hover:border-primary/30"
                  onClick={() => navigate(item.path)}
                  data-testid={`attention-${item.id}`}
                >
                  <CardContent className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                        item.severity === "destructive" ? "bg-destructive/10 text-destructive" :
                        item.severity === "warning" ? "bg-amber-500/10 text-amber-600" :
                        "bg-blue-500/10 text-blue-600"
                      }`}>
                        {item.icon}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{item.label}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={item.severity}>{item.count}</Badge>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </Section>

        <Section title={t("dashboard.recentSales")} description={t("dashboard.recentSalesDesc")}>
          {salesForToday.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <ShoppingCart className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm font-medium">{t("dashboard.noRecentSales")}</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={() => navigate("/sales/new")}>
                  {t("dashboard.actions.newSale")}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {salesForToday.map((sale) => (
                <Card
                  key={sale.id}
                  className="cursor-pointer transition-all hover:shadow-sm hover:border-primary/30"
                  onClick={() => navigate(`/sales/${sale.id}`)}
                  data-testid={`recent-sale-${sale.id}`}
                >
                  <CardContent className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                        <ShoppingCart className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{sale.saleNumber}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(sale.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold tabular-nums">{formatCurrency(sale.total)}</p>
                      <Badge variant={sale.paymentStatus === "paid" ? "success" : "warning"} className="text-[10px]">
                        {sale.paymentStatus}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Button variant="ghost" size="sm" className="w-full" onClick={() => navigate("/sales")}>
                {t("dashboard.viewAllSales")} <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
          )}
        </Section>
      </div>
    </div>
  )
}
