import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, FileText, Trash2 } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/data-table"
import { getQuotes, deleteQuote, updateQuoteStatus } from "@/lib/tauri"
import { useNotification } from "@/hooks/use-notification"

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
  const queryClient = useQueryClient()
  const notification = useNotification()

  const { data: quotes = [] } = useQuery({
    queryKey: ["quotes"],
    queryFn: getQuotes,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteQuote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] })
      notification.success(t("common.success"), "Quote deleted")
    },
  })

  const convertMutation = useMutation({
    mutationFn: (id: number) => updateQuoteStatus(id, "converted"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] })
      notification.success(t("common.success"), "Quote converted")
    },
  })

  const columns = [
    { header: t("sales.invoice"), accessorKey: "quoteNumber" as const },
    { header: t("sales.date"), accessorKey: "createdAt" as const, cell: (v: string) => new Date(v).toLocaleDateString() },
    { header: t("sales.customer"), accessorKey: "customerName" as const },
    { header: t("sales.total"), accessorKey: "total" as const, cell: (v: number) => v.toLocaleString("en-US", { style: "currency", currency: "USD" }) },
    {
      header: t("sales.payment"), accessorKey: "status" as const,
      cell: (v: string) => <Badge className={`${statusColors[v] || "bg-gray-500"} text-white`}>{v}</Badge>,
    },
    { header: t("sales.date"), accessorKey: "validUntil" as const, cell: (v: string) => v ? new Date(v).toLocaleDateString() : "-" },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quotes"
        description="Manage customer quotes and estimates"
        actions={
          <Button size="sm" onClick={() => navigate("/sales/quotes/new")}>
            <Plus className="h-4 w-4 mr-1" /> New Quote
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
