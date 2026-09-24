import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, CheckCircle, Package } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  getPurchaseReceipt,
  getPurchaseOrderItems,
  receivePurchaseOrder,
} from "@/lib/tauri"
import type { ReceivePOInput } from "@/types"
import { useNotification } from "@/hooks/use-notification"

const STATUS_VARIANTS: Record<string, "success" | "warning" | "info" | "secondary" | "destructive"> = {
  completed: "success",
  partial: "warning",
  pending: "info",
  draft: "secondary",
  cancelled: "destructive",
}

export function PurchaseReceiptDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const notification = useNotification()

  const [receivedQty, setReceivedQty] = useState<Record<number, number>>({})
  const [damagedQty, setDamagedQty] = useState<Record<number, number>>({})
  const [notes, setNotes] = useState("")

  const receiptId = id ? Number(id) : undefined

  const { data: receipt, isLoading: receiptLoading } = useQuery({
    queryKey: ["purchase-receipt", receiptId],
    queryFn: () => getPurchaseReceipt(receiptId!),
    enabled: !!receiptId,
  })

  const { data: poItems = [], isLoading: itemsLoading } = useQuery({
    queryKey: ["purchase-order-items", receipt?.purchaseOrderId],
    queryFn: () => getPurchaseOrderItems(receipt!.purchaseOrderId),
    enabled: !!receipt?.purchaseOrderId,
  })

  const receiveMutation = useMutation({
    mutationFn: (items: ReceivePOInput[]) =>
      receivePurchaseOrder(
        receipt!.purchaseOrderId,
        1,
        receipt!.warehouseId || 1,
        notes || undefined,
        items,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-receipt", receiptId] })
      queryClient.invalidateQueries({ queryKey: ["purchase-order-items"] })
      notification.success(t("common.success"), t("purchases.receiptConfirmed"))
    },
    onError: (err) => {
      notification.error(t("common.error"), String(err))
    },
  })

  const isPending = !receipt || receipt.status === "pending" || receipt.status === "draft"

  const canReceiveAll = poItems.every((item) => {
    const received = receivedQty[item.id] ?? item.receivedQuantity
    const damaged = damagedQty[item.id] ?? 0
    const remaining = item.quantity - item.receivedQuantity
    return received + damaged <= remaining
  })

  const handleConfirmReceipt = () => {
    if (!receipt) return
    const items: ReceivePOInput[] = poItems.map((item) => ({
      poItemId: item.id,
      productId: item.productId,
      receivedQuantity: receivedQty[item.id] ?? item.receivedQuantity,
      damagedQuantity: damagedQty[item.id] ?? 0,
    }))
    receiveMutation.mutate(items)
  }

  if (receiptLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("common.loading")} />
        <div className="text-sm text-muted-foreground py-8 text-center">
          {t("common.loading")}...
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          receipt
            ? `${t("purchases.receipt")} ${receipt.receiptNumber}`
            : t("purchases.newReceipt")
        }
        description={
          receipt
            ? `${t("purchases.poNumber")}: ${receipt.poNumber || "-"}`
            : t("purchases.receiveOrderDescription")
        }
        actions={
          <Button variant="outline" size="sm" onClick={() => navigate("/purchases/receipts")}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            {t("common.back")}
          </Button>
        }
      />

      {receipt && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("common.status")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge
                variant={STATUS_VARIANTS[receipt.status] || "outline"}
                className="capitalize"
              >
                {receipt.status}
              </Badge>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("purchases.receivedBy")}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {receipt.receivedByName || `#${receipt.receivedBy}`}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("purchases.warehouse")}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {receipt.warehouseName || "-"}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("common.date")}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {new Date(receipt.createdAt).toLocaleString()}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("purchases.itemCount")}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {receipt.itemCount ?? "-"}
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4" />
            {t("purchases.receivedItems")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="h-10 px-3 text-left font-medium text-muted-foreground">
                    {t("inventory.product")}
                  </th>
                  <th className="h-10 px-3 text-left font-medium text-muted-foreground">
                    {t("inventory.sku")}
                  </th>
                  <th className="h-10 px-3 text-center font-medium text-muted-foreground">
                    {t("purchases.ordered")}
                  </th>
                  <th className="h-10 px-3 text-center font-medium text-muted-foreground">
                    {t("purchases.received")}
                  </th>
                  <th className="h-10 px-3 text-center font-medium text-muted-foreground">
                    {t("purchases.remaining")}
                  </th>
                  {isPending && (
                    <>
                      <th className="h-10 px-3 text-center font-medium text-muted-foreground">
                        {t("purchases.toReceive")}
                      </th>
                      <th className="h-10 px-3 text-center font-medium text-muted-foreground">
                        {t("purchases.damaged")}
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {itemsLoading ? (
                  <tr>
                    <td
                      colSpan={isPending ? 7 : 5}
                      className="py-8 text-center text-sm text-muted-foreground"
                    >
                      {t("common.loading")}...
                    </td>
                  </tr>
                ) : poItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={isPending ? 7 : 5}
                      className="py-8 text-center text-sm text-muted-foreground"
                    >
                      {t("common.noResults")}
                    </td>
                  </tr>
                ) : (
                  poItems.map((item) => {
                    const remaining =
                      item.quantity - item.receivedQuantity
                    return (
                      <tr
                        key={item.id}
                        className="border-b transition-colors hover:bg-muted/30"
                      >
                        <td className="h-10 px-3 align-middle">
                          {item.productName || `#${item.productId}`}
                        </td>
                        <td className="h-10 px-3 align-middle text-xs text-muted-foreground">
                          {item.productSku || "-"}
                        </td>
                        <td className="h-10 px-3 align-middle text-center">
                          {item.quantity}
                        </td>
                        <td className="h-10 px-3 align-middle text-center">
                          {item.receivedQuantity}
                        </td>
                        <td className="h-10 px-3 align-middle text-center">
                          {remaining}
                        </td>
                        {isPending && (
                          <>
                            <td className="h-10 px-3 align-middle text-center">
                              <Input
                                type="number"
                                min={0}
                                max={remaining}
                                className="h-8 w-20 text-center inline-block"
                                value={
                                  receivedQty[item.id] ?? item.receivedQuantity
                                }
                                onChange={(e) =>
                                  setReceivedQty((prev) => ({
                                    ...prev,
                                    [item.id]: Number(e.target.value),
                                  }))
                                }
                              />
                            </td>
                            <td className="h-10 px-3 align-middle text-center">
                              <Input
                                type="number"
                                min={0}
                                max={remaining}
                                className="h-8 w-20 text-center inline-block"
                                value={damagedQty[item.id] ?? 0}
                                onChange={(e) =>
                                  setDamagedQty((prev) => ({
                                    ...prev,
                                    [item.id]: Number(e.target.value),
                                  }))
                                }
                              />
                            </td>
                          </>
                        )}
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {isPending && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t("purchases.confirmReceipt")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t("common.notes")}</Label>
              <Textarea
                placeholder={t("purchases.receiptNotesPlaceholder")}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <div className="flex justify-end">
              <Button
                onClick={handleConfirmReceipt}
                disabled={!canReceiveAll || receiveMutation.isPending}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                {receiveMutation.isPending
                  ? t("common.processing")
                  : t("purchases.confirmReceipt")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
