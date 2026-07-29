import { useTranslation } from "react-i18next"
import { useEffect, useState, useCallback } from "react"
import { PageHeader } from "@/components/page-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChartCard } from "../components/report-charts"
import { ReportTable, type Column } from "../components/report-table"
import * as api from "@/lib/tauri"
import type { SupplierRanking, LeadTimeAnalysis, SupplierPerformanceReport } from "@/types"
import { Truck, Clock, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

const currency = (v: number) =>
  v.toLocaleString("en-US", { style: "currency", currency: "USD" })

function scoreBadge(score: number) {
  if (score > 80) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
  if (score > 60) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
  return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
}

export function ReportsSuppliersPage() {
  const { t } = useTranslation("reports")

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [rankingData, setRankingData] = useState<SupplierRanking[]>([])
  const [leadTimeData, setLeadTimeData] = useState<LeadTimeAnalysis[]>([])
  const [perfData, setPerfData] = useState<SupplierPerformanceReport[]>([])

  const fetchData = useCallback(() => {
    setLoading(true)
    setError(null)

    Promise.all([
      api.getSupplierRanking(),
      api.getLeadTimeAnalysis(),
      api.getSupplierPerformanceReport(),
    ])
      .then(([ranking, leadTime, perf]) => {
        setRankingData(ranking)
        setLeadTimeData(leadTime)
        setPerfData(perf)
      })
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const rankingColumns: Column[] = [
    { key: "supplierName", label: t("supplierName") },
    { key: "totalPurchases", label: t("totalPurchases"), format: "currency" },
    { key: "orderCount", label: t("orderCount"), format: "number" },
    { key: "avgCost", label: t("avgCost"), format: "currency" },
    { key: "onTimeRate", label: t("onTimeRate"), format: "percent" },
    { key: "returnRate", label: t("returnRate"), format: "percent" },
    { key: "avgLeadTime", label: t("avgLeadTime"), format: "number" },
    {
      key: "score",
      label: t("score"),
      renderCell: (value) => (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${scoreBadge(Number(value))}`}
        >
          {Number(value).toFixed(0)}
        </span>
      ),
    },
  ]

  const leadTimeColumns: Column[] = [
    { key: "supplierName", label: t("supplierName") },
    { key: "avgLeadTime", label: t("avgLeadTime"), format: "number" },
    { key: "minLeadTime", label: t("minLeadTime"), format: "number" },
    { key: "maxLeadTime", label: t("maxLeadTime"), format: "number" },
    { key: "orderCount", label: t("orderCount"), format: "number" },
  ]

  const perfColumns: Column[] = [
    { key: "supplierName", label: t("supplierName") },
    { key: "orderCount", label: t("orderCount"), format: "number" },
    { key: "completedCount", label: t("completedCount"), format: "number" },
    { key: "onTimeDelivery", label: t("onTimeDelivery"), format: "percent" },
    { key: "avgLeadTimeDays", label: t("avgLeadTimeDays"), format: "number" },
    { key: "returnRate", label: t("returnRate"), format: "percent" },
    { key: "totalSpent", label: t("totalSpent"), format: "currency" },
  ]

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("suppliers")} description={t("suppliersDescription")} />
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-destructive mb-4 text-sm">{error}</p>
          <Button onClick={fetchData}>{t("retry")}</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t("suppliers")} description={t("suppliersDescription")} />

      <Tabs defaultValue="ranking">
        <TabsList className="flex-wrap">
          <TabsTrigger value="ranking">{t("ranking")}</TabsTrigger>
          <TabsTrigger value="lead-time">{t("leadTime")}</TabsTrigger>
          <TabsTrigger value="performance">{t("performance")}</TabsTrigger>
        </TabsList>

        <TabsContent value="ranking" className="space-y-4">
          <ReportTable columns={rankingColumns} data={rankingData as unknown as Record<string, unknown>[]} loading={loading} />
        </TabsContent>

        <TabsContent value="lead-time" className="space-y-4">
          <BarChartCard
            title={t("leadTimeAnalysis")}
            data={leadTimeData as unknown as Record<string, unknown>[]}
            dataKeys={{
              xKey: "supplierName",
              bars: [{ key: "avgLeadTime", name: t("avgLeadTime") }],
            }}
            loading={loading}
          />
          <ReportTable columns={leadTimeColumns} data={leadTimeData as unknown as Record<string, unknown>[]} loading={loading} />
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <ReportTable columns={perfColumns} data={perfData as unknown as Record<string, unknown>[]} loading={loading} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
