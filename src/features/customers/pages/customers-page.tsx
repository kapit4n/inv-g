import { useTranslation } from "react-i18next"
import { Plus, Download } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SearchBar } from "@/components/search-bar"

const customers = [
  { name: "Mike's Auto Repair", contact: "Mike Johnson", phone: "(555) 123-4567", email: "mike@mikesauto.com", totalPurchases: "$24,500", status: "active" },
  { name: "Quick Fix Garage", contact: "Sarah Williams", phone: "(555) 234-5678", email: "sarah@quickfix.com", totalPurchases: "$18,200", status: "active" },
  { name: "Joe's Mechanic Shop", contact: "Joe Martinez", phone: "(555) 345-6789", email: "joe@joescar.com", totalPurchases: "$31,800", status: "active" },
  { name: "City Auto Center", contact: "Tom Chen", phone: "(555) 456-7890", email: "tom@cityauto.com", totalPurchases: "$12,400", status: "active" },
  { name: "Elite Motors", contact: "Lisa Park", phone: "(555) 567-8901", email: "lisa@elitemotors.com", totalPurchases: "$45,600", status: "active" },
]

export function CustomersPage() {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("customers.title")}
        description={t("customers.description")}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" /> {t("common.export")}</Button>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> {t("customers.addCustomer")}</Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">{t("customers.totalCustomers")}</p><p className="text-2xl font-bold">156</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">{t("customers.activeCustomers")}</p><p className="text-2xl font-bold">142</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">{t("customers.thisMonth")}</p><p className="text-2xl font-bold">+8</p></CardContent></Card>
      </div>

      <div className="flex items-center gap-2">
        <SearchBar placeholder={t("customers.searchCustomers")} className="w-64" />
      </div>

      <Card>
        <CardContent className="p-0 overflow-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("customers.customerName")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("customers.contactPerson")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("customers.phone")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("customers.email")}</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">{t("customers.totalPurchases")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("customers.status")}</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.name} className="border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer">
                  <td className="px-4 py-3 text-sm font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-sm">{c.contact}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{c.phone}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{c.email}</td>
                  <td className="px-4 py-3 text-sm text-right font-medium">{c.totalPurchases}</td>
                  <td className="px-4 py-3"><Badge variant="success">{t("customers.active")}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
