import { useMemo } from "react"
import { useAppSettingsStore } from "@/stores"
import { buildPrintConfig } from "@/lib/print/config"
import type { PrintConfig } from "@/lib/print/types"

export function usePrintConfig(): PrintConfig {
  const settings = useAppSettingsStore((s) => s.settings)
  return useMemo(() => buildPrintConfig(settings), [settings])
}
