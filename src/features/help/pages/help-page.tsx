import { useTranslation } from "react-i18next"
import { BookOpen, MessageCircle, Keyboard, FileText, ExternalLink } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { shortcuts, shortcutCategories } from "@/lib/shortcuts/shortcuts"
import type { ShortcutCategory } from "@/lib/shortcuts/shortcuts"

export function HelpPage() {
  const { t } = useTranslation()

  const grouped = shortcutCategories.reduce(
    (acc, cat) => {
      acc[cat.id] = shortcuts.filter((s) => s.category === cat.id)
      return acc
    },
    {} as Record<ShortcutCategory, typeof shortcuts>
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("help.title")}
        description={t("help.description")}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="cursor-pointer transition-shadow hover:shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <BookOpen className="h-4 w-4" /> {t("common.help")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">{t("help.description")}</p>
            <Button variant="outline" size="sm" className="w-full" disabled>
              <ExternalLink className="h-3 w-3 mr-1" /> {t("common.comingSoon")}
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer transition-shadow hover:shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <MessageCircle className="h-4 w-4" /> {t("common.settings")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">{t("settings.description")}</p>
            <Button variant="outline" size="sm" className="w-full" disabled>
              <ExternalLink className="h-3 w-3 mr-1" /> {t("common.comingSoon")}
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer transition-shadow hover:shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4" /> {t("common.settings")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">{t("common.version")}</p>
            <Badge variant="outline">v0.1.0</Badge>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Keyboard className="h-4 w-4" /> Keyboard Shortcuts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {shortcutCategories.map((cat) => {
              const items = grouped[cat.id]
              if (!items.length) return null
              return (
                <div key={cat.id}>
                  <h3 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                    {t(cat.label)}
                  </h3>
                  <div className="space-y-1.5">
                    {items.map((s) => (
                      <div key={s.id} className="flex items-center justify-between">
                        <span className="text-sm">{t(s.actionKey)}</span>
                        <kbd className="rounded border bg-muted px-2 py-0.5 text-xs font-mono">{s.keys}</kbd>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
