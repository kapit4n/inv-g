import type { ExportConfig, ImportResult } from "@/types/crud"

export class ExportService {
  async exportData<T extends Record<string, unknown>>(
    data: T[],
    config: ExportConfig
  ): Promise<void> {
    switch (config.format) {
      case "csv":
        return this.exportCSV(data, config)
      case "json":
        return this.exportJSON(data, config)
      case "xlsx":
        return this.exportXLSX(data, config)
    }
  }

  private async exportCSV<T extends Record<string, unknown>>(
    data: T[],
    config: ExportConfig
  ): Promise<void> {
    const headers = config.columns.join(",")
    const rows = data.map((row) =>
      config.columns
        .map((col) => {
          const val = row[col]
          if (val === null || val === undefined) return ""
          const str = String(val)
          return str.includes(",") || str.includes('"') || str.includes("\n")
            ? `"${str.replace(/"/g, '""')}"`
            : str
        })
        .join(",")
    )
    const csv = [headers, ...rows].join("\n")
    this.download(csv, `${config.filename}.csv`, "text/csv")
  }

  private async exportJSON<T extends Record<string, unknown>>(
    data: T[],
    config: ExportConfig
  ): Promise<void> {
    const filtered = data.map((row) => {
      const obj: Record<string, unknown> = {}
      config.columns.forEach((col) => {
        obj[col] = row[col]
      })
      return obj
    })
    const json = JSON.stringify(filtered, null, 2)
    this.download(json, `${config.filename}.json`, "application/json")
  }

  private async exportXLSX<T extends Record<string, unknown>>(
    _data: T[],
    _config: ExportConfig
  ): Promise<void> {
    console.warn("XLSX export not yet implemented")
  }

  private download(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
}

export class ImportService {
  async importCSV(_file: File): Promise<ImportResult> {
    console.warn("CSV import not yet implemented")
    return { success: 0, errors: 0, total: 0, details: [] }
  }

  async importJSON(_file: File): Promise<ImportResult> {
    console.warn("JSON import not yet implemented")
    return { success: 0, errors: 0, total: 0, details: [] }
  }

  async importXLSX(_file: File): Promise<ImportResult> {
    console.warn("XLSX import not yet implemented")
    return { success: 0, errors: 0, total: 0, details: [] }
  }
}

export const exportService = new ExportService()
export const importService = new ImportService()
