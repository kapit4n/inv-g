import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { Plus } from "lucide-react"
import { EntityListPage } from "@/components/entity"
import { DataTable } from "@/components/data-table"
import type { TableColumn } from "@/types/crud"
import { getInventoryMovements } from "@/lib/tauri"
import type { InventoryMovement } from "@/types/inventory"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function InventoryMovementsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const { data: movements = [], isLoading, error } = useQuery({
    queryKey: ["inventory-movements"],
    queryFn: () => getInventoryMovements(),
  })

  const paginated = useMemo(() => {
    return { data: movements, total: movements.length }
  }, [movements])

  const typeVariant = (type: string): "default" | "success" | "destructive" | "secondary" => {
    switch (type) {
      case "in": return "success"
      case "out": return "destructive"
      case "adjustment": return "secondary"
      default: return "default"
    }
  }

  const columns: TableColumn<InventoryMovement>[] = [
    { id: "id", header: "#", accessorKey: "id" },
    { id: "productId", header: t("inventory.productId"), accessorKey: "productId" },
    { id: "type", header: t("inventory.movementType"), accessorKey: "type",
      cell: (r) => <Badge variant={typeVariant(r.type)}>{t(`inventory.movementType${r.type.charAt(0).toUpperCase() + r.type.slice(1)}`)}</Badge>,
    },
    { id: "quantity", header: t("inventory.quantity"), accessorKey: "quantity",
      cell: (r) => <span className={r.quantity > 0 ? "text-green-600" : "text-red-600"}>{r.quantity > 0 ? `+${r.quantity}` : r.quantity}</span>,
    },
    { id: "notes", header: t("inventory.notes"), accessorKey: "notes", cell: (r) => r.notes || "-" },
    { id: "createdAt", header: t("common.createdAt"), accessorKey: "createdAt", cell: (r) => new Date(r.createdAt).toLocaleDateString() },
  ]

  return (
    <EntityListPage
      title={t("inventory.inventoryMovements")}
      description={t("inventory.inventoryMovementsDescription")}
      actions={
        <Button onClick={() => navigate("/inventory/movements/new")}>
          <Plus className="h-4 w-4 mr-2" /> {t("inventory.addMovement")}
        </Button>
      }
    >
      <DataTable
        data={paginated.data}
        columns={columns}
        total={paginated.total}
        page={1}
        pageSize={paginated.total}
        loading={isLoading}
        error={error instanceof Error ? error.message : undefined}
      />
    </EntityListPage>
  )
}
