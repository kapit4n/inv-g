import type { ReactNode } from "react"
import { usePermissions } from "@/hooks"

interface PermissionGuardProps {
  permission: string
  children: ReactNode
  fallback?: ReactNode
}

export function PermissionGuard({ permission, children, fallback = null }: PermissionGuardProps) {
  const { hasPermission } = usePermissions()

  if (!hasPermission(permission)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

export function AnyPermissionGuard({
  permissions,
  children,
  fallback = null,
}: {
  permissions: string[]
  children: ReactNode
  fallback?: ReactNode
}) {
  const { hasAnyPermission } = usePermissions()

  if (!hasAnyPermission(permissions)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
