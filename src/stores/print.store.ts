import { create } from "zustand"
import type { PrintDocumentModel, PrintRequest } from "@/lib/print/types"

interface PrintStore {
  request: PrintRequest | null
  open: (document: PrintDocumentModel, opts?: { onPrinted?: () => void }) => void
  close: () => void
}

export const usePrintStore = create<PrintStore>()((set) => ({
  request: null,

  open: (document, opts) =>
    set({ request: { document, onPrinted: opts?.onPrinted } }),

  close: () => set({ request: null }),
}))
