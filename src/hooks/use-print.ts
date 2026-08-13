import { useCallback } from "react"
import { usePrintStore } from "@/stores"
import type { PrintDocumentModel } from "@/lib/print/types"

export function usePrint() {
  const open = usePrintStore((s) => s.open)

  return useCallback(
    (document: PrintDocumentModel, opts?: { onPrinted?: () => void }) => {
      open(document, opts)
    },
    [open],
  )
}
