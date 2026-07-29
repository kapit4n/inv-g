import { useState, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Pencil, Trash2, Search } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { DataTable } from "@/components/data-table"
import { SelectField, TextField, NumberField } from "@/components/forms"
import type { TableColumn } from "@/types/crud"
import {
  getSupplierProducts,
  getSuppliers,
  getProducts,
  createSupplierProduct,
  updateSupplierProduct,
  deleteSupplierProduct,
} from "@/lib/tauri"
import type { SupplierProduct, SupplierProductInput } from "@/types"
import type { InventorySupplier, InventoryProduct } from "@/types/inventory"
import { useNotification } from "@/hooks/use-notification"

export function SupplierProductsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const notification = useNotification()

  const [supplierFilter, setSupplierFilter] = useState("")
  const [productSearch, setProductSearch] = useState("")

  const [showDialog, setShowDialog] = useState(false)
  const [editingItem, setEditingItem] = useState<SupplierProduct | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<SupplierProduct | null>(null)

  const [formSupplierId, setFormSupplierId] = useState("")
  const [formProductSearch, setFormProductSearch] = useState("")
  const [formProductId, setFormProductId] = useState("")
  const [formSupplierSku, setFormSupplierSku] = useState("")
  const [formDefaultCost, setFormDefaultCost] = useState("")
  const [formCurrency, setFormCurrency] = useState("USD")
  const [formMinOrder, setFormMinOrder] = useState("1")
  const [formLeadTime, setFormLeadTime] = useState("0")
  const [formIsPreferred, setFormIsPreferred] = useState(false)
  const [formStatus, setFormStatus] = useState("active")

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => getProducts(1, 1000),
  })

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => getSuppliers(),
  })

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["supplier-products", supplierFilter || undefined],
    queryFn: () =>
      getSupplierProducts(supplierFilter ? Number(supplierFilter) : undefined),
  })

  const filteredProducts = useMemo(() => {
    if (!productSearch) return items
    const q = productSearch.toLowerCase()
    return items.filter(
      (p) =>
        p.productName?.toLowerCase().includes(q) ||
        p.productSku?.toLowerCase().includes(q) ||
        p.supplierSku?.toLowerCase().includes(q),
    )
  }, [items, productSearch])

  const searchedProducts = useMemo(() => {
    if (!formProductSearch) return products.data || []
    const q = formProductSearch.toLowerCase()
    return (products.data || []).filter(
      (p) =>
        p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q),
    )
  }, [products, formProductSearch])

  const supplierOptions = suppliers.map((s) => ({
    label: s.companyName,
    value: String(s.id),
  }))

  function resetForm() {
    setFormSupplierId("")
    setFormProductSearch("")
    setFormProductId("")
    setFormSupplierSku("")
    setFormDefaultCost("")
    setFormCurrency("USD")
    setFormMinOrder("1")
    setFormLeadTime("0")
    setFormIsPreferred(false)
    setFormStatus("active")
  }

  function openCreateDialog() {
    setEditingItem(null)
    resetForm()
    setShowDialog(true)
  }

  function openEditDialog(item: SupplierProduct) {
    setEditingItem(item)
    setFormSupplierId(String(item.supplierId))
    setFormProductId(String(item.productId))
    setFormSupplierSku(item.supplierSku || "")
    setFormDefaultCost(String(item.defaultCost))
    setFormCurrency(item.currency)
    setFormMinOrder(String(item.minimumOrderQuantity))
    setFormLeadTime(String(item.leadTimeDays))
    setFormIsPreferred(item.isPreferred)
    setFormStatus(item.status)
    setShowDialog(true)
  }

  const createMutation = useMutation({
    mutationFn: () => {
      const input: SupplierProductInput = {
        supplierId: Number(formSupplierId),
        productId: Number(formProductId),
        supplierSku: formSupplierSku || undefined,
        isPreferred: formIsPreferred,
        minimumOrderQuantity: Number(formMinOrder),
        leadTimeDays: Number(formLeadTime),
        defaultCost: Number(formDefaultCost),
        currency: formCurrency,
        status: formStatus,
      }
      return editingItem
        ? updateSupplierProduct(editingItem.id, input)
        : createSupplierProduct(input)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-products"] })
      notification.success(
        t("common.success"),
        editingItem
          ? t("purchases.productUpdated")
          : t("purchases.productAdded"),
      )
      setShowDialog(false)
      resetForm()
    },
    onError: (err) => notification.error(t("common.error"), String(err)),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteSupplierProduct(deleteTarget!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-products"] })
      notification.success(t("common.success"), t("purchases.productDeleted"))
      setDeleteTarget(null)
    },
    onError: (err) => notification.error(t("common.error"), String(err)),
  })

  const columns: TableColumn<SupplierProduct>[] = [
    {
      id: "productName",
      header: t("inventory.product"),
      accessorKey: "productName",
      cell: (r) => <span className="text-sm font-medium">{r.productName || "-"}</span>,
    },
    {
      id: "productSku",
      header: t("inventory.sku"),
      accessorKey: "productSku",
      cell: (r) => (
        <span className="font-mono text-xs text-muted-foreground">{r.productSku || "-"}</span>
      ),
    },
    {
      id: "supplierSku",
      header: t("purchases.supplierSku"),
      accessorKey: "supplierSku",
      cell: (r) => (
        <span className="font-mono text-xs text-muted-foreground">{r.supplierSku || "-"}</span>
      ),
    },
    {
      id: "supplierName",
      header: t("purchases.supplier"),
      accessorKey: "supplierName",
      cell: (r) => <span className="text-sm">{r.supplierName || "-"}</span>,
    },
    {
      id: "defaultCost",
      header: t("purchases.defaultCost"),
      accessorKey: "defaultCost",
      cell: (r) => (
        <span className="tabular-nums">
          {r.defaultCost.toLocaleString("en-US", {
            style: "currency",
            currency: r.currency || "USD",
          })}
        </span>
      ),
      align: "right",
    },
    {
      id: "currency",
      header: t("purchases.currency"),
      accessorKey: "currency",
      cell: (r) => <span className="text-xs">{r.currency}</span>,
      align: "center",
    },
    {
      id: "leadTimeDays",
      header: t("purchases.leadTime"),
      accessorKey: "leadTimeDays",
      cell: (r) => <span className="text-sm">{r.leadTimeDays}d</span>,
      align: "center",
    },
    {
      id: "minimumOrderQuantity",
      header: t("purchases.minOrder"),
      accessorKey: "minimumOrderQuantity",
      cell: (r) => <span className="text-sm">{r.minimumOrderQuantity}</span>,
      align: "center",
    },
    {
      id: "isPreferred",
      header: t("purchases.preferred"),
      accessorKey: "isPreferred",
      cell: (r) =>
        r.isPreferred ? (
          <Badge variant="success" className="text-[10px]">
            {t("common.yes")}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        ),
      align: "center",
    },
    {
      id: "status",
      header: t("common.status"),
      accessorKey: "status",
      cell: (r) => (
        <Badge
          variant={r.status === "active" ? "success" : "secondary"}
          className="capitalize"
        >
          {r.status}
        </Badge>
      ),
      align: "center",
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("purchases.supplierProducts")}
        description={t("purchases.supplierProductsDescription")}
        actions={
          <Button size="sm" onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-1" />
            {t("purchases.addProduct")}
          </Button>
        }
      />

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex gap-4">
            <div className="w-56">
              <SelectField
                placeholder={t("common.allSuppliers")}
                value={supplierFilter}
                onChange={setSupplierFilter}
                options={[
                  { label: t("common.all"), value: "" },
                  ...supplierOptions,
                ]}
              />
            </div>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("purchases.searchProduct")}
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <DataTable
            data={filteredProducts}
            columns={columns}
            loading={isLoading}
            emptyMessage={t("purchases.noSupplierProducts")}
            actions={[
              {
                label: t("common.edit"),
                icon: Pencil,
                onClick: (row) => openEditDialog(row),
                variant: "ghost",
              },
              {
                label: t("common.delete"),
                icon: Trash2,
                onClick: (row) => setDeleteTarget(row),
                variant: "ghost",
              },
            ]}
          />
        </CardContent>
      </Card>

      <Dialog
        open={showDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowDialog(false)
            resetForm()
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingItem
                ? t("purchases.editProduct")
                : t("purchases.addProduct")}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? t("purchases.editProductDescription")
                : t("purchases.addProductDescription")}
            </DialogDescription>
          </DialogHeader>

          {!editingItem && !formProductId && (
            <div className="space-y-3 mb-4">
              <Label>{t("purchases.searchProductToLink")}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t("purchases.searchProduct")}
                  value={formProductSearch}
                  onChange={(e) => setFormProductSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="max-h-32 overflow-y-auto rounded-md border">
                {searchedProducts.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors border-b last:border-0"
                    onClick={() => {
                      setFormProductId(String(p.id))
                      setFormProductSearch(p.name)
                    }}
                  >
                    <span className="font-medium">{p.name}</span>
                    <span className="text-muted-foreground ml-2 font-mono text-xs">
                      {p.sku}
                    </span>
                  </button>
                ))}
                {searchedProducts.length === 0 && formProductSearch && (
                  <p className="p-3 text-sm text-muted-foreground">
                    {t("common.noResults")}
                  </p>
                )}
              </div>
            </div>
          )}

          {formProductId && (
            <div className="space-y-4">
              <SelectField
                label={t("purchases.supplier")}
                required
                value={formSupplierId}
                onChange={setFormSupplierId}
                options={supplierOptions}
                placeholder={t("common.selectSupplier")}
              />
              <TextField
                label={t("purchases.supplierSku")}
                value={formSupplierSku}
                onChange={(e) => setFormSupplierSku(e.target.value)}
              />
              <TextField
                label={t("purchases.defaultCost")}
                required
                type="number"
                step="0.01"
                value={formDefaultCost}
                onChange={(e) => setFormDefaultCost(e.target.value)}
              />
              <SelectField
                label={t("purchases.currency")}
                value={formCurrency}
                onChange={setFormCurrency}
                options={[
                  { label: "USD", value: "USD" },
                  { label: "EUR", value: "EUR" },
                  { label: "GBP", value: "GBP" },
                  { label: "MXN", value: "MXN" },
                ]}
              />
              <div className="grid grid-cols-2 gap-4">
                <NumberField
                  label={t("purchases.minOrder")}
                  value={formMinOrder}
                  onChange={(e) => setFormMinOrder(e.target.value)}
                  min={1}
                />
                <NumberField
                  label={t("purchases.leadTime")}
                  value={formLeadTime}
                  onChange={(e) => setFormLeadTime(e.target.value)}
                  min={0}
                />
              </div>
              <SelectField
                label={t("common.status")}
                value={formStatus}
                onChange={setFormStatus}
                options={[
                  { label: t("common.active"), value: "active" },
                  { label: t("common.inactive"), value: "inactive" },
                ]}
              />
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={formIsPreferred}
                  onCheckedChange={(v) => setFormIsPreferred(v === true)}
                />
                <Label className="cursor-pointer">
                  {t("purchases.isPreferred")}
                </Label>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDialog(false)
                resetForm()
              }}
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={
                !formProductId ||
                !formSupplierId ||
                !formDefaultCost ||
                createMutation.isPending
              }
            >
              {createMutation.isPending
                ? t("common.processing")
                : editingItem
                  ? t("common.save")
                  : t("purchases.addProduct")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("common.confirmDelete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("purchases.deleteProductConfirm", {
                product: deleteTarget?.productName,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending
                ? t("common.processing")
                : t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
