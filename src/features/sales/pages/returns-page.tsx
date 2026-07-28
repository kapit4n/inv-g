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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { TextareaField } from "@/components/forms"
import { searchSales, refundSale, getDailyCloseout } from "@/lib/tauri"
import { useNotification } from "@/hooks/use-notification"

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
      notification.success(t("common.success"), t("sales.refundProcessed"))
      setSelectedSaleId(null)
      setRefundReason("")
    },
  })

  const columns = [
    { header: t("sales.invoice"), accessorKey: "saleNumber" as const },
    { header: t("sales.date"), accessorKey: "createdAt" as const, cell: (v: string) => new Date(v).toLocaleDateString() },
    { header: t("sales.customer"), accessorKey: "customerName" as const },
    { header: t("sales.total"), accessorKey: "total" as const, cell: (v: number) => v.toLocaleString("en-US", { style: "currency", currency: "USD" }) },
    { header: t("sales.payment"), accessorKey: "paymentStatus" as const, cell: (v: string) => <Badge variant={v === "refunded" ? "destructive" : "secondary"}>{v}</Badge> },
    {
      header: "Actions", accessorKey: "id" as const,
      cell: (v: number, row: any) => row.paymentStatus !== "refunded" ? (
        <Button size="sm" variant="destructive" onClick={() => setSelectedSaleId(v)}><RotateCcw className="h-3 w-3 mr-1" /> {t("sales.refund")}</Button>
      ) : <span className="text-xs text-muted-foreground">Already refunded</span>,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Returns & Refunds" description="Process customer returns and refunds" />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard title={t("sales.totalRevenue")} value={closeout?.totalRevenue.toLocaleString("en-US", { style: "currency", currency: "USD" }) || "$0"} icon={<span />} />
        <StatCard title={t("sales.refunds") + " (count)"} value={closeout?.refundedCount || 0} icon={<span />} />
        <StatCard title={t("sales.refunds") + " (total)"} value={closeout?.refundedTotal.toLocaleString("en-US", { style: "currency", currency: "USD" }) || "$0"} icon={<span />} />
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Search Sales for Refund</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by invoice number or customer name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
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
