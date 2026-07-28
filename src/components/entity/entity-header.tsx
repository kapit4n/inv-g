import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { EntityBreadcrumb } from "./entity-breadcrumb"
import type { BreadcrumbItem } from "./entity-breadcrumb"

interface EntityHeaderProps {
  title: string
  description?: string
  breadcrumb?: BreadcrumbItem[]
  actions?: ReactNode
  className?: string
}

export function EntityHeader({
  title,
  description,
  breadcrumb,
  actions,
  className,
}: EntityHeaderProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {breadcrumb && <EntityBreadcrumb items={breadcrumb} />}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </div>
  )
}
