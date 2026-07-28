import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, Printer, RotateCcw, CreditCard, Banknote, Landmark, Receipt, Check, Ban } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { TextareaField } from "@/components/forms"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { getSale, getSaleItems, getSalePayments, getReceiptsForSale, refundSale, markReceiptPrinted } from "@/lib/tauri"
import type { SaleItem, SalePayment, Receipt as ReceiptType } from "@/types"
import { useNotification } from "@/hooks/use-notification"

export function SaleDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const notification = useNotification()

  const [refundMode, setRefundMode] = useState(false)
  const [refundReason, setRefundReason] = useState("")

  const saleId = Number(id)

  const { data: sale, isLoading } = useQuery({
    queryKey: ["sale", saleId],
    queryFn: () => getSale(saleId),
    enabled: !!saleId,
  })

  const { data: items = [] } = useQuery({
    queryKey: ["sale-items", saleId],
    queryFn: () => getSaleItems(saleId),
    enabled: !!saleId,
  })

  const { data: payments = [] } = useQuery({
    queryKey: ["sale-payments", saleId],
    queryFn: () => getSalePayments(saleId),
    enabled: !!saleId,
  })

  const { data: receipts = [] } = useQuery({
    queryKey: ["sale-receipts", saleId],
    queryFn: () => getReceiptsForSale(saleId),
    enabled: !!saleId,
  })

  const refundMutation = useMutation({
    mutationFn: () => refundSale(saleId, refundReason || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sale", saleId] })
      queryClient.invalidateQueries({ queryKey: ["sales"] })
      queryClient.invalidateQueries({ queryKey: ["daily-closeout"] })
      notification.success(t("common.success"), t("sales.refundProcessed"))
      setRefundMode(false)
    },
    onError: (err) => {
      notification.error(t("common.error"), String(err))
    },
  })

  const printReceiptMutation = useMutation({
    mutationFn: (receiptId: number) => markReceiptPrinted(receiptId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sale-receipts", saleId] })
      notification.success(t("common.success"), t("sales.receiptPrinted"))
    },
    onError: (err) => {
      notification.error(t("common.error"), String(err))
    },
  })

  const paymentMethodIcon = (method: string) => {
    switch (method) {
      case "cash": return <Banknote className="h-4 w-4" />
      case "card": return <CreditCard className="h-4 w-4" />
      case "transfer": return <Landmark className="h-4 w-4" />
      default: return <CreditCard className="h-4 w-4" />
    }
  }

  const formatCurrency = (value: number) =>
    value.toLocaleString("en-US", { style: "currency", currency: "USD" })

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">{t("common.loading")}</div>
  if (!sale) return <div className="p-8 text-center text-muted-foreground">{t("common.notFound")}</div>

  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #receipt-area, #receipt-area * { visibility: visible; }
          #receipt-area { position: absolute; left: 0; top: 0; width: 80mm; padding: 10px; font-size: 12px; font-family: monospace; }
          #receipt-area .no-print { display: none !important; }
        }
      `}</style>

      <div id="receipt-area" className="hidden print:block">
        <div style={{ textAlign: "center", marginBottom: 10 }}>
          <strong style={{ fontSize: 16 }}>{t("common.appName")}</strong>
          <div>{sale.saleNumber}</div>
          {sale.receiptNumber && <div style={{ fontSize: 10 }}>{t("sales.receipt")}: {sale.receiptNumber}</div>}
          <div style={{ fontSize: 10 }}>{new Date(sale.createdAt).toLocaleString()}</div>
        </div>
        <div style={{ borderTop: "1px dashed #000", borderBottom: "1px dashed #000", padding: "5px 0", marginBottom: 10 }}>
          {items.map((item: SaleItem) => (
            <div key={item.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
              <span>{item.quantity}x {item.productName || `#${item.productId}`}</span>
              <span>{formatCurrency(item.total)}</span>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "right", marginBottom: 5 }}>
          <div>{t("sales.subtotal")}: {formatCurrency(sale.subtotal)}</div>
          <div>{t("sales.tax")}: {formatCurrency(sale.taxAmount)}</div>
          {sale.discountAmount > 0 && <div>{t("sales.discount")}: -{formatCurrency(sale.discountAmount)}</div>}
          <div style={{ fontWeight: "bold", fontSize: 14 }}>{t("sales.total")}: {formatCurrency(sale.total)}</div>
        </div>
        <div style={{ textAlign: "center", fontSize: 10, marginTop: 10 }}>
          {payments.map((p, i) => (
            <div key={p.id}>{t(`sales.${p.method}`)}: {formatCurrency(p.amount)}{p.changeAmount > 0 && ` (${t("sales.change")}: ${formatCurrency(p.changeAmount)})`}</div>
          ))}
        </div>
        {sale.customerName && <div style={{ textAlign: "center", fontSize: 10 }}>{t("sales.customer")}: {sale.customerName}</div>}
        <div style={{ textAlign: "center", fontSize: 10, marginTop: 15 }}>{t("common.print")}: {new Date().toLocaleString()}</div>
      </div>

      <div className="flex items-center gap-4 no-print">
        <Button variant="ghost" size="icon" onClick={() => navigate("/sales")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{sale.saleNumber}</h1>
          <p className="text-sm text-muted-foreground">
            {new Date(sale.createdAt).toLocaleDateString()} - {new Date(sale.createdAt).toLocaleTimeString()}
            {sale.receiptNumber && <span className="ml-2">| {t("sales.receipt")}: {sale.receiptNumber}</span>}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {sale.paymentStatus !== "refunded" && (
            <>
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Printer className="h-4 w-4 mr-1" /> {t("common.print")}
              </Button>
              <Button variant="destructive" size="sm" onClick={() => setRefundMode(true)}>
                <RotateCcw className="h-4 w-4 mr-1" /> {t("sales.refund")}
              </Button>
            </>
          )}
          <Badge
            variant={
              sale.paymentStatus === "paid" ? "success" :
              sale.paymentStatus === "pending" ? "warning" :
              sale.paymentStatus === "refunded" ? "destructive" : "info"
            }
            className="text-sm capitalize"
          >
            {t(`sales.${sale.paymentStatus}`)}
          </Badge>
        </div>
      </div>

      {refundMode && (
        <Card className="border-destructive no-print">
          <CardHeader>
            <CardTitle className="text-base text-destructive flex items-center gap-2">
              <RotateCcw className="h-4 w-4" /> {t("sales.refund")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">{t("sales.refundConfirm")}</p>
            <TextareaField
              label={t("sales.refundReason")}
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
            />
            <div className="flex gap-2">
              <Button variant="destructive" onClick={() => refundMutation.mutate()} disabled={refundMutation.isPending}>
                {refundMutation.isPending ? t("common.processing") : t("sales.confirmRefund")}
              </Button>
              <Button variant="outline" onClick={() => { setRefundMode(false); setRefundReason("") }}>
                {t("common.cancel")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="details" className="no-print">
        <TabsList>
          <TabsTrigger value="details">{t("sales.details")}</TabsTrigger>
          <TabsTrigger value="payments">{t("sales.payments")}</TabsTrigger>
          <TabsTrigger value="receipts">{t("sales.receipts")}</TabsTrigger>
          {sale.paymentStatus !== "refunded" && (
            <TabsTrigger value="refund" className="text-destructive">{t("sales.refund")}</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="details">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Receipt className="h-4 w-4" /> {t("sales.items")} ({items.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-2 px-4 font-medium">{t("inventory.product")}</th>
                        <th className="pb-2 px-4 font-medium text-right">{t("inventory.quantity")}</th>
                        <th className="pb-2 px-4 font-medium text-right">{t("inventory.price")}</th>
                        <th className="pb-2 px-4 font-medium text-right">{t("sales.discount")}</th>
                        <th className="pb-2 px-4 font-medium text-right">{t("sales.total")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item: SaleItem) => (
                        <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="py-3 px-4">
                            <div className="font-medium">{item.productName || `#${item.productId}`}</div>
                            {item.productSku && <div className="text-xs text-muted-foreground font-mono">{item.productSku}</div>}
                          </td>
                          <td className="py-3 px-4 text-right tabular-nums">{item.quantity}</td>
                          <td className="py-3 px-4 text-right tabular-nums">{formatCurrency(item.unitPrice)}</td>
                          <td className="py-3 px-4 text-right tabular-nums">{item.discount > 0 ? `-${formatCurrency(item.discount)}` : "-"}</td>
                          <td className="py-3 px-4 text-right font-medium tabular-nums">{formatCurrency(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t("sales.summary")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {sale.customerName && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("sales.customer")}</span>
                      <span className="font-medium">{sale.customerName}</span>
                    </div>
                  )}
                  {sale.notes && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("inventory.notes")}</span>
                      <span className="text-right text-xs max-w-[180px] truncate">{sale.notes}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("sales.subtotal")}</span>
                    <span className="tabular-nums">{formatCurrency(sale.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("sales.tax")} ({(sale.taxRate * 100).toFixed(1)}%)</span>
                    <span className="tabular-nums">{formatCurrency(sale.taxAmount)}</span>
                  </div>
                  {sale.discountAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("sales.discount")}</span>
                      <span className="tabular-nums text-destructive">-{formatCurrency(sale.discountAmount)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-bold text-base">
                    <span>{t("sales.total")}</span>
                    <span className="tabular-nums">{formatCurrency(sale.total)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CreditCard className="h-4 w-4" /> {t("sales.payments")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {payments.map((p: SalePayment) => (
                    <div key={p.id} className="flex items-center justify-between rounded-lg border p-2">
                      <div className="flex items-center gap-2">
                        {paymentMethodIcon(p.method)}
                        <span className="capitalize">{t(`sales.${p.method}`)}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium tabular-nums">{formatCurrency(p.amount)}</div>
                        {p.changeAmount > 0 && (
                          <div className="text-xs text-emerald-600 tabular-nums">
                            {t("sales.change")}: {formatCurrency(p.changeAmount)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("sales.payments")}</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">{t("sales.method")}</th>
                    <th className="pb-2 font-medium text-right">{t("sales.amount")}</th>
                    <th className="pb-2 font-medium text-right">{t("sales.change")}</th>
                    <th className="pb-2 font-medium">{t("sales.reference")}</th>
                    <th className="pb-2 font-medium text-right">{t("sales.date")}</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p: SalePayment) => (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="py-3 flex items-center gap-2">
                        {paymentMethodIcon(p.method)}
                        <span className="capitalize font-medium">{t(`sales.${p.method}`)}</span>
                      </td>
                      <td className="py-3 text-right tabular-nums">{formatCurrency(p.amount)}</td>
                      <td className="py-3 text-right tabular-nums">
                        {p.changeAmount > 0 ? formatCurrency(p.changeAmount) : "-"}
                      </td>
                      <td className="py-3">{p.reference || "-"}</td>
                      <td className="py-3 text-right text-muted-foreground text-xs">
                        {new Date(p.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receipts">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Receipt className="h-4 w-4" /> {t("sales.receipts")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {receipts.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">{t("sales.noReceipts")}</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 font-medium">{t("sales.receiptNumber")}</th>
                      <th className="pb-2 font-medium">{t("sales.type")}</th>
                      <th className="pb-2 font-medium">{t("common.status")}</th>
                      <th className="pb-2 font-medium text-right">{t("sales.printedAt")}</th>
                      <th className="pb-2 font-medium text-right">{t("common.actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receipts.map((r: ReceiptType) => (
                      <tr key={r.id} className="border-b last:border-0">
                        <td className="py-3 font-mono text-xs">{r.receiptNumber}</td>
                        <td className="py-3 capitalize">{r.receiptType}</td>
                        <td className="py-3">
                          <Badge variant={r.isPrinted ? "success" : "warning"} className="text-xs">
                            {r.isPrinted ? t("common.printed") : t("common.pending")}
                          </Badge>
                        </td>
                        <td className="py-3 text-right text-muted-foreground text-xs">
                          {r.printedAt ? new Date(r.printedAt).toLocaleString() : "-"}
                        </td>
                        <td className="py-3 text-right">
                          {!r.isPrinted && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => printReceiptMutation.mutate(r.id)}
                              disabled={printReceiptMutation.isPending}
                            >
                              <Check className="h-3 w-3 mr-1" />
                              {t("sales.markPrinted")}
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="refund">
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-base text-destructive flex items-center gap-2">
                <Ban className="h-4 w-4" /> {t("sales.refund")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-destructive/80">{t("sales.refundConfirm")}</p>
              <div className="rounded-lg border p-4 space-y-2 bg-muted/30">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("sales.total")}</span>
                  <span className="font-bold text-lg">{formatCurrency(sale.total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("sales.items")}</span>
                  <span>{items.length}</span>
                </div>
                {sale.customerName && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("sales.customer")}</span>
                    <span>{sale.customerName}</span>
                  </div>
                )}
              </div>
              <TextareaField
                label={t("sales.refundReason")}
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder={t("sales.refundReasonPlaceholder")}
              />
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  size="lg"
                  className="flex-1"
                  onClick={() => refundMutation.mutate()}
                  disabled={refundMutation.isPending}
                >
                  {refundMutation.isPending ? t("common.processing") : t("sales.confirmRefund")}
                </Button>
                <Button variant="outline" onClick={() => setRefundMode(false)}>
                  {t("common.cancel")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end no-print">
        <Button variant="outline" size="sm" onClick={() => navigate("/sales")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> {t("common.back")}
        </Button>
      </div>
    </div>
  )
}
