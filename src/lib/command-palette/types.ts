import type { LucideIcon } from "lucide-react"

export interface Command {
  id: string
  label: string
  category: CommandCategory
  icon: LucideIcon
  shortcut?: string
  keywords?: string[]
  action: () => void
}

export type CommandCategory = "navigation" | "action" | "appearance"

export interface CommandCategoryConfig {
  id: CommandCategory
  label: string
}
