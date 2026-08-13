import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { Store, Palette, Database, Bell, Shield, Globe, Printer, Truck, Check, ArrowRight } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { useLanguageStore, useAppSettingsStore, useThemeStore } from "@/stores"
import { usePermission } from "@/hooks"
import { updateAppSetting } from "@/lib/tauri"

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
  const navigate = useNavigate()
  const { language, setLanguage } = useLanguageStore()
  const { theme, setTheme } = useThemeStore()
  const getValue = useAppSettingsStore((s) => s.getValue)
  const setSettingValue = useAppSettingsStore((s) => s.setValue)
  const canManageSettings = usePermission("admin.settings.manage")

  const settingEnabled = useCallback(
    (key: string, fallback = true) => getValue(key) !== undefined ? getValue(key) === "true" : fallback,
    [getValue]
  )

  const toggleSetting = useCallback(
    async (key: string, checked: boolean) => {
      const value = checked ? "true" : "false"
      setSettingValue(key, value)
      try {
        await updateAppSetting(key, value)
      } catch {
        setSettingValue(key, checked ? "false" : "true")
      }
    },
    [setSettingValue]
  )

  const isDark = useMemo(() => theme === "dark", [theme])

  const toggleDarkMode = useCallback(
    async (checked: boolean) => {
      const value = checked ? "dark" : "light"
      setTheme(value)
      setSettingValue("theme", value)
      try {
        await updateAppSetting("theme", value)
      } catch {
        setSettingValue("theme", theme)
      }
    },
    [setTheme, setSettingValue, theme]
  )

  const openSettings = () => navigate("/admin/settings")

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
          <Card key={group.titleKey} className="transition-shadow hover:shadow-md">
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
              <Button variant="ghost" size="sm" disabled={!canManageSettings} onClick={openSettings}>
                {t("settings.configure")}
                {canManageSettings && <ArrowRight className="ml-1 h-3 w-3" />}
              </Button>
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
              <Switch aria-label={t("settings.lowStockAlerts")} checked={settingEnabled("notify_low_stock")} onCheckedChange={(c) => toggleSetting("notify_low_stock", c)} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <div><p className="text-sm font-medium">{t("settings.soundEffects")}</p><p className="text-xs text-muted-foreground">{t("settings.soundEffectsDesc")}</p></div>
              <Switch aria-label={t("settings.soundEffects")} checked={settingEnabled("sound_enabled")} onCheckedChange={(c) => toggleSetting("sound_enabled", c)} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <div><p className="text-sm font-medium">{t("settings.autoBackup")}</p><p className="text-xs text-muted-foreground">{t("settings.autoBackupDesc")}</p></div>
              <Switch aria-label={t("settings.autoBackup")} checked={settingEnabled("auto_backup")} onCheckedChange={(c) => toggleSetting("auto_backup", c)} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <div><p className="text-sm font-medium">{t("settings.darkModeToggle")}</p><p className="text-xs text-muted-foreground">{t("settings.darkModeToggleDesc")}</p></div>
              <Switch aria-label={t("settings.darkModeToggle")} checked={isDark} onCheckedChange={toggleDarkMode} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
