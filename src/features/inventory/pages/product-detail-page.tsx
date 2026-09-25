import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { EntityDetailPage } from "@/components/entity"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { getProduct, getCategories, getBrands, getManufacturers, getWarehouses, getStorageLocations, getProductImages } from "@/lib/tauri"
import { ProductOverviewTab } from "../components/product-overview-tab"
import { ProductInventoryTab } from "../components/product-inventory-tab"
import { ProductPricingTab } from "../components/product-pricing-tab"
import { ProductSuppliersTab } from "../components/product-suppliers-tab"
import { ProductCompatibilityTab } from "../components/product-compatibility-tab"
import { ProductActivityTab } from "../components/product-activity-tab"
import { ProductIdentifiersTab } from "../components/product-identifiers-tab"
import { ProductEquivalentsTab } from "../components/product-equivalents-tab"

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
  const { data: warehouses = [] } = useQuery({ queryKey: ["inventory-warehouses"], queryFn: getWarehouses })
  const { data: storageLocations = [] } = useQuery({ queryKey: ["inventory-storage-locations"], queryFn: () => getStorageLocations() })
  const { data: images = [] } = useQuery({ queryKey: ["inventory-product-images", id], queryFn: () => getProductImages(Number(id)), enabled: !!id })

  const catName = categories.find((c) => c.id === product?.categoryId)?.name
  const brandName = brands.find((b) => b.id === product?.brandId)?.name
  const mfrName = manufacturers.find((m) => m.id === product?.manufacturerId)?.name
  const whName = warehouses.find((w) => w.id === product?.warehouseId)?.name
  const storageLocName = storageLocations.find((sl) => sl.id === product?.storageLocationId)?.code

  return (
    <EntityDetailPage
      title={product?.name || t("inventory.productDetail")}
      backPath="/inventory/products"
      editPath={id ? `/inventory/products/${id}/edit` : undefined}
      loading={isLoading}
    >
      {product && (
        <Tabs defaultValue="overview">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="overview">{t("inventory.product360.tabs.overview")}</TabsTrigger>
            <TabsTrigger value="inventory">{t("inventory.product360.tabs.inventory")}</TabsTrigger>
            <TabsTrigger value="pricing">{t("inventory.product360.tabs.pricing")}</TabsTrigger>
            <TabsTrigger value="suppliers">{t("inventory.product360.tabs.suppliers")}</TabsTrigger>
            <TabsTrigger value="compatibility">{t("inventory.product360.tabs.compatibility")}</TabsTrigger>
            <TabsTrigger value="identifiers">{t("inventory.product360.tabs.identifiers")}</TabsTrigger>
            <TabsTrigger value="equivalents">{t("inventory.product360.tabs.equivalents")}</TabsTrigger>
            <TabsTrigger value="activity">{t("inventory.product360.tabs.activity")}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <ProductOverviewTab
              product={product}
              catName={catName}
              brandName={brandName}
              mfrName={mfrName}
              whName={whName}
              storageLocName={storageLocName}
              images={images}
            />
          </TabsContent>

          <TabsContent value="inventory">
            <ProductInventoryTab product={product} whName={whName} storageLocName={storageLocName} />
          </TabsContent>

          <TabsContent value="pricing">
            <ProductPricingTab product={product} />
          </TabsContent>

          <TabsContent value="suppliers">
            <ProductSuppliersTab product={product} />
          </TabsContent>

          <TabsContent value="compatibility">
            <ProductCompatibilityTab productId={product.id} />
          </TabsContent>

          <TabsContent value="identifiers">
            <ProductIdentifiersTab productId={product.id} />
          </TabsContent>

          <TabsContent value="equivalents">
            <ProductEquivalentsTab productId={product.id} />
          </TabsContent>

          <TabsContent value="activity">
            <ProductActivityTab productId={product.id} />
          </TabsContent>
        </Tabs>
      )}
    </EntityDetailPage>
  )
}
