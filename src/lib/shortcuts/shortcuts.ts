export type ShortcutScope = "global" | "pos"

export type ShortcutCategory = "navigation" | "actions" | "pos" | "appearance"

export interface ShortcutDefinition {
  id: string
  keys: string
  scope: ShortcutScope
  category: ShortcutCategory
  actionKey: string
}

export const shortcuts: ShortcutDefinition[] = [
  { id: "commandPalette", keys: "Ctrl+K", scope: "global", category: "navigation", actionKey: "help.shortcuts.commandPalette" },
  { id: "toggleSidebar", keys: "Ctrl+B", scope: "global", category: "appearance", actionKey: "help.shortcuts.toggleSidebar" },
  { id: "newSale", keys: "Ctrl+N", scope: "global", category: "actions", actionKey: "help.shortcuts.newSale" },
  { id: "newPurchaseOrder", keys: "Ctrl+Shift+P", scope: "global", category: "actions", actionKey: "help.shortcuts.newPurchaseOrder" },
  { id: "toggleTheme", keys: "Ctrl+Shift+D", scope: "global", category: "appearance", actionKey: "help.shortcuts.toggleTheme" },
  { id: "customerSearch", keys: "F2", scope: "pos", category: "pos", actionKey: "help.shortcuts.customerSearch" },
  { id: "focusPayment", keys: "F4", scope: "pos", category: "pos", actionKey: "help.shortcuts.focusPayment" },
  { id: "checkout", keys: "F10", scope: "pos", category: "pos", actionKey: "help.shortcuts.checkout" },
  { id: "close", keys: "Escape", scope: "global", category: "navigation", actionKey: "help.shortcuts.close" },
]

export const shortcutCategories: { id: ShortcutCategory; label: string }[] = [
  { id: "navigation", label: "commandPalette.categories.navigation" },
  { id: "actions", label: "commandPalette.categories.actions" },
  { id: "pos", label: "help.shortcutCategories.pos" },
  { id: "appearance", label: "commandPalette.categories.appearance" },
]
