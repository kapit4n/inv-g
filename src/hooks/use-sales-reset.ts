import { useMemo } from "react"
import { useAppSettingsStore } from "@/stores"

/** Settings key that shows or hides the "Reset all sales" admin tool. */
export const SALES_RESET_SETTING_KEY = "enable_sales_reset"

/**
 * Whether the "Reset all sales" admin tool is enabled.
 *
 * Fail-closed by design: unlike the optional business modules (which fail open
 * so whole sections don't vanish), this gates a destructive action, so it only
 * becomes visible when an administrator explicitly switches on the flag in
 * Admin > Settings. The backend enforces the same rule independently.
 */
export function useSalesResetEnabled(): boolean {
  const settings = useAppSettingsStore((s) => s.settings)

  return useMemo(() => {
    const row = settings.find((s) => s.key === SALES_RESET_SETTING_KEY)
    return row?.value?.toLowerCase() === "true"
  }, [settings])
}