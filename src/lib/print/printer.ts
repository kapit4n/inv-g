import type { PrinterSetting } from "@/types"
import type { PrintConfig, PrintTemplateKind } from "./types"

export function sortPrinters(printers: PrinterSetting[]): PrinterSetting[] {
  return [...printers].sort((a, b) => {
    if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1
    return a.name.localeCompare(b.name)
  })
}

export function activePrinters(printers: PrinterSetting[]): PrinterSetting[] {
  return printers.filter((p) => p.isActive)
}

const PRINTER_TYPE_FOR_KIND: Partial<Record<PrintTemplateKind, string>> = {
  receipt: "receipt",
  invoice: "invoice",
  label: "label",
}

function nameMatchedPrinter(printers: PrinterSetting[], name?: string): PrinterSetting | undefined {
  if (!name) return undefined
  return printers.find((p) => p.name === name)
}

export function resolveDefaultPrinter(
  printers: PrinterSetting[],
  config: PrintConfig,
  kind: PrintTemplateKind,
): PrinterSetting | undefined {
  const available = activePrinters(printers)
  if (available.length === 0) return undefined

  const configuredKey = PRINTER_TYPE_FOR_KIND[kind]
  const configuredName = configuredKey === "receipt"
    ? config.receiptPrinter
    : configuredKey === "invoice"
      ? config.invoicePrinter
      : configuredKey === "label"
        ? config.labelPrinter
        : config.defaultPrinter

  const byName = nameMatchedPrinter(available, configuredName)
  if (byName) return byName
  const byDefaultName = nameMatchedPrinter(available, config.defaultPrinter)
  if (byDefaultName) return byDefaultName

  return available.find((p) => p.isDefault) ?? available[0]
}

export function printerLabel(printer: PrinterSetting): string {
  const parts = [printer.name]
  if (printer.paperSize) parts.push(`(${printer.paperSize})`)
  return parts.join(" ")
}
