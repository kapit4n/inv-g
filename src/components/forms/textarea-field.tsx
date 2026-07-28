import { forwardRef } from "react"
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
    const fieldId = id || props.name
    return (
      <FormFieldWrapper label={label} error={error} description={description} required={props.required}>
        <Textarea
          ref={ref}
          id={fieldId}
          className={cn(error && "border-destructive focus-visible:ring-destructive", className)}
          aria-invalid={!!error}
          {...props}
        />
      </FormFieldWrapper>
    )
  }
)
TextareaField.displayName = "TextareaField"
