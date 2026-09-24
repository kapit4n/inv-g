import { useTranslation } from "react-i18next"
import { useEffect, useState, useCallback } from "react"
import { PageHeader } from "@/components/page-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LineChartCard, AreaChartCard, BarChartCard, PieChartCard } from "../components/report-charts"
import { ReportTable, type Column } from "../components/report-table"
import * as api from "@/lib/tauri"
import type { ProfitSummary, ProfitByEntity } from "@/types"
import { DollarSign, TrendingUp, Percent } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"

const gridCols = "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"

function SummarySkeleton() {
  return (
    <div className="space-y-4">
      <div className={gridCols}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border p-6 space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>
      <Skeleton className="h-[300px] w-full rounded-xl" />
      <Skeleton className="h-[300px] w-full rounded-xl" />
    </div>
  )
}

const currencyCol: Pick<Column, "format"> = { format: "currency" }
const pctCol: Pick<Column, "format"> = { format: "percent" }
const numCol: Pick<Column, "format"> = { format: "number" }

export function ReportsProfitabilityPage() {
  const { t } = useTranslation("reports")

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [summary, setSummary] = useState<ProfitSummary[]>([])
  const [byProduct, setByProduct] = useState<ProfitByEntity[]>([])
  const [byCategory, setByCategory] = useState<ProfitByEntity[]>([])
  const [bySupplier, setBySupplier] = useState<ProfitByEntity[]>([])
  const [byBrand, setByBrand] = useState<ProfitByEntity[]>([])
  const [byCustomer, setByCustomer] = useState<ProfitByEntity[]>([])
  const [byWarehouse, setByWarehouse] = useState<ProfitByEntity[]>([])

  const fetchAll = useCallback(() => {
    setLoading(true)
    setError(null)
    Promise.all([
      api.getProfitSummary(12),
      api.getProfitByProduct(20),
      api.getProfitByCategory(),
      api.getProfitBySupplier(),
      api.getProfitByBrand(),
      api.getProfitByCustomer(20),
      api.getProfitByWarehouse(),
    ])
      .then(([s, pp, pc, ps, pb, pcu, pw]) => {
        setSummary(s)
        setByProduct(pp)
        setByCategory(pc)
        setBySupplier(ps)
        setByBrand(pb)
        setByCustomer(pcu)
        setByWarehouse(pw)
      })
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const profitEntityColumns: Column[] = [
    { key: "entityName", label: t("entity") },
    { key: "revenue", label: t("revenue"), ...currencyCol },
    { key: "cost", label: t("cost"), ...currencyCol },
    { key: "profit", label: t("profit"), ...currencyCol },
    { key: "margin", label: t("margin"), ...pctCol },
    { key: "quantity", label: t("quantity"), ...numCol },
  ]

  const summaryColumns: Column[] = [
    { key: "period", label: t("period") },
    { key: "grossRevenue", label: t("revenue"), ...currencyCol },
    { key: "estimatedCost", label: t("cost"), ...currencyCol },
    { key: "grossProfit", label: t("profit"), ...currencyCol },
    { key: "marginPct", label: t("margin"), ...pctCol },
  ]

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("profitability")} description={t("profitabilityDescription")} />
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-destructive mb-4 text-sm">{error}</p>
          <Button onClick={fetchAll}>{t("retry")}</Button>
        </div>
      </div>
    )
  }

  const latest = summary.length > 0 ? summary[summary.length - 1] : null

  return (
    <div className="space-y-6">
      <PageHeader title={t("profitability")} description={t("profitabilityDescription")} />

      {loading ? (
        <div className={gridCols}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border p-6 space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>
      ) : (
        <div className={gridCols}>
          <div className="rounded-xl border p-6 space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{t("totalRevenue")}</p>
            <p className="text-2xl font-bold tracking-tight">
              {latest?.grossRevenue.toLocaleString("en-US", { style: "currency", currency: "USD" }) ?? "-"}
            </p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <DollarSign className="h-3 w-3" />
              <span>{t("last12Months")}</span>
            </div>
          </div>
          <div className="rounded-xl border p-6 space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{t("totalCost")}</p>
            <p className="text-2xl font-bold tracking-tight">
              {latest?.estimatedCost.toLocaleString("en-US", { style: "currency", currency: "USD" }) ?? "-"}
            </p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              <span>{t("last12Months")}</span>
            </div>
          </div>
          <div className="rounded-xl border p-6 space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{t("grossProfit")}</p>
            <p className="text-2xl font-bold tracking-tight text-emerald-600">
              {latest?.grossProfit.toLocaleString("en-US", { style: "currency", currency: "USD" }) ?? "-"}
            </p>
            <div className="flex items-center gap-1 text-xs text-emerald-600">
              <TrendingUp className="h-3 w-3" />
              <span>{t("last12Months")}</span>
            </div>
          </div>
          <div className="rounded-xl border p-6 space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{t("margin")}</p>
            <p className="text-2xl font-bold tracking-tight">
              {latest ? `${(latest.marginPct * 100).toFixed(1)}%` : "-"}
            </p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Percent className="h-3 w-3" />
              <span>{t("last12Months")}</span>
            </div>
          </div>
        </div>
      )}

      <Tabs defaultValue="summary">
        <TabsList className="flex-wrap">
          <TabsTrigger value="summary">{t("summary")}</TabsTrigger>
          <TabsTrigger value="by-product">{t("byProduct")}</TabsTrigger>
          <TabsTrigger value="by-category">{t("byCategory")}</TabsTrigger>
          <TabsTrigger value="by-supplier">{t("bySupplier")}</TabsTrigger>
          <TabsTrigger value="by-brand">{t("byBrand")}</TabsTrigger>
          <TabsTrigger value="by-customer">{t("byCustomer")}</TabsTrigger>
          <TabsTrigger value="by-warehouse">{t("byWarehouse")}</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-4 pt-4">
          {loading ? (
            <SummarySkeleton />
          ) : (
            <>
              <LineChartCard
                title={t("profitTrend")}
                data={summary as unknown as Record<string, unknown>[]}
                dataKeys={{
                  xKey: "period",
                  lines: [
                    { key: "grossRevenue", name: t("revenue") },
                    { key: "estimatedCost", name: t("cost") },
                    { key: "grossProfit", name: t("profit") },
                  ],
                }}
                loading={loading}
              />
              <AreaChartCard
                title={t("marginTrend")}
                data={summary as unknown as Record<string, unknown>[]}
                dataKeys={{
                  xKey: "period",
                  areas: [{ key: "marginPct", name: t("margin") }],
                }}
                loading={loading}
              />
              <ReportTable columns={summaryColumns} data={summary as unknown as Record<string, unknown>[]} loading={loading} />
            </>
          )}
        </TabsContent>

        <TabsContent value="by-product" className="space-y-4 pt-4">
          <BarChartCard
            title={t("profitByProduct")}
            data={byProduct as unknown as Record<string, unknown>[]}
            dataKeys={{
              xKey: "entityName",
              bars: [{ key: "profit", name: t("profit") }],
            }}
            loading={loading}
          />
          <ReportTable columns={profitEntityColumns} data={byProduct as unknown as Record<string, unknown>[]} loading={loading} />
        </TabsContent>

        <TabsContent value="by-category" className="space-y-4 pt-4">
          <PieChartCard
            title={t("profitByCategory")}
            data={byCategory as unknown as Record<string, unknown>[]}
            dataKey="profit"
            nameKey="entityName"
            loading={loading}
          />
          <ReportTable columns={profitEntityColumns} data={byCategory as unknown as Record<string, unknown>[]} loading={loading} />
        </TabsContent>

        <TabsContent value="by-supplier" className="space-y-4 pt-4">
          <ReportTable columns={profitEntityColumns} data={bySupplier as unknown as Record<string, unknown>[]} loading={loading} />
        </TabsContent>

        <TabsContent value="by-brand" className="space-y-4 pt-4">
          <BarChartCard
            title={t("profitByBrand")}
            data={byBrand as unknown as Record<string, unknown>[]}
            dataKeys={{
              xKey: "entityName",
              bars: [{ key: "profit", name: t("profit") }],
            }}
            loading={loading}
          />
          <ReportTable columns={profitEntityColumns} data={byBrand as unknown as Record<string, unknown>[]} loading={loading} />
        </TabsContent>

        <TabsContent value="by-customer" className="space-y-4 pt-4">
          <ReportTable columns={profitEntityColumns} data={byCustomer as unknown as Record<string, unknown>[]} loading={loading} />
        </TabsContent>

        <TabsContent value="by-warehouse" className="space-y-4 pt-4">
          <ReportTable columns={profitEntityColumns} data={byWarehouse as unknown as Record<string, unknown>[]} loading={loading} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
