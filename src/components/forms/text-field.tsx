import { forwardRef, useId } from "react"
import { Input } from "@/components/ui/input"
import { FormFieldWrapper } from "./form-field"
import { cn } from "@/lib/utils"

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  description?: string
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, error, description, className, id, ...props }, ref) => {
    // A stable id is required for the label to be associated with the
    // control; most call sites pass neither `id` nor `name`.
    const generatedId = useId()
    const fieldId = id || props.name || generatedId
    return (
      <FormFieldWrapper label={label} error={error} description={description} required={props.required} htmlFor={fieldId}>
        <Input
          ref={ref}
          id={fieldId}
          className={cn(error && "border-destructive focus-visible:ring-destructive", className)}
          aria-invalid={!!error}
          aria-describedby={error ? `${fieldId}-error` : undefined}
          {...props}
        />
      </FormFieldWrapper>
    )
  }
)
TextField.displayName = "TextField"
