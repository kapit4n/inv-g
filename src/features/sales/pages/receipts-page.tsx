import { useTranslation } from "react-i18next"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Printer } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/data-table"
import { getSales, getReceiptsForSale, markReceiptPrinted } from "@/lib/tauri"
import { useNotification } from "@/hooks/use-notification"
import type { TableColumn } from "@/types/crud"
import type { Sale } from "@/types"

export function ReceiptsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const notification = useNotification()

  const { data: sales = [] } = useQuery({ queryKey: ["sales"], queryFn: getSales })

  const printMutation = useMutation({
    mutationFn: (receiptId: number) => markReceiptPrinted(receiptId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receipts"] })
      notification.success(t("common.success"), t("receiptMarkedPrinted"))
    },
  })

  const columns: TableColumn<Sale>[] = [
    { id: "saleNumber", header: t("saleNumber"), accessorKey: "saleNumber" },
    {
      id: "receipts", header: t("receipts"), accessorKey: "id",
      cell: (r) => <ReceiptsForSale saleId={r.id} />,
    },
    { id: "createdAt", header: t("sales.date"), accessorKey: "createdAt", cell: (r) => new Date(r.createdAt).toLocaleDateString() },
    { id: "total", header: t("sales.total"), accessorKey: "total", cell: (r) => r.total.toLocaleString("en-US", { style: "currency", currency: "USD" }) },
  ]

  function ReceiptsForSale({ saleId }: { saleId: number }) {
    const { data: receipts = [] } = useQuery({
      queryKey: ["receipts", saleId],
      queryFn: () => getReceiptsForSale(saleId),
    })

    if (receipts.length === 0) return <span className="text-xs text-muted-foreground">{t("noReceipts")}</span>

    return (
      <div className="space-y-1">
        {receipts.map((r) => (
          <div key={r.id} className="flex items-center gap-2 text-xs">
            <span className="font-mono">{r.receiptNumber}</span>
            <Badge variant={r.isPrinted ? "secondary" : "outline"} className="text-[10px]">
              {r.isPrinted ? t("printed") : t("pending")}
            </Badge>
            {!r.isPrinted && (
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => printMutation.mutate(r.id)}>
                <Printer className="h-3 w-3" />
              </Button>
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t("receipts")} description={t("viewManageReceipts")} />

      <Card>
        <CardContent className="p-0">
          <DataTable columns={columns} data={sales} />
        </CardContent>
      </Card>
    </div>
  )
}
