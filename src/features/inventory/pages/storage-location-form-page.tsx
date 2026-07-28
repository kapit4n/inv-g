import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { EntityFormPage } from "@/components/entity"
import { TextField, TextareaField, SelectField } from "@/components/forms"
import { EntityActionBar } from "@/components/entity"
import { getWarehouses, getStorageLocations, createStorageLocation, updateStorageLocation } from "@/lib/tauri"
import { useNotification } from "@/hooks/use-notification"

export function StorageLocationFormPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const notification = useNotification()
  const isEdit = !!id

  const { data: warehouses = [] } = useQuery({
    queryKey: ["inventory-warehouses"],
    queryFn: getWarehouses,
  })

  const { data: allLocations = [] } = useQuery({
    queryKey: ["inventory-storage-locations"],
    queryFn: () => getStorageLocations(),
    enabled: isEdit,
  })

  const [warehouseId, setWarehouseId] = useState<number | undefined>(undefined)
  const [zone, setZone] = useState("")
  const [aisle, setAisle] = useState("")
  const [shelf, setShelf] = useState("")
  const [bin, setBin] = useState("")
  const [code, setCode] = useState("")
  const [description, setDescription] = useState("")

  useEffect(() => {
    if (isEdit && allLocations.length > 0 && id) {
      const loc = allLocations.find((l) => l.id === Number(id))
      if (loc) {
        setWarehouseId(loc.warehouseId)
        setZone(loc.zone || "")
        setAisle(loc.aisle || "")
        setShelf(loc.shelf || "")
        setBin(loc.bin || "")
        setCode(loc.code)
        setDescription(loc.description || "")
      }
    }
  }, [isEdit, allLocations, id])

  const createMutation = useMutation({
    mutationFn: createStorageLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-storage-locations"] })
      notification.success(t("common.success"), t("inventory.storageCreated"))
      navigate("/inventory/storage-locations")
    },
  })

  const updateMutation = useMutation({
    mutationFn: updateStorageLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-storage-locations"] })
      notification.success(t("common.success"), t("inventory.storageUpdated"))
      navigate("/inventory/storage-locations")
    },
  })

  const handleSave = () => {
    const data = {
      warehouseId: warehouseId!, zone: zone || undefined, aisle: aisle || undefined,
      shelf: shelf || undefined, bin: bin || undefined, code,
      description: description || undefined,
    }
    if (isEdit && id) {
      updateMutation.mutate({ id: Number(id), ...data })
    } else {
      createMutation.mutate(data)
    }
  }

  const warehouseOptions = warehouses.map((w) => ({ label: w.name, value: w.id }))

  return (
    <EntityFormPage
      title={isEdit ? t("inventory.editStorageLocation") : t("inventory.addStorageLocation")}
      backPath="/inventory/storage-locations"
    >
      <div className="space-y-6">
        <div className="space-y-4">
          <SelectField label={t("inventory.storageWarehouse")} options={warehouseOptions} value={warehouseId} onChange={(v) => setWarehouseId(Number(v))} required placeholder={t("common.select")} />
          <TextField label={t("inventory.storageCode")} value={code} onChange={(e) => setCode(e.target.value)} required />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <TextField label={t("inventory.storageZone")} value={zone} onChange={(e) => setZone(e.target.value)} />
            <TextField label={t("inventory.storageAisle")} value={aisle} onChange={(e) => setAisle(e.target.value)} />
            <TextField label={t("inventory.storageShelf")} value={shelf} onChange={(e) => setShelf(e.target.value)} />
            <TextField label={t("inventory.storageBin")} value={bin} onChange={(e) => setBin(e.target.value)} />
          </div>
          <TextareaField label={t("inventory.storageDescription")} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <EntityActionBar onSave={handleSave} saving={createMutation.isPending || updateMutation.isPending} showDelete={false} showArchive={false} showDuplicate={false} />
      </div>
    </EntityFormPage>
  )
}
