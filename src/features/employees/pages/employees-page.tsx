import { useTranslation } from "react-i18next"
import { Plus, Download } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function EmployeesPage() {
  const { t } = useTranslation()

  const employees = [
    { name: "Admin User", roleKey: "employees.administrator", email: "admin@inventorygear.com", status: "active", lastActive: t("common.today") },
    { name: "John Smith", roleKey: "employees.salesAssociate", email: "john@inventorygear.com", status: "active", lastActive: t("common.yesterday") },
    { name: "Emily Davis", roleKey: "employees.inventoryManager", email: "emily@inventorygear.com", status: "active", lastActive: "2 hours" },
    { name: "Carlos Ruiz", roleKey: "employees.warehouseStaff", email: "carlos@inventorygear.com", status: "inactive", lastActive: "3 days" },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("employees.title")}
        description={t("employees.description")}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" /> {t("common.export")}</Button>
            <Button size="sm" disabled><Plus className="h-4 w-4 mr-1" /> {t("employees.addEmployee")}</Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">{t("employees.totalEmployees")}</p><p className="text-2xl font-bold">4</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">{t("employees.activeEmployees")}</p><p className="text-2xl font-bold">3</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">{t("employees.roles")}</p><p className="text-2xl font-bold">4</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-0 overflow-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("employees.employee")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("employees.role")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("employees.email")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("employees.lastActive")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("employees.status")}</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => (
                <tr key={e.email} className="border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer">
                  <td className="px-4 py-3 text-sm font-medium">{e.name}</td>
                  <td className="px-4 py-3 text-sm">{t(e.roleKey)}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{e.email}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{e.lastActive}</td>
                  <td className="px-4 py-3"><Badge variant={e.status === "active" ? "success" : "secondary"}>{e.status === "active" ? t("employees.active") : t("employees.inactive")}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
