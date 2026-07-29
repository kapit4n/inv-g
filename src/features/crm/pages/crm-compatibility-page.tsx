import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Search, Package } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Section } from "@/components/section"
import toast from "react-hot-toast"
import {
  getVehicleBrands, getVehicleModels, getVehicleGenerations,
  getVehicleEngines, searchCompatibleProducts, getRecommendationsForVehicle,
} from "@/lib/tauri"
import type { VehicleBrand, VehicleModel, VehicleGeneration, VehicleEngine } from "@/types"
import type { ProductRecommendation } from "@/types"

export function CrmCompatibilityPage() {
  const { t } = useTranslation("crm")
  const [brands, setBrands] = useState<VehicleBrand[]>([])
  const [models, setModels] = useState<VehicleModel[]>([])
  const [_generations, setGenerations] = useState<VehicleGeneration[]>([])
  const [engines, setEngines] = useState<VehicleEngine[]>([])
  const [selectedBrand, setSelectedBrand] = useState("")
  const [selectedModel, setSelectedModel] = useState("")
  const [selectedYear, setSelectedYear] = useState("")
  const [selectedEngine, setSelectedEngine] = useState("")
  const [searchText, setSearchText] = useState("")
  const [results, setResults] = useState<ProductRecommendation[]>([])
  const [recommendations, setRecommendations] = useState<ProductRecommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingRecs, setLoadingRecs] = useState(false)
  const [searchDone, setSearchDone] = useState(false)

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i)

  useEffect(() => {
    getVehicleBrands().then(setBrands).catch(() => {})
    getVehicleEngines().then(setEngines).catch(() => {})
  }, [])

  const handleBrandChange = async (brandId: string) => {
    setSelectedBrand(brandId)
    setSelectedModel("")
    setSelectedYear("")
    setSelectedEngine("")
    setModels([])
    setGenerations([])
    setResults([])
    setSearchDone(false)
    if (brandId) {
      try {
        const m = await getVehicleModels(Number(brandId))
        setModels(m)
      } catch { }
    }
  }

  const handleModelChange = async (modelId: string) => {
    setSelectedModel(modelId)
    setSelectedYear("")
    setSelectedEngine("")
    setGenerations([])
    setResults([])
    setSearchDone(false)
    if (modelId) {
      try {
        const g = await getVehicleGenerations(Number(modelId))
        setGenerations(g)
      } catch { }
    }
  }

  const handleSearch = async () => {
    if (!selectedBrand && !selectedModel && !searchText.trim()) {
      toast.error("Select a vehicle or enter a search term")
      return
    }
    setLoading(true)
    setSearchDone(true)
    try {
      const data = await searchCompatibleProducts(
        selectedBrand ? Number(selectedBrand) : undefined,
        selectedModel ? Number(selectedModel) : undefined,
        selectedYear ? Number(selectedYear) : undefined,
        selectedEngine ? Number(selectedEngine) : undefined,
        undefined, searchText || undefined,
      )
      setResults(data)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Search failed")
    } finally {
      setLoading(false)
    }
  }

  const fetchRecommendations = async () => {
    if (!selectedBrand && !selectedModel) return
    setLoadingRecs(true)
    try {
      const data = await getRecommendationsForVehicle(
        selectedBrand ? Number(selectedBrand) : undefined,
        selectedModel ? Number(selectedModel) : undefined,
        selectedYear ? Number(selectedYear) : undefined,
      )
      setRecommendations(data)
    } catch { } finally {
      setLoadingRecs(false)
    }
  }

  useEffect(() => {
    if (selectedBrand || selectedModel) {
      fetchRecommendations()
    } else {
      setRecommendations([])
    }
  }, [selectedBrand, selectedModel, selectedYear])

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("compatibility")}
        description={t("compatibilitySearch")}
      />

      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="grid gap-2">
              <label className="text-sm font-medium">{t("selectBrand")}</label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                value={selectedBrand}
                onChange={(e) => handleBrandChange(e.target.value)}
              >
                <option value="">{t("selectBrand")}</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">{t("selectModel")}</label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                value={selectedModel}
                onChange={(e) => handleModelChange(e.target.value)}
                disabled={!selectedBrand}
              >
                <option value="">{t("selectModel")}</option>
                {models.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">{t("selectYear")}</label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                <option value="">{t("selectYear")}</option>
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">{t("selectEngine")}</label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                value={selectedEngine}
                onChange={(e) => setSelectedEngine(e.target.value)}
              >
                <option value="">{t("selectEngine")}</option>
                {engines.map((e) => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Search</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Part name / SKU"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
                <Button onClick={handleSearch} disabled={loading}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Section title={t("compatibleParts")}>
            {loading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-32 rounded-xl" />
                ))}
              </div>
            ) : !searchDone ? (
              <Card>
                <CardContent className="p-6 text-center text-sm text-muted-foreground">
                  Select a vehicle and click search
                </CardContent>
              </Card>
            ) : results.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-sm text-muted-foreground">
                  {t("noResults")}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {results.map((p) => (
                  <Card key={p.productId} className="transition-shadow hover:shadow-md">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Package className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{p.productName}</p>
                          <p className="text-xs text-muted-foreground">{p.productSku}</p>
                          {p.categoryName && <Badge variant="outline" className="text-xs mt-1">{p.categoryName}</Badge>}
                          {p.brandName && <p className="text-xs text-muted-foreground mt-1">{p.brandName}</p>}
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-sm font-bold">${p.salePrice.toFixed(2)}</span>
                            <Badge variant={p.stockQuantity > 0 ? "success" : "destructive"} className="text-xs">
                              {p.stockQuantity > 0 ? `${p.stockQuantity} in stock` : "Out of stock"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </Section>
        </div>

        <div className="space-y-4">
          <Section title={t("recommendedParts")}>
            {loadingRecs ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 rounded-xl" />
                ))}
              </div>
            ) : !selectedBrand && !selectedModel ? (
              <Card>
                <CardContent className="p-6 text-center text-sm text-muted-foreground">
                  Select a vehicle for recommendations
                </CardContent>
              </Card>
            ) : recommendations.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-sm text-muted-foreground">
                  {t("noResults")}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {recommendations.map((p) => (
                  <Card key={p.productId} className="transition-shadow hover:shadow-md">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        <Package className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{p.productName}</p>
                          <p className="text-xs text-muted-foreground">{p.productSku}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-sm font-bold">${p.salePrice.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </Section>
        </div>
      </div>
    </div>
  )
}
