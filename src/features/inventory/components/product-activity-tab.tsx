import { useTranslation } from "react-i18next"
import { useQuery } from "@tanstack/react-query"
import { getInventoryMovements, getCostHistory } from "@/lib/tauri"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, ArrowUpDown, DollarSign } from "lucide-react"

interface Props {
  productId: number
}

interface TimelineEvent {
  id: string
  type: "movement" | "cost" | "created"
  date: string
  label: string
  detail: string
}

export function ProductActivityTab({ productId }: Props) {
  const { t } = useTranslation()

  const { data: movements = [] } = useQuery({
    queryKey: ["inventory-movements", productId],
    queryFn: () => getInventoryMovements(productId),
    enabled: !!productId,
  })

  const { data: costHistory = [] } = useQuery({
    queryKey: ["cost-history", productId],
    queryFn: () => getCostHistory(productId),
    enabled: !!productId,
  })

  const events: TimelineEvent[] = [
    ...movements.map((m) => ({
      id: `mov-${m.id}`,
      type: "movement" as const,
      date: m.createdAt,
      label: m.type === "in" ? t("inventory.movementTypeIn") : m.type === "out" ? t("inventory.movementTypeOut") : t("inventory.movementTypeAdjustment"),
      detail: `${m.type === "out" ? "-" : "+"}${Math.abs(m.quantity)} · ${m.notes || ""}`,
    })),
    ...costHistory.map((c) => ({
      id: `cost-${c.id}`,
      type: "cost" as const,
      date: c.createdAt,
      label: t("inventory.pricing.costHistory"),
      detail: `$${c.oldCost.toFixed(2)} → $${c.newCost.toFixed(2)}`,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("inventory.activity.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("common.noData")}</p>
          ) : (
            <div className="relative ml-3 border-l-2 border-muted pl-6 space-y-6">
              {events.map((event) => (
                <div key={event.id} className="relative">
                  <div className={`absolute -left-[31px] top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-background ${
                    event.type === "movement" ? "bg-blue-100 text-blue-600" :
                    event.type === "cost" ? "bg-amber-100 text-amber-600" :
                    "bg-green-100 text-green-600"
                  }`}>
                    {event.type === "movement" ? <ArrowUpDown className="h-2 w-2" /> :
                     event.type === "cost" ? <DollarSign className="h-2 w-2" /> :
                     <Clock className="h-2 w-2" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{event.label}</Badge>
                      <span className="text-xs text-muted-foreground">{new Date(event.date).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm mt-1">{event.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
