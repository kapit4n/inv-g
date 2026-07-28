import { create } from "zustand"
import type { User } from "@/types"
import { AuthService } from "@/services/auth.service"

interface AuthStore {
  user: User | null
  token: string | null
  permissions: string[]
  isAuthenticated: boolean
  isLoading: boolean
  initialized: boolean
  initialize: () => Promise<void>
  setSession: (user: User, token: string, permissions: string[]) => void
  clearSession: () => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthStore>()((set) => ({
  user: null,
  token: null,
  permissions: [],
  isAuthenticated: false,
  isLoading: true,
  initialized: false,

  initialize: async () => {
    set({ isLoading: true })
    try {
      const session = await AuthService.validateSession()
      if (session) {
        set({
          user: session.user,
          token: session.token,
          permissions: session.permissions,
          isAuthenticated: true,
          isLoading: false,
          initialized: true,
        })
      } else {
        set({ isLoading: false, initialized: true })
      }
    } catch {
      set({ isLoading: false, initialized: true })
    }
  },

  setSession: (user, token, permissions) => {
    set({ user, token, permissions, isAuthenticated: true })
  },

  clearSession: () => {
    AuthService.logout()
    set({
      user: null,
      token: null,
      permissions: [],
      isAuthenticated: false,
    })
  },

  setLoading: (loading) => set({ isLoading: loading }),
}))
