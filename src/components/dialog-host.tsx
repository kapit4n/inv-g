import { AlertTriangle, Info, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useDialogStore } from "@/stores"

const iconMap = {
  confirm: Info,
  delete: Trash2,
  warning: AlertTriangle,
  info: Info,
  generic: Info,
}

const iconColorMap = {
  confirm: "text-blue-500",
  delete: "text-red-500",
  warning: "text-yellow-500",
  info: "text-blue-500",
  generic: "text-muted-foreground",
}

export function DialogHost() {
  const { config, close } = useDialogStore()

  if (!config.open) return null

  const Icon = iconMap[config.type]

  const handleConfirm = () => {
    config.onConfirm?.()
    close()
  }

  const handleCancel = () => {
    config.onCancel?.()
    close()
  }

  const isDestructive = config.type === "delete"

  return (
    <Dialog open={config.open} onOpenChange={(open) => !open && close()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="flex flex-row items-start gap-4">
          <div className={`rounded-full p-2 bg-background border ${iconColorMap[config.type]}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <DialogTitle>{config.title}</DialogTitle>
            {config.description && (
              <DialogDescription className="mt-1">{config.description}</DialogDescription>
            )}
          </div>
        </DialogHeader>

        {config.children}

        <DialogFooter className="gap-2 sm:gap-0">
          {config.type !== "info" && (
            <Button variant="outline" onClick={handleCancel}>
              {config.cancelLabel ?? "Cancelar"}
            </Button>
          )}
          {config.type !== "info" && (
            <Button
              variant={isDestructive ? "destructive" : "default"}
              onClick={handleConfirm}
            >
              {config.confirmLabel ?? "Confirmar"}
            </Button>
          )}
          {config.type === "info" && (
            <Button onClick={handleCancel}>{config.confirmLabel ?? "Cerrar"}</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
