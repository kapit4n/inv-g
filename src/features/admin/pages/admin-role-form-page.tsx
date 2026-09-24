import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { getAdminRole, getAllPermissions, createAdminRole, updateAdminRole } from "@/lib/tauri"
import type { AdminPermission } from "@/types"

export function AdminRoleFormPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id

  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [permissions, setPermissions] = useState<AdminPermission[]>([])
  const [selectedKeys, setSelectedKeys] = useState<string[]>([])
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")

  useEffect(() => {
    getAllPermissions().then(setPermissions)
    if (isEdit) {
      getAdminRole(Number(id)).then((r) => {
        setName(r.role.name)
        setDescription(r.role.description || "")
        setSelectedKeys(r.permissions)
        setLoading(false)
      })
    }
  }, [id])

  const grouped = permissions.reduce<Record<string, AdminPermission[]>>((acc, p) => {
    (acc[p.groupName] ??= []).push(p)
    return acc
  }, {})

  const togglePermission = (key: string) => {
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  const toggleGroup = (groupPerms: AdminPermission[], checked: boolean) => {
    const groupKeys = groupPerms.map((p) => p.key)
    if (checked) {
      setSelectedKeys((prev) => [...new Set([...prev, ...groupKeys])])
    } else {
      setSelectedKeys((prev) => prev.filter((k) => !groupKeys.includes(k)))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (isEdit) {
        await updateAdminRole({ id: Number(id), name, description: description || undefined, permissions: selectedKeys })
      } else {
        await createAdminRole({ name, description: description || undefined, permissions: selectedKeys })
      }
      navigate("/admin/roles")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="space-y-4 p-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{isEdit ? t("admin.roles.edit") : t("admin.roles.create")}</h1>
        <p className="text-sm text-muted-foreground">{isEdit ? t("admin.roles.editing", { id }) : t("admin.roles.createNew")}</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader><CardTitle className="text-base">{t("admin.roles.details")}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("admin.roles.name")} *</Label>
                <Input required value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("admin.roles.description")}</Label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">{t("admin.roles.permissionMatrix")}</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.entries(grouped).map(([group, perms]) => {
              const allSelected = perms.every((p) => selectedKeys.includes(p.key))
              const someSelected = perms.some((p) => selectedKeys.includes(p.key))
              return (
                <div key={group} className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Checkbox
                      id={`group-${group}`}
                      checked={allSelected}
                      indeterminate={someSelected && !allSelected}
                      onCheckedChange={(checked) => toggleGroup(perms, checked === true)}
                    />
                    <Label htmlFor={`group-${group}`} className="font-medium capitalize">{group}</Label>
                  </div>
                  <div className="ml-6 grid grid-cols-2 md:grid-cols-3 gap-2">
                    {perms.map((perm) => (
                      <div key={perm.key} className="flex items-center gap-2">
                        <Checkbox
                          id={perm.key}
                          checked={selectedKeys.includes(perm.key)}
                          onCheckedChange={() => togglePermission(perm.key)}
                        />
                        <Label htmlFor={perm.key} className="text-sm cursor-pointer">{perm.name}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" type="button" onClick={() => navigate("/admin/roles")}>{t("common.cancel")}</Button>
          <Button type="submit" disabled={saving}>{saving ? t("common.saving") : t("common.save")}</Button>
        </div>
      </form>
    </div>
  )
}