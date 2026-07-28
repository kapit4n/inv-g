import { useDialogStore } from "@/stores"

export function useDialog() {
  const store = useDialogStore()

  return {
    config: store.config,
    confirm: store.openConfirm,
    delete: store.openDelete,
    warning: store.openWarning,
    info: store.openInfo,
    generic: store.openGeneric,
    close: store.close,
  }
}
