import { useTranslation } from "react-i18next"
import { useEffect, useState } from "react"
import { PageHeader } from "@/components/page-header"
import * as api from "@/lib/tauri"
import type { SavedReport } from "@/types"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Star, Trash2, Plus, FileText } from "lucide-react"
import { cn } from "@/lib/utils"

const MODULES = ["sales", "inventory", "purchasing", "customers", "suppliers", "warehouse", "profitability", "kpi"]

export function ReportsCustomPage() {
  const { t } = useTranslation("reports")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState<SavedReport[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const [name, setName] = useState("")
  const [module, setModule] = useState("sales")
  const [description, setDescription] = useState("")

  const fetchSaved = () => {
    setLoading(true)
    setError(null)
    api.getSavedReports()
      .then(setSaved)
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchSaved()
  }, [])

  const handleNew = () => {
    setSelectedId(null)
    setName("")
    setModule("sales")
    setDescription("")
  }

  const handleSelect = (r: SavedReport) => {
    setSelectedId(r.id)
    setName(r.name)
    setModule(r.module)
    setDescription(r.description ?? "")
  }

  const handleSave = () => {
    if (!name.trim()) return
    setLoading(true)
    api.createSavedReport({ name: name.trim(), description: description.trim() || undefined, module }, 1)
      .then(() => {
        handleNew()
        fetchSaved()
      })
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false))
  }

  const handleDelete = (id: number) => {
    setLoading(true)
    api.deleteSavedReport(id)
      .then(fetchSaved)
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false))
  }

  const toggleFavorite = (r: SavedReport) => {
    api.createSavedReport({
      name: r.name,
      description: r.description ?? undefined,
      module: r.module,
      isFavorite: !r.isFavorite,
    }, 1).then(fetchSaved).catch(() => {})
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("customReports")} description={t("customReportsDescription")} />
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-destructive mb-4 text-sm">{error}</p>
          <Button onClick={fetchSaved}>{t("retry")}</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("customReports")}
        description={t("customReportsDescription")}
        actions={
          <Button onClick={handleNew}>
            <Plus className="mr-1.5 h-4 w-4" />
            {t("newReport")}
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            {t("savedReports")}
          </h2>
          {loading && saved.length === 0 ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : saved.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8 text-center text-sm text-muted-foreground">
                <FileText className="mb-2 h-8 w-8" />
                {t("noSavedReports")}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {saved.map((r) => (
                <Card
                  key={r.id}
                  className={cn(
                    "cursor-pointer transition-colors hover:bg-accent",
                    selectedId === r.id && "border-primary ring-1 ring-primary"
                  )}
                  onClick={() => handleSelect(r)}
                >
                  <CardContent className="flex items-center justify-between p-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{r.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{r.module}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(r) }}
                      >
                        <Star className={cn("h-3.5 w-3.5", r.isFavorite && "fill-yellow-400 text-yellow-400")} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); handleDelete(r.id) }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{selectedId ? t("editReport") : t("newReport")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="report-name">{t("name")}</Label>
                <Input
                  id="report-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("reportNamePlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="report-module">{t("module")}</Label>
                <select
                  id="report-module"
                  value={module}
                  onChange={(e) => setModule(e.target.value)}
                  className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {MODULES.map((m) => (
                    <option key={m} value={m}>{t(m)}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="report-desc">{t("description")}</Label>
                <Textarea
                  id="report-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t("descriptionPlaceholder")}
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleNew}>{t("cancel")}</Button>
                <Button onClick={handleSave} disabled={!name.trim() || loading}>
                  {t("generate")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
