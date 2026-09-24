import { useTranslation } from "react-i18next"
import { useEffect, useState } from "react"
import { PageHeader } from "@/components/page-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChartCard, PieChartCard } from "../components/report-charts"
import { ReportTable } from "../components/report-table"
import { ReportFilters } from "../components/report-filters"
import type { FilterState } from "../components/report-filters"
import * as api from "@/lib/tauri"
import type { PurchaseReportFilter, PurchaseReportRow, PurchaseBySupplier, SupplierPerformance as SP, POStatusSummary, ProductToReorder, CostHistoryEntry } from "@/types"
import { ShoppingBag, Truck, BarChart3, AlertTriangle, DollarSign } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type TabId = "byMonth" | "bySupplier" | "supplierPerformance" | "poStatus" | "reorder" | "costHistory"

const emptyFilter: FilterState = {
  dateFrom: "",
  dateTo: "",
  warehouse: "All",
  category: "All",
  brand: "All",
  paymentMethod: "All",
}

function fmt(v: number) {
  return v.toLocaleString("en-US", { style: "currency", currency: "USD" })
}

function onTimeRating(pct: number) {
  if (pct >= 90) return { labelKey: "excellent" as const, color: "bg-green-100 text-green-800" as const }
  if (pct >= 75) return { labelKey: "average" as const, color: "bg-yellow-100 text-yellow-800" as const }
  return { labelKey: "poor" as const, color: "bg-red-100 text-red-800" as const }
}

function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            {Array.from({ length: cols }).map((_, i) => (
              <TableHead key={i}><Skeleton className="h-4 w-20" /></TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, r) => (
            <TableRow key={r}>
              {Array.from({ length: cols }).map((_, c) => (
                <TableCell key={c}><Skeleton className="h-4 w-full max-w-[100px]" /></TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function TableError({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { t } = useTranslation("reports")
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <p className="text-destructive mb-3 text-sm">{message}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>{t("retry")}</Button>
    </div>
  )
}

export function ReportsPurchasingPage() {
  const { t } = useTranslation("reports")
  const [activeTab, setActiveTab] = useState<TabId>("byMonth")
  const [filters, setFilters] = useState<FilterState>(emptyFilter)

  const [monthData, setMonthData] = useState<PurchaseReportRow[]>([])
  const [monthLoading, setMonthLoading] = useState(false)
  const [monthError, setMonthError] = useState<string | null>(null)

  const [supplierData, setSupplierData] = useState<PurchaseBySupplier[]>([])
  const [supplierLoading, setSupplierLoading] = useState(false)
  const [supplierError, setSupplierError] = useState<string | null>(null)

  const [perfData, setPerfData] = useState<SP[]>([])
  const [perfLoading, setPerfLoading] = useState(false)
  const [perfError, setPerfError] = useState<string | null>(null)

  const [poStatusData, setPoStatusData] = useState<POStatusSummary[]>([])
  const [poStatusLoading, setPoStatusLoading] = useState(false)
  const [poStatusError, setPoStatusError] = useState<string | null>(null)

  const [reorderData, setReorderData] = useState<ProductToReorder[]>([])
  const [reorderLoading, setReorderLoading] = useState(false)
  const [reorderError, setReorderError] = useState<string | null>(null)

  const [costData, setCostData] = useState<CostHistoryEntry[]>([])
  const [costLoading, setCostLoading] = useState(false)
  const [costError, setCostError] = useState<string | null>(null)

  const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "byMonth", label: t("byMonth"), icon: <BarChart3 className="h-4 w-4" /> },
    { id: "bySupplier", label: t("bySupplier"), icon: <Truck className="h-4 w-4" /> },
    { id: "supplierPerformance", label: t("supplierPerformance"), icon: <BarChart3 className="h-4 w-4" /> },
    { id: "poStatus", label: t("poStatus"), icon: <ShoppingBag className="h-4 w-4" /> },
    { id: "reorder", label: t("reorder"), icon: <AlertTriangle className="h-4 w-4" /> },
    { id: "costHistory", label: t("costHistory"), icon: <DollarSign className="h-4 w-4" /> },
  ]

  const monthColumns = [
    { key: "period", label: t("period") },
    { key: "orderCount", label: t("orderCount"), format: "number" as const },
    { key: "total", label: t("total"), format: "currency" as const },
    { key: "itemCount", label: t("items"), format: "number" as const },
    { key: "avgOrderValue", label: t("avgOrderValue"), format: "currency" as const },
  ]

  const supplierColumns = [
    { key: "supplierName", label: t("supplierName") },
    { key: "orderCount", label: t("orderCount"), format: "number" as const },
    { key: "total", label: t("total"), format: "currency" as const },
    { key: "avgCost", label: t("avgCost"), format: "currency" as const },
  ]

  const poStatusColumns = [
    { key: "status", label: t("status") },
    { key: "count", label: t("count"), format: "number" as const },
    { key: "total", label: t("total"), format: "currency" as const },
  ]

  const costHistoryColumns = [
    { key: "productName", label: t("productName") },
    { key: "productSku", label: t("sku") },
    { key: "supplierName", label: t("supplierName") },
    { key: "oldCost", label: t("oldCost"), format: "currency" as const },
    { key: "newCost", label: t("newCost"), format: "currency" as const },
    { key: "quantity", label: t("quantity"), format: "number" as const },
    { key: "createdByName", label: t("changedBy") },
    { key: "createdAt", label: t("date") },
  ]

  const purchaseFilter: PurchaseReportFilter = {
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
  }

  const fetchByMonth = () => {
    setMonthLoading(true)
    setMonthError(null)
    api.getPurchasesByMonth(purchaseFilter).then(setMonthData).catch((e) => setMonthError(String(e))).finally(() => setMonthLoading(false))
  }

  const fetchBySupplier = () => {
    setSupplierLoading(true)
    setSupplierError(null)
    api.getPurchasesBySupplier(purchaseFilter).then(setSupplierData).catch((e) => setSupplierError(String(e))).finally(() => setSupplierLoading(false))
  }

  const fetchSupplierPerformance = () => {
    setPerfLoading(true)
    setPerfError(null)
    api.getSupplierPerformanceReport().then(setPerfData).catch((e) => setPerfError(String(e))).finally(() => setPerfLoading(false))
  }

  const fetchPoStatus = () => {
    setPoStatusLoading(true)
    setPoStatusError(null)
    api.getPoStatusSummary().then(setPoStatusData).catch((e) => setPoStatusError(String(e))).finally(() => setPoStatusLoading(false))
  }

  const fetchReorder = () => {
    setReorderLoading(true)
    setReorderError(null)
    api.getProductsToReorder().then(setReorderData).catch((e) => setReorderError(String(e))).finally(() => setReorderLoading(false))
  }

  const fetchCostHistory = () => {
    setCostLoading(true)
    setCostError(null)
    api.getPurchaseCostHistory().then(setCostData).catch((e) => setCostError(String(e))).finally(() => setCostLoading(false))
  }

  useEffect(() => { fetchByMonth() }, [filters.dateFrom, filters.dateTo])
  useEffect(() => { fetchBySupplier() }, [filters.dateFrom, filters.dateTo])
  useEffect(() => { fetchSupplierPerformance() }, [])
  useEffect(() => { fetchPoStatus() }, [])
  useEffect(() => { fetchReorder() }, [])
  useEffect(() => { fetchCostHistory() }, [])

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => setFilters(emptyFilter)

  const renderByMonth = () => {
    if (monthError) return <TableError message={monthError} onRetry={fetchByMonth} />
    return (
      <div className="space-y-6">
        <BarChartCard
          title={t("purchasesByMonth")}
          data={monthData as unknown as Record<string, unknown>[]}
          dataKeys={{ xKey: "period", bars: [{ key: "total", name: t("total") }, { key: "orderCount", name: t("orders") }] }}
          loading={monthLoading}
        />
        <ReportTable columns={monthColumns} data={monthData as unknown as Record<string, unknown>[]} loading={monthLoading} />
      </div>
    )
  }

  const renderBySupplier = () => {
    if (supplierError) return <TableError message={supplierError} onRetry={fetchBySupplier} />
    return (
      <div className="space-y-6">
        <BarChartCard
          title={t("purchasesBySupplier")}
          data={supplierData as unknown as Record<string, unknown>[]}
          dataKeys={{ xKey: "supplierName", bars: [{ key: "total", name: t("total") }, { key: "orderCount", name: t("orders") }] }}
          loading={supplierLoading}
        />
        <ReportTable columns={supplierColumns} data={supplierData as unknown as Record<string, unknown>[]} loading={supplierLoading} />
      </div>
    )
  }

  const perfHeaders = (
    <TableRow>
      <TableHead>{t("supplierName")}</TableHead>
      <TableHead>{t("orders")}</TableHead>
      <TableHead>{t("completedCount")}</TableHead>
      <TableHead>{t("onTime")}</TableHead>
      <TableHead>{t("avgLeadTimeDays")}</TableHead>
      <TableHead>{t("returnRate")}</TableHead>
      <TableHead>{t("totalSpent")}</TableHead>
      <TableHead>{t("rating")}</TableHead>
    </TableRow>
  )

  const renderSupplierPerformance = () => {
    if (perfError) return <TableError message={perfError} onRetry={fetchSupplierPerformance} />
    if (perfLoading) return <TableSkeleton rows={5} cols={7} />
    if (perfData.length === 0) {
      return (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              {perfHeaders}
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">{t("noData")}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )
    }
    return (
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            {perfHeaders}
          </TableHeader>
          <TableBody>
            {perfData.map((row) => {
              const rating = onTimeRating(row.onTimeDelivery)
              return (
                <TableRow key={row.supplierId}>
                  <TableCell className="font-medium">{row.supplierName}</TableCell>
                  <TableCell>{row.orderCount}</TableCell>
                  <TableCell>{row.completedCount}</TableCell>
                  <TableCell>{row.onTimeDelivery.toFixed(1)}%</TableCell>
                  <TableCell>{row.avgLeadTimeDays}</TableCell>
                  <TableCell>{row.returnRate.toFixed(1)}%</TableCell>
                  <TableCell>{fmt(row.totalSpent)}</TableCell>
                  <TableCell><Badge className={rating.color}>{t(rating.labelKey)}</Badge></TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    )
  }

  const renderPoStatus = () => {
    if (poStatusError) return <TableError message={poStatusError} onRetry={fetchPoStatus} />
    return (
      <div className="space-y-6">
        <PieChartCard
          title={t("poStatusDistribution")}
          data={poStatusData as unknown as Record<string, unknown>[]}
          dataKey="count"
          nameKey="status"
          loading={poStatusLoading}
        />
        <ReportTable columns={poStatusColumns} data={poStatusData as unknown as Record<string, unknown>[]} loading={poStatusLoading} />
      </div>
    )
  }

  const reorderHeaders = (
    <TableRow>
      <TableHead>{t("productName")}</TableHead>
      <TableHead>{t("sku")}</TableHead>
      <TableHead>{t("stock")}</TableHead>
      <TableHead>{t("reorderPoint")}</TableHead>
      <TableHead>{t("supplierName")}</TableHead>
      <TableHead>{t("lastCost")}</TableHead>
      <TableHead />
    </TableRow>
  )

  const renderReorder = () => {
    if (reorderError) return <TableError message={reorderError} onRetry={fetchReorder} />
    if (reorderLoading) return <TableSkeleton rows={5} cols={6} />
    if (reorderData.length === 0) {
      return (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              {reorderHeaders}
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">{t("noData")}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )
    }
    return (
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            {reorderHeaders}
          </TableHeader>
          <TableBody>
            {reorderData.map((row) => (
              <TableRow key={row.productId}>
                <TableCell className="font-medium">{row.productName}</TableCell>
                <TableCell>{row.sku}</TableCell>
                <TableCell>
                  <span className={row.stockQuantity <= row.reorderPoint ? "text-red-600 font-medium" : ""}>
                    {row.stockQuantity}
                  </span>
                </TableCell>
                <TableCell>{row.reorderPoint}</TableCell>
                <TableCell>{row.preferredSupplier ?? "-"}</TableCell>
                <TableCell>{fmt(row.lastCost)}</TableCell>
                <TableCell>
                  <Button size="sm" variant="outline">{t("createPO")}</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  const renderCostHistory = () => {
    if (costError) return <TableError message={costError} onRetry={fetchCostHistory} />
    return (
      <ReportTable columns={costHistoryColumns} data={costData as unknown as Record<string, unknown>[]} loading={costLoading} />
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("purchasingReports")} />
      <ReportFilters filters={filters} onChange={handleFilterChange} onClear={clearFilters} />
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabId)}>
        <TabsList>
          {TABS.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="gap-1.5">
              {tab.icon}
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="byMonth" className="mt-6">{renderByMonth()}</TabsContent>
        <TabsContent value="bySupplier" className="mt-6">{renderBySupplier()}</TabsContent>
        <TabsContent value="supplierPerformance" className="mt-6">{renderSupplierPerformance()}</TabsContent>
        <TabsContent value="poStatus" className="mt-6">{renderPoStatus()}</TabsContent>
        <TabsContent value="reorder" className="mt-6">{renderReorder()}</TabsContent>
        <TabsContent value="costHistory" className="mt-6">{renderCostHistory()}</TabsContent>
      </Tabs>
    </div>
  )
}