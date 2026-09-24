import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Search, Activity, AlertTriangle, Info, XCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { getAuditEvents, getAuditSummary } from "@/lib/tauri"
import type { AuditEvent } from "@/types"

const severityIcon = (severity: string) => {
  switch (severity) {
    case "critical": return <XCircle className="h-3.5 w-3.5 text-red-500" />
    case "error": return <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
    case "warning": return <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
    default: return <Info className="h-3.5 w-3.5 text-blue-500" />
  }
}

export function AdminAuditPage() {
  const { t } = useTranslation()
  const [events, setEvents] = useState<AuditEvent[]>([])
  const [summary, setSummary] = useState<{ total_events: number; by_severity: Record<string, number>; by_action: Record<string, number>; by_entity_type: Record<string, number> } | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [severity, setSeverity] = useState<string>("")

  const loadData = () => {
    setLoading(true)
    Promise.all([
      getAuditEvents(search ? { search } : undefined, 1, 100),
      getAuditSummary(),
    ]).then(([e, s]) => {
      setEvents(e)
      setSummary(s)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [search])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("admin.audit.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("admin.audit.description")}</p>
      </div>

      {summary && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <Card><CardContent className="p-4 flex items-center gap-3">
            <Activity className="h-8 w-8 text-primary" />
            <div><p className="text-xs text-muted-foreground">{t("admin.audit.totalEvents")}</p><p className="text-lg font-bold">{summary.total_events}</p></div>
          </CardContent></Card>
          {Object.entries(summary.by_severity).map(([sev, count]) => (
            <Card key={sev}>
              <CardContent className="p-4 flex items-center gap-3">
                {severityIcon(sev)}
                <div><p className="text-xs text-muted-foreground capitalize">{sev}</p><p className="text-lg font-bold">{count}</p></div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{t("admin.audit.timeline")}</CardTitle>
            <div className="flex items-center gap-2">
              <select className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm" value={severity} onChange={(e) => setSeverity(e.target.value)}>
                <option value="">{t("admin.audit.allSeverities")}</option>
                <option value="info">{t("admin.audit.info")}</option><option value="warning">{t("admin.audit.warning")}</option><option value="error">{t("admin.audit.error")}</option><option value="critical">{t("admin.audit.critical")}</option>
              </select>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder={t("admin.audit.search.placeholder")} className="pl-8 w-64" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">{[1,2,3,4,5].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : events.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">{t("admin.audit.noEvents")}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("admin.audit.severity")}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("admin.audit.timestamp")}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("admin.audit.user")}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("admin.audit.action")}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("admin.audit.module")}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("admin.audit.details")}</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={event.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">{severityIcon(event.severity)}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{event.createdAt}</td>
                      <td className="px-4 py-3 text-sm">{event.username || "-"}</td>
                      <td className="px-4 py-3 text-sm font-medium">{event.action}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{event.entityType || "-"}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground max-w-[200px] truncate">{event.details || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}