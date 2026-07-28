import { forwardRef } from "react"
import { FormFieldWrapper } from "./form-field"
import { cn } from "@/lib/utils"

interface CheckboxFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string
  error?: string
  description?: string
}

export const CheckboxField = forwardRef<HTMLInputElement, CheckboxFieldProps>(
  ({ label, error, description, className, id, children, ...props }, ref) => {
    const fieldId = id || props.name
    return (
      <FormFieldWrapper error={error} description={description}>
        <label
          htmlFor={fieldId}
          className={cn(
            "flex items-center gap-2 text-sm cursor-pointer",
            props.disabled && "cursor-not-allowed opacity-50"
          )}
        >
          <input
            ref={ref}
            id={fieldId}
            type="checkbox"
            className={cn(
              "h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary",
              error && "border-destructive",
              className
            )}
            aria-invalid={!!error}
            {...props}
          />
          {label && <span className="font-medium">{label}</span>}
          {children}
        </label>
      </FormFieldWrapper>
    )
  }
)
CheckboxField.displayName = "CheckboxField"
