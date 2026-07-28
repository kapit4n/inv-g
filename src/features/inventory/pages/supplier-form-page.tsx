import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { EntityFormPage } from "@/components/entity"
import { TextField, TextareaField } from "@/components/forms"
import { EntityActionBar } from "@/components/entity"
import { getSuppliers, createSupplier, updateSupplier } from "@/lib/tauri"
import { useNotification } from "@/hooks/use-notification"

export function SupplierFormPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const notification = useNotification()
  const isEdit = !!id

  const { data: suppliers = [] } = useQuery({
    queryKey: ["inventory-suppliers"],
    queryFn: getSuppliers,
  })

  const existing = isEdit ? suppliers.find((s) => s.id === Number(id)) : null

  const [companyName, setCompanyName] = useState("")
  const [contactPerson, setContactPerson] = useState("")
  const [phone, setPhone] = useState("")
  const [mobile, setMobile] = useState("")
  const [email, setEmail] = useState("")
  const [website, setWebsite] = useState("")
  const [taxNumber, setTaxNumber] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [stateProvince, setStateProvince] = useState("")
  const [country, setCountry] = useState("")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    if (existing) {
      setCompanyName(existing.companyName)
      setContactPerson(existing.contactPerson || "")
      setPhone(existing.phone || "")
      setMobile(existing.mobile || "")
      setEmail(existing.email || "")
      setWebsite(existing.website || "")
      setTaxNumber(existing.taxNumber || "")
      setAddress(existing.address || "")
      setCity(existing.city || "")
      setStateProvince(existing.state || "")
      setCountry(existing.country || "")
      setNotes(existing.notes || "")
    }
  }, [existing])

  const createMutation = useMutation({
    mutationFn: createSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-suppliers"] })
      notification.success(t("common.success"), t("inventory.supplierCreated"))
      navigate("/inventory/suppliers")
    },
  })

  const updateMutation = useMutation({
    mutationFn: updateSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-suppliers"] })
      notification.success(t("common.success"), t("inventory.supplierUpdated"))
      navigate("/inventory/suppliers")
    },
  })

  const handleSave = () => {
    const data = {
      companyName, contactPerson: contactPerson || undefined, phone: phone || undefined,
      mobile: mobile || undefined, email: email || undefined, website: website || undefined,
      taxNumber: taxNumber || undefined, address: address || undefined, city: city || undefined,
      stateProvince: stateProvince || undefined, country: country || undefined,
    }
    if (isEdit && existing) {
      updateMutation.mutate({ id: existing.id, ...data })
    } else {
      createMutation.mutate(data)
    }
  }

  return (
    <EntityFormPage
      title={isEdit ? t("inventory.editSupplier") : t("inventory.addSupplier")}
      backPath="/inventory/suppliers"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField label={t("inventory.companyName")} value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
          <TextField label={t("inventory.contactPerson")} value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
          <TextField label={t("inventory.phone")} value={phone} onChange={(e) => setPhone(e.target.value)} />
          <TextField label={t("inventory.mobile")} value={mobile} onChange={(e) => setMobile(e.target.value)} />
          <TextField label={t("inventory.email")} value={email} onChange={(e) => setEmail(e.target.value)} />
          <TextField label={t("inventory.website")} value={website} onChange={(e) => setWebsite(e.target.value)} />
          <TextField label={t("inventory.taxNumber")} value={taxNumber} onChange={(e) => setTaxNumber(e.target.value)} />
        </div>
        <TextareaField label={t("inventory.address")} value={address} onChange={(e) => setAddress(e.target.value)} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <TextField label={t("inventory.city")} value={city} onChange={(e) => setCity(e.target.value)} />
          <TextField label={t("inventory.state")} value={stateProvince} onChange={(e) => setStateProvince(e.target.value)} />
          <TextField label={t("inventory.country")} value={country} onChange={(e) => setCountry(e.target.value)} />
        </div>
        <TextareaField label={t("inventory.notes")} value={notes} onChange={(e) => setNotes(e.target.value)} />
        <EntityActionBar onSave={handleSave} saving={createMutation.isPending || updateMutation.isPending} showDelete={false} showArchive={false} showDuplicate={false} />
      </div>
    </EntityFormPage>
  )
}