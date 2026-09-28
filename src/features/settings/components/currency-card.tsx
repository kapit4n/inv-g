import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Coins } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { SelectField } from "@/components/forms"
import { CURRENCY_SETTING_KEY, SUPPORTED_CURRENCIES, getActiveCurrency, setActiveCurrency } from "@/lib/currency"
import { updateAppSetting } from "@/lib/tauri"
import { useNotification } from "@/hooks/use-notification"
import { useAppSettingsStore } from "@/stores"

/**
 * System currency selector.
 *
 * Display only. Persisting the choice changes how `formatCurrency` renders
 * amounts everywhere; it does not convert a single stored price. The copy says
 * so explicitly, because "I changed the currency and my prices changed" is the
 * obvious wrong assumption and the alternative is someone converting their
 * catalogue by hand.
 *
 * The value is written through `updateAppSetting`, the same command the other
 * Settings toggles use, so it lands in the `settings` table the rest of the app
 * already reads. The in-memory currency is updated too, because the formatter
 * reads it from a module rather than from the store.
 */
export function CurrencyCard() {
  const { t } = useTranslation()
  const notification = useNotification()
  const getValue = useAppSettingsStore((s) => s.getValue)
  const setSettingValue = useAppSettingsStore((s) => s.setValue)

  // The store is the source of truth for what is persisted; the module is what
  // the formatter reads, so a value that has not loaded yet falls back to the
  // default rather than rendering an empty control.
  const persisted = getValue(CURRENCY_SETTING_KEY)
  const current = useMemo(() => (persisted ? persisted : getActiveCurrency().code), [persisted])

  const options = useMemo(
    () =>
      SUPPORTED_CURRENCIES.map((currency) => ({
        label: t(currency.labelKey),
        value: currency.code,
      })),
    [t]
  )

  const changeCurrency = useCallback(
    async (value: string) => {
      // Optimistic: the selector has to react immediately, and the previous
      // value is restored if the write fails.
      setSettingValue(CURRENCY_SETTING_KEY, value)
      setActiveCurrency(value)
      try {
        await updateAppSetting(CURRENCY_SETTING_KEY, value)
        notification.success(t("common.success"), t("settings.currencies.systemCurrency"))
      } catch (err) {
        const previous = getValue(CURRENCY_SETTING_KEY) ?? getActiveCurrency().code
        setSettingValue(CURRENCY_SETTING_KEY, previous)
        setActiveCurrency(previous)
        notification.error(t("common.error"), String(err))
      }
    },
    [getValue, notification, setSettingValue, t]
  )

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-primary/10 p-3 text-primary">
              <Coins className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">{t("settings.currencies.systemCurrency")}</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t("settings.currencies.systemCurrencyDesc")}
              </p>
            </div>
          </div>
          <SelectField
            aria-label={t("settings.currencies.systemCurrency")}
            className="w-full sm:w-64"
            value={current}
            onChange={changeCurrency}
            options={options}
          />
        </div>
      </CardContent>
    </Card>
  )
}
