import { useState, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { Plus, Pencil } from "lucide-react"
import { EntityListPage } from "@/components/entity"
import { DataTable } from "@/components/data-table"
import type { TableColumn } from "@/types/crud"
import { getCategories } from "@/lib/tauri"
import type { InventoryCategory } from "@/types/inventory"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function CategoriesPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const { data: categories = [], isLoading, error } = useQuery({
    queryKey: ["inventory-categories"],
    queryFn: getCategories,
  })

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize
    return {
      data: categories.slice(start, start + pageSize),
      total: categories.length,
    }
  }, [categories, page, pageSize])

  const columns: TableColumn<InventoryCategory>[] = [
    { id: "name", header: t("inventory.categoryName"), accessorKey: "name" },
    {
      id: "description", header: t("inventory.categoryDescription"), accessorKey: "description",
      cell: (row) => row.description || "-",
    },
    { id: "sortOrder", header: t("inventory.sortOrder"), accessorKey: "sortOrder", align: "center" },
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
      title={t("inventory.categories")}
      description={t("inventory.categoriesDescription")}
      actions={
        <Button onClick={() => navigate("/inventory/categories/new")}>
          <Plus className="h-4 w-4 mr-2" /> {t("inventory.addCategory")}
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
        onRowClick={(row) => navigate(`/inventory/categories/${row.id}/edit`)}
        actions={[
          {
            label: t("common.edit"), icon: Pencil,
            onClick: (row) => navigate(`/inventory/categories/${row.id}/edit`),
          },
        ]}
      />
    </EntityListPage>
  )
}