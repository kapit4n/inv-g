import { useTranslation } from "react-i18next"
import {
  DollarSign,
  ShoppingCart,
  Package,
  AlertTriangle,
  TrendingUp,
  Clock,
  ArrowUpRight,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCard } from "@/components/stat-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Section } from "@/components/section"

const stats = [
  {
    titleKey: "dashboard.todaysSales",
    valueKey: "dashboard.statCards.todaysSalesValue",
    icon: <DollarSign className="h-5 w-5" />,
    trend: "up" as const,
    trendValueKey: "dashboard.statCards.trendUp",
    descriptionKey: "dashboard.fromYesterday",
  },
  {
    titleKey: "dashboard.todaysOrders",
    valueKey: "dashboard.statCards.todaysOrdersValue",
    icon: <ShoppingCart className="h-5 w-5" />,
    trend: "up" as const,
    trendValueKey: "dashboard.statCards.trendUp2",
    descriptionKey: "dashboard.fromYesterday",
  },
  {
    titleKey: "dashboard.inventoryValue",
    valueKey: "dashboard.statCards.inventoryValueValue",
    icon: <Package className="h-5 w-5" />,
    trend: "up" as const,
    trendValueKey: "dashboard.statCards.trendUp3",
    descriptionKey: "dashboard.fromLastMonth",
  },
  {
    titleKey: "dashboard.lowStockItems",
    valueKey: "dashboard.statCards.lowStockValue",
    icon: <AlertTriangle className="h-5 w-5" />,
    trend: "down" as const,
    trendValueKey: "dashboard.statCards.trendDown",
    descriptionKey: "dashboard.fromLastWeek",
  },
]

const bestSellers = [
  { name: "Ceramic Brake Pads", sku: "BP-CER-001", sold: 156, revenue: "$7,176" },
  { name: "Premium Oil Filter", sku: "OF-PRM-002", sold: 134, revenue: "$1,741" },
  { name: "Iridium Spark Plugs", sku: "SP-IRD-005", sold: 98, revenue: "$832" },
  { name: "Synthetic 5W-30 Oil", sku: "OIL-5W30-010", sold: 89, revenue: "$4,445" },
  { name: "Air Filter (Universal)", sku: "AF-UNI-008", sold: 76, revenue: "$1,520" },
]

const recentActivity = [
  { actionKey: "dashboard.recentActivity", detail: "Invoice #INV-2024-034 — $1,240.00", time: "2 min ago", type: "sale" },
  { actionKey: "dashboard.recentActivity", detail: "Brake Pads — 50 units received", time: "15 min ago", type: "stock" },
  { actionKey: "dashboard.stockAlerts", detail: "Alternator Reman — 3 units remaining", time: "1 hour ago", type: "alert" },
  { actionKey: "dashboard.recentActivity", detail: "Mike's Auto Repair", time: "2 hours ago", type: "customer" },
  { actionKey: "dashboard.recentPurchases", detail: "PO-0089 — $4,500.00 from AutoParts Co.", time: "3 hours ago", type: "purchase" },
  { actionKey: "dashboard.recentActivity", detail: "Invoice #INV-2024-033 — $890.00", time: "4 hours ago", type: "sale" },
]

const lowStockItems = [
  { name: "Alternator (Reman)", sku: "ALT-003", current: 3, min: 10, status: "critical" },
  { name: "Fuel Pump Assembly", sku: "FP-012", current: 5, min: 15, status: "critical" },
  { name: "Timing Belt Kit", sku: "TB-007", current: 8, min: 20, status: "warning" },
  { name: "Wheel Bearings", sku: "WB-015", current: 12, min: 25, status: "warning" },
]

const monthlyData = [
  { month: "Jan", sales: 42000, purchases: 28000 },
  { month: "Feb", sales: 38000, purchases: 25000 },
  { month: "Mar", sales: 51000, purchases: 32000 },
  { month: "Apr", sales: 47000, purchases: 29000 },
  { month: "May", sales: 55000, purchases: 35000 },
  { month: "Jun", sales: 61000, purchases: 38000 },
  { month: "Jul", sales: 48000, purchases: 30000 },
]

const activityTypeColors: Record<string, string> = {
  sale: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  stock: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  alert: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  customer: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  purchase: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
}

export function DashboardPage() {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("dashboard.title")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("dashboard.description")}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard
            key={stat.titleKey}
            title={t(stat.titleKey)}
            value={t(stat.valueKey)}
            icon={stat.icon}
            trend={stat.trend}
            trendValue={t(stat.trendValueKey)}
            description={t(stat.descriptionKey)}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">{t("dashboard.monthlySalesOverview")}</CardTitle>
            <Button variant="ghost" size="sm" disabled>
              {t("dashboard.viewReport")} <ArrowUpRight className="ml-1 h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {monthlyData.map((d) => (
                <div key={d.month} className="flex items-center gap-4">
                  <span className="w-8 text-xs text-muted-foreground">{d.month}</span>
                  <div className="flex-1">
                    <div className="flex gap-1">
                      <div
                        className="h-6 rounded-md bg-primary"
                        style={{ width: `${(d.sales / 65000) * 100}%` }}
                      />
                      <div
                        className="h-6 rounded-md bg-primary/20"
                        style={{ width: `${(d.purchases / 65000) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="w-20 text-right text-xs font-medium">${(d.sales / 1000).toFixed(0)}k</span>
                </div>
              ))}
              <div className="flex items-center gap-4 pt-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded bg-primary" /> {t("dashboard.sales")}
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded bg-primary/20" /> {t("dashboard.purchases")}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("dashboard.profitOverview")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">{t("dashboard.thisMonth")}</p>
              <p className="text-2xl font-bold">$23,450</p>
              <div className="flex items-center gap-1 text-xs text-emerald-500">
                <TrendingUp className="h-3 w-3" />
                <span>+18.2% {t("dashboard.fromLastMonth")}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("dashboard.revenue")}</span>
                <span className="font-medium">$48,200</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("dashboard.cogs")}</span>
                <span className="font-medium">$24,750</span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex justify-between text-sm font-medium">
                <span>{t("dashboard.netProfit")}</span>
                <span className="text-emerald-500">$23,450</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Section title={t("dashboard.bestSellers")} description={t("dashboard.topPerformingProducts")}>
          <Card>
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("dashboard.product")}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("dashboard.sold")}</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">{t("dashboard.revenueCol")}</th>
                  </tr>
                </thead>
                <tbody>
                  {bestSellers.map((item, idx) => (
                    <tr key={item.sku} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                            {idx + 1}
                          </span>
                          <div>
                            <p className="text-sm font-medium">{item.name}</p>
                            <p className="text-xs text-muted-foreground">{item.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">{item.sold}</td>
                      <td className="px-4 py-3 text-right text-sm font-medium">{item.revenue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </Section>

        <Section title={t("dashboard.recentActivity")} description={t("dashboard.latestStoreEvents")}>
          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                {recentActivity.map((activity, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <Badge variant="outline" className={`text-[10px] ${activityTypeColors[activity.type] || ""}`}>
                        {activity.type}
                      </Badge>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{t(activity.actionKey)}</p>
                      <p className="text-xs text-muted-foreground truncate">{activity.detail}</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                      <Clock className="h-3 w-3" />
                      {activity.time}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </Section>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Section
          title={t("dashboard.stockAlerts")}
          description={t("dashboard.itemsThatNeedAttention")}
          actions={
            <Button variant="outline" size="sm" disabled>
              {t("dashboard.viewReport")} <ArrowUpRight className="ml-1 h-3 w-3" />
            </Button>
          }
        >
          <Card>
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("dashboard.product")}</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">{t("dashboard.current")}</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">{t("dashboard.minRequired")}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("common.status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockItems.map((item) => (
                    <tr key={item.sku} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.sku}</p>
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-medium">{item.current}</td>
                      <td className="px-4 py-3 text-center text-sm text-muted-foreground">{item.min}</td>
                      <td className="px-4 py-3">
                        <Badge variant={item.status === "critical" ? "destructive" : "warning"}>
                          {item.status === "critical" ? t("dashboard.critical") : t("dashboard.low")}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </Section>

        <Section title={t("dashboard.recentPurchases")} description={t("dashboard.latestPurchaseOrders")}>
          <div className="space-y-3">
            {[
              { po: "PO-0089", supplier: "AutoParts Co.", amount: "$4,500.00", items: 12, statusKey: "dashboard.delivered" },
              { po: "PO-0088", supplier: "OEM Direct", amount: "$2,890.00", items: 8, statusKey: "dashboard.inTransit" },
              { po: "PO-0087", supplier: "BrakeMaster Inc.", amount: "$6,200.00", items: 24, statusKey: "dashboard.processing" },
              { po: "PO-0086", supplier: "FilterPro Supply", amount: "$1,340.00", items: 6, statusKey: "dashboard.delivered" },
            ].map((po) => (
              <Card key={po.po} className="transition-shadow hover:shadow-md">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{po.po}</p>
                      <Badge variant="success">{t(po.statusKey)}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{po.supplier} — {po.items} {t("dashboard.items")}</p>
                  </div>
                  <p className="text-sm font-semibold">{po.amount}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </Section>
      </div>
    </div>
  )
}
