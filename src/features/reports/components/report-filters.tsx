import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"

export interface FilterState {
  dateFrom: string
  dateTo: string
  warehouse: string
  category: string
  brand: string
  paymentMethod: string
}

export interface ReportFiltersProps {
  filters: FilterState
  onChange: (key: keyof FilterState, value: string) => void
  onClear: () => void
}

const SELECT_OPTIONS = {
  warehouse: ["All", "Main", "Secondary", "North"],
  category: ["All", "Electronics", "Clothing", "Food", "Furniture", "Office Supplies"],
  brand: ["All", "Brand A", "Brand B", "Brand C", "Brand D"],
  paymentMethod: ["All", "Cash", "Credit Card", "Debit Card", "Bank Transfer", "Mobile Payment"],
} as const

interface SelectFieldProps {
  id: string
  label: string
  value: string
  options: readonly string[]
  onChange: (value: string) => void
}

function SelectField({ id, label, value, options, onChange }: SelectFieldProps) {
  const { t } = useTranslation("reports")
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {t(option)}
          </option>
        ))}
      </select>
    </div>
  )
}

export function ReportFilters({ filters, onChange, onClear }: ReportFiltersProps) {
  const { t } = useTranslation("reports")
  const hasAnyFilter =
    filters.dateFrom ||
    filters.dateTo ||
    filters.warehouse ||
    filters.category ||
    filters.brand ||
    filters.paymentMethod

  const isDefault =
    !filters.dateFrom &&
    !filters.dateTo &&
    (!filters.warehouse || filters.warehouse === "All") &&
    (!filters.category || filters.category === "All") &&
    (!filters.brand || filters.brand === "All") &&
    (!filters.paymentMethod || filters.paymentMethod === "All")

  const showClear = hasAnyFilter && !isDefault

  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="dateFrom">{t("from")}</Label>
        <Input
          id="dateFrom"
          type="date"
          value={filters.dateFrom}
          onChange={(e) => onChange("dateFrom", e.target.value)}
          className="w-40"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="dateTo">{t("to")}</Label>
        <Input
          id="dateTo"
          type="date"
          value={filters.dateTo}
          onChange={(e) => onChange("dateTo", e.target.value)}
          className="w-40"
        />
      </div>

      <SelectField
        id="warehouse"
        label={t("warehouse")}
        value={filters.warehouse}
        options={SELECT_OPTIONS.warehouse}
        onChange={(v) => onChange("warehouse", v)}
      />

      <SelectField
        id="category"
        label={t("category")}
        value={filters.category}
        options={SELECT_OPTIONS.category}
        onChange={(v) => onChange("category", v)}
      />

      <SelectField
        id="brand"
        label={t("brand")}
        value={filters.brand}
        options={SELECT_OPTIONS.brand}
        onChange={(v) => onChange("brand", v)}
      />

      <SelectField
        id="paymentMethod"
        label={t("paymentMethod")}
        value={filters.paymentMethod}
        options={SELECT_OPTIONS.paymentMethod}
        onChange={(v) => onChange("paymentMethod", v)}
      />

      {showClear && (
        <Button variant="outline" size="sm" onClick={onClear}>
          <X className="h-4 w-4" />
          {t("clear")}
        </Button>
      )}
    </div>
  )
}
