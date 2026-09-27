import * as React from "react"
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns"
import { es, enUS } from "date-fns/locale"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const LOCALES = { es, en: enUS } as const
type SupportedLocale = keyof typeof LOCALES

function toDateFnsLocale(locale?: string) {
  const key = (locale || "es").slice(0, 2) as SupportedLocale
  return LOCALES[key] || LOCALES.es
}

/** `yyyy-MM-dd`, the exact shape `<input type="date">` and the API both use. */
function toISODate(date: Date) {
  return format(date, "yyyy-MM-dd")
}

interface CalendarProps {
  /** Selected day, as `yyyy-MM-dd`. */
  value?: string
  /** Fired with a `yyyy-MM-dd` string when a day is picked. */
  onSelect: (value: string) => void
  /** BCP-47 tag of the active UI language, for month and weekday names. */
  locale?: string
  className?: string
}

/**
 * A month grid we own outright.
 *
 * This replaces `<input type="date">`, whose calendar is drawn by the webview
 * itself: it is not part of the DOM, and the platform exposes `showPicker()` to
 * open it but no way to close it. That is why selecting a date could leave the
 * calendar on screen - there was nothing to close it with. Owning the grid
 * makes dismissal deterministic.
 */
export function Calendar({ value, onSelect, locale, className }: CalendarProps) {
  const { t } = useTranslation()
  const dfnLocale = toDateFnsLocale(locale)
  const selected = value ? parseISO(value) : undefined
  // Anchor the visible month on the selection when there is one, else today.
  const [month, setMonth] = React.useState<Date>(
    () => selected ?? new Date()
  )

  // Follow the value when it changes from outside, e.g. picking a date collapses
  // back onto a field the form just reset.
  React.useEffect(() => {
    if (selected) setMonth(selected)
  }, [value])

  const days = React.useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(startOfMonth(month), { locale: dfnLocale }),
        end: endOfWeek(endOfMonth(month), { locale: dfnLocale }),
      }),
    [month, dfnLocale]
  )

  // Monday-first, matching the locale rather than a hardcoded Sunday start.
  const weekdayFormat = React.useMemo(
    () => (dfnLocale === LOCALES.es ? "EEEEEE" : "EEE"),
    [dfnLocale]
  )
  const firstWeekday = startOfWeek(new Date(), { locale: dfnLocale })
  const weekdays = Array.from({ length: 7 }, (_, i) =>
    format(new Date(firstWeekday.getFullYear(), firstWeekday.getMonth(), firstWeekday.getDate() + i), weekdayFormat, {
      locale: dfnLocale,
    })
  )

  const today = new Date()

  return (
    <div className={cn("w-72 space-y-3", className)} role="group" aria-label={format(month, "MMMM yyyy", { locale: dfnLocale })}>
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => setMonth((m) => subMonths(m, 1))}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">{t("dateFieldPreviousMonth")}</span>
        </Button>
        <div className="text-sm font-medium capitalize" aria-live="polite">
          {format(month, "MMMM yyyy", { locale: dfnLocale })}
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => setMonth((m) => addMonths(m, 1))}
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">{t("dateFieldNextMonth")}</span>
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
        {weekdays.map((day, i) => (
          <div key={`${day}-${i}`} className="py-1 font-medium">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const iso = toISODate(day)
          const isSelected = selected ? isSameDay(day, selected) : false
          const isCurrentMonth = isSameMonth(day, month)
          const isToday = isSameDay(day, today)
          return (
            <Button
              key={iso}
              type="button"
              variant={isSelected ? "default" : "ghost"}
              size="icon"
              className={cn(
                "h-8 w-8 text-xs font-normal",
                !isCurrentMonth && "text-muted-foreground/50",
                !isSelected && isToday && "border border-border font-medium"
              )}
              aria-pressed={isSelected}
              aria-label={format(day, "d 'de' MMMM 'de' yyyy", { locale: dfnLocale })}
              onClick={() => onSelect(iso)}
            >
              {format(day, "d")}
            </Button>
          )
        })}
      </div>
    </div>
  )
}
