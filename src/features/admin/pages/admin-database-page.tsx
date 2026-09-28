import { useCallback, useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { AlertTriangle, Database, RotateCcw, Table2, CheckCircle2, Wrench, Activity, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog"
import { PermissionGuard } from "@/components/permission-guard"
import { getDatabaseStats, getTableSizes, vacuumDatabase, optimizeDatabase, checkDatabaseIntegrity, reindexDatabase, getInitialDataResetPreview, resetToInitialData } from "@/lib/tauri"
import { useNotification } from "@/hooks"
import { useAuthStore } from "@/stores"
import { INITIAL_DATA_CONFIRM_TEXT, type DatabaseStats, type TableInfo, type InitialDataPreview, type InitialDataResetResult } from "@/types"

export function AdminDatabasePage() {
  const { t } = useTranslation()
  const notify = useNotification()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const clearSession = useAuthStore((s) => s.clearSession)
  const [stats, setStats] = useState<DatabaseStats | null>(null)
  const [tables, setTables] = useState<TableInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<string | null>(null)

  const [preview, setPreview] = useState<InitialDataPreview | null>(null)
  const [confirm, setConfirm] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [running, setRunning] = useState(false)
  const [resetResult, setResetResult] = useState<InitialDataResetResult | null>(null)

  const loadData = () => {
    setLoading(true)
    Promise.all([getDatabaseStats(), getTableSizes()]).then(([s, ts]) => {
      setStats(s)
      setTables(ts)
    }).finally(() => setLoading(false))
  }

  const loadPreview = useCallback(() => {
    getInitialDataResetPreview()
      .then(setPreview)
      .catch(() => setPreview(null))
  }, [])

  useEffect(() => { loadData() }, [])
  useEffect(() => { loadPreview() }, [loadPreview])

  const handleAction = async (action: () => Promise<string>) => {
    setResult(null)
    try {
      const msg = await action()
      setResult(msg)
    } catch (e) {
      setResult(String(e))
    }
  }

  const canConfirm = confirm === INITIAL_DATA_CONFIRM_TEXT && !running

  const handleConfirmReset = async () => {
    setRunning(true)
    try {
      const res = await resetToInitialData(confirm, user?.id)
      setResetResult(res)
      setDialogOpen(false)
      setConfirm("")
      setPreview(null)
      notify.success(t("admin.initialData.success"))
      // The reset wiped every user and its session; the in-memory auth state is
      // no longer valid, so the operator is sent back to the login screen.
      setTimeout(() => {
        queryClient.clear()
        clearSession()
        navigate("/login")
      }, 1500)
    } catch (e) {
      notify.error(t("admin.initialData.error") + (e ? `: ${String(e)}` : ""))
    } finally {
      setRunning(false)
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
                  <p className="text-xs text-muted-foreground">{t("admin.database.integrity")}</p>
                  <Badge variant={stats.integrityOk ? "success" : "destructive"}>{stats.integrityOk ? t("admin.database.ok") : t("admin.diagnostics.issues")}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">{t("admin.database.stats")}</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t("admin.database.pageSize")}</span><span>{stats.pageSize} bytes</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t("admin.database.pageCount")}</span><span>{stats.pageCount}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t("admin.database.freelistCount")}</span><span>{stats.freelistCount}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t("admin.database.schemaVersion")}</span><span>{stats.schemaVersion}</span></div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">{t("admin.database.maintenanceActions")}</CardTitle></CardHeader>
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
                  <RefreshCw className="mr-2 h-4 w-4" /> {t("admin.database.reindex")}
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

          <PermissionGuard permission="admin.database.manage">
            <Card className="border-destructive/40">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-destructive">
                  <RotateCcw className="h-4 w-4" /> {t("admin.initialData.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                  <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">{t("admin.initialData.warning")}</p>
                    <p className="text-muted-foreground">{t("admin.initialData.warningHint")}</p>
                  </div>
                </div>

                {resetResult ? (
                  <div className="space-y-2 text-sm">
                    <p className="font-medium text-green-600">{t("admin.initialData.completed")}</p>
                    <div className="flex justify-between"><span className="text-muted-foreground">{t("admin.initialData.backupFile")}</span><span className="font-medium">{resetResult.backupFile}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">{t("admin.initialData.deletedRows")}</span><span className="font-medium">{resetResult.deletedRows}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">{t("admin.initialData.usersRestored")}</span><span className="font-medium">{resetResult.usersRestored}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">{t("admin.initialData.productsRestored")}</span><span className="font-medium">{resetResult.productsRestored}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">{t("admin.initialData.warehousesRestored")}</span><span className="font-medium">{resetResult.warehousesRestored}</span></div>
                    <p className="pt-1 text-muted-foreground">{t("admin.initialData.loggedOutHint")}</p>
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="mb-2 text-sm font-medium">{t("admin.initialData.willReset")}</p>
                      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        {(() => {
                          const rows: Array<[string, number | undefined]> = preview ? [
                            [t("admin.initialData.users"), preview.users],
                            [t("admin.initialData.roles"), preview.roles],
                            [t("admin.initialData.permissions"), preview.permissions],
                            [t("admin.initialData.products"), preview.products],
                            [t("admin.initialData.warehouses"), preview.warehouses],
                            [t("admin.initialData.customers"), preview.customers],
                            [t("admin.initialData.sales"), preview.sales],
                            [t("admin.initialData.purchaseOrders"), preview.purchaseOrders],
                            [t("admin.initialData.quotes"), preview.quotes],
                            [t("admin.initialData.inventoryMovements"), preview.inventoryMovements],
                          ] : []
                          return rows.map(([label, value]) => (
                            <div key={label} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                              <span className="text-muted-foreground">{label}</span>
                              <span className="font-medium">{value ?? "-"}</span>
                            </div>
                          ))
                        })()}
                      </div>
                      {preview && (
                        <p className="mt-2 text-sm text-muted-foreground">{t("admin.initialData.backupInfo", { count: preview.backupCount })}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="restore-confirm">{t("admin.initialData.confirmLabel")}</Label>
                      <Input
                        id="restore-confirm"
                        value={confirm}
                        autoCapitalize="off"
                        autoCorrect="off"
                        autoComplete="off"
                        onChange={(e) => setConfirm(e.target.value)}
                        className="max-w-xs"
                      />
                    </div>
                    <Button variant="destructive" disabled={!canConfirm} onClick={() => setDialogOpen(true)}>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      {running ? t("admin.initialData.running") : t("admin.initialData.action")}
                    </Button>
                    <Button variant="outline" size="sm" onClick={loadPreview} className="ml-2">
                      <RefreshCw className="mr-2 h-4 w-4" /> {t("admin.initialData.refresh")}
                    </Button>
                  </>
                )}

                <ConfirmDialog
                  open={dialogOpen}
                  onOpenChange={setDialogOpen}
                  title={t("admin.initialData.dialogTitle")}
                  description={t("admin.initialData.dialogDescription")}
                  confirmLabel={t("admin.initialData.action")}
                  variant="destructive"
                  loading={running}
                  onConfirm={handleConfirmReset}
                />
              </CardContent>
            </Card>
          </PermissionGuard>
        </>
      )}
    </div>
  )
}