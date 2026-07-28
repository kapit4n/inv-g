import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const { t } = useTranslation()
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16">
        <div className="rounded-full bg-muted p-4 mb-4">
          {icon || <Package className="h-8 w-8 text-muted-foreground" />}
        </div>
        <h3 className="text-lg font-semibold mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground text-center max-w-sm mb-6">
          {description}
        </p>
        {actionLabel && onAction && (
          <Button onClick={onAction}>{actionLabel}</Button>
        )}
        {!actionLabel && !onAction && (
          <Button variant="outline" disabled>{t("common.comingSoon")}</Button>
        )}
      </CardContent>
    </Card>
  )
}
