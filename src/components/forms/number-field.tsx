import { forwardRef } from "react"
import { Input } from "@/components/ui/input"
import { FormFieldWrapper } from "./form-field"
import { cn } from "@/lib/utils"

interface NumberFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string
  error?: string
  description?: string
  min?: number
  max?: number
  step?: number
}

export const NumberField = forwardRef<HTMLInputElement, NumberFieldProps>(
  ({ label, error, description, className, id, min, max, step, ...props }, ref) => {
    const fieldId = id || props.name
    return (
      <FormFieldWrapper label={label} error={error} description={description} required={props.required}>
        <Input
          ref={ref}
          id={fieldId}
          type="number"
          min={min}
          max={max}
          step={step}
          className={cn(error && "border-destructive focus-visible:ring-destructive", className)}
          aria-invalid={!!error}
          {...props}
        />
      </FormFieldWrapper>
    )
  }
)
NumberField.displayName = "NumberField"
