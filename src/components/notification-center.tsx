import { useEffect, useState } from "react"
import { X, AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react"
import { useNotificationStore } from "@/stores"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const iconMap = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}

const colorMap = {
  success: "border-l-green-500 bg-green-500/5",
  error: "border-l-red-500 bg-red-500/5",
  warning: "border-l-yellow-500 bg-yellow-500/5",
  info: "border-l-blue-500 bg-blue-500/5",
}

export function NotificationCenter() {
  const store = useNotificationStore()
  const { notifications, markAsRead } = store
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const visible = notifications.slice(0, 5)

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col-reverse gap-2 max-w-sm">
      {visible.map((n) => {
        const Icon = iconMap[n.type]
        return (
          <div
            key={n.id}
            className={cn(
              "flex items-start gap-3 rounded-lg border border-l-4 p-4 shadow-lg",
              "bg-background backdrop-blur-sm",
              "animate-in slide-in-from-right-2 fade-in-1 duration-200",
              colorMap[n.type]
            )}
          >
            <Icon className="h-5 w-5 mt-0.5 shrink-0 text-foreground" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{n.title}</p>
              {n.message && (
                <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={() => {
                markAsRead(n.id)
                store.removeNotification(n.id)
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )
      })}
    </div>
  )
}


