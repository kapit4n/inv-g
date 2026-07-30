import { describe, it, expect, beforeEach, vi } from "vitest"
import { useNotificationStore } from "@/stores/notification.store"

describe("NotificationStore", () => {
  beforeEach(() => {
    useNotificationStore.setState({ notifications: [], unreadCount: 0 })
    vi.clearAllMocks()
  })

  it("initializes empty", () => {
    const state = useNotificationStore.getState()
    expect(state.notifications).toEqual([])
    expect(state.unreadCount).toBe(0)
  })

  it("addNotification creates entry with id and timestamp", () => {
    useNotificationStore.getState().success("Title", "Message")
    const state = useNotificationStore.getState()
    expect(state.notifications).toHaveLength(1)
    expect(state.notifications[0].title).toBe("Title")
    expect(state.notifications[0].message).toBe("Message")
    expect(state.notifications[0].type).toBe("success")
    expect(state.notifications[0].id).toBeTruthy()
    expect(state.notifications[0].read).toBe(false)
    expect(state.notifications[0].createdAt).toBeTruthy()
    expect(state.unreadCount).toBe(1)
  })

  it("addNotification with zero duration skips auto-dismiss", () => {
    vi.useFakeTimers()
    useNotificationStore.getState().success("Title", "Msg", 0)
    expect(useNotificationStore.getState().notifications).toHaveLength(1)
    vi.advanceTimersByTime(10000)
    expect(useNotificationStore.getState().notifications).toHaveLength(1)
    vi.useRealTimers()
  })

  it("addNotification auto-dismisses after duration", () => {
    vi.useFakeTimers()
    useNotificationStore.getState().success("Auto", "Dismiss", 100)
    expect(useNotificationStore.getState().notifications).toHaveLength(1)
    vi.advanceTimersByTime(200)
    expect(useNotificationStore.getState().notifications).toHaveLength(0)
    expect(useNotificationStore.getState().unreadCount).toBe(0)
    vi.useRealTimers()
  })

  it("removeNotification removes by id", () => {
    useNotificationStore.getState().info("Test", "Msg")
    const id = useNotificationStore.getState().notifications[0].id
    useNotificationStore.getState().removeNotification(id)
    expect(useNotificationStore.getState().notifications).toHaveLength(0)
    expect(useNotificationStore.getState().unreadCount).toBe(0)
  })

  it("markAsRead marks single notification", () => {
    useNotificationStore.getState().warning("Warn", "Msg")
    const id = useNotificationStore.getState().notifications[0].id
    useNotificationStore.getState().markAsRead(id)
    expect(useNotificationStore.getState().notifications[0].read).toBe(true)
    expect(useNotificationStore.getState().unreadCount).toBe(0)
  })

  it("markAllAsRead marks all", () => {
    useNotificationStore.getState().error("E1")
    useNotificationStore.getState().error("E2")
    useNotificationStore.getState().markAllAsRead()
    expect(useNotificationStore.getState().notifications.every((n) => n.read)).toBe(true)
    expect(useNotificationStore.getState().unreadCount).toBe(0)
  })

  it("clearAll removes all notifications", () => {
    useNotificationStore.getState().success("A")
    useNotificationStore.getState().success("B")
    useNotificationStore.getState().clearAll()
    expect(useNotificationStore.getState().notifications).toEqual([])
    expect(useNotificationStore.getState().unreadCount).toBe(0)
  })

  it("success helper creates success notification", () => {
    useNotificationStore.getState().success("Done", "OK")
    expect(useNotificationStore.getState().notifications[0].type).toBe("success")
  })

  it("error helper creates error notification", () => {
    useNotificationStore.getState().error("Fail", "NOK")
    expect(useNotificationStore.getState().notifications[0].type).toBe("error")
  })

  it("warning helper creates warning notification", () => {
    useNotificationStore.getState().warning("Caution", "Careful")
    expect(useNotificationStore.getState().notifications[0].type).toBe("warning")
  })

  it("info helper creates info notification", () => {
    useNotificationStore.getState().info("FYI", "Info msg")
    expect(useNotificationStore.getState().notifications[0].type).toBe("info")
  })
})
