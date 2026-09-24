import { useTranslation } from "react-i18next"
import { useEffect, useState } from "react"
import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AreaChartCard, PieChartCard } from "../components/report-charts"
import { ReportTable, type Column } from "../components/report-table"
import * as api from "@/lib/tauri"
import type { InventoryReportRow, InventoryValuation, StockStatusItem, MovementSummary, AgingItem, InventoryReportFilter } from "@/types"
import { Package, AlertTriangle, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

const fmt = (v: number) =>
  v.toLocaleString("en-US", { style: "currency", currency: "USD" })

function statusBadge(value: unknown): string {
  const status = String(value)
  const map: Record<string, string> = {
    out_of_stock: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    reorder: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    low: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  }
  return map[status] ?? "bg-gray-100 text-gray-800"
}

export function ReportsInventoryPage() {
  const { t } = useTranslation("reports")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [warehouseFilter, setWarehouseFilter] = useState("all")

  const [inventoryData, setInventoryData] = useState<InventoryReportRow[]>([])
  const [valuationData, setValuationData] = useState<InventoryValuation[]>([])
  const [lowStockData, setLowStockData] = useState<StockStatusItem[]>([])
  const [overstockData, setOverstockData] = useState<StockStatusItem[]>([])
  const [movementData, setMovementData] = useState<MovementSummary[]>([])
  const [agingData, setAgingData] = useState<AgingItem[]>([])
  const [fastSlowData, setFastSlowData] = useState<AgingItem[]>([])
  const [warehouses, setWarehouses] = useState<{ id: number; name: string }[]>([])

  const fetchData = () => {
    setLoading(true)
    setError(null)
    const filter: InventoryReportFilter =
      warehouseFilter !== "all" ? { warehouseId: Number(warehouseFilter) } : {}

    Promise.all([
      api.getInventoryReport(filter),
      api.getInventoryValuation(),
      api.getInventoryLowStock(),
      api.getInventoryOverstock(),
      api.getInventoryMovementReport(12),
      api.getInventoryAging(90),
      api.getInventoryFastSlow(90),
      api.getWarehouses(),
    ])
      .then(([inv, val, low, over, mov, aging, fastSlow, wh]) => {
        setInventoryData(inv)
        setValuationData(val)
        setLowStockData(low)
        setOverstockData(over)
        setMovementData(mov)
        setAgingData(aging)
        setFastSlowData(fastSlow)
        setWarehouses(wh)
      })
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchData()
  }, [warehouseFilter])

  const totalProducts = inventoryData.length
  const totalValue = inventoryData.reduce((s, r) => s + r.stockValue, 0)
  const totalItems = inventoryData.reduce((s, r) => s + r.stockQuantity, 0)
  const lowStockCount = lowStockData.length

  const invColumns: Column[] = [
    { key: "productName", label: t("productName") },
    { key: "sku", label: t("sku") },
    { key: "category", label: t("category") },
    { key: "brand", label: t("brand") },
    { key: "warehouse", label: t("warehouse") },
    { key: "stockQuantity", label: t("stockQuantity"), format: "number" },
    { key: "minStock", label: t("minStock"), format: "number" },
    { key: "maxStock", label: t("maxStock"), format: "number" },
    { key: "reorderPoint", label: t("reorderPoint"), format: "number" },
    { key: "costPrice", label: t("costPrice"), format: "currency" },
    { key: "salePrice", label: t("salePrice"), format: "currency" },
    { key: "stockValue", label: t("stockValue"), format: "currency" },
  ]

  const valuationColumns: Column[] = [
    { key: "category", label: t("category") },
    { key: "productCount", label: t("productCount"), format: "number" },
    { key: "totalStock", label: t("totalStock"), format: "number" },
    { key: "avgCost", label: t("avgCost"), format: "currency" },
    { key: "totalCostValue", label: t("totalCostValue"), format: "currency" },
    { key: "totalSaleValue", label: t("totalSaleValue"), format: "currency" },
    { key: "potentialProfit", label: t("potentialProfit"), format: "currency" },
  ]

  const stockColumns: Column[] = [
    { key: "productName", label: t("productName") },
    { key: "sku", label: t("sku") },
    { key: "stockQuantity", label: t("stockQuantity"), format: "number" },
    { key: "minStock", label: t("minStock"), format: "number" },
    { key: "reorderPoint", label: t("reorderPoint"), format: "number" },
    {
      key: "status",
      label: t("status"),
      renderCell: (value) => (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge(value)}`}
        >
          {t(String(value))}
        </span>
      ),
    },
  ]

  const movementColumns: Column[] = [
    { key: "period", label: t("period") },
    { key: "inbound", label: t("inbound"), format: "number" },
    { key: "outbound", label: t("outbound"), format: "number" },
    { key: "adjustments", label: t("adjustments"), format: "number" },
    { key: "netChange", label: t("netChange"), format: "number" },
  ]

  const agingColumns: Column[] = [
    { key: "productName", label: t("productName") },
    { key: "sku", label: t("sku") },
    { key: "stockQuantity", label: t("stockQuantity"), format: "number" },
    { key: "daysSinceLastMovement", label: t("daysSinceLastMovement"), format: "number" },
    { key: "stockValue", label: t("stockValue"), format: "currency" },
  ]

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("inventory")} />
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-destructive mb-4 text-sm">{error}</p>
          <Button onClick={fetchData}>{t("retry")}</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t("inventory")} />

      <div className="flex items-center gap-4">
        <label className="text-sm font-medium">{t("warehouse")}:</label>
        <select
          value={warehouseFilter}
          onChange={(e) => setWarehouseFilter(e.target.value)}
          className="flex h-9 w-48 rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="all">{t("all")}</option>
          {warehouses.map((wh) => (
            <option key={wh.id} value={wh.id}>
              {wh.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border p-6 space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-20" />
            </div>
          ))
        ) : (
          <>
            <StatCard
              title={t("totalProducts")}
              value={totalProducts}
              icon={<Package className="h-5 w-5" />}
            />
            <StatCard
              title={t("totalValue")}
              value={fmt(totalValue)}
              icon={<TrendingUp className="h-5 w-5" />}
            />
            <StatCard
              title={t("totalItems")}
              value={totalItems}
              icon={<Package className="h-5 w-5" />}
            />
            <StatCard
              title={t("lowStockCount")}
              value={lowStockCount}
              icon={<AlertTriangle className="h-5 w-5" />}
            />
          </>
        )}
      </div>

      <Tabs defaultValue="current-inventory">
        <TabsList>
          <TabsTrigger value="current-inventory">{t("currentInventory")}</TabsTrigger>
          <TabsTrigger value="valuation">{t("valuation")}</TabsTrigger>
          <TabsTrigger value="low-stock">{t("lowStock")}</TabsTrigger>
          <TabsTrigger value="overstock">{t("overstock")}</TabsTrigger>
          <TabsTrigger value="movements">{t("movements")}</TabsTrigger>
          <TabsTrigger value="aging">{t("aging")}</TabsTrigger>
          <TabsTrigger value="fast-slow">{t("fastSlowMoving")}</TabsTrigger>
        </TabsList>

        <TabsContent value="current-inventory" className="space-y-4 pt-4">
          <ReportTable columns={invColumns} data={inventoryData as unknown as Record<string, unknown>[]} loading={loading} />
        </TabsContent>

        <TabsContent value="valuation" className="space-y-4 pt-4">
          <PieChartCard
            title={t("valuationByCategory")}
            data={valuationData as unknown as Record<string, unknown>[]}
            dataKey="totalCostValue"
            nameKey="category"
            loading={loading}
          />
          <ReportTable columns={valuationColumns} data={valuationData as unknown as Record<string, unknown>[]} loading={loading} />
        </TabsContent>

        <TabsContent value="low-stock" className="space-y-4 pt-4">
          <ReportTable columns={stockColumns} data={lowStockData as unknown as Record<string, unknown>[]} loading={loading} />
        </TabsContent>

        <TabsContent value="overstock" className="space-y-4 pt-4">
          <ReportTable columns={stockColumns} data={overstockData as unknown as Record<string, unknown>[]} loading={loading} />
        </TabsContent>

        <TabsContent value="movements" className="space-y-4 pt-4">
          <AreaChartCard
            title={t("movementTrend")}
            data={movementData as unknown as Record<string, unknown>[]}
            dataKeys={{
              xKey: "period",
              areas: [
                { key: "inbound", name: t("inbound") },
                { key: "outbound", name: t("outbound") },
              ],
            }}
            loading={loading}
          />
          <ReportTable columns={movementColumns} data={movementData as unknown as Record<string, unknown>[]} loading={loading} />
        </TabsContent>

        <TabsContent value="aging" className="space-y-4 pt-4">
          <ReportTable columns={agingColumns} data={agingData as unknown as Record<string, unknown>[]} loading={loading} />
        </TabsContent>

        <TabsContent value="fast-slow" className="space-y-4 pt-4">
          <ReportTable columns={agingColumns} data={fastSlowData as unknown as Record<string, unknown>[]} loading={loading} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
