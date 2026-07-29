import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Plus, HardDrive, Trash2, Download, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { getBackupHistory, createBackup, deleteBackup, getBackupStats } from "@/lib/tauri"
import type { BackupRecord } from "@/types"

export function AdminBackupsPage() {
  const { t } = useTranslation()
  const [backups, setBackups] = useState<BackupRecord[]>([])
  const [stats, setStats] = useState<{ total_backups: number; total_size_mb: string; last_backup?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  const loadData = () => {
    setLoading(true)
    Promise.all([getBackupHistory(), getBackupStats()]).then(([b, s]) => {
      setBackups(b)
      setStats(s)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [])

  const handleCreate = async () => {
    setCreating(true)
    try {
      await createBackup("manual", "Manual backup", 1)
      loadData()
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: number) => {
    await deleteBackup(id)
    loadData()
  }

  const formatSize = (bytes: number) => {
    if (bytes > 1_048_576) return `${(bytes / 1_048_576).toFixed(2)} MB`
    if (bytes > 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${bytes} B`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("admin.backups.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("admin.backups.description")}</p>
        </div>
        <Button onClick={handleCreate} disabled={creating}>
          <Plus className="mr-2 h-4 w-4" /> {creating ? "Creating..." : t("admin.backups.create")}
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
                <p className="text-lg font-bold text-sm">{stats.last_backup || "Never"}</p>
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
                          {backup.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{backup.createdAt}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" disabled><Download className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(backup.id)}>
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
    </div>
  )
}