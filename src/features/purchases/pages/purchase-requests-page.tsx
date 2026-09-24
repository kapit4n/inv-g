import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useQuery } from "@tanstack/react-query"
import { Plus, ChevronDown, ChevronRight } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SelectField } from "@/components/forms"
import { getPurchaseRequests } from "@/lib/tauri"

const PRIORITY_VARIANTS: Record<string, "secondary" | "info" | "warning" | "destructive"> = {
  low: "secondary",
  medium: "info",
  high: "warning",
  urgent: "destructive",
}

const STATUS_VARIANTS: Record<string, "secondary" | "warning" | "info" | "success" | "destructive"> = {
  draft: "secondary",
  pending: "warning",
  approved: "info",
  ordered: "success",
  rejected: "destructive",
  cancelled: "secondary",
}

export function PurchaseRequestsPage() {
  const { t } = useTranslation()

  const [statusFilter, setStatusFilter] = useState("")
  const [priorityFilter, setPriorityFilter] = useState("")
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["purchase-requests", statusFilter || undefined],
    queryFn: () => getPurchaseRequests(statusFilter || undefined),
  })

  const filtered = requests.filter((r) => {
    if (priorityFilter && r.priority !== priorityFilter) return false
    return true
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("purchases.purchaseRequests")}
        description={t("purchases.purchaseRequestsDescription")}
        actions={
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" />
            {t("purchases.newRequest")}
          </Button>
        }
      />

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex gap-4">
            <div className="w-48">
              <SelectField
                placeholder={t("common.allStatuses")}
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { label: t("common.all"), value: "" },
                  { label: t("common.draft"), value: "draft" },
                  { label: t("common.pending"), value: "pending" },
                  { label: t("common.approved"), value: "approved" },
                  { label: t("common.ordered"), value: "ordered" },
                  { label: t("common.rejected"), value: "rejected" },
                  { label: t("common.cancelled"), value: "cancelled" },
                ]}
              />
            </div>
            <div className="w-48">
              <SelectField
                placeholder={t("common.allPriorities")}
                value={priorityFilter}
                onChange={setPriorityFilter}
                options={[
                  { label: t("common.all"), value: "" },
                  { label: t("common.low"), value: "low" },
                  { label: t("common.medium"), value: "medium" },
                  { label: t("common.high"), value: "high" },
                  { label: t("common.urgent"), value: "urgent" },
                ]}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="text-sm text-muted-foreground py-8 text-center">
              {t("common.loading")}...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-sm text-muted-foreground py-8 text-center">
              {t("common.noResults")}
            </div>
          ) : (
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="h-10 px-3 text-left font-medium text-muted-foreground w-8" />
                    <th className="h-10 px-3 text-left font-medium text-muted-foreground">
                      {t("purchases.requestNumber")}
                    </th>
                    <th className="h-10 px-3 text-left font-medium text-muted-foreground">
                      {t("purchases.requestedBy")}
                    </th>
                    <th className="h-10 px-3 text-left font-medium text-muted-foreground">
                      {t("purchases.warehouse")}
                    </th>
                    <th className="h-10 px-3 text-left font-medium text-muted-foreground">
                      {t("purchases.priority")}
                    </th>
                    <th className="h-10 px-3 text-left font-medium text-muted-foreground">
                      {t("common.status")}
                    </th>
                    <th className="h-10 px-3 text-left font-medium text-muted-foreground">
                      {t("purchases.requiredDate")}
                    </th>
                    <th className="h-10 px-3 text-center font-medium text-muted-foreground">
                      {t("inventory.items")}
                    </th>
                    <th className="h-10 px-3 text-left font-medium text-muted-foreground">
                      {t("common.createdAt")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((req) => (
                    <>
                      <tr
                        key={req.id}
                        className="border-b transition-colors hover:bg-muted/30 cursor-pointer"
                        onClick={() =>
                          setExpandedId(expandedId === req.id ? null : req.id)
                        }
                      >
                        <td className="h-10 px-3 align-middle">
                          {expandedId === req.id ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </td>
                        <td className="h-10 px-3 align-middle font-mono font-medium text-xs">
                          {req.requestNumber}
                        </td>
                        <td className="h-10 px-3 align-middle">
                          {req.requestedByName || `#${req.requestedBy}`}
                        </td>
                        <td className="h-10 px-3 align-middle">
                          {req.warehouseName || "-"}
                        </td>
                        <td className="h-10 px-3 align-middle">
                          <Badge
                            variant={
                              PRIORITY_VARIANTS[req.priority] || "outline"
                            }
                            className="capitalize"
                          >
                            {req.priority}
                          </Badge>
                        </td>
                        <td className="h-10 px-3 align-middle">
                          <Badge
                            variant={
                              STATUS_VARIANTS[req.status] || "outline"
                            }
                            className="capitalize"
                          >
                            {req.status}
                          </Badge>
                        </td>
                        <td className="h-10 px-3 align-middle text-xs">
                          {req.requiredDate
                            ? new Date(req.requiredDate).toLocaleDateString()
                            : "-"}
                        </td>
                        <td className="h-10 px-3 align-middle text-center">
                          {req.itemCount ?? "-"}
                        </td>
                        <td className="h-10 px-3 align-middle text-xs text-muted-foreground">
                          {new Date(req.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                      {expandedId === req.id && (
                        <tr key={`${req.id}-detail`}>
                          <td colSpan={9} className="px-6 py-4 bg-muted/20">
                            <div className="text-sm space-y-2">
                              <p>
                                <span className="font-medium">
                                  {t("purchases.reason")}:
                                </span>{" "}
                                {req.reason || t("common.notSpecified")}
                              </p>
                              <p>
                                <span className="font-medium">
                                  {t("common.updatedAt")}:
                                </span>{" "}
                                {new Date(req.updatedAt).toLocaleString()}
                              </p>
                              {req.itemCount && req.itemCount > 0 && (
                                <p className="text-muted-foreground italic">
                                  {req.itemCount}{" "}
                                  {t("inventory.items")}{" "}
                                  {t("common.inThisRequest")}
                                </p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
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
