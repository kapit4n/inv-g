import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Plus, Search, MoreHorizontal } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { getAdminRoles, cloneAdminRole, archiveAdminRole } from "@/lib/tauri"
import type { AdminRole } from "@/types"

export function AdminRolesPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [roles, setRoles] = useState<AdminRole[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  const loadRoles = () => {
    setLoading(true)
    getAdminRoles(search || undefined).then(setRoles).finally(() => setLoading(false))
  }

  useEffect(() => { loadRoles() }, [search])

  const handleClone = async (id: number, name: string) => {
    const newName = `${name} (${t("admin.roles.copySuffix")})`
    await cloneAdminRole(id, newName)
    loadRoles()
  }

  const handleArchive = async (id: number) => {
    await archiveAdminRole(id)
    loadRoles()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("admin.roles.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("admin.roles.description")}</p>
        </div>
        <Button onClick={() => navigate("/admin/roles/new")}>
          <Plus className="mr-2 h-4 w-4" /> {t("admin.roles.create")}
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{t("admin.roles.list")}</CardTitle>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("admin.roles.searchRoles")}
                className="pl-8 w-64"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : roles.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">{t("admin.roles.noRoles")}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("admin.roles.name")}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("admin.roles.description")}</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">{t("admin.roles.isSystem")}</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">{t("admin.roles.usersCount")}</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">{t("admin.roles.permissions")}</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">{t("common.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map((role) => (
                    <tr key={role.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium">{role.name}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{role.description || "-"}</td>
                      <td className="px-4 py-3 text-center">
                        {role.isSystem ? <Badge variant="secondary">{t("admin.roles.system")}</Badge> : <span className="text-muted-foreground">-</span>}
                      </td>
                      <td className="px-4 py-3 text-center text-sm">{role.userCount}</td>
                      <td className="px-4 py-3 text-center text-sm">{role.permissionCount}</td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/admin/roles/${role.id}/edit`)}>{t("admin.roles.edit")}</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleClone(role.id, role.name)}>{t("admin.roles.clone")}</DropdownMenuItem>
                            {!role.isSystem && (
                              <DropdownMenuItem onClick={() => handleArchive(role.id)}>{t("admin.roles.delete")}</DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
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