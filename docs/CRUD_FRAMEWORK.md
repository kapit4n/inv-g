# CRUD Framework

## Architecture

```
src/
  types/crud.ts          - Generic CRUD type definitions
  lib/
    validation/          - Centralized validation system
    repository/          - Repository pattern (base class)
    mappers.ts           - Data mapping utilities
    pagination.ts        - Pagination utilities
    sorting.ts           - Sorting utilities
    filtering.ts         - Filtering utilities
    export.ts            - Export/Import services (CSV, JSON, XLSX)
  services/
    crud.service.ts      - Generic CRUD service
  components/
    data-table/          - Reusable DataTable component
    forms/               - Reusable form field components
    dialogs/             - Alert dialog, Confirm, Prompt, Delete
    entity/              - Entity page layouts + components
  hooks/
    use-crud.ts          - TanStack Query CRUD operations
    use-entity.ts        - Entity form state management
    use-data-table.ts    - DataTable state (page, sort, search, selection)
    use-search.ts        - Debounced search
    use-filters.ts       - Filter management
    use-pagination.ts    - Pagination state
    use-selection.ts     - Row selection state
```

## Core Principles

1. **Reusability** - Every component is generic and type-safe
2. **Consistency** - All modules look identical (spacing, buttons, tables, forms)
3. **Type Safety** - Full TypeScript generics throughout
4. **Localization** - All text passes through i18n (keys in `validation.json` namespace)
5. **Progressive Enhancement** - Start simple, add complexity as needed

## Creating a New Module

### 1. Create types

```typescript
interface MyEntity extends CrudEntity {
  id: number
  name: string
  // ...
}
```

### 2. Create repository

```typescript
class MyRepository extends BaseRepository<MyEntity> {
  // implement abstract methods
}
```

### 3. Create service

```typescript
const myService = new CrudService<MyEntity>({
  repository: new MyRepository(),
  entityName: "My Entity",
})
```

### 4. Create page

```typescript
export function MyListPage() {
  const crud = useCrud({ service: myService, queryKey: "myEntity", page, pageSize, sort, search })

  return (
    <EntityListPage title={t("myEntity.title")}>
      <DataTable
        data={crud.data}
        columns={columns}
        total={crud.total}
        onAdd={() => navigate("new")}
        // ...
      />
    </EntityListPage>
  )
}
```

## Component Reference

### DataTable

Props: `DataTableProps<T>`

- `data` - Array of records
- `columns` - Column definitions (sortable, filterable, searchable, hidden, width, align)
- `loading` / `error` - States
- `page` / `pageSize` / `sort` / `search` - State
- `onPageChange` / `onPageSizeChange` / `onSort` / `onSearch` - Events
- `onRowClick` - Row click handler
- `onSelectionChange` - Selection handler
- `actions` - Row action buttons
- `bulkActions` - Bulk action buttons
- `onAdd` / `onRefresh` / `onExport` / `onImport` - Toolbar buttons
- `selectedIds` - Controlled selection
- `stickyHeader` - Sticky header (default: true)
- `searchPlaceholder` - Search input placeholder
- `disableSearch` / `disableColumnToggle` - Feature toggles

Features:
- Sorting (click column header, cycle: asc → desc → none)
- Pagination (first, prev, next, last, page numbers, page size selector)
- Column visibility (dropdown menu)
- Search (debounced 300ms)
- Row selection + bulk actions
- Loading skeleton
- Error state with retry
- Empty state
- Results counter

### Form Fields

All form components follow the same pattern:

```typescript
<TextField
  name="fieldName"
  label="Field Label"
  error={errors.fieldName}
  description="Help text"
  required
  onChange={...}
/>
```

Available fields:
- `TextField` - Text input
- `NumberField` - Number input (min, max, step)
- `EmailField` - Email with mail icon
- `PhoneField` - Phone with phone icon
- `CurrencyField` - Currency with $ prefix
- `TextareaField` - Multi-line text
- `SelectField` - Dropdown (uses Radix Select)
- `CheckboxField` - Checkbox with label
- `SwitchField` - Toggle switch
- `DateField` - Date picker input

### Dialogs

- `ConfirmDialog` - Generic confirm/cancel
- `PromptDialog` - Text input prompt
- `DeleteDialog` - Delete confirmation (destructive)
- `ArchiveDialog` - Archive confirmation
- `RestoreDialog` - Restore confirmation

### Entity Layouts

- `EntityListPage` - List page (header + breadcrumb + content)
- `EntityFormPage` - Form page (back button + header + form)
- `EntityDetailPage` - Detail page (back + edit + loading)
- `EntityInfoCard` - Info card with label/value rows
- `EntityActionBar` - Action buttons (save, delete, archive, duplicate, restore)
- `EntityHeader` - Title + description + actions + breadcrumb

### Hooks

- `useCrud` - TanStack Query CRUD (paginate, create, update, delete, archive, restore)
- `useEntity` - Form state (dirty tracking, save, reset)
- `useDataTable` - Table state (page, sort, search, selection)
- `useSearch` - Debounced search input
- `useFilters` - Filter list management
- `usePagination` - Page state + navigation
- `useSelection` - Row selection

### Validation

Located in `src/lib/validation/`:

- `schemas.ts` - Zod schema factories (createRequiredString, createEmailSchema, etc.)
- `validators.ts` - createValidator, validateField, validateForm
- `errors.ts` - ValidationErrors class

### Repository Pattern

Located in `src/lib/repository/`:

- `BaseRepository<T>` - Abstract class with 11 methods
- `Repository<T>` - Interface

Methods: findAll, findById, search, paginate, create, update, delete, archive, restore, count, exists

### Import/Export

Located in `src/lib/export.ts`:

- `ExportService` - CSV, JSON (XLSX placeholder)
- `ImportService` - CSV, JSON (XLSX placeholder)

## Best Practices

1. Always use the form field components instead of raw `<input>` elements
2. Use `useCrud` hook for data fetching and mutations
3. Use `useDataTable` hook for table state management
4. Define columns as a constant outside the component
5. Use `EntityListPage` / `EntityFormPage` / `EntityDetailPage` for page layout
6. Use the validation system for form validation
7. All user-facing text must use `t()` from i18n
8. New modules should follow the same structure as existing CRUD pages
