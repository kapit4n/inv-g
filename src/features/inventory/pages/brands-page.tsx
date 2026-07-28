import { useState, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { Plus, Pencil } from "lucide-react"
import { EntityListPage } from "@/components/entity"
import { DataTable } from "@/components/data-table"
import type { TableColumn } from "@/types/crud"
import { getBrands } from "@/lib/tauri"
import type { Brand } from "@/types/inventory"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function BrandsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const { data: brands = [], isLoading, error } = useQuery({
    queryKey: ["inventory-brands"],
    queryFn: getBrands,
  })

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize
    return {
      data: brands.slice(start, start + pageSize),
      total: brands.length,
    }
  }, [brands, page, pageSize])

  const columns: TableColumn<Brand>[] = [
    { id: "name", header: t("inventory.brandName"), accessorKey: "name" },
    { id: "country", header: t("inventory.brandCountry"), accessorKey: "country", cell: (r) => r.country || "-" },
    { id: "website", header: t("inventory.brandWebsite"), accessorKey: "website", cell: (r) => r.website || "-" },
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
      title={t("inventory.brands")}
      description={t("inventory.brandsDescription")}
      actions={
        <Button onClick={() => navigate("/inventory/brands/new")}>
          <Plus className="h-4 w-4 mr-2" /> {t("inventory.addBrand")}
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
        onRowClick={(row) => navigate(`/inventory/brands/${row.id}/edit`)}
        actions={[
          {
            label: t("common.edit"), icon: Pencil,
            onClick: (row) => navigate(`/inventory/brands/${row.id}/edit`),
          },
        ]}
      />
    </EntityListPage>
  )
}