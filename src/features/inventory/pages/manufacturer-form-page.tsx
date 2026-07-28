import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { EntityFormPage } from "@/components/entity"
import { TextField, TextareaField } from "@/components/forms"
import { EntityActionBar } from "@/components/entity"
import { getManufacturers, createManufacturer, updateManufacturer } from "@/lib/tauri"
import { useNotification } from "@/hooks/use-notification"

export function ManufacturerFormPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const notification = useNotification()
  const isEdit = !!id

  const { data: manufacturers = [] } = useQuery({
    queryKey: ["inventory-manufacturers"],
    queryFn: getManufacturers,
  })

  const existing = isEdit ? manufacturers.find((m) => m.id === Number(id)) : null

  const [name, setName] = useState("")
  const [country, setCountry] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [website, setWebsite] = useState("")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    if (existing) {
      setName(existing.name)
      setCountry(existing.country || "")
      setPhone(existing.phone || "")
      setEmail(existing.email || "")
      setWebsite(existing.website || "")
      setNotes(existing.notes || "")
    }
  }, [existing])

  const createMutation = useMutation({
    mutationFn: createManufacturer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-manufacturers"] })
      notification.success(t("common.success"), t("inventory.manufacturerCreated"))
      navigate("/inventory/manufacturers")
    },
  })

  const updateMutation = useMutation({
    mutationFn: updateManufacturer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-manufacturers"] })
      notification.success(t("common.success"), t("inventory.manufacturerUpdated"))
      navigate("/inventory/manufacturers")
    },
  })

  const handleSave = () => {
    const data = { name, country: country || undefined, phone: phone || undefined, email: email || undefined, website: website || undefined, notes: notes || undefined }
    if (isEdit && existing) {
      updateMutation.mutate({ id: existing.id, ...data })
    } else {
      createMutation.mutate(data)
    }
  }

  return (
    <EntityFormPage
      title={isEdit ? t("inventory.editManufacturer") : t("inventory.addManufacturer")}
      backPath="/inventory/manufacturers"
    >
      <div className="space-y-6">
        <div className="space-y-4">
          <TextField label={t("inventory.manufacturerName")} value={name} onChange={(e) => setName(e.target.value)} required />
          <TextField label={t("inventory.manufacturerCountry")} value={country} onChange={(e) => setCountry(e.target.value)} />
          <TextField label={t("inventory.manufacturerPhone")} value={phone} onChange={(e) => setPhone(e.target.value)} />
          <TextField label={t("inventory.manufacturerEmail")} value={email} onChange={(e) => setEmail(e.target.value)} />
          <TextField label={t("inventory.manufacturerWebsite")} value={website} onChange={(e) => setWebsite(e.target.value)} />
          <TextareaField label={t("inventory.manufacturerNotes")} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <EntityActionBar onSave={handleSave} saving={createMutation.isPending || updateMutation.isPending} showDelete={false} showArchive={false} showDuplicate={false} />
      </div>
    </EntityFormPage>
  )
}