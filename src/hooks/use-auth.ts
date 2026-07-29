import { useAuthStore } from "@/stores"
import { AuthService } from "@/services/auth.service"
import { useCallback } from "react"

export function useAuth() {
  const store = useAuthStore()

  const login = useCallback(async (username: string, password: string) => {
    const session = await AuthService.login(username, password)
    store.setSession(session.user, session.token, session.permissions)
    return session
  }, [store])

  const loginByRole = useCallback(async (roleName: string) => {
    const session = await AuthService.loginByRole(roleName)
    store.setSession(session.user, session.token, session.permissions)
    return session
  }, [store])

  const logout = useCallback(async () => {
    await AuthService.logout()
    store.clearSession()
  }, [store])

  return {
    user: store.user,
    token: store.token,
    permissions: store.permissions,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    initialized: store.initialized,
    login,
    loginByRole,
    logout,
  }
}

export function useCurrentUser() {
  const { user, isAuthenticated } = useAuthStore()
  return { user, isAuthenticated }
}
