import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { RotateCcw, AlertTriangle, History } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { getRestoreHistory } from "@/lib/tauri"
import type { RestoreRecord } from "@/types"

export function AdminRestorePage() {
  const { t } = useTranslation()
  const [restores, setRestores] = useState<RestoreRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getRestoreHistory().then(setRestores).finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("admin.restore.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("admin.restore.description")}</p>
      </div>

      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
        <CardContent className="flex items-start gap-3 p-4">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">{t("admin.restore.warning")}</p>
            <p className="text-xs text-amber-600 dark:text-amber-400">{t("admin.restore.confirmRestore")}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-4 w-4" /> Restore History
          </CardTitle>
          <Button disabled>
            <RotateCcw className="mr-2 h-4 w-4" /> {t("admin.restore.complete")}
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : restores.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No restore operations found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">File</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("admin.backups.status")}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Tables Restored</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Error</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {restores.map((r) => (
                    <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-sm">{r.fileName}</td>
                      <td className="px-4 py-3 text-sm capitalize">{r.restoreType}</td>
                      <td className="px-4 py-3">
                        <Badge variant={r.status === "completed" ? "success" : r.status === "failed" ? "destructive" : "secondary"}>{r.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{r.tablesRestored || "-"}</td>
                      <td className="px-4 py-3 text-sm text-red-500 max-w-[200px] truncate">{r.errorMessage || "-"}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{r.createdAt}</td>
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