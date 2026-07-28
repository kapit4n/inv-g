import { ConfirmDialog } from "./confirm-dialog"

interface DeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  entityName?: string
  loading?: boolean
}

export function DeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  entityName = "elemento",
  loading,
}: DeleteDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Eliminar ${entityName}`}
      description={`¿Estás seguro de eliminar este ${entityName}? Esta acción no se puede deshacer.`}
      confirmLabel="Eliminar"
      cancelLabel="Cancelar"
      variant="destructive"
      onConfirm={onConfirm}
      loading={loading}
    />
  )
}

interface ArchiveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  entityName?: string
  loading?: boolean
}

export function ArchiveDialog({
  open,
  onOpenChange,
  onConfirm,
  entityName = "elemento",
  loading,
}: ArchiveDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Archivar ${entityName}`}
      description={`¿Estás seguro de archivar este ${entityName}? Puedes restaurarlo después.`}
      confirmLabel="Archivar"
      cancelLabel="Cancelar"
      onConfirm={onConfirm}
      loading={loading}
    />
  )
}

interface RestoreDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  entityName?: string
  loading?: boolean
}

export function RestoreDialog({
  open,
  onOpenChange,
  onConfirm,
  entityName = "elemento",
  loading,
}: RestoreDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Restaurar ${entityName}`}
      description={`¿Estás seguro de restaurar este ${entityName}?`}
      confirmLabel="Restaurar"
      cancelLabel="Cancelar"
      onConfirm={onConfirm}
      loading={loading}
    />
  )
}
