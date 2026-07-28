import { useTranslation } from "react-i18next"
import { Plus, Calendar } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const reportTypes = [
  { titleKey: "reports.salesReport", descKey: "reports.salesReportDesc" },
  { titleKey: "reports.inventoryReport", descKey: "reports.inventoryReportDesc" },
  { titleKey: "reports.purchaseReport", descKey: "reports.purchaseReportDesc" },
  { titleKey: "reports.customerReport", descKey: "reports.customerReportDesc" },
  { titleKey: "reports.profitLoss", descKey: "reports.profitLossDesc" },
  { titleKey: "reports.taxReport", descKey: "reports.taxReportDesc" },
]

export function ReportsPage() {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("reports.title")}
        description={t("reports.description")}
        actions={
          <Button size="sm" disabled><Plus className="h-4 w-4 mr-1" /> {t("reports.generateReport")}</Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reportTypes.map((report) => (
          <Card key={report.titleKey} className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{t(report.titleKey)}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-4">{t(report.descKey)}</p>
              <Button variant="outline" size="sm" className="w-full" disabled>
                <Calendar className="h-3 w-3 mr-1" /> {t("reports.comingSoon")}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
