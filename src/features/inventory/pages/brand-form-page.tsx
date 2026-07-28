import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { EntityFormPage } from "@/components/entity"
import { TextField, TextareaField } from "@/components/forms"
import { EntityActionBar } from "@/components/entity"
import { getBrands, createBrand, updateBrand } from "@/lib/tauri"
import { useNotification } from "@/hooks/use-notification"

export function BrandFormPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const notification = useNotification()
  const isEdit = !!id

  const { data: brands = [] } = useQuery({
    queryKey: ["inventory-brands"],
    queryFn: getBrands,
  })

  const existing = isEdit ? brands.find((b) => b.id === Number(id)) : null

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [country, setCountry] = useState("")
  const [website, setWebsite] = useState("")

  useEffect(() => {
    if (existing) {
      setName(existing.name)
      setDescription(existing.description || "")
      setCountry(existing.country || "")
      setWebsite(existing.website || "")
    }
  }, [existing])

  const createMutation = useMutation({
    mutationFn: createBrand,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-brands"] })
      notification.success(t("common.success"), t("inventory.brandCreated"))
      navigate("/inventory/brands")
    },
  })

  const updateMutation = useMutation({
    mutationFn: updateBrand,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-brands"] })
      notification.success(t("common.success"), t("inventory.brandUpdated"))
      navigate("/inventory/brands")
    },
  })

  const handleSave = () => {
    if (isEdit && existing) {
      updateMutation.mutate({ id: existing.id, name, description: description || undefined, country: country || undefined, website: website || undefined })
    } else {
      createMutation.mutate({ name, description: description || undefined, country: country || undefined, website: website || undefined })
    }
  }

  return (
    <EntityFormPage
      title={isEdit ? t("inventory.editBrand") : t("inventory.addBrand")}
      backPath="/inventory/brands"
    >
      <div className="space-y-6">
        <div className="space-y-4">
          <TextField label={t("inventory.brandName")} value={name} onChange={(e) => setName(e.target.value)} required />
          <TextareaField label={t("inventory.brandDescription")} value={description} onChange={(e) => setDescription(e.target.value)} />
          <TextField label={t("inventory.brandCountry")} value={country} onChange={(e) => setCountry(e.target.value)} />
          <TextField label={t("inventory.brandWebsite")} value={website} onChange={(e) => setWebsite(e.target.value)} />
        </div>
        <EntityActionBar onSave={handleSave} saving={createMutation.isPending || updateMutation.isPending} showDelete={false} showArchive={false} showDuplicate={false} />
      </div>
    </EntityFormPage>
  )
}