import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { Plus } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/data-table"
import { getQuotes } from "@/lib/tauri"
import type { TableColumn } from "@/types/crud"
import type { Quote } from "@/types"

const statusColors: Record<string, string> = {
  draft: "bg-gray-500",
  sent: "bg-blue-500",
  accepted: "bg-green-500",
  rejected: "bg-red-500",
  expired: "bg-yellow-500",
  converted: "bg-purple-500",
}

export function QuotesPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const { data: quotes = [] } = useQuery({
    queryKey: ["quotes"],
    queryFn: getQuotes,
  })

  const columns: TableColumn<Quote>[] = [
    { id: "quoteNumber", header: t("sales.invoice"), accessorKey: "quoteNumber" },
    { id: "createdAt", header: t("sales.date"), accessorKey: "createdAt", cell: (r) => new Date(r.createdAt).toLocaleDateString() },
    { id: "customerName", header: t("sales.customer"), accessorKey: "customerName" },
    { id: "total", header: t("sales.total"), accessorKey: "total", cell: (r) => r.total.toLocaleString("en-US", { style: "currency", currency: "USD" }) },
    {
      id: "status", header: t("sales.payment"), accessorKey: "status",
      cell: (r) => <Badge className={`${statusColors[r.status] || "bg-gray-500"} text-white`}>{r.status}</Badge>,
    },
    { id: "validUntil", header: t("sales.date"), accessorKey: "validUntil", cell: (r) => r.validUntil ? new Date(r.validUntil).toLocaleDateString() : "-" },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("quotes")}
        description={t("manageQuotesAndEstimates")}
        actions={
          <Button size="sm" onClick={() => navigate("/sales/quotes/new")}>
            <Plus className="h-4 w-4 mr-1" /> {t("newQuote")}
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={quotes}
            onRowClick={(row) => navigate(`/sales/quotes/${row.id}`)}
          />
        </CardContent>
      </Card>
    </div>
  )
}
