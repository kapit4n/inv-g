import type {
  DailyCloseout,
  Quote,
  QuoteItem,
  Sale,
  SaleItem,
  SalePayment,
} from "@/types"
import { formatCurrency, formatDate, formatDateTime } from "./format"
import { paperSizeForKind } from "./config"
import type {
  PrintDocumentModel,
  PrintLineItem,
  PrintPayment,
  PrintTotalsRow,
  PrintConfig,
} from "./types"

export interface ReceiptLabels {
  title: string
  subtotal: string
  tax: string
  discount: string
  total: string
  customer: string
  methods: Record<string, string>
}

export interface QuoteLabels {
  title: string
  subtotal: string
  tax: string
  discount: string
  total: string
  customer: string
  validUntil: string
}

export interface CloseoutLabels {
  title: string
  totalSales: string
  totalRevenue: string
  totalTax: string
  totalDiscount: string
  cash: string
  card: string
  transfer: string
  refunds: string
  netRevenue: string
}

function toLineItems(items: Pick<SaleItem, "quantity" | "unitPrice" | "discount" | "total" | "productName" | "productId" | "productSku">[]): PrintLineItem[] {
  return items.map((item) => ({
    name: item.productName || `#${item.productId}`,
    sku: item.productSku,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    discount: item.discount,
    total: item.total,
  }))
}

function toPayments(payments: SalePayment[], methodLabels: Record<string, string>): PrintPayment[] {
  return payments.map((p) => ({
    method: methodLabels[p.method] || p.method,
    amount: p.amount,
    change: p.changeAmount,
  }))
}

function totalsFromSale(
  sale: Sale,
  config: PrintConfig,
  labels: Pick<ReceiptLabels, "subtotal" | "tax" | "discount" | "total">,
): PrintTotalsRow[] {
  const rows: PrintTotalsRow[] = [
    { label: labels.subtotal, value: sale.subtotal },
  ]
  if (config.showTaxBreakdown || sale.taxAmount > 0) {
    rows.push({ label: labels.tax, value: sale.taxAmount })
  }
  if (sale.discountAmount > 0) {
    rows.push({ label: labels.discount, value: -sale.discountAmount })
  }
  rows.push({ label: labels.total, value: sale.total, bold: true })
  return rows
}

export function buildSaleReceiptModel(
  sale: Sale,
  items: SaleItem[],
  payments: SalePayment[],
  config: PrintConfig,
  labels: ReceiptLabels,
): PrintDocumentModel {
  const metaLines = config.showCustomerInfo && sale.customerName
    ? [{ label: labels.customer, value: sale.customerName }]
    : []

  return {
    id: `receipt-${sale.id}`,
    kind: "receipt",
    paperSize: config.paperSizeDefault,
    title: labels.title,
    documentNumber: sale.saleNumber,
    secondaryNumber: sale.receiptNumber,
    date: formatDateTime(sale.createdAt),
    customerName: sale.customerName,
    metaLines,
    lineItems: toLineItems(items),
    totals: totalsFromSale(sale, config, labels),
    payments: toPayments(payments, labels.methods),
    footer: config.footer,
    store: { ...config.store, currency: config.currency },
  }
}

export function buildQuoteDocumentModel(
  quote: Quote,
  items: QuoteItem[],
  config: PrintConfig,
  labels: QuoteLabels,
): PrintDocumentModel {
  const metaLines: { label: string; value: string }[] = []
  if (config.showCustomerInfo && quote.customerName) {
    metaLines.push({ label: labels.customer, value: quote.customerName })
  }
  if (quote.validUntil) {
    metaLines.push({ label: labels.validUntil, value: formatDate(quote.validUntil) })
  }

  const totals: PrintTotalsRow[] = [
    { label: labels.subtotal, value: quote.subtotal },
  ]
  if (config.showTaxBreakdown || quote.taxAmount > 0) {
    totals.push({ label: labels.tax, value: quote.taxAmount })
  }
  if (quote.discountAmount > 0) {
    totals.push({ label: labels.discount, value: -quote.discountAmount })
  }
  totals.push({ label: labels.total, value: quote.total, bold: true })

  const notes = [quote.notes, quote.termsConditions].filter(Boolean).join("\n\n")

  return {
    id: `quote-${quote.id}`,
    kind: "quote",
    paperSize: paperSizeForKind(config, "quote"),
    title: labels.title,
    documentNumber: quote.quoteNumber,
    date: formatDate(quote.createdAt),
    customerName: quote.customerName,
    metaLines,
    lineItems: toLineItems(items),
    totals,
    notes,
    store: { ...config.store, currency: config.currency },
  }
}

export function buildCloseoutDocumentModel(
  closeout: DailyCloseout,
  config: PrintConfig,
  labels: CloseoutLabels,
): PrintDocumentModel {
  const totals: PrintTotalsRow[] = [
    { label: labels.totalSales, value: closeout.totalSales, format: "number" },
    { label: labels.totalRevenue, value: closeout.totalRevenue },
    { label: labels.totalTax, value: closeout.totalTax },
    { label: labels.totalDiscount, value: closeout.totalDiscount },
    { label: labels.cash, value: closeout.cashTotal },
    { label: labels.card, value: closeout.cardTotal },
    { label: labels.transfer, value: closeout.transferTotal },
  ]
  if (closeout.refundedTotal > 0) {
    totals.push({ label: labels.refunds, value: -closeout.refundedTotal })
  }
  totals.push({ label: labels.netRevenue, value: closeout.netRevenue, bold: true })

  return {
    id: `closeout-${closeout.date || new Date().toISOString().slice(0, 10)}`,
    kind: "report",
    paperSize: config.paperSizeDefault,
    title: labels.title,
    date: formatDate(closeout.date) || formatDate(new Date().toISOString()),
    metaLines: [],
    lineItems: [],
    totals,
    store: { ...config.store, currency: config.currency },
  }
}

export function formatTotalValue(
  row: Pick<PrintTotalsRow, "value" | "format">,
  currency: string,
): string {
  return row.format === "number" ? String(row.value) : formatCurrency(row.value, currency)
}
