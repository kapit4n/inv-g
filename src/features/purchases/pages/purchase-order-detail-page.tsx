import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Edit, Send, Check, X, Truck, Trash2, RotateCcw } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { getPurchaseOrder, deletePurchaseOrder, updatePurchaseOrderStatus } from "@/lib/tauri"
import { useNotification } from "@/hooks/use-notification"
import type { PurchaseOrder } from "@/types"
import { purchaseOrderStatusLabel, purchaseOrderStatusVariant } from "../purchase-order-status"

export function PurchaseOrderDetailPage() {
  const { t } = useTranslation("purchases")
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const notification = useNotification()
  const [order, setOrder] = useState<PurchaseOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchOrder = () => {
    if (!id) return
    setLoading(true)
    getPurchaseOrder(Number(id))
      .then(setOrder)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchOrder()
  }, [id])

  const handleStatusUpdate = async (newStatus: string) => {
    if (!id) return
    setActionLoading(newStatus)
    try {
      await updatePurchaseOrderStatus(Number(id), newStatus, 1)
      notification.success(t("common.success"), t("statusUpdated"))
      fetchOrder()
    } catch (err) {
      notification.error(t("common.error"), String(err))
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async () => {
    if (!id) return
    setActionLoading("delete")
    try {
      await deletePurchaseOrder(Number(id))
      notification.success(t("common.success"), t("poDeleted"))
      navigate("/purchases/orders")
    } catch (err) {
      notification.error(t("common.error"), String(err))
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 bg-muted animate-pulse rounded" />
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("purchaseOrder")} />
        <p className="text-sm text-muted-foreground">{t("orderNotFound")}</p>
        <Button variant="outline" onClick={() => navigate("/purchases/orders")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("backToOrders")}
        </Button>
      </div>
    )
  }

  const renderActions = () => {
    const actions: { label: string; icon: React.ReactNode; onClick: () => void; variant?: "default" | "destructive" | "outline" | "secondary"; loading?: string }[] = []

    switch (order.status) {
      case "draft":
        actions.push(
          { label: t("edit"), icon: <Edit className="h-4 w-4 mr-2" />, onClick: () => navigate(`/purchases/orders/${id}/edit`) },
          { label: t("submitForApproval"), icon: <Send className="h-4 w-4 mr-2" />, onClick: () => handleStatusUpdate("pending_approval"), loading: "pending_approval" },
          { label: t("delete"), icon: <Trash2 className="h-4 w-4 mr-2" />, onClick: handleDelete, variant: "destructive", loading: "delete" },
        )
        break
      case "pending_approval":
        actions.push(
          { label: t("approve"), icon: <Check className="h-4 w-4 mr-2" />, onClick: () => handleStatusUpdate("approved"), loading: "approved" },
          { label: t("reject"), icon: <X className="h-4 w-4 mr-2" />, onClick: () => handleStatusUpdate("draft"), variant: "destructive", loading: "draft" },
        )
        break
      case "approved":
        actions.push(
          { label: t("sendToSupplier"), icon: <Send className="h-4 w-4 mr-2" />, onClick: () => handleStatusUpdate("sent"), loading: "sent" },
        )
        break
      case "sent":
        actions.push(
          { label: t("receiveOrder"), icon: <Truck className="h-4 w-4 mr-2" />, onClick: () => navigate(`/purchases/receipts/new?poId=${id}`) },
          { label: t("cancel"), icon: <X className="h-4 w-4 mr-2" />, onClick: () => handleStatusUpdate("cancelled"), variant: "destructive", loading: "cancelled" },
        )
        break
      case "partially_received":
        actions.push(
          { label: t("receiveOrder"), icon: <Truck className="h-4 w-4 mr-2" />, onClick: () => navigate(`/purchases/receipts/new?poId=${id}`) },
        )
        break
    }

    return actions
  }

  const actionButtons = renderActions()

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${t("purchaseOrder")} ${order.poNumber}`}
        description={t("poDetailDescription")}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => navigate("/purchases/orders")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("back")}
            </Button>
            {actionButtons.map((action, i) => (
              <Button
                key={i}
                variant={action.variant || "default"}
                size="sm"
                onClick={action.onClick}
                disabled={actionLoading === action.loading}
              >
                {actionLoading === action.loading ? (
                  <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  action.icon
                )}
                {action.label}
              </Button>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("orderInformation")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">{t("poNumber")}</p>
                  <p className="font-medium">{order.poNumber}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t("status")}</p>
                  <Badge variant={purchaseOrderStatusVariant(order.status)}>
                    {purchaseOrderStatusLabel(t, order.status)}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">{t("supplier")}</p>
                  <p className="font-medium">{order.supplierName || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t("warehouse")}</p>
                  <p className="font-medium">{order.warehouseName || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t("orderDate")}</p>
                  <p className="font-medium">{new Date(order.orderDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t("expectedDeliveryDate")}</p>
                  <p className="font-medium">
                    {order.expectedDeliveryDate
                      ? new Date(order.expectedDeliveryDate).toLocaleDateString()
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t("buyer")}</p>
                  <p className="font-medium">{order.buyer || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t("paymentTerms")}</p>
                  <p className="font-medium">{order.paymentTerms || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t("shippingMethod")}</p>
                  <p className="font-medium">{order.shippingMethod || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t("referenceNumber")}</p>
                  <p className="font-medium">{order.referenceNumber || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t("createdBy")}</p>
                  <p className="font-medium">{order.userName || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t("approvedBy")}</p>
                  <p className="font-medium">{order.approvedByName || "-"}</p>
                </div>
              </div>
              {order.notes && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">{t("notes")}</p>
                  <p className="text-sm mt-1">{order.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("items")}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="p-4 font-medium">{t("product")}</th>
                      <th className="p-4 font-medium text-right">{t("quantity")}</th>
                      <th className="p-4 font-medium text-right">{t("unitCost")}</th>
                      <th className="p-4 font-medium text-right">{t("discount")}</th>
                      <th className="p-4 font-medium text-right">{t("tax")}</th>
                      <th className="p-4 font-medium text-right">{t("total")}</th>
                      <th className="p-4 font-medium text-right">{t("received")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Items are not eagerly fetched here; they are part of a dedicated endpoint.
                        A real implementation would call getPurchaseOrderItems and render them. */}
                    {order.itemCount && order.itemCount > 0 ? (
                      <tr>
                        <td colSpan={7} className="p-4 text-center text-muted-foreground">
                          {order.itemCount} {t("itemsCount")}
                        </td>
                      </tr>
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-4 text-center text-muted-foreground">
                          {t("noItems")}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <Separator />
              <div className="p-4 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("subtotal")}</span>
                  <span>${order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("discountAmount")}</span>
                  <span className="text-destructive">-${order.discountAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("taxAmount")}</span>
                  <span>${order.taxAmount.toFixed(2)}</span>
                </div>
                {order.shippingCost > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("shippingCost")}</span>
                    <span>${order.shippingCost.toFixed(2)}</span>
                  </div>
                )}
                <Separator className="my-1" />
                <div className="flex justify-between text-base font-bold">
                  <span>{t("total")}</span>
                  <span>${order.total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("timeline")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t("created")}</span>
                <span>{new Date(order.createdAt).toLocaleDateString()}</span>
              </div>
              {order.approvedAt && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t("approvedAt")}</span>
                  <span>{new Date(order.approvedAt).toLocaleDateString()}</span>
                </div>
              )}
              {order.sentAt && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t("sentAt")}</span>
                  <span>{new Date(order.sentAt).toLocaleDateString()}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t("updated")}</span>
                <span>{new Date(order.updatedAt).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("summary")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("itemCount")}</span>
                <span className="font-medium">{order.itemCount ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("currency")}</span>
                <span className="font-medium">{order.currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("shippingCost")}</span>
                <span className="font-medium">{order.shippingCost > 0 ? `$${order.shippingCost.toFixed(2)}` : "-"}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
