import type { ButtonHTMLAttributes } from "react"
import { Button } from "@/components/ui/button"
import { usePermission } from "@/hooks"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

interface ProtectedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  permission: string
  tooltip?: string
}

export function ProtectedButton({
  permission,
  tooltip,
  children,
  disabled,
  onClick,
  ...props
}: ProtectedButtonProps) {
  const hasPermission = usePermission(permission)

  if (!hasPermission) return null

  const btn = (
    <Button disabled={disabled} onClick={onClick} {...props}>
      {children}
    </Button>
  )

  if (tooltip && disabled) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{btn}</TooltipTrigger>
        <TooltipContent>{tooltip}</TooltipContent>
      </Tooltip>
    )
  }

  return btn
}
