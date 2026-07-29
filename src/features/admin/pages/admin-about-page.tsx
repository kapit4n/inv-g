import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Shield, Globe, BookOpen, LifeBuoy, Wifi, Server, Cpu, HardDrive } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getCurrentVersion, getSystemInfo } from "@/lib/tauri"

export function AdminAboutPage() {
  const { t } = useTranslation()
  const [version, setVersion] = useState("")
  const [sysInfo, setSysInfo] = useState<{ app_version: string; db_version: number; operating_system: string; architecture: string; hostname: string; timestamp: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getCurrentVersion(), getSystemInfo()]).then(([v, info]) => {
      setVersion(v)
      setSysInfo(info)
    }).finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("admin.about.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("admin.about.description")}</p>
      </div>

      {loading ? (
        <Card><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4" /> Inventory Gear</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-2xl">IG</div>
                <div>
                  <p className="text-lg font-bold">Inventory Gear</p>
                  <p className="text-sm text-muted-foreground">Desktop Inventory Management</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t("admin.about.version")}</span><span className="font-medium">{version || "0.1.0"}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t("admin.about.buildNumber")}</span><span className="font-medium">1</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t("admin.about.environment")}</span><span className="font-medium">Development</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t("admin.about.databaseVersion")}</span><span className="font-medium">{sysInfo?.db_version || "-"}</span></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Server className="h-4 w-4" /> System Information</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-2"><Cpu className="h-3.5 w-3.5" /> OS</span>
                <span>{sysInfo?.operating_system || "-"} ({sysInfo?.architecture || "-"})</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-2"><HardDrive className="h-3.5 w-3.5" /> Hostname</span>
                <span>{sysInfo?.hostname || "-"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("admin.about.framework")}</span>
                <span>Tauri + React</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("admin.about.technology")}</span>
                <span>Rust + TypeScript</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Globe className="h-4 w-4" /> Resources</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <a href="#" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors" onClick={(e) => e.preventDefault()}>
                <Globe className="h-4 w-4" /> {t("admin.about.officialWebsite")}
              </a>
              <a href="#" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors" onClick={(e) => e.preventDefault()}>
                <BookOpen className="h-4 w-4" /> {t("admin.about.documentation")}
              </a>
              <a href="#" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors" onClick={(e) => e.preventDefault()}>
                <LifeBuoy className="h-4 w-4" /> {t("admin.about.support")}
              </a>
              <a href="#" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors" onClick={(e) => e.preventDefault()}>
                <Wifi className="h-4 w-4" /> {t("admin.about.checkForUpdates")}
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">{t("admin.about.credits")}</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>{t("admin.about.developedBy")} Inventory Gear Team</p>
              <p>Copyright &copy; {new Date().getFullYear()} {t("admin.about.allRightsReserved")}</p>
              <p className="text-xs mt-4">{t("admin.about.licenses")}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}