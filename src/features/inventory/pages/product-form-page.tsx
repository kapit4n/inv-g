import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { EntityFormPage } from "@/components/entity"
import { TextField, TextareaField, NumberField, SelectField, CurrencyField } from "@/components/forms"
import { EntityActionBar } from "@/components/entity"
import { getProduct, getCategories, getBrands, getManufacturers, getSuppliers, getWarehouses, createProduct, updateProduct } from "@/lib/tauri"
import { useNotification } from "@/hooks/use-notification"

export function ProductFormPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const notification = useNotification()
  const isEdit = !!id

  const { data: product } = useQuery({
    queryKey: ["inventory-product", id],
    queryFn: () => getProduct(Number(id)),
    enabled: isEdit,
  })

  const { data: categories = [] } = useQuery({ queryKey: ["inventory-categories"], queryFn: getCategories })
  const { data: brands = [] } = useQuery({ queryKey: ["inventory-brands"], queryFn: getBrands })
  const { data: manufacturers = [] } = useQuery({ queryKey: ["inventory-manufacturers"], queryFn: getManufacturers })
  const { data: suppliers = [] } = useQuery({ queryKey: ["inventory-suppliers"], queryFn: getSuppliers })
  const { data: warehouses = [] } = useQuery({ queryKey: ["inventory-warehouses"], queryFn: getWarehouses })

  const [name, setName] = useState("")
  const [sku, setSku] = useState("")
  const [barcode, setBarcode] = useState("")
  const [oemNumber, setOemNumber] = useState("")
  const [internalCode, setInternalCode] = useState("")
  const [description, setDescription] = useState("")
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined)
  const [brandId, setBrandId] = useState<number | undefined>(undefined)
  const [manufacturerId, setManufacturerId] = useState<number | undefined>(undefined)
  const [supplierId, setSupplierId] = useState<number | undefined>(undefined)
  const [costPrice, setCostPrice] = useState(0)
  const [salePrice, setSalePrice] = useState(0)
  const [wholesalePrice, setWholesalePrice] = useState(0)
  const [suggestedRetailPrice, setSuggestedRetailPrice] = useState(0)
  const [taxRate, setTaxRate] = useState(0)
  const [stockQuantity, setStockQuantity] = useState(0)
  const [minStockLevel, setMinStockLevel] = useState(0)
  const [maxStockLevel, setMaxStockLevel] = useState(0)
  const [reorderPoint, setReorderPoint] = useState(0)
  const [unit, setUnit] = useState("")
  const [weight, setWeight] = useState(0)
  const [warehouseId, setWarehouseId] = useState<number | undefined>(undefined)
  const [imageUrl, setImageUrl] = useState("")

  useEffect(() => {
    if (product) {
      setName(product.name); setSku(product.sku)
      setBarcode(product.barcode || ""); setOemNumber(product.oemNumber || "")
      setInternalCode(product.internalCode || ""); setDescription(product.description || "")
      setCategoryId(product.categoryId ?? undefined); setBrandId(product.brandId ?? undefined)
      setManufacturerId(product.manufacturerId ?? undefined); setSupplierId(product.supplierId ?? undefined)
      setCostPrice(product.costPrice); setSalePrice(product.salePrice)
      setWholesalePrice(product.wholesalePrice); setSuggestedRetailPrice(product.suggestedRetailPrice)
      setTaxRate(product.taxRate); setStockQuantity(product.stockQuantity)
      setMinStockLevel(product.minStockLevel); setMaxStockLevel(product.maxStockLevel)
      setReorderPoint(product.reorderPoint); setUnit(product.unit)
      setWeight(product.weight ?? 0); setWarehouseId(product.warehouseId ?? undefined)
      setImageUrl(product.imageUrl || "")
    }
  }, [product])

  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-products"] })
      notification.success(t("common.success"), t("inventory.productCreated"))
      navigate("/inventory/products")
    },
  })

  const updateMutation = useMutation({
    mutationFn: updateProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-products"] })
      notification.success(t("common.success"), t("inventory.productUpdated"))
      navigate("/inventory/products")
    },
  })

  const handleSave = () => {
    const data = {
      name, sku, barcode: barcode || undefined, oemNumber: oemNumber || undefined,
      internalCode: internalCode || undefined, description: description || undefined,
      categoryId, brandId, manufacturerId, supplierId,
      costPrice, salePrice, wholesalePrice, suggestedRetailPrice, taxRate,
      stockQuantity, minStockLevel, maxStockLevel, reorderPoint,
      unit, weight: weight || undefined, warehouseId, imageUrl: imageUrl || undefined,
    }
    if (isEdit && product) {
      updateMutation.mutate({ id: product.id, ...data })
    } else {
      createMutation.mutate(data as any)
    }
  }

  const catOptions = categories.map((c) => ({ label: c.name, value: c.id }))
  const brandOptions = brands.map((b) => ({ label: b.name, value: b.id }))
  const mfrOptions = manufacturers.map((m) => ({ label: m.name, value: m.id }))
  const supOptions = suppliers.map((s) => ({ label: s.companyName, value: s.id }))
  const whOptions = warehouses.map((w) => ({ label: w.name, value: w.id }))

  return (
    <EntityFormPage
      title={isEdit ? t("inventory.editProduct") : t("inventory.addProduct")}
      backPath="/inventory/products"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField label={t("inventory.productName")} value={name} onChange={(e) => setName(e.target.value)} required />
          <TextField label={t("inventory.sku")} value={sku} onChange={(e) => setSku(e.target.value)} required />
          <TextField label={t("inventory.barcode")} value={barcode} onChange={(e) => setBarcode(e.target.value)} />
          <TextField label={t("inventory.oemNumber")} value={oemNumber} onChange={(e) => setOemNumber(e.target.value)} />
          <TextField label={t("inventory.internalCode")} value={internalCode} onChange={(e) => setInternalCode(e.target.value)} />
          <SelectField label={t("inventory.category")} options={catOptions} value={categoryId} onChange={(v) => setCategoryId(v ? Number(v) : undefined)} placeholder={t("common.select")} />
          <SelectField label={t("inventory.brand")} options={brandOptions} value={brandId} onChange={(v) => setBrandId(v ? Number(v) : undefined)} placeholder={t("common.select")} />
          <SelectField label={t("inventory.manufacturer")} options={mfrOptions} value={manufacturerId} onChange={(v) => setManufacturerId(v ? Number(v) : undefined)} placeholder={t("common.select")} />
          <SelectField label={t("inventory.supplier")} options={supOptions} value={supplierId} onChange={(v) => setSupplierId(v ? Number(v) : undefined)} placeholder={t("common.select")} />
        </div>
        <TextareaField label={t("inventory.description")} value={description} onChange={(e) => setDescription(e.target.value)} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <CurrencyField label={t("inventory.costPrice")} value={costPrice} onChange={(e) => setCostPrice(Number(e.target.value))} />
          <CurrencyField label={t("inventory.salePrice")} value={salePrice} onChange={(e) => setSalePrice(Number(e.target.value))} />
          <CurrencyField label={t("inventory.wholesalePrice")} value={wholesalePrice} onChange={(e) => setWholesalePrice(Number(e.target.value))} />
          <CurrencyField label={t("inventory.suggestedRetailPrice")} value={suggestedRetailPrice} onChange={(e) => setSuggestedRetailPrice(Number(e.target.value))} />
          <NumberField label={t("inventory.taxRate")} value={taxRate} onChange={(e) => setTaxRate(Number(e.target.value))} step={0.01} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <NumberField label={t("inventory.stockQuantity")} value={stockQuantity} onChange={(e) => setStockQuantity(Number(e.target.value))} />
          <NumberField label={t("inventory.minStockLevel")} value={minStockLevel} onChange={(e) => setMinStockLevel(Number(e.target.value))} />
          <NumberField label={t("inventory.maxStockLevel")} value={maxStockLevel} onChange={(e) => setMaxStockLevel(Number(e.target.value))} />
          <NumberField label={t("inventory.reorderPoint")} value={reorderPoint} onChange={(e) => setReorderPoint(Number(e.target.value))} />
          <TextField label={t("inventory.unit")} value={unit} onChange={(e) => setUnit(e.target.value)} />
          <NumberField label={t("inventory.weight")} value={weight} onChange={(e) => setWeight(Number(e.target.value))} step={0.01} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectField label={t("inventory.warehouse")} options={whOptions} value={warehouseId} onChange={(v) => setWarehouseId(v ? Number(v) : undefined)} placeholder={t("common.select")} />
          <TextField label={t("inventory.imageUrl")} value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
        </div>
        <EntityActionBar onSave={handleSave} saving={createMutation.isPending || updateMutation.isPending} showDelete={false} showArchive={false} showDuplicate={false} />
      </div>
    </EntityFormPage>
  )
}