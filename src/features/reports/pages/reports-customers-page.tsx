import { useTranslation } from "react-i18next"
import { useEffect, useState, useCallback } from "react"
import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PieChartCard, LineChartCard } from "../components/report-charts"
import { ReportTable, type Column } from "../components/report-table"
import * as api from "@/lib/tauri"
import type {
  CustomerReportRow,
  CustomerGrowthRow,
  CustomerLocation,
  CustomerCreditSummary,
  CustomerServiceSummary,
} from "@/types"
import { Users, TrendingUp, Clock, CreditCard, Wrench } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

const currency = (v: number) =>
  v.toLocaleString("en-US", { style: "currency", currency: "USD" })

export function ReportsCustomersPage() {
  const { t } = useTranslation("reports")

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [topCustomers, setTopCustomers] = useState<CustomerReportRow[]>([])
  const [growthData, setGrowthData] = useState<CustomerGrowthRow[]>([])
  const [locations, setLocations] = useState<CustomerLocation[]>([])
  const [inactive, setInactive] = useState<CustomerReportRow[]>([])
  const [credit, setCredit] = useState<CustomerCreditSummary | null>(null)
  const [service, setService] = useState<CustomerServiceSummary | null>(null)

  const fetchData = useCallback(() => {
    setLoading(true)
    setError(null)

    Promise.all([
      api.getTopCustomers(20),
      api.getCustomerGrowthReport(),
      api.getCustomerLocations(),
      api.getInactiveCustomers(90),
      api.getCustomerCreditSummary(),
      api.getCustomerServiceSummary(),
    ])
      .then(([top, growth, locs, inact, cred, svc]) => {
        setTopCustomers(top)
        setGrowthData(growth)
        setLocations(locs)
        setInactive(inact)
        setCredit(cred)
        setService(svc)
      })
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const topColumns: Column[] = [
    { key: "customerName", label: t("customerName") },
    { key: "totalSpent", label: t("totalSpent"), format: "currency" },
    { key: "orderCount", label: t("orderCount"), format: "number" },
    { key: "lastPurchase", label: t("lastPurchase") },
    { key: "avgTicket", label: t("avgTicket"), format: "currency" },
    { key: "lifetimeValue", label: t("lifetimeValue"), format: "currency" },
  ]

  const growthColumns: Column[] = [
    { key: "month", label: t("month") },
    { key: "newCustomers", label: t("newCustomers"), format: "number" },
    { key: "totalCustomers", label: t("totalCustomers"), format: "number" },
  ]

  const locationColumns: Column[] = [
    { key: "city", label: t("city") },
    { key: "count", label: t("count"), format: "number" },
  ]

  const inactiveColumns: Column[] = [
    { key: "customerName", label: t("customerName") },
    { key: "totalSpent", label: t("totalSpent"), format: "currency" },
    { key: "lastPurchase", label: t("lastPurchase") },
    { key: "orderCount", label: t("orderCount"), format: "number" },
  ]

  function renderStatSkeleton(count: number) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="rounded-xl border p-6 space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>
    )
  }

  function renderCreditCards() {
    if (loading) return renderStatSkeleton(6)
    if (!credit) return null

    const c = credit
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard title={t("totalAccounts")} value={c.totalAccounts} icon={<Users className="h-5 w-5" />} />
        <StatCard title={t("totalCreditLimit")} value={currency(c.totalCreditLimit)} icon={<CreditCard className="h-5 w-5" />} />
        <StatCard title={t("totalBalance")} value={currency(c.totalBalance)} icon={<CreditCard className="h-5 w-5" />} />
        <StatCard title={t("availableCredit")} value={currency(c.availableCredit)} icon={<CreditCard className="h-5 w-5" />} />
        <StatCard title={t("utilizationRate")} value={`${(c.utilizationRate * 100).toFixed(1)}%`} icon={<TrendingUp className="h-5 w-5" />} />
        <StatCard title={t("overdueAccounts")} value={c.overdueAccounts} icon={<Clock className="h-5 w-5" />} />
      </div>
    )
  }

  function renderServiceCards() {
    if (loading) return renderStatSkeleton(6)
    if (!service) return null

    const s = service
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard title={t("totalReminders")} value={s.totalReminders} icon={<Wrench className="h-5 w-5" />} />
        <StatCard title={t("pendingReminders")} value={s.pendingReminders} icon={<Clock className="h-5 w-5" />} />
        <StatCard title={t("completedReminders")} value={s.completedReminders} icon={<Wrench className="h-5 w-5" />} />
        <StatCard title={t("overdueReminders")} value={s.overdueReminders} icon={<Clock className="h-5 w-5" />} />
        <StatCard title={t("totalVehicles")} value={s.totalVehicles} icon={<Users className="h-5 w-5" />} />
        <StatCard title={t("activeWarranties")} value={s.activeWarranties} icon={<Wrench className="h-5 w-5" />} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("customers")} description={t("customersDescription")} />
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-destructive mb-4 text-sm">{error}</p>
          <Button onClick={fetchData}>{t("retry")}</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t("customers")} description={t("customersDescription")} />

      <Tabs defaultValue="top">
        <TabsList className="flex-wrap">
          <TabsTrigger value="top">{t("topCustomers")}</TabsTrigger>
          <TabsTrigger value="growth">{t("growth")}</TabsTrigger>
          <TabsTrigger value="locations">{t("locations")}</TabsTrigger>
          <TabsTrigger value="inactive">{t("inactive")}</TabsTrigger>
          <TabsTrigger value="credit">{t("credit")}</TabsTrigger>
          <TabsTrigger value="service">{t("service")}</TabsTrigger>
        </TabsList>

        <TabsContent value="top" className="space-y-4">
          <ReportTable columns={topColumns} data={topCustomers as unknown as Record<string, unknown>[]} loading={loading} />
        </TabsContent>

        <TabsContent value="growth" className="space-y-4">
          <LineChartCard
            title={t("customerGrowth")}
            data={growthData as unknown as Record<string, unknown>[]}
            dataKeys={{
              xKey: "month",
              lines: [
                { key: "newCustomers", name: t("newCustomers") },
                { key: "totalCustomers", name: t("totalCustomers") },
              ],
            }}
            loading={loading}
          />
          <ReportTable columns={growthColumns} data={growthData as unknown as Record<string, unknown>[]} loading={loading} />
        </TabsContent>

        <TabsContent value="locations" className="space-y-4">
          <PieChartCard
            title={t("customersByCity")}
            data={locations as unknown as Record<string, unknown>[]}
            dataKey="count"
            nameKey="city"
            loading={loading}
          />
          <ReportTable columns={locationColumns} data={locations as unknown as Record<string, unknown>[]} loading={loading} />
        </TabsContent>

        <TabsContent value="inactive" className="space-y-4">
          <ReportTable columns={inactiveColumns} data={inactive as unknown as Record<string, unknown>[]} loading={loading} />
        </TabsContent>

        <TabsContent value="credit" className="space-y-4">
          {renderCreditCards()}
        </TabsContent>

        <TabsContent value="service" className="space-y-4">
          {renderServiceCards()}
        </TabsContent>
      </Tabs>
    </div>
  )
}
