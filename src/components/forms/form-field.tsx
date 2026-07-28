import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

interface FormFieldWrapperProps {
  label?: string
  error?: string
  description?: string
  required?: boolean
  children: ReactNode
  className?: string
}

export function FormFieldWrapper({
  label,
  error,
  description,
  required,
  children,
  className,
}: FormFieldWrapperProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className={cn(error && "text-destructive")}>
          {label}
          {required && <span className="ml-1 text-destructive">*</span>}
        </Label>
      )}
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
      {description && !error && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  )
}
