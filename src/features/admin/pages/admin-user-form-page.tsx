import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { getAdminUser, getAdminRoles, createAdminUser, updateAdminUser } from "@/lib/tauri"

export function AdminUserFormPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id

  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [roles, setRoles] = useState<{ id: number; name: string }[]>([])
  const [form, setForm] = useState({
    username: "", email: "", password: "", fullName: "", phone: "", roleId: 0, notes: "",
  })

  useEffect(() => {
    getAdminRoles().then(setRoles)
    if (isEdit) {
      getAdminUser(Number(id)).then((u) => {
        setForm({ username: u.username, email: u.email, password: "", fullName: u.fullName, phone: u.phone || "", roleId: u.roleId || 0, notes: u.notes || "" })
        setLoading(false)
      })
    }
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (isEdit) {
        await updateAdminUser({ id: Number(id), username: form.username, email: form.email, fullName: form.fullName, phone: form.phone || undefined, roleId: form.roleId || undefined, notes: form.notes || undefined })
      } else {
        await createAdminUser({ username: form.username, email: form.email, password: form.password, fullName: form.fullName, phone: form.phone || undefined, roleId: form.roleId || undefined, notes: form.notes || undefined }, 1)
      }
      navigate("/admin/users")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="space-y-4 p-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{isEdit ? t("admin.users.edit") : t("admin.users.create")}</h1>
        <p className="text-sm text-muted-foreground">{isEdit ? `Editing user #${id}` : "Create a new system user"}</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader><CardTitle className="text-base">{t("admin.users.title")}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("admin.users.username")} *</Label>
                <Input required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{t("admin.users.fullName")} *</Label>
                <Input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{t("admin.users.email")} *</Label>
                <Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              {!isEdit && (
                <div className="space-y-2">
                  <Label>{t("admin.users.password")} *</Label>
                  <Input type="password" required={!isEdit} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                </div>
              )}
              <div className="space-y-2">
                <Label>{t("admin.users.phone")}</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{t("admin.users.role")}</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.roleId} onChange={(e) => setForm({ ...form, roleId: Number(e.target.value) })}>
                  <option value={0}>{t("admin.users.selectRole")}</option>
                  {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("admin.users.notes")}</Label>
              <textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" type="button" onClick={() => navigate("/admin/users")}>{t("common.cancel")}</Button>
          <Button type="submit" disabled={saving}>{saving ? t("common.saving") : t("common.save")}</Button>
        </div>
      </form>
    </div>
  )
}