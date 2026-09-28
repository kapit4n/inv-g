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
import { useBusinessCapabilities, useModules, usePermissions } from "@/hooks"
import type { ModuleKey } from "@/hooks"
import { cn } from "@/lib/utils"

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
  /** The exact permission the action needs. A read-only role must not be offered a write action. */
  permission: string
  /** Optional business module that has to be switched on, or the card dead-ends on the module guard. */
  module?: ModuleKey
}

interface TodayStat {
  id: string
  label: string
  value: string
  icon: React.ReactNode
  /** Background/text colour of the icon chip. */
  tone: string
}

/**
 * Column classes that never leave an empty track behind, so a role that sees two
 * of the four summary tiles gets a full-width row instead of two cards stranded
 * on the left of a four-column grid.
 */
function gridCols(count: number): string {
  if (count <= 1) return "grid-cols-1"
  if (count === 2) return "grid-cols-1 sm:grid-cols-2"
  if (count === 3) return "grid-cols-1 sm:grid-cols-3"
  if (count === 4) return "grid-cols-2 lg:grid-cols-4"
  return "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6"
}

export function DashboardPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const capabilities = useBusinessCapabilities()
  const { isEnabled } = useModules()
  const { hasPermission, hasAnyPermission } = usePermissions()

  // Two independent reasons a card, tile or section may not belong on this page:
  //
  //   1. The module is switched off in Admin > Settings, so the destination route
  //      answers with a redirect to the dashboard.
  //   2. The signed-in role lacks the module's permission, so the destination
  //      answers with /forbidden.
  //
  // Advertising either one is worse than hiding it: the click does nothing useful.
  // The sidebar already applies both rules, the dashboard did not, which is why a
  // cashier was handed receive purchase order, new purchase order, new customer
  // and inventory cards plus inventory, purchasing and CRM tiles it can never
  // open. Gating on the permission rather than on `roleName` also keeps custom
  // roles and future roles honest without touching this file.
  const salesVisible = isEnabled("sales") && hasPermission("sales.view")
  const inventoryVisible = hasPermission("inventory.view")
  const purchasingVisible = isEnabled("purchasing") && hasPermission("purchases.view")
  const crmVisible = isEnabled("crm") && hasPermission("customers.view")
  // Cross-store totals are a management view over other locations: it needs the
  // reports module or at least inventory access, neither of which a cashier has.
  const perStoreVisible = capabilities.crossStoreReports && hasAnyPermission(["reports.view", "inventory.view"])
  // Every alert on the list comes from inventory, purchasing or CRM. With none of
  // them reachable there is nothing to watch, so the section is dropped instead
  // of showing a permanent, misleading "All clear!".
  const attentionVisible = inventoryVisible || purchasingVisible || crmVisible

  const { data: storeSales = [] } = useQuery({
    queryKey: ["store-sales"],
    queryFn: getStoreSales,
    enabled: perStoreVisible,
  })

  const { data: storeInventory = [] } = useQuery({
    queryKey: ["store-inventory"],
    queryFn: getStoreInventory,
    enabled: perStoreVisible,
  })

  const { data: widgets, isLoading: widgetsLoading } = useQuery({
    queryKey: ["dashboard-widgets"],
    queryFn: getDashboardWidgets,
    enabled: salesVisible,
  })

  const { data: purchaseDash } = useQuery({
    queryKey: ["purchase-dashboard"],
    queryFn: getPurchaseDashboard,
    enabled: purchasingVisible,
  })

  const { data: crmDash } = useQuery({
    queryKey: ["crm-dashboard"],
    queryFn: getCrmDashboard,
    enabled: crmVisible,
  })

  const { data: inventoryStats } = useQuery({
    queryKey: ["inventory-stats"],
    queryFn: getDashboardStats,
    enabled: inventoryVisible,
  })

  const { data: recentSales = [] } = useQuery({
    queryKey: ["recent-sales"],
    queryFn: getSales,
    enabled: salesVisible,
  })

  const allQuickActions: QuickAction[] = [
    { label: t("dashboard.actions.newSale"), description: t("dashboard.actions.newSaleDesc"), icon: <ShoppingCart className="h-5 w-5" />, path: "/sales/new", color: "bg-emerald-500", permission: "sales.create", module: "sales" },
    { label: t("dashboard.actions.receivePO"), description: t("dashboard.actions.receivePODesc"), icon: <Package className="h-5 w-5" />, path: "/purchases/receipts/new", color: "bg-blue-500", permission: "purchases.receive", module: "purchasing" },
    { label: t("dashboard.actions.searchProduct"), description: t("dashboard.actions.searchProductDesc"), icon: <Search className="h-5 w-5" />, path: "/inventory/products", color: "bg-violet-500", permission: "inventory.view" },
    { label: t("dashboard.actions.newCustomer"), description: t("dashboard.actions.newCustomerDesc"), icon: <UserPlus className="h-5 w-5" />, path: "/crm/customers/new", color: "bg-amber-500", permission: "customers.create", module: "crm" },
    { label: t("dashboard.actions.newPO"), description: t("dashboard.actions.newPODesc"), icon: <FileText className="h-5 w-5" />, path: "/purchases/orders/new", color: "bg-orange-500", permission: "purchases.create", module: "purchasing" },
    { label: t("dashboard.actions.inventory"), description: t("dashboard.actions.inventoryDesc"), icon: <Warehouse className="h-5 w-5" />, path: "/inventory", color: "bg-cyan-500", permission: "inventory.view" },
  ]

  const quickActions = allQuickActions
    .filter((action) => hasPermission(action.permission))
    .filter((action) => !action.module || isEnabled(action.module))

  const formatCurrency = (value: number) =>
    value.toLocaleString("en-US", { style: "currency", currency: "USD" })

  const todayStats: TodayStat[] = []
  if (salesVisible) {
    todayStats.push({
      id: "today-revenue",
      label: t("dashboard.stats.todayRevenue"),
      value: widgetsLoading ? "—" : formatCurrency(widgets?.todayRevenue ?? 0),
      icon: <DollarSign className="h-5 w-5" />,
      tone: "bg-emerald-500/10 text-emerald-600",
    })
    todayStats.push({
      id: "sales-count",
      label: t("dashboard.stats.salesCount"),
      value: widgetsLoading ? "—" : String(widgets?.recentSalesCount ?? 0),
      icon: <ShoppingCart className="h-5 w-5" />,
      tone: "bg-blue-500/10 text-blue-600",
    })
  }
  if (inventoryVisible) {
    todayStats.push({
      id: "low-stock",
      label: t("dashboard.stats.lowStock"),
      value: widgetsLoading ? "—" : String(inventoryStats?.lowStockProducts ?? 0),
      icon: <AlertTriangle className="h-5 w-5" />,
      tone: "bg-amber-500/10 text-amber-600",
    })
  }
  if (crmVisible) {
    todayStats.push({
      id: "new-customers",
      label: t("dashboard.stats.newCustomers"),
      value: crmDash ? String(crmDash.newCustomersMonth) : "—",
      icon: <Users className="h-5 w-5" />,
      tone: "bg-violet-500/10 text-violet-600",
    })
  }

  const attentionItems: AttentionItem[] = []

  if (inventoryVisible && inventoryStats) {
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

  if (purchasingVisible && purchaseDash) {
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

  if (crmVisible && crmDash) {
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

  return (
    <div className="space-y-6" data-testid="dashboard-page">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("dashboard.title")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("dashboard.description")}
        </p>
      </div>

      {quickActions.length > 0 && (
      <Section title={t("dashboard.quickActions")} description={t("dashboard.quickActionsDesc")}>
        <div className={cn("grid gap-3", gridCols(quickActions.length))}>
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
      )}

      {todayStats.length > 0 && (
      <Section title={t("dashboard.todaySummary")} description={t("dashboard.todaySummaryDesc")}>
        <div className={cn("grid gap-4", gridCols(todayStats.length))}>
          {todayStats.map((stat) => (
            <Card key={stat.id} data-testid={`stat-${stat.id}`}>
              <CardContent className="flex items-center gap-3 p-4">
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", stat.tone)}>
                  {stat.icon}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-lg font-bold tabular-nums">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>
      )}

      {perStoreVisible && (
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

      {(attentionVisible || salesVisible) && (
      <div className={cn("grid grid-cols-1 gap-6", attentionVisible && salesVisible && "lg:grid-cols-2")}>
        {attentionVisible && (
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
        )}

        {salesVisible && (
        <Section title={t("dashboard.recentSales")} description={t("dashboard.recentSalesDesc")}>
          {salesForToday.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <ShoppingCart className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm font-medium">{t("dashboard.noRecentSales")}</p>
                {hasPermission("sales.create") && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => navigate("/sales/new")}
                >
                  {t("dashboard.actions.newSale")}
                </Button>
                )}
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
        )}
      </div>
      )}
    </div>
  )
}
