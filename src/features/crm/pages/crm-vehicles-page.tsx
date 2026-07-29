import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Search, ChevronDown, ChevronRight, Plus } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import toast from "react-hot-toast"
import { getVehicleBrands, createVehicleBrand, getVehicleModels, createVehicleModel } from "@/lib/tauri"
import type { VehicleBrand, VehicleModel } from "@/types"

export function CrmVehiclesPage() {
  const { t } = useTranslation("crm")
  const [brands, setBrands] = useState<VehicleBrand[]>([])
  const [models, setModels] = useState<Record<number, VehicleModel[]>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [expandedBrands, setExpandedBrands] = useState<number[]>([])
  const [brandDialog, setBrandDialog] = useState(false)
  const [modelDialog, setModelDialog] = useState(false)
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null)
  const [formName, setFormName] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formCountry, setFormCountry] = useState("")
  const [formModelName, setFormModelName] = useState("")
  const [saving, setSaving] = useState(false)

  const filteredBrands = brands.filter((b) =>
    !search || b.name.toLowerCase().includes(search.toLowerCase())
  )

  const fetchBrands = async () => {
    setLoading(true)
    try {
      const data = await getVehicleBrands()
      setBrands(data)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load brands")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBrands()
  }, [])

  const toggleBrand = async (brandId: number) => {
    if (expandedBrands.includes(brandId)) {
      setExpandedBrands((prev) => prev.filter((id) => id !== brandId))
    } else {
      if (!models[brandId]) {
        try {
          const data = await getVehicleModels(brandId)
          setModels((prev) => ({ ...prev, [brandId]: data }))
        } catch { }
      }
      setExpandedBrands((prev) => [...prev, brandId])
    }
  }

  const handleAddBrand = async () => {
    if (!formName.trim()) {
      toast.error("Name is required")
      return
    }
    setSaving(true)
    try {
      await createVehicleBrand(formName.trim(), formDescription || undefined, formCountry || undefined)
      toast.success("Brand created")
      setBrandDialog(false)
      setFormName("")
      setFormDescription("")
      setFormCountry("")
      fetchBrands()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create brand")
    } finally {
      setSaving(false)
    }
  }

  const handleAddModel = async () => {
    if (!formModelName.trim() || !selectedBrandId) {
      toast.error("Model name is required")
      return
    }
    setSaving(true)
    try {
      await createVehicleModel(selectedBrandId, formModelName.trim())
      toast.success("Model created")
      setModelDialog(false)
      setFormModelName("")
      const data = await getVehicleModels(selectedBrandId)
      setModels((prev) => ({ ...prev, [selectedBrandId]: data }))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create model")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("vehicles")}
        description="Vehicle database management"
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => { setSelectedBrandId(null); setBrandDialog(true) }}>
              <Plus className="h-4 w-4 mr-1" /> Add Brand
            </Button>
          </div>
        }
      />

      <div className="flex items-center gap-2">
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search brands..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredBrands.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">{t("noResults")}</CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredBrands.map((brand) => (
            <Card key={brand.id}>
              <CardContent className="p-0">
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => toggleBrand(brand.id)}
                >
                  <div className="flex items-center gap-3">
                    {expandedBrands.includes(brand.id) ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium">{brand.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {brand.country ? `${brand.country}` : ""}
                        {brand.description ? ` — ${brand.description}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={brand.isActive ? "success" : "secondary"}>
                      {brand.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedBrandId(brand.id)
                        setModelDialog(true)
                      }}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add Model
                    </Button>
                  </div>
                </div>
                {expandedBrands.includes(brand.id) && (
                  <div className="border-t px-4 py-3 space-y-2">
                    {!models[brand.id] ? (
                      <Skeleton className="h-8 w-full" />
                    ) : models[brand.id].length === 0 ? (
                      <p className="text-sm text-muted-foreground">No models</p>
                    ) : (
                      models[brand.id].map((model) => (
                        <div key={model.id} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/30">
                          <span className="text-sm">{model.name}</span>
                          <Badge variant={model.isActive ? "success" : "secondary"} className="text-xs">
                            {model.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={brandDialog} onOpenChange={setBrandDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Brand</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Name *</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Input value={formDescription} onChange={(e) => setFormDescription(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Country</Label>
              <Input value={formCountry} onChange={(e) => setFormCountry(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBrandDialog(false)}>{t("cancel")}</Button>
            <Button onClick={handleAddBrand} disabled={saving}>{saving ? "Saving..." : t("create")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={modelDialog} onOpenChange={setModelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Model</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Model Name *</Label>
              <Input value={formModelName} onChange={(e) => setFormModelName(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModelDialog(false)}>{t("cancel")}</Button>
            <Button onClick={handleAddModel} disabled={saving}>{saving ? "Saving..." : t("create")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
