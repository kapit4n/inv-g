import { create } from "zustand"
import type { DialogConfig } from "@/types"

interface DialogStore {
  config: DialogConfig
  openConfirm: (config: Omit<DialogConfig, "open" | "type">) => void
  openDelete: (config: Omit<DialogConfig, "open" | "type">) => void
  openWarning: (config: Omit<DialogConfig, "open" | "type">) => void
  openInfo: (config: Omit<DialogConfig, "open" | "type">) => void
  openGeneric: (config: Omit<DialogConfig, "open" | "type">) => void
  close: () => void
}

const defaultConfig: DialogConfig = {
  open: false,
  title: "",
  type: "info",
}

export const useDialogStore = create<DialogStore>()((set) => ({
  config: defaultConfig,

  openConfirm: (config) =>
    set({ config: { ...config, open: true, type: "confirm" } }),

  openDelete: (config) =>
    set({ config: { ...config, open: true, type: "delete" } }),

  openWarning: (config) =>
    set({ config: { ...config, open: true, type: "warning" } }),

  openInfo: (config) =>
    set({ config: { ...config, open: true, type: "info" } }),

  openGeneric: (config) =>
    set({ config: { ...config, open: true, type: "generic" } }),

  close: () => set({ config: defaultConfig }),
}))
