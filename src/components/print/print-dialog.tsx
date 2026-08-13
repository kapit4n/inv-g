import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { Printer, Loader2, AlertTriangle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { getPrinters } from "@/lib/tauri"
import { useNotification } from "@/hooks/use-notification"
import { usePrintConfig } from "@/hooks/use-print-config"
import { PrintTemplate } from "./templates"
import { activePrinters, resolveDefaultPrinter, sortPrinters } from "@/lib/print"
import type { PrintDocumentModel } from "@/lib/print/types"

interface PrintDialogProps {
  document: PrintDocumentModel
  onPrinted?: () => void
  onClose: () => void
}

export function PrintDialog({ document, onPrinted, onClose }: PrintDialogProps) {
  const { t } = useTranslation()
  const notification = useNotification()
  const config = usePrintConfig()

  const { data: printers = [], isLoading } = useQuery({
    queryKey: ["printers"],
    queryFn: () => getPrinters(),
  })

  const available = useMemo(() => sortPrinters(activePrinters(printers)), [printers])
  const defaultPrinter = useMemo(
    () => resolveDefaultPrinter(printers, config, document.kind),
    [printers, config, document.kind],
  )

  const [printerId, setPrinterId] = useState("")
  const [isPrinting, setIsPrinting] = useState(false)

  useEffect(() => {
    if (!printerId && defaultPrinter) {
      setPrinterId(String(defaultPrinter.id))
    }
  }, [printerId, defaultPrinter])

  const selectedPrinter = printers.find((p) => String(p.id) === printerId)
  const previewDocument = useMemo(
    () => selectedPrinter?.paperSize ? { ...document, paperSize: selectedPrinter.paperSize } : document,
    [document, selectedPrinter?.paperSize],
  )

  const handlePrint = () => {
    if (isPrinting) return
    setIsPrinting(true)
    try {
      window.print()
      try {
        onPrinted?.()
      } catch {
        // Receipt-marking is best-effort; the document was still printed.
      }
      notification.success(t("common.success"), t("print.printed"))
      onClose()
    } catch {
      notification.error(t("common.error"), t("print.printError"))
    } finally {
      setIsPrinting(false)
    }
  }

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-preview-root, #print-preview-root * { visibility: visible; }
          #print-preview-root { position: absolute; left: 0; top: 0; margin: 0; }
        }
      `}</style>

      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="w-[90vw] max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="h-4 w-4" />
              {t("print.title")} — {document.title}
            </DialogTitle>
            <DialogDescription>{document.documentNumber || document.id}</DialogDescription>
          </DialogHeader>

          <div className="overflow-auto max-h-[70vh] rounded-md border bg-muted/40 p-6">
            <div className="flex justify-center shadow-sm">
              <div id="print-preview-root">
                <PrintTemplate document={previewDocument} />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>{t("print.printer")}</Label>
              {isLoading ? (
                <div className="flex h-10 items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("common.loading")}
                </div>
              ) : available.length === 0 ? (
                <div className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning/5 p-3 text-sm">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                  <div>
                    <p>{t("print.noPrinters")}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{t("print.noPrintersHint")}</p>
                    <Link to="/admin/printers" className="mt-1 inline-block text-xs underline" onClick={onClose}>
                      {t("print.configurePrinters")}
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={printerId}
                    onChange={(e) => setPrinterId(e.target.value)}
                    data-testid="print-printer-select"
                  >
                    {available.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.paperSize})
                      </option>
                    ))}
                  </select>
                  {selectedPrinter && (
                    <p className="text-xs text-muted-foreground">
                      {t("print.paperSize")}: {selectedPrinter.paperSize} · {t("print.copies")}: {selectedPrinter.copies} · {selectedPrinter.printerType}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={onClose}>{t("common.cancel")}</Button>
            <Button onClick={handlePrint} disabled={isPrinting}>
              <Printer className="h-4 w-4 mr-1" />
              {isPrinting ? t("common.processing") : t("common.print")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
