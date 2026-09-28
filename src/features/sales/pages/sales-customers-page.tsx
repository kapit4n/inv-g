import { useState, useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { Plus, Search, Users, UserCheck, UserX, UserPlus } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/data-table"
import { StatCard } from "@/components/stat-card"
import type { TableColumn } from "@/types/crud"
import { getCustomers } from "@/lib/tauri"
import type { Customer } from "@/types"

export function SalesCustomersPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["sales-customers", debouncedSearch],
    queryFn: () => getCustomers(debouncedSearch || undefined),
  })

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setSearchQuery(value)
      const timer = setTimeout(() => setDebouncedSearch(value), 300)
      return () => clearTimeout(timer)
    },
    []
  )

  const stats = useMemo(() => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    return {
      total: customers.length,
      active: customers.filter((c) => c.isActive).length,
      inactive: customers.filter((c) => !c.isActive).length,
      newThisMonth: customers.filter((c) => new Date(c.createdAt) >= startOfMonth).length,
    }
  }, [customers])

  const columns: TableColumn<Customer>[] = [
    {
      id: "name",
      header: t("sales.customerName"),
      accessorKey: "name",
      cell: (r) => <span className="font-medium text-sm">{r.name}</span>,
    },
    {
      id: "email",
      header: t("sales.email"),
      accessorKey: "email",
      cell: (r) => <span className="text-sm text-muted-foreground">{r.email || "-"}</span>,
    },
    {
      id: "phone",
      header: t("sales.phone"),
      accessorKey: "phone",
      cell: (r) => <span className="text-sm text-muted-foreground">{r.phone || "-"}</span>,
    },
    {
      id: "city",
      header: t("sales.city"),
      accessorKey: "city",
      cell: (r) => <span className="text-sm">{r.city || "-"}</span>,
    },
    {
      id: "createdAt",
      header: t("sales.registeredOn"),
      accessorKey: "createdAt",
      cell: (r) => (
        <span className="text-xs text-muted-foreground">
          {new Date(r.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: "isActive",
      header: t("sales.status"),
      accessorKey: "isActive",
      cell: (r) => (
        <Badge variant={r.isActive ? "success" : "secondary"}>
          {r.isActive ? t("sales.active") : t("sales.inactive")}
        </Badge>
      ),
      align: "center",
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("sales.customers")}
        description={t("sales.registeredCustomers")}
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => navigate("/crm/customers")}>
              <Users className="h-4 w-4 mr-1" /> {t("sales.manageCustomers")}
            </Button>
            <Button size="sm" onClick={() => navigate("/sales/new")}>
              <Plus className="h-4 w-4 mr-1" /> {t("sales.newSale")}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t("sales.totalCustomers")}
          value={stats.total}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          title={t("sales.activeCustomers")}
          value={stats.active}
          icon={<UserCheck className="h-5 w-5" />}
        />
        <StatCard
          title={t("sales.inactiveCustomers")}
          value={stats.inactive}
          icon={<UserX className="h-5 w-5" />}
        />
        <StatCard
          title={t("sales.newThisMonth")}
          value={stats.newThisMonth}
          icon={<UserPlus className="h-5 w-5" />}
        />
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative mb-4 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("sales.searchCustomers")}
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-9"
            />
          </div>
          <DataTable
            data={customers}
            columns={columns}
            total={customers.length}
            page={1}
            pageSize={customers.length || 20}
            loading={isLoading}
            onRowClick={(row) => navigate(`/customers/${row.id}`)}
            disableSearch
            emptyMessage={t("sales.noCustomersFound")}
          />
        </CardContent>
      </Card>
    </div>
  )
}
