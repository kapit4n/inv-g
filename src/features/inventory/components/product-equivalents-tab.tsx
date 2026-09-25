import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Plus, Trash2, RefreshCw, Search } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EntityInfoCard, InfoRow } from "@/components/entity"
import { Badge } from "@/components/ui/badge"
import {
  getProductEquivalents,
  addProductEquivalent,
  removeProductEquivalent,
  getProducts,
} from "@/lib/tauri"
import { useAuth } from "@/hooks"
import toast from "react-hot-toast"

interface Props {
  productId: number
}

export function ProductEquivalentsTab({ productId }: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const { data: equivalents = [], isLoading } = useQuery({
    queryKey: ["product-equivalents", productId],
    queryFn: () => getProductEquivalents(productId),
  })

  const [showAdd, setShowAdd] = useState(false)
  const [pickQuery, setPickQuery] = useState("")
  const [debouncedPick, setDebouncedPick] = useState("")
  const [newNote, setNewNote] = useState("")

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedPick(pickQuery.trim()), 250)
    return () => clearTimeout(timer)
  }, [pickQuery])

  // Loaded as soon as the panel opens (like the POS search) so the list is never
  // an empty box, and filtered as the user types.
  const { data: pickResults = [], isFetching: picking } = useQuery({
    queryKey: ["product-equiv-picker", debouncedPick],
    queryFn: async () => (await getProducts(1, 20, debouncedPick || undefined)).data,
    enabled: showAdd,
  })

  // Hide the product itself and anything already linked, so the list can never
  // render as an empty box and we never trigger a duplicate-pair error.
  const linkedIds = useMemo(
    () => new Set(equivalents.map((eq) => eq.equivalentProductId)),
    [equivalents]
  )
  const pickable = useMemo(
    () => pickResults.filter((p) => p.id !== productId && !linkedIds.has(p.id)),
    [pickResults, productId, linkedIds]
  )

  const addMutation = useMutation({
    mutationFn: (equivalentProductId: number) =>
      addProductEquivalent(productId, equivalentProductId, newNote.trim() || undefined, user?.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-equivalents", productId] })
      toast.success(t("common.saved"))
      setShowAdd(false)
      setPickQuery("")
      setNewNote("")
    },
  })

  const removeMutation = useMutation({
    mutationFn: (relationshipId: number) => removeProductEquivalent(relationshipId, user?.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-equivalents", productId] })
      toast.success(t("common.deleted"))
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          {t("inventory.equivalents.title")}
          <Badge variant="outline">{equivalents.length}</Badge>
        </h3>
        <Button size="sm" onClick={() => setShowAdd(!showAdd)}>
          <Plus className="mr-2 h-4 w-4" />
          {t("common.add")}
        </Button>
      </div>

      {showAdd && (
        <Card>
          <CardContent className="space-y-3 pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                className="pl-9"
                placeholder={t("inventory.equivalents.searchPlaceholder")}
                value={pickQuery}
                onChange={(e) => setPickQuery(e.target.value)}
              />
            </div>
            <div className="max-h-56 overflow-y-auto rounded-md border" data-testid="product-equiv-picker">
              {picking && pickable.length === 0 ? (
                <p className="p-3 text-sm text-muted-foreground">{t("common.loading")}</p>
              ) : pickable.length === 0 ? (
                <p className="p-3 text-sm text-muted-foreground">
                  {debouncedPick ? t("inventory.equivalents.noResults") : t("inventory.equivalents.noProductsToLink")}
                </p>
              ) : (
                pickable.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => addMutation.mutate(p.id)}
                    disabled={addMutation.isPending}
                    className="flex w-full items-center justify-between gap-2 border-b px-3 py-2 text-left text-sm last:border-b-0 hover:bg-muted"
                  >
                    <span>
                      <span className="font-medium">{p.name}</span>
                      <span className="ml-2 text-muted-foreground">{p.sku}</span>
                    </span>
                    <span className="whitespace-nowrap text-muted-foreground">
                      {p.stockQuantity} {p.unit}
                    </span>
                  </button>
                ))
              )}
            </div>
            <Input
              placeholder={t("inventory.equivalents.notePlaceholder")}
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowAdd(false)}>
                {t("common.cancel")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
      ) : equivalents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <RefreshCw className="mb-3 h-10 w-10 opacity-50" />
            <p className="text-sm">{t("inventory.equivalents.empty")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {equivalents.map((eq) => (
            <EntityInfoCard key={eq.id} title={`${eq.name} · ${eq.sku}`} columns={1}>
              <InfoRow label={t("inventory.equivalents.sku")} value={eq.sku} />
              {eq.brandName && <InfoRow label={t("inventory.brand")} value={eq.brandName} />}
              {eq.categoryName && <InfoRow label={t("inventory.category")} value={eq.categoryName} />}
              <InfoRow
                label={t("inventory.equivalents.stock")}
                value={`${eq.stockQuantity} ${eq.unit}`}
              />
              <InfoRow label={t("inventory.equivalents.salePrice")} value={`$${eq.salePrice.toFixed(2)}`} />
              {eq.wholesalePrice > 0 && (
                <InfoRow
                  label={t("inventory.equivalents.wholesalePrice")}
                  value={`$${eq.wholesalePrice.toFixed(2)}`}
                />
              )}
              {eq.note && <InfoRow label={t("inventory.equivalents.note")} value={eq.note} />}
              {!eq.isActive && (
                <InfoRow label={t("inventory.equivalents.status")} value={t("inventory.equivalents.inactive")} />
              )}
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 h-7 w-fit text-destructive"
                onClick={() => removeMutation.mutate(eq.id)}
              >
                <Trash2 className="mr-1 h-3 w-3" />
                {t("common.delete")}
              </Button>
            </EntityInfoCard>
          ))}
        </div>
      )}
    </div>
  )
}
