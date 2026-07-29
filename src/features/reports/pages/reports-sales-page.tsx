import { useTranslation } from "react-i18next"
import { useEffect, useState, useCallback } from "react"
import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ReportFilters } from "../components/report-filters"
import { BarChartCard, PieChartCard } from "../components/report-charts"
import { ReportTable } from "../components/report-table"
import * as api from "@/lib/tauri"
import type {
  SalesReportFilter,
  SalesReportRow,
  SalesByCashier,
  SalesByPaymentMethod,
  DiscountAnalysis,
  ReturnsSummary,
  TaxSummary,
} from "@/types"
import type { FilterState } from "../components/report-filters"
import type { Column } from "../components/report-table"
import { DollarSign, ShoppingCart, Receipt, Percent, RotateCcw, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

function toApiFilter(filters: FilterState): SalesReportFilter {
  return {
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
    paymentMethod: filters.paymentMethod !== "All" ? filters.paymentMethod : undefined,
  }
}

const INITIAL_FILTERS: FilterState = {
  dateFrom: "",
  dateTo: "",
  warehouse: "All",
  category: "All",
  brand: "All",
  paymentMethod: "All",
}

const currency = (v: number) =>
  v.toLocaleString("en-US", { style: "currency", currency: "USD" })

export function ReportsSalesPage() {
  const { t } = useTranslation("reports")

  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS)
  const [activeTab, setActiveTab] = useState("daily")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [dailyData, setDailyData] = useState<SalesReportRow[]>([])
  const [weeklyData, setWeeklyData] = useState<SalesReportRow[]>([])
  const [monthlyData, setMonthlyData] = useState<SalesReportRow[]>([])
  const [yearlyData, setYearlyData] = useState<SalesReportRow[]>([])
  const [cashierData, setCashierData] = useState<SalesByCashier[]>([])
  const [paymentData, setPaymentData] = useState<SalesByPaymentMethod[]>([])
  const [discountData, setDiscountData] = useState<DiscountAnalysis | null>(null)
  const [returnsData, setReturnsData] = useState<ReturnsSummary | null>(null)
  const [taxData, setTaxData] = useState<TaxSummary | null>(null)
  const [quoteConversion, setQuoteConversion] = useState(0)

  const fetchData = useCallback(() => {
    setLoading(true)
    setError(null)
    const f = toApiFilter(filters)

    Promise.all([
      api.getSalesReportDaily(f),
      api.getSalesReportWeekly(f),
      api.getSalesReportMonthly(f),
      api.getSalesReportYearly(f),
      api.getSalesByCashier(f),
      api.getSalesByPaymentMethod(f),
      api.getSalesDiscountAnalysis(f),
      api.getSalesReturnsSummary(f),
      api.getSalesTaxSummary(f),
      api.getSalesQuoteConversion(),
    ])
      .then(([daily, weekly, monthly, yearly, cashier, payment, discount, returns_, tax, quote]) => {
        setDailyData(daily)
        setWeeklyData(weekly)
        setMonthlyData(monthly)
        setYearlyData(yearly)
        setCashierData(cashier)
        setPaymentData(payment)
        setDiscountData(discount)
        setReturnsData(returns_)
        setTaxData(tax)
        setQuoteConversion(quote)
      })
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false))
  }, [filters])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const handleClearFilters = () => {
    setFilters(INITIAL_FILTERS)
  }

  const reportColumns: Column[] = [
    { key: "period", label: t("period") },
    { key: "transactionCount", label: t("transactionCount"), format: "number" },
    { key: "subtotal", label: t("subtotal"), format: "currency" },
    { key: "discount", label: t("discount"), format: "currency" },
    { key: "tax", label: t("tax"), format: "currency" },
    { key: "total", label: t("total"), format: "currency" },
    { key: "cost", label: t("cost"), format: "currency" },
    { key: "profit", label: t("profit"), format: "currency" },
  ]

  const cashierColumns: Column[] = [
    { key: "cashierName", label: t("cashierName") },
    { key: "transactionCount", label: t("transactionCount"), format: "number" },
    { key: "total", label: t("total"), format: "currency" },
  ]

  const paymentColumns: Column[] = [
    { key: "method", label: t("paymentMethod") },
    { key: "count", label: t("count"), format: "number" },
    { key: "total", label: t("total"), format: "currency" },
  ]

  function renderPeriodTab(data: SalesReportRow[], tabKey: string) {
    return (
      <TabsContent value={tabKey} className="space-y-4">
        <BarChartCard
          title={t(`${tabKey}Sales`)}
          data={data}
          dataKeys={{
            xKey: "period",
            bars: [
              { key: "total", name: t("total") },
              { key: "profit", name: t("profit") },
            ],
          }}
          loading={loading}
        />
        <ReportTable columns={reportColumns} data={data} loading={loading} />
      </TabsContent>
    )
  }

  function renderDiscountCards() {
    if (loading) {
      return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-xl border p-6 space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>
      )
    }

    if (!discountData) return null

    const d = discountData
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard title={t("totalDiscounts")} value={currency(d.totalDiscounts)} icon={<DollarSign className="h-5 w-5" />} />
        <StatCard title={t("avgDiscountPerSale")} value={currency(d.avgDiscountPerSale)} icon={<ShoppingCart className="h-5 w-5" />} />
        <StatCard title={t("salesWithDiscount")} value={d.salesWithDiscount} icon={<Receipt className="h-5 w-5" />} />
        <StatCard title={t("maxDiscount")} value={currency(d.maxDiscount)} icon={<DollarSign className="h-5 w-5" />} />
        <StatCard title={t("discountPercentage")} value={`${d.discountPercentage.toFixed(1)}%`} icon={<Percent className="h-5 w-5" />} />
      </div>
    )
  }

  function renderReturnsCards() {
    if (loading) {
      return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border p-6 space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>
      )
    }

    if (!returnsData) return null

    const r = returnsData
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title={t("totalReturns")} value={r.totalReturns} icon={<RotateCcw className="h-5 w-5" />} />
        <StatCard title={t("totalRefunded")} value={currency(r.totalRefunded)} icon={<DollarSign className="h-5 w-5" />} />
        <StatCard title={t("avgRefund")} value={currency(r.avgRefund)} icon={<ShoppingCart className="h-5 w-5" />} />
      </div>
    )
  }

  function renderTaxCards() {
    if (loading) {
      return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border p-6 space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>
      )
    }

    if (!taxData) return null

    const tx = taxData
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title={t("totalTax")} value={currency(tx.totalTax)} icon={<DollarSign className="h-5 w-5" />} />
        <StatCard title={t("avgTaxPerSale")} value={currency(tx.avgTaxPerSale)} icon={<Receipt className="h-5 w-5" />} />
        <StatCard title={t("taxableSalesCount")} value={tx.taxableSalesCount} icon={<ShoppingCart className="h-5 w-5" />} />
      </div>
    )
  }

  function renderQuoteCard() {
    if (loading) {
      return (
        <div className="max-w-sm">
          <div className="rounded-xl border p-6 space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      )
    }

    return (
      <div className="max-w-sm">
        <StatCard
          title={t("quoteConversionRate")}
          value={`${(quoteConversion * 100).toFixed(1)}%`}
          icon={<FileText className="h-5 w-5" />}
        />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("salesReport")} description={t("salesReportDescription")} />
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-destructive mb-4 text-sm">{error}</p>
          <Button onClick={fetchData}>{t("retry")}</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t("salesReport")} description={t("salesReportDescription")} />

      <ReportFilters filters={filters} onChange={handleFilterChange} onClear={handleClearFilters} />

      <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="daily">
        <TabsList className="flex-wrap">
          <TabsTrigger value="daily">{t("daily")}</TabsTrigger>
          <TabsTrigger value="weekly">{t("weekly")}</TabsTrigger>
          <TabsTrigger value="monthly">{t("monthly")}</TabsTrigger>
          <TabsTrigger value="yearly">{t("yearly")}</TabsTrigger>
          <TabsTrigger value="by-cashier">{t("byCashier")}</TabsTrigger>
          <TabsTrigger value="by-payment">{t("byPayment")}</TabsTrigger>
          <TabsTrigger value="discounts">{t("discounts")}</TabsTrigger>
          <TabsTrigger value="returns">{t("returns")}</TabsTrigger>
          <TabsTrigger value="tax">{t("tax")}</TabsTrigger>
          <TabsTrigger value="quotes">{t("quotes")}</TabsTrigger>
        </TabsList>

        {renderPeriodTab(dailyData, "daily")}
        {renderPeriodTab(weeklyData, "weekly")}
        {renderPeriodTab(monthlyData, "monthly")}
        {renderPeriodTab(yearlyData, "yearly")}

        <TabsContent value="by-cashier" className="space-y-4">
          <BarChartCard
            title={t("salesByCashier")}
            data={cashierData}
            dataKeys={{
              xKey: "cashierName",
              bars: [
                { key: "total", name: t("total") },
                { key: "transactionCount", name: t("transactionCount") },
              ],
            }}
            loading={loading}
            horizontal
          />
          <ReportTable columns={cashierColumns} data={cashierData} loading={loading} />
        </TabsContent>

        <TabsContent value="by-payment" className="space-y-4">
          <PieChartCard
            title={t("salesByPayment")}
            data={paymentData}
            dataKey="total"
            nameKey="method"
            loading={loading}
          />
          <ReportTable columns={paymentColumns} data={paymentData} loading={loading} />
        </TabsContent>

        <TabsContent value="discounts" className="space-y-4">
          {renderDiscountCards()}
        </TabsContent>

        <TabsContent value="returns" className="space-y-4">
          {renderReturnsCards()}
        </TabsContent>

        <TabsContent value="tax" className="space-y-4">
          {renderTaxCards()}
        </TabsContent>

        <TabsContent value="quotes" className="space-y-4">
          {renderQuoteCard()}
        </TabsContent>
      </Tabs>
    </div>
  )
}
