import { useTranslation } from "react-i18next"
import { Plus, Download, Filter, DollarSign, CreditCard, Banknote, Receipt } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SearchBar } from "@/components/search-bar"
import { StatCard } from "@/components/stat-card"

const sales = [
  { id: "INV-2024-034", customer: "Mike's Auto Repair", items: 5, total: "$1,240.00", payment: "Card", status: "paid", date: "Today, 2:30 PM" },
  { id: "INV-2024-033", customer: "Quick Fix Garage", items: 3, total: "$890.00", payment: "Cash", status: "paid", date: "Today, 11:15 AM" },
  { id: "INV-2024-032", customer: "Joe's Mechanic Shop", items: 8, total: "$2,150.00", payment: "Transfer", status: "pending", date: "Yesterday, 4:45 PM" },
  { id: "INV-2024-031", customer: "City Auto Center", items: 2, total: "$345.00", payment: "Card", status: "paid", date: "Yesterday, 1:20 PM" },
  { id: "INV-2024-030", customer: "Elite Motors", items: 12, total: "$4,780.00", payment: "Transfer", status: "paid", date: "Jul 24, 3:10 PM" },
  { id: "INV-2024-029", customer: "Downtown Autoworks", items: 4, total: "$567.00", payment: "Cash", status: "refunded", date: "Jul 23, 10:00 AM" },
]

export function SalesPage() {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("sales.title")}
        description={t("sales.description")}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" /> {t("common.export")}</Button>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> {t("sales.newSale")}</Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title={t("sales.todaysRevenue")} value="$13,340" icon={<DollarSign className="h-5 w-5" />} trend="up" trendValue="+15%" description="vs yesterday" />
        <StatCard title={t("sales.todaysTransactions")} value="18" icon={<Receipt className="h-5 w-5" />} trend="up" trendValue="+8" description="vs yesterday" />
        <StatCard title={t("sales.averageOrder")} value="$741" icon={<CreditCard className="h-5 w-5" />} trend="up" trendValue="+4.2%" description="vs last week" />
        <StatCard title={t("sales.cashPayments")} value="$4,200" icon={<Banknote className="h-5 w-5" />} description="31.5% of today" />
      </div>

      <div className="flex items-center gap-2">
        <SearchBar placeholder={t("sales.searchInvoices")} className="w-64" />
        <Button variant="outline" size="sm"><Filter className="h-4 w-4 mr-1" /> {t("common.filter")}</Button>
      </div>

      <Card>
        <CardContent className="p-0 overflow-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("sales.invoice")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("sales.customer")}</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">{t("sales.itemsCount")}</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">{t("sales.total")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("sales.payment")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("common.status")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("sales.date")}</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((s) => (
                <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer">
                  <td className="px-4 py-3 text-sm font-mono font-medium">{s.id}</td>
                  <td className="px-4 py-3 text-sm">{s.customer}</td>
                  <td className="px-4 py-3 text-sm text-center">{s.items}</td>
                  <td className="px-4 py-3 text-sm text-right font-medium">{s.total}</td>
                  <td className="px-4 py-3 text-sm">{s.payment === "Card" ? t("sales.card") : s.payment === "Cash" ? t("sales.cash") : t("sales.transfer")}</td>
                  <td className="px-4 py-3">
                    <Badge variant={s.status === "paid" ? "success" : s.status === "pending" ? "warning" : "destructive"}>
                      {s.status === "paid" ? t("sales.paid") : s.status === "pending" ? t("sales.pending") : t("sales.refunded")}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{s.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
