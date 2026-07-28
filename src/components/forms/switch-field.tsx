import { forwardRef } from "react"
import { FormFieldWrapper } from "./form-field"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

interface SwitchFieldProps {
  label?: string
  error?: string
  description?: string
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  name?: string
  disabled?: boolean
  className?: string
}

export const SwitchField = forwardRef<HTMLButtonElement, SwitchFieldProps>(
  ({ label, error, description, checked, onCheckedChange, name, disabled, className }, ref) => {
    return (
      <FormFieldWrapper error={error} description={description}>
        <label
          className={cn(
            "flex items-center gap-2 text-sm cursor-pointer",
            disabled && "cursor-not-allowed opacity-50"
          )}
        >
          <Switch
            ref={ref}
            checked={checked}
            onCheckedChange={onCheckedChange}
            name={name}
            disabled={disabled}
            className={cn(error && "border-destructive", className)}
          />
          {label && <span className="font-medium">{label}</span>}
        </label>
      </FormFieldWrapper>
    )
  }
)
SwitchField.displayName = "SwitchField"
