import { describe, it, expect, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useNotification } from "@/hooks/use-notification"
import { useNotificationStore } from "@/stores/notification.store"

describe("useNotification", () => {
  beforeEach(() => {
    useNotificationStore.setState({ notifications: [], unreadCount: 0 })
  })

  it("returns store methods", () => {
    const { result } = renderHook(() => useNotification())
    expect(typeof result.current.success).toBe("function")
    expect(typeof result.current.error).toBe("function")
    expect(typeof result.current.warning).toBe("function")
    expect(typeof result.current.info).toBe("function")
    expect(result.current.notifications).toEqual([])
    expect(result.current.unreadCount).toBe(0)
  })

  it("success adds notification", () => {
    const { result } = renderHook(() => useNotification())
    act(() => { result.current.success("Test") })
    expect(result.current.notifications).toHaveLength(1)
    expect(result.current.notifications[0].title).toBe("Test")
  })

  it("notifications array stays in sync", () => {
    const { result } = renderHook(() => useNotification())
    act(() => { result.current.success("One") })
    act(() => { result.current.error("Two") })
    expect(result.current.notifications).toHaveLength(2)
    expect(result.current.unreadCount).toBe(2)
  })
})
