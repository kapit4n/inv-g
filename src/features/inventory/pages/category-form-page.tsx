import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { EntityFormPage } from "@/components/entity"
import { TextField, TextareaField, NumberField, SelectField } from "@/components/forms"
import { EntityActionBar } from "@/components/entity"
import { getCategories, createCategory, updateCategory } from "@/lib/tauri"
import { useNotification } from "@/hooks/use-notification"

export function CategoryFormPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const notification = useNotification()
  const isEdit = !!id

  const { data: categories = [] } = useQuery({
    queryKey: ["inventory-categories"],
    queryFn: getCategories,
  })

  const existing = isEdit ? categories.find((c) => c.id === Number(id)) : null

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [parentId, setParentId] = useState<number | undefined>(undefined)
  const [sortOrder, setSortOrder] = useState(0)

  useEffect(() => {
    if (existing) {
      setName(existing.name)
      setDescription(existing.description || "")
      setParentId(existing.parentId ?? undefined)
      setSortOrder(existing.sortOrder)
    }
  }, [existing])

  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-categories"] })
      notification.success(t("common.success"), t("inventory.categoryCreated"))
      navigate("/inventory/categories")
    },
  })

  const updateMutation = useMutation({
    mutationFn: updateCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-categories"] })
      notification.success(t("common.success"), t("inventory.categoryUpdated"))
      navigate("/inventory/categories")
    },
  })

  const handleSave = () => {
    if (isEdit && existing) {
      updateMutation.mutate({ id: existing.id, name, description: description || undefined, parentId, sortOrder })
    } else {
      createMutation.mutate({ name, description: description || undefined, parentId, sortOrder })
    }
  }

  const parentOptions = categories
    .filter((c) => !isEdit || c.id !== Number(id))
    .map((c) => ({ label: c.name, value: c.id }))

  return (
    <EntityFormPage
      title={isEdit ? t("inventory.editCategory") : t("inventory.addCategory")}
      backPath="/inventory/categories"
    >
      <div className="space-y-6">
        <div className="space-y-4">
          <TextField label={t("inventory.categoryName")} value={name} onChange={(e) => setName(e.target.value)} required />
          <TextareaField label={t("inventory.categoryDescription")} value={description} onChange={(e) => setDescription(e.target.value)} />
          <SelectField label={t("inventory.parentCategory")} options={parentOptions} value={parentId} onChange={(v) => setParentId(v ? Number(v) : undefined)} placeholder={t("common.none")} />
          <NumberField label={t("inventory.sortOrder")} value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} />
        </div>
        <EntityActionBar onSave={handleSave} saving={createMutation.isPending || updateMutation.isPending} showDelete={false} showArchive={false} showDuplicate={false} />
      </div>
    </EntityFormPage>
  )
}