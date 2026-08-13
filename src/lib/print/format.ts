export function formatCurrency(value: number, currency = "USD", locale = "en-US"): string {
  if (value == null || Number.isNaN(value)) return "0.00"
  return value.toLocaleString(locale, { style: "currency", currency })
}

export function formatNumber(value: number, locale = "en-US"): string {
  if (value == null || Number.isNaN(value)) return "0"
  return value.toLocaleString(locale, { maximumFractionDigits: 2 })
}

export function formatDate(value?: string, locale = "en-US"): string {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return date.toLocaleDateString(locale)
}

export function formatDateTime(value?: string, locale = "en-US"): string {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return date.toLocaleString(locale)
}
