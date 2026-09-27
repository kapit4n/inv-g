import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

interface FormFieldWrapperProps {
  label?: string
  error?: string
  description?: string
  required?: boolean
  /**
   * Id of the control this label describes. Without it the label is not
   * associated with the input, so screen readers announce an unlabelled field
   * and clicking the label does not move focus to it.
   */
  htmlFor?: string
  children: ReactNode
  className?: string
}

export function FormFieldWrapper({
  label,
  error,
  description,
  required,
  htmlFor,
  children,
  className,
}: FormFieldWrapperProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label htmlFor={htmlFor} className={cn(error && "text-destructive")}>
          {label}
          {required && <span className="ml-1 text-destructive">*</span>}
        </Label>
      )}
      {children}
      {error && <p id={htmlFor ? `${htmlFor}-error` : undefined} className="text-xs text-destructive">{error}</p>}
      {description && !error && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  )
}
