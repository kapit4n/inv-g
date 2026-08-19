# Testing

## Test Structure

```
tests/
├── unit/              # Unit tests (Vitest)
│   ├── components/    # React component tests
│   └── ...
├── integration/       # Integration tests
├── regression/        # Regression tests
├── smoke/             # Smoke tests
├── tauri/             # Tauri-specific tests
└── helpers/           # Test utilities
```

## Running Tests

```bash
npm run verify               # Full quality gate (typecheck + lint + vitest + rust)
npm test                     # All Vitest tests
npm run test:unit            # Unit tests only
npm run test:integration     # Integration tests only
npm run test:regression      # Regression tests only
npm run test:smoke           # Smoke tests only
npm run test:tauri           # Tauri tests only
npm run test:rust            # Rust backend tests only
npm run test:watch           # Watch mode
npm run test:coverage        # With coverage report
```

## Rust Tests

```bash
cd src-tauri && cargo test
```

## Writing Tests

### Component Tests

```typescript
import { render, screen, fireEvent, waitFor } from "@tests/helpers/render"
import { MyComponent } from "@/features/my-feature"

describe("MyComponent", () => {
  it("renders correctly", () => {
    render(<MyComponent />)
    expect(screen.getByText("Hello")).toBeInTheDocument()
  })
})
```

### Test Helpers

The project provides custom render utilities:
```typescript
import { render, screen, fireEvent, waitFor } from "@tests/helpers/render"
```

This wraps components with QueryClient, Router, and Theme providers.

## Coverage Thresholds

| Metric | Threshold |
|--------|-----------|
| Statements | >= 80% |
| Branches | >= 75% |
| Functions | >= 80% |
| Lines | >= 80% |

## Related

- [Development Guide](/developer/development)
- [Architecture](/developer/architecture)
