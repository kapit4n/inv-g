import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { Plus, Search, Edit, Archive, Phone, Mail, MapPin } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import toast from "react-hot-toast"
import {
  getCustomers, createCustomer, updateCustomer, archiveCustomer,
} from "@/lib/tauri"
import type { Customer } from "@/types"

export function CrmCustomersPage() {
  const { t } = useTranslation("crm")
  const navigate = useNavigate()

  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null)
  const [saving, setSaving] = useState(false)

  const [formName, setFormName] = useState("")
  const [formEmail, setFormEmail] = useState("")
  const [formPhone, setFormPhone] = useState("")
  const [formAddress, setFormAddress] = useState("")
  const [formCity, setFormCity] = useState("")
  const [formState, setFormState] = useState("")
  const [formPostalCode, setFormPostalCode] = useState("")
  const [formCountry, setFormCountry] = useState("")
  const [formNotes, setFormNotes] = useState("")

  const activeCount = customers.filter((c) => c.isActive).length

  const fetchCustomers = async (q?: string) => {
    setLoading(true)
    try {
      const data = await getCustomers(q || undefined)
      setCustomers(data)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load customers")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const resetForm = () => {
    setFormName("")
    setFormEmail("")
    setFormPhone("")
    setFormAddress("")
    setFormCity("")
    setFormState("")
    setFormPostalCode("")
    setFormCountry("")
    setFormNotes("")
    setEditCustomer(null)
  }

  const openAddDialog = () => {
    resetForm()
    setDialogOpen(true)
  }

  const openEditDialog = (c: Customer) => {
    setEditCustomer(c)
    setFormName(c.name)
    setFormEmail(c.email || "")
    setFormPhone(c.phone || "")
    setFormAddress(c.address || "")
    setFormCity(c.city || "")
    setFormState(c.state || "")
    setFormPostalCode(c.postalCode || "")
    setFormCountry(c.country || "")
    setFormNotes(c.notes || "")
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formName.trim()) {
      toast.error("Name is required")
      return
    }
    setSaving(true)
    try {
      if (editCustomer) {
        await updateCustomer(
          editCustomer.id, formName.trim(),
          formEmail || undefined, formPhone || undefined,
          formAddress || undefined, formCity || undefined,
          formState || undefined, formPostalCode || undefined,
          formCountry || undefined, formNotes || undefined,
        )
        toast.success("Customer updated")
      } else {
        await createCustomer(
          formName.trim(),
          formEmail || undefined, formPhone || undefined,
          formAddress || undefined, formCity || undefined,
          formState || undefined, formPostalCode || undefined,
          formCountry || undefined, formNotes || undefined,
        )
        toast.success("Customer created")
      }
      setDialogOpen(false)
      resetForm()
      fetchCustomers(search)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Operation failed")
    } finally {
      setSaving(false)
    }
  }

  const handleArchive = async (id: number) => {
    try {
      await archiveCustomer(id)
      toast.success("Customer archived")
      fetchCustomers(search)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to archive customer")
    }
  }

  const customerType = (c: Customer) => {
    if ((c as any).type) return (c as any).type as string
    return "regular"
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("customers")}
        description={`${t("totalCustomers")}: ${customers.length}`}
        actions={
          <Button size="sm" onClick={openAddDialog}>
            <Plus className="h-4 w-4 mr-1" /> {t("newCustomer")}
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-normal">
              {t("totalCustomers")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {loading ? <Skeleton className="h-8 w-16" /> : customers.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-normal">
              {t("activeCustomers")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {loading ? <Skeleton className="h-8 w-16" /> : activeCount}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("searchCustomers")}
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0 overflow-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("name")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("email")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("phone")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("city")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("type")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("status")}</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b last:border-0">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    {t("noResults")}
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td
                      className="px-4 py-3 text-sm font-medium text-primary cursor-pointer hover:underline"
                      onClick={() => navigate(`/crm/customers/${c.id}`)}
                    >
                      {c.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {c.email || "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {c.phone || "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {c.city || "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-xs">
                        {customerType(c)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={c.isActive ? "success" : "secondary"}>
                        {c.isActive ? t("active") : t("inactive")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(c)}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleArchive(c.id)}>
                          <Archive className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setDialogOpen(false); resetForm() } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editCustomer ? t("editCustomer") : t("newCustomer")}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">{t("name")} *</Label>
              <Input id="name" value={formName} onChange={(e) => setFormName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">{t("email")}</Label>
                <Input id="email" type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">{t("phone")}</Label>
                <Input id="phone" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">{t("address")}</Label>
              <Input id="address" value={formAddress} onChange={(e) => setFormAddress(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="city">{t("city")}</Label>
                <Input id="city" value={formCity} onChange={(e) => setFormCity(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="state">{t("state")}</Label>
                <Input id="state" value={formState} onChange={(e) => setFormState(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="postalCode">{t("postalCode")}</Label>
                <Input id="postalCode" value={formPostalCode} onChange={(e) => setFormPostalCode(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="country">{t("country")}</Label>
                <Input id="country" value={formCountry} onChange={(e) => setFormCountry(e.target.value)} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">{t("notes")}</Label>
              <Textarea id="notes" value={formNotes} onChange={(e) => setFormNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm() }}>
              {t("cancel")}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? t("saving") : t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
