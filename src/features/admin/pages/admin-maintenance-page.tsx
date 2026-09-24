import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Trash2, RefreshCw, Wrench, Database, Search, History } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { getMaintenanceLogs, runMaintenance } from "@/lib/tauri"
import type { MaintenanceLog } from "@/types"

const operations = [
  { key: "clear_cache", label: "admin.maintenance.clearCache", icon: Trash2, description: "admin.maintenance.clearCache.description" },
  { key: "optimize_database", label: "admin.maintenance.optimizeDatabase", icon: RefreshCw, description: "admin.maintenance.optimizeDatabase.description" },
  { key: "clean_logs", label: "admin.maintenance.cleanLogs", icon: Trash2, description: "admin.maintenance.cleanLogs.description" },
  { key: "vacuum", label: "admin.maintenance.vacuum", icon: Database, description: "admin.maintenance.vacuum.description" },
  { key: "reindex", label: "admin.maintenance.reindex", icon: Search, description: "admin.maintenance.reindex.description" },
  { key: "integrity_check", label: "admin.maintenance.integrityCheck", icon: Wrench, description: "admin.maintenance.integrityCheck.description" },
]

export function AdminMaintenancePage() {
  const { t } = useTranslation()
  const [logs, setLogs] = useState<MaintenanceLog[]>([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState<string | null>(null)

  const loadLogs = () => {
    setLoading(true)
    getMaintenanceLogs().then(setLogs).finally(() => setLoading(false))
  }

  useEffect(() => { loadLogs() }, [])

  const handleRun = async (operation: string) => {
    setRunning(operation)
    try {
      await runMaintenance(operation, 1)
      loadLogs()
    } finally {
      setRunning(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("admin.maintenance.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("admin.maintenance.description")}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {operations.map((op) => (
          <Card key={op.key}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <op.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{t(op.label as any) || op.label}</p>
                    <p className="text-xs text-muted-foreground">{t(op.description as any) || op.description}</p>
                  </div>
                </div>
              </div>
              <Button
                className="w-full mt-3"
                variant="outline"
                size="sm"
                onClick={() => handleRun(op.key)}
                disabled={running === op.key}
              >
                {running === op.key ? t("admin.maintenance.running") : t("admin.maintenance.runNow")}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2"><History className="h-4 w-4" /> {t("admin.maintenance.history")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">{[1,2,3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">{t("admin.maintenance.noLogs")}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("admin.maintenance.operation")}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("admin.backups.status")}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("admin.audit.details")}</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">{t("admin.maintenance.duration")}</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">{t("admin.database.rows")}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("admin.maintenance.date")}</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium">{log.operation}</td>
                      <td className="px-4 py-3">
                        <Badge variant={log.status === "completed" ? "success" : log.status === "failed" ? "destructive" : "warning"}>
                          {log.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground max-w-[200px] truncate">{log.details || "-"}</td>
                      <td className="px-4 py-3 text-right text-sm">{log.durationMs}ms</td>
                      <td className="px-4 py-3 text-right text-sm">{log.affectedRows}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{log.createdAt}</td>
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