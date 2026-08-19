import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { Search, Package, ArrowRight } from "lucide-react"
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
  getVehicleEngines, getVehicleTransmissions,
  searchCompatibleProducts, getRecommendationsForVehicle,
} from "@/lib/tauri"
import type {
  VehicleBrand, VehicleModel, VehicleGeneration,
  VehicleEngine, VehicleTransmission, ProductRecommendation,
} from "@/types"

export function PartFinderPage() {
  const { t } = useTranslation("part-finder")
  const navigate = useNavigate()

  const [brands, setBrands] = useState<VehicleBrand[]>([])
  const [models, setModels] = useState<VehicleModel[]>([])
  const [generations, setGenerations] = useState<VehicleGeneration[]>([])
  const [engines, setEngines] = useState<VehicleEngine[]>([])
  const [transmissions, setTransmissions] = useState<VehicleTransmission[]>([])

  const [selectedBrand, setSelectedBrand] = useState("")
  const [selectedModel, setSelectedModel] = useState("")
  const [selectedGeneration, setSelectedGeneration] = useState("")
  const [selectedYear, setSelectedYear] = useState("")
  const [selectedEngine, setSelectedEngine] = useState("")
  const [selectedTransmission, setSelectedTransmission] = useState("")
  const [searchText, setSearchText] = useState("")

  const [results, setResults] = useState<ProductRecommendation[]>([])
  const [recommendations, setRecommendations] = useState<ProductRecommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingRecs, setLoadingRecs] = useState(false)
  const [searchDone, setSearchDone] = useState(false)

  const currentYear = new Date().getFullYear()

  const yearStart = generations.find((g) => g.id === Number(selectedGeneration))?.yearStart
  const yearEnd = generations.find((g) => g.id === Number(selectedGeneration))?.yearEnd
  const years = yearStart && yearEnd
    ? Array.from({ length: yearEnd - yearStart + 1 }, (_, i) => yearEnd - i)
    : Array.from({ length: 50 }, (_, i) => currentYear - i)

  useEffect(() => {
    Promise.all([
      getVehicleBrands().catch(() => []),
      getVehicleEngines().catch(() => []),
      getVehicleTransmissions().catch(() => []),
    ]).then(([b, e, tr]) => {
      setBrands(b)
      setEngines(e)
      setTransmissions(tr)
    })
  }, [])

  const handleBrandChange = useCallback(async (brandId: string) => {
    setSelectedBrand(brandId)
    setSelectedModel("")
    setSelectedGeneration("")
    setSelectedYear("")
    setSelectedEngine("")
    setSelectedTransmission("")
    setModels([])
    setGenerations([])
    setResults([])
    setSearchDone(false)
    if (brandId) {
      try {
        setModels(await getVehicleModels(Number(brandId)))
      } catch { /* ignore */ }
    }
  }, [])

  const handleModelChange = useCallback(async (modelId: string) => {
    setSelectedModel(modelId)
    setSelectedGeneration("")
    setSelectedYear("")
    setSelectedEngine("")
    setSelectedTransmission("")
    setGenerations([])
    setResults([])
    setSearchDone(false)
    if (modelId) {
      try {
        setGenerations(await getVehicleGenerations(Number(modelId)))
      } catch { /* ignore */ }
    }
  }, [])

  const handleGenerationChange = useCallback((genId: string) => {
    setSelectedGeneration(genId)
    setSelectedYear("")
    setResults([])
    setSearchDone(false)
  }, [])

  const handleSearch = useCallback(async () => {
    if (!selectedBrand && !selectedModel && !searchText.trim()) {
      toast.error(t("selectVehicleOrSearch"))
      return
    }
    setLoading(true)
    setSearchDone(true)
    try {
      setResults(await searchCompatibleProducts(
        selectedBrand ? Number(selectedBrand) : undefined,
        selectedModel ? Number(selectedModel) : undefined,
        selectedYear ? Number(selectedYear) : undefined,
        selectedEngine ? Number(selectedEngine) : undefined,
        selectedTransmission ? Number(selectedTransmission) : undefined,
        searchText || undefined,
      ))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("searchFailed"))
    } finally {
      setLoading(false)
    }
  }, [selectedBrand, selectedModel, selectedYear, selectedEngine, selectedTransmission, searchText, t])

  const fetchRecommendations = useCallback(async () => {
    if (!selectedBrand && !selectedModel) return
    setLoadingRecs(true)
    try {
      setRecommendations(await getRecommendationsForVehicle(
        selectedBrand ? Number(selectedBrand) : undefined,
        selectedModel ? Number(selectedModel) : undefined,
        selectedYear ? Number(selectedYear) : undefined,
      ))
    } catch { /* ignore */ } finally {
      setLoadingRecs(false)
    }
  }, [selectedBrand, selectedModel, selectedYear])

  useEffect(() => {
    if (selectedBrand || selectedModel) {
      fetchRecommendations()
    } else {
      setRecommendations([])
    }
  }, [selectedBrand, selectedModel, selectedYear, fetchRecommendations])

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
      />

      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">{t("brand")}</label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                value={selectedBrand}
                onChange={(e) => handleBrandChange(e.target.value)}
              >
                <option value="">{t("allBrands")}</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">{t("model")}</label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                value={selectedModel}
                onChange={(e) => handleModelChange(e.target.value)}
                disabled={!selectedBrand}
              >
                <option value="">{t("allModels")}</option>
                {models.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">{t("generation")}</label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                value={selectedGeneration}
                onChange={(e) => handleGenerationChange(e.target.value)}
                disabled={!selectedModel || generations.length === 0}
              >
                <option value="">{generations.length === 0 ? t("noneAvailable") : t("allGenerations")}</option>
                {generations.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name || (g.yearStart && g.yearEnd ? `${g.yearStart}–${g.yearEnd}` : `Gen ${g.id}`)}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">{t("year")}</label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                value={selectedYear}
                onChange={(e) => { setSelectedYear(e.target.value); setResults([]); setSearchDone(false) }}
              >
                <option value="">{t("allYears")}</option>
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">{t("engine")}</label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                value={selectedEngine}
                onChange={(e) => { setSelectedEngine(e.target.value); setResults([]); setSearchDone(false) }}
              >
                <option value="">{t("allEngines")}</option>
                {engines.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}{e.displacement ? ` (${e.displacement}L)` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">{t("transmission")}</label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                value={selectedTransmission}
                onChange={(e) => { setSelectedTransmission(e.target.value); setResults([]); setSearchDone(false) }}
              >
                <option value="">{t("allTransmissions")}</option>
                {transmissions.map((tr) => (
                  <option key={tr.id} value={tr.id}>
                    {tr.name}{tr.gears ? ` (${tr.gears}-speed)` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">{t("search")}</label>
              <Input
                placeholder={t("searchPlaceholder")}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">&nbsp;</label>
              <Button onClick={handleSearch} disabled={loading} className="w-full">
                <Search className="h-4 w-4 mr-2" />
                {loading ? t("searching") : t("findParts")}
              </Button>
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
                  {t("selectAndSearch")}
                </CardContent>
              </Card>
            ) : results.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-sm text-muted-foreground">
                  {t("noCompatibleParts")}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {results.map((p) => (
                  <Card
                    key={p.productId}
                    className="cursor-pointer transition-shadow hover:shadow-md hover:border-primary/30"
                    onClick={() => navigate(`/inventory/products/${p.productId}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                          <Package className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{p.productName}</p>
                          <p className="text-xs text-muted-foreground font-mono">{p.productSku}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {p.categoryName && <Badge variant="outline" className="text-[10px]">{p.categoryName}</Badge>}
                            {p.brandName && <Badge variant="secondary" className="text-[10px]">{p.brandName}</Badge>}
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-sm font-bold">${p.salePrice.toFixed(2)}</span>
                            <Badge variant={p.stockQuantity > 0 ? "success" : "destructive"} className="text-xs">
                              {p.stockQuantity > 0 ? t("inStock", { count: p.stockQuantity }) : t("outOfStock")}
                            </Badge>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
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
                  {t("selectVehicleForRecs")}
                </CardContent>
              </Card>
            ) : recommendations.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-sm text-muted-foreground">
                  {t("noRecommendations")}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {recommendations.map((p) => (
                  <Card
                    key={p.productId}
                    className="cursor-pointer transition-shadow hover:shadow-sm hover:border-primary/30"
                    onClick={() => navigate(`/inventory/products/${p.productId}`)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        <Package className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{p.productName}</p>
                          <p className="text-xs text-muted-foreground font-mono">{p.productSku}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-sm font-bold">${p.salePrice.toFixed(2)}</span>
                            <Badge variant={p.stockQuantity > 0 ? "success" : "destructive"} className="text-[10px]">
                              {p.stockQuantity > 0 ? p.stockQuantity : t("outOfStock")}
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
      </div>
    </div>
  )
}
