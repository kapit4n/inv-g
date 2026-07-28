import { Navigate, useLocation } from "react-router-dom"
import { useAuthStore } from "@/stores"
import { PermissionService } from "@/services/permission.service"
import { useMemo } from "react"

export function AuthenticatedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, initialized, isLoading } = useAuthStore()

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
