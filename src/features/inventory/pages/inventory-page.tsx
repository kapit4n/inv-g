import { useTranslation } from "react-i18next"
import { Plus, Download, Upload, Filter } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SearchBar } from "@/components/search-bar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const products = [
  { name: "Ceramic Brake Pads (Front)", sku: "BP-CER-F01", category: "Brakes", cost: "$18.50", price: "$45.99", stock: 24, status: "in-stock" },
  { name: "Premium Oil Filter", sku: "OF-PRM-002", category: "Engine", cost: "$4.20", price: "$12.99", stock: 156, status: "in-stock" },
  { name: "Alternator (Reman 130A)", sku: "ALT-RMN-003", category: "Electrical", cost: "$85.00", price: "$189.00", stock: 3, status: "low-stock" },
  { name: "AGM Battery 650CCA", sku: "BAT-AGM-004", category: "Electrical", cost: "$72.00", price: "$159.99", stock: 12, status: "in-stock" },
  { name: "Iridium Spark Plugs (Set/4)", sku: "SP-IRD-005", category: "Engine", cost: "$3.50", price: "$8.49", stock: 320, status: "in-stock" },
  { name: "Timing Belt Kit w/ Water Pump", sku: "TB-KIT-006", category: "Engine", cost: "$45.00", price: "$119.99", stock: 8, status: "low-stock" },
  { name: "Synthetic 5W-30 Oil (5qt)", sku: "OIL-5W30-010", category: "Fluids", cost: "$22.00", price: "$49.99", stock: 89, status: "in-stock" },
  { name: "Fuel Pump Assembly", sku: "FP-ASM-012", category: "Fuel", cost: "$65.00", price: "$149.99", stock: 5, status: "low-stock" },
]

export function InventoryPage() {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("inventory.title")}
        description={t("inventory.description")}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm"><Upload className="h-4 w-4 mr-1" /> {t("inventory.import")}</Button>
            <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" /> {t("inventory.export")}</Button>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> {t("inventory.addProduct")}</Button>
          </div>
        }
      />

      <Tabs defaultValue="all">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">{t("inventory.allProducts")}</TabsTrigger>
            <TabsTrigger value="in-stock">{t("inventory.inStock")}</TabsTrigger>
            <TabsTrigger value="low-stock">{t("inventory.lowStock")}</TabsTrigger>
            <TabsTrigger value="out-of-stock">{t("inventory.outOfStock")}</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <SearchBar placeholder={t("inventory.searchProducts")} className="w-64" />
            <Button variant="outline" size="sm"><Filter className="h-4 w-4 mr-1" /> {t("inventory.filter")}</Button>
          </div>
        </div>

        <TabsContent value="all" className="mt-4">
          <Card>
            <CardContent className="p-0 overflow-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("inventory.productName")}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("inventory.sku")}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("inventory.category")}</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">{t("inventory.cost")}</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">{t("inventory.price")}</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">{t("inventory.stock")}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("common.status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.sku} className="border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer">
                      <td className="px-4 py-3 text-sm font-medium">{p.name}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground font-mono">{p.sku}</td>
                      <td className="px-4 py-3 text-sm">{p.category}</td>
                      <td className="px-4 py-3 text-sm text-right">{p.cost}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium">{p.price}</td>
                      <td className="px-4 py-3 text-sm text-center">{p.stock}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={
                          p.status === "in-stock" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                          p.status === "low-stock" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                          "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }>
                          {p.status === "in-stock" ? t("inventory.inStockStatus") : p.status === "low-stock" ? t("inventory.lowStockStatus") : t("inventory.outOfStockStatus")}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="in-stock">
          <Card className="mt-4"><CardContent className="p-6 text-center text-sm text-muted-foreground">{t("inventory.inStock")}</CardContent></Card>
        </TabsContent>
        <TabsContent value="low-stock">
          <Card className="mt-4"><CardContent className="p-6 text-center text-sm text-muted-foreground">{t("inventory.lowStock")}</CardContent></Card>
        </TabsContent>
        <TabsContent value="out-of-stock">
          <Card className="mt-4"><CardContent className="p-6 text-center text-sm text-muted-foreground">{t("inventory.outOfStock")}</CardContent></Card>
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">{t("inventory.totalProducts")}</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">1,247</p><p className="text-xs text-muted-foreground">{t("inventory.acrossCategories", { count: 8 })}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">{t("inventory.totalStockValue")}</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">$284,920</p><p className="text-xs text-muted-foreground">{t("inventory.atCostPrice")}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">{t("inventory.retailValue")}</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">$567,340</p><p className="text-xs text-muted-foreground">{t("inventory.atSellPrice")}</p></CardContent></Card>
      </div>
    </div>
  )
}
