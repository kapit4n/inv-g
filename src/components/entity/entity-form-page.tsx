import type { ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { EntityHeader } from "./entity-header"
import type { BreadcrumbItem } from "./entity-breadcrumb"

interface EntityFormPageProps {
  title: string
  description?: string
  breadcrumb?: BreadcrumbItem[]
  children?: ReactNode
  backPath?: string
  onBack?: () => void
  className?: string
}

export function EntityFormPage({
  title,
  description,
  breadcrumb,
  children,
  backPath,
  onBack,
  className,
}: EntityFormPageProps) {
  const navigate = useNavigate()

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else if (backPath) {
      navigate(backPath)
    } else {
      navigate(-1)
    }
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div>
        <Button variant="ghost" size="sm" onClick={handleBack} className="mb-2">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <EntityHeader title={title} description={description} breadcrumb={breadcrumb} />
      </div>
      <div className="max-w-2xl">{children}</div>
    </div>
  )
}
