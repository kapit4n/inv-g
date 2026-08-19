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
  { id: "globalSearch", keys: "Ctrl+F", scope: "global", category: "navigation", actionKey: "help.shortcuts.globalSearch" },
  { id: "toggleSidebar", keys: "Ctrl+B", scope: "global", category: "appearance", actionKey: "help.shortcuts.toggleSidebar" },
  { id: "newSale", keys: "Ctrl+N", scope: "global", category: "actions", actionKey: "help.shortcuts.newSale" },
  { id: "newPurchaseOrder", keys: "Ctrl+Shift+P", scope: "global", category: "actions", actionKey: "help.shortcuts.newPurchaseOrder" },
  { id: "save", keys: "Ctrl+S", scope: "global", category: "actions", actionKey: "help.shortcuts.save" },
  { id: "print", keys: "Ctrl+P", scope: "global", category: "actions", actionKey: "help.shortcuts.print" },
  { id: "toggleTheme", keys: "Ctrl+Shift+D", scope: "global", category: "appearance", actionKey: "help.shortcuts.toggleTheme" },
  { id: "close", keys: "Escape", scope: "global", category: "navigation", actionKey: "help.shortcuts.close" },
  { id: "productSearch", keys: "F2", scope: "pos", category: "pos", actionKey: "help.shortcuts.productSearch" },
  { id: "customerSearch", keys: "F4", scope: "pos", category: "pos", actionKey: "help.shortcuts.customerSearch" },
  { id: "vehicleSearch", keys: "F6", scope: "pos", category: "pos", actionKey: "help.shortcuts.vehicleSearch" },
  { id: "focusPayment", keys: "F10", scope: "pos", category: "pos", actionKey: "help.shortcuts.focusPayment" },
]

export const shortcutCategories: { id: ShortcutCategory; label: string }[] = [
  { id: "navigation", label: "commandPalette.categories.navigation" },
  { id: "actions", label: "commandPalette.categories.actions" },
  { id: "pos", label: "help.shortcutCategories.pos" },
  { id: "appearance", label: "commandPalette.categories.appearance" },
]
