import { useTranslation } from "react-i18next"
import { useEffect, useState, useCallback } from "react"
import { PageHeader } from "@/components/page-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChartCard, PieChartCard } from "../components/report-charts"
import { ReportTable, type Column } from "../components/report-table"
import * as api from "@/lib/tauri"
import type { WarehouseUtilization, WarehouseAdjustmentSummary, InventoryValuation } from "@/types"
import { Warehouse, Package, TrendingUp, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

const currency = (v: number) =>
  v.toLocaleString("en-US", { style: "currency", currency: "USD" })

export function ReportsWarehousesPage() {
  const { t } = useTranslation("reports")

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [utilizationData, setUtilizationData] = useState<WarehouseUtilization[]>([])
  const [adjustmentData, setAdjustmentData] = useState<WarehouseAdjustmentSummary[]>([])
  const [stockDistribution, setStockDistribution] = useState<Record<number, InventoryValuation[]>>({})
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | null>(null)

  const fetchData = useCallback(() => {
    setLoading(true)
    setError(null)

    Promise.all([
      api.getWarehouseUtilization(),
      api.getWarehouseAdjustments(),
    ])
      .then(([util, adj]) => {
        setUtilizationData(util)
        setAdjustmentData(adj)
      })
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const fetchStockDistribution = useCallback(async (warehouseId: number) => {
    if (stockDistribution[warehouseId]) return
    try {
      const data = await api.getWarehouseStockDistribution(warehouseId)
      setStockDistribution((prev) => ({ ...prev, [warehouseId]: data }))
    } catch {
      // silently fail
    }
  }, [stockDistribution])

  const handleWarehouseChange = (warehouseId: number) => {
    setSelectedWarehouse(warehouseId)
    fetchStockDistribution(warehouseId)
  }

  const utilizationColumns: Column[] = [
    { key: "warehouseName", label: t("warehouseName") },
    { key: "productCount", label: t("productCount"), format: "number" },
    { key: "totalStock", label: t("totalStock"), format: "number" },
    { key: "stockValue", label: t("stockValue"), format: "currency" },
    { key: "locationCount", label: t("locationCount"), format: "number" },
    { key: "utilizationPct", label: t("utilizationPct"), format: "percent" },
  ]

  const adjustmentColumns: Column[] = [
    { key: "warehouseName", label: t("warehouseName") },
    { key: "adjustmentCount", label: t("adjustmentCount"), format: "number" },
    { key: "totalAdjusted", label: t("totalAdjusted"), format: "number" },
    { key: "positiveAdjustments", label: t("positiveAdjustments"), format: "number" },
    { key: "negativeAdjustments", label: t("negativeAdjustments"), format: "number" },
  ]

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("warehouses")} description={t("warehousesDescription")} />
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-destructive mb-4 text-sm">{error}</p>
          <Button onClick={fetchData}>{t("retry")}</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t("warehouses")} description={t("warehousesDescription")} />

      <Tabs defaultValue="utilization">
        <TabsList className="flex-wrap">
          <TabsTrigger value="utilization">{t("utilization")}</TabsTrigger>
          <TabsTrigger value="adjustments">{t("adjustments")}</TabsTrigger>
        </TabsList>

        <TabsContent value="utilization" className="space-y-4">
          <BarChartCard
            title={t("warehouseUtilization")}
            data={utilizationData as unknown as Record<string, unknown>[]}
            dataKeys={{
              xKey: "warehouseName",
              bars: [
                { key: "utilizationPct", name: t("utilizationPct") },
                { key: "stockValue", name: t("stockValue") },
              ],
            }}
            loading={loading}
          />
          <ReportTable columns={utilizationColumns} data={utilizationData as unknown as Record<string, unknown>[]} loading={loading} />

          {utilizationData.length > 0 && (
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium">{t("warehouse")}:</label>
                <select
                  value={selectedWarehouse ?? ""}
                  onChange={(e) => handleWarehouseChange(Number(e.target.value))}
                  className="flex h-9 w-64 rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="" disabled>{t("selectWarehouse")}</option>
                  {utilizationData.map((wh) => (
                    <option key={wh.warehouseId} value={wh.warehouseId}>
                      {wh.warehouseName}
                    </option>
                  ))}
                </select>
              </div>

              {selectedWarehouse && (
                <PieChartCard
                  title={t("stockDistribution")}
                  data={(stockDistribution[selectedWarehouse] ?? []) as unknown as Record<string, unknown>[]}
                  dataKey="totalCostValue"
                  nameKey="category"
                  loading={!stockDistribution[selectedWarehouse]}
                />
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="adjustments" className="space-y-4">
          <BarChartCard
            title={t("warehouseAdjustments")}
            data={adjustmentData as unknown as Record<string, unknown>[]}
            dataKeys={{
              xKey: "warehouseName",
              bars: [
                { key: "positiveAdjustments", name: t("positiveAdjustments") },
                { key: "negativeAdjustments", name: t("negativeAdjustments") },
              ],
            }}
            loading={loading}
          />
          <ReportTable columns={adjustmentColumns} data={adjustmentData as unknown as Record<string, unknown>[]} loading={loading} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
