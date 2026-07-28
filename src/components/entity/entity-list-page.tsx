import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { EntityHeader } from "./entity-header"
import type { BreadcrumbItem } from "./entity-breadcrumb"

interface EntityListPageProps {
  title: string
  description?: string
  breadcrumb?: BreadcrumbItem[]
  actions?: ReactNode
  children?: ReactNode
  className?: string
}

export function EntityListPage({
  title,
  description,
  breadcrumb,
  actions,
  children,
  className,
}: EntityListPageProps) {
  return (
    <div className={cn("space-y-6", className)}>
      <EntityHeader
        title={title}
        description={description}
        breadcrumb={breadcrumb}
        actions={actions}
      />
      {children}
    </div>
  )
}
