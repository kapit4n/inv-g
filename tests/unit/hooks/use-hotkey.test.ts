import { describe, it, expect, vi, afterEach } from "vitest"
import { renderHook } from "@testing-library/react"
import { useHotkey } from "@/hooks/use-hotkey"

function fireKey(key: string, opts?: Partial<KeyboardEventInit>) {
  const e = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...opts })
  window.dispatchEvent(e)
  return e
}

describe("useHotkey", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("fires callback on matching key", () => {
    const cb = vi.fn()
    renderHook(() => useHotkey("Escape", cb))
    fireKey("Escape")
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it("does not fire on non-matching key", () => {
    const cb = vi.fn()
    renderHook(() => useHotkey("Escape", cb))
    fireKey("Enter")
    expect(cb).not.toHaveBeenCalled()
  })

  it("fires Ctrl+K with ctrlKey", () => {
    const cb = vi.fn()
    renderHook(() => useHotkey("Ctrl+K", cb))
    fireKey("k", { ctrlKey: true })
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it("fires Ctrl+K with metaKey (mac)", () => {
    const cb = vi.fn()
    renderHook(() => useHotkey("Ctrl+K", cb))
    fireKey("k", { metaKey: true })
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it("does not fire Ctrl+K without modifier", () => {
    const cb = vi.fn()
    renderHook(() => useHotkey("Ctrl+K", cb))
    fireKey("k")
    expect(cb).not.toHaveBeenCalled()
  })

  it("fires Ctrl+Shift+P with both modifiers", () => {
    const cb = vi.fn()
    renderHook(() => useHotkey("Ctrl+Shift+P", cb))
    fireKey("p", { ctrlKey: true, shiftKey: true })
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it("does not fire Ctrl+Shift+P with only ctrl", () => {
    const cb = vi.fn()
    renderHook(() => useHotkey("Ctrl+Shift+P", cb))
    fireKey("p", { ctrlKey: true })
    expect(cb).not.toHaveBeenCalled()
  })

  it("fires F10 without modifiers", () => {
    const cb = vi.fn()
    renderHook(() => useHotkey("F10", cb))
    fireKey("F10")
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it("fires F2 without modifiers", () => {
    const cb = vi.fn()
    renderHook(() => useHotkey("F2", cb))
    fireKey("F2")
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it("does not fire when enabled=false", () => {
    const cb = vi.fn()
    renderHook(() => useHotkey("Escape", cb, { enabled: false }))
    fireKey("Escape")
    expect(cb).not.toHaveBeenCalled()
  })

  it("unregisters on unmount", () => {
    const cb = vi.fn()
    const { unmount } = renderHook(() => useHotkey("Escape", cb))
    unmount()
    fireKey("Escape")
    expect(cb).not.toHaveBeenCalled()
  })

  it("Ctrl+B fires with ctrlKey", () => {
    const cb = vi.fn()
    renderHook(() => useHotkey("Ctrl+B", cb))
    fireKey("b", { ctrlKey: true })
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it("Ctrl+N fires with ctrlKey", () => {
    const cb = vi.fn()
    renderHook(() => useHotkey("Ctrl+N", cb))
    fireKey("n", { ctrlKey: true })
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it("Ctrl+Shift+D fires with both modifiers", () => {
    const cb = vi.fn()
    renderHook(() => useHotkey("Ctrl+Shift+D", cb))
    fireKey("d", { ctrlKey: true, shiftKey: true })
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it("Ctrl+Shift+D does not fire with only shift", () => {
    const cb = vi.fn()
    renderHook(() => useHotkey("Ctrl+Shift+D", cb))
    fireKey("d", { shiftKey: true })
    expect(cb).not.toHaveBeenCalled()
  })

  it("prevents default on matching key", () => {
    const cb = vi.fn()
    renderHook(() => useHotkey("F10", cb))
    const e = fireKey("F10")
    expect(e.defaultPrevented).toBe(true)
  })
})
