import { useTranslation } from "react-i18next"
import { SelectField } from "@/components/forms"
import { useBusinessStore } from "@/stores"
import { useBusinessCapabilities } from "@/hooks"

/**
 * Store selector shown only when the selected store can be switched
 * (multi-store profile). In single-store mode no selector is rendered; the
 * backend always resolves to the only store.
 */
export function StoreSelector() {
  const { t } = useTranslation()
  const capabilities = useBusinessCapabilities()
  const context = useBusinessStore((s) => s.context)
  const currentStoreId = useBusinessStore((s) => s.currentStoreId)
  const selectStore = useBusinessStore((s) => s.selectStore)

  if (!capabilities.storeSelection || !context || context.stores.length === 0) {
    return null
  }

  const options = context.stores.map((store) => ({
    label: `${store.name} (${store.code})`,
    value: store.id,
  }))

  return (
    <SelectField
      aria-label={t("business.selectStore")}
      className="h-8 w-auto min-w-44 cursor-pointer gap-2 px-2.5 text-xs"
      value={currentStoreId ?? ""}
      onChange={(v) => selectStore(Number(v))}
      placeholder={t("business.selectStorePlaceholder")}
      options={options}
    />
  )
}