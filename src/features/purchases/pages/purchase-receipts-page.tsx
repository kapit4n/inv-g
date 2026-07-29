import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/data-table"
import type { TableColumn } from "@/types/crud"
import { getPurchaseReceipts } from "@/lib/tauri"
import type { PurchaseReceipt } from "@/types"

const STATUS_VARIANTS: Record<string, "success" | "warning" | "info" | "secondary" | "destructive"> = {
  completed: "success",
  partial: "warning",
  pending: "info",
  draft: "secondary",
  cancelled: "destructive",
}

export function PurchaseReceiptsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const { data: receipts = [], isLoading } = useQuery({
    queryKey: ["purchase-receipts"],
    queryFn: () => getPurchaseReceipts(),
  })

  const columns: TableColumn<PurchaseReceipt>[] = [
    {
      id: "receiptNumber",
      header: t("purchases.receiptNumber"),
      accessorKey: "receiptNumber",
      cell: (r) => (
        <span className="font-mono font-medium text-xs">{r.receiptNumber}</span>
      ),
    },
    {
      id: "poNumber",
      header: t("purchases.poNumber"),
      accessorKey: "poNumber",
      cell: (r) => (
        <span className="font-mono text-xs text-muted-foreground">
          {r.poNumber || "-"}
        </span>
      ),
    },
    {
      id: "supplierName",
      header: t("purchases.supplier"),
      accessorKey: "supplierName" as keyof PurchaseReceipt | undefined,
      cell: (r) => (
        <span className="text-sm">
          {(r as any).supplierName || "-"}
        </span>
      ),
    },
    {
      id: "receivedByName",
      header: t("purchases.receivedBy"),
      accessorKey: "receivedByName",
      cell: (r) => (
        <span className="text-sm">{r.receivedByName || `#${r.receivedBy}`}</span>
      ),
    },
    {
      id: "warehouseName",
      header: t("purchases.warehouse"),
      accessorKey: "warehouseName",
      cell: (r) => (
        <span className="text-sm">{r.warehouseName || "-"}</span>
      ),
    },
    {
      id: "status",
      header: t("common.status"),
      accessorKey: "status",
      cell: (r) => (
        <Badge
          variant={STATUS_VARIANTS[r.status] || "outline"}
          className="capitalize"
        >
          {r.status}
        </Badge>
      ),
      align: "center",
    },
    {
      id: "itemCount",
      header: t("inventory.items"),
      accessorKey: "itemCount",
      cell: (r) => <span className="text-sm">{r.itemCount ?? "-"}</span>,
      align: "center",
    },
    {
      id: "createdAt",
      header: t("common.date"),
      accessorKey: "createdAt",
      cell: (r) => (
        <span className="text-xs text-muted-foreground">
          {new Date(r.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("purchases.purchaseReceipts")}
        description={t("purchases.purchaseReceiptsDescription")}
      />

      <Card>
        <CardContent className="p-0">
          <DataTable
            data={receipts}
            columns={columns}
            loading={isLoading}
            onRowClick={(row) => navigate(`/purchases/receipts/${row.id}`)}
            emptyMessage={t("purchases.noReceipts")}
          />
        </CardContent>
      </Card>
    </div>
  )
}
