import type { ReactNode } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { ArrowDown, ArrowUp } from "lucide-react"

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon: ReactNode
  trend?: "up" | "down" | "neutral"
  trendValue?: string
  className?: string
}

export function StatCard({ title, value, description, icon, trend, trendValue, className }: StatCardProps) {
  return (
    <Card className={cn("transition-shadow hover:shadow-md", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {(description || trendValue) && (
              <div className="flex items-center gap-1 text-xs">
                {trend === "up" && <ArrowUp className="h-3 w-3 text-emerald-500" />}
                {trend === "down" && <ArrowDown className="h-3 w-3 text-red-500" />}
                {trendValue && (
                  <span className={cn(
                    "font-medium",
                    trend === "up" && "text-emerald-500",
                    trend === "down" && "text-red-500"
                  )}>
                    {trendValue}
                  </span>
                )}
                {description && <span className="text-muted-foreground">{description}</span>}
              </div>
            )}
          </div>
          <div className="rounded-xl bg-primary/10 p-3 text-primary">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
