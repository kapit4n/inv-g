import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { RotateCcw, AlertTriangle, History, ShieldCheck, HardDrive, CalendarDays } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog"
import { useNotification } from "@/hooks"
import { getRestoreHistory, getBackupHistory, verifyBackup, restoreBackup } from "@/lib/tauri"
import type { BackupRecord, RestoreRecord, BackupValidation } from "@/types"

export function AdminRestorePage() {
  const { t } = useTranslation()
  const notify = useNotification()
  const [restores, setRestores] = useState<RestoreRecord[]>([])
  const [backups, setBackups] = useState<BackupRecord[]>([])
  const [selectedId, setSelectedId] = useState<string>("")
  const [validation, setValidation] = useState<BackupValidation | null>(null)
  const [validating, setValidating] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadData = () => {
    setLoading(true)
    Promise.all([getRestoreHistory(), getBackupHistory(100)])
      .then(([r, b]) => {
        setRestores(r)
        setBackups(b.filter((x) => x.status === "completed"))
      })
      .catch((e) => notify.error(t("admin.backups.loadError") + (e ? `: ${String(e)}` : "")))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [])

  const selectedBackup = backups.find((b) => b.id === Number(selectedId))

  const handleSelect = (value: string) => {
    setSelectedId(value)
    setValidation(null)
  }

  const handleValidate = async () => {
    if (!selectedBackup) return
    setValidating(true)
    try {
      const v = await verifyBackup(selectedBackup.id)
      setValidation(v)
      if (v.valid) {
        notify.success(t("admin.restore.validationPassed"))
      } else {
        notify.error(t("admin.restore.validationFailed") + `: ${v.message}`)
      }
    } catch (e) {
      notify.error(t("admin.restore.validationFailed") + (e ? `: ${String(e)}` : ""))
    } finally {
      setValidating(false)
    }
  }

  const handleRestore = async () => {
    if (!selectedBackup) return
    setRestoring(true)
    try {
      await restoreBackup({ backupId: selectedBackup.id, restoreType: "complete", createdBy: 1 })
      notify.success(t("admin.restore.restoreCompleted"))
      setConfirmOpen(false)
      loadData()
    } catch (e) {
      notify.error(t("admin.restore.restoreFailed") + (e ? `: ${String(e)}` : ""))
    } finally {
      setRestoring(false)
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes > 1_048_576) return `${(bytes / 1_048_576).toFixed(2)} MB`
    if (bytes > 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${bytes} B`
  }

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
        <CardHeader><CardTitle className="text-base">{t("admin.restore.selectBackup")}</CardTitle></CardHeader>
        <CardContent className="p-4 space-y-4">
          <select
            className="flex h-9 w-full max-w-md rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            value={selectedId}
            onChange={(e) => handleSelect(e.target.value)}
            disabled={loading}
          >
            <option value="">{t("admin.restore.selectBackupPlaceholder")}</option>
            {backups.map((b) => (
              <option key={b.id} value={String(b.id)}>{b.fileName}</option>
            ))}
          </select>

          {selectedBackup && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 max-w-lg">
                <div className="flex items-center gap-2 text-sm">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{t("admin.restore.backupDate")}:</span>
                  <span className="font-medium">{selectedBackup.createdAt}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{t("admin.restore.backupSize")}:</span>
                  <span className="font-medium">{formatSize(selectedBackup.fileSize)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{t("admin.restore.validation")}:</span>
                  <span className="font-medium">{validation ? (validation.valid ? "OK" : t("admin.backups.failed")) : "—"}</span>
                </div>
              </div>

              {validation && !validation.valid && (
                <p className="text-sm text-destructive max-w-lg">{validation.message}</p>
              )}

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleValidate} disabled={validating}>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  {validating ? t("admin.backups.verifying") : t("admin.restore.validateBeforeRestore")}
                </Button>
                <Button
                  onClick={() => setConfirmOpen(true)}
                  disabled={!validation?.valid}
                  title={!validation?.valid ? t("admin.restore.validateBeforeRestore") : undefined}
                >
                  <RotateCcw className="mr-2 h-4 w-4" /> {t("admin.restore.complete")}
                </Button>
              </div>
            </div>
          )}

          {backups.length === 0 && !loading && (
            <p className="text-sm text-muted-foreground">{t("admin.restore.noBackupsAvailable")}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-4 w-4" /> {t("admin.restore.historyTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : restores.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">{t("admin.restore.noHistory")}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("admin.backups.fileName")}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("admin.backups.type")}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("admin.backups.status")}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("admin.restore.tablesRestored")}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("admin.restore.error")}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("admin.backups.createdAt")}</th>
                  </tr>
                </thead>
                <tbody>
                  {restores.map((r) => (
                    <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-sm">{r.fileName}</td>
                      <td className="px-4 py-3 text-sm capitalize">{r.restoreType}</td>
                      <td className="px-4 py-3">
                        <Badge variant={r.status === "completed" ? "success" : r.status === "failed" ? "destructive" : "secondary"}>
                          {t(`admin.backups.status.${r.status}`)}
                        </Badge>
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

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(open) => { if (!open && !restoring) setConfirmOpen(false) }}
        title={t("admin.restore.confirmation")}
        description={t("admin.restore.confirmRestore")}
        confirmLabel={t("admin.backups.restore")}
        cancelLabel={t("common.cancel")}
        loading={restoring}
        onConfirm={handleRestore}
      />
    </div>
  )
}
