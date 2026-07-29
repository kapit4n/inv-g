import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Database, Table2, CheckCircle2, AlertTriangle, Wrench, Activity, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { getDatabaseStats, getTableSizes, vacuumDatabase, optimizeDatabase, checkDatabaseIntegrity, reindexDatabase } from "@/lib/tauri"
import type { DatabaseStats, TableInfo } from "@/types"

export function AdminDatabasePage() {
  const { t } = useTranslation()
  const [stats, setStats] = useState<DatabaseStats | null>(null)
  const [tables, setTables] = useState<TableInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<string | null>(null)

  const loadData = () => {
    setLoading(true)
    Promise.all([getDatabaseStats(), getTableSizes()]).then(([s, ts]) => {
      setStats(s)
      setTables(ts)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [])

  const handleAction = async (action: () => Promise<string>) => {
    setResult(null)
    try {
      const msg = await action()
      setResult(msg)
    } catch (e) {
      setResult(String(e))
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes > 1_048_576) return `${(bytes / 1_048_576).toFixed(2)} MB`
    if (bytes > 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${bytes} B`
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("admin.database.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("admin.database.description")}</p>
      </div>

      {result && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
          <CardContent className="p-4 text-sm">{result}</CardContent>
        </Card>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Card key={i}><CardContent className="p-6"><Skeleton className="h-16 w-full" /></CardContent></Card>)}
        </div>
      ) : stats && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Database className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">{t("admin.database.totalSize")}</p>
                  <p className="text-lg font-bold">{formatBytes(stats.totalSize)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Table2 className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-xs text-muted-foreground">{t("admin.database.tableCount")}</p>
                  <p className="text-lg font-bold">{stats.tableCount}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Activity className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-xs text-muted-foreground">{t("admin.database.indexSize")}</p>
                  <p className="text-lg font-bold">{stats.indexCount}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <CheckCircle2 className={`h-8 w-8 ${stats.integrityOk ? "text-green-500" : "text-red-500"}`} />
                <div>
                  <p className="text-xs text-muted-foreground">Integrity</p>
                  <Badge variant={stats.integrityOk ? "success" : "destructive"}>{stats.integrityOk ? "OK" : "Issues"}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">{t("admin.database.stats")}</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Page Size</span><span>{stats.pageSize} bytes</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Page Count</span><span>{stats.pageCount}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Freelist Count</span><span>{stats.freelistCount}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Schema Version</span><span>{stats.schemaVersion}</span></div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Maintenance Actions</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start" onClick={() => handleAction(vacuumDatabase)}>
                  <Wrench className="mr-2 h-4 w-4" /> {t("admin.database.runVacuum")}
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => handleAction(optimizeDatabase)}>
                  <RefreshCw className="mr-2 h-4 w-4" /> {t("admin.database.runOptimize")}
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => handleAction(checkDatabaseIntegrity)}>
                  <Activity className="mr-2 h-4 w-4" /> {t("admin.database.runIntegrityCheck")}
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => handleAction(reindexDatabase)}>
                  <RefreshCw className="mr-2 h-4 w-4" /> Reindex Database
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">{t("admin.database.tableSizes")}</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("admin.database.tableName")}</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">{t("admin.database.rows")}</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">{t("admin.database.size")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tables.map((table) => (
                      <tr key={table.name} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 text-sm">{table.name}</td>
                        <td className="px-4 py-3 text-right text-sm">{table.rowCount}</td>
                        <td className="px-4 py-3 text-right text-sm">{formatBytes(table.pageCount * 4096)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}