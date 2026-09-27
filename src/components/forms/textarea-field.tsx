import { forwardRef, useId } from "react"
import { Textarea } from "@/components/ui/textarea"
import { FormFieldWrapper } from "./form-field"
import { cn } from "@/lib/utils"

interface TextareaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  description?: string
}

export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
  ({ label, error, description, className, id, ...props }, ref) => {
    // A stable id is required for the label to be associated with the
    // control; most call sites pass neither `id` nor `name`.
    const generatedId = useId()
    const fieldId = id || props.name || generatedId
    return (
      <FormFieldWrapper label={label} error={error} description={description} required={props.required} htmlFor={fieldId}>
        <Textarea
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
TextareaField.displayName = "TextareaField"
