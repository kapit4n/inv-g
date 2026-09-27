import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
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
  const { t } = useTranslation()

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
            {t(saving ? "common.saving" : "common.save")}
          </Button>
        )}
        {children}
      </div>
      <div className="flex items-center gap-2">
        {showDuplicate && onDuplicate && (
          <Button variant="outline" size="sm" onClick={onDuplicate}>
            <Copy className="h-4 w-4 mr-2" />
            {t("common.duplicate")}
          </Button>
        )}
        {showArchive && onArchive && (
          <Button variant="outline" size="sm" onClick={onArchive}>
            <Archive className="h-4 w-4 mr-2" />
            {t(isArchived ? "common.unarchive" : "common.archive")}
          </Button>
        )}
        {isArchived && onRestore && (
          <Button variant="outline" size="sm" onClick={onRestore}>
            <RotateCcw className="h-4 w-4 mr-2" />
            {t("common.restore")}
          </Button>
        )}
        {showDelete && onDelete && (
          <Button variant="destructive" size="sm" onClick={onDelete} disabled={deleting}>
            <Trash2 className="h-4 w-4 mr-2" />
            {t(deleting ? "common.deleting" : "common.delete")}
          </Button>
        )}
      </div>
    </div>
  )
}
