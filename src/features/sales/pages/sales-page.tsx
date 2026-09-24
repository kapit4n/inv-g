import { useState, useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { Plus, DollarSign, CreditCard, Receipt, ClipboardList, Quote, Search, TrendingUp } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/data-table"
import { StatCard } from "@/components/stat-card"
import type { TableColumn } from "@/types/crud"
import { getSales, getSalesSummary, searchSales } from "@/lib/tauri"
import type { Sale } from "@/types"

export function SalesPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")

  const { data: summary } = useQuery({
    queryKey: ["sales-summary"],
    queryFn: getSalesSummary,
  })

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ["sales"],
    queryFn: getSales,
  })

  const { data: searchedSales = [] } = useQuery({
    queryKey: ["sales-search", debouncedSearch],
    queryFn: () => searchSales(debouncedSearch),
    enabled: debouncedSearch.length > 0,
  })

  const displaySales = useMemo(() => {
    if (debouncedSearch) return searchedSales
    return sales
  }, [sales, searchedSales, debouncedSearch])

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setSearchQuery(value)
      const timer = setTimeout(() => setDebouncedSearch(value), 300)
      return () => clearTimeout(timer)
    },
    []
  )

  const statusBadge = useCallback((status: string) => {
    const variants: Record<string, "success" | "warning" | "destructive" | "info"> = {
      paid: "success",
      pending: "warning",
      refunded: "destructive",
      partial: "info",
    }
    return (
      <Badge variant={variants[status] || "outline"} className="capitalize">
        {t(`sales.${status}`)}
      </Badge>
    )
  }, [t])

  const formatCurrency = (value: number) =>
    value.toLocaleString("en-US", { style: "currency", currency: "USD" })

  const columns: TableColumn<Sale>[] = [
    {
      id: "saleNumber",
      header: t("sales.invoice"),
      accessorKey: "saleNumber",
      cell: (r) => <span className="font-mono font-medium text-xs">{r.saleNumber}</span>,
    },
    {
      id: "createdAt",
      header: t("sales.date"),
      accessorKey: "createdAt",
      cell: (r) => (
        <span className="text-xs text-muted-foreground">
          {new Date(r.createdAt).toLocaleDateString()} {new Date(r.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      ),
    },
    {
      id: "customerId",
      header: t("sales.customer"),
      accessorKey: "customerId",
      cell: (r) => (
        <span className="text-sm">
          {r.customerName || (r.customerId ? `#${r.customerId}` : "-")}
        </span>
      ),
    },
    {
      id: "itemCount",
      header: t("inventory.items"),
      accessorKey: "itemCount",
      cell: (r) => <span className="text-sm">{r.itemCount ?? "-"}</span>,
      align: "center",
    },
    {
      id: "total",
      header: t("sales.total"),
      accessorKey: "total",
      cell: (r) => <span className="font-medium tabular-nums">{formatCurrency(r.total)}</span>,
      align: "right",
    },
    {
      id: "paymentStatus",
      header: t("common.status"),
      accessorKey: "paymentStatus",
      cell: (r) => statusBadge(r.paymentStatus),
      align: "center",
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("sales.title")}
        description={t("sales.description")}
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => navigate("/sales/quotes")}>
              <Quote className="h-4 w-4 mr-1" /> {t("sales.quotes")}
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigate("/sales/closeout")}>
              <ClipboardList className="h-4 w-4 mr-1" /> {t("sales.dailyCloseout")}
            </Button>
            <Button size="sm" onClick={() => navigate("/sales/new")}>
              <Plus className="h-4 w-4 mr-1" /> {t("sales.newSale")}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t("sales.todaysRevenue")}
          value={summary ? formatCurrency(summary.revenueToday) : "$0.00"}
          icon={<DollarSign className="h-5 w-5" />}
          trend={summary && summary.revenueToday > 0 ? "up" : undefined}
        />
        <StatCard
          title={t("sales.todaysTransactions")}
          value={summary?.totalSalesToday ?? 0}
          icon={<Receipt className="h-5 w-5" />}
        />
        <StatCard
          title={t("sales.averageOrder")}
          value={summary ? formatCurrency(summary.averageOrderValue) : "$0.00"}
          icon={<CreditCard className="h-5 w-5" />}
        />
        <StatCard
          title={t("sales.monthSales")}
          value={summary ? formatCurrency(summary.revenueMonth) : "$0.00"}
          icon={<TrendingUp className="h-5 w-5" />}
        />
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative mb-4 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("sales.searchSales")}
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-9"
            />
          </div>
          <DataTable
            data={displaySales}
            columns={columns}
            total={displaySales.length}
            page={1}
            pageSize={displaySales.length || 20}
            loading={isLoading}
            onRowClick={(row) => navigate(`/sales/${row.id}`)}
            disableSearch
            emptyMessage={t("sales.noSales")}
          />
        </CardContent>
      </Card>
    </div>
  )
}
