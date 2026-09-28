import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Plus, Search, Edit, Archive, RotateCcw, KeyRound } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { TextField } from "@/components/forms/text-field"
import { EmailField } from "@/components/forms/email-field"
import { SelectField } from "@/components/forms/select-field"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { PermissionGuard } from "@/components/permission-guard"
import toast from "react-hot-toast"
import {
  getAdminUsers,
  getAdminRoles,
  createAdminUser,
  updateAdminUser,
  archiveAdminUser,
  restoreAdminUser,
  resetUserPassword,
} from "@/lib/tauri"
import { validateUserForm, hasErrors, translateUserSaveError } from "@/lib/validation/user-form"
import type { UserFormErrors } from "@/lib/validation/user-form"
import { useAuthStore } from "@/stores"
import type { AdminUser, AdminRole } from "@/types"

export function EmployeesPage() {
  const { t } = useTranslation()
  const currentUserId = useAuthStore((s) => s.user?.id ?? 0)

  const [users, setUsers] = useState<AdminUser[]>([])
  const [roles, setRoles] = useState<AdminRole[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editUser, setEditUser] = useState<AdminUser | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ username: "", fullName: "", email: "", phone: "", roleId: 0 })

  const [resetTarget, setResetTarget] = useState<AdminUser | null>(null)
  const [resetting, setResetting] = useState(false)
  const [errors, setErrors] = useState<UserFormErrors>({})

  const activeCount = users.filter((u) => u.isActive).length

  const fetchUsers = async (q?: string) => {
    setLoading(true)
    try {
      const data = await getAdminUsers(q || undefined, undefined, undefined, 1, 200)
      setUsers(data)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("employees.loadFailed"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
    getAdminRoles()
      .then(setRoles)
      .catch(() => setRoles([]))
  }, [])

  // Debounce the search box; skip the initial run so the mount effect above
  // does not issue a second identical query.
  const skipFirstSearch = useRef(true)
  useEffect(() => {
    if (skipFirstSearch.current) {
      skipFirstSearch.current = false
      return
    }
    const timer = setTimeout(() => fetchUsers(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const resetForm = () => {
    setForm({ username: "", fullName: "", email: "", phone: "", roleId: 0 })
    setEditUser(null)
    setErrors({})
  }

  const openAddDialog = () => {
    resetForm()
    setDialogOpen(true)
  }

  const openEditDialog = (u: AdminUser) => {
    setEditUser(u)
    setForm({
      username: u.username,
      fullName: u.fullName,
      email: u.email,
      phone: u.phone || "",
      roleId: u.roleId || 0,
    })
    setErrors({})
    setDialogOpen(true)
  }

  /**
   * Clears one field's error as soon as it is edited, so the untouched fields
   * are not flagged while the user is still filling in the first one.
   */
  const setField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev))
  }

  const handleSave = async () => {
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
      }
      if (editUser) {
        await updateAdminUser({ id: editUser.id, ...payload })
        toast.success(t("employees.updated"))
      } else {
        await createAdminUser(
          { ...payload, password: "CHANGEPASSWORD" },
          currentUserId,
        )
        toast.success(t("employees.created"))
      }
      setDialogOpen(false)
      resetForm()
      fetchUsers(search)
    } catch (e) {
      // The backend runs a raw INSERT with no duplicate check, so a collision
      // arrives as rusqlite's `UNIQUE constraint failed: users.username`.
      const issue = translateUserSaveError(e instanceof Error ? e.message : String(e))
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
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (u: AdminUser) => {
    try {
      if (u.isActive) {
        await archiveAdminUser(u.id)
        toast.success(t("employees.disabled"))
      } else {
        await restoreAdminUser(u.id)
        toast.success(t("employees.enabled"))
      }
      fetchUsers(search)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Operation failed")
    }
  }

  /**
   * Puts the account back on the shared default password and re-arms the forced
   * first change, so the employee lands on the change-password screen at the
   * next sign-in exactly like a new account. A blank password tells the backend
   * to use the default; the constant itself stays in one place.
   */
  const handleResetPassword = async () => {
    if (!resetTarget) return
    setResetting(true)
    try {
      await resetUserPassword(resetTarget.id, "", true, currentUserId)
      toast.success(t("employees.passwordReset"))
      setResetTarget(null)
      fetchUsers(search)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("employees.passwordResetFailed"))
    } finally {
      setResetting(false)
    }
  }

  const noPermission = (
    <div className="flex h-full items-center justify-center p-6">
      <Card><CardContent className="p-6 text-sm text-muted-foreground">{t("employees.noPermission")}</CardContent></Card>
    </div>
  )

  return (
    <PermissionGuard permission="admin.users.manage" fallback={noPermission}>
      <div className="space-y-6">
        <PageHeader
          title={t("employees.title")}
          description={t("employees.description")}
          actions={
            <Button size="sm" onClick={openAddDialog}>
              <Plus className="h-4 w-4 mr-1" /> {t("employees.addEmployee")}
            </Button>
          }
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground font-normal">{t("employees.totalEmployees")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : users.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground font-normal">{t("employees.activeEmployees")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : activeCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground font-normal">{t("employees.roles")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : roles.length}</p>
            </CardContent>
          </Card>
        </div>

        <div className="relative w-64 max-w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("employees.searchEmployees")}
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Card>
          <CardContent className="p-0 overflow-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("employees.employee")}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("employees.role")}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("employees.email")}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("employees.lastLogin")}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("employees.status")}</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b last:border-0">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                      ))}
                    </tr>
                  ))
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                      {t("employees.noEmployees")}
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium">{u.fullName}</p>
                        <p className="text-xs text-muted-foreground">{u.username}</p>
                        {u.passwordChangeRequired && (
                          <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                            {t("employees.mustChangePassword")}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">{u.roleName || "-"}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{u.email}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{u.lastLoginAt || "-"}</td>
                      <td className="px-4 py-3">
                        <Badge variant={u.isActive ? "success" : "secondary"}>
                          {u.isActive ? t("employees.active") : t("employees.inactive")}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(u)} title={t("employees.editEmployee")}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setResetTarget(u)} title={t("employees.resetPassword")}>
                            <KeyRound className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-8 w-8 ${u.isActive ? "text-destructive" : ""}`}
                            onClick={() => handleToggleActive(u)}
                            title={u.isActive ? t("employees.disable") : t("employees.enable")}
                          >
                            {u.isActive ? <Archive className="h-3.5 w-3.5" /> : <RotateCcw className="h-3.5 w-3.5" />}
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
              <DialogTitle>{editUser ? t("employees.editEmployee") : t("employees.addEmployee")}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {!editUser && (
              <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                  {t("employees.defaultPasswordNotice")}
                </p>
              )}
              <div className="grid grid-cols-2 gap-4">
                <TextField
                  label={t("employees.username")}
                  name="username"
                  required
                  value={form.username}
                  onChange={(e) => setField("username", e.target.value)}
                  error={errors.username && t(errors.username.key, errors.username.params)}
                  autoComplete="off"
                />
                <TextField
                  label={t("employees.fullName")}
                  name="fullName"
                  required
                  value={form.fullName}
                  onChange={(e) => setField("fullName", e.target.value)}
                  error={errors.fullName && t(errors.fullName.key, errors.fullName.params)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <EmailField
                  label={t("employees.email")}
                  name="email"
                  required
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                  error={errors.email && t(errors.email.key, errors.email.params)}
                />
                <TextField
                  label={t("employees.phone")}
                  name="phone"
                  value={form.phone}
                  onChange={(e) => setField("phone", e.target.value)}
                  error={errors.phone && t(errors.phone.key, errors.phone.params)}
                />
              </div>
              <SelectField
                label={t("employees.role")}
                name="roleId"
                required
                value={form.roleId}
                onChange={(value) => setField("roleId", Number(value))}
                placeholder={t("employees.selectRole")}
                options={roles.map((r) => ({ label: r.name, value: r.id }))}
                error={errors.roleId && t(errors.roleId.key, errors.roleId.params)}
                description={t("employees.roleRequiredHint")}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm() }}>
                {t("common.cancel")}
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? t("common.saving") : t("common.save")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={resetTarget !== null} onOpenChange={(open) => { if (!open) setResetTarget(null) }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t("employees.resetPassword")}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <p className="text-sm text-muted-foreground">
                {t("employees.resetPasswordConfirm", { name: resetTarget?.fullName || "" })}
              </p>
              <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                {t("employees.resetPasswordNotice", { name: resetTarget?.fullName || "" })}
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setResetTarget(null)}>
                {t("common.cancel")}
              </Button>
              <Button onClick={handleResetPassword} disabled={resetting}>
                {resetting ? t("common.saving") : t("common.confirm")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PermissionGuard>
  )
}