import { useTranslation } from "react-i18next"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useNotificationStore } from "@/stores"

export function NotificationPanel() {
  const { notifications, unreadCount } = useNotificationStore()
  const { t } = useTranslation()

  return (
    <div className="w-80 space-y-2">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold">{t("common.notifications")}</h3>
        {unreadCount > 0 && (
          <span className="text-xs text-muted-foreground">{unreadCount} {t("common.noNotifications")}</span>
        )}
      </div>
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-center">
          <Bell className="h-8 w-8 text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">{t("common.noNotifications")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.slice(0, 5).map((n) => (
            <Card key={n.id} className={!n.read ? "bg-primary/5" : ""}>
              <CardContent className="p-3">
                <p className="text-sm font-medium">{n.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{n.message}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Button variant="outline" className="w-full" size="sm" disabled>
        {t("common.viewAll")} ({t("common.comingSoon")})
      </Button>
    </div>
  )
}
