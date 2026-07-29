import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Users, Car, BellRing, ShieldCheck, DollarSign, UserPlus, Activity } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { getCrmDashboard } from "@/lib/tauri"
import type { CrmDashboard } from "@/types"

export function CrmDashboardPage() {
  const { t } = useTranslation("crm")
  const [data, setData] = useState<CrmDashboard | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCrmDashboard()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const statCards = [
    { title: t("totalCustomers"), value: data?.totalCustomers, icon: Users, color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400" },
    { title: t("newThisMonth"), value: data?.newCustomersMonth, icon: UserPlus, color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400" },
    { title: t("activeCustomers"), value: data?.activeCustomers, icon: Activity, color: "text-violet-600 bg-violet-100 dark:bg-violet-900/30 dark:text-violet-400" },
    { title: t("vehiclesRegistered"), value: data?.vehiclesRegistered, icon: Car, color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400" },
    { title: t("upcomingReminders"), value: data?.upcomingReminders, icon: BellRing, color: "text-rose-600 bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400" },
    { title: t("expiredWarranties"), value: data?.expiredWarranties, icon: ShieldCheck, color: "text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400" },
    { title: t("lifetimeRevenue"), value: data?.lifetimeRevenue, icon: DollarSign, color: "text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400", isCurrency: true },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("dashboard")}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <div className={`p-2 rounded-full ${card.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <p className="text-2xl font-bold">
                    {card.isCurrency ? `$${(card.value ?? 0).toLocaleString()}` : (card.value ?? 0).toLocaleString()}
                  </p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">{t("customers")} {t("dashboard")}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t("totalCustomers")}</span>
                  <span className="font-semibold">{data?.totalCustomers ?? 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t("newThisMonth")}</span>
                  <span className="font-semibold text-emerald-600">+{data?.newCustomersMonth ?? 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t("activeCustomers")}</span>
                  <span className="font-semibold">{data?.activeCustomers ?? 0}</span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Workshops</span>
                  <span className="font-semibold">{data?.workshops ?? 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Fleet Companies</span>
                  <span className="font-semibold">{data?.fleetCompanies ?? 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t("customersWithCredit") as string || "With Credit"}</span>
                  <span className="font-semibold">{data?.customersWithCredit ?? 0}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("customers")} by Type</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
            ) : !data?.customersByType?.length ? (
              <p className="text-sm text-muted-foreground">No data</p>
            ) : (
              <div className="space-y-3">
                {data.customersByType.map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground capitalize">{type}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.min((count / (data.totalCustomers || 1)) * 100, 100)}px` }} />
                      <Badge variant="secondary" className="text-xs">{count}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("vehicles")} Brands</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
            ) : !data?.vehicleBrands?.length ? (
              <p className="text-sm text-muted-foreground">No data</p>
            ) : (
              <div className="space-y-3">
                {data.vehicleBrands.map(([brand, count]) => (
                  <div key={brand} className="flex items-center justify-between">
                    <span className="text-sm">{brand}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min((count / Math.max(...data.vehicleBrands.map(([, c]) => c))) * 100, 100)}%` }} />
                      </div>
                      <span className="text-xs font-medium w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Customers</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : !data?.topCustomers?.length ? (
              <p className="text-sm text-muted-foreground">No data</p>
            ) : (
              <div className="space-y-3">
                {data.topCustomers.map(([name, revenue], idx) => (
                  <div key={name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {idx + 1}
                      </span>
                      <span className="text-sm font-medium">{name}</span>
                    </div>
                    <span className="text-sm font-semibold">${revenue.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
