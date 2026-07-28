import { useState, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { Plus } from "lucide-react"
import { EntityListPage } from "@/components/entity"
import { DataTable } from "@/components/data-table"
import type { TableColumn } from "@/types/crud"
import { getStorageLocations, getWarehouses } from "@/lib/tauri"
import type { StorageLocation } from "@/types/inventory"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function StorageLocationsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const { data: locations = [], isLoading, error } = useQuery({
    queryKey: ["inventory-storage-locations"],
    queryFn: () => getStorageLocations(),
  })

  const { data: warehouses = [] } = useQuery({
    queryKey: ["inventory-warehouses"],
    queryFn: getWarehouses,
  })

  const warehouseMap = useMemo(() => {
    const m: Record<number, string> = {}
    for (const w of warehouses) m[w.id] = w.name
    return m
  }, [warehouses])

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize
    return {
      data: locations.slice(start, start + pageSize),
      total: locations.length,
    }
  }, [locations, page, pageSize])

  const columns: TableColumn<StorageLocation>[] = [
    { id: "code", header: t("inventory.storageCode"), accessorKey: "code" },
    {
      id: "warehouseId", header: t("inventory.storageWarehouse"), accessorKey: "warehouseId",
      cell: (r) => warehouseMap[r.warehouseId] || `#${r.warehouseId}`,
    },
    { id: "zone", header: t("inventory.storageZone"), accessorKey: "zone", cell: (r) => r.zone || "-" },
    { id: "aisle", header: t("inventory.storageAisle"), accessorKey: "aisle", cell: (r) => r.aisle || "-" },
    { id: "shelf", header: t("inventory.storageShelf"), accessorKey: "shelf", cell: (r) => r.shelf || "-" },
    { id: "bin", header: t("inventory.storageBin"), accessorKey: "bin", cell: (r) => r.bin || "-" },
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
      title={t("inventory.storageLocations")}
      description={t("inventory.storageLocationsDescription")}
      actions={
        <Button onClick={() => navigate("/inventory/storage-locations/new")}>
          <Plus className="h-4 w-4 mr-2" /> {t("inventory.addStorageLocation")}
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
      />
    </EntityListPage>
  )
}