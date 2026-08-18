import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Plus, ShieldAlert } from "lucide-react"
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
import { getWarranties, createWarranty, updateWarrantyStatus } from "@/lib/tauri"
import type { Warranty } from "@/types"

export function CrmWarrantiesPage() {
  const { t } = useTranslation("crm")
  const user = useAuthStore((s) => s.user)
  const [warranties, setWarranties] = useState<Warranty[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formCustomerId, setFormCustomerId] = useState("")
  const [formProductId, setFormProductId] = useState("")
  const [formWarrantyType, setFormWarrantyType] = useState("standard")
  const [formPeriodMonths, setFormPeriodMonths] = useState("12")
  const [formStartDate, setFormStartDate] = useState("")
  const [formNotes, setFormNotes] = useState("")

  const fetchWarranties = async () => {
    setLoading(true)
    try {
      const data = await getWarranties(undefined, statusFilter || undefined)
      setWarranties(data)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load warranties")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWarranties()
  }, [statusFilter])

  const handleAdd = async () => {
    if (!formCustomerId.trim() || !formStartDate) {
      toast.error("Customer and start date are required")
      return
    }
    setSaving(true)
    try {
      await createWarranty(
        Number(formCustomerId), formWarrantyType,
        Number(formPeriodMonths), formStartDate, user?.id ?? 0,
        undefined, formProductId ? Number(formProductId) : undefined,
        undefined, formNotes || undefined,
      )
      toast.success("Warranty registered")
      setDialogOpen(false)
      resetForm()
      fetchWarranties()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to register warranty")
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await updateWarrantyStatus(id, status)
      toast.success(`Warranty ${status}`)
      fetchWarranties()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update warranty")
    }
  }

  const resetForm = () => {
    setFormCustomerId("")
    setFormProductId("")
    setFormWarrantyType("standard")
    setFormPeriodMonths("12")
    setFormStartDate("")
    setFormNotes("")
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge variant="success">Active</Badge>
      case "expired": return <Badge variant="destructive">Expired</Badge>
      case "pending": return <Badge variant="warning">Pending</Badge>
      case "void": return <Badge variant="secondary">Void</Badge>
      default: return <Badge>{status}</Badge>
    }
  }

  const isExpiringSoon = (w: Warranty) => {
    if (w.status !== "active") return false
    const expDate = new Date(w.expirationDate)
    const now = new Date()
    const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays > 0 && diffDays <= 30
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("warranties")}
        description="Manage product warranties"
        actions={
          <Button size="sm" onClick={() => { resetForm(); setDialogOpen(true) }}>
            <Plus className="h-4 w-4 mr-1" /> {t("registerWarranty")}
          </Button>
        }
      />

      <div className="flex gap-2">
        {["", "active", "expired", "pending"].map((s) => (
          <Button
            key={s}
            variant={statusFilter === s ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(s)}
          >
            {s === "" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0 overflow-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("warrantyNumber")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("customer")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("product")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("vehicle")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("warrantyType")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Start</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("expirationDate")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("status")}</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b last:border-0">
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : warranties.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-sm text-muted-foreground">{t("noResults")}</td>
                </tr>
              ) : (
                warranties.map((w) => {
                  const expiringSoon = isExpiringSoon(w)
                  return (
                    <tr
                      key={w.id}
                      className={`border-b last:border-0 hover:bg-muted/30 transition-colors ${expiringSoon ? "bg-amber-50/50 dark:bg-amber-950/10" : ""}`}
                    >
                      <td className="px-4 py-3 text-sm font-medium">
                        <div className="flex items-center gap-2">
                          {expiringSoon && <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />}
                          {w.warrantyNumber}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{w.customerName || `#${w.customerId}`}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{w.productName || "-"}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{w.vehicleInfo || "-"}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-xs">{w.warrantyType}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(w.startDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {new Date(w.expirationDate).toLocaleDateString()}
                        {expiringSoon && <Badge variant="warning" className="ml-2 text-xs">Expiring soon</Badge>}
                      </td>
                      <td className="px-4 py-3">{statusBadge(w.status)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          {w.status === "active" && (
                            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => handleStatusChange(w.id, "expired")}>
                              Expire
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
            <DialogTitle>{t("registerWarranty")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Customer ID *</Label>
                <Input type="number" value={formCustomerId} onChange={(e) => setFormCustomerId(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Product ID</Label>
                <Input type="number" value={formProductId} onChange={(e) => setFormProductId(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>{t("warrantyType")}</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  value={formWarrantyType}
                  onChange={(e) => setFormWarrantyType(e.target.value)}
                >
                  <option value="standard">Standard</option>
                  <option value="extended">Extended</option>
                  <option value="premium">Premium</option>
                  <option value="manufacturer">Manufacturer</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label>Period (months)</Label>
                <Input type="number" value={formPeriodMonths} onChange={(e) => setFormPeriodMonths(e.target.value)} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Start Date *</Label>
              <Input type="date" value={formStartDate} onChange={(e) => setFormStartDate(e.target.value)} />
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
