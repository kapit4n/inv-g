import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Shield, Key, CheckCircle2, AlertTriangle, Building2, Users, Store, Calendar } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { getLicenseInfo, activateLicense, deactivateLicense, validateLicense } from "@/lib/tauri"
import type { LicenseInfo } from "@/types"

export function AdminLicensePage() {
  const { t } = useTranslation()
  const [license, setLicense] = useState<LicenseInfo | null>(null)
  const [validation, setValidation] = useState<{ valid: boolean; status: string; expiration_date?: string; expired: boolean } | null>(null)
  const [loading, setLoading] = useState(true)
  const [activating, setActivating] = useState(false)
  const [licenseKey, setLicenseKey] = useState("")

  const loadData = () => {
    setLoading(true)
    Promise.all([getLicenseInfo(), validateLicense()]).then(([l, v]) => {
      setLicense(l)
      setValidation(v)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [])

  const handleActivate = async () => {
    if (!licenseKey.trim()) return
    setActivating(true)
    try {
      const result = await activateLicense(licenseKey.trim())
      setLicense(result)
      const v = await validateLicense()
      setValidation(v)
    } finally {
      setActivating(false)
    }
  }

  const handleDeactivate = async () => {
    await deactivateLicense()
    loadData()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("admin.licensing.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("admin.licensing.description")}</p>
      </div>

      {loading ? (
        <Card><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">{t("admin.licensing.activation")}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder={t("admin.licensing.enterKey")}
                    value={licenseKey}
                    onChange={(e) => setLicenseKey(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleActivate} disabled={activating || !licenseKey.trim()}>
                    {activating ? "..." : t("admin.licensing.activate")}
                  </Button>
                </div>
                {license && (
                  <Button variant="outline" onClick={handleDeactivate}>
                    {t("admin.licensing.deactivate")}
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">{t("admin.licensing.status")}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant={validation?.valid ? "success" : validation?.status === "unlicensed" ? "secondary" : "destructive"}>
                    {validation?.status || "unknown"}
                  </Badge>
                </div>
                {license && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{t("admin.licensing.type")}</span>
                      <span className="text-sm font-medium capitalize">{license.licenseType}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{t("admin.licensing.company")}</span>
                      <span className="text-sm">{license.companyName || "-"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{t("admin.licensing.seats")}</span>
                      <span className="text-sm">{license.maxUsers} users / {license.maxStores} stores</span>
                    </div>
                    {license.expirationDate && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{t("admin.licensing.expiry")}</span>
                        <Badge variant={license.expirationDate < new Date().toISOString().split('T')[0] ? "destructive" : "success"}>
                          {license.expirationDate}
                        </Badge>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {license?.features && license.features !== "{}" && (
            <Card>
              <CardHeader><CardTitle className="text-base">{t("admin.licensing.features")}</CardTitle></CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto">{license.features}</pre>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}