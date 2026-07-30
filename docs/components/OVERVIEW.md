# Frontend Component Architecture

**Framework:** React 18 + TypeScript  
**Build:** Vite  
**UI Library:** shadcn/ui (Radix primitives + TailwindCSS)  
**State:** Zustand (client) + React Query (server)  
**Location:** `src/components/`

---

## UI Primitives (21 components)

Located in `src/components/ui/`. These are thin wrappers around Radix UI primitives with project-specific styling via TailwindCSS `cn()` utility.

| Component | File | Purpose | When to Use |
|-----------|------|---------|-------------|
| `Button` | `button.tsx` | Styled button with variants (default, destructive, outline, secondary, ghost, link) + sizes | Any clickable action |
| `Card` | `card.tsx` | Container with header, content, footer slots | Grouping related content, dashboards, detail panels |
| `Dialog` | `dialog.tsx` | Modal dialog with title, description, close button | Forms, confirmations, detail views in overlay |
| `Popover` | `popover.tsx` | Floating panel triggered by click | Dropdown menus, quick-selectors, filters |
| `Table` | `table.tsx` | Semantic table elements (Header, Body, Row, Cell, Head) | Raw HTML table structure (DataTable wrapper preferred) |
| `Tabs` | `tabs.tsx` | Tab navigation with content panels | Multi-section forms, detail views with categories |
| `Badge` | `badge.tsx` | Small label with variant colors (default, secondary, destructive, outline) | Status indicators, tags, counts |
| `Input` | `input.tsx` | Text input with Tailwind styling | Single-line text entry |
| `Select` | — (in `select.tsx` or similar) | Native/radix select dropdown | Picking from predefined options |
| `Switch` | `switch.tsx` | Toggle switch for boolean settings | Enable/disable toggles |
| `Checkbox` | `checkbox.tsx` | Checkbox with checked/indeterminate states | Multi-select, agreement checkboxes |
| `Textarea` | `textarea.tsx` | Multi-line text input | Longer text entry (notes, descriptions) |
| `Separator` | `separator.tsx` | Horizontal or vertical visual divider | Section separation in forms, menus |
| `Label` | `label.tsx` | Form label with accessibility binding | Form field labels |
| `Skeleton` | `skeleton.tsx` | Loading placeholder animation | Content loading states |
| `Tooltip` | `tooltip.tsx` | Hover tooltip with delay | Additional info on hover |
| `Avatar` | `avatar.tsx` | User avatar with fallback initials | User profile images |
| `Progress` | `progress.tsx` | Progress bar | Loading progress, usage meters |
| `ScrollArea` | `scroll-area.tsx` | Custom scrollable container | Long lists, code blocks |
| `Collapsible` | `collapsible.tsx` | Expand/collapse section | Accordion panels, advanced filters |
| `DropdownMenu` | `dropdown-menu.tsx` | Context menu with items, separators, sub-menus | Action menus on rows, toolbar menus |

**Example usage:**
```tsx
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

<Card>
  <CardHeader>Product Details</CardHeader>
  <CardContent>
    <Badge variant="secondary">{status}</Badge>
    <Button onClick={handleSave}>Save</Button>
  </CardContent>
</Card>
```

---

## Form Components (13 components)

Located in `src/components/forms/`. Each wraps a UI primitive with label, error display, and optional description using `FormFieldWrapper`.

### FormFieldWrapper

The base layout wrapper for all form fields.

```tsx
// form-field.tsx
<FormFieldWrapper label="Name" error={errors.name} required>
  <Input value={name} onChange={...} />
</FormFieldWrapper>
```

| Component | File | Purpose | Props |
|-----------|------|---------|-------|
| `FormFieldWrapper` | `form-field.tsx` | Wraps any input with label, error, description, required indicator | `label?`, `error?`, `description?`, `required?`, `children` |
| `TextField` | `text-field.tsx` | Single-line text input with validation | `label`, `value`, `onChange`, `error?`, `placeholder?` |
| `NumberField` | `number-field.tsx` | Numeric input with min/max/step | `label`, `value`, `onChange`, `min?`, `max?`, `step?` |
| `SelectField` | `select-field.tsx` | Dropdown with options array | `label`, `options`, `value`, `onChange` |
| `DateField` | `date-field.tsx` | Date picker input | `label`, `value`, `onChange` |
| `TextareaField` | `textarea-field.tsx` | Multi-line text field | `label`, `value`, `onChange`, `rows?` |
| `SwitchField` | `switch-field.tsx` | Boolean toggle with label | `label`, `checked`, `onChange` |
| `CheckboxField` | `checkbox-field.tsx` | Checkbox with label | `label`, `checked`, `onChange` |
| `CurrencyField` | `currency-field.tsx` | Currency input with formatting | `label`, `value`, `onChange`, `currency?` |
| `PhoneField` | `phone-field.tsx` | Phone number input | `label`, `value`, `onChange` |
| `EmailField` | `email-field.tsx` | Email input with validation | `label`, `value`, `onChange` |
| `CustomerSearchField` | `customer-search-field.tsx` | Customer search with autocomplete | `label`, `value`, `onChange`, `onSelect` |

**Form validation pattern:**
```tsx
const [errors, setErrors] = useState<Record<string, string>>({})

<TextField
  label="Product Name"
  value={name}
  onChange={setName}
  error={errors.name}
  required
/>
```

---

## DataTable Component

**File:** `src/components/data-table/data-table.tsx`

A feature-rich data table built on HTML `<table>` with:

### Capabilities
- **Sorting** — Click column headers to toggle asc/desc, `SortRequest` type
- **Filtering** — Search input with debounce, per-column filters
- **Pagination** — Page controls with configurable page sizes (10, 20, 30, 50, 100)
- **Selection** — Checkbox selection with `Set<string | number>`, bulk actions
- **Column visibility** — Toggle columns via dropdown menu
- **Actions** — Per-row action buttons (edit, delete, etc.)
- **Bulk actions** — Toolbar actions for selected rows
- **Export/Import** — Export to CSV, import from file (callbacks)
- **Loading state** — Skeleton loader while data loads
- **Empty state** — Custom empty message with icon
- **Error state** — Error message with retry

### Props Interface
```tsx
interface DataTableProps<T extends object> {
  data: T[]
  columns: TableColumn<T>[]
  total?: number
  loading?: boolean
  page?: number
  pageSize?: number
  sort?: SortRequest
  search?: string
  selectedIds?: Set<string | number>
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  onSort?: (sort: SortRequest | undefined) => void
  onSearch?: (query: string) => void
  onRowClick?: (row: T) => void
  onSelectionChange?: (ids: Set<string | number>) => void
  onAdd?: () => void
  onExport?: () => void
  onImport?: () => void
  actions?: TableAction<T>[]
  bulkActions?: BulkAction<T>[]
  rowId?: (row: T) => string | number
  emptyMessage?: string
}
```

### Column Definition Pattern
```typescript
// From src/types/crud.ts
interface TableColumn<T> {
  id: string
  header: string           // Column display name
  accessorKey?: keyof T    // Direct property access
  accessorFn?: (row: T) => ReactNode  // Custom render
  cell?: (props: { row: T; value: unknown }) => ReactNode  // Cell renderer
  enableSorting?: boolean
  enableHiding?: boolean
  size?: number
  meta?: { align?: "left" | "center" | "right" }
}
```

### Usage Example
```tsx
<DataTable
  data={products}
  columns={[
    { id: "name", header: "Name", accessorKey: "name", enableSorting: true },
    { id: "sku", header: "SKU", accessorKey: "sku" },
    { id: "stock", header: "Stock", accessorKey: "stockQuantity",
      cell: ({ value }) => <Badge variant={value < 10 ? "destructive" : "default"}>{value}</Badge>
    },
    { id: "price", header: "Price", accessorKey: "salePrice",
      cell: ({ value }) => `$${Number(value).toFixed(2)}`
    },
  ]}
  actions={[
    { label: "Edit", onClick: (row) => navigate(`/products/${row.id}/edit`) },
    { label: "Delete", onClick: (row) => openDeleteDialog(row.id), variant: "destructive" },
  ]}
  total={total}
  page={page}
  pageSize={pageSize}
  onPageChange={setPage}
  onSearch={setSearch}
  loading={isLoading}
/>
```

---

## Entity Components (7 components)

Located in `src/components/entity/`. These are reusable page-level components that create consistent layouts across all entity types (products, customers, sales, etc.).

### Layout Components

| Component | File | Purpose |
|-----------|------|---------|
| `EntityBreadcrumb` | `entity-breadcrumb.tsx` | Breadcrumb navigation showing entity hierarchy |
| `EntityHeader` | `entity-header.tsx` | Page title area with entity name, status badge, actions |
| `EntityActionBar` | `entity-action-bar.tsx` | Toolbar with search, add button, export, import, filters |
| `EntityInfoCard` | `entity-info-card.tsx` | Read-only info display with labeled fields in a card |

### Page Templates

| Component | File | Purpose |
|-----------|------|---------|
| `EntityListPage` | `entity-list-page.tsx` | Full list page: breadcrumb + header + action bar + DataTable + pagination |
| `EntityDetailPage` | `entity-detail-page.tsx` | Detail view: breadcrumb + header + info cards + related data tabs |
| `EntityFormPage` | `entity-form-page.tsx` | Create/Edit form: breadcrumb + header + form fields + submit/cancel |

### EntityLayoutPattern
```tsx
// Example: EntityListPage usage
<EntityListPage
  title="Products"
  entity="product"
  breadcrumb={[{ label: "Inventory" }, { label: "Products" }]}
  columns={productColumns}
  data={products}
  total={total}
  loading={isLoading}
  onAdd={() => navigate("/products/new")}
  onSearch={setSearch}
  onPageChange={setPage}
  actions={tableActions}
/>
```

---

## App-Level Components

### PageHeader
**File:** `page-header.tsx`

Top-of-page title area with optional actions, subtitle, and metadata.

```tsx
<PageHeader title="Sales Dashboard" subtitle="Overview of today's sales" actions={<Button>Export</Button>} />
```

### SearchBar
**File:** `search-bar.tsx`

Debounced search input with clear button, optional filter chips.

```tsx
<SearchBar value={search} onChange={setSearch} placeholder="Search products..." />
```

### StatCard
**File:** `stat-card.tsx`

KPI/metric display card with icon, label, value, trend indicator.

```tsx
<StatCard title="Total Sales" value="$12,450" icon={DollarSign} trend="+12%" />
```

### TablePlaceholder
**File:** `table-placeholder.tsx`

Customizable empty/animation state for data tables with no data.

### LoadingSkeleton
**File:** `loading-skeleton.tsx`

Skeleton loading placeholders for tables, cards, and detail views.

### EmptyState
**File:** `empty-state.tsx`

Illustrated empty state with icon, title, description, action button.

```tsx
<EmptyState
  icon={Package}
  title="No products yet"
  description="Create your first product to get started"
  action={<Button onClick={...}>Create Product</Button>}
/>
```

### ProtectedButton
**File:** `protected-button.tsx`

Button that checks for a required permission before allowing action.

```tsx
<ProtectedButton permission="inventory.create" onClick={handleCreate}>
  Add Product
</ProtectedButton>
```

### CommandPalette
**File:** `command-palette.tsx`

⌘K-style command palette for quick navigation and actions across the app.

### NotificationCenter
**File:** `notification-center.tsx`

Dropdown notification panel showing recent system notifications.

### ErrorBoundary
**File:** `error-boundary.tsx`

React error boundary that catches render errors and shows fallback UI.

### Error Pages
**File:** `error-pages.tsx`

404, 403, 500 page components.

### AuthGuards
**File:** `auth-guards.tsx`

Route guard components that redirect unauthenticated users.

```tsx
<ProtectedRoute><Dashboard /></ProtectedRoute>
<PublicRoute><LoginPage /></PublicRoute>
```

### PermissionGuard
**File:** `permission-guard.tsx`

Wraps UI sections and conditionally renders based on user permissions.

```tsx
<PermissionGuard permission="admin.users.manage">
  <UserManagementPanel />
</PermissionGuard>
```

---

## Dialog System

### CrudDialogs
**File:** `src/components/dialogs/crud-dialogs.tsx`

Pre-configured confirmation dialogs for CRUD operations.

| Component | Purpose |
|-----------|---------|
| `DeleteDialog` | "Are you sure you want to delete?" with destructive styling |
| `ArchiveDialog` | "Are you sure you want to archive?" — non-destructive, can restore |
| `RestoreDialog` | Confirm restoration of an archived entity |

### ConfirmDialog
**File:** `src/components/dialogs/confirm-dialog.tsx`

Generic confirmation dialog with:
- Title, description, confirm/cancel labels
- Variants (default, destructive)
- Loading state on confirm
- Controlled open/close

```tsx
<ConfirmDialog
  open={open}
  onOpenChange={setOpen}
  title="Confirm"
  description="Are you sure?"
  confirmLabel="Continue"
  variant="destructive"
  onConfirm={handleConfirm}
  loading={isLoading}
/>
```

### PromptDialog
**File:** `src/components/dialogs/prompt-dialog.tsx`

Dialog with text input for user prompts (reason, notes, name entry).

```tsx
<PromptDialog
  open={open}
  onOpenChange={setOpen}
  title="Reason for refund"
  value={reason}
  onChange={setReason}
  onConfirm={handleRefund}
/>
```

### Dialog Store
**File:** `src/stores/dialog.store.ts`

Zustand store for managing dialog state globally:

```typescript
interface DialogState {
  deleteDialog: { open: boolean; entityName?: string; onConfirm?: () => void }
  confirmDialog: { open: boolean; title?: string; message?: string }
  openDelete: (entity: string, onConfirm: () => void) => void
  openConfirm: (title: string, message: string) => void
  closeAll: () => void
}
```

---

## Component Hierarchy Example

A typical entity detail page uses these component layers:

```
┌─ PageLayout ─────────────────────────────────────────────────┐
│  ┌─ EntityBreadcrumb ──────────────────────────────────────┐ │
│  │  Inventory > Products > Brake Pads                      │ │
│  └─────────────────────────────────────────────────────────┘ │
│  ┌─ EntityHeader ───────────────────────────────────────────┐ │
│  │  Brake Pads (Bosch)          [Active] [Edit] [Archive]  │ │
│  ├──────────────────────────────────────────────────────────┤ │
│  │  SKU: BRK-BOSCH-001  Price: $35.00  Stock: 60 units     │ │
│  └──────────────────────────────────────────────────────────┘ │
│  ┌─ Tabs ───────────────────────────────────────────────────┐ │
│  │  [Details] [Compatibility] [Movements] [Images]          │ │
│  │                                                          │ │
│  │  ┌─ EntityInfoCard ─────────────────────────────────┐   │ │
│  │  │  Category: Brakes    Brand: Bosch                │   │ │
│  │  │  Min Stock: 5        Max Stock: 100              │   │ │
│  │  │  Warehouse: Main     Location: A-1-A-01          │   │ │
│  │  └──────────────────────────────────────────────────┘   │ │
│  │                                                          │ │
│  │  ┌─ DataTable (Compatibility) ─────────────────────┐    │ │
│  │  │  Vehicle Model           Year Range    Actions   │    │ │
│  │  │  Toyota Corolla E120     2000-2006      [✕]     │    │ │
│  │  │  Honda Civic FD          2005-2011      [✕]     │    │ │
│  │  └──────────────────────────────────────────────────┘   │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

---

## Key Design Decisions

1. **Composition over inheritance** — Components are composed (e.g., `EntityListPage` uses `DataTable` which uses `Table`, `Button`, `Input`, etc.)

2. **Controlled components** — All form inputs are controlled (value + onChange), no uncontrolled refs

3. **Centralized dialog state** — Dialog visibility is managed through the Zustand `dialogStore` to prevent prop drilling

4. **DataTable as generic** — The `DataTable` is fully generic over `<T extends object>`, accepting column definitions via `accessorKey` or `accessorFn`

5. **Permission-aware rendering** — `ProtectedButton` and `PermissionGuard` check the Zustand `authStore.permissions` array

6. **Error boundaries at route level** — Each major route section is wrapped with `ErrorBoundary` for isolated error handling
