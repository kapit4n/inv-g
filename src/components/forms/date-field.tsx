import { forwardRef, useState } from "react"
import { format, parseISO } from "date-fns"
import { es, enUS } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { FormFieldWrapper } from "./form-field"
import { cn } from "@/lib/utils"

interface DateFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string
  error?: string
  description?: string
  placeholder?: string
}

/**
 * A date field backed by our own calendar instead of `<input type="date">`.
 *
 * The native control draws its calendar inside the webview, outside the DOM,
 * and the platform gives us `showPicker()` to open it but no way to dismiss it.
 * That is why a chosen date could leave the calendar sitting on screen with
 * nothing able to close it. Owning the calendar makes the close deterministic:
 * picking a day closes it, and so do Enter, Escape and an outside click.
 *
 * The value is still a plain `yyyy-MM-dd` string, so callers and the API see
 * exactly what they saw before.
 */
export const DateField = forwardRef<HTMLInputElement, DateFieldProps>(
  ({ label, error, description, placeholder, className, id, name, value, onChange, disabled, required, ...props }, ref) => {
    const { t, i18n } = useTranslation()
    const locale = (i18n.language || "es").slice(0, 2) === "en" ? enUS : es
    const fieldId = id || name
    const iso = typeof value === "string" ? value : ""
    const [open, setOpen] = useState(false)

    const emit = (next: string) => {
      onChange?.({ target: { value: next } } as React.ChangeEvent<HTMLInputElement>)
    }

    return (
      <FormFieldWrapper label={label} error={error} description={description} required={required}>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild disabled={disabled}>
            <Button
              type="button"
              id={fieldId}
              variant="outline"
              disabled={disabled}
              aria-invalid={!!error}
              className={cn(
                "w-full justify-start gap-2 px-3 font-normal",
                !iso && "text-muted-foreground",
                error && "border-destructive focus-visible:ring-destructive",
                className
              )}
            >
              <CalendarIcon className="h-4 w-4 shrink-0 opacity-70" />
              {iso ? (
                <span className="capitalize">{format(parseISO(iso), "PPP", { locale })}</span>
              ) : (
                <span>{placeholder || t("dateFieldPlaceholder")}</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-3"
            align="start"
            // Escape and outside clicks come free with Radix. Enter does not:
            // it is the one dismissal the user expects that the primitive
            // leaves to whatever element happens to hold focus.
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                setOpen(false)
              }
            }}
          >
            <Calendar
              value={iso}
              locale={i18n.language}
              onSelect={(next) => {
                emit(next)
                // A picked day always dismisses the calendar - that was the bug.
                setOpen(false)
              }}
            />
            {iso && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-2 w-full"
                onClick={() => {
                  emit("")
                  setOpen(false)
                }}
              >
                {t("dateFieldClear")}
              </Button>
            )}
          </PopoverContent>
        </Popover>

        {/* Keeps the value in the DOM under its own name, so native form
            submission and FormData behave as they did with the old input. */}
        <Input
          ref={ref}
          id={fieldId ? `${fieldId}-value` : undefined}
          name={name}
          type="hidden"
          value={iso}
          readOnly
          {...props}
        />
      </FormFieldWrapper>
    )
  }
)
DateField.displayName = "DateField"
