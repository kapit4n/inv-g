import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { DollarSign, CreditCard, TrendingUp, AlertCircle } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { getCustomers, getCreditAccount } from "@/lib/tauri"
import type { CreditAccount } from "@/types"

export function CrmCreditPage() {
  const { t } = useTranslation("crm")
  const [accounts, setAccounts] = useState<(CreditAccount & { customerName?: string })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const customers = await getCustomers()
        const activeCustomers = customers.filter((c) => c.isActive)
        const accs: (CreditAccount & { customerName?: string })[] = []
        for (const c of activeCustomers) {
          try {
            const acc = await getCreditAccount(c.id)
            accs.push({ ...acc, customerName: c.name })
          } catch { }
        }
        setAccounts(accs)
      } catch { } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const totalCreditExtended = accounts.reduce((sum, a) => sum + a.creditLimit, 0)
  const totalOutstanding = accounts.reduce((sum, a) => sum + a.currentBalance, 0)
  const totalAvailable = totalCreditExtended - totalOutstanding
  const atRiskAccounts = accounts.filter((a) => a.currentBalance > a.creditLimit * 0.8)

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("credit")}
        description={t("customerCreditOverview")}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">{t("totalCreditExtended")}</CardTitle>
            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
              <CreditCard className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-2xl font-bold">${totalCreditExtended.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">{t("totalOutstanding")}</CardTitle>
            <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/30">
              <DollarSign className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-2xl font-bold">${totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">{t("availableCredit")}</CardTitle>
            <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
              <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-2xl font-bold">${totalAvailable.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {atRiskAccounts.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/10 dark:border-amber-800">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
            <p className="text-sm text-amber-800 dark:text-amber-200">
              {t("atRiskAccounts", { count: atRiskAccounts.length })}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0 overflow-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("customer")}</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">{t("creditLimit")}</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">{t("currentBalance")}</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">{t("availableCredit")}</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">{t("utilization")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("status")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b last:border-0">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : accounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">{t("noCreditAccountsFound")}</td>
                </tr>
              ) : (
                accounts.map((a) => {
                  const utilization = a.creditLimit > 0 ? (a.currentBalance / a.creditLimit) * 100 : 0
                  return (
                    <tr key={a.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium">{a.customerName || `#${a.customerId}`}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium">${a.creditLimit.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium">${a.currentBalance.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium">${(a.creditLimit - a.currentBalance).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="h-2 w-16 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full ${utilization > 80 ? "bg-destructive" : utilization > 50 ? "bg-amber-500" : "bg-green-500"}`}
                              style={{ width: `${Math.min(utilization, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">{utilization.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={a.status === "active" ? "success" : "secondary"}>
                          {a.status}
                        </Badge>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
