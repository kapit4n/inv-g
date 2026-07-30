import { describe, it, expect, beforeEach, vi } from "vitest"
import * as tauri from "@/lib/tauri"
import { AuthService } from "@/services/auth.service"

describe("AuthService", () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it("login stores session in localStorage", async () => {
    const result = await AuthService.login("admin", "password")
    expect(result.token).toBe("test-token")
    expect(result.user.username).toBe("admin")
    expect(localStorage.getItem("inventory-gear-session")).toBeTruthy()
  })

  it("loginByRole stores session", async () => {
    const result = await AuthService.loginByRole("Admin")
    expect(result.token).toBe("test-token")
    expect(localStorage.getItem("inventory-gear-session")).toBeTruthy()
  })

  it("logout removes session", async () => {
    await AuthService.login("admin", "pass")
    await AuthService.logout()
    expect(localStorage.getItem("inventory-gear-session")).toBeNull()
  })

  it("validateSession returns session when valid", async () => {
    await AuthService.login("admin", "pass")
    const session = await AuthService.validateSession()
    expect(session).not.toBeNull()
    expect(session!.token).toBe("test-token")
  })

  it("validateSession returns null when no session", async () => {
    const session = await AuthService.validateSession()
    expect(session).toBeNull()
  })

  it("validateSession returns null when check fails", async () => {
    await AuthService.login("admin", "pass")
    vi.mocked(tauri.checkSession).mockRejectedValueOnce(new Error("fail"))
    const session = await AuthService.validateSession()
    expect(session).toBeNull()
  })

  it("getStoredSession returns null when no session", () => {
    expect(AuthService.getStoredSession()).toBeNull()
  })

  it("getToken returns token from stored session", async () => {
    await AuthService.login("admin", "pass")
    expect(AuthService.getToken()).toBe("test-token")
  })

  it("getToken returns null when no session", () => {
    expect(AuthService.getToken()).toBeNull()
  })

  it("isAuthenticated returns true when session exists", async () => {
    await AuthService.login("admin", "pass")
    expect(AuthService.isAuthenticated()).toBe(true)
  })

  it("isAuthenticated returns false when no session", () => {
    expect(AuthService.isAuthenticated()).toBe(false)
  })

  it("refreshSession calls getCurrentUser", async () => {
    await AuthService.login("admin", "pass")
    const result = await AuthService.refreshSession()
    expect(result).not.toBeNull()
    expect(tauri.getCurrentUser).toHaveBeenCalled()
  })

  it("refreshSession returns null when no session", async () => {
    const result = await AuthService.refreshSession()
    expect(result).toBeNull()
  })
})
