import { Skeleton } from "@/components/ui/skeleton"
import type { ReactNode } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export interface Column {
  key: string
  label: string
  format?: "currency" | "percent" | "number"
  renderCell?: (value: unknown, row: Record<string, unknown>) => ReactNode
}

export interface ReportTableProps {
  columns: Column[]
  data: Record<string, unknown>[]
  loading?: boolean
}

function formatValue(value: unknown, format?: Column["format"]): string {
  if (value === null || value === undefined) return "-"
  const num = Number(value)
  if (Number.isNaN(num)) return String(value)

  switch (format) {
    case "currency":
      return `$${num.toFixed(2)}`
    case "percent":
      return `${num.toFixed(1)}%`
    case "number":
      return num.toLocaleString("en-US")
    default:
      return String(value)
  }
}

function TableSkeleton({ columns }: { columns: Column[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((col) => (
            <TableHead key={col.key}>{col.label}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 5 }).map((_, rowIdx) => (
          <TableRow key={rowIdx}>
            {columns.map((col) => (
              <TableCell key={col.key}>
                <Skeleton className="h-4 w-full max-w-[120px]" />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function EmptyTable({ columns }: { columns: Column[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((col) => (
            <TableHead key={col.key}>{col.label}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell
            colSpan={columns.length}
            className="h-32 text-center text-muted-foreground"
          >
            No data
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  )
}

export function ReportTable({ columns, data, loading }: ReportTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      {loading ? (
        <TableSkeleton columns={columns} />
      ) : data.length === 0 ? (
        <EmptyTable columns={columns} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key}>{col.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, rowIdx) => (
              <TableRow key={rowIdx}>
                {columns.map((col) => (
                  <TableCell key={col.key}>
                    {col.renderCell ? col.renderCell(row[col.key], row) : formatValue(row[col.key], col.format)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
