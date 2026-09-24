import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

const CHART_COLORS = [
  "hsl(var(--primary))",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
]

interface ChartDataKey {
  key: string
  name: string
  color?: string
}

interface BaseChartProps {
  title: string
  loading?: boolean
  height?: number
}

export interface LineChartCardProps extends BaseChartProps {
  data: Record<string, unknown>[]
  dataKeys: {
    xKey: string
    lines: ChartDataKey[]
  }
}

export interface BarChartCardProps extends BaseChartProps {
  data: Record<string, unknown>[]
  dataKeys: {
    xKey: string
    bars: ChartDataKey[]
  }
}

export interface AreaChartCardProps extends BaseChartProps {
  data: Record<string, unknown>[]
  dataKeys: {
    xKey: string
    areas: ChartDataKey[]
  }
}

export interface PieChartCardProps extends BaseChartProps {
  data: Record<string, unknown>[]
  dataKey: string
  nameKey: string
}

export interface DonutChartCardProps extends PieChartCardProps {
  innerRadius?: number
}

export interface StackedBarChartCardProps extends BaseChartProps {
  data: Record<string, unknown>[]
  dataKeys: {
    xKey: string
    bars: ChartDataKey[]
  }
}

function ChartSkeleton() {
  return (
    <div className="flex h-[300px] items-end gap-2 px-4 pb-8">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="flex-1" style={{ height: `${Math.random() * 60 + 20}%` }} />
      ))}
    </div>
  )
}

function EmptyState() {
  const { t } = useTranslation("reports")
  return (
    <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
      {t("noData")}
    </div>
  )
}

function ChartCard({
  title,
  loading,
  isEmpty,
  height,
  children,
}: {
  title: string
  loading?: boolean
  isEmpty: boolean
  height?: number
  children: ReactNode
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <ChartSkeleton />
        ) : isEmpty ? (
          <EmptyState />
        ) : (
          <div style={{ height: height ?? 300 }}>{children}</div>
        )}
      </CardContent>
    </Card>
  )
}

const axisStyle = { fontSize: 12, fill: "var(--color-muted-foreground)" }
const gridStyle = { stroke: "var(--color-border)", strokeDasharray: "3 3" }
const tooltipContentStyle = {
  backgroundColor: "var(--color-popover)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-lg)",
  color: "var(--color-popover-foreground)",
  fontSize: 13,
}
const legendStyle = { fontSize: 12, fill: "var(--color-foreground)" }

export function LineChartCard({ title, data, dataKeys, loading, height }: LineChartCardProps) {
  return (
    <ChartCard title={title} loading={loading} isEmpty={data.length === 0} height={height}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid {...gridStyle} />
          <XAxis dataKey={dataKeys.xKey} tick={axisStyle} tickLine={false} axisLine={false} />
          <YAxis tick={axisStyle} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={tooltipContentStyle} />
          <Legend wrapperStyle={legendStyle} />
          {dataKeys.lines.map((line, index) => (
            <Line
              key={line.key}
              type="monotone"
              dataKey={line.key}
              name={line.name}
              stroke={line.color ?? CHART_COLORS[index % CHART_COLORS.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

export function BarChartCard({ title, data, dataKeys, loading, height }: BarChartCardProps) {
  return (
    <ChartCard title={title} loading={loading} isEmpty={data.length === 0} height={height}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid {...gridStyle} />
          <XAxis dataKey={dataKeys.xKey} tick={axisStyle} tickLine={false} axisLine={false} />
          <YAxis tick={axisStyle} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={tooltipContentStyle} />
          <Legend wrapperStyle={legendStyle} />
          {dataKeys.bars.map((bar, index) => (
            <Bar
              key={bar.key}
              dataKey={bar.key}
              name={bar.name}
              fill={bar.color ?? CHART_COLORS[index % CHART_COLORS.length]}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

export function AreaChartCard({ title, data, dataKeys, loading, height }: AreaChartCardProps) {
  return (
    <ChartCard title={title} loading={loading} isEmpty={data.length === 0} height={height}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid {...gridStyle} />
          <XAxis dataKey={dataKeys.xKey} tick={axisStyle} tickLine={false} axisLine={false} />
          <YAxis tick={axisStyle} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={tooltipContentStyle} />
          <Legend wrapperStyle={legendStyle} />
          {dataKeys.areas.map((area, index) => (
            <Area
              key={area.key}
              type="monotone"
              dataKey={area.key}
              name={area.name}
              stroke={area.color ?? CHART_COLORS[index % CHART_COLORS.length]}
              fill={area.color ?? CHART_COLORS[index % CHART_COLORS.length]}
              fillOpacity={0.15}
              strokeWidth={2}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

export function PieChartCard({ title, data, dataKey, nameKey, loading, height }: PieChartCardProps) {
  return (
    <ChartCard title={title} loading={loading} isEmpty={data.length === 0} height={height}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <Pie
            data={data}
            dataKey={dataKey}
            nameKey={nameKey}
            cx="50%"
            cy="50%"
            outerRadius={100}
            label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
          >
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={CHART_COLORS[index % CHART_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipContentStyle} />
          <Legend wrapperStyle={legendStyle} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

export function DonutChartCard({
  title,
  data,
  dataKey,
  nameKey,
  loading,
  height,
  innerRadius = 60,
}: DonutChartCardProps) {
  return (
    <ChartCard title={title} loading={loading} isEmpty={data.length === 0} height={height}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <Pie
            data={data}
            dataKey={dataKey}
            nameKey={nameKey}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={100}
            label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
          >
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={CHART_COLORS[index % CHART_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipContentStyle} />
          <Legend wrapperStyle={legendStyle} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

export function StackedBarChartCard({
  title,
  data,
  dataKeys,
  loading,
  height,
}: StackedBarChartCardProps) {
  return (
    <ChartCard title={title} loading={loading} isEmpty={data.length === 0} height={height}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid {...gridStyle} />
          <XAxis dataKey={dataKeys.xKey} tick={axisStyle} tickLine={false} axisLine={false} />
          <YAxis tick={axisStyle} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={tooltipContentStyle} />
          <Legend wrapperStyle={legendStyle} />
          {dataKeys.bars.map((bar, index) => (
            <Bar
              key={bar.key}
              dataKey={bar.key}
              name={bar.name}
              stackId="stack"
              fill={bar.color ?? CHART_COLORS[index % CHART_COLORS.length]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
