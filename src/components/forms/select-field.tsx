import { forwardRef } from "react"
import { FormFieldWrapper } from "./form-field"
import { cn } from "@/lib/utils"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown } from "lucide-react"

interface SelectOption {
  label: string
  value: string | number
}

interface SelectFieldProps {
  label?: string
  error?: string
  description?: string
  required?: boolean
  placeholder?: string
  options: SelectOption[]
  value?: string | number
  onChange?: (value: string) => void
  name?: string
  disabled?: boolean
  className?: string
}

export const SelectField = forwardRef<HTMLButtonElement, SelectFieldProps>(
  ({ label, error, description, required, placeholder, options, value, onChange, name, disabled, className }, ref) => {
    return (
      <FormFieldWrapper label={label} error={error} description={description} required={required}>
        <SelectPrimitive.Root value={String(value)} onValueChange={onChange} name={name} disabled={disabled}>
          <SelectPrimitive.Trigger
            ref={ref}
            className={cn(
              "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors",
              "placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring",
              "disabled:cursor-not-allowed disabled:opacity-50",
              error && "border-destructive focus-visible:ring-destructive",
              className
            )}
          >
            <SelectPrimitive.Value placeholder={placeholder || "Seleccionar..."} />
            <SelectPrimitive.Icon>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </SelectPrimitive.Icon>
          </SelectPrimitive.Trigger>
          <SelectPrimitive.Portal>
            <SelectPrimitive.Content className="relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95">
              <SelectPrimitive.Viewport className="p-1">
                {options.map((opt) => (
                  <SelectPrimitive.Item
                    key={opt.value}
                    value={String(opt.value)}
                    className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                  >
                    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                      <SelectPrimitive.ItemIndicator>
                        <Check className="h-4 w-4" />
                      </SelectPrimitive.ItemIndicator>
                    </span>
                    <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
                  </SelectPrimitive.Item>
                ))}
              </SelectPrimitive.Viewport>
            </SelectPrimitive.Content>
          </SelectPrimitive.Portal>
        </SelectPrimitive.Root>
      </FormFieldWrapper>
    )
  }
)
SelectField.displayName = "SelectField"
