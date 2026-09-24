import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { Plus, Search, Filter } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SelectField } from "@/components/forms"
import { getPurchaseOrders, getSuppliers } from "@/lib/tauri"
import type { PurchaseOrder } from "@/types"
import type { InventorySupplier } from "@/types/inventory"

type StatusVariant = "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info"

const statusVariant: Record<string, StatusVariant> = {
  draft: "secondary",
  pending_approval: "warning",
  approved: "info",
  sent: "default",
  partially_received: "warning",
  received: "success",
  cancelled: "destructive",
}

const statusLabel: Record<string, string> = {
  draft: "Draft",
  pending_approval: "Pending Approval",
  approved: "Approved",
  sent: "Sent",
  partially_received: "Partial",
  received: "Received",
  cancelled: "Cancelled",
}

const statusOptions = [
  { label: "All Statuses", value: "" },
  ...Object.entries(statusLabel).map(([value, label]) => ({ label, value })),
]

export function PurchaseOrdersPage() {
  const { t } = useTranslation("purchases")
  const navigate = useNavigate()
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [suppliers, setSuppliers] = useState<InventorySupplier[]>([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [supplierFilter, setSupplierFilter] = useState("")

  useEffect(() => {
    getSuppliers().then(setSuppliers)
  }, [])

  useEffect(() => {
    setLoading(true)
    const params: Record<string, string | number> = {}
    if (search.trim()) params.search = search.trim()
    if (statusFilter) params.status = statusFilter
    if (supplierFilter) params.supplierId = Number(supplierFilter)
    getPurchaseOrders(params)
      .then(setOrders)
      .finally(() => setLoading(false))
  }, [search, statusFilter, supplierFilter])

  const supplierOptions = [
    { label: t("allSuppliers"), value: "" },
    ...suppliers.map((s) => ({ label: s.companyName, value: String(s.id) })),
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("purchaseOrders")}
        description={t("purchaseOrdersDescription")}
        actions={
          <Button onClick={() => navigate("/purchases/orders/new")}>
            <Plus className="h-4 w-4 mr-2" />
            {t("newPurchaseOrder")}
          </Button>
        }
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            {t("filters")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("searchOrders")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="w-48">
              <SelectField
                options={statusOptions}
                value={statusFilter}
                onChange={(v) => setStatusFilter(v)}
                placeholder={t("allStatuses")}
              />
            </div>
            <div className="w-56">
              <SelectField
                options={supplierOptions}
                value={supplierFilter}
                onChange={(v) => setSupplierFilter(v)}
                placeholder={t("allSuppliers")}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-10 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              {t("noOrdersFound")}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="p-4 font-medium">{t("poNumber")}</th>
                    <th className="p-4 font-medium">{t("supplier")}</th>
                    <th className="p-4 font-medium text-right">{t("items")}</th>
                    <th className="p-4 font-medium text-right">{t("total")}</th>
                    <th className="p-4 font-medium">{t("status")}</th>
                    <th className="p-4 font-medium">{t("date")}</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((po) => (
                    <tr
                      key={po.id}
                      className="border-b last:border-0 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => navigate(`/purchases/orders/${po.id}`)}
                    >
                      <td className="p-4 font-medium">{po.poNumber}</td>
                      <td className="p-4">{po.supplierName || "-"}</td>
                      <td className="p-4 text-right">{po.itemCount ?? "-"}</td>
                      <td className="p-4 text-right font-medium">${po.total.toFixed(2)}</td>
                      <td className="p-4">
                        <Badge variant={statusVariant[po.status] || "outline"}>
                          {statusLabel[po.status] || po.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {new Date(po.orderDate).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
