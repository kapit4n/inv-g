import { useTranslation } from "react-i18next"
import { useEffect, useState } from "react"
import { PageHeader } from "@/components/page-header"
import * as api from "@/lib/tauri"
import type { KpiValue, KpiDefinition } from "@/types"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const STATUS_DOT: Record<string, string> = {
  good: "bg-green-500",
  warning: "bg-yellow-500",
  critical: "bg-red-500",
}

function statusDotClass(status: string): string {
  return STATUS_DOT[status] ?? "bg-gray-400"
}

function formatKpiValue(value: number, unit?: string): string {
  if (unit === "%") return `${value.toFixed(1)}%`
  if (unit === "currency" || unit === "USD") {
    return value.toLocaleString("en-US", { style: "currency", currency: "USD" })
  }
  if (unit === "days") return `${value} ${unit}`
  return value.toLocaleString("en-US")
}

function KpiCard({ kpi, def: _def }: { kpi: KpiValue; def?: KpiDefinition }) {
  const { t } = useTranslation("reports")
  const target = _def?.target ?? kpi.target
  const hasTarget = target !== undefined && target !== null
  const diff = hasTarget ? ((kpi.value - target) / target) * 100 : null

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{_def?.name ?? kpi.name}</CardTitle>
        <span className={cn("h-2.5 w-2.5 rounded-full", statusDotClass(kpi.status))} />
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold tracking-tight">
            {formatKpiValue(kpi.value, kpi.unit ?? _def?.unit)}
          </span>
          {(kpi.unit ?? _def?.unit) && (
            <span className="text-sm text-muted-foreground">{kpi.unit ?? _def?.unit}</span>
          )}
        </div>
        {hasTarget && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{t("target")}: {formatKpiValue(target, kpi.unit ?? _def?.unit)}</span>
            {diff !== null && (
              <span className={cn(diff >= 0 ? "text-emerald-600" : "text-red-600")}>
                {diff >= 0 ? "+" : ""}{diff.toFixed(1)}%
              </span>
            )}
          </div>
        )}
        {kpi.trend && (
          <p className="text-xs text-muted-foreground capitalize">
            {t("trend")}: {kpi.trend}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function KpiSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-3 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function ReportsKpiPage() {
  const { t } = useTranslation("reports")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [kpis, setKpis] = useState<KpiValue[]>([])
  const [defs, setDefs] = useState<KpiDefinition[]>([])

  const fetchData = () => {
    setLoading(true)
    setError(null)
    Promise.all([api.getKpiValues(), api.getKpiDefinitions()])
      .then(([vals, defs_]) => {
        setKpis(vals)
        setDefs(defs_)
      })
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchData()
  }, [])

  const defMap = new Map(defs.map((d) => [d.key, d]))

  const grouped = kpis.reduce<Record<string, KpiValue[]>>((acc, kpi) => {
    const cat = kpi.category || "other"
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(kpi)
    return acc
  }, {})

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("kpiDashboard")} description={t("kpiDashboardDescription")} />
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-destructive mb-4 text-sm">{error}</p>
          <Button onClick={fetchData}>{t("retry")}</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t("kpiDashboard")} description={t("kpiDashboardDescription")} />

      {loading ? (
        <KpiSkeleton />
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <h2 className="mb-4 text-lg font-semibold tracking-tight capitalize">{t(category)}</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((kpi) => (
                  <KpiCard key={kpi.key} kpi={kpi} def={defMap.get(kpi.key)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
