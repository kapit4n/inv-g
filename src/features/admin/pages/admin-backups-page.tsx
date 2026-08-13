import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Plus, HardDrive, Trash2, Download, Clock, ShieldCheck, RotateCcw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog"
import { useNotification } from "@/hooks"
import { getBackupHistory, createBackup, deleteBackup, verifyBackup, restoreBackup, getBackupStats } from "@/lib/tauri"
import type { BackupRecord } from "@/types"

type PendingAction = { type: "delete" | "restore"; backup: BackupRecord } | null

export function AdminBackupsPage() {
  const { t } = useTranslation()
  const notify = useNotification()
  const [backups, setBackups] = useState<BackupRecord[]>([])
  const [stats, setStats] = useState<{ total_backups: number; total_size_mb: string; last_backup?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [verifyingId, setVerifyingId] = useState<number | null>(null)
  const [action, setAction] = useState<PendingAction>(null)
  const [processing, setProcessing] = useState(false)

  const loadData = () => {
    setLoading(true)
    Promise.all([getBackupHistory(), getBackupStats()])
      .then(([b, s]) => {
        setBackups(b)
        setStats(s)
      })
      .catch((e) => notify.error(t("admin.backups.loadError") + (e ? `: ${String(e)}` : "")))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [])

  const handleCreate = async () => {
    setCreating(true)
    try {
      await createBackup("manual", "Manual backup", 1)
      notify.success(t("admin.backups.backupCreated"))
      loadData()
    } catch (e) {
      notify.error(t("admin.backups.createError") + (e ? `: ${String(e)}` : ""))
    } finally {
      setCreating(false)
    }
  }

  const handleVerify = async (id: number) => {
    setVerifyingId(id)
    try {
      const validation = await verifyBackup(id)
      if (validation.valid) {
        notify.success(t("admin.backups.verifySuccess") + ` (${validation.fileSize} B)`)
      } else {
        notify.warning(t("admin.backups.verifyFailed") + `: ${validation.message}`)
      }
    } catch (e) {
      notify.error(t("admin.backups.verifyFailed") + (e ? `: ${String(e)}` : ""))
    } finally {
      setVerifyingId(null)
    }
  }

  const handleDelete = async () => {
    if (!action || action.type !== "delete") return
    setProcessing(true)
    try {
      await deleteBackup(action.backup.id, 1)
      notify.success(t("admin.backups.backupDeleted"))
      loadData()
    } catch (e) {
      notify.error(t("admin.backups.deleteError") + (e ? `: ${String(e)}` : ""))
    } finally {
      setProcessing(false)
      setAction(null)
    }
  }

  const handleRestore = async () => {
    if (!action || action.type !== "restore") return
    setProcessing(true)
    try {
      await restoreBackup({ backupId: action.backup.id, restoreType: "complete", createdBy: 1 })
      notify.success(t("admin.restore.restoreCompleted"))
      loadData()
    } catch (e) {
      notify.error(t("admin.restore.restoreFailed") + (e ? `: ${String(e)}` : ""))
    } finally {
      setProcessing(false)
      setAction(null)
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes > 1_048_576) return `${(bytes / 1_048_576).toFixed(2)} MB`
    if (bytes > 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${bytes} B`
  }

  const canRestore = (backup: BackupRecord) => backup.status === "completed"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("admin.backups.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("admin.backups.description")}</p>
        </div>
        <Button onClick={handleCreate} disabled={creating}>
          <Plus className="mr-2 h-4 w-4" /> {creating ? t("admin.backups.creating") : t("admin.backups.create")}
        </Button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <HardDrive className="h-8 w-8 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">{t("admin.backups.totalBackups")}</p>
                <p className="text-lg font-bold">{stats.total_backups}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <HardDrive className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-xs text-muted-foreground">{t("admin.backups.totalSize")}</p>
                <p className="text-lg font-bold">{stats.total_size_mb} MB</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Clock className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-xs text-muted-foreground">{t("admin.backups.lastBackup")}</p>
                <p className="text-lg font-bold text-sm">{stats.last_backup || t("admin.backups.never")}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">{t("admin.backups.list")}</CardTitle></CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : backups.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">{t("admin.backups.noBackups")}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("admin.backups.fileName")}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("admin.backups.fileSize")}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("admin.backups.type")}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("admin.backups.status")}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("admin.backups.createdAt")}</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">{t("common.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {backups.map((backup) => (
                    <tr key={backup.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium">{backup.fileName}</td>
                      <td className="px-4 py-3 text-sm">{formatSize(backup.fileSize)}</td>
                      <td className="px-4 py-3 text-sm capitalize">{backup.backupType}</td>
                      <td className="px-4 py-3">
                        <Badge variant={backup.status === "completed" ? "success" : backup.status === "failed" ? "destructive" : "secondary"}>
                          {t(`admin.backups.status.${backup.status}`)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{backup.createdAt}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title={t("admin.backups.verify")}
                            disabled={verifyingId === backup.id}
                            onClick={() => handleVerify(backup.id)}
                          >
                            <ShieldCheck className={`h-4 w-4 ${verifyingId === backup.id ? "animate-pulse text-primary" : "text-muted-foreground"}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title={t("admin.backups.restore")}
                            disabled={!canRestore(backup)}
                            onClick={() => setAction({ type: "restore", backup })}
                          >
                            <RotateCcw className="h-4 w-4 text-amber-600" />
                          </Button>
                          <Button variant="ghost" size="icon" disabled title={t("admin.backups.download")}>
                            <Download className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title={t("admin.backups.delete")}
                            onClick={() => setAction({ type: "delete", backup })}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={action !== null}
        onOpenChange={(open) => { if (!open && !processing) setAction(null) }}
        title={action?.type === "delete" ? t("admin.backups.confirmDeleteTitle") : t("admin.restore.confirmation")}
        description={action?.type === "delete" ? t("admin.backups.confirmDelete") : t("admin.restore.confirmRestore")}
        confirmLabel={action?.type === "delete" ? t("common.delete") : t("admin.backups.restore")}
        cancelLabel={t("common.cancel")}
        variant={action?.type === "delete" ? "destructive" : "default"}
        loading={processing}
        onConfirm={action?.type === "delete" ? handleDelete : handleRestore}
      />
    </div>
  )
}
