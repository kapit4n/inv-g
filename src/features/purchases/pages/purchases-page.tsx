import { useTranslation } from "react-i18next"
import { Plus, Download } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const orders = [
  { id: "PO-0089", supplier: "AutoParts Co.", items: 12, total: "$4,500.00", status: "delivered", date: "Jul 25, 2024" },
  { id: "PO-0088", supplier: "OEM Direct", items: 8, total: "$2,890.00", status: "in-transit", date: "Jul 24, 2024" },
  { id: "PO-0087", supplier: "BrakeMaster Inc.", items: 24, total: "$6,200.00", status: "processing", date: "Jul 23, 2024" },
  { id: "PO-0086", supplier: "FilterPro Supply", items: 6, total: "$1,340.00", status: "delivered", date: "Jul 20, 2024" },
  { id: "PO-0085", supplier: "EngineParts Global", items: 15, total: "$8,750.00", status: "delivered", date: "Jul 18, 2024" },
]

export function PurchasesPage() {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("purchases.title")}
        description={t("purchases.description")}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" /> {t("common.export")}</Button>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> {t("purchases.newPurchaseOrder")}</Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">{t("purchases.totalOrders")}</p><p className="text-2xl font-bold">89</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">{t("purchases.pendingOrders")}</p><p className="text-2xl font-bold">5</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">{t("purchases.thisMonth")}</p><p className="text-2xl font-bold">$23,680</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">{t("purchases.averageOrder")}</p><p className="text-2xl font-bold">$3,450</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-0 overflow-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("purchases.orderNumber")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("purchases.supplier")}</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">{t("purchases.itemsCount")}</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">{t("purchases.total")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("purchases.status")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("purchases.date")}</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer">
                  <td className="px-4 py-3 text-sm font-mono font-medium">{o.id}</td>
                  <td className="px-4 py-3 text-sm">{o.supplier}</td>
                  <td className="px-4 py-3 text-sm text-center">{o.items}</td>
                  <td className="px-4 py-3 text-sm text-right font-medium">{o.total}</td>
                  <td className="px-4 py-3">
                    <Badge variant={
                      o.status === "delivered" ? "success" : o.status === "in-transit" ? "info" : "warning"
                    }>
                      {t(`purchases.${o.status === "in-transit" ? "inTransit" : o.status}`)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{o.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
