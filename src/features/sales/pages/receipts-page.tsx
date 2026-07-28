import { useTranslation } from "react-i18next"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Printer, CheckCircle2, XCircle } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/data-table"
import { getSales, getSalePayments, getReceiptsForSale, markReceiptPrinted } from "@/lib/tauri"
import { useNotification } from "@/hooks/use-notification"

export function ReceiptsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const notification = useNotification()

  const { data: sales = [] } = useQuery({ queryKey: ["sales"], queryFn: getSales })

  const printMutation = useMutation({
    mutationFn: (receiptId: number) => markReceiptPrinted(receiptId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receipts"] })
      notification.success(t("common.success"), "Receipt marked as printed")
    },
  })

  const columns = [
    { header: "Sale #", accessorKey: "saleNumber" as const },
    {
      header: "Receipts", accessorKey: "id" as const,
      cell: (v: number) => <ReceiptsForSale saleId={v} />,
    },
    { header: t("sales.date"), accessorKey: "createdAt" as const, cell: (v: string) => new Date(v).toLocaleDateString() },
    { header: t("sales.total"), accessorKey: "total" as const, cell: (v: number) => v.toLocaleString("en-US", { style: "currency", currency: "USD" }) },
  ]

  function ReceiptsForSale({ saleId }: { saleId: number }) {
    const { data: receipts = [] } = useQuery({
      queryKey: ["receipts", saleId],
      queryFn: () => getReceiptsForSale(saleId),
    })

    if (receipts.length === 0) return <span className="text-xs text-muted-foreground">No receipts</span>

    return (
      <div className="space-y-1">
        {receipts.map((r) => (
          <div key={r.id} className="flex items-center gap-2 text-xs">
            <span className="font-mono">{r.receiptNumber}</span>
            <Badge variant={r.isPrinted ? "secondary" : "outline"} className="text-[10px]">
              {r.isPrinted ? "Printed" : "Pending"}
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
      <PageHeader title="Receipts" description="View and manage sale receipts" />

      <Card>
        <CardContent className="p-0">
          <DataTable columns={columns} data={sales} />
        </CardContent>
      </Card>
    </div>
  )
}
