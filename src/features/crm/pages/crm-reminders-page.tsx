import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Plus, CheckCircle, AlertTriangle } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useAuthStore } from "@/stores"
import toast from "react-hot-toast"
import { getServiceReminders, createServiceReminder, updateServiceReminderStatus } from "@/lib/tauri"
import type { ServiceReminder } from "@/types"

export function CrmRemindersPage() {
  const { t } = useTranslation("crm")
  const user = useAuthStore((s) => s.user)
  const [reminders, setReminders] = useState<ServiceReminder[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formCustomerId, setFormCustomerId] = useState("")
  const [formTitle, setFormTitle] = useState("")
  const [formType, setFormType] = useState("oil_change")
  const [formDescription, setFormDescription] = useState("")
  const [formDueDate, setFormDueDate] = useState("")
  const [formDueMileage, setFormDueMileage] = useState("")
  const [formNotes, setFormNotes] = useState("")

  const fetchReminders = async () => {
    setLoading(true)
    try {
      const data = await getServiceReminders(statusFilter || undefined)
      setReminders(data)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load reminders")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReminders()
  }, [statusFilter])

  const handleAdd = async () => {
    if (!formTitle.trim() || !formCustomerId.trim()) {
      toast.error("Title and customer are required")
      return
    }
    setSaving(true)
    try {
      await createServiceReminder(
        Number(formCustomerId), undefined, formType, formTitle.trim(), user?.id ?? 0,
        formDescription || undefined, formDueDate || undefined,
        formDueMileage ? Number(formDueMileage) : undefined,
        formNotes || undefined,
      )
      toast.success("Reminder created")
      setDialogOpen(false)
      resetForm()
      fetchReminders()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create reminder")
    } finally {
      setSaving(false)
    }
  }

  const handleComplete = async (id: number) => {
    try {
      await updateServiceReminderStatus(id, "completed", user?.id ?? 0)
      toast.success("Reminder completed")
      fetchReminders()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update reminder")
    }
  }

  const resetForm = () => {
    setFormCustomerId("")
    setFormTitle("")
    setFormType("oil_change")
    setFormDescription("")
    setFormDueDate("")
    setFormDueMileage("")
    setFormNotes("")
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="warning">{t("pending")}</Badge>
      case "completed": return <Badge variant="success">{t("completed")}</Badge>
      case "overdue": return <Badge variant="destructive">{t("overdue")}</Badge>
      default: return <Badge>{status}</Badge>
    }
  }

  const isOverdue = (r: ServiceReminder) => {
    if (r.status === "completed") return false
    if (r.dueDate && new Date(r.dueDate) < new Date()) return true
    return false
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("reminders")}
        description="Manage service reminders"
        actions={
          <Button size="sm" onClick={() => { resetForm(); setDialogOpen(true) }}>
            <Plus className="h-4 w-4 mr-1" /> {t("addReminder")}
          </Button>
        }
      />

      <div className="flex gap-2">
        {["", "pending", "completed", "overdue"].map((s) => (
          <Button
            key={s}
            variant={statusFilter === s ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(s)}
          >
            {s === "" ? "All" : t(s === "overdue" ? "overdue" : s)}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0 overflow-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Title</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("customer")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("vehicle")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("reminderType")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("dueDate")}</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">{t("dueMileage")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("status")}</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b last:border-0">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : reminders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">{t("noResults")}</td>
                </tr>
              ) : (
                reminders.map((r) => {
                  const overdue = isOverdue(r)
                  return (
                    <tr
                      key={r.id}
                      className={`border-b last:border-0 hover:bg-muted/30 transition-colors ${overdue ? "bg-red-50/50 dark:bg-red-950/10" : ""}`}
                    >
                      <td className="px-4 py-3 text-sm font-medium">
                        <div className="flex items-center gap-2">
                          {overdue && <AlertTriangle className="h-3.5 w-3.5 text-destructive" />}
                          {r.title}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{r.customerName || `#${r.customerId}`}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{r.vehicleInfo || "-"}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-xs">{r.reminderType}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {r.dueDate ? new Date(r.dueDate).toLocaleDateString() : "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-muted-foreground">
                        {r.dueMileage ? `${r.dueMileage.toLocaleString()} km` : "-"}
                      </td>
                      <td className="px-4 py-3">{statusBadge(overdue ? "overdue" : r.status)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          {r.status !== "completed" && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={() => handleComplete(r.id)}>
                              <CheckCircle className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={() => { setDialogOpen(false); resetForm() }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("addReminder")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Customer ID *</Label>
                <Input type="number" value={formCustomerId} onChange={(e) => setFormCustomerId(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>{t("reminderType")}</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                >
                  <option value="oil_change">Oil Change</option>
                  <option value="tire_rotation">Tire Rotation</option>
                  <option value="brake_inspection">Brake Inspection</option>
                  <option value="maintenance">General Maintenance</option>
                  <option value="registration">Registration</option>
                  <option value="inspection">Inspection</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Title *</Label>
              <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>{t("dueDate")}</Label>
                <Input type="date" value={formDueDate} onChange={(e) => setFormDueDate(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>{t("dueMileage")}</Label>
                <Input type="number" value={formDueMileage} onChange={(e) => setFormDueMileage(e.target.value)} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Notes</Label>
              <Textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm() }}>{t("cancel")}</Button>
            <Button onClick={handleAdd} disabled={saving}>{saving ? "Saving..." : t("save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
