import { useTranslation } from "react-i18next"
import { Plus, Download } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SearchBar } from "@/components/search-bar"

const suppliers = [
  { name: "AutoParts Co.", contact: "David Lee", phone: "(555) 111-2222", email: "david@autoparts.com", products: 342, status: "active" },
  { name: "OEM Direct", contact: "Karen White", phone: "(555) 333-4444", email: "karen@oemdirect.com", products: 218, status: "active" },
  { name: "BrakeMaster Inc.", contact: "Robert Chen", phone: "(555) 555-6666", email: "robert@brakemaster.com", products: 89, status: "active" },
  { name: "FilterPro Supply", contact: "Maria Garcia", phone: "(555) 777-8888", email: "maria@filterpro.com", products: 156, status: "active" },
  { name: "EngineParts Global", contact: "James Wilson", phone: "(555) 999-0000", email: "james@engineparts.com", products: 425, status: "inactive" },
]

export function SuppliersPage() {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("suppliers.title")}
        description={t("suppliers.description")}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" /> {t("common.export")}</Button>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> {t("suppliers.addSupplier")}</Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">{t("suppliers.totalSuppliers")}</p><p className="text-2xl font-bold">24</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">{t("suppliers.activeSuppliers")}</p><p className="text-2xl font-bold">21</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">{t("suppliers.productsSourced")}</p><p className="text-2xl font-bold">1,230</p></CardContent></Card>
      </div>

      <div className="flex items-center gap-2">
        <SearchBar placeholder={t("suppliers.searchSuppliers")} className="w-64" />
      </div>

      <Card>
        <CardContent className="p-0 overflow-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("suppliers.supplierName")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("suppliers.contactPerson")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("suppliers.phone")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("suppliers.email")}</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">{t("suppliers.products")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("suppliers.status")}</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => (
                <tr key={s.name} className="border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer">
                  <td className="px-4 py-3 text-sm font-medium">{s.name}</td>
                  <td className="px-4 py-3 text-sm">{s.contact}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{s.phone}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{s.email}</td>
                  <td className="px-4 py-3 text-sm text-center">{s.products}</td>
                  <td className="px-4 py-3"><Badge variant={s.status === "active" ? "success" : "secondary"}>{s.status === "active" ? t("suppliers.active") : t("suppliers.inactive")}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
