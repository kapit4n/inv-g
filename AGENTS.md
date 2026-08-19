# Project Rules

## Progress Tracking

After completing any work (fix, feature, refactor, etc.), update the progress documentation:

1. **Update ROADMAP.md** — Mark completed milestones as ✅ with the commit hash and date.
2. **Update milestone file** — If working on a milestone without a progress file, create `docs/progress/MILESTONE_XX.md` following the existing format (summary, deliverables, files created/modified, known issues).
3. **Update anchored summary** — Keep the conversation's anchored summary accurate so the next session can pick up seamlessly.

## Bug Fix Documentation

When fixing any bug (compilation error, runtime crash, logic error, data issue):

1. **Log the fix** — Add an entry to `docs/BUG_FIX_LOG.md` at the top with: date, symptom, root cause, fix, affected files, and commit hash.
2. **Be thorough** — Include the investigation steps that led to the root cause so future sessions don't repeat the same analysis.
3. **Update the first entry** — If the current session's first BUG_FIX_LOG entry is incomplete (e.g., root cause or fix is still TBD), update it once the bug is fully resolved before committing.

## Testing

- **`npm run verify`** — Full quality gate: typecheck → lint → vitest → rust test
- **`npm test`** — Run all Vitest unit/integration/regression/smoke/tauri tests
- **`npm run test:watch`** — Watch mode
- **`npm run test:coverage`** — With coverage report (thresholds: statements ≥80%, branches ≥75%, functions ≥80%, lines ≥80%)
- **`npm run test:rust`** — Run Rust backend tests
- **`npm run test:unit`** / **`test:integration`** / **`test:regression`** / **`test:smoke`** / **`test:tauri`** — Individual test suites
- **`cargo test`** (in `src-tauri/`) — Rust tests

Tests are in `tests/` (frontend Vitest) and `src-tauri/src/` (Rust `#[cfg(test)]`).

## Commit Convention

- Group related changes into a single commit.
- Use `Milestone X: Title` as the commit message header for milestone work.
- List key changes as bullet points in the commit body.

## Documentation

User documentation lives in `docs-site/` and is built with VitePress.

### Rule: Documentation is Part of the Product

Every new feature MUST include its documentation. A feature is not complete without docs.

When implementing a new feature:

1. **Implement the feature** (code, tests, i18n)
2. **Create/update documentation** in `docs-site/`:
   - Create or update the relevant `.md` page
   - Follow the existing page structure (What is it, How to access, How to use, Considerations)
   - Add screenshots if the UI changed
   - Update the sidebar in `docs-site/.vitepress/config.ts` if a new page was added
3. **Update CHANGELOG** — Add entry to `docs/CHANGELOG.md`
4. **Build docs** — Run `npm run docs:build` to verify
5. **Update IMPLEMENTATION_STATUS** — Check off completed items

### Documentation Structure

```
docs-site/
├── getting-started/   # Introduction, installation, login, first steps
├── dashboard/         # Dashboard overview
├── inventory/         # Products, categories, warehouses, stock, cross-refs
├── sales/             # POS, history, quotes, returns, cash register, closeout
├── purchases/         # Orders, receiving, supplier products
├── crm/               # Customers, vehicles, reminders, credit
├── manual/            # Part finder, manual landing page
├── reports/           # All report types
├── admin/             # Users, roles, settings, database, diagnostics
├── settings/          # User settings, help
├── troubleshooting/   # Common problems
└── developer/         # Architecture, development, testing
```

### Page Structure Convention

Each documentation page should follow this structure:

```markdown
# Module Name

## What is it?
## What is it for?
## How to Access
## How to Use
### Step 1: ...
### Step 2: ...
## Considerations
## Related
```

### Screenshot Convention

Screenshots are in `docs-site/public/screenshots/light/` and `dark/`.
Reference from Markdown: `![Alt text](/screenshots/light/XX-name.png)`

### Commands

- `npm run docs:dev` — VitePress dev server (hot reload)
- `npm run docs:build` — Build to public/manual/
- `npm run docs:pdf` — Generate PDF (requires Playwright)

