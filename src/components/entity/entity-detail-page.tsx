import type { ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { EntityHeader } from "./entity-header"
import { Card, CardContent } from "@/components/ui/card"
import type { BreadcrumbItem } from "./entity-breadcrumb"

interface EntityDetailPageProps {
  title: string
  description?: string
  breadcrumb?: BreadcrumbItem[]
  backPath?: string
  editPath?: string
  onBack?: () => void
  onEdit?: () => void
  actions?: ReactNode
  children?: ReactNode
  loading?: boolean
  className?: string
}

export function EntityDetailPage({
  title,
  description,
  breadcrumb,
  backPath,
  editPath,
  onBack,
  onEdit,
  actions,
  children,
  loading,
  className,
}: EntityDetailPageProps) {
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

  const handleEdit = () => {
    if (onEdit) {
      onEdit()
    } else if (editPath) {
      navigate(editPath)
    }
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div>
        <Button variant="ghost" size="sm" onClick={handleBack} className="mb-2">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <EntityHeader
          title={title}
          description={description}
          breadcrumb={breadcrumb}
          actions={
            <div className="flex items-center gap-2">
              {editPath && (
                <Button onClick={handleEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              )}
              {actions}
            </div>
          }
        />
      </div>
      {loading ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          </CardContent>
        </Card>
      ) : (
        children
      )}
    </div>
  )
}
