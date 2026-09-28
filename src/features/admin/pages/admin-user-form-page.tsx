import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import toast from "react-hot-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TextField } from "@/components/forms/text-field"
import { EmailField } from "@/components/forms/email-field"
import { SelectField } from "@/components/forms/select-field"
import { TextareaField } from "@/components/forms/textarea-field"
import { Skeleton } from "@/components/ui/skeleton"
import { PermissionGuard } from "@/components/permission-guard"
import { getAdminUser, getAdminRoles, createAdminUser, updateAdminUser } from "@/lib/tauri"
import { validateUserForm, hasErrors, translateUserSaveError } from "@/lib/validation/user-form"
import type { ValidationIssue } from "@/lib/validation/user-form"
import { useAuthStore } from "@/stores"

export function AdminUserFormPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id
  const currentUserId = useAuthStore((s) => s.user?.id ?? 0)

  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [roles, setRoles] = useState<{ id: number; name: string }[]>([])
  const [form, setForm] = useState({
    username: "", email: "", fullName: "", phone: "", roleId: 0, notes: "",
  })
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, ValidationIssue>>>({})

  useEffect(() => {
    getAdminRoles().then(setRoles)
    if (isEdit) {
      getAdminUser(Number(id)).then((u) => {
        setForm({ username: u.username, email: u.email, fullName: u.fullName, phone: u.phone || "", roleId: u.roleId || 0, notes: u.notes || "" })
        setLoading(false)
      })
    }
  }, [id])

  /**
   * Clears one field's error as soon as it is edited. Re-running the whole
   * validator on every keystroke instead would flag the untouched fields while
   * the user is still halfway through the first one.
   */
  const setField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const found = validateUserForm(form)
    setErrors(found)
    if (hasErrors(found)) return

    setSaving(true)
    try {
      const payload = {
        username: form.username.trim(),
        email: form.email.trim(),
        fullName: form.fullName.trim(),
        phone: form.phone.trim() || undefined,
        roleId: form.roleId,
        notes: form.notes.trim() || undefined,
      }
      if (isEdit) {
        await updateAdminUser({ id: Number(id), ...payload })
      } else {
        await createAdminUser({ ...payload, password: "CHANGEPASSWORD" }, currentUserId)
      }
      navigate("/admin/users")
    } catch (err) {
      // The backend has no duplicate check of its own, so a collision arrives as
      // rusqlite's `UNIQUE constraint failed: users.username`. Show the field's
      // own message instead of that.
      const issue = translateUserSaveError(err instanceof Error ? err.message : String(err))
      if (issue.key.startsWith("validation.")) {
        const field = issue.key.includes("email")
          ? "email"
          : issue.key.includes("role")
            ? "roleId"
            : "username"
        setErrors({ [field]: issue })
      } else {
        toast.error(issue.key)
      }
      setSaving(false)
    }
  }

  if (loading) return <div className="space-y-4 p-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>

  const noPermission = (
    <div className="flex h-full items-center justify-center p-6">
      <Card><CardContent className="p-6 text-sm text-muted-foreground">{t("admin.users.noPermission")}</CardContent></Card>
    </div>
  )

  return (
    <PermissionGuard permission="admin.users.manage" fallback={noPermission}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{isEdit ? t("admin.users.edit") : t("admin.users.create")}</h1>
          <p className="text-sm text-muted-foreground">{isEdit ? `Editing user #${id}` : "Create a new system user"}</p>
        </div>

        {/*
          `noValidate` is deliberate. With the native `required` attribute left
          on, the browser refuses to fire `submit` and shows its own bubble --
          and a Tauri webview renders no bubble at all, so Save would silently do
          nothing. Validation below owns the messaging and it is translated.
        */}
        <form onSubmit={handleSubmit} noValidate>
          <Card>
            <CardHeader><CardTitle className="text-base">{t("admin.users.title")}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {!isEdit && (
                <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  {t("admin.users.defaultPasswordNotice")}
                </p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label={t("admin.users.username")}
                  name="username"
                  required
                  value={form.username}
                  onChange={(e) => setField("username", e.target.value)}
                  error={errors.username && t(errors.username.key, errors.username.params)}
                  autoComplete="off"
                />
                <TextField
                  label={t("admin.users.fullName")}
                  name="fullName"
                  required
                  value={form.fullName}
                  onChange={(e) => setField("fullName", e.target.value)}
                  error={errors.fullName && t(errors.fullName.key, errors.fullName.params)}
                />
                <EmailField
                  label={t("admin.users.email")}
                  name="email"
                  required
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                  error={errors.email && t(errors.email.key, errors.email.params)}
                />
                <TextField
                  label={t("admin.users.phone")}
                  name="phone"
                  value={form.phone}
                  onChange={(e) => setField("phone", e.target.value)}
                  error={errors.phone && t(errors.phone.key, errors.phone.params)}
                />
                <SelectField
                  label={t("admin.users.role")}
                  name="roleId"
                  required
                  value={form.roleId}
                  onChange={(value) => setField("roleId", Number(value))}
                  placeholder={t("admin.users.selectRole")}
                  options={roles.map((r) => ({ label: r.name, value: r.id }))}
                  error={errors.roleId && t(errors.roleId.key, errors.roleId.params)}
                />
              </div>
              <TextareaField
                label={t("admin.users.notes")}
                name="notes"
                value={form.notes}
                onChange={(e) => setField("notes", e.target.value)}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" type="button" onClick={() => navigate("/admin/users")}>{t("common.cancel")}</Button>
            <Button type="submit" disabled={saving}>{saving ? t("common.saving") : t("common.save")}</Button>
          </div>
        </form>
      </div>
    </PermissionGuard>
  )
}