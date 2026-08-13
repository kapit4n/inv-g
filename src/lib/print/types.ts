export type PrintTemplateKind =
  | "receipt"
  | "invoice"
  | "quote"
  | "purchase-order"
  | "customer-statement"
  | "inventory-report"
  | "label"
  | "report"

export type PrintPaperSize = "80mm" | "58mm" | "A4" | "letter"

export interface PrintLineItem {
  name: string
  sku?: string
  quantity: number
  unitPrice: number
  discount: number
  total: number
}

export interface PrintTotalsRow {
  label: string
  value: number
  format?: "currency" | "number"
  bold?: boolean
}

export interface PrintPayment {
  method: string
  amount: number
  change: number
}

export interface PrintMetaLine {
  label: string
  value: string
}

export interface PrintStoreInfo {
  name?: string
  address?: string
  phone?: string
  taxId?: string
  currency?: string
}

export interface PrintDocumentModel {
  id: string
  kind: PrintTemplateKind
  paperSize: string
  title: string
  documentNumber?: string
  secondaryNumber?: string
  date?: string
  customerName?: string
  metaLines: PrintMetaLine[]
  lineItems: PrintLineItem[]
  totals: PrintTotalsRow[]
  payments?: PrintPayment[]
  footer?: string
  notes?: string
  store: PrintStoreInfo
}

export interface PrintConfig {
  store: PrintStoreInfo
  currency: string
  footer?: string
  showTaxBreakdown: boolean
  showBarcode: boolean
  showCustomerInfo: boolean
  defaultPrinter: string
  receiptPrinter: string
  invoicePrinter: string
  labelPrinter: string
  paperSizeDefault: string
}

export interface PrintRequest {
  document: PrintDocumentModel
  onPrinted?: () => void
}
