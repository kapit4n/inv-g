import { Navigate, useLocation } from "react-router-dom"
import { useAuthStore } from "@/stores"
import { PermissionService } from "@/services/permission.service"
import { moduleForPath, useModules } from "@/hooks"
import { ForcePasswordChange } from "@/components/force-password-change"
import { useMemo } from "react"

export function AuthenticatedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, initialized, isLoading, mustChangePassword } = useAuthStore()

  if (isLoading || !initialized) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Enforced here rather than per route, because this is the one component every
  // authenticated page passes through. A check added to individual screens is one
  // someone can forget, and a forgotten one is a way into the app with a
  // provisioned password. Rendering the form instead of `children` means no
  // outlet below is mounted at all, so there is nothing for a bookmarked URL or a
  // stale tab to have already rendered.
  if (mustChangePassword) {
    return <ForcePasswordChange />
  }

  return <>{children}</>
}

export function GuestRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, initialized } = useAuthStore()

  if (!initialized) return null

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

export function PermissionRoute({
  permission,
  children,
  fallback,
}: {
  permission: string
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const permissions = useAuthStore((s) => s.permissions)
  const location = useLocation()

  const hasAccess = useMemo(
    () => PermissionService.hasRouteAccess(permissions, location.pathname)
        && PermissionService.hasPermission(permissions, permission),
    [permissions, location.pathname, permission]
  )

  if (!hasAccess) {
    return fallback ? <>{fallback}</> : <Navigate to="/forbidden" replace />
  }

  return <>{children}</>
}

/**
 * Blocks the optional business modules an administrator has switched off.
 *
 * Wraps the authenticated layout rather than each route, so a module keeps
 * working for its children without every entry being annotated. The check keys
 * off the path prefix, so it also covers a bookmarked or hand-typed URL: hiding
 * a sidebar entry alone would not have stopped the page from opening.
 */
export function ModuleRoute({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation()
  const module = useMemo(() => moduleForPath(pathname), [pathname])
  const { isEnabled } = useModules()

  if (module && !isEnabled(module)) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
