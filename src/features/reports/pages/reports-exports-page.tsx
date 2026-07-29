import { useTranslation } from "react-i18next"
import { useEffect, useState } from "react"
import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { ReportTable, type Column } from "../components/report-table"
import * as api from "@/lib/tauri"
import type { ReportHistoryEntry, ReportTemplate } from "@/types"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Clock, Database, Download, RefreshCw } from "lucide-react"

export function ReportsExportsPage() {
  const { t } = useTranslation("reports")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<ReportHistoryEntry[]>([])
  const [templates, setTemplates] = useState<ReportTemplate[]>([])

  const fetchData = () => {
    setLoading(true)
    setError(null)
    Promise.all([
      api.getReportHistory(50),
      api.getReportTemplates(),
    ])
      .then(([h, tmpl]) => {
        setHistory(h)
        setTemplates(tmpl)
      })
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchData()
  }, [])

  const totalExports = history.length
  const avgExecMs = history.length > 0
    ? Math.round(history.reduce((s, r) => s + r.executionTimeMs, 0) / history.length)
    : 0
  const totalRows = history.reduce((s, r) => s + r.rowCount, 0)

  const historyColumns: Column[] = [
    { key: "reportName", label: t("reportName") },
    { key: "module", label: t("module") },
    { key: "exportFormat", label: t("format") },
    { key: "executionTimeMs", label: t("executionTime"), format: "number" },
    { key: "rowCount", label: t("rowCount"), format: "number" },
    { key: "generatedByName", label: t("generatedBy") },
    { key: "createdAt", label: t("date") },
  ]

  const fmtMs = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("exports")} description={t("exportsDescription")} />
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-destructive mb-4 text-sm">{error}</p>
          <Button onClick={fetchData}>{t("retry")}</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t("exports")} description={t("exportsDescription")} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border p-6 space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-20" />
            </div>
          ))
        ) : (
          <>
            <StatCard
              title={t("totalExports")}
              value={totalExports}
              icon={<FileText className="h-5 w-5" />}
            />
            <StatCard
              title={t("avgExecutionTime")}
              value={fmtMs(avgExecMs)}
              icon={<Clock className="h-5 w-5" />}
            />
            <StatCard
              title={t("totalRowsExported")}
              value={totalRows.toLocaleString("en-US")}
              icon={<Database className="h-5 w-5" />}
            />
          </>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">{t("exportTemplates")}</h2>
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-3 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-sm text-muted-foreground">
            <Download className="mb-2 h-8 w-8" />
            {t("noTemplates")}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((tmpl) => (
              <Card key={tmpl.id} className="transition-shadow hover:shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    {tmpl.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-2 text-xs text-muted-foreground line-clamp-2">
                    {tmpl.description ?? t("noDescription")}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs capitalize text-muted-foreground">{tmpl.module}</span>
                    <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                      <Download className="h-3 w-3" />
                      {t("use")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">{t("exportHistory")}</h2>
        <ReportTable columns={historyColumns} data={history as unknown as Record<string, unknown>[]} loading={loading} />
      </div>
    </div>
  )
}
