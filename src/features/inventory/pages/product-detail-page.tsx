import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { EntityDetailPage, EntityInfoCard, InfoRow } from "@/components/entity"
import { getProduct, getCategories, getBrands, getManufacturers, getSuppliers, getWarehouses } from "@/lib/tauri"
import { Badge } from "@/components/ui/badge"

export function ProductDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()

  const { data: product, isLoading } = useQuery({
    queryKey: ["inventory-product", id],
    queryFn: () => getProduct(Number(id)),
    enabled: !!id,
  })

  const { data: categories = [] } = useQuery({ queryKey: ["inventory-categories"], queryFn: getCategories })
  const { data: brands = [] } = useQuery({ queryKey: ["inventory-brands"], queryFn: getBrands })
  const { data: manufacturers = [] } = useQuery({ queryKey: ["inventory-manufacturers"], queryFn: getManufacturers })
  const { data: suppliers = [] } = useQuery({ queryKey: ["inventory-suppliers"], queryFn: getSuppliers })
  const { data: warehouses = [] } = useQuery({ queryKey: ["inventory-warehouses"], queryFn: getWarehouses })

  const catName = categories.find((c) => c.id === product?.categoryId)?.name
  const brandName = brands.find((b) => b.id === product?.brandId)?.name
  const mfrName = manufacturers.find((m) => m.id === product?.manufacturerId)?.name
  const supName = suppliers.find((s) => s.id === product?.supplierId)?.companyName
  const whName = warehouses.find((w) => w.id === product?.warehouseId)?.name

  return (
    <EntityDetailPage
      title={product?.name || t("inventory.productDetail")}
      backPath="/inventory/products"
      editPath={id ? `/inventory/products/${id}/edit` : undefined}
      loading={isLoading}
    >
      {product && (
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
            <InfoRow label={t("inventory.supplier")} value={supName} />
            <InfoRow label={t("common.status")} value={<Badge variant={product.isActive ? "default" : "secondary"}>{product.isActive ? t("common.active") : t("common.inactive")}</Badge>} />
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
          </EntityInfoCard>
        </div>
      )}
    </EntityDetailPage>
  )
}