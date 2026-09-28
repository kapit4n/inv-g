import type { TFunction } from "i18next"

const BUSINESS_ERROR_KEYS: Record<string, string> = {
  ERROR_MULTI_STORE_REQUIRED: "business.errors.multiStoreRequired",
  ERROR_STORE_REQUIRED: "business.errors.storeRequired",
  ERROR_STORE_NOT_FOUND: "business.errors.storeNotFound",
  ERROR_TRANSFER_SAME_STORE: "business.errors.transferSameStore",
  ERROR_DEV_ONLY: "business.errors.devOnly",
  ERROR_LAST_ACTIVE_STORE: "settings.stores.lastActiveStore",
  ERROR_STORE_HAS_DEPENDENCIES: "settings.stores.hasDependencies",
}

/**
 * Maps backend stable error codes to i18n keys; passes unknown messages through.
 *
 * `vars` is needed for the keys that interpolate — `hasDependencies` names the
 * dependent record types, and without a value i18next would render the
 * placeholder literally.
 */
export function businessErrorMessage(t: TFunction, error: unknown, vars?: Record<string, unknown>): string {
  const message = typeof error === "string" ? error : error instanceof Error ? error.message : String(error)
  const key = BUSINESS_ERROR_KEYS[message]
  return key ? t(key, vars) : message
}