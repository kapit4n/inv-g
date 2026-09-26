import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Plus, Trash2, Car } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  getProductCompatibility,
  createCompatibility,
  deleteCompatibility,
  getVehicleBrands,
  getVehicleModels,
  getVehicleGenerations,
  getVehicleEngines,
  getVehicleTransmissions,
} from "@/lib/tauri"
import toast from "react-hot-toast"
import type { CompatibilityEntry } from "@/types"

interface Props {
  productId: number
}

const SELECT_CLASS =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"

const currentYear = new Date().getFullYear()
const YEAR_OPTIONS = Array.from({ length: 60 }, (_, i) => currentYear + 1 - i)

export function ProductCompatibilityTab({ productId }: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const { data: compatibility = [] } = useQuery({
    queryKey: ["inventory-product-compatibility", productId],
    queryFn: () => getProductCompatibility(productId),
    enabled: !!productId,
  })

  // The vehicle catalog lives in CRM > Vehiculos, so the pickers reuse it
  // rather than duplicating the tables.
  const { data: brands = [] } = useQuery({ queryKey: ["vehicle-brands"], queryFn: () => getVehicleBrands() })
  const { data: engines = [] } = useQuery({ queryKey: ["vehicle-engines"], queryFn: () => getVehicleEngines() })
  const { data: transmissions = [] } = useQuery({ queryKey: ["vehicle-transmissions"], queryFn: getVehicleTransmissions })

  const [showAdd, setShowAdd] = useState(false)
  const [brandId, setBrandId] = useState("")
  const [modelId, setModelId] = useState("")
  const [generationId, setGenerationId] = useState("")
  const [engineId, setEngineId] = useState("")
  const [transmissionId, setTransmissionId] = useState("")
  const [yearStart, setYearStart] = useState("")
  const [yearEnd, setYearEnd] = useState("")
  const [notes, setNotes] = useState("")

  const { data: models = [] } = useQuery({
    queryKey: ["vehicle-models", brandId],
    queryFn: () => getVehicleModels(Number(brandId)),
    enabled: !!brandId,
  })

  const { data: generations = [] } = useQuery({
    queryKey: ["vehicle-generations", modelId],
    queryFn: () => getVehicleGenerations(Number(modelId)),
    enabled: !!modelId,
  })

  const resetForm = () => {
    setBrandId("")
    setModelId("")
    setGenerationId("")
    setEngineId("")
    setTransmissionId("")
    setYearStart("")
    setYearEnd("")
    setNotes("")
  }

  // Without this the Part Finder has nothing to search: it reads
  // `product_vehicle_compatibility` for every result.
  const createMutation = useMutation({
    mutationFn: () =>
      createCompatibility(
        productId,
        brandId ? Number(brandId) : undefined,
        modelId ? Number(modelId) : undefined,
        generationId ? Number(generationId) : undefined,
        engineId ? Number(engineId) : undefined,
        transmissionId ? Number(transmissionId) : undefined,
        yearStart ? Number(yearStart) : undefined,
        yearEnd ? Number(yearEnd) : undefined,
        notes.trim() || undefined
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-product-compatibility", productId] })
      resetForm()
      setShowAdd(false)
      toast.success(t("inventory.compatibilityAdded"))
    },
    onError: (e) => toast.error(String(e)),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteCompatibility(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-product-compatibility", productId] })
      toast.success(t("common.deleted"))
    },
    onError: (e) => toast.error(String(e)),
  })

  // A row that names no vehicle at all is not a fitment, it is noise that the
  // Part Finder cannot match against anything.
  const hasVehicle = brandId || modelId || generationId || engineId || transmissionId
  const yearRangeInvalid = !!yearStart && !!yearEnd && Number(yearStart) > Number(yearEnd)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Car className="h-5 w-5" />
          {t("inventory.vehicleCompatibility")}
        </h3>
        <Button size="sm" onClick={() => setShowAdd((v) => !v)}>
          <Plus className="mr-2 h-4 w-4" />
          {t("inventory.addCompatibility")}
        </Button>
      </div>

      {showAdd && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("inventory.addCompatibility")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="grid gap-1">
                <label htmlFor="compat-brand" className="text-xs text-muted-foreground">{t("inventory.vehicleBrand")}</label>
                <select
                  id="compat-brand"
                  className={SELECT_CLASS}
                  value={brandId}
                  onChange={(e) => {
                    setBrandId(e.target.value)
                    // A model belongs to exactly one brand, so changing the
                    // brand has to invalidate the model and generation.
                    setModelId("")
                    setGenerationId("")
                  }}
                >
                  <option value="">{t("inventory.anyBrand")}</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid gap-1">
                <label htmlFor="compat-model" className="text-xs text-muted-foreground">{t("inventory.vehicleModel")}</label>
                <select
                  id="compat-model"
                  className={SELECT_CLASS}
                  value={modelId}
                  onChange={(e) => {
                    setModelId(e.target.value)
                    setGenerationId("")
                  }}
                  disabled={!brandId}
                >
                  <option value="">{t("inventory.anyModel")}</option>
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid gap-1">
                <label htmlFor="compat-generation" className="text-xs text-muted-foreground">{t("inventory.generation")}</label>
                <select
                  id="compat-generation"
                  className={SELECT_CLASS}
                  value={generationId}
                  onChange={(e) => setGenerationId(e.target.value)}
                  disabled={!modelId}
                >
                  <option value="">{t("inventory.anyGeneration")}</option>
                  {generations.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid gap-1">
                <label htmlFor="compat-engine" className="text-xs text-muted-foreground">{t("inventory.engine")}</label>
                <select
                  id="compat-engine"
                  className={SELECT_CLASS}
                  value={engineId}
                  onChange={(e) => setEngineId(e.target.value)}
                >
                  <option value="">{t("inventory.anyEngine")}</option>
                  {engines.map((e) => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid gap-1">
                <label htmlFor="compat-transmission" className="text-xs text-muted-foreground">{t("inventory.transmission")}</label>
                <select
                  id="compat-transmission"
                  className={SELECT_CLASS}
                  value={transmissionId}
                  onChange={(e) => setTransmissionId(e.target.value)}
                >
                  <option value="">{t("inventory.anyTransmission")}</option>
                  {transmissions.map((tr) => (
                    <option key={tr.id} value={tr.id}>{tr.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-1">
                  <label htmlFor="compat-year-start" className="text-xs text-muted-foreground">{t("inventory.yearStart")}</label>
                    <select
                      id="compat-year-start"
                    className={SELECT_CLASS}
                    value={yearStart}
                    onChange={(e) => setYearStart(e.target.value)}
                  >
                    <option value="">{t("inventory.noLimit")}</option>
                    {YEAR_OPTIONS.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-1">
                  <label htmlFor="compat-year-end" className="text-xs text-muted-foreground">{t("inventory.yearEnd")}</label>
                    <select
                      id="compat-year-end"
                    className={SELECT_CLASS}
                    value={yearEnd}
                    onChange={(e) => setYearEnd(e.target.value)}
                  >
                    <option value="">{t("inventory.noLimit")}</option>
                    {YEAR_OPTIONS.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {yearRangeInvalid && (
              <p className="text-sm text-destructive">{t("inventory.yearRangeInvalid")}</p>
            )}

            <Input
              id="compat-notes"
              placeholder={t("inventory.notesOptional")}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />

            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowAdd(false)}>
                {t("common.cancel")}
              </Button>
              <Button
                size="sm"
                onClick={() => createMutation.mutate()}
                disabled={!hasVehicle || yearRangeInvalid || createMutation.isPending}
              >
                {t("common.save")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {compatibility.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Car className="h-10 w-10 mb-3 opacity-50" />
            <p className="text-sm">{t("inventory.noCompatibility")}</p>
            <p className="text-xs mt-1">{t("inventory.noCompatibilityHint")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {compatibility.map((c: CompatibilityEntry) => (
            <div key={c.id} className="border-b pb-3 last:border-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">
                    {[c.brandName, c.modelName, c.generationName].filter(Boolean).join(" ") || t("common.noData")}
                  </p>
                  {(c.yearStart || c.yearEnd) && (
                    <Badge variant="outline" className="text-xs">
                      {c.yearStart ?? "*"}-{c.yearEnd ?? "*"}
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-destructive"
                  onClick={() => deleteMutation.mutate(c.id)}
                  aria-label={t("common.delete")}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                {c.engineName && <span>{c.engineName}</span>}
                {c.transmissionName && <span>· {c.transmissionName}</span>}
                {c.notes && <span>· {c.notes}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
