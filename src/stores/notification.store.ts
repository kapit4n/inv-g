import { create } from "zustand"
import { generateId } from "@/lib/utils"
import type { AppNotification } from "@/types"

interface NotificationStore {
  notifications: AppNotification[]
  unreadCount: number
  addNotification: (notification: Omit<AppNotification, "id" | "read" | "createdAt">) => void
  removeNotification: (id: string) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearAll: () => void
  success: (title: string, message?: string, duration?: number) => void
  error: (title: string, message?: string, duration?: number) => void
  warning: (title: string, message?: string, duration?: number) => void
  info: (title: string, message?: string, duration?: number) => void
}

let autoDismissTimers: Map<string, ReturnType<typeof setTimeout>> = new Map()

export const useNotificationStore = create<NotificationStore>()((set, get) => ({
  notifications: [],
  unreadCount: 0,

  addNotification: (notification) => {
    const id = generateId()
    const newNotification: AppNotification = {
      ...notification,
      id,
      read: false,
      createdAt: new Date().toISOString(),
      duration: notification.duration ?? 5000,
    }

    set((state) => ({
      notifications: [newNotification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }))

    const duration = notification.duration ?? 5000
    if (duration > 0) {
      const timer = setTimeout(() => {
        get().removeNotification(id)
      }, duration)
      autoDismissTimers.set(id, timer)
    }

    return id
  },

  removeNotification: (id) => {
    const timer = autoDismissTimers.get(id)
    if (timer) {
      clearTimeout(timer)
      autoDismissTimers.delete(id)
    }

    set((state) => {
      const notification = state.notifications.find((n) => n.id === id)
      return {
        notifications: state.notifications.filter((n) => n.id !== id),
        unreadCount:
          notification && !notification.read
            ? Math.max(0, state.unreadCount - 1)
            : state.unreadCount,
      }
    })
  },

  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),

  clearAll: () => {
    autoDismissTimers.forEach((timer) => clearTimeout(timer))
    autoDismissTimers.clear()
    set({ notifications: [], unreadCount: 0 })
  },

  success: (title, message, duration) =>
    get().addNotification({ title, message: message ?? "", type: "success", duration }),

  error: (title, message, duration) =>
    get().addNotification({ title, message: message ?? "", type: "error", duration }),

  warning: (title, message, duration) =>
    get().addNotification({ title, message: message ?? "", type: "warning", duration }),

  info: (title, message, duration) =>
    get().addNotification({ title, message: message ?? "", type: "info", duration }),
}))
