import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Download, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { getSystemUpdates, checkForUpdates, getCurrentVersion } from "@/lib/tauri"
import type { SystemUpdate } from "@/types"

export function AdminUpdatesPage() {
  const { t } = useTranslation()
  const [updates, setUpdates] = useState<SystemUpdate[]>([])
  const [currentVersion, setCurrentVersion] = useState("")
  const [checkResult, setCheckResult] = useState<{ current_version: string; latest_version: string; has_update: boolean } | null>(null)
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)

  const loadData = () => {
    setLoading(true)
    Promise.all([getSystemUpdates(), getCurrentVersion()]).then(([u, v]) => {
      setUpdates(u)
      setCurrentVersion(v)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [])

  const handleCheck = async () => {
    setChecking(true)
    try {
      const result = await checkForUpdates()
      setCheckResult(result)
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("admin.updateCenter.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("admin.updateCenter.description")}</p>
        </div>
        <Button onClick={handleCheck} disabled={checking}>
          <RefreshCw className={`mr-2 h-4 w-4 ${checking ? "animate-spin" : ""}`} />
          {checking ? t("admin.updateCenter.checking") : t("admin.updateCenter.checkUpdates")}
        </Button>
      </div>

      {checkResult && (
        <Card className={checkResult.has_update ? "border-amber-200 bg-amber-50 dark:bg-amber-950/20" : "border-green-200 bg-green-50 dark:bg-green-950/20"}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">
                {checkResult.has_update
                  ? `${t("admin.updateCenter.updateAvailable")} (${checkResult.latest_version})`
                  : t("admin.updateCenter.upToDate")}
              </p>
              <p className="text-xs text-muted-foreground">{t("admin.updateCenter.currentVersion")}: {checkResult.current_version}</p>
            </div>
            {checkResult.has_update && (
              <Button size="sm"><Download className="mr-2 h-4 w-4" /> {t("admin.updateCenter.downloadUpdate")}</Button>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-base">{t("admin.updateCenter.currentVersion")}</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{currentVersion || "0.1.0"}</p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">{t("admin.updateCenter.updateHistory")}</CardTitle></CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-2">{[1,2].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : updates.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">{t("admin.updateCenter.noUpdates")}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("admin.updateCenter.version")}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("admin.updateCenter.releaseDate")}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("admin.updateCenter.type")}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("admin.backups.status")}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("admin.updateCenter.installing")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {updates.map((update) => (
                      <tr key={update.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium">{update.version}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{update.releaseDate || "-"}</td>
                        <td className="px-4 py-3 text-sm capitalize">{update.status}</td>
                        <td className="px-4 py-3">
                          <Badge variant={update.status === "installed" ? "success" : update.status === "available" ? "warning" : "secondary"}>
                            {update.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{update.installedAt || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}