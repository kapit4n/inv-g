import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, Send, Check, X, ShoppingCart, Printer } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { getQuote, getQuoteItems, updateQuoteStatus, convertQuoteToSale } from "@/lib/tauri"
import { useNotification } from "@/hooks/use-notification"
import { usePrint, usePrintConfig } from "@/hooks"
import { buildQuoteDocumentModel, type QuoteLabels } from "@/lib/print"

const statusColors: Record<string, string> = {
  draft: "bg-gray-500", sent: "bg-blue-500", accepted: "bg-green-500",
  rejected: "bg-red-500", expired: "bg-yellow-500", converted: "bg-purple-500",
}

export function QuoteDetailPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams()
  const queryClient = useQueryClient()
  const notification = useNotification()
  const print = usePrint()
  const config = usePrintConfig()

  const { data: quote } = useQuery({
    queryKey: ["quote", Number(id)],
    queryFn: () => getQuote(Number(id)),
    enabled: !!id,
  })

  const { data: items = [] } = useQuery({
    queryKey: ["quote-items", Number(id)],
    queryFn: () => getQuoteItems(Number(id)),
    enabled: !!id,
  })

  const statusMutation = useMutation({
    mutationFn: (status: string) => updateQuoteStatus(Number(id), status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quote", Number(id)] })
      queryClient.invalidateQueries({ queryKey: ["quotes"] })
      notification.success(t("common.success"), "Status updated")
    },
  })

  const convertMutation = useMutation({
    mutationFn: () => convertQuoteToSale(Number(id)),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] })
      queryClient.invalidateQueries({ queryKey: ["sales"] })
      notification.success(t("common.success"), "Quote converted to sale")
      navigate(`/sales/${result.sale.id}`)
    },
  })

  if (!quote) return <div className="p-8 text-center text-muted-foreground">Loading...</div>

  const subtotal = items.reduce((s, i) => s + i.total, 0)
  const total = subtotal + quote.taxAmount - quote.discountAmount

  const handlePrint = () => {
    const labels: QuoteLabels = {
      title: t("sales.quote"),
      subtotal: t("sales.subtotal"),
      tax: t("sales.tax"),
      discount: t("sales.discount"),
      total: t("sales.total"),
      customer: t("sales.customer"),
      validUntil: t("sales.validUntil"),
    }
    const document = buildQuoteDocumentModel(quote, items, config, labels)
    print(document)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={quote.quoteNumber}
        description={`Created ${new Date(quote.createdAt).toLocaleDateString()}`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/sales/quotes")}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          </div>
        }
      />

      <div className="flex gap-2 mb-4">
        <Badge className={`${statusColors[quote.status] || "bg-gray-500"} text-white`}>{quote.status}</Badge>
        {quote.validUntil && <span className="text-sm text-muted-foreground">Valid until: {new Date(quote.validUntil).toLocaleDateString()}</span>}
      </div>

      <div className="flex gap-2 flex-wrap">
        {quote.status === "draft" && (
          <Button size="sm" onClick={() => statusMutation.mutate("sent")}><Send className="h-4 w-4 mr-1" /> Send</Button>
        )}
        {quote.status === "sent" && (
          <>
            <Button size="sm" onClick={() => statusMutation.mutate("accepted")}><Check className="h-4 w-4 mr-1" /> Accept</Button>
            <Button size="sm" variant="destructive" onClick={() => statusMutation.mutate("rejected")}><X className="h-4 w-4 mr-1" /> Reject</Button>
          </>
        )}
        {(quote.status === "accepted" || quote.status === "draft") && (
          <Button size="sm" onClick={() => convertMutation.mutate()}>
            <ShoppingCart className="h-4 w-4 mr-1" /> Convert to Sale
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-1" /> Print
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader><CardTitle className="text-base">{t("sales.items")}</CardTitle></CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2">Product</th><th className="pb-2">SKU</th>
                    <th className="pb-2 text-right">Qty</th><th className="pb-2 text-right">Price</th>
                    <th className="pb-2 text-right">Disc</th><th className="pb-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="py-2">{item.productName || `#${item.productId}`}</td>
                      <td className="py-2 text-muted-foreground">{item.productSku}</td>
                      <td className="py-2 text-right">{item.quantity}</td>
                      <td className="py-2 text-right">{item.unitPrice.toLocaleString("en-US", { style: "currency", currency: "USD" })}</td>
                      <td className="py-2 text-right">{item.discount > 0 ? item.discount.toLocaleString("en-US", { style: "currency", currency: "USD" }) : "-"}</td>
                      <td className="py-2 text-right font-medium">{item.total.toLocaleString("en-US", { style: "currency", currency: "USD" })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {quote.customerName && (
            <Card><CardHeader><CardTitle className="text-base">{t("sales.customer")}</CardTitle></CardHeader>
              <CardContent><p className="text-sm">{quote.customerName}</p></CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle className="text-base">{t("sales.summary")}</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">{t("sales.subtotal")}</span><span>{subtotal.toLocaleString("en-US", { style: "currency", currency: "USD" })}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t("sales.tax")} ({(quote.taxRate * 100).toFixed(0)}%)</span><span>{quote.taxAmount.toLocaleString("en-US", { style: "currency", currency: "USD" })}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t("sales.discount")}</span><span>{quote.discountAmount > 0 ? quote.discountAmount.toLocaleString("en-US", { style: "currency", currency: "USD" }) : "-"}</span></div>
              <Separator />
              <div className="flex justify-between font-bold text-base"><span>{t("sales.total")}</span><span>{total.toLocaleString("en-US", { style: "currency", currency: "USD" })}</span></div>
            </CardContent>
          </Card>

          {quote.notes && (
            <Card><CardHeader><CardTitle className="text-base">Notes</CardTitle></CardHeader>
              <CardContent><p className="text-sm whitespace-pre-wrap">{quote.notes}</p></CardContent>
            </Card>
          )}
          {quote.termsConditions && (
            <Card><CardHeader><CardTitle className="text-base">Terms & Conditions</CardTitle></CardHeader>
              <CardContent><p className="text-sm whitespace-pre-wrap">{quote.termsConditions}</p></CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
