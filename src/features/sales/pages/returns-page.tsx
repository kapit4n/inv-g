import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Search, RotateCcw } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/data-table"
import { StatCard } from "@/components/stat-card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TextareaField } from "@/components/forms"
import { searchSales, refundSale, getDailyCloseout } from "@/lib/tauri"
import { useNotification } from "@/hooks/use-notification"
import type { TableColumn } from "@/types/crud"
import type { Sale } from "@/types"

export function ReturnsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const notification = useNotification()

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null)
  const [refundReason, setRefundReason] = useState("")

  const { data: sales = [] } = useQuery({
    queryKey: ["search-sales", searchQuery],
    queryFn: () => searchSales(searchQuery),
    enabled: searchQuery.length >= 2,
  })

  const { data: closeout } = useQuery({
    queryKey: ["daily-closeout"],
    queryFn: getDailyCloseout,
  })

  const refundMutation = useMutation({
    mutationFn: () => refundSale(selectedSaleId!, refundReason || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] })
      queryClient.invalidateQueries({ queryKey: ["daily-closeout"] })
      queryClient.invalidateQueries({ queryKey: ["sales-summary"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-widgets"] })
      notification.success(t("common.success"), t("sales.refundProcessed"))
      setSelectedSaleId(null)
      setRefundReason("")
    },
  })

  const columns: TableColumn<Sale>[] = [
    { id: "saleNumber", header: t("sales.invoice"), accessorKey: "saleNumber" },
    { id: "createdAt", header: t("sales.date"), accessorKey: "createdAt", cell: (r) => new Date(r.createdAt).toLocaleDateString() },
    { id: "customerName", header: t("sales.customer"), accessorKey: "customerName" },
    { id: "total", header: t("sales.total"), accessorKey: "total", cell: (r) => r.total.toLocaleString("en-US", { style: "currency", currency: "USD" }) },
    { id: "paymentStatus", header: t("sales.payment"), accessorKey: "paymentStatus", cell: (r) => <Badge variant={r.paymentStatus === "refunded" ? "destructive" : "secondary"}>{r.paymentStatus}</Badge> },
    {
      id: "actions", header: t("actions"), accessorKey: "id",
      cell: (r) => r.paymentStatus !== "refunded" ? (
        <Button size="sm" variant="destructive" onClick={() => setSelectedSaleId(r.id)}><RotateCcw className="h-3 w-3 mr-1" /> {t("sales.refund")}</Button>
      ) : <span className="text-xs text-muted-foreground">{t("alreadyRefunded")}</span>,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title={t("returnsAndRefunds")} description={t("processReturnsAndRefunds")} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard title={t("sales.totalRevenue")} value={closeout?.totalRevenue.toLocaleString("en-US", { style: "currency", currency: "USD" }) || "$0"} icon={<span />} />
        <StatCard title={t("sales.refunds") + ` (${t("count")})`} value={closeout?.refundedCount || 0} icon={<span />} />
        <StatCard title={t("sales.refunds") + ` (${t("total")})`} value={closeout?.refundedTotal.toLocaleString("en-US", { style: "currency", currency: "USD" }) || "$0"} icon={<span />} />
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">{t("searchSalesForRefund")}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder={t("searchByInvoiceOrCustomer")} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
          </div>
          {sales.length > 0 && (
            <DataTable columns={columns} data={sales} />
          )}
        </CardContent>
      </Card>

      <Dialog open={selectedSaleId !== null} onOpenChange={(open) => { if (!open) setSelectedSaleId(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("sales.confirmRefund")}</DialogTitle>
            <DialogDescription>{t("sales.refundConfirm")}</DialogDescription>
          </DialogHeader>
          <TextareaField label={t("sales.refundReason")} value={refundReason} onChange={(e) => setRefundReason(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedSaleId(null)}>{t("common.cancel")}</Button>
            <Button variant="destructive" onClick={() => refundMutation.mutate()} disabled={refundMutation.isPending}>
              {refundMutation.isPending ? t("common.processing") : t("sales.confirmRefund")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
