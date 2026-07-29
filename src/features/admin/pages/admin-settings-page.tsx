import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { getAppSettings, getSettingCategories, updateAppSettingsBulk } from "@/lib/tauri"
import type { AdminAppSetting } from "@/types"

const categoryIcons: Record<string, string> = {
  general: "General", store: "Store", localization: "Localization", theme: "Theme",
  security: "Security", inventory: "Inventory", sales: "Sales", purchasing: "Purchasing",
  crm: "CRM", reports: "Reports", printing: "Printing", database: "Database",
  backup: "Backup", updates: "Updates", performance: "Performance", advanced: "Advanced",
}

export function AdminSettingsPage() {
  const { t } = useTranslation()
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
      s.forEach((setting) => { v[setting.key] = setting.value || "" })
      setValues(v)
      setLoading(false)
    })
  }, [activeCategory])

  const handleSave = async () => {
    setSaving(true)
    try {
      const bulk = Object.entries(values).map(([key, value]) => ({ key, value }))
      await updateAppSettingsBulk(bulk)
    } finally {
      setSaving(false)
    }
  }

  const renderSetting = (setting: AdminAppSetting) => {
    const val = values[setting.key] ?? ""

    if (setting.settingType === "boolean") {
      return (
        <Switch
          checked={val === "true"}
          onCheckedChange={(checked) => setValues({ ...values, [setting.key]: checked ? "true" : "false" })}
        />
      )
    }

    if (setting.options) {
      const options = setting.options.split(",").map((o) => o.trim())
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
          value={val}
          onChange={(e) => setValues({ ...values, [setting.key]: e.target.value })}
        />
      )
    }

    return (
      <Input
        className="max-w-xs"
        value={val}
        onChange={(e) => setValues({ ...values, [setting.key]: e.target.value })}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("admin.settings.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("admin.settings.description")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="md:col-span-1">
          <CardHeader><CardTitle className="text-base">Categories</CardTitle></CardHeader>
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
                    <span className="capitalize">{cat.category}</span>
                    <Badge variant="secondary" className="text-[10px]">{cat.count}</Badge>
                  </div>
                </button>
              ))}
            </nav>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base capitalize">{activeCategory}</CardTitle>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="space-y-3">{[1,2,3,4].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
            ) : settings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No settings in this category</p>
            ) : (
              settings.map((setting) => (
                <div key={setting.key} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="space-y-1 flex-1 mr-4">
                    <Label className="text-sm font-medium">{setting.key.replace(/_/g, " ")}</Label>
                    {setting.description && (
                      <p className="text-xs text-muted-foreground">{setting.description}</p>
                    )}
                  </div>
                  {renderSetting(setting)}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}