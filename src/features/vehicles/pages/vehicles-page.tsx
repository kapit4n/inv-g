import { useTranslation } from "react-i18next"
import { Car, Plus, Download } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/empty-state"

export function VehiclesPage() {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("vehicles.title")}
        description={t("vehicles.description")}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled><Download className="h-4 w-4 mr-1" /> {t("common.export")}</Button>
            <Button size="sm" disabled><Plus className="h-4 w-4 mr-1" /> {t("vehicles.addVehicle")}</Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">{t("vehicles.totalVehicles")}</p><p className="text-2xl font-bold">—</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">{t("vehicles.serviceRecords")}</p><p className="text-2xl font-bold">—</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">{t("vehicles.makesCovered")}</p><p className="text-2xl font-bold">—</p></CardContent></Card>
      </div>

      <EmptyState
        icon={<Car className="h-8 w-8 text-muted-foreground" />}
        title={t("vehicles.comingSoonTitle")}
        description={t("vehicles.comingSoonDescription")}
      />

      <Card>
        <CardContent className="p-6">
          <h3 className="text-sm font-semibold mb-3">{t("vehicles.plannedFeatures")}</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> {t("vehicles.feature1")}</li>
            <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> {t("vehicles.feature2")}</li>
            <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> {t("vehicles.feature3")}</li>
            <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> {t("vehicles.feature4")}</li>
            <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> {t("vehicles.feature5")}</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
