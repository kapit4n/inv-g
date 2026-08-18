import { useTranslation } from "react-i18next"
import { EntityInfoCard, InfoRow } from "@/components/entity"
import { Badge } from "@/components/ui/badge"
import type { InventoryProduct } from "@/types/inventory"
import type { ProductImage } from "@/types/inventory"

interface Props {
  product: InventoryProduct
  catName?: string
  brandName?: string
  mfrName?: string
  whName?: string
  storageLocName?: string
  images: ProductImage[]
}

export function ProductOverviewTab({ product, catName, brandName, mfrName, whName, storageLocName, images }: Props) {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      <EntityInfoCard title={t("inventory.productName")} columns={2}>
        <InfoRow label={t("inventory.productName")} value={product.name} />
        <InfoRow label={t("inventory.sku")} value={product.sku} />
        <InfoRow label={t("inventory.barcode")} value={product.barcode} />
        <InfoRow label={t("inventory.oemNumber")} value={product.oemNumber} />
        <InfoRow label={t("inventory.internalCode")} value={product.internalCode} />
        <InfoRow label={t("inventory.description")} value={product.description} />
        <InfoRow label={t("inventory.category")} value={catName} />
        <InfoRow label={t("inventory.brand")} value={brandName} />
        <InfoRow label={t("inventory.manufacturer")} value={mfrName} />
        <InfoRow
          label={t("common.status")}
          value={<Badge variant={product.isActive ? "default" : "secondary"}>{product.isActive ? t("common.active") : t("common.inactive")}</Badge>}
        />
        <InfoRow label={t("inventory.isDiscontinued")} value={product.isDiscontinued ? t("common.yes") : t("common.no")} />
      </EntityInfoCard>

      <EntityInfoCard title={t("inventory.costPrice")} columns={2}>
        <InfoRow label={t("inventory.costPrice")} value={`$${product.costPrice.toFixed(2)}`} />
        <InfoRow label={t("inventory.salePrice")} value={`$${product.salePrice.toFixed(2)}`} />
        <InfoRow label={t("inventory.wholesalePrice")} value={`$${product.wholesalePrice.toFixed(2)}`} />
        <InfoRow label={t("inventory.suggestedRetailPrice")} value={`$${product.suggestedRetailPrice.toFixed(2)}`} />
        <InfoRow label={t("inventory.taxRate")} value={`${(product.taxRate * 100).toFixed(1)}%`} />
      </EntityInfoCard>

      <EntityInfoCard title={t("inventory.stock")} columns={2}>
        <InfoRow label={t("inventory.stockQuantity")} value={product.stockQuantity} />
        <InfoRow label={t("inventory.minStockLevel")} value={product.minStockLevel} />
        <InfoRow label={t("inventory.maxStockLevel")} value={product.maxStockLevel} />
        <InfoRow label={t("inventory.reorderPoint")} value={product.reorderPoint} />
        <InfoRow label={t("inventory.unit")} value={product.unit} />
        <InfoRow label={t("inventory.weight")} value={product.weight ? `${product.weight} kg` : "-"} />
        <InfoRow label={t("inventory.warehouse")} value={whName} />
        <InfoRow label={t("inventory.storageLocation")} value={storageLocName} />
      </EntityInfoCard>

      {images.length > 0 && (
        <EntityInfoCard title={t("inventory.productImages")}>
          <div className="space-y-2">
            {images.map((img) => (
              <div key={img.id} className="flex items-center gap-2 text-sm">
                <span>{img.filePath}</span>
                {img.isPrimary && <Badge variant="outline">{t("inventory.primaryImage")}</Badge>}
              </div>
            ))}
          </div>
        </EntityInfoCard>
      )}
    </div>
  )
}
