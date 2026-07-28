import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "./empty-state"
import { Package } from "lucide-react"

interface Column {
  header: string
  accessor: string
}

interface TablePlaceholderProps {
  columns: Column[]
  data?: Record<string, string | number>[]
  emptyTitle?: string
  emptyDescription?: string
}

const defaultData: Record<string, string | number>[] = [
  { name: "Brake Pads (Ceramic)", sku: "BP-001", category: "Brakes", price: "$45.99", stock: 24 },
  { name: "Oil Filter (Premium)", sku: "OF-002", category: "Engine", price: "$12.99", stock: 156 },
  { name: "Alternator (Reman)", sku: "ALT-003", category: "Electrical", price: "$189.00", stock: 8 },
  { name: "Battery (AGM 650CCA)", sku: "BAT-004", category: "Electrical", price: "$159.99", stock: 12 },
  { name: "Spark Plug (Iridium)", sku: "SP-005", category: "Engine", price: "$8.49", stock: 320 },
]

export function TablePlaceholder({ columns, data, emptyTitle, emptyDescription }: TablePlaceholderProps) {
  const tableData = data || defaultData

  if (!columns.length) {
    return (
      <EmptyState
        icon={<Package className="h-8 w-8 text-muted-foreground" />}
        title={emptyTitle || "No data yet"}
        description={emptyDescription || "This feature is coming soon. Stay tuned!"}
      />
    )
  }

  return (
    <Card>
      <CardContent className="p-0 overflow-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              {columns.map((col) => (
                <th key={col.accessor} className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, idx) => (
              <tr key={idx} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                {columns.map((col) => (
                  <td key={col.accessor} className="px-4 py-3 text-sm">
                    {String(row[col.accessor] ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}
