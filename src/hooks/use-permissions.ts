import { useAuthStore } from "@/stores"
import { PermissionService } from "@/services/permission.service"
import { useMemo } from "react"

export function usePermissions() {
  const permissions = useAuthStore((s) => s.permissions)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useMemo(
    () => ({
      permissions,
      hasPermission: (permission: string) =>
        PermissionService.hasPermission(permissions, permission),
      hasAnyPermission: (checks: string[]) =>
        PermissionService.hasAnyPermission(permissions, checks),
      hasAllPermissions: (checks: string[]) =>
        PermissionService.hasAllPermissions(permissions, checks),
      canAccessRoute: (pathname: string) =>
        PermissionService.hasRouteAccess(permissions, pathname),
      isAuthenticated,
    }),
    [permissions, isAuthenticated]
  )
}

export function usePermission(permission: string) {
  const hasPermission = usePermissions().hasPermission
  return useMemo(() => hasPermission(permission), [hasPermission, permission])
}
