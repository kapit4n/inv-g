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
