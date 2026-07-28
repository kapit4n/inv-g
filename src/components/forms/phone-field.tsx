import { forwardRef } from "react"
import { Input } from "@/components/ui/input"
import { FormFieldWrapper } from "./form-field"
import { cn } from "@/lib/utils"
import { Phone } from "lucide-react"

interface PhoneFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  description?: string
}

export const PhoneField = forwardRef<HTMLInputElement, PhoneFieldProps>(
  ({ label, error, description, className, id, ...props }, ref) => {
    const fieldId = id || props.name
    return (
      <FormFieldWrapper label={label} error={error} description={description} required={props.required}>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={ref}
            id={fieldId}
            type="tel"
            className={cn("pl-10", error && "border-destructive focus-visible:ring-destructive", className)}
            aria-invalid={!!error}
            {...props}
          />
        </div>
      </FormFieldWrapper>
    )
  }
)
PhoneField.displayName = "PhoneField"
