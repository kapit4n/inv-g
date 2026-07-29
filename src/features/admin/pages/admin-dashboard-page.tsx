import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Users, Database, HardDrive, Printer, LogIn, AlertTriangle, Activity, Shield, Package, Wifi } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { getAdminDashboard } from "@/lib/tauri"

export function AdminDashboardPage() {
  const { t } = useTranslation()
  const [dashboard, setDashboard] = useState<Awaited<ReturnType<typeof getAdminDashboard>> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAdminDashboard()
      .then(setDashboard)
      .finally(() => setLoading(false))
  }, [])

  const statCards = dashboard ? [
    { label: t("admin.dashboard.activeUsers"), value: dashboard.activeUsers, icon: Users, color: "text-blue-600" },
    { label: t("admin.dashboard.totalUsers"), value: dashboard.totalUsers, icon: Users, color: "text-green-600" },
    { label: t("admin.dashboard.databaseSize"), value: dashboard.databaseSize, icon: Database, color: "text-purple-600" },
    { label: t("admin.dashboard.connectedPrinters"), value: dashboard.connectedPrinters, icon: Printer, color: "text-orange-600" },
    { label: t("admin.dashboard.recentLogins"), value: dashboard.recentLogins, icon: LogIn, color: "text-cyan-600" },
    { label: t("admin.dashboard.recentErrors"), value: dashboard.recentErrors, icon: AlertTriangle, color: dashboard.recentErrors > 0 ? "text-red-600" : "text-green-600" },
    { label: t("admin.dashboard.auditEventsToday"), value: dashboard.auditEventsToday, icon: Activity, color: "text-indigo-600" },
    { label: t("admin.dashboard.storageUsage"), value: dashboard.storageUsage, icon: HardDrive, color: "text-gray-600" },
  ] : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("admin.dashboard.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("admin.dashboard.description")}</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map((stat, idx) => (
              <Card key={idx}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                    </div>
                    <stat.icon className={`h-8 w-8 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Activity className="h-4 w-4" /> System Health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">{t("admin.dashboard.systemHealth")}</span>
                  <Badge variant={dashboard.systemHealth === "healthy" ? "success" : "warning"}>{dashboard.systemHealth}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">{t("admin.dashboard.licenseStatus")}</span>
                  <Badge variant={dashboard.licenseStatus === "active" ? "success" : "secondary"}>{dashboard.licenseStatus}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">{t("admin.dashboard.appVersion")}</span>
                  <span className="text-sm font-medium">{dashboard.appVersion}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">{t("admin.dashboard.backupStatus")}</span>
                  <Badge variant={dashboard.backupStatus === "completed" ? "success" : "secondary"}>{dashboard.backupStatus}</Badge>
                </div>
                {dashboard.lastBackup && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{t("admin.dashboard.lastBackup")}</span>
                    <span className="text-sm text-muted-foreground">{dashboard.lastBackup}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4" /> Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start" disabled>
                  <Package className="mr-2 h-4 w-4" /> {t("admin.dashboard.createBackup")}
                </Button>
                <Button variant="outline" className="w-full justify-start" disabled>
                  <Activity className="mr-2 h-4 w-4" /> {t("admin.dashboard.runDiagnostics")}
                </Button>
                <Button variant="outline" className="w-full justify-start" disabled>
                  <Wifi className="mr-2 h-4 w-4" /> Check for Updates
                </Button>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}