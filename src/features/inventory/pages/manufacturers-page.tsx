import { useState, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { Plus, Pencil } from "lucide-react"
import { EntityListPage } from "@/components/entity"
import { DataTable } from "@/components/data-table"
import type { TableColumn } from "@/types/crud"
import { getManufacturers } from "@/lib/tauri"
import type { Manufacturer } from "@/types/inventory"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function ManufacturersPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const { data: manufacturers = [], isLoading, error } = useQuery({
    queryKey: ["inventory-manufacturers"],
    queryFn: getManufacturers,
  })

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize
    return {
      data: manufacturers.slice(start, start + pageSize),
      total: manufacturers.length,
    }
  }, [manufacturers, page, pageSize])

  const columns: TableColumn<Manufacturer>[] = [
    { id: "name", header: t("inventory.manufacturerName"), accessorKey: "name" },
    { id: "country", header: t("inventory.manufacturerCountry"), accessorKey: "country", cell: (r) => r.country || "-" },
    { id: "phone", header: t("inventory.manufacturerPhone"), accessorKey: "phone", cell: (r) => r.phone || "-" },
    { id: "email", header: t("inventory.manufacturerEmail"), accessorKey: "email", cell: (r) => r.email || "-" },
    { id: "website", header: t("inventory.manufacturerWebsite"), accessorKey: "website", cell: (r) => r.website || "-" },
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
      title={t("inventory.manufacturers")}
      description={t("inventory.manufacturersDescription")}
      actions={
        <Button onClick={() => navigate("/inventory/manufacturers/new")}>
          <Plus className="h-4 w-4 mr-2" /> {t("inventory.addManufacturer")}
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
        onRowClick={(row) => navigate(`/inventory/manufacturers/${row.id}/edit`)}
        actions={[
          {
            label: t("common.edit"), icon: Pencil,
            onClick: (row) => navigate(`/inventory/manufacturers/${row.id}/edit`),
          },
        ]}
      />
    </EntityListPage>
  )
}