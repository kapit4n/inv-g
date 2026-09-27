import { useTranslation } from "react-i18next"
import { SelectField } from "@/components/forms"
import { useBusinessStore } from "@/stores"
import { useBusinessCapabilities } from "@/hooks"

/**
 * Store selector.
 *
 * Renders only when the store can actually be switched, which the backend
 * derives from the number of *active* stores: two or more means multi store mode
 * and a selector; exactly one means the app always resolves to that store and
 * the control would be a dropdown with one option, so it is not shown at all.
 * The list comes from the business context, which already filters to active
 * stores, so a deactivated store cannot be selected from anywhere.
 *
 * This is the single place the logic lives. POS, inventory and stock operations
 * read `currentStoreId` from the business store rather than each deciding for
 * themselves, which is what keeps them from disagreeing with the selector.
 */
export function StoreSelector({ label }: { label?: string }) {
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

  const labelText = label ?? t("business.storeLabel")

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">{labelText}</span>
      <SelectField
        aria-label={t("business.selectStore")}
        className="h-8 w-auto min-w-44 cursor-pointer gap-2 px-2.5 text-xs"
        value={currentStoreId ?? ""}
        onChange={(v) => selectStore(Number(v))}
        placeholder={t("business.selectStorePlaceholder")}
        options={options}
      />
    </div>
  )
}
