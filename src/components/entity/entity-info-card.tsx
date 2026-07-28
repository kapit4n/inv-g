import type { ReactNode } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface EntityInfoCardProps {
  title?: string
  children: ReactNode
  className?: string
  columns?: 1 | 2
}

interface InfoRowProps {
  label: string
  value?: ReactNode
  className?: string
}

export function InfoRow({ label, value, className }: InfoRowProps) {
  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <dt className="text-xs text-muted-foreground font-medium">{label}</dt>
      <dd className="text-sm">{value || "-"}</dd>
    </div>
  )
}

export function EntityInfoCard({ title, children, className, columns = 2 }: EntityInfoCardProps) {
  return (
    <Card className={className}>
      {title && (
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <dl
          className={cn(
            "gap-x-6 gap-y-4",
            columns === 2 ? "grid grid-cols-1 sm:grid-cols-2" : "space-y-4"
          )}
        >
          {children}
        </dl>
      </CardContent>
    </Card>
  )
}
