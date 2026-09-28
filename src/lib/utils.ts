import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { getActiveCurrency } from "@/lib/currency"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats an amount in the configured system currency.
 *
 * `currencyDisplay: "narrowSymbol"` is required, not cosmetic: with the default
 * `"symbol"`, Intl renders BOB as the literal code — "BOB 1,234.50" in an English
 * locale and only "Bs" in es-BO. narrowSymbol gives "Bs" for the configured
 * currency's own locale and in every other locale too, so the symbol the user
 * picked in Settings is the symbol they see everywhere.
 *
 * This reads the currency from `lib/currency` rather than taking a parameter, so
 * every existing call site follows the configuration without being changed. See
 * that module for why it is a module-level value.
 */
export function formatCurrency(amount: number): string {
  const currency = getActiveCurrency()
  return new Intl.NumberFormat(currency.locale, {
    style: "currency",
    currency: currency.code,
    currencyDisplay: "narrowSymbol",
  }).format(amount)
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-US").format(num)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date))
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date))
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.slice(0, length) + "..."
}

export function generateId(): string {
  return crypto.randomUUID()
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
