import type { AdminAppSetting } from "@/types"

export interface SettingValidation {
  min?: number
  max?: number
  minLength?: number
  maxLength?: number
}

export function parseSettingOptions(raw?: string): string[] {
  if (!raw) return []
  const trimmed = raw.trim()
  if (!trimmed) return []
  try {
    const parsed = JSON.parse(trimmed) as unknown
    if (Array.isArray(parsed)) {
      return parsed.filter((v): v is string => typeof v === "string")
    }
    if (parsed && typeof parsed === "object") {
      const opts = (parsed as Record<string, unknown>).options
      if (Array.isArray(opts)) {
        return opts.filter((v): v is string => typeof v === "string")
      }
    }
  } catch {
    // fall through to comma-separated parsing
  }
  return trimmed
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean)
}

export function parseSettingValidation(raw?: string): SettingValidation {
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    return {
      min: typeof parsed.min === "number" ? parsed.min : undefined,
      max: typeof parsed.max === "number" ? parsed.max : undefined,
      minLength: typeof parsed.minLength === "number" ? parsed.minLength : undefined,
      maxLength: typeof parsed.maxLength === "number" ? parsed.maxLength : undefined,
    }
  } catch {
    return {}
  }
}

export function validateSettingValue(setting: AdminAppSetting, value: string): string | null {
  const trimmed = value.trim()
  const validation = parseSettingValidation(setting.validation)

  if (setting.settingType === "number") {
    if (trimmed === "") return "required"
    const num = Number(trimmed)
    if (Number.isNaN(num)) return "notNumber"
    if (validation.min !== undefined && num < validation.min) return "min"
    if (validation.max !== undefined && num > validation.max) return "max"
  }

  if (setting.settingType === "boolean") {
    if (trimmed !== "true" && trimmed !== "false") return "notBoolean"
  }

  const options = parseSettingOptions(setting.options)
  if (options.length > 0 && trimmed !== "" && !options.includes(trimmed)) return "notAllowed"

  if (validation.minLength !== undefined && value.length < validation.minLength) return "minLength"
  if (validation.maxLength !== undefined && value.length > validation.maxLength) return "maxLength"

  return null
}

/**
 * The codes the backend prefixes its validation failures with. These are the
 * same strings `validateSettingValue` returns above, and they are the ones with
 * translations under `admin.settings.errors.*`.
 */
export const SETTING_ERROR_CODES = [
  "min",
  "max",
  "minLength",
  "maxLength",
  "notAllowed",
  "notNumber",
  "notBoolean",
  "required",
] as const

export type SettingErrorCode = (typeof SETTING_ERROR_CODES)[number]

/** Which interpolation key each code needs. */
const CODE_PARAM: Partial<Record<SettingErrorCode, string>> = {
  min: "min",
  max: "max",
  minLength: "min",
  maxLength: "max",
}

/**
 * `<code>:<prose>`, or `<code>:<bound>:<prose>` for the four codes that carry a
 * bound -- see `coded()` in `src-tauri/src/commands/admin/settings.rs`. The prose
 * is retained after the colon so an older build, or a log line, still reads as
 * English.
 */
const CODED_ERROR = /^([a-zA-Z]+):([\s\S]+)$/

/** Rewrites a coded error into the key and params to translate it with. */
export function parseSettingError(
  message: string
): { code: SettingErrorCode; params?: Record<string, unknown>; prose: string } | null {
  const match = CODED_ERROR.exec(message.trim())
  if (!match) return null

  const code = match[1] ?? ""
  if (!SETTING_ERROR_CODES.includes(code as SettingErrorCode)) return null

  const typed = code as SettingErrorCode
  const paramName = CODE_PARAM[typed]
  const rest = match[2] ?? ""

  // Only the bounded codes carry a param, and only the segment before the first
  // colon is one. The prose itself contains colons -- "...allowed options: USD,
  // MXN" -- so a naive split would swallow the sentence into the bound.
  if (paramName) {
    const sep = rest.indexOf(":")
    if (sep > 0) {
      const bound = rest.slice(0, sep)
      if (bound !== "" && !Number.isNaN(Number(bound))) {
        return { code: typed, params: { [paramName]: Number(bound) }, prose: rest.slice(sep + 1) }
      }
    }
  }

  return { code: typed, prose: rest }
}

/**
 * Turn a rejected setting write into a translated sentence.
 *
 * Commands report failures as plain strings, so the code prefix is the only
 * machine-readable thing available. Anything without one -- a permission
 * refusal, a database error, a message from a future command -- is returned
 * untouched rather than being replaced by a generic "something went wrong",
 * because those messages are the ones worth reading verbatim.
 */
export function translateSettingError(
  message: string,
  t: (key: string, params?: Record<string, unknown>) => string
): string {
  const parsed = parseSettingError(message)
  if (!parsed) return message

  const key = `admin.settings.errors.${parsed.code}`
  // A key with no translation resolves to itself; fall back to the prose then,
  // which is still better than printing `admin.settings.errors.notAllowed`.
  const translated = t(key, parsed.params)
  return translated === key || translated === "" ? parsed.prose : translated
}
