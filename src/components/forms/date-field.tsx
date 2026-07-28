import { forwardRef } from "react"
import { Input } from "@/components/ui/input"
import { FormFieldWrapper } from "./form-field"
import { cn } from "@/lib/utils"

interface DateFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string
  error?: string
  description?: string
}

export const DateField = forwardRef<HTMLInputElement, DateFieldProps>(
  ({ label, error, description, className, id, ...props }, ref) => {
    const fieldId = id || props.name
    return (
      <FormFieldWrapper label={label} error={error} description={description} required={props.required}>
        <Input
          ref={ref}
          id={fieldId}
          type="date"
          className={cn(error && "border-destructive focus-visible:ring-destructive", className)}
          aria-invalid={!!error}
          {...props}
        />
      </FormFieldWrapper>
    )
  }
)
DateField.displayName = "DateField"
