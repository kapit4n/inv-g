import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { Search, Link2, Package, ArrowRight } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Section } from "@/components/section"
import { Skeleton } from "@/components/ui/skeleton"
import { crossReferenceSearch } from "@/lib/tauri"
import type { CrossReferenceResult } from "@/types"

export function CrossReferencesPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [query, setQuery] = useState("")
  const [results, setResults] = useState<CrossReferenceResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searchDone, setSearchDone] = useState(false)

  const handleSearch = async () => {
    if (!query.trim()) return
    setLoading(true)
    setSearchDone(false)
    try {
      const data = await crossReferenceSearch(query.trim())
      setResults(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
      setSearchDone(true)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t("inventory.crossReferences")} description={t("inventory.crossReferencesDescription")} />

      <Section title={t("common.search")}>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("inventory.crossRefSearchPlaceholder")}
              className="pl-9"
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <Button onClick={handleSearch} disabled={!query.trim() || loading}>
            <Search className="mr-2 h-4 w-4" />
            {t("common.search")}
          </Button>
        </div>
      </Section>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      )}

      {searchDone && !loading && results.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Link2 className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">{t("common.noResults")}</p>
            <p className="text-sm">{t("inventory.crossRefNoResultsHint")}</p>
          </CardContent>
        </Card>
      )}

      {searchDone && !loading && results.length > 0 && (
        <Section title={`${t("common.results")} (${results.length})`}>
          <div className="space-y-3">
            {results.map((result) => (
              <Card
                key={result.productId}
                className="cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => navigate(`/inventory/products/${result.productId}`)}
              >
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{result.productName}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>SKU: {result.productSku}</span>
                        {result.categoryName && <span>| {result.categoryName}</span>}
                        {result.brandName && <span>| {result.brandName}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium">${result.salePrice.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">{result.stockQuantity} in stock</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant={result.matchedType === "product_field" ? "default" : "info"}>
                        {result.matchedType === "product_field" ? t("inventory.productField") : result.matchedType}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{result.matchedIdentifier}</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}
