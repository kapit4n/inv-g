import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { getAppSettings, getSettingCategories, updateAppSettingsBulk } from "@/lib/tauri"
import { parseSettingOptions, parseSettingValidation, validateSettingValue } from "@/lib/settings-utils"
import { useNotification } from "@/hooks"
import { useAppSettingsStore } from "@/stores"
import type { AdminAppSetting } from "@/types"

export function AdminSettingsPage() {
  const { t } = useTranslation()
  const notify = useNotification()
  const appSettingsStore = useAppSettingsStore()

  const [categories, setCategories] = useState<{ category: string; count: number }[]>([])
  const [activeCategory, setActiveCategory] = useState("general")
  const [settings, setSettings] = useState<AdminAppSetting[]>([])
  const [values, setValues] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getSettingCategories().then((cats) => {
      setCategories(cats)
      if (cats.length > 0) setActiveCategory(cats[0].category)
    })
  }, [])

  useEffect(() => {
    setLoading(true)
    getAppSettings(activeCategory).then((s) => {
      setSettings(s)
      const v: Record<string, string> = {}
      s.forEach((setting) => { v[setting.key] = setting.value ?? "" })
      setValues(v)
      setLoading(false)
    })
  }, [activeCategory])

  const errors = useMemo(() => {
    const errs: Record<string, string | null> = {}
    for (const setting of settings) {
      errs[setting.key] = validateSettingValue(setting, values[setting.key] ?? "")
    }
    return errs
  }, [settings, values])

  const hasErrors = useMemo(
    () => Object.values(errors).some((e) => e !== null),
    [errors]
  )

  const errorText = useCallback(
    (setting: AdminAppSetting, code: string | null) => {
      if (!code) return null
      const validation = parseSettingValidation(setting.validation)
      const prefix = "admin.settings.errors."
      switch (code) {
        case "min": return t(`${prefix}min`, { min: validation.min })
        case "max": return t(`${prefix}max`, { max: validation.max })
        case "minLength": return t(`${prefix}minLength`, { min: validation.minLength })
        case "maxLength": return t(`${prefix}maxLength`, { max: validation.maxLength })
        case "notAllowed": return t(`${prefix}notAllowed`)
        case "notNumber": return t(`${prefix}notNumber`)
        case "notBoolean": return t(`${prefix}notBoolean`)
        case "required": return t(`${prefix}required`)
        default: return null
      }
    },
    [t]
  )

  const handleSave = async () => {
    if (hasErrors) return
    setSaving(true)
    try {
      const bulk = Object.entries(values).map(([key, value]) => ({ key, value }))
      await updateAppSettingsBulk(bulk)
      for (const setting of settings) {
        appSettingsStore.setValue(setting.key, values[setting.key] ?? "")
      }
      notify.success(t("admin.settings.saved"))
    } catch (e) {
      notify.error(t("admin.settings.saveError") + (e ? `: ${String(e)}` : ""))
    } finally {
      setSaving(false)
    }
  }

  const renderControl = (setting: AdminAppSetting) => {
    const val = values[setting.key] ?? ""
    const validation = parseSettingValidation(setting.validation)

    if (setting.settingType === "boolean") {
      return (
        <Switch
          checked={val === "true"}
          onCheckedChange={(checked) => setValues({ ...values, [setting.key]: checked ? "true" : "false" })}
        />
      )
    }

    const options = parseSettingOptions(setting.options)
    if (options.length > 0) {
      return (
        <select
          className="flex h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={val}
          onChange={(e) => setValues({ ...values, [setting.key]: e.target.value })}
        >
          {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      )
    }

    if (setting.settingType === "number") {
      return (
        <Input
          type="number"
          className="max-w-xs"
          min={validation.min}
          max={validation.max}
          value={val}
          onChange={(e) => setValues({ ...values, [setting.key]: e.target.value })}
        />
      )
    }

    return (
      <Input
        className="max-w-xs"
        maxLength={validation.maxLength}
        value={val}
        onChange={(e) => setValues({ ...values, [setting.key]: e.target.value })}
      />
    )
  }

  const categoryLabel = (category: string) => t(`admin.settings.${category}`, { defaultValue: category })
  const categoryDescription = (category: string) =>
    t(`admin.settings.${category}.description`, { defaultValue: "" })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("admin.settings.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("admin.settings.description")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="md:col-span-1">
          <CardHeader><CardTitle className="text-base">{t("admin.settings.categories")}</CardTitle></CardHeader>
          <CardContent className="p-2">
            <nav className="space-y-1">
              {categories.map((cat) => (
                <button
                  key={cat.category}
                  className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                    activeCategory === cat.category
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                  onClick={() => setActiveCategory(cat.category)}
                >
                  <div className="flex items-center justify-between">
                    <span className="capitalize">{categoryLabel(cat.category)}</span>
                    <Badge variant="secondary" className="text-[10px]">{cat.count}</Badge>
                  </div>
                </button>
              ))}
            </nav>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base capitalize">{categoryLabel(activeCategory)}</CardTitle>
              {categoryDescription(activeCategory) && (
                <p className="text-xs text-muted-foreground">{categoryDescription(activeCategory)}</p>
              )}
            </div>
            <Button onClick={handleSave} disabled={saving || hasErrors}>
              {saving ? t("admin.settings.saving") : t("admin.settings.save")}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="space-y-3">{[1,2,3,4].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
            ) : settings.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("admin.settings.noSettings")}</p>
            ) : (
              <>
                {hasErrors && (
                  <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {t("admin.settings.fixErrors")}
                  </div>
                )}
                {settings.map((setting) => {
                  const error = errors[setting.key]
                  return (
                    <div key={setting.key} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="space-y-1 flex-1 mr-4">
                        <Label className="text-sm font-medium">{setting.key.replace(/_/g, " ")}</Label>
                        {setting.description && (
                          <p className="text-xs text-muted-foreground">{setting.description}</p>
                        )}
                        {error && (
                          <p className="text-xs text-destructive">{errorText(setting, error)}</p>
                        )}
                      </div>
                      {renderControl(setting)}
                    </div>
                  )
                })}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
