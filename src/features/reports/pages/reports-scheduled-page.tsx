import { useTranslation } from "react-i18next"
import { useEffect, useState } from "react"
import { PageHeader } from "@/components/page-header"
import * as api from "@/lib/tauri"
import type { ScheduledReport } from "@/types"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, RefreshCw } from "lucide-react"

const FREQUENCIES = ["daily", "weekly", "monthly"]
const FORMATS = ["CSV", "Excel", "PDF"]

export function ReportsScheduledPage() {
  const { t } = useTranslation("reports")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<ScheduledReport[]>([])
  const [showForm, setShowForm] = useState(false)

  const [formName, setFormName] = useState("")
  const [formFrequency, setFormFrequency] = useState("daily")
  const [formTime, setFormTime] = useState("08:00")
  const [formFormat, setFormFormat] = useState("CSV")

  const fetchData = () => {
    setLoading(true)
    setError(null)
    api.getScheduledReports()
      .then(setData)
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleToggle = (r: ScheduledReport) => {
    api.toggleScheduledReport(r.id, !r.isActive)
      .then(fetchData)
      .catch(() => {})
  }

  const handleCreate = () => {
    if (!formName.trim()) return
    setLoading(true)
    api.createScheduledReport(
      formName.trim(),
      undefined,
      formFrequency,
      undefined,
      undefined,
      formTime,
      formFormat,
      1,
    )
      .then(() => {
        setShowForm(false)
        setFormName("")
        setFormFrequency("daily")
        setFormTime("08:00")
        setFormFormat("CSV")
        fetchData()
      })
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false))
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("scheduledReports")} description={t("scheduledReportsDescription")} />
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-destructive mb-4 text-sm">{error}</p>
          <Button onClick={fetchData}>{t("retry")}</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("scheduledReports")}
        description={t("scheduledReportsDescription")}
        actions={
          <Button onClick={() => setShowForm((v) => !v)}>
            <Plus className="mr-1.5 h-4 w-4" />
            {t("newSchedule")}
          </Button>
        }
      />

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("newSchedule")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sched-name">{t("name")}</Label>
              <Input
                id="sched-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder={t("scheduleNamePlaceholder")}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="sched-freq">{t("frequency")}</Label>
                <select
                  id="sched-freq"
                  value={formFrequency}
                  onChange={(e) => setFormFrequency(e.target.value)}
                  className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {FREQUENCIES.map((f) => (
                    <option key={f} value={f}>{t(f)}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sched-time">{t("time")}</Label>
                <Input
                  id="sched-time"
                  type="time"
                  value={formTime}
                  onChange={(e) => setFormTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sched-format">{t("format")}</Label>
                <select
                  id="sched-format"
                  value={formFormat}
                  onChange={(e) => setFormFormat(e.target.value)}
                  className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {FORMATS.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>{t("cancel")}</Button>
              <Button onClick={handleCreate} disabled={!formName.trim() || loading}>
                {t("save")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("name")}</TableHead>
              <TableHead>{t("frequency")}</TableHead>
              <TableHead>{t("time")}</TableHead>
              <TableHead>{t("format")}</TableHead>
              <TableHead>{t("active")}</TableHead>
              <TableHead>{t("lastRun")}</TableHead>
              <TableHead>{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && data.length === 0 ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full max-w-[100px]" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  {t("noScheduledReports")}
                </TableCell>
              </TableRow>
            ) : (
              data.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="capitalize">{t(r.frequency)}</TableCell>
                  <TableCell>{r.time}</TableCell>
                  <TableCell>{r.exportFormat}</TableCell>
                  <TableCell>
                    <Switch
                      checked={r.isActive}
                      onCheckedChange={() => handleToggle(r)}
                    />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {r.lastRunAt ? new Date(r.lastRunAt).toLocaleDateString() : "-"}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <RefreshCw className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
