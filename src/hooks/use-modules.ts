import { useMemo } from "react"
import { useLocation } from "react-router-dom"
import { useAppSettingsStore } from "@/stores"

/**
 * Optional business modules that an administrator can switch off from
 * Admin > Settings.
 *
 * The three flags are rows in `application_settings`, seeded by
 * `src-tauri/src/db/seed.rs`. They used to be write-only: the admin page could
 * render and save the toggles but nothing ever read them, so switching a module
 * off appeared to do nothing.
 */
export type ModuleKey = "sales" | "purchasing" | "crm"

/** Settings key that controls each module. */
export const MODULE_SETTING_KEYS: Record<ModuleKey, string> = {
  sales: "enable_sales",
  purchasing: "enable_purchasing",
  crm: "enable_crm",
}

/** First path segment that belongs to each module. */
export const MODULE_PATH_PREFIXES: Record<ModuleKey, string> = {
  sales: "/sales",
  purchasing: "/purchases",
  crm: "/crm",
}

const MODULE_KEYS = Object.keys(MODULE_SETTING_KEYS) as ModuleKey[]

/**
 * A module is enabled unless its flag is explicitly `"false"`.
 *
 * Deliberately fail-open: a database that predates the seed has no row for the
 * flag at all, and hiding whole business modules would be far more damaging
 * than briefly showing one that was switched off. The admin page itself writes
 * the literal strings `"true"` / `"false"`, which is what this reads.
 */
function isEnabled(value: string | undefined): boolean {
  return value?.toLowerCase() !== "false"
}

/**
 * Which module a path belongs to, or `null` when it is module-independent
 * (dashboard, inventory, part finder, reports, admin, ...).
 */
export function moduleForPath(pathname: string): ModuleKey | null {
  return (
    MODULE_KEYS.find((key) => {
      const prefix = MODULE_PATH_PREFIXES[key]
      return pathname === prefix || pathname.startsWith(prefix + "/")
    }) ?? null
  )
}

/**
 * Enabled state for every optional module, plus the module the current path
 * belongs to.
 *
 * Backed by the app-settings store that `App.tsx` hydrates on start-up, so this
 * never issues its own query and always sees the value the admin page writes.
 */
export function useModules() {
  const settings = useAppSettingsStore((s) => s.settings)

  const enabled = useMemo(() => {
    const result = {} as Record<ModuleKey, boolean>
    for (const key of MODULE_KEYS) {
      const row = settings.find((s) => s.key === MODULE_SETTING_KEYS[key])
      result[key] = isEnabled(row?.value)
    }
    return result
  }, [settings])

  return { enabled, isEnabled: (module: ModuleKey) => enabled[module] }
}

/** The module the current path belongs to, or `null` when it is shared. */
export function useCurrentModule(): ModuleKey | null {
  const { pathname } = useLocation()
  return useMemo(() => moduleForPath(pathname), [pathname])
}
