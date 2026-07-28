import { useState, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { Plus, Pencil } from "lucide-react"
import { EntityListPage } from "@/components/entity"
import { DataTable } from "@/components/data-table"
import type { TableColumn } from "@/types/crud"
import { getWarehouses } from "@/lib/tauri"
import type { Warehouse } from "@/types/inventory"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function WarehousesPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const { data: warehouses = [], isLoading, error } = useQuery({
    queryKey: ["inventory-warehouses"],
    queryFn: getWarehouses,
  })

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize
    return {
      data: warehouses.slice(start, start + pageSize),
      total: warehouses.length,
    }
  }, [warehouses, page, pageSize])

  const columns: TableColumn<Warehouse>[] = [
    { id: "name", header: t("inventory.warehouseName"), accessorKey: "name" },
    { id: "code", header: t("inventory.warehouseCode"), accessorKey: "code" },
    { id: "city", header: t("inventory.warehouseCity"), accessorKey: "city", cell: (r) => r.city || "-" },
    { id: "manager", header: t("inventory.warehouseManager"), accessorKey: "manager", cell: (r) => r.manager || "-" },
    { id: "phone", header: t("inventory.warehousePhone"), accessorKey: "phone", cell: (r) => r.phone || "-" },
    {
      id: "isActive", header: t("common.status"), accessorKey: "isActive", align: "center",
      cell: (row) => (
        <Badge variant={row.isActive ? "default" : "secondary"}>
          {row.isActive ? t("common.active") : t("common.inactive")}
        </Badge>
      ),
    },
  ]

  return (
    <EntityListPage
      title={t("inventory.warehouses")}
      description={t("inventory.warehousesDescription")}
      actions={
        <Button onClick={() => navigate("/inventory/warehouses/new")}>
          <Plus className="h-4 w-4 mr-2" /> {t("inventory.addWarehouse")}
        </Button>
      }
    >
      <DataTable
        data={paginated.data}
        columns={columns}
        total={paginated.total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        loading={isLoading}
        error={error instanceof Error ? error.message : undefined}
        onRowClick={(row) => navigate(`/inventory/warehouses/${row.id}/edit`)}
        actions={[
          {
            label: t("common.edit"), icon: Pencil,
            onClick: (row) => navigate(`/inventory/warehouses/${row.id}/edit`),
          },
        ]}
      />
    </EntityListPage>
  )
}