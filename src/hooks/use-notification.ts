import { useNotificationStore } from "@/stores"

export function useNotification() {
  const store = useNotificationStore()

  return {
    notifications: store.notifications,
    unreadCount: store.unreadCount,
    success: store.success,
    error: store.error,
    warning: store.warning,
    info: store.info,
    remove: store.removeNotification,
    markAsRead: store.markAsRead,
    markAllAsRead: store.markAllAsRead,
    clearAll: store.clearAll,
  }
}
