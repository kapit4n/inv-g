import { useState, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, X, Search } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { DataTable } from "@/components/data-table"
import type { TableColumn } from "@/types/crud"
import {
  getPurchaseReturns,
  getPurchaseOrders,
  getPurchaseOrderItems,
  createPurchaseReturn,
} from "@/lib/tauri"
import type { PurchaseReturn, PurchaseOrder } from "@/types"
import { useNotification } from "@/hooks/use-notification"

const STATUS_VARIANTS: Record<string, "success" | "warning" | "info" | "secondary" | "destructive"> = {
  completed: "success",
  pending: "warning",
  approved: "info",
  draft: "secondary",
  rejected: "destructive",
}

export function PurchaseReturnsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const notification = useNotification()

  const [showNewDialog, setShowNewDialog] = useState(false)
  const [selectedPoId, setSelectedPoId] = useState<number | null>(null)
  const [poSearch, setPoSearch] = useState("")
  const [returnReason, setReturnReason] = useState("")
  const [returnItems, setReturnItems] = useState<
    { productId: number; productName: string; quantity: number; unitCost: number; reason: string }[]
  >([])

  const { data: returns = [], isLoading } = useQuery({
    queryKey: ["purchase-returns"],
    queryFn: () => getPurchaseReturns(),
  })

  const { data: orders = [] } = useQuery({
    queryKey: ["purchase-orders"],
    queryFn: () => getPurchaseOrders(),
  })

  const { data: poItems = [] } = useQuery({
    queryKey: ["purchase-order-items", selectedPoId],
    queryFn: () => getPurchaseOrderItems(selectedPoId!),
    enabled: !!selectedPoId,
  })

  const filteredOrders = useMemo(() => {
    if (!poSearch) return orders
    const q = poSearch.toLowerCase()
    return orders.filter(
      (o) =>
        o.poNumber.toLowerCase().includes(q) ||
        (o.supplierName && o.supplierName.toLowerCase().includes(q)),
    )
  }, [orders, poSearch])

  const selectedOrder = orders.find((o) => o.id === selectedPoId)

  const createMutation = useMutation({
    mutationFn: () =>
      createPurchaseReturn(1, {
        poId: selectedPoId ?? undefined,
        supplierId: selectedOrder?.supplierId ?? 0,
        reason: returnReason,
        items: returnItems.map((ri) => ({
          productId: ri.productId,
          quantity: ri.quantity,
          unitCost: ri.unitCost,
          reason: ri.reason || undefined,
        })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-returns"] })
      notification.success(t("common.success"), t("purchases.returnCreated"))
      setShowNewDialog(false)
      resetForm()
    },
    onError: (err) => {
      notification.error(t("common.error"), String(err))
    },
  })

  function resetForm() {
    setSelectedPoId(null)
    setPoSearch("")
    setReturnReason("")
    setReturnItems([])
  }

  function handleSelectPo(po: PurchaseOrder) {
    setSelectedPoId(po.id)
    setPoSearch("")
    setReturnItems(
      poItems.map((item) => ({
        productId: item.productId,
        productName: item.productName || `#${item.productId}`,
        quantity: 0,
        unitCost: item.unitCost,
        reason: "",
      })),
    )
  }

  const columns: TableColumn<PurchaseReturn>[] = [
    {
      id: "returnNumber",
      header: t("purchases.returnNumber"),
      accessorKey: "returnNumber",
      cell: (r) => (
        <span className="font-mono font-medium text-xs">{r.returnNumber}</span>
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
      accessorKey: "supplierName",
      cell: (r) => <span className="text-sm">{r.supplierName || "-"}</span>,
    },
    {
      id: "reason",
      header: t("purchases.reason"),
      accessorKey: "reason",
      cell: (r) => (
        <span className="text-sm text-muted-foreground max-w-[200px] truncate block">
          {r.reason || "-"}
        </span>
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
      id: "createdByName",
      header: t("purchases.createdBy"),
      accessorKey: "createdByName",
      cell: (r) => (
        <span className="text-sm">{r.createdByName || `#${r.createdBy}`}</span>
      ),
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
        title={t("purchases.purchaseReturns")}
        description={t("purchases.purchaseReturnsDescription")}
        actions={
          <Button size="sm" onClick={() => setShowNewDialog(true)}>
            <Plus className="h-4 w-4 mr-1" />
            {t("purchases.newReturn")}
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          <DataTable
            data={returns}
            columns={columns}
            loading={isLoading}
            emptyMessage={t("purchases.noReturns")}
          />
        </CardContent>
      </Card>

      <Dialog
        open={showNewDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowNewDialog(false)
            resetForm()
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("purchases.newReturn")}</DialogTitle>
            <DialogDescription>
              {t("purchases.newReturnDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!selectedPoId ? (
              <div className="space-y-3">
                <Label>{t("purchases.selectPO")}</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={t("purchases.searchPO")}
                    value={poSearch}
                    onChange={(e) => setPoSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto rounded-md border">
                  {filteredOrders.map((po) => (
                    <button
                      key={po.id}
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors border-b last:border-0"
                      onClick={() => handleSelectPo(po)}
                    >
                      <span className="font-mono font-medium">{po.poNumber}</span>
                      <span className="text-muted-foreground ml-2">
                        {po.supplierName}
                      </span>
                    </button>
                  ))}
                  {filteredOrders.length === 0 && (
                    <p className="p-3 text-sm text-muted-foreground">
                      {t("common.noResults")}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <span className="font-medium">{t("purchases.poNumber")}:</span>{" "}
                    <span className="font-mono">{selectedOrder?.poNumber}</span>
                    <span className="ml-3 text-muted-foreground">
                      {selectedOrder?.supplierName}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedPoId(null)
                      setReturnItems([])
                    }}
                  >
                    <X className="h-4 w-4 mr-1" />
                    {t("common.change")}
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>{t("purchases.reason")} *</Label>
                  <Textarea
                    placeholder={t("purchases.returnReasonPlaceholder")}
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t("inventory.items")}</Label>
                  <div className="rounded-md border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="h-8 px-3 text-left font-medium text-muted-foreground text-xs">
                            {t("inventory.product")}
                          </th>
                          <th className="h-8 px-3 text-center font-medium text-muted-foreground text-xs">
                            {t("purchases.unitCost")}
                          </th>
                          <th className="h-8 px-3 text-center font-medium text-muted-foreground text-xs w-24">
                            {t("purchases.returnQty")}
                          </th>
                          <th className="h-8 px-3 text-left font-medium text-muted-foreground text-xs">
                            {t("purchases.reason")}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {returnItems.map((item, idx) => (
                          <tr key={item.productId} className="border-b last:border-0">
                            <td className="px-3 py-2">{item.productName}</td>
                            <td className="px-3 py-2 text-center">
                              {item.unitCost.toLocaleString("en-US", {
                                style: "currency",
                                currency: "USD",
                              })}
                            </td>
                            <td className="px-3 py-2">
                              <Input
                                type="number"
                                min={0}
                                className="h-8 text-center"
                                value={item.quantity}
                                onChange={(e) => {
                                  const newItems = [...returnItems]
                                  newItems[idx] = {
                                    productId: item.productId,
                                    productName: item.productName,
                                    quantity: Number(e.target.value),
                                    unitCost: item.unitCost,
                                    reason: item.reason,
                                  }
                                  setReturnItems(newItems)
                                }}
                              />
                            </td>
                            <td className="px-3 py-2">
                              <Input
                                className="h-8"
                                value={item.reason}
                                onChange={(e) => {
                                  const newItems = [...returnItems]
                                  newItems[idx] = {
                                    productId: item.productId,
                                    productName: item.productName,
                                    quantity: item.quantity,
                                    unitCost: item.unitCost,
                                    reason: e.target.value,
                                  }
                                  setReturnItems(newItems)
                                }}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowNewDialog(false)
                resetForm()
              }}
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={
                !selectedPoId ||
                !returnReason ||
                returnItems.every((i) => i.quantity === 0) ||
                createMutation.isPending
              }
            >
              {createMutation.isPending
                ? t("common.processing")
                : t("purchases.createReturn")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
