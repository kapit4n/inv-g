import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { Plus, Pencil, Eye } from "lucide-react"
import { EntityListPage } from "@/components/entity"
import { DataTable } from "@/components/data-table"
import type { TableColumn } from "@/types/crud"
import { getProducts } from "@/lib/tauri"
import type { InventoryProduct } from "@/types/inventory"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function ProductsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [search, setSearch] = useState("")

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["inventory-products", page, pageSize, search],
    queryFn: () => getProducts(page, pageSize, search || undefined),
    placeholderData: (prev) => prev,
  })

  const columns: TableColumn<InventoryProduct>[] = [
    { id: "name", header: t("inventory.productName"), accessorKey: "name" },
    { id: "sku", header: t("inventory.sku"), accessorKey: "sku" },
    { id: "barcode", header: t("inventory.barcode"), accessorKey: "barcode", cell: (r) => r.barcode || "-" },
    { id: "costPrice", header: t("inventory.costPrice"), accessorKey: "costPrice", align: "right", cell: (r) => `$${r.costPrice.toFixed(2)}` },
    { id: "salePrice", header: t("inventory.salePrice"), accessorKey: "salePrice", align: "right", cell: (r) => `$${r.salePrice.toFixed(2)}` },
    {
      id: "stockQuantity", header: t("inventory.stockQuantity"), accessorKey: "stockQuantity", align: "center",
      cell: (r) => {
        let variant: "default" | "destructive" | "secondary" = "default"
        if (r.stockQuantity <= 0) variant = "destructive"
        else if (r.stockQuantity <= r.minStockLevel) variant = "secondary"
        return <Badge variant={variant}>{r.stockQuantity}</Badge>
      },
    },
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
      title={t("inventory.products")}
      description={t("inventory.productsDescription")}
      actions={
        <Button onClick={() => navigate("/inventory/products/new")}>
          <Plus className="h-4 w-4 mr-2" /> {t("inventory.addProduct")}
        </Button>
      }
    >
      <DataTable
        data={data?.data ?? []}
        columns={columns}
        total={data?.total ?? 0}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onSearch={setSearch}
        onRefresh={refetch}
        loading={isLoading}
        error={error instanceof Error ? error.message : undefined}
        searchPlaceholder={t("inventory.searchProducts")}
        onRowClick={(row) => navigate(`/inventory/products/${row.id}`)}
        actions={[
          {
            label: t("common.view"), icon: Eye,
            onClick: (row) => navigate(`/inventory/products/${row.id}`),
          },
          {
            label: t("common.edit"), icon: Pencil,
            onClick: (row) => navigate(`/inventory/products/${row.id}/edit`),
          },
        ]}
      />
    </EntityListPage>
  )
}