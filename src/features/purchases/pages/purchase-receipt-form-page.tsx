import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useSearchParams } from "react-router-dom"
import { ArrowLeft, Truck } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { SelectField, TextareaField } from "@/components/forms"
import {
  getPurchaseOrder,
  getPurchaseOrderItems,
  getWarehouses,
  receivePurchaseOrder,
} from "@/lib/tauri"
import { useNotification } from "@/hooks/use-notification"
import { useAuthStore } from "@/stores"
import type { PurchaseOrder, PurchaseOrderItem, ReceivePOInput } from "@/types"
import type { Warehouse } from "@/types/inventory"
import { purchaseOrderStatusLabel, purchaseOrderStatusVariant } from "../purchase-order-status"

/** What the user has typed on one line: how many arrived, and how many are broken. */
interface ReceiveLine {
  received: string
  damaged: string
}

/**
 * Records a delivery against a purchase order — the step that lets a `sent` or
 * `partially_received` order finish.
 *
 * The page is reachable from the order detail page's "Recibir Orden" button as
 * `?poId=`, which is the link that used to land on the dashboard because no
 * route matched it.
 *
 * Every line is pre-filled with what is still outstanding, because receiving
 * usually means receiving what was ordered. Anything the user does not confirm
 * stays unreceived, and the backend decides the resulting status from the lines
 * actually submitted: `completed` when every ordered unit is accounted for
 * (received or damaged), `partially_received` otherwise. Damaged units are
 * recorded but never added to stock — only `received - damaged` is.
 */
export function PurchaseReceiptFormPage() {
  const { t } = useTranslation("purchases")
  const navigate = useNavigate()
  const notification = useNotification()
  const userId = useAuthStore((s) => s.user?.id ?? 0)
  const [searchParams] = useSearchParams()
  const poId = Number(searchParams.get("poId"))

  const [order, setOrder] = useState<PurchaseOrder | null>(null)
  const [items, setItems] = useState<PurchaseOrderItem[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [lines, setLines] = useState<Record<number, ReceiveLine>>({})
  const [warehouseId, setWarehouseId] = useState<number | undefined>()
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getWarehouses().then(setWarehouses).catch(() => undefined)
  }, [])

  useEffect(() => {
    if (!Number.isFinite(poId) || poId <= 0) {
      setLoading(false)
      return
    }
    setLoading(true)
    Promise.all([getPurchaseOrder(poId), getPurchaseOrderItems(poId)])
      .then(([po, poItems]) => {
        setOrder(po)
        setItems(poItems)
        setWarehouseId(po.warehouseId)
        // Pre-fill with what is still outstanding, so confirming is one click.
        setLines(
          Object.fromEntries(
            poItems.map((item) => [
              item.id,
              {
                received: String(outstanding(item)),
                damaged: "0",
              },
            ])
          )
        )
      })
      .catch((err) => {
        notification.error(t("common.error"), String(err))
        setOrder(null)
      })
      .finally(() => setLoading(false))
  }, [poId])

  /** Ordered units not yet received nor written off. */
  function outstanding(item: PurchaseOrderItem): number {
    return Math.max(0, item.quantity - item.receivedQuantity - item.damagedQuantity)
  }

  const warehouseOptions = useMemo(
    () => warehouses.map((w) => ({ label: w.name, value: String(w.id) })),
    [warehouses]
  )

  const payload = useMemo<ReceivePOInput[]>(
    () =>
      items
        .map((item) => {
          const line = lines[item.id]
          const receivedQuantity = toCount(line?.received)
          const damagedQuantity = toCount(line?.damaged)
          return {
            poItemId: item.id,
            productId: item.productId,
            receivedQuantity,
            damagedQuantity,
          }
        })
        .filter((line) => line.receivedQuantity > 0 || line.damagedQuantity > 0),
    [items, lines]
  )

  const problems = useMemo(
    () =>
      items
        .map((item) => {
          const line = lines[item.id]
          const received = toCount(line?.received)
          const damaged = toCount(line?.damaged)
          const remaining = outstanding(item)
          if (received < 0 || damaged < 0) return t("receiveNegative")
          if (received + damaged > remaining) return t("receiveExceedsRemaining", { remaining })
          return null
        })
        .filter((p): p is string => p !== null),
    [items, lines, t]
  )

  const unitsReceived = payload.reduce((sum, line) => sum + line.receivedQuantity, 0)
  const unitsDamaged = payload.reduce((sum, line) => sum + line.damagedQuantity, 0)
  const acceptedUnits = unitsReceived - unitsDamaged

  const handleSubmit = async () => {
    if (!order) return
    if (problems.length > 0) {
      notification.error(t("common.error"), problems[0])
      return
    }
    if (payload.length === 0) {
      notification.warning(t("common.warning"), t("receiveNothingToRecord"))
      return
    }
    if (!warehouseId) {
      notification.error(t("common.error"), t("receiveWarehouseRequired"))
      return
    }

    setSaving(true)
    try {
      const receipt = await receivePurchaseOrder(
        order.id,
        userId,
        warehouseId,
        notes.trim() || undefined,
        payload
      )
      notification.success(t("common.success"), t("receivedSuccess"))
      navigate(`/purchases/receipts/${receipt.id}`)
    } catch (err) {
      notification.error(t("common.error"), String(err))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("receiveOrder")} />
        <p className="text-sm text-muted-foreground">{t("orderNotFound")}</p>
        <Button variant="outline" onClick={() => navigate("/purchases/orders")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("backToOrders")}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("receiveOrder")}
        description={t("receiveOrderDescription")}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/purchases/orders/${order.id}`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("back")}
            </Button>
            <Button size="sm" onClick={handleSubmit} disabled={saving || problems.length > 0}>
              <Truck className="h-4 w-4 mr-2" />
              {saving ? t("common.saving") : t("markReceived")}
            </Button>
          </div>
        }
      />

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
              <p className="text-muted-foreground">
                {order.expectedDeliveryDate
                  ? new Date(order.expectedDeliveryDate).toLocaleDateString()
                  : "-"}
              </p>
              <p className="font-medium">{order.expectedDeliveryDate ? t("expectedDeliveryDate") : ""}</p>
            </div>
          </div>
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
                  <th className="p-4 font-medium text-right">{t("receivedQuantity")}</th>
                  <th className="p-4 font-medium text-right">{t("toReceive")}</th>
                  <th className="p-4 font-medium text-right">{t("received")}</th>
                  <th className="p-4 font-medium text-right">{t("damaged")}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const remaining = outstanding(item)
                  const line = lines[item.id] ?? { received: "", damaged: "" }
                  return (
                    <tr key={item.id} className="border-b">
                      <td className="p-4">
                        <p className="font-medium">{item.productName || "-"}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.productSku || item.supplierSku || ""}
                        </p>
                      </td>
                      <td className="p-4 text-right">{item.quantity}</td>
                      <td className="p-4 text-right">{item.receivedQuantity}</td>
                      <td className="p-4 text-right">{remaining}</td>
                      <td className="p-4 text-right">
                        <Input
                          type="number"
                          min={0}
                          max={remaining}
                          className="w-24 text-right"
                          aria-label={t("received")}
                          value={line.received}
                          onChange={(e) =>
                            setLines((prev) => ({
                              ...prev,
                              [item.id]: { ...line, received: e.target.value },
                            }))
                          }
                        />
                      </td>
                      <td className="p-4 text-right">
                        <Input
                          type="number"
                          min={0}
                          max={remaining}
                          className="w-24 text-right"
                          aria-label={t("damaged")}
                          value={line.damaged}
                          onChange={(e) =>
                            setLines((prev) => ({
                              ...prev,
                              [item.id]: { ...line, damaged: e.target.value },
                            }))
                          }
                        />
                      </td>
                    </tr>
                  )
                })}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-muted-foreground">
                      {t("noItems")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Separator />
          <div className="p-4 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("receivedQuantity")}</span>
              <span>{unitsReceived}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("damaged")}</span>
              <span className="text-destructive">{unitsDamaged}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>{t("acceptedUnits")}</span>
              <span>{acceptedUnits}</span>
            </div>
            <p className="text-xs text-muted-foreground">{t("receiveAcceptedHint")}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("receiveDetails")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SelectField
            label={t("warehouse")}
            options={warehouseOptions}
            value={warehouseId}
            onChange={(v) => setWarehouseId(v ? Number(v) : undefined)}
            placeholder={t("common.select")}
            required
          />
          <TextareaField
            label={t("notes")}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          {problems.length > 0 && (
            <ul className="space-y-1 text-sm text-destructive">
              {problems.map((problem, i) => (
                <li key={i}>{problem}</li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/** A blank or malformed count is zero rather than NaN reaching the backend. */
function toCount(value: string | undefined): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.trunc(parsed) : 0
}
