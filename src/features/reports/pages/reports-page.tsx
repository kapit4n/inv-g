import { useTranslation } from "react-i18next"
import { useEffect, useState } from "react"
import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { getDashboardWidgets, getChartData } from "@/lib/tauri"
import type { DashboardWidgets, ChartData } from "@/types"
import { DollarSign, TrendingUp, Package, ShoppingBag, Receipt, AlertTriangle, Users, BarChart3 } from "lucide-react"
import { LineChartCard, BarChartCard, AreaChartCard, PieChartCard, StackedBarChartCard } from "../components/report-charts"
import { ReportTable } from "../components/report-table"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"

export function ReportsPage() {
  const { t } = useTranslation("reports")
  const [widgets, setWidgets] = useState<DashboardWidgets | null>(null)
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = () => {
    setLoading(true)
    setError(null)
    Promise.all([getDashboardWidgets(), getChartData()])
      .then(([w, c]) => {
        setWidgets(w)
        setChartData(c)
      })
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchData()
  }, [])

  const fmt = (v: number) =>
    v.toLocaleString("en-US", { style: "currency", currency: "USD" })

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("title")} description={t("dashboard")} />
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-destructive mb-4 text-sm">{error}</p>
          <Button onClick={fetchData}>{t("retry")}</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("dashboard")} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {loading
          ? Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="rounded-xl border p-6 space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-20" />
              </div>
            ))
          : (
              <>
                <StatCard title={t("todayRevenue")} value={fmt(widgets!.todayRevenue)} icon={<DollarSign className="h-5 w-5" />} />
                <StatCard title={t("monthlyRevenue")} value={fmt(widgets!.monthlyRevenue)} icon={<TrendingUp className="h-5 w-5" />} />
                <StatCard title={t("netProfitEstimate")} value={fmt(widgets!.netProfitEstimate)} icon={<DollarSign className="h-5 w-5" />} className="[&_.text-primary]:text-green-600 [&_.bg-primary\\/10]:bg-green-50" />
                <StatCard title={t("inventoryValue")} value={fmt(widgets!.inventoryValue)} icon={<Package className="h-5 w-5" />} />
                <StatCard
                  title={t("lowStockCount")}
                  value={widgets!.lowStockCount}
                  icon={<AlertTriangle className="h-5 w-5" />}
                  className={widgets!.lowStockCount > 0 ? "[&_.text-primary]:text-red-600 [&_.bg-primary\\/10]:bg-red-50" : ""}
                />
                <StatCard title={t("pendingPurchases")} value={widgets!.pendingPurchases} icon={<ShoppingBag className="h-5 w-5" />} />
                <StatCard title={t("averageTicket")} value={fmt(widgets!.averageTicket)} icon={<Receipt className="h-5 w-5" />} />
                <StatCard
                  title={t("salesGrowth")}
                  value={`${widgets!.salesGrowth >= 0 ? "+" : ""}${widgets!.salesGrowth.toFixed(1)}%`}
                  icon={<TrendingUp className="h-5 w-5" />}
                  trend={widgets!.salesGrowth >= 0 ? "up" : "down"}
                  trendValue={`${Math.abs(widgets!.salesGrowth).toFixed(1)}%`}
                />
                <StatCard title={t("inventoryTurnover")} value={widgets!.inventoryTurnover.toFixed(2)} icon={<BarChart3 className="h-5 w-5" />} />
              </>
            )
        }
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {loading ? (
          <>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border p-6 space-y-3">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-48 w-full" />
              </div>
            ))}
          </>
        ) : (
          <>
            <AreaChartCard title={t("revenueByMonth")} data={chartData!.revenueByMonth} />
            <PieChartCard title={t("salesByCategory")} data={chartData!.salesByCategory} />
            <BarChartCard title={t("salesByBrand")} data={chartData!.salesByBrand} />
            <LineChartCard title={t("profitTrend")} data={chartData!.profitTrend} />
            <AreaChartCard title={t("inventoryTrend")} data={chartData!.inventoryTrend} />
            <BarChartCard title={t("customerGrowth")} data={chartData!.customerGrowth} />
            <PieChartCard title={t("warehouseDistribution")} data={chartData!.warehouseDistribution} />
            <BarChartCard title={t("topProducts")} data={chartData!.topProductsChart} horizontal />
            <BarChartCard title={t("topSuppliers")} data={chartData!.topSuppliersChart} />
            <StackedBarChartCard title={t("purchasesVsSales")} data={chartData!.purchasesVsSales} />
          </>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">{t("topCustomers")}</h2>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <ReportTable
            columns={[
              { header: t("customerName"), accessorKey: "customerName" },
              { header: t("totalSpent"), accessorKey: "totalSpent", cell: (v: number) => fmt(v) },
              { header: t("orderCount"), accessorKey: "orderCount" },
            ]}
            data={widgets!.topCustomers}
          />
        )}
      </div>
    </div>
  )
}
