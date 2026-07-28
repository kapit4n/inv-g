import { forwardRef } from "react"
import { Input } from "@/components/ui/input"
import { FormFieldWrapper } from "./form-field"
import { cn } from "@/lib/utils"

interface CurrencyFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string
  error?: string
  description?: string
  currency?: string
}

export const CurrencyField = forwardRef<HTMLInputElement, CurrencyFieldProps>(
  ({ label, error, description, className, id, currency = "$", ...props }, ref) => {
    const fieldId = id || props.name
    return (
      <FormFieldWrapper label={label} error={error} description={description} required={props.required}>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
            {currency}
          </span>
          <Input
            ref={ref}
            id={fieldId}
            type="number"
            step="0.01"
            min="0"
            className={cn("pl-7", error && "border-destructive focus-visible:ring-destructive", className)}
            aria-invalid={!!error}
            {...props}
          />
        </div>
      </FormFieldWrapper>
    )
  }
)
CurrencyField.displayName = "CurrencyField"
