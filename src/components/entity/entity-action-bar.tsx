import type { ReactNode } from "react"
import { Save, Trash2, Archive, Copy, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface EntityActionBarProps {
  onSave?: () => void
  onDelete?: () => void
  onArchive?: () => void
  onRestore?: () => void
  onDuplicate?: () => void
  saving?: boolean
  deleting?: boolean
  isArchived?: boolean
  showDelete?: boolean
  showArchive?: boolean
  showDuplicate?: boolean
  className?: string
  children?: ReactNode
}

export function EntityActionBar({
  onSave,
  onDelete,
  onArchive,
  onRestore,
  onDuplicate,
  saving,
  deleting,
  isArchived,
  showDelete = true,
  showArchive = true,
  showDuplicate = true,
  className,
  children,
}: EntityActionBarProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 rounded-lg border bg-background p-4",
        className
      )}
    >
      <div className="flex items-center gap-2">
        {onSave && (
          <Button onClick={onSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        )}
        {children}
      </div>
      <div className="flex items-center gap-2">
        {showDuplicate && onDuplicate && (
          <Button variant="outline" size="sm" onClick={onDuplicate}>
            <Copy className="h-4 w-4 mr-2" />
            Duplicar
          </Button>
        )}
        {showArchive && onArchive && (
          <Button variant="outline" size="sm" onClick={onArchive}>
            <Archive className="h-4 w-4 mr-2" />
            {isArchived ? "Desarchivar" : "Archivar"}
          </Button>
        )}
        {isArchived && onRestore && (
          <Button variant="outline" size="sm" onClick={onRestore}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Restaurar
          </Button>
        )}
        {showDelete && onDelete && (
          <Button variant="destructive" size="sm" onClick={onDelete} disabled={deleting}>
            <Trash2 className="h-4 w-4 mr-2" />
            {deleting ? "Eliminando..." : "Eliminar"}
          </Button>
        )}
      </div>
    </div>
  )
}
