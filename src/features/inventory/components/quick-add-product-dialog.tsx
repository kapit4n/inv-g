import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AlertTriangle, Loader2, PackagePlus, Plus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CurrencyField, NumberField, TextField } from "@/components/forms"
import { SupplierPicker } from "./supplier-picker"
import { useNotification } from "@/hooks/use-notification"
import { useAppSettingsStore, useAuthStore } from "@/stores"
import { useSoleWarehouseDefault } from "@/hooks"
import { useInvalidateStock } from "@/hooks/use-stock-invalidation"
import { createInventoryMovement, createProduct, getWarehouses } from "@/lib/tauri"
import { effectiveMargin, effectivePrice, isValidMargin, suggestedPrice } from "@/lib/pricing"

interface QuickAddProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * A SKU for a product registered without one.
 *
 * `products.sku` is `TEXT NOT NULL UNIQUE`, so something has to be sent. A shop
 * that already has a house code will type it; this is only the fallback for the
 * rows that arrive from a supplier sheet with a name and a price and nothing
 * else. The timestamp keeps entries apart when several are added in the same
 * session, and the random suffix keeps two quick adds in the same millisecond
 * apart.
 */
function generateSku(): string {
  const stamp = Date.now().toString(36).toUpperCase()
  const suffix = Math.random().toString(36).slice(2, 5).toUpperCase()
  return `QA-${stamp}${suffix}`
}

/**
 * The rusqlite message for a duplicate SKU, matched so it can be replaced with
 * something the user can act on. Everything else is shown verbatim.
 */
function isDuplicateSku(error: unknown): boolean {
  return String(error).includes("UNIQUE constraint failed") && String(error).includes("products.sku")
}

/**
 * Registers a product in one short form: name, supplier, quantity and prices.
 *
 * The full product form (routes `/inventory/products/new`) asks for roughly
 * twenty-five fields — brand, manufacturer, images, vehicle compatibility,
 * storage location, three stock thresholds — of which a counter stocking a new
 * line fills in four. This is that path, and the two coexist: the dialog never
 * writes a field it was not given, so anything skipped can still be filled in
 * later from the product page.
 *
 * The dialog stays open after a save and clears only the identifying fields,
 * because the real use is a supplier sheet worked down row by row: supplier,
 * unit, warehouse and prices stay put and the next line is typed straight in.
 * A counter of what has been added in this sitting is shown instead of a
 * success toast per row.
 */
export function QuickAddProductDialog({ open, onOpenChange }: QuickAddProductDialogProps) {
  const { t } = useTranslation()
  const notification = useNotification()
  const queryClient = useQueryClient()
  const invalidateStock = useInvalidateStock()
  const user = useAuthStore((s) => s.user)
  const globalMarginRaw = useAppSettingsStore((s) => s.getValue("default_margin_percent"))
  const globalMargin =
    globalMarginRaw != null && !Number.isNaN(Number(globalMarginRaw)) ? Number(globalMarginRaw) : 30

  const [name, setName] = useState("")
  const [sku, setSku] = useState("")
  const [supplierId, setSupplierId] = useState<number | undefined>(undefined)
  const [quantity, setQuantity] = useState(0)
  const [costPrice, setCostPrice] = useState(0)
  const [salePrice, setSalePrice] = useState("")
  const [marginPct, setMarginPct] = useState("")
  const [unit, setUnit] = useState("unit")
  const [warehouseId, setWarehouseId] = useState<number | undefined>(undefined)
  const [added, setAdded] = useState(0)
  const [duplicateSku, setDuplicateSku] = useState(false)

  const { data: warehouses = [] } = useQuery({
    queryKey: ["inventory-warehouses"],
    queryFn: getWarehouses,
    enabled: open,
  })

  // A single-store instance has one warehouse, so there is nothing to pick.
  useSoleWarehouseDefault(setWarehouseId, open)

  const marginValue = marginPct.trim() === "" ? null : Number(marginPct)
  const marginValid =
    isValidMargin(marginValue) && (marginPct.trim() === "" || !Number.isNaN(marginValue))
  const suggested = suggestedPrice(costPrice, effectiveMargin(marginValue, globalMargin))
  const finalSale = effectivePrice(suggested, salePrice.trim() === "" ? null : Number(salePrice))
  const saleValid = salePrice.trim() === "" || !Number.isNaN(Number(salePrice))

  const canSave =
    name.trim() !== "" &&
    costPrice > 0 &&
    quantity >= 0 &&
    marginValid &&
    saleValid &&
    !Number.isNaN(costPrice)

  const createMutation = useMutation({
    mutationFn: async () => {
      const product = await createProduct({
        name: name.trim(),
        sku: sku.trim() || generateSku(),
        supplierId,
        costPrice,
        // A typed selling price is stored as the manual override, which is what
        // the backend resolves `sale_price` from; with it blank the price is
        // derived from the margin on every read.
        editedPrice: salePrice.trim() === "" ? null : Number(salePrice),
        profitMarginPct: marginValue,
        // The quantity is entered through a movement rather than written onto the
        // product, so the stock the counter sees is backed by a row in the
        // product's history instead of appearing from nowhere.
        stockQuantity: 0,
        unit: unit.trim() || "unit",
        warehouseId,
        createdBy: user?.id,
      })

      if (quantity > 0) {
        await createInventoryMovement({
          productId: product.id,
          warehouseId,
          quantity: Math.abs(quantity),
          type: "in",
          referenceType: "quick_add",
          notes: t("inventory.quickAdd.openingStock"),
          createdBy: user?.id,
        })
      }

      return product
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-products"] })
      queryClient.invalidateQueries({ queryKey: ["inventory-suppliers"] })
      invalidateStock()

      setAdded((count) => count + 1)
      // Only the identifying fields reset. Supplier, prices, unit and warehouse
      // are the constant part of a supplier's catalogue.
      setName("")
      setSku("")
      setQuantity(0)
      setDuplicateSku(false)
    },
    onError: (err) => {
      if (isDuplicateSku(err)) {
        // The generated SKU cannot clash with a hand-typed one, so this is always
        // a code the user typed twice.
        setDuplicateSku(true)
        return
      }
      notification.error(t("common.error"), String(err))
    },
  })

  const handleSubmit = () => {
    if (!canSave) return
    createMutation.mutate()
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setDuplicateSku(false)
      setAdded(0)
    }
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl" data-testid="quick-add-product-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackagePlus className="h-5 w-5" />
            {t("inventory.quickAdd.title")}
          </DialogTitle>
          <DialogDescription>{t("inventory.quickAdd.description")}</DialogDescription>
        </DialogHeader>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto py-1">
          {added > 0 && (
            <p
              className="flex items-center gap-2 rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400"
              data-testid="quick-add-added-count"
            >
              <Plus className="h-4 w-4" />
              {t("inventory.quickAdd.addedCount", { count: added })}
            </p>
          )}

          <TextField
            label={t("inventory.productName")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
            placeholder={t("inventory.quickAdd.productNamePlaceholder")}
            data-testid="quick-add-name"
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField
              label={t("inventory.sku")}
              value={sku}
              onChange={(e) => {
                setSku(e.target.value)
                setDuplicateSku(false)
              }}
              error={duplicateSku ? t("inventory.quickAdd.duplicateSku") : undefined}
              description={t("inventory.quickAdd.skuHint")}
              data-testid="quick-add-sku"
            />
            <NumberField
              label={t("inventory.stockQuantity")}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              required
              min={0}
              step={1}
              data-testid="quick-add-quantity"
            />
          </div>

          <SupplierPicker
            value={supplierId}
            onChange={setSupplierId}
            label={t("inventory.supplier")}
            placeholder={t("inventory.quickAdd.searchSupplier")}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <CurrencyField
              label={t("inventory.costPrice")}
              value={costPrice}
              onChange={(e) => setCostPrice(Number(e.target.value))}
              required
              data-testid="quick-add-cost"
            />
            <CurrencyField
              label={t("inventory.salePrice")}
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
              step={0.01}
              placeholder={t("inventory.pricing.editedPriceAuto")}
              description={t("inventory.quickAdd.salePriceHint")}
              data-testid="quick-add-sale"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <NumberField
              label={t("inventory.pricing.gainPercent")}
              value={marginPct}
              onChange={(e) => setMarginPct(e.target.value)}
              step={0.1}
              placeholder={String(globalMargin)}
              error={marginValid ? undefined : t("validation.marginRange", { min: 0, max: 90 })}
              description={t("inventory.quickAdd.marginHint", { value: globalMargin.toFixed(1) })}
            />
            <TextField
              label={t("inventory.unit")}
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="unit"
            />
          </div>

          {warehouses.length > 1 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("inventory.warehouse")}</label>
              <div className="flex flex-wrap gap-2">
                {warehouses.map((w) => (
                  <Button
                    key={w.id}
                    type="button"
                    variant={warehouseId === w.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setWarehouseId(w.id)}
                  >
                    {w.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-lg border bg-muted/40 p-3 text-sm">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <p>
                <span className="text-muted-foreground">{t("inventory.pricing.suggestedPrice")}: </span>
                <span className="font-medium">${(Number.isNaN(suggested) ? 0 : suggested).toFixed(2)}</span>
              </p>
              <p>
                <span className="text-muted-foreground">{t("inventory.pricing.effectiveMargin")}: </span>
                <span className="font-medium">
                  {Number.isNaN(Number(marginValue)) ? "-" : `${Number(marginValue).toFixed(1)}%`}
                </span>
                {marginValue === null && (
                  <span className="ml-1 text-xs text-muted-foreground">({t("inventory.pricing.followingGlobal")})</span>
                )}
              </p>
              <p>
                <span className="text-muted-foreground">{t("inventory.pricing.effectivePrice")}: </span>
                <span className="font-semibold">${(Number.isNaN(finalSale) ? 0 : finalSale).toFixed(2)}</span>
              </p>
            </div>
            {costPrice > 0 && finalSale > 0 && finalSale <= costPrice && (
              <p className="mt-2 flex items-center gap-1 text-sm text-amber-600" data-testid="quick-add-below-cost">
                <AlertTriangle className="h-4 w-4" /> {t("inventory.pricing.priceBelowCost")}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={createMutation.isPending}
          >
            {t("common.close")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSave || createMutation.isPending}
            data-testid="quick-add-submit"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("common.loading")}
              </>
            ) : (
              <>
                <PackagePlus className="mr-2 h-4 w-4" />
                {t("inventory.quickAdd.addProduct")}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
