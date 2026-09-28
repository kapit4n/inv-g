import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useQueryClient } from "@tanstack/react-query"
import { Navigate } from "react-router-dom"
import { AlertTriangle, Ban, CheckCircle2, Eraser, ListChecks, ShoppingCart } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { PermissionGuard } from "@/components/permission-guard"
import { useNotification, useSalesResetEnabled, useInvalidateStock } from "@/hooks"
import { useAuthStore } from "@/stores"
import { getSalesResetPreview, resetSales } from "@/lib/tauri"
import type { SalesResetPreview, SalesResetResult } from "@/types"

const RESET_CONFIRM_TEXT = "RESET"

export function AdminSalesResetPage() {
  const { t } = useTranslation()
  const notify = useNotification()
  const queryClient = useQueryClient()
  const invalidateStock = useInvalidateStock()
  const user = useAuthStore((s) => s.user)
  const enabled = useSalesResetEnabled()

  const [preview, setPreview] = useState<SalesResetPreview | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirm, setConfirm] = useState("")
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<SalesResetResult | null>(null)

  const loadPreview = useCallback(() => {
    setLoading(true)
    getSalesResetPreview()
      .then(setPreview)
      .catch((e) => notify.error(t("admin.salesReset.previewError") + (e ? `: ${String(e)}` : "")))
      .finally(() => setLoading(false))
  }, [notify, t])

  useEffect(() => {
    if (enabled) loadPreview()
  }, [enabled, loadPreview])

  if (!enabled) {
    return <Navigate to="/admin" replace />
  }

  const canConfirm = confirm === RESET_CONFIRM_TEXT && !running

  const handleReset = async () => {
    setRunning(true)
    try {
      const res = await resetSales(confirm, user?.id)
      setResult(res)
      setConfirm("")
      setPreview(null)
      loadPreview()
      // Everything selling-derived is now stale throughout the app.
      queryClient.invalidateQueries({ queryKey: ["sales"] })
      queryClient.invalidateQueries({ queryKey: ["daily-closeout"] })
      queryClient.invalidateQueries({ queryKey: ["daily-closings"] })
      queryClient.invalidateQueries({ queryKey: ["sales-summary"] })
      queryClient.invalidateQueries({ queryKey: ["cash-register-status"] })
      queryClient.invalidateQueries({ queryKey: ["cash-register-sessions"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-widgets"] })
      invalidateStock()
      notify.success(t("admin.salesReset.success"))
    } catch (e) {
      notify.error(t("admin.salesReset.error") + (e ? `: ${String(e)}` : ""))
    } finally {
      setRunning(false)
    }
  }

  const removedRows = [
    { label: t("admin.salesReset.sales"), value: preview?.sales },
    { label: t("admin.salesReset.saleItems"), value: preview?.saleItems },
    { label: t("admin.salesReset.salePayments"), value: preview?.salePayments },
    { label: t("admin.salesReset.receipts"), value: preview?.receipts },
    { label: t("admin.salesReset.quotes"), value: preview?.quotes },
    { label: t("admin.salesReset.heldSales"), value: preview?.heldSales },
    { label: t("admin.salesReset.cashRegisterSessions"), value: preview?.cashRegisterSessions },
    { label: t("admin.salesReset.dailyClosings"), value: preview?.dailyClosings },
    { label: t("admin.salesReset.inventoryMovements"), value: preview?.inventoryMovements },
  ]

  const resultRows = result
    ? [
        { label: t("admin.salesReset.sales"), value: result.deletedSales },
        { label: t("admin.salesReset.quotes"), value: result.deletedQuotes },
        { label: t("admin.salesReset.heldSales"), value: result.deletedHeldSales },
        { label: t("admin.salesReset.cashRegisterSessions"), value: result.deletedCashRegisterSessions },
        { label: t("admin.salesReset.dailyClosings"), value: result.deletedDailyClosings },
        { label: t("admin.salesReset.inventoryMovements"), value: result.deletedInventoryMovements },
        { label: t("admin.salesReset.saleItems"), value: result.deletedSaleItems },
        { label: t("admin.salesReset.salePayments"), value: result.deletedSalePayments },
        { label: t("admin.salesReset.receipts"), value: result.deletedReceipts },
      ]
    : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("admin.salesReset.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("admin.salesReset.description")}</p>
      </div>

      <Card className="border-destructive/40 bg-destructive/5">
        <CardContent className="p-6 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div className="space-y-1 text-sm">
            <p className="font-medium">{t("admin.salesReset.warning")}</p>
            <p className="text-muted-foreground">{t("admin.salesReset.warningHint")}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><ListChecks className="h-4 w-4" /> {t("admin.salesReset.removedTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && !preview ? (
              <div className="space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
            ) : result ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-green-600">{t("admin.salesReset.completed")}</p>
                {resultRows.map((row) => (
                  <div key={row.label} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{row.label}</span>
                    <span className="text-sm font-medium">{row.value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <ul className="space-y-2">
                {removedRows.map((row) => (
                  <li key={row.label} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{row.label}</span>
                    <span className="text-sm font-medium">{row.value ?? "-"}</span>
                  </li>
                ))}
                <li className="flex items-center justify-between border-t pt-2 mt-2">
                  <span className="text-sm font-medium">{t("admin.salesReset.salesRevenue")}</span>
                  <span className="text-sm font-medium">{preview ? preview.salesRevenue.toFixed(2) : "-"}</span>
                </li>
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> {t("admin.salesReset.keptTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {(t("admin.salesReset.kept", { returnObjects: true }) as string[]).map((item) => (
                <li key={item} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{item}</span>
                  <Ban className="h-4 w-4 text-muted-foreground" />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <PermissionGuard permission="admin.database.manage">
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-destructive"><Eraser className="h-4 w-4" /> {t("admin.salesReset.actionTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{t("admin.salesReset.confirmHint")}</p>
            <div className="space-y-2">
              <Label htmlFor="reset-confirm">{t("admin.salesReset.confirmLabel")}</Label>
              <Input
                id="reset-confirm"
                value={confirm}
                autoCapitalize="off"
                autoCorrect="off"
                autoComplete="off"
                onChange={(e) => setConfirm(e.target.value)}
                className="max-w-xs"
              />
            </div>
            <Button
              variant="destructive"
              onClick={handleReset}
              disabled={!canConfirm}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              {running ? t("admin.salesReset.running") : t("admin.salesReset.action")}
            </Button>
          </CardContent>
        </Card>
      </PermissionGuard>
    </div>
  )
}