import { useTranslation } from "react-i18next"
import { Store, Palette, Database, Bell, Shield, Globe, Printer, Truck, Check } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { useLanguageStore } from "@/stores"

const settingGroups = [
  { icon: <Store className="h-5 w-5" />, titleKey: "settings.storeInformation", descKey: "settings.storeInfoDesc", badgeKey: "common.required" },
  { icon: <Palette className="h-5 w-5" />, titleKey: "settings.appearance", descKey: "settings.appearanceDesc", badgeKey: "common.active" },
  { icon: <Database className="h-5 w-5" />, titleKey: "settings.databaseBackup", descKey: "settings.databaseBackupDesc", badgeKey: null },
  { icon: <Bell className="h-5 w-5" />, titleKey: "settings.notifications", descKey: "settings.notificationsDesc", badgeKey: null },
  { icon: <Shield className="h-5 w-5" />, titleKey: "settings.security", descKey: "settings.securityDesc", badgeKey: null },
  { icon: <Globe className="h-5 w-5" />, titleKey: "settings.localization", descKey: "settings.localizationDesc", badgeKey: null },
  { icon: <Printer className="h-5 w-5" />, titleKey: "settings.receiptPrinting", descKey: "settings.receiptPrintingDesc", badgeKey: null },
  { icon: <Truck className="h-5 w-5" />, titleKey: "settings.shippingDelivery", descKey: "settings.shippingDeliveryDesc", badgeKey: null },
]

export function SettingsPage() {
  const { t } = useTranslation()
  const { language, setLanguage } = useLanguageStore()

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("settings.title")}
        description={t("settings.description")}
      />

      {/* Language Selector */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-primary/10 p-3 text-primary">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">{t("settings.language")}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{t("settings.localizationDesc")}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={language === "es" ? "default" : "outline"}
                size="sm"
                onClick={() => setLanguage("es")}
              >
                {language === "es" && <Check className="h-3 w-3 mr-1" />}
                🇪🇸 {t("settings.spanish")}
              </Button>
              <Button
                variant={language === "en" ? "default" : "outline"}
                size="sm"
                onClick={() => setLanguage("en")}
              >
                {language === "en" && <Check className="h-3 w-3 mr-1" />}
                🇺🇸 {t("settings.english")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {settingGroups.map((group) => (
          <Card key={group.titleKey} className="cursor-pointer transition-shadow hover:shadow-md">
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-primary/10 p-3 text-primary">
                  {group.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold">{t(group.titleKey)}</h3>
                    {group.badgeKey && <Badge variant="secondary" className="text-[10px]">{t(group.badgeKey)}</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{t(group.descKey)}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" disabled>{t("settings.configure")}</Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">{t("settings.quickToggles")}</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <div><p className="text-sm font-medium">{t("settings.lowStockAlerts")}</p><p className="text-xs text-muted-foreground">{t("settings.lowStockAlertsDesc")}</p></div>
              <Switch defaultChecked />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <div><p className="text-sm font-medium">{t("settings.soundEffects")}</p><p className="text-xs text-muted-foreground">{t("settings.soundEffectsDesc")}</p></div>
              <Switch />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <div><p className="text-sm font-medium">{t("settings.autoBackup")}</p><p className="text-xs text-muted-foreground">{t("settings.autoBackupDesc")}</p></div>
              <Switch defaultChecked />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <div><p className="text-sm font-medium">{t("settings.darkModeToggle")}</p><p className="text-xs text-muted-foreground">{t("settings.darkModeToggleDesc")}</p></div>
              <Switch />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
