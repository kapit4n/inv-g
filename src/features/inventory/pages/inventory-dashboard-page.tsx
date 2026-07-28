import { useTranslation } from "react-i18next"
import { useQuery } from "@tanstack/react-query"
import { Package, Tag, Truck, Warehouse as WarehouseIcon, AlertTriangle, XCircle, DollarSign, CheckCircle, XCircle as XCircleIcon } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getDashboardStats } from "@/lib/tauri"
import { Loader2 } from "lucide-react"

export function InventoryDashboardPage() {
  const { t } = useTranslation()
  const { data: stats, isLoading } = useQuery({
    queryKey: ["inventory-dashboard-stats"],
    queryFn: getDashboardStats,
  })

  const cards = [
    {
      title: t("inventory.totalProducts"),
      value: stats?.totalProducts,
      icon: Package,
      color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400",
    },
    {
      title: t("inventory.activeProducts"),
      value: stats?.activeProducts,
      icon: CheckCircle,
      color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400",
    },
    {
      title: t("inventory.inactiveProducts"),
      value: stats?.inactiveProducts,
      icon: XCircleIcon,
      color: "text-gray-600 bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400",
    },
    {
      title: t("inventory.inventoryValue"),
      value: stats ? `$${stats.inventoryValue.toFixed(2)}` : undefined,
      icon: DollarSign,
      color: "text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400",
    },
    {
      title: t("inventory.totalCategories"),
      value: stats?.totalCategories,
      icon: Tag,
      color: "text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400",
    },
    {
      title: t("inventory.totalBrands"),
      value: stats?.totalBrands,
      icon: Package,
      color: "text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400",
    },
    {
      title: t("inventory.totalSuppliers"),
      value: stats?.totalSuppliers,
      icon: Truck,
      color: "text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400",
    },
    {
      title: t("inventory.totalWarehouses"),
      value: stats?.totalWarehouses,
      icon: WarehouseIcon,
      color: "text-teal-600 bg-teal-100 dark:bg-teal-900/30 dark:text-teal-400",
    },
    {
      title: t("inventory.lowStockProducts"),
      value: stats?.lowStockProducts,
      icon: AlertTriangle,
      color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400",
    },
    {
      title: t("inventory.outOfStockProducts"),
      value: stats?.outOfStockProducts,
      icon: XCircle,
      color: "text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400",
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("inventory.dashboard")}
        description={t("inventory.dashboardDescription")}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {cards.map((card) => {
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
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : (
                  <p className="text-2xl font-bold">{card.value ?? 0}</p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}