import { describe, it, expect, beforeEach, vi } from "vitest"
import { useAuthStore } from "@/stores/auth.store"

vi.mock("@/services/auth.service", () => ({
  AuthService: {
    validateSession: vi.fn(),
    logout: vi.fn(),
  },
}))

import { AuthService } from "@/services/auth.service"

describe("AuthStore", () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, token: null, permissions: [], isAuthenticated: false, isLoading: true, initialized: false })
    vi.clearAllMocks()
  })

  it("initializes with default state", () => {
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.token).toBeNull()
    expect(state.permissions).toEqual([])
    expect(state.isAuthenticated).toBe(false)
    expect(state.isLoading).toBe(true)
    expect(state.initialized).toBe(false)
  })

  it("setSession sets user, token, and permissions", () => {
    const user = { id: 1, username: "admin", email: "a@b.com", fullName: "Admin", isActive: true, createdAt: "2025-01-01T00:00:00Z" } as any
    useAuthStore.getState().setSession(user, "token123", ["read", "write"])
    const state = useAuthStore.getState()
    expect(state.user).toEqual(user)
    expect(state.token).toBe("token123")
    expect(state.permissions).toEqual(["read", "write"])
    expect(state.isAuthenticated).toBe(true)
  })

  it("clearSession clears user and calls logout", () => {
    const user = { id: 1, username: "admin", email: "a@b.com", fullName: "Admin", isActive: true, createdAt: "2025-01-01T00:00:00Z" } as any
    useAuthStore.getState().setSession(user, "token123", ["read"])
    useAuthStore.getState().clearSession()
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.token).toBeNull()
    expect(state.permissions).toEqual([])
    expect(state.isAuthenticated).toBe(false)
    expect(AuthService.logout).toHaveBeenCalled()
  })

  it("setLoading updates loading state", () => {
    useAuthStore.getState().setLoading(false)
    expect(useAuthStore.getState().isLoading).toBe(false)
  })

  it("initialize resolves session when valid", async () => {
    const session = { user: { id: 1 } as any, token: "tok", permissions: ["*"] }
    ;(AuthService.validateSession as any).mockResolvedValue(session)
    await useAuthStore.getState().initialize()
    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(true)
    expect(state.initialized).toBe(true)
    expect(state.isLoading).toBe(false)
  })

  it("initialize handles null session", async () => {
    ;(AuthService.validateSession as any).mockResolvedValue(null)
    await useAuthStore.getState().initialize()
    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.initialized).toBe(true)
    expect(state.isLoading).toBe(false)
  })

  it("initialize handles error gracefully", async () => {
    ;(AuthService.validateSession as any).mockRejectedValue(new Error("fail"))
    await useAuthStore.getState().initialize()
    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.initialized).toBe(true)
    expect(state.isLoading).toBe(false)
  })
})
