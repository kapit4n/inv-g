# Keyboard Shortcuts

> Complete list of keyboard shortcuts available throughout the application.

---

## Global Shortcuts

These shortcuts work from anywhere in the application.

| Shortcut | Action | Notes |
|---|---|---|
| **Ctrl+K** (Windows/Linux) | Open Command Palette | Quick navigation to any module |
| **Cmd+K** (macOS) | Open Command Palette | Quick navigation to any module |
| **Escape** | Close Command Palette | Also closes open dialogs/modals |
| **Escape** | Clear POS search | Refocuses the search input |

## Theme Toggle

| Shortcut | Action |
|---|---|
| (via Command Palette) | Toggle dark/light/system theme |

The Command Palette (Ctrl+K) includes a "Toggle dark mode" command.

---

## Point of Sale (POS) Shortcuts

Available on the POS page (`/sales/new`).

| Shortcut | Action |
|---|---|
| **Escape** | Clear search field and refocus |
| **F1** | Quick action 1 (configurable) |
| **F2** | Quick action 2 (configurable) |
| **F3** | Quick action 3 (configurable) |
| **F4** | Quick action 4 (configurable) |
| Click product card | Add to cart (1 unit) |
| **+** button (cart) | Increase item quantity by 1 |
| **-** button (cart) | Decrease item quantity by 1 |
| Click Trash icon (cart) | Remove item from cart |

**Note:** POS uses button clicks rather than keyboard combinations for quantity changes to prevent accidental inputs during fast-paced checkout.

---

## Navigation Shortcuts

| Shortcut | Action |
|---|---|
| **Ctrl+K** then type module name | Navigate to any module |
| Sidebar toggle (bottom button) | Expand/collapse sidebar |

---

## Dialog Shortcuts

| Shortcut | Action |
|---|---|
| **Escape** | Close dialog / cancel |
| **Enter** | Confirm / submit (within dialogs) |
| **Tab** | Move to next form field |
| **Shift+Tab** | Move to previous form field |

---

## Data Table Shortcuts

Common patterns in list pages (Products, Customers, Sales, etc.).

| Shortcut | Action |
|---|---|
| Click column header | Sort ascending/descending |
| Type in search box | Filter results |
| Click row | Navigate to detail page |
| Pagination controls | Navigate between pages |

---

## Form Shortcuts

| Shortcut | Action |
|---|---|
| **Tab** | Next field |
| **Shift+Tab** | Previous field |
| **Enter** | Submit form (in single-field forms) |
| **Escape** | Cancel / close form |

---

## Report Shortcuts

| Shortcut | Action |
|---|---|
| Click filter button | Open report filters |
| Click date presets | Quick date range selection |
| Click export button | Export report data |
| Click chart element | Drill-down (where available) |

---

## General UI Patterns

| Interaction | Action |
|---|---|
| Click notification | View details |
| Click "X" on toast | Dismiss notification |
| Hover sidebar icon (collapsed) | Show tooltip |
| Click chevron on sidebar item | Expand/collapse submenu |
| Click "View All" | Navigate to full list |
| Back button / browser back | Navigate to previous page |

---

## Search Shortcuts

| Shortcut | Action |
|---|---|
| Type in search box | Real-time filtering (debounced) |
| Select from dropdown | Customer/product selection |
| **Escape** (POS) | Clear search |

---

## Notes

- All shortcuts are for the desktop application (Tauri). Browser keyboard handling may differ slightly.
- POS function keys (F1–F4) are reserved for future customization.
- The Command Palette is the primary way to quickly navigate without using the mouse.
- Accessibility: All interactive elements are keyboard-focusable via Tab navigation.
