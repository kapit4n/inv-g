import { useState, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useQuery } from "@tanstack/react-query"
import { Search, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/data-table"
import { SelectField } from "@/components/forms"
import type { TableColumn } from "@/types/crud"
import { getCostHistory, getSuppliers, getProducts } from "@/lib/tauri"
import type { CostHistory } from "@/types"

export function CostHistoryPage() {
  const { t } = useTranslation()

  const [productSearch, setProductSearch] = useState("")
  const [productId, setProductId] = useState("")
  const [supplierId, setSupplierId] = useState("")

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => getSuppliers(),
  })

  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: () => getProducts(1, 1000),
  })

  const { data: history = [], isLoading } = useQuery({
    queryKey: ["cost-history", productId || undefined, supplierId || undefined],
    queryFn: () =>
      getCostHistory(
        productId ? Number(productId) : undefined,
        supplierId ? Number(supplierId) : undefined,
      ),
  })

  const searchedProducts = useMemo(() => {
    if (!productSearch) return products?.data ?? []
    const q = productSearch.toLowerCase()
    return (products?.data ?? []).filter(
      (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q),
    )
  }, [products, productSearch])

  const formatCurrency = (v: number) =>
    v.toLocaleString("en-US", { style: "currency", currency: "USD" })

  const columns: TableColumn<CostHistory>[] = [
    {
      id: "createdAt",
      header: t("common.date"),
      accessorKey: "createdAt",
      cell: (r) => (
        <span className="text-xs text-muted-foreground">
          {new Date(r.createdAt).toLocaleDateString()}{" "}
          {new Date(r.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      ),
    },
    {
      id: "productName",
      header: t("inventory.product"),
      accessorKey: "productName",
      cell: (r) => (
        <span className="text-sm font-medium">{r.productName || "-"}</span>
      ),
    },
    {
      id: "productSku",
      header: t("inventory.sku"),
      accessorKey: "productSku",
      cell: (r) => (
        <span className="font-mono text-xs text-muted-foreground">
          {r.productSku || "-"}
        </span>
      ),
    },
    {
      id: "supplierName",
      header: t("purchases.supplier"),
      accessorKey: "supplierName",
      cell: (r) => <span className="text-sm">{r.supplierName || "-"}</span>,
    },
    {
      id: "poNumber",
      header: t("purchases.poNumber"),
      accessorKey: "poNumber",
      cell: (r) => (
        <span className="font-mono text-xs text-muted-foreground">
          {r.poNumber || "-"}
        </span>
      ),
    },
    {
      id: "oldCost",
      header: t("purchases.oldCost"),
      accessorKey: "oldCost",
      cell: (r) => (
        <span className="tabular-nums text-muted-foreground">
          {formatCurrency(r.oldCost)}
        </span>
      ),
      align: "right",
    },
    {
      id: "newCost",
      header: t("purchases.newCost"),
      accessorKey: "newCost",
      cell: (r) => (
        <span className="tabular-nums font-medium">
          {formatCurrency(r.newCost)}
        </span>
      ),
      align: "right",
    },
    {
      id: "change",
      header: t("purchases.change"),
      accessorKey: "oldCost",
      cell: (r) => {
        const diff = r.newCost - r.oldCost
        const pct =
          r.oldCost !== 0
            ? ((diff / r.oldCost) * 100).toFixed(1)
            : "∞"
        return (
          <span
            className={`inline-flex items-center gap-1 tabular-nums ${
              diff > 0
                ? "text-destructive"
                : diff < 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-muted-foreground"
            }`}
          >
            {diff > 0 ? (
              <TrendingUp className="h-3 w-3" />
            ) : diff < 0 ? (
              <TrendingDown className="h-3 w-3" />
            ) : (
              <Minus className="h-3 w-3" />
            )}
            {diff > 0 ? "+" : ""}
            {formatCurrency(diff)} ({diff > 0 ? "+" : ""}
            {pct}%)
          </span>
        )
      },
      align: "right",
    },
    {
      id: "createdByName",
      header: t("purchases.changedBy"),
      accessorKey: "createdByName",
      cell: (r) => (
        <span className="text-sm">{r.createdByName || `#${r.createdBy}`}</span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("purchases.costHistory")}
        description={t("purchases.costHistoryDescription")}
      />

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex gap-4 flex-wrap">
            <div className="w-56 relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
              <Input
                placeholder={t("purchases.searchProduct")}
                value={productSearch}
                onChange={(e) => {
                  setProductSearch(e.target.value)
                  setProductId("")
                }}
                className="pl-9"
              />
              {productSearch && !productId && (
                <div className="absolute top-full left-0 right-0 z-20 mt-1 rounded-md border bg-popover shadow-md max-h-40 overflow-y-auto">
                  {searchedProducts.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors border-b last:border-0"
                      onClick={() => {
                        setProductId(String(p.id))
                        setProductSearch(`${p.name} (${p.sku})`)
                      }}
                    >
                      <span className="font-medium">{p.name}</span>
                      <span className="text-muted-foreground ml-2 font-mono text-xs">
                        {p.sku}
                      </span>
                    </button>
                  ))}
                  {searchedProducts.length === 0 && (
                    <p className="p-3 text-sm text-muted-foreground">
                      {t("common.noResults")}
                    </p>
                  )}
                </div>
              )}
              {productId && (
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setProductId("")
                    setProductSearch("")
                  }}
                >
                  <Search className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="w-48">
              <SelectField
                placeholder={t("common.allSuppliers")}
                value={supplierId}
                onChange={setSupplierId}
                options={[
                  { label: t("common.all"), value: "" },
                  ...suppliers.map((s) => ({
                    label: s.companyName,
                    value: String(s.id),
                  })),
                ]}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <DataTable
            data={history}
            columns={columns}
            loading={isLoading}
            emptyMessage={t("purchases.noCostHistory")}
          />
        </CardContent>
      </Card>
    </div>
  )
}
