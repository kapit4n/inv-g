import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { DollarSign, CreditCard, Banknote, Receipt, RotateCcw, TrendingUp, Percent, BadgePercent, Printer, Lock, ArrowLeft, History } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { StatCard } from "@/components/stat-card"
import { getDailyCloseout, closeDailyShift, getDailyClosings } from "@/lib/tauri"
import { useNotification } from "@/hooks/use-notification"
import { useCurrentUser } from "@/hooks/use-auth"
import type { DailyClosing } from "@/types"

export function CloseoutPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const notification = useNotification()
  const { user } = useCurrentUser()

  const { data, isLoading } = useQuery({
    queryKey: ["daily-closeout"],
    queryFn: getDailyCloseout,
  })

  const { data: closings = [] } = useQuery({
    queryKey: ["daily-closings"],
    queryFn: getDailyClosings,
  })

  const closeShiftMutation = useMutation({
    mutationFn: () => closeDailyShift(user?.id ?? 0),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-closeout"] })
      queryClient.invalidateQueries({ queryKey: ["daily-closings"] })
      queryClient.invalidateQueries({ queryKey: ["sales"] })
      notification.success(t("common.success"), t("sales.shiftClosed"))
    },
    onError: (err) => {
      notification.error(t("common.error"), String(err))
    },
  })

  const formatCurrency = (value: number) =>
    value.toLocaleString("en-US", { style: "currency", currency: "USD" })

  const handlePrint = () => window.print()

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">{t("common.loading")}</div>

  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #closeout-area, #closeout-area * { visibility: visible; }
          #closeout-area { position: absolute; left: 0; top: 0; width: 80mm; padding: 10px; font-size: 12px; font-family: monospace; }
          #closeout-area .no-print { display: none !important; }
        }
      `}</style>

      <div id="closeout-area" className="hidden print:block">
        <div style={{ textAlign: "center", marginBottom: 10 }}>
          <strong style={{ fontSize: 16 }}>{t("common.appName")}</strong>
          <div>{t("sales.dailyCloseout")}</div>
          <div style={{ fontSize: 10 }}>{new Date().toLocaleDateString()}</div>
        </div>
        <div style={{ borderTop: "1px dashed #000", borderBottom: "1px dashed #000", padding: "5px 0", marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>{t("sales.totalSales")}</span>
            <span>{data?.totalSales ?? 0}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>{t("sales.totalRevenue")}</span>
            <span>{formatCurrency(data?.totalRevenue ?? 0)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>{t("sales.totalTax")}</span>
            <span>{formatCurrency(data?.totalTax ?? 0)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>{t("sales.totalDiscount")}</span>
            <span>{formatCurrency(data?.totalDiscount ?? 0)}</span>
          </div>
        </div>
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>{t("sales.cash")}</span>
            <span>{formatCurrency(data?.cashTotal ?? 0)} ({data?.cashCount ?? 0}x)</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>{t("sales.card")}</span>
            <span>{formatCurrency(data?.cardTotal ?? 0)} ({data?.cardCount ?? 0}x)</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>{t("sales.transfer")}</span>
            <span>{formatCurrency(data?.transferTotal ?? 0)} ({data?.transferCount ?? 0}x)</span>
          </div>
        </div>
        {(data?.refundedCount ?? 0) > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
            <span>{t("sales.refunds")}</span>
            <span>-{formatCurrency(data?.refundedTotal ?? 0)} ({data?.refundedCount}x)</span>
          </div>
        )}
        <div style={{ borderTop: "1px solid #000", padding: "5px 0", display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: 14 }}>
          <span>{t("sales.netRevenue")}</span>
          <span>{formatCurrency((data?.totalRevenue ?? 0) - (data?.refundedTotal ?? 0))}</span>
        </div>
        <div style={{ textAlign: "center", fontSize: 10, marginTop: 15 }}>{t("common.print")}: {new Date().toLocaleString()}</div>
      </div>

      <PageHeader
        title={t("sales.dailyCloseout")}
        description={new Date().toLocaleDateString()}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/sales")}>
              <ArrowLeft className="h-4 w-4 mr-1" /> {t("common.back")}
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-1" /> {t("common.print")}
            </Button>
            <Button
              size="sm"
              onClick={() => closeShiftMutation.mutate()}
              disabled={closeShiftMutation.isPending || !user}
            >
              <Lock className="h-4 w-4 mr-1" />
              {closeShiftMutation.isPending ? t("common.processing") : t("sales.closeDay")}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t("sales.totalSales")}
          value={data?.totalSales ?? 0}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatCard
          title={t("sales.totalRevenue")}
          value={data ? formatCurrency(data.totalRevenue) : "$0.00"}
          icon={<DollarSign className="h-5 w-5" />}
        />
        <StatCard
          title={t("sales.totalTax")}
          value={data ? formatCurrency(data.totalTax) : "$0.00"}
          icon={<Percent className="h-5 w-5" />}
        />
        <StatCard
          title={t("sales.totalDiscount")}
          value={data ? formatCurrency(data.totalDiscount) : "$0.00"}
          icon={<BadgePercent className="h-5 w-5" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Banknote className="h-4 w-4" /> {t("sales.cash")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("sales.transactions")}</span>
              <span className="font-medium">{data?.cashCount ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("sales.total")}</span>
              <span className="font-bold tabular-nums">{formatCurrency(data?.cashTotal ?? 0)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="h-4 w-4" /> {t("sales.card")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("sales.transactions")}</span>
              <span className="font-medium">{data?.cardCount ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("sales.total")}</span>
              <span className="font-bold tabular-nums">{formatCurrency(data?.cardTotal ?? 0)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Receipt className="h-4 w-4" /> {t("sales.transfer")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("sales.transactions")}</span>
              <span className="font-medium">{data?.transferCount ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("sales.total")}</span>
              <span className="font-bold tabular-nums">{formatCurrency(data?.transferTotal ?? 0)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {(data?.refundedCount ?? 0) > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-destructive">
              <RotateCcw className="h-4 w-4" /> {t("sales.refunds")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("sales.transactions")}</span>
              <span className="font-medium">{data?.refundedCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("sales.total")}</span>
              <span className="font-bold tabular-nums text-destructive">-{formatCurrency(data?.refundedTotal ?? 0)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("sales.summary")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("sales.totalRevenue")}</span>
            <span className="tabular-nums">{formatCurrency(data?.totalRevenue ?? 0)}</span>
          </div>
          {(data?.refundedTotal ?? 0) > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("sales.refunds")}</span>
              <span className="tabular-nums text-destructive">-{formatCurrency(data?.refundedTotal ?? 0)}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between font-bold text-base">
            <span>{t("sales.netRevenue")}</span>
            <span className="tabular-nums">{formatCurrency((data?.totalRevenue ?? 0) - (data?.refundedTotal ?? 0))}</span>
          </div>
        </CardContent>
      </Card>

      {closings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4" /> {t("sales.closingHistory")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 px-4 font-medium">{t("sales.date")}</th>
                  <th className="pb-2 px-4 font-medium">{t("sales.closedBy")}</th>
                  <th className="pb-2 px-4 font-medium text-right">{t("sales.totalSales")}</th>
                  <th className="pb-2 px-4 font-medium text-right">{t("sales.totalRevenue")}</th>
                  <th className="pb-2 px-4 font-medium text-right">{t("sales.netRevenue")}</th>
                  <th className="pb-2 px-4 font-medium text-right">{t("sales.cash")}</th>
                  <th className="pb-2 px-4 font-medium text-right">{t("sales.card")}</th>
                  <th className="pb-2 px-4 font-medium text-right">{t("sales.transfer")}</th>
                </tr>
              </thead>
              <tbody>
                {closings.map((c: DailyClosing) => (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="py-3 px-4 text-xs text-muted-foreground">
                      {new Date(c.closedAt).toLocaleDateString()} {new Date(c.closedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="py-3 px-4 font-medium">{c.closedByName || `#${c.closedBy}`}</td>
                    <td className="py-3 px-4 text-right tabular-nums">{c.totalSales}</td>
                    <td className="py-3 px-4 text-right tabular-nums">{formatCurrency(c.totalRevenue)}</td>
                    <td className="py-3 px-4 text-right font-medium tabular-nums">{formatCurrency(c.netRevenue)}</td>
                    <td className="py-3 px-4 text-right tabular-nums">{formatCurrency(c.cashTotal)}</td>
                    <td className="py-3 px-4 text-right tabular-nums">{formatCurrency(c.cardTotal)}</td>
                    <td className="py-3 px-4 text-right tabular-nums">{formatCurrency(c.transferTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
