import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { EntityFormPage } from "@/components/entity"
import { TextField, TextareaField } from "@/components/forms"
import { EntityActionBar } from "@/components/entity"
import { getWarehouses, createWarehouse, updateWarehouse } from "@/lib/tauri"
import { useNotification } from "@/hooks/use-notification"

export function WarehouseFormPage() {
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

  const existing = isEdit ? warehouses.find((w) => w.id === Number(id)) : null

  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [stateProvince, setStateProvince] = useState("")
  const [country, setCountry] = useState("")
  const [manager, setManager] = useState("")
  const [phone, setPhone] = useState("")

  useEffect(() => {
    if (existing) {
      setName(existing.name); setCode(existing.code)
      setAddress(existing.address || ""); setCity(existing.city || "")
      setStateProvince(existing.state || ""); setCountry(existing.country || "")
      setManager(existing.manager || ""); setPhone(existing.phone || "")
    }
  }, [existing])

  const createMutation = useMutation({
    mutationFn: createWarehouse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-warehouses"] })
      notification.success(t("common.success"), t("inventory.warehouseCreated"))
      navigate("/inventory/warehouses")
    },
  })

  const updateMutation = useMutation({
    mutationFn: updateWarehouse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-warehouses"] })
      notification.success(t("common.success"), t("inventory.warehouseUpdated"))
      navigate("/inventory/warehouses")
    },
  })

  const handleSave = () => {
    const data = {
      name, code, address: address || undefined, city: city || undefined,
      stateProvince: stateProvince || undefined, country: country || undefined,
      manager: manager || undefined, phone: phone || undefined,
    }
    if (isEdit && existing) {
      updateMutation.mutate({ id: existing.id, ...data })
    } else {
      createMutation.mutate(data)
    }
  }

  return (
    <EntityFormPage
      title={isEdit ? t("inventory.editWarehouse") : t("inventory.addWarehouse")}
      backPath="/inventory/warehouses"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField label={t("inventory.warehouseName")} value={name} onChange={(e) => setName(e.target.value)} required />
          <TextField label={t("inventory.warehouseCode")} value={code} onChange={(e) => setCode(e.target.value)} required />
          <TextField label={t("inventory.warehouseManager")} value={manager} onChange={(e) => setManager(e.target.value)} />
          <TextField label={t("inventory.warehousePhone")} value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <TextareaField label={t("inventory.warehouseAddress")} value={address} onChange={(e) => setAddress(e.target.value)} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <TextField label={t("inventory.warehouseCity")} value={city} onChange={(e) => setCity(e.target.value)} />
          <TextField label={t("inventory.warehouseState")} value={stateProvince} onChange={(e) => setStateProvince(e.target.value)} />
          <TextField label={t("inventory.warehouseCountry")} value={country} onChange={(e) => setCountry(e.target.value)} />
        </div>
        <EntityActionBar onSave={handleSave} saving={createMutation.isPending || updateMutation.isPending} showDelete={false} showArchive={false} showDuplicate={false} />
      </div>
    </EntityFormPage>
  )
}