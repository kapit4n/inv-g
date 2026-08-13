import { usePrintStore } from "@/stores"
import { PrintDialog } from "./print-dialog"

export function PrintHost() {
  const request = usePrintStore((s) => s.request)
  const close = usePrintStore((s) => s.close)

  if (!request) return null

  return (
    <PrintDialog
      document={request.document}
      onPrinted={request.onPrinted}
      onClose={close}
    />
  )
}
