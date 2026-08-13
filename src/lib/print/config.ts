import type { AdminAppSetting } from "@/types"
import type { PrintConfig, PrintStoreInfo, PrintTemplateKind } from "./types"

export const PRINT_SETTING_KEYS = [
  "store_name",
  "business_name",
  "tax_id",
  "address_line1",
  "address_line2",
  "city",
  "state",
  "postal_code",
  "phone",
  "email",
  "currency",
  "receipt_footer",
  "receipt_show_tax_breakdown",
  "receipt_show_barcode",
  "receipt_show_customer_info",
  "default_printer",
  "receipt_printer",
  "invoice_printer",
  "label_printer",
  "paper_size_default",
] as const

function settingValue(settings: AdminAppSetting[], key: string): string | undefined {
  return settings.find((s) => s.key === key)?.value
}

function isTrue(value?: string): boolean {
  return value === "true" || value === "1"
}

export function buildPrintConfig(settings: AdminAppSetting[]): PrintConfig {
  const store: PrintStoreInfo = {
    name: settingValue(settings, "business_name") || settingValue(settings, "store_name"),
    address: [
      settingValue(settings, "address_line1"),
      settingValue(settings, "address_line2"),
    ].filter(Boolean).join(", "),
    phone: settingValue(settings, "phone"),
    taxId: settingValue(settings, "tax_id"),
  }

  return {
    store,
    currency: settingValue(settings, "currency") || "USD",
    footer: settingValue(settings, "receipt_footer"),
    showTaxBreakdown: isTrue(settingValue(settings, "receipt_show_tax_breakdown")),
    showBarcode: isTrue(settingValue(settings, "receipt_show_barcode")),
    showCustomerInfo: isTrue(settingValue(settings, "receipt_show_customer_info")),
    defaultPrinter: settingValue(settings, "default_printer") || "",
    receiptPrinter: settingValue(settings, "receipt_printer") || "",
    invoicePrinter: settingValue(settings, "invoice_printer") || "",
    labelPrinter: settingValue(settings, "label_printer") || "",
    paperSizeDefault: settingValue(settings, "paper_size_default") || "80mm",
  }
}

function normalizePaperSize(paperSize: string): string {
  if (!paperSize) return ""
  return paperSize.toUpperCase() === "A4" ? "A4" : paperSize.toLowerCase()
}

export function isThermalPaper(paperSize: string): boolean {
  const size = normalizePaperSize(paperSize)
  return size === "80mm" || size === "58mm"
}

export function paperWidth(paperSize: string): string {
  switch (normalizePaperSize(paperSize)) {
    case "58mm":
      return "58mm"
    case "80mm":
      return "80mm"
    case "A4":
      return "210mm"
    case "letter":
      return "215.9mm"
    default:
      return "80mm"
  }
}

const DEFAULT_PAPER_SIZE: Record<PrintTemplateKind, string> = {
  receipt: "80mm",
  "purchase-order": "letter",
  "customer-statement": "letter",
  "inventory-report": "letter",
  invoice: "letter",
  quote: "letter",
  label: "58mm",
  report: "letter",
}

export function paperSizeForKind(config: PrintConfig, kind: PrintTemplateKind): string {
  if (isThermalPaper(config.paperSizeDefault)) return config.paperSizeDefault
  return DEFAULT_PAPER_SIZE[kind]
}
