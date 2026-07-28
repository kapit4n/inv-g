# Coding Guidelines

## TypeScript

- Strict mode enabled
- No `any` types (use `unknown` with type narrowing)
- Prefer interfaces for object shapes
- Use `readonly` for immutable data
- Named exports preferred

## React

- Functional components only
- Use hooks for state and effects
- Prefer composition over props drilling
- Keep components focused and small
- Co-locate related files in feature folders

## Naming Conventions

- **Files:** `kebab-case.tsx` for components, `kebab-case.ts` for utilities
- **Components:** `PascalCase` (e.g., `StatCard`)
- **Functions:** `camelCase` (e.g., `formatCurrency`)
- **Constants:** `UPPER_SNAKE_CASE` (e.g., `API_BASE_URL`)
- **Types/Interfaces:** `PascalCase` (e.g., `UserProfile`)

## File Organization

- One component per file
- Export from `index.ts` barrel files
- Keep imports organized: external → internal → relative
