import { login as tauriLogin, loginByRole as tauriLoginByRole, logout as tauriLogout, getCurrentUser, checkSession } from "@/lib/tauri"
import type { User, SessionInfo } from "@/types"

const SESSION_KEY = "inventory-gear-session"

interface StoredSession {
  token: string
  user: User
  permissions: string[]
}

export const AuthService = {
  async login(username: string, password: string): Promise<StoredSession> {
    const response = await tauriLogin(username, password)
    const session: StoredSession = {
      token: response.token,
      user: response.user,
      permissions: response.permissions,
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    return session
  },

  async loginByRole(roleName: string): Promise<StoredSession> {
    const response = await tauriLoginByRole(roleName)
    const session: StoredSession = {
      token: response.token,
      user: response.user,
      permissions: response.permissions,
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    return session
  },

  async logout(): Promise<void> {
    const session = this.getStoredSession()
    if (session) {
      try {
        await tauriLogout(session.token)
      } catch {
        // Ignore errors during logout
      }
    }
    localStorage.removeItem(SESSION_KEY)
  },

  async validateSession(): Promise<StoredSession | null> {
    const session = this.getStoredSession()
    if (!session) return null

    try {
      const valid = await checkSession(session.token)
      if (!valid) {
        localStorage.removeItem(SESSION_KEY)
        return null
      }
      return session
    } catch {
      localStorage.removeItem(SESSION_KEY)
      return null
    }
  },

  async refreshSession(): Promise<SessionInfo | null> {
    const session = this.getStoredSession()
    if (!session) return null

    try {
      return await getCurrentUser(session.token)
    } catch {
      localStorage.removeItem(SESSION_KEY)
      return null
    }
  },

  getStoredSession(): StoredSession | null {
    try {
      const raw = localStorage.getItem(SESSION_KEY)
      if (!raw) return null
      return JSON.parse(raw) as StoredSession
    } catch {
      localStorage.removeItem(SESSION_KEY)
      return null
    }
  },

  getToken(): string | null {
    return this.getStoredSession()?.token ?? null
  },

  isAuthenticated(): boolean {
    return this.getStoredSession() !== null
  },
}
