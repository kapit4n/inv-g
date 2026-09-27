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
  /**
   * True while the signed-in account must replace its provisioned password.
   *
   * Derived from the user in one place rather than read from `user` at each call
   * site, so there is a single answer to "may this person past the login screen"
   * and no route can forget to ask.
   */
  mustChangePassword: boolean
  initialize: () => Promise<void>
  setSession: (user: User, token: string, permissions: string[]) => void
  clearSession: () => void
  markPasswordChanged: (user?: User) => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthStore>()((set) => ({
  user: null,
  token: null,
  permissions: [],
  isAuthenticated: false,
  isLoading: true,
  initialized: false,
  mustChangePassword: false,

  initialize: async () => {
    set({ isLoading: true })
    try {
      const session = await AuthService.validateSession()
      if (session) {
        // Re-read the user from the backend instead of trusting the copy in
        // local storage. The stored user is a snapshot from whenever the session
        // was created, so an administrator who since required a password change
        // would otherwise not be noticed until the next login.
        let user = session.user
        let permissions = session.permissions
        try {
          const refreshed = await AuthService.refreshSession()
          if (refreshed) {
            user = refreshed.user
            permissions = refreshed.permissions
          }
        } catch {
          // Keep the stored snapshot; a failed refresh must not sign anyone out.
        }

        set({
          user,
          token: session.token,
          permissions,
          isAuthenticated: true,
          isLoading: false,
          initialized: true,
          mustChangePassword: user.passwordChangeRequired === true,
        })
      } else {
        set({ isLoading: false, initialized: true })
      }
    } catch {
      set({ isLoading: false, initialized: true })
    }
  },

  setSession: (user, token, permissions) => {
    set({
      user,
      token,
      permissions,
      isAuthenticated: true,
      mustChangePassword: user.passwordChangeRequired === true,
    })
  },

  /**
   * Clears the forced change after the backend accepted the new password.
   *
   * Both halves matter: the flag releases the UI, and the refreshed user keeps
   * local storage from restoring `passwordChangeRequired: true` on the next load
   * and bouncing the person back to the form they just completed.
   */
  clearSession: () => {
    AuthService.logout()
    set({
      user: null,
      token: null,
      permissions: [],
      isAuthenticated: false,
      mustChangePassword: false,
    })
  },

  markPasswordChanged: (user?: User) =>
    set((state) => ({
      mustChangePassword: false,
      user: user ? { ...state.user, ...user, passwordChangeRequired: false } : state.user,
    })),

  setLoading: (loading) => set({ isLoading: loading }),
}))
