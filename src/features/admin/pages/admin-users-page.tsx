import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Plus, Search, Lock, Unlock, Archive, RotateCcw, KeyRound, MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { getAdminUsers, archiveAdminUser, restoreAdminUser, lockUserAccount, unlockUserAccount, resetUserPassword } from "@/lib/tauri"
import type { AdminUser } from "@/types"

export function AdminUsersPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)

  const loadUsers = () => {
    setLoading(true)
    getAdminUsers(search || undefined, undefined, undefined, page, 20)
      .then(setUsers)
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadUsers() }, [page, search])

  const handleArchive = async (id: number) => {
    await archiveAdminUser(id)
    loadUsers()
  }

  const handleRestore = async (id: number) => {
    await restoreAdminUser(id)
    loadUsers()
  }

  const handleLock = async (id: number) => {
    await lockUserAccount(id)
    loadUsers()
  }

  const handleUnlock = async (id: number) => {
    await unlockUserAccount(id)
    loadUsers()
  }

  const statusBadge = (user: AdminUser) => {
    if (!user.isActive) return <Badge variant="secondary">{t("admin.users.inactive")}</Badge>
    if (user.isLocked) return <Badge variant="destructive">{t("admin.users.locked")}</Badge>
    return <Badge variant="success">{t("admin.users.active")}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("admin.users.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("admin.users.description")}</p>
        </div>
        <Button onClick={() => navigate("/admin/users/new")}>
          <Plus className="mr-2 h-4 w-4" /> {t("admin.users.create")}
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{t("admin.users.list")}</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("admin.users.searchUsers")}
                  className="pl-8 w-64"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">{t("admin.users.noUsers")}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("admin.users.username")}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("admin.users.fullName")}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("admin.users.email")}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("admin.users.role")}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("admin.users.status")}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("admin.users.lastLogin")}</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">{t("common.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium">{user.username}</td>
                      <td className="px-4 py-3 text-sm">{user.fullName}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{user.email}</td>
                      <td className="px-4 py-3 text-sm">{user.roleName || "-"}</td>
                      <td className="px-4 py-3">{statusBadge(user)}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{user.lastLoginAt || "-"}</td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/admin/users/${user.id}/edit`)}>{t("admin.users.edit")}</DropdownMenuItem>
                            {user.isActive ? (
                              <DropdownMenuItem onClick={() => handleArchive(user.id)}>{t("admin.users.disable")}</DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleRestore(user.id)}>{t("admin.users.enable")}</DropdownMenuItem>
                            )}
                            {user.isLocked ? (
                              <DropdownMenuItem onClick={() => handleUnlock(user.id)}>{t("admin.users.unlock")}</DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleLock(user.id)}>{t("admin.users.lock")}</DropdownMenuItem>
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

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{users.length} users</p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">Page {page}</span>
          <Button variant="outline" size="icon" disabled={users.length < 20} onClick={() => setPage(p => p + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}