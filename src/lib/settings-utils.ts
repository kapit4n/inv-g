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
