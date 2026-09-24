import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Activity, CheckCircle2, AlertTriangle, XCircle, Play, History } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { runDiagnostics, getDiagnosticHistory, getDiagnosticSummary } from "@/lib/tauri"
import type { DiagnosticCheck, DiagnosticReport } from "@/types"

const statusIcon = (status: string) => {
  switch (status) {
    case "healthy": return <CheckCircle2 className="h-4 w-4 text-green-500" />
    case "warning": return <AlertTriangle className="h-4 w-4 text-amber-500" />
    case "critical": return <XCircle className="h-4 w-4 text-red-500" />
    default: return <Activity className="h-4 w-4 text-gray-400" />
  }
}

export function AdminDiagnosticsPage() {
  const { t } = useTranslation()
  const [checks, setChecks] = useState<DiagnosticCheck[]>([])
  const [history, setHistory] = useState<DiagnosticReport[]>([])
  const [summary, setSummary] = useState<{ healthy: number; warning: number; critical: number; total: number; last_report?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)

  const loadData = () => {
    setLoading(true)
    Promise.all([getDiagnosticHistory(), getDiagnosticSummary()]).then(([h, s]) => {
      setHistory(h)
      setSummary(s)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [])

  const handleRun = async () => {
    setRunning(true)
    try {
      const result = await runDiagnostics()
      setChecks(result)
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("admin.diagnostics.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("admin.diagnostics.description")}</p>
        </div>
        <Button onClick={handleRun} disabled={running}>
          <Play className="mr-2 h-4 w-4" /> {running ? t("admin.diagnostics.running") : t("admin.diagnostics.runAll")}
        </Button>
      </div>

      {summary && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <Card><CardContent className="p-4 flex items-center gap-3">
            <Activity className="h-8 w-8 text-primary" />
            <div><p className="text-xs text-muted-foreground">{t("admin.diagnostics.total")}</p><p className="text-lg font-bold">{summary.total}</p></div>
          </CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
            <div><p className="text-xs text-muted-foreground">{t("admin.diagnostics.healthy")}</p><p className="text-lg font-bold">{summary.healthy}</p></div>
          </CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-amber-500" />
            <div><p className="text-xs text-muted-foreground">{t("admin.diagnostics.warning")}</p><p className="text-lg font-bold">{summary.warning}</p></div>
          </CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3">
            <XCircle className="h-8 w-8 text-red-500" />
            <div><p className="text-xs text-muted-foreground">{t("admin.diagnostics.critical")}</p><p className="text-lg font-bold">{summary.critical}</p></div>
          </CardContent></Card>
        </div>
      )}

      {checks.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">{t("admin.diagnostics.latestResults")}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {checks.map((check) => (
              <div key={check.name} className="flex items-start gap-3 p-3 rounded-lg border">
                {statusIcon(check.status)}
                <div className="flex-1">
                  <p className="text-sm font-medium">{check.name}</p>
                  <p className="text-xs text-muted-foreground">{check.message}</p>
                  {check.details && <p className="text-xs text-muted-foreground mt-1">{check.details}</p>}
                </div>
                <Badge variant={check.status === "healthy" ? "success" : check.status === "warning" ? "warning" : "destructive"}>
                  {check.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2"><History className="h-4 w-4" /> {t("admin.diagnostics.history")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">{[1,2,3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : history.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">{t("admin.diagnostics.noChecksRun")}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("admin.diagnostics.type")}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("admin.backups.status")}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("admin.diagnostics.summary")}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("admin.diagnostics.issues")}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("admin.diagnostics.date")}</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((report) => (
                    <tr key={report.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-sm capitalize">{report.reportType}</td>
                      <td className="px-4 py-3">
                        <Badge variant={report.status === "healthy" ? "success" : report.status === "warning" ? "warning" : "destructive"}>
                          {report.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm">{report.summary || "-"}</td>
                      <td className="px-4 py-3 text-sm">{report.issuesFound}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{report.createdAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}