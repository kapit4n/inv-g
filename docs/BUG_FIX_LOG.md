# Bug Fix Log

## Format

Each entry records: date, symptom, root cause, fix, commit. This log is append-only — add new entries at the top.

---

### 2026-09-28 — The demo catalog was cloned from, and activated into, the wrong database

**Symptom:** after a scripted first launch, logging in as the configured account
failed with "Credenciales inválidas" while the account demonstrably existed —
right role, active, correct bcrypt hash. The app log named the expected profile
and the right file. It was the app reading a *different* database than the one
that had been seeded.

**Root cause:** two places in `scripts/database/seed-demo-catalog.mjs` disagreed
about which database was active.

`usableSource` picked the clone source from a hardcoded candidate list ordered
`single-store, multi, default, empty`, ignoring `profile.json`. With any other
profile active it silently cloned a different database's users — so a config
provisioned specifically for the run was replaced by the six demo accounts.

`--activate` then wrote the finished catalog into the correct file (resolved
from `profile.json`) but hardcoded `profile.json` back to `"single-store"`. The
app came up on `single-store`, a file nothing had written to. The catalog build
and the profile pointer were each individually plausible and jointly wrong.

**Fix:** `usableSource` now tries the active profile first, falling back to the
old list. `--activate` no longer writes `profile.json` at all — the catalog goes
into the database that is already active, so the pointer is already correct. The
now-unused `writeFileSync` import was dropped.

---

### 2026-09-28 — Login was case-sensitive on the username, with no hint

**Symptom:** typing `Maria` returned "Credenciales inválidas" for an account that
was really named `maria`. Correct password, correct role, active, valid hash —
the same account accepted `maria` and rejected `Maria`.

**Root cause:** `users.username` is `TEXT NOT NULL UNIQUE` with no
`COLLATE NOCASE`, and SQLite's `=` is case-sensitive for text. The login screen
displays the full name ("María Flores"), which actively invites a capitalised
attempt, and the failure message is the same one used for a wrong password, so
there is nothing to tell the two apart.

**Fix:** `auth.rs` now matches with `WHERE u.username = ?1 COLLATE NOCASE`. That
was the only username comparison in the codebase.

**Not fixed here, both needing a migration rather than a query change:** the
`UNIQUE` constraint is equally case-sensitive, so `maria` and `Maria` can exist
as separate accounts; and `failed_login_attempts` / `is_locked` are in the schema
but login neither increments nor checks them, so there is no lockout.

---

### 2026-09-27 — The installer workflow rejected a version that was correct

**Symptom:** the Windows installer job failed at "Verify version sync" on a
release where every version file genuinely agreed:

```
src-tauri/Cargo.lock: inventory-gear version "undefined" != package.json "1.0.0-alpha.3"
(cargo rewrites this on the next build, which would dirty the tree)
Fix with: npm run version:sync
```

`"undefined"` is the tell. A real drift reports the version it disagrees with,
the way the sibling checks report theirs. This reported nothing at all, and
`npm run version:check` passes on the same commit locally.

**Root cause:** `scripts/version.mjs` read `Cargo.lock` with a pattern that
spells the newline literally:

```js
const cargoLockVersion = cargoLock.match(/name = "inventory-gear"\nversion = "([^"]+)"/)?.[1]
```

`core.autocrlf=true` is the Git for Windows default, and `windows-latest` uses
it, so the checkout arrives with CRLF endings. The pattern cannot match a CRLF
file, `?.[1]` yields `undefined`, and the comparison against package.json fails.
There was no `.gitattributes` in the repository, so nothing normalised the
checkout — and the divergence was invisible in a diff, because git converts
back on the way in.

`Cargo.toml` was never affected: its pattern anchors on `^version` and closes
before the ``. Only `Cargo.lock` was, because only its pattern spans a
newline.

**Worse, `version:sync` could not fix it.** `propagate` rewrites the lockfile
with the same `
`-spelling pattern, so on a CRLF checkout the `replace` matched
nothing and exited 0, printing that the version had been propagated while leaving
the file exactly as it was. A contributor on Windows following the error
message's own advice would have watched it report success and change nothing.

**Fix:** two parts, because either alone is insufficient.

- `.gitattributes` pins `eol=lf` for text files, so the checkout is LF on every
  platform. The version files are listed explicitly because breaking them breaks
  the release gate rather than a single build, and `*.xlsx` is marked binary so
  a committed spreadsheet is not left to git's heuristic. This also protects the
  repository's 8 shell scripts, which fail outright on Linux with a CRLF shebang.
- `read()` in `version.mjs` normalises CRLF to LF. This is the part that
  actually fixes existing clones: adding `.gitattributes` does not retroactively
  renormalise a working tree, since git applies the new rules to files as they
  are next checked out. A Windows clone already holding CRLF stays CRLF until it
  is re-checked-out or `git add --renormalize`d, and `version:sync` now also
  leaves the files with the LF endings the attributes ask for.

**Affected files:** `scripts/version.mjs`, `.gitattributes`,
`tests/integration/version-semver.test.ts`

**Investigation:** reproduced exactly by converting the working-tree
`Cargo.lock` to CRLF and re-running the script, which produced the identical
`"undefined"` message. The existing version tests all passed throughout, because
they run on a Linux checkout with LF, which is the point: nothing in the suite
ever produced the file the failing runner had. The fix is guarded by 7 tests
that build a CRLF sandbox, including one asserting that `check` still reports the
*real* drifting version rather than `"undefined"` — otherwise the normalisation
would have traded a loud failure for a silent pass, and 6 of the 7 fail against
the old script.

**Not verified here:** like the previous entry, this needs the Windows runner to
confirm. `gh` is not installed in this environment.

---

---

### 2026-09-27 — CI could not run the Rust tests: Tauri system libraries missing on the runner

**Symptom:** the `quality` job failed in the "Rust Tests" step before running a
single test, with `exit status: 101` and a cascade of build-script failures from
`glib-sys`, `gobject-sys`, `gio-sys` and more:

```
The system library `glib-2.0` required by crate `glib-sys` was not found.
The PKG_CONFIG_PATH environment variable is not set.
```

The same `cargo test` passes locally (168 tests), so this looked like a Cargo
dependency problem rather than an environment one. It was the environment.

**Root cause:** `tauri` v2 links against webkit2gtk, and the `-sys` crates in that
chain have build scripts that shell out to `pkg-config` looking for `glib-2.0`,
`gobject-2.0`, `gio-2.0` and `webkit2gtk-4.1`. Those are OS packages, not Rust
crates, so nothing in `Cargo.toml` can pull them in. The workflow set up Node
and Rust but never installed them, and `ubuntu-latest` does not ship them.

The job had been red on this step for as long as the step existed; nothing
previously reported it, because coverage and test output arrive earlier in the
log than the failure and read like a healthy run.

**Fix:** install Tauri v2's documented Debian/Ubuntu dependency set before the
Rust toolchain step:

```
libwebkit2gtk-4.1-dev build-essential curl wget file
libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev
```

`4.1` is deliberate: Tauri v2 dropped webkit2gtk 4.0, so 4.0 is not a valid
substitute. `libayatana-appindicator3-dev` is deliberate for the same reason — the
`tray-icon` feature enabled in `src-tauri/Cargo.toml` is what needs it, and the
older `libappindicator3-dev` is a different package with a different ABI.

The `quality` job timeout also went from 15 to 30 minutes. The step it fixes now
installs a large set of packages and builds the tauri crate graph from cold,
several minutes on a 2-core runner, on top of npm ci, two full vitest runs, the
frontend build and the tests. The old 15 minutes was set while the Rust step
failed instantly, so it was never a budget for a pipeline that actually builds.

**Affected files:** `.github/workflows/ci.yml`

**Investigation:** the giveaway was the split between local and CI. `cargo test`
passing locally with the same lockfile rules out a missing or wrong crate and
points at a native dependency the runner simply does not have; the
`PKG_CONFIG_PATH environment variable is not set` line in the failure confirmed
it was pkg-config looking for an OS package rather than a Cargo resolution
problem. The `-sys` crate names in the error map one-to-one onto the Tauri v2
prerequisites list.

**Not verified here:** this needs a push or a PR to exercise, since the failure is
specific to the GitHub-hosted runner. The package names were checked against the
Ubuntu archive and the workflow parses as valid YAML, but a green Rust Tests step
is only observable in Actions. `gh` is not installed in this environment.

---

---

### 2026-09-27 — The Artículos table on a purchase order showed a count, never the products

**Symptom:** opening an Orden de Compra showed an empty items table — at most a
row reading "3 Items" — while the subtotal, tax and total underneath were all
correct. The totals are stored on the order record itself, so the screen looked
plausible; you simply could not see what was being ordered, and could not check
the order against the products on it.

**Root cause:** the line items are not part of the order row. They live behind
their own endpoint, `get_purchase_order_items`, and the page never called it. The
table body was a placeholder that rendered `order.itemCount`:

```tsx
{/* Items are not eagerly fetched here; they are part of a dedicated endpoint.
    A real implementation would call getPurchaseOrderItems and render them. */}
{order.itemCount && order.itemCount > 0 ? (
  <tr><td colSpan={7}>{order.itemCount} {t("itemsCount")}</td></tr>
) : ( ... )}
```

So the count came from the order and the rows would have come from the endpoint,
and only the count was ever rendered. `getPurchaseOrderItems` was already
declared in `src/lib/tauri.ts` and registered in `lib.rs`, and was already used
by the receipt detail page — it was simply never wired into this one. The count
also cannot stand in for the rows: an order can carry an `itemCount` and no
lines, so the placeholder was wrong in both directions.

**Fix:** fetch the items with `useQuery`, keyed on the order id, following the
pattern the receipt detail page already uses for the same data, and render a row
per line. Two details the backend forces:

- `get_po_items_inner` LEFT JOINs `products`, so a product deleted after the
  order was placed comes back with a null name and SKU. The row falls back to
  `#<productId>` so the line is still identifiable.
- A line's `total` is authoritative; it is not recomputed from quantity and unit
  cost, so it is rendered as stored.

The received column shows `receivedQuantity / quantity` rather than the received
count alone, because a line received in full and a line not yet received look
identical otherwise.

**Affected files:** `src/features/purchases/pages/purchase-order-detail-page.tsx`,
`tests/unit/purchases/purchase-order-detail-page.test.tsx`

**Investigation:** the placeholder comment in the table body named the endpoint
that was never called, which is what identified both the cause and the existing
sibling implementation to copy. The regression test was confirmed to fail 6 of 7
cases with the placeholder restored and to pass 7 of 7 with the fix; the one that
passes either way is the totals case, since the totals were never the problem.

---

---

### 2026-09-27 — The customer detail pages repeated the unbound-label defect

**Symptom:** the credit, vehicle and note forms on both customer detail screens
announced their fields as unlabelled, and clicking a label did not focus the
field it names.

**Root cause:** commit `6070403` fixed this in the shared `components/forms/*`
wrappers, but these two pages do not use them. They compose Radix `Input`,
`Textarea` and `select` directly, each behind a bare `<Label>` with no `htmlFor`
and no id on the control. The credit-limit input was worse still: it had no label
at all, only a `placeholder`.

**Fix:** bound all 20 labels on the two pages with an explicit `id`/`htmlFor`
pair, and gave the credit-limit input an `aria-label` since it has no visible
label to point at.

**Affected files:**
`src/features/crm/pages/crm-customer-detail-page.tsx`,
`src/features/customers/pages/customer-detail-page.tsx`,
`tests/unit/components/crm-customer-detail-page.test.tsx`,
`tests/unit/components/customer-detail-page.test.tsx`

**Still open:** this is the same defect class as the shared wrappers, and the
page layer has not been swept. Most of the ~100 files under `src/features/**`
build their forms the same way, so the fix is mechanical but wide. Until it is
done, the detail pages are the exception rather than the rule. Recorded in
`docs/testing/coverage-progress.md` under remaining work.

---

---

### 2026-09-27 — Every customer list issued two identical queries on open

**Symptom:** opening Customers (or CRM → Customers) fetched the list twice. The
screen looked normal, so this only surfaced as doubled database load on the
busiest screen in the shop. Caught by a new test asserting exactly one read.

**Root cause:** both pages ran two independent effects that both called
`fetchCustomers` on mount:

```tsx
useEffect(() => { fetchCustomers() }, [])          // initial paint
useEffect(() => {                                    // debounced search
  const timer = setTimeout(() => fetchCustomers(search), 300)
  return () => clearTimeout(timer)
}, [search])
```

The second effect also runs on mount, so the query fired immediately and again
300 ms later. Removing the mount effect would have delayed the first paint by the
full debounce.

**Fix:** keep the mount fetch and skip only the debounced effect's *initial* run
via a `useRef` guard, so the list still appears immediately:

```tsx
const skipFirstSearch = useRef(true)
useEffect(() => {
  if (skipFirstSearch.current) { skipFirstSearch.current = false; return }
  const timer = setTimeout(() => fetchCustomers(search), 300)
  return () => clearTimeout(timer)
}, [search])
```

**Affected files:** `src/features/customers/pages/customers-page.tsx`,
`src/features/crm/pages/crm-customers-page.tsx`,
`tests/unit/components/customers-pages.test.tsx`

**Investigation:** the assertion "called once" failed with "expected 1 times, but
got 2 times" on both screens. Because the two are near-copies the guard had to be
applied to both; a shared test asserts the same behaviour for each.

**Commit:** `6070403`

---

### 2026-09-27 — No form label in the app was associated with its input

**Symptom:** assistive technology announced every text field, select, and price
field in the product form (and every other form) as an unlabelled edit, and
clicking a label did not move focus to its field.

**Root cause:** two separate gaps. `FormFieldWrapper` rendered a bare `<Label>`
with no `htmlFor`, and the field components derived `const fieldId = id ||
props.name` — but almost no call site passes `id` or `name`, so `fieldId` was
`undefined` and the label had nothing to point at. `checkbox-field` was the only
component that got this right.

**Fix:** `FormFieldWrapper` now takes `htmlFor`, the eight wrapper-based fields
pass `fieldId`, `SelectField` gained the missing `id`/`fieldId` plumbing its
trigger never had, and each field falls back to `useId()` so the association
holds even when the caller supplies nothing. The error paragraph now carries
`${fieldId}-error` and the controls reference it via `aria-describedby`, so
validation messages are announced too.

**Affected files:** `src/components/forms/form-field.tsx`, `text-field`,
`textarea-field`, `number-field`, `currency-field`, `email-field`, `phone-field`,
`date-field`, `select-field`,
`tests/unit/inventory/product-form-page.test.tsx`

**Investigation:** a test using `getByLabelText("Cost Price")` failed with
"Found a label with the text of: Cost Price, however no form control was found
associated to that label". The raw `fieldId` definitions showed the two gaps.

**Commit:** `6070403`

---

### 2026-09-27 — Shared action bar showed Spanish buttons to English users

**Symptom:** the Save / Duplicate / Archive / Restore / Delete row at the bottom
of every entity form read *"Guardar"*, *"Duplicar"*, *"Archivar"*, even with the
interface language set to English.

**Root cause:** `EntityActionBar` is a shared component but hardcoded six Spanish
strings instead of calling `t()`, so the strings appeared on every form page in
the app. It had no `useTranslation` import at all.

**Fix:** translated all six and added the five verbs that had no key
(`common.deleting`, `common.duplicate`, `common.archive`, `common.unarchive`,
`common.restore`) to both `en` and `es`. `common.save`, `common.saving` and
`common.delete` already existed and are now used.

**Affected files:** `src/components/entity/entity-action-bar.tsx`,
`src/i18n/locales/en/common.json`, `src/i18n/locales/es/common.json`

**Investigation:** surfaced when a test looked for a button named "Save" and
found none, while the DOM contained "Guardar".

**Commit:** `6070403`

---

### 2026-09-27 — Six validation messages showed literal `{min}` / `{max}` placeholders

**Symptom:** typing an out-of-range margin on the product form showed the user
`Must be between {min}% and {max}%` instead of *"Must be between 0% and 90%."*
The same raw template appeared for min/max length and min/max value messages and
for the inventory category count.

**Root cause:** the six affected strings used **single** braces, but i18next
only interpolates `{{double braces}}` (the rest of the locale files use
`{{value}}` correctly). `i18n.t("validation.marginRange", { min: 0, max: 90 })`
therefore returned the template verbatim. This was a formatting inconsistency
that no test covered.

**Fix:** converted the six keys to `{{...}}` in both locales —
`validation.minLength`, `validation.maxLength`, `validation.minValue`,
`validation.maxValue`, `validation.marginRange`, `inventory.acrossCategories`.

**Affected files:** `src/i18n/locales/en/validation.json`,
`src/i18n/locales/es/validation.json`, `src/i18n/locales/en/inventory.json`,
`src/i18n/locales/es/inventory.json`

**Investigation:** a direct `i18n.t(...)` call in a scratch test returned the
un-substituted template, which ruled out the component and pointed at the config
and the locale files. A scan of every locale string for single-brace
placeholders found exactly 12 (6 keys × 2 locales) and no others.

**Commit:** `6070403`

---

### 2026-09-27 — `npm run test:coverage` then `npm run lint` failed, and the report could be committed

**Symptom:** running the coverage suite made the next `npm run lint` fail with 6
errors (`Unused eslint-disable directive`) in
`quality/coverage/*.js`. The generated report was also untracked and not ignored,
so `git add .` would have committed it.

**Root cause:** the coverage reporter writes an HTML report into `quality/`,
which was absent from `.gitignore` and from the flat config's global `ignores`.
The report's bundled JS carries `/* eslint-disable */` banners, and the lint
script runs with `--report-unused-disable-directives`.

**Fix:** added `quality/` to `.gitignore` (with a comment) and `"quality"` to the
`ignores` array in `eslint.config.js`. CI happens to lint before coverage, which
is why this never showed up there.

**Affected files:** `.gitignore`, `eslint.config.js`

**Commit:** `6070403`

---

### 2026-09-27 — Business error toasts showed the raw i18n key instead of a translated sentence

**Symptom:** a shopkeeper who tried to transfer stock from a warehouse to
itself was told, in the error toast on the transfers page:

```
business.errors.transferSameStore
```

instead of *"The source and destination stores must be different."* The same
applied to all five codes `src/lib/business-errors.ts` maps.

**Root cause:** `src/i18n/config.ts` built a `resources` object containing a
`business` bundle for both `es` and `en`, but the `ns` array passed to
`i18n.init()` never listed `"business"`:

```ts
resources = { es: { common: esCommon, business: esBusiness, /* ... */ }, /* ... */ }

ns: [
  "common", /* "business" was missing here */ "dashboard", "inventory", /* ... */
],
```

i18next loads only the namespaces named in `ns`. With `nsSeparator: "."`, a call
to `t("business.errors.transferSameStore")` asks for namespace `business` and
key `errors.transferSameStore`; no store existed for that namespace, so i18next
fell back to returning the key string. Nothing threw — a missing namespace
fails *open*, which is why this went unnoticed.

`business` was the only namespace in the codebase used with the `ns.`
prefix style that was absent from the list; the other 19 were all registered.

**Investigation:** the code path was intact end to end — the Rust constant
`ERR_TRANSFER_SAME_STORE` (`src-tauri/src/commands/business.rs:11`) is returned
verbatim, `businessErrorMessage` (`src/lib/business-errors.ts`) maps it to
`business.errors.transferSameStore`, and both `es/business.json` and
`en/business.json` carry the sentence. Only the namespace registration was
missing, so the failure was invisible in code review and undetectable by any
key-level test, since every existing test asserted on namespaces that happened
to be registered.

**Fix:** added `"business"` to the `ns` array in `src/i18n/config.ts`.

**Tests:**
- `tests/unit/i18n-namespaces.test.ts` (new) — asserts every namespace present
  in a locale file is registered in `ns`, that no registered namespace lacks a
  locale file, and that each namespace resolves through the real `t()` in both
  shipped locales. Verified to fail with the fix reverted.
- `tests/unit/lib/validation-business-errors.test.ts` (new) — asserts each of
  the five mapped codes resolves to a real sentence in `es` and `en`, and never
  to its own key.

**Affected files:** `src/i18n/config.ts`,
`tests/unit/i18n-namespaces.test.ts`,
`tests/unit/lib/validation-business-errors.test.ts`.

**Commit:** `6070403`

---

### 2026-09-27 — CI generated zero screenshots and then reported that it had generated 132

**Symptom:** the `screenshots` job on a pull request printed, for both themes:

```
❌ light screenshot generation failed: Command failed:
  npx playwright test --config playwright.config.ts --project=light
Error: Cannot find package '@playwright/test' imported from
  /home/runner/work/inv-g/inv-g/scripts/screenshots/playwright.config.ts
  ... code: 'ERR_MODULE_NOT_FOUND'
```

— and then finished with:

```
📸 All screenshots generated in /home/runner/work/inv-g/inv-g/docs/screenshots
   Light theme: 66 screenshots
   Dark theme: 66 screenshots
```

Nothing was generated. The 66 and 66 are the PNGs already committed to the
repository.

**Three defects, and the second one is why this survived.**

**1. The sub-package was never installed.** `scripts/screenshots` is a separate
npm package — its own `package.json`, its own `package-lock.json`, its own
`node_modules` — and the root `package.json` declares no `workspaces`. So the
workflow's root `npm ci` does not touch it:

```yaml
- run: npm ci                                        # root only
- working-directory: scripts/screenshots
  run: npx playwright install chromium               # <- the mistake
- working-directory: scripts/screenshots
  run: npx tsx generate_all.ts
```

`npx playwright install` does not install Playwright. With nothing in the local
`node_modules`, `npx` fetches the `playwright` CLI into its own cache — visible
in the original trace as
`/home/runner/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/...` — and
downloads the Chromium *binaries*. `@playwright/test` is never installed, so
the very first line of `playwright.config.ts` throws `ERR_MODULE_NOT_FOUND` and
both suites die before running a single test.

Fixed by adding `npm ci` in `scripts/screenshots` before the browser install.
Also switched the browser step to `npx playwright install --with-deps chromium`:
`ubuntu-latest` does not ship the shared libraries Chromium links against, so
without `--with-deps` the next failure is a browser that will not launch.

**2. The generator reported success over a total failure.** `runSuite` did set
`process.exitCode = 1`, but `main()` ignored the result and then printed the
banner unconditionally, counting files like this:

```ts
const lightCount = execSync(`ls ${LIGHT_DIR}/*.png 2>/dev/null | wc -l`, ...)
```

`docs/screenshots/light` holds 66 **committed** PNGs, so that count is 66
whether the run produced everything, nothing, or crashed on import. A run in
which every theme failed printed the exact same "66 / 66" summary as a run that
worked — the one signal a human would use to notice was structurally incapable
of noticing.

`runSuite` now returns a boolean, `main` collects the results, and the success
banner is only printed when every requested theme both exited 0 *and* wrote at
least one file. A suite that passes while writing nothing (a project name
matching no test, say) is now a failure. The counts come from `mtime >= run
start`, so a clean run reports what it actually produced rather than what the
repository already contained.

**3. The derivative copies could never fail.** Every one ran as:

```ts
execSync(`cp ${src}.png ${dest}.png 2>/dev/null; true`, { stdio: "ignore" })
```

The trailing `; true` forces exit 0 unconditionally, so `execSync` could never
throw and the surrounding `try { ... } catch { /* Already handled */ }` was
dead code. A missing source produced a silently absent marketing or README
image. Replaced with a `copyScreenshot` helper that warns per file. It still
does not fail the run — a derivative image is not worth failing over — but it
now says which file it could not produce.

**Left alone, worth knowing.** `helpers/screenshot.ts` imports `sharp` for
thumbnails, but `sharp` is not in the sub-package's dependencies, so it is
absent. The import sits inside a `try` with a `fs.cpSync` fallback, so
generation still succeeds — the thumbnails are just full-size copies of the
screenshot instead of 256px wide, and the `catch {}` hides that too. Declaring
the dependency is the real fix, but it needs a lockfile update, so it is not
part of this change.

**Affected files:** `.github/workflows/ci.yml`,
`scripts/screenshots/generate_all.ts`

**Commit:** `6474409`

---

### 2026-09-26 — The Part Finder never returned a result, and nothing could ever make it

**Symptom:** *Buscador de Partes* answered "No se encontraron partes compatibles"
for every input. The brand/model/year/engine/transmission pickers were either
empty or led nowhere, and the "Recomendadas para Este Vehículo" panel stayed
blank even after filling in every dropdown. On a fresh database the whole
feature was dead on arrival.

This turned out to be four independent faults stacked on top of each other.
Any one of them alone would have produced the same blank screen, which is why
the page looked broken rather than half-built.

**Root cause 1 — the table could never be written to.** `search_compatible_products`
reads `product_vehicle_compatibility`, and *no code path could insert a row*.
`create_compatibility` and `delete_compatibility` were registered in
`src-tauri/src/lib.rs` and bound in `src/lib/tauri.ts`, but **no component ever
called them**:

```
$ grep -rn "createCompatibility" src/ --include=*.tsx
(no matches — only the wrapper in src/lib/tauri.ts)
```

`ProductCompatibilityTab` — the sole reader of the table — was read-only, showed
`Sin datos`, and offered no way forward. `db/seed.rs` contains no
`product_vehicle_compatibility` rows either, so a new database started with an
empty table. The vehicle catalog (brands, models) *can* be filled in from
CRM > Vehículos, which is what made this look like a search bug rather than a
missing-feature bug: the dropdowns populated, and then the search returned
nothing.

**Root cause 2 — the search inner-joined the compatibility table.**

```sql
FROM product_vehicle_compatibility pvc JOIN products p ON p.id = pvc.product_id
```

With no vehicle filter this is a *catalog* lookup, but the join still required
a fitment row, so any part nobody had mapped to a vehicle was invisible. The
search box is labelled "Nombre o SKU de la parte" — a SKU search is a catalog
question, and it needs the catalog.

**Root cause 3 — the SKU was never searched.** The predicate was
`AND p.name LIKE ?n`, so typing `BP-100` matched nothing even for a part that
had a fitment row. The placeholder promised "Nombre o SKU" and the SQL only
honoured the first half.

**Root cause 4 — the recommendations panel could never return a row**, for two
reasons at once:

```sql
WHERE ... AND (pvc.brand_id = ?1 OR pvc.brand_id IS NULL)
      AND (pvc.model_id  = ?2 OR pvc.model_id  IS NULL)
      AND (pvc.year_start IS NULL OR pvc.year_start <= ?3)
      AND c.name IN ('Filters','Brakes','Electrical','Lubricants','Cooling','Engine','Exhaust','Transmission')
```

- `?1`/`?2`/`?3` were bound **unconditionally**, so selecting only a brand made
  SQLite evaluate `pvc.model_id = NULL` — never true — and the entire predicate
  collapsed. The panel stayed empty until all three dropdowns were filled.
- The category allow-list was **hardcoded English**. Those eight strings appear
  nowhere else in the Rust codebase, and the categories this app actually seeds
  are Spanish — `SEED_CATEGORIES` in `src-tauri/src/db/seed.rs` is
  `Dirección` and `Suspensión`, neither of which is in the list. On any
  stock install `c.name IN (...)` therefore matched **nothing at all**, not
  merely the wrong language. And because `NULL IN (...)` is `NULL` rather than
  true, parts with no category were dropped as well — so a shop that had fixed
  its catalog labels would still have seen an empty panel for its uncategorised
  parts.

**Fix:**

- `ProductCompatibilityTab` is now a real CRUD surface: cascading
  brand → model → generation, plus engine, transmission, a year range and notes,
  writing through the `createCompatibility` command that already existed. Every
  field has a `<label htmlFor>`, changing the brand invalidates the model and
  generation (a model belongs to exactly one brand), and the save button is
  disabled for a row that names no vehicle or has an inverted year range.
- `search_compatible_products` now picks its join from the filters: `INNER` when
  a vehicle dimension is selected (a fitment filter is a claim about a fitment
  row), `LEFT` when it is not (so a plain name/SKU lookup reaches the whole
  active catalog). The search term matches `p.name` **or** `p.sku`, and
  whitespace-only input is treated as no input rather than as a `%` wildcard.
- `get_recommendations_for_vehicle` was rebuilt the same way
  `search_compatible_products` already was: absent filters are simply not
  applied, placeholders are derived from the bound-parameter vector so they
  cannot drift, and the English category allow-list is gone. Ordering is now
  `compatibility_count DESC, p.name`.

**Investigation notes.** The category allow-list was the reason the panel looked
unrelated to the rest of the bug: the dropdowns and the search share the same
data, so an empty `product_vehicle_compatibility` explains all of it *except*
the panel, and the panel had its own two bugs. Fixing only the write path would
have left the panel blank; fixing only the search would have left the feature
empty on a real database. The `search_tests.rs` harness makes this class of
fault cheap to prove — see the note below on why the assertions are written
against the *real* schema.

Covered by `src-tauri/src/commands/search_tests.rs` (`catalog_lookup_finds_parts_with_no_fitment_row`,
`compatible_products_search_matches_sku_as_well_as_name`,
`recommendations_survive_a_non_english_catalog`,
`recommendations_appear_before_every_dropdown_is_filled` — all four fail against
the old code) and `tests/unit/components/product-compatibility-tab.test.tsx`
(10 tests, all of which fail against the old read-only tab).

The test seed deliberately names its categories `Frenos` / `Filtros` and leaves
one product uncategorised, so the language and `NULL IN (...)` faults cannot
regress silently.

**Affected files:** `src-tauri/src/commands/compatibility.rs`,
`src-tauri/src/commands/search_tests.rs`,
`src/features/inventory/components/product-compatibility-tab.tsx`,
`src/i18n/locales/{es,en}/inventory.json`,
`tests/unit/components/product-compatibility-tab.test.tsx`,
`tests/unit/components/product-360-tabs.test.tsx`

**Commit:** `1434149`

---

### 2026-09-26 — "Activar módulo de compras" in Settings did nothing

**Symptom:** switching off *Activar módulo de compras* in Admin > Settings
appeared to save, but the Purchases section stayed in the sidebar and every
purchases URL still opened. Same for *Activar módulo de ventas* and *Activar
módulo de CRM*.

**Root cause: the three flags were write-only.** `enable_sales`,
`enable_purchasing` and `enable_crm` are seeded into `application_settings`
(`db/seed.rs`, all three under the `business` category as `boolean` rows), the
admin page renders a `<Switch>` for any row whose `setting_type` is `boolean`
and saves them through `update_app_settings_bulk` — and then **nothing ever read
them back**. There was no route guard, no sidebar filter and no
command-palette filter. The settings round-tripped correctly into SQLite; there
was simply no consumer. The new module reader records the same finding: *"They
used to be write-only: the admin page could render and save the toggles but
nothing ever read them, so switching a module off appeared to do nothing."*

**Fix:** `src/hooks/use-modules.ts` is now the single reader, and three
consumers use it:

- `ModuleRoute` in `src/components/auth-guards.tsx` wraps the authenticated
  layout, so it covers every route without annotating each one. It keys off the
  path prefix, which means a bookmarked or hand-typed `/purchases/...` URL is
  blocked too — hiding a sidebar entry alone never would have.
- `src/layouts/sidebar.tsx` filters whole module groups out of both navigations.
- `src/components/command-palette.tsx` filters palette entries, so a disabled
  module is not reachable from the palette either.
- `dashboard-page.tsx` no longer advertises quick actions into a module that is
  switched off.

The reader **fails open**: a module is disabled only when its value is exactly
`"false"` (case-insensitive). A database predating the seed has no row for the
flag at all, and hiding a whole business module in that state would be far more
damaging than briefly showing one that was meant to be off.

**Investigation notes.** Two things made this look like a save failure rather
than a missing feature. First, the admin page *does* update its zustand store
after saving, so the switch visibly stays in the new position — the UI
confirmed the write and nothing more. Second, the flags are read from the
in-memory app-settings store that `App.tsx` hydrates at start-up, not from
`localStorage` and not from Rust, so there was no second code path where the
value might have been picked up and missed.

Covered by `tests/unit/components/module-gating.test.tsx` (9 tests; 4 fail if
the guard's condition is short-circuited). The tree it mounts matters: with
`ModuleRoute` on its own, the guard's `<Navigate to="/dashboard">` simply
re-renders its own children at the new path and appears to do nothing, so the
tests reproduce the real layout-and-`Outlet` shape from `src/routes/index.tsx`
and assert "the purchases page is replaced by the dashboard".

**A fifth fault, found by writing the end-to-end test.** Wiring up the missing
reader was not sufficient on its own. The admin page propagates its save to the
in-memory store like this:

```ts
await updateAppSettingsBulk(bulk, user?.id)
for (const setting of settings) {
  appSettingsStore.setValue(setting.key, values[setting.key] ?? "")
}
```

and `setValue` was a `map` over the store's rows — so it *patched in place* and
never upserted. `hydrate()` runs fire-and-forget inside a `useEffect` in
`App.tsx` while the router renders immediately, so there is a real window in
which the store is still empty. An admin who reached Settings, flipped a switch
and saved inside that window persisted the flag to SQLite and updated nothing in
memory: `map` over `[]` changes nothing, and the switch still looked flipped
because the control keeps its own local `values` state. The module then stayed
visible with no indication that the write had been dropped — the same
"it saved and nothing happened" report, one level down.

`setValue` now appends when the key is absent, and the value is readable
immediately whether or not hydration has finished. This is why the regression is
an integration test rather than two unit tests: the store test proves the
upsert, and the page test proves the page reaches the store, but only the
combined assertion covers the seam that actually broke.

**Affected files:** `src/hooks/use-modules.ts` (new), `src/hooks/index.ts`,
`src/stores/app-settings.store.ts`,
`src/components/auth-guards.tsx`, `src/layouts/sidebar.tsx`,
`src/components/command-palette.tsx`, `src/lib/command-palette/commands.ts`,
`src/lib/command-palette/types.ts`,
`src/features/dashboard/pages/dashboard-page.tsx`,
`tests/unit/components/module-gating.test.tsx`,
`tests/unit/components/admin-settings-page.test.tsx`,
`tests/unit/stores/app-settings-store.test.ts`

**Commit:** `1434149`

---

### 2026-09-26 — "Crear Orden de Compra" from a suggestion opened an empty order

**Symptom:** on *Sugerencias de Reorden*, clicking **Crear Orden de Compra**
landed on an empty purchase order form reading "Sin artículos" with Save
disabled. The product, quantity and preferred supplier all had to be re-typed
by hand — which is the whole job the button was supposed to do.

**Root cause: the payload was handed over in a channel the form never read.**
The button navigated with React Router's `state`:

```tsx
navigate("/purchases/orders/new", {
  state: { productId, productName, suggestedOrder, preferredSupplierId },
})
```

but `PurchaseOrderFormPage` never called `useLocation().state` — it only read
route params (`id` for the edit path) and its own `items` state, which starts as
`[]`. The state object was constructed, serialised into the history entry, and
dropped on the floor.

**Fix:** the handoff now travels in the query string, which survives a reload
and a bookmark, and is parsed by the form.
`src/features/purchases/order-from-suggestion.ts` holds both halves of the
contract — `createOrderFromSuggestionUrl()` for the producer and
`parseOrderFromSuggestion()` for the consumer — so the two cannot drift. The
parser rejects a URL with no `productId`, clamps a non-positive quantity to 1,
and treats a missing cost as 0. Seeding is guarded by a ref so a re-render never
discards lines the user added, and it is inert on `/purchases/orders/:id/edit`.

Also fixed in passing: the form saved every new order as `createPurchaseOrder(1, ...)`,
hardcoding user 1 as the author regardless of who was signed in. It now reads
the id from the auth store.

Covered by `tests/regression/bug-012-purchase-order-from-suggestion.test.tsx`.

**Affected files:** `src/features/purchases/order-from-suggestion.ts` (new),
`src/features/purchases/pages/reorder-suggestions-page.tsx`,
`src/features/purchases/pages/purchase-order-form-page.tsx`,
`tests/regression/bug-012-purchase-order-from-suggestion.test.tsx`

**Commit:** `1434149`

---

### 2026-09-26 — The CRM section was labelled "Título", and duplicate i18n keys were shadowing labels across the app

**Symptom:** the CRM section in the sidebar, the breadcrumb in the top bar and
the command palette all read **"Título"** instead of a section name. Related
labels were also wrong in places: Settings' category tabs read "Datos del
negocio" where a section name was meant, and some Admin/Inventory labels showed
the value of a shadowed key.

**Root cause: duplicate keys inside a single JSON file, and `JSON.parse` keeps
the last one.** `src/i18n/locales/es/crm.json` declared `title` twice — once at
the top as the section name, and again ~120 lines down as the label for a
note/reminder *field*:

```json
{
  "title": "CRM",          // line 2  — silently discarded
  ...
  "title": "Título",       // line 119 — this one won
}
```

Nothing warns about this. The file parses, the type is `string`, and
`t("crm.title")` dutifully returns the field label everywhere the *section*
name was meant. A JSON object cannot hold two `title` keys, and the second
declaration is not an error — it is a silent overwrite.

The same fault existed elsewhere: `admin.json` (duplicated
`roles.description`, `roles.create`/`edit`/`delete`, four
`settings.*`/`settings.*.description` pairs, `backups.restore`),
`inventory.json` (`description` as both page subtitle and field label) and
`customers.json` (`email`).

**Fix:** the field labels were renamed to names that say what they are, and
the section names were allowed to keep theirs:

| File | Shadowed key | Renamed to |
| --- | --- | --- |
| `crm.json` | `title` | `recordTitle` |
| `crm.json` | `notes` | `notesPage` (CRM sub-nav label) |
| `inventory.json` | `description` | `descriptionField` |
| `admin.json` | `roles.description` | `roles.fieldDescription` |

Callers were updated to the new keys. A guard now runs in CI:
`scripts/check-i18n-duplicates.mjs` (exposed as `npm run i18n:check`, wired into
`npm run verify`) parses each locale file with a reviver that records every
repeated path, and `tests/unit/utils/i18n-duplicates.test.ts` covers the
detector itself. This class of bug is invisible to the type checker and to
reading, so it needs a mechanical check.

**The new guard was itself broken on the way in — a shebang in an imported
module.** `check-i18n-duplicates.mjs` is both a CLI entry and an imported
module, because two test files import `findDuplicateKeys` from it. It started
with `#!/usr/bin/env node`, which is only legal on line 1. When the runner
transforms the file through Vite/Rolldown's SSR path instead of loading it
natively, it hoists the `node:` imports to the top of the emitted module and
leaves the shebang stranded in the middle:

```
RolldownError: Parse failure: Invalid Character `!`
1: const readdirSync = ...; const dirname = ...;#!/usr/bin/env node
```

Both suites that import it then failed to load at all, taking 30 tests with
them. **This is worth remembering as a shape of bug, not just an incident:** the
outcome depended on a loader decision, so the same commit passed here and
failed on another machine, and clearing the Vite cache could flip it either
way. A shebang in a file that anything might import is a latent parse error
regardless of which runner you happen to use.

The fix is to drop the shebang. `npm run i18n:check` invokes the file as
`node scripts/check-i18n-duplicates.mjs`, which never needed one. The other ten
shebangs under `scripts/` are untouched — none of them is imported anywhere, so
for a script that is only ever executed directly the shebang is correct and
harmless. The file now carries a comment saying why it must not grow one back.

**On the tab name.** The report suggested renaming the section to "Clientes".
That would have been wrong: the section also holds vehicles, compatibility,
reminders, warranties, credit and notes, so "Clientes" would misdescribe it —
the reporter's own instinct ("*o tal vez no porque tiene otra información*") was
right. The section name `crm.title` = "CRM" is restored and now actually
renders.

**Affected files:** `scripts/check-i18n-duplicates.mjs` (new),
`package.json`, `src/i18n/locales/{es,en}/{crm,admin,inventory,customers}.json`,
`src/features/crm/pages/crm-{reminders,notes,customer-detail}-page.tsx`,
`src/features/admin/pages/admin-role{,-form}-page.tsx`,
`src/features/inventory/pages/product-form-page.tsx`,
`src/features/inventory/components/product-overview-tab.tsx`,
`src/config/navigation.ts`,
`tests/unit/utils/i18n-duplicates.test.ts`,
`tests/regression/bug-013-014-015-i18n-and-suppliers.test.ts`

**Commit:** `1434149`

---

### 2026-09-26 — A second "Proveedores" page in the sidebar showed invented data

**Symptom:** the sidebar carried a top-level **Proveedores** entry, apparently
duplicating the supplier list already under Compras.

**Root cause: it was a static mock-up that was never wired to anything.**
`src/features/suppliers/pages/suppliers-page.tsx` hardcoded five suppliers in a
module-level array and rendered them, with three fabricated KPI tiles
(`Total de Proveedores 24`, `Activos 21`, `Productos Origen 1,230`) that were
literal numbers, not aggregates:

```tsx
const suppliers = [
  { name: "AutoParts Co.", contact: "David Lee", phone: "(555) 111-2222", ... },
  { name: "OEM Direct",     contact: "Karen White", ... },
  ...
]
```

It never called a Tauri command, so it showed the same five rows on every
install regardless of the database. The `SearchBar` filtered nothing, and it had
no create, edit or delete action. The page was registered in the sidebar
(`/suppliers`), the router, the top-bar breadcrumb map, the permission service
and the i18n namespace list, so it looked like a real feature from every angle
except the only one that mattered: it could not disagree with the database.

**Fix:** removed. The genuine supplier master data lives in **Inventario >
Proveedores** (`/inventory/suppliers`, `inventory.suppliers`), which is backed
by `getSuppliers()` and the `suppliers` table. The *relationship* data — which
supplier offers which product, at what cost, lead time and MOQ — is a different
grain and legitimately stays in **Compras > Catálogo de Proveedores**
(`/purchases/supplier-products`, `supplier_products` table), which does have
full CRUD. The removed top-level page was neither of those: it was a third,
fictional grain.

**Investigation notes.** Worth keeping in mind: this is why the removal needed a
dangling-reference sweep rather than a file delete. Five other files referenced
`suppliers.title` or the `SuppliersPage` export (router, navigation, top bar,
permission service, i18n config), and a leftover entry in any one of them would
have rendered a sidebar item pointing at a dead route.

**Affected files:** `src/features/suppliers/` (deleted),
`src/i18n/locales/{es,en}/suppliers.json` (deleted),
`src/routes/index.tsx`, `src/config/navigation.ts`, `src/layouts/top-bar.tsx`,
`src/services/permission.service.ts`, `src/i18n/config.ts`,
`tests/regression/bug-013-014-015-i18n-and-suppliers.test.ts`

**Commit:** `1434149`


---

### 2026-09-26 — Prerelease versions rejected by the version tools

**Symptom:** `npm run version:set 1.0.0-alpha.1` failed with
`"1.0.0-alpha.1" is not a valid version`, and `npm run version:check` reported
the tree as out of sync. Because `version:set` was the only supported way to
change the version, an alpha/beta/rc build could not be prepared, tagged, or
released at all.

**Root cause: an over-narrow validation regex in `scripts/version.mjs`.**

The script validated versions with a hand-written pattern:

```js
/^\d+\.\d+\.\d+$/
```

That matches `1.0.0` and nothing else — no `-alpha.1`, no `+build.5`. The same
restriction was duplicated in two other places: the release workflow compared
the tag with an inline `${GITHUB_REF_NAME#v}` shell check that assumed a stable
version, and `tests/integration/release-workflow.test.ts` asserted
`expect(pkg.version).toMatch(/^\d+\.\d+\.\d+$/)`, which pinned the *project* to a
stable version and would have failed any prerelease.

The versioning tools had **no tests of their own**, so nothing caught the
mismatch between "versions are `MAJOR.MINOR.PATCH`" and SemVer 2.0.0.

A second, unrelated drift surfaced while writing the tests: the new `check`
read `package-lock.json` for the first time and immediately failed, because
both of its version fields were still `0.1.0` while `package.json` said
`1.0.0`. The old check never looked at the lockfile, so the mismatch was
invisible.

**Investigation notes:**

- Confirmed the Tauri side was never the problem: `tauri.conf.json` points at
  `package.json`, and `npx tauri info` succeeds with a prerelease, because
  Tauri parses it with `semver::Version::from_str`.
- Confirmed Cargo accepts it: `cargo metadata` reports
  `inventory-gear 1.0.0-alpha.2` and `cargo check` leaves `Cargo.lock` clean.
- Verified the new tests fail when the old regex is restored, so they genuinely
  cover the regression rather than just passing.

**Fix:**

- `scripts/version.mjs` now validates against the official SemVer 2.0.0
  pattern, so prerelease identifiers and build metadata are accepted while
  `1`, `1.0`, `1.0.0.1`, `1.0-alpha` and leading-zero identifiers stay
  rejected. Validation is not loosened beyond that.
- `set` and `sync` propagate the version to `package.json`,
  `package-lock.json` (root and `packages[""]`), `src-tauri/Cargo.toml` and
  `src-tauri/Cargo.lock`; `check` verifies all of them.
- Added `version:tag`, which normalises an optional leading `v` and exits
  non-zero on a mismatch. The release workflow now calls it instead of doing
  its own comparison, so the tag gate and `version:set` share one definition.
- Added `tests/integration/version-semver.test.ts` (65 tests) and relaxed the
  release-workflow assertion to accept any SemVer.
- Corrected the stale `package-lock.json` versions from `0.1.0` to `1.0.0`.

**Files:** `scripts/version.mjs`, `package.json`, `package-lock.json`,
`src-tauri/Cargo.toml`, `src-tauri/Cargo.lock`,
`.github/workflows/windows-installer.yml`,
`tests/integration/version-semver.test.ts`,
`tests/integration/release-workflow.test.ts`, `docs/release-management.md`,
`docs/CHANGELOG.md`.

**Commit:** `de4322e`

---

### 2026-09-26 — GitHub Release failed with `400 Missing tag_name parameter`

**Symptom:** the *Windows Installer* workflow run ended red on the release step:

```text
Run softprops/action-gh-release@v2
GitHub release failed with status: 400
{"message":"Missing tag_name parameter","status":"400"}
Unexpected error fetching GitHub release for tag refs/heads/main
```

The build, the tests and the artifact upload all succeeded; only the final step
failed, so the installer existed and was downloadable from the run's *Artifacts*
while the release itself was never created.

**Root cause: the manual trigger, not the push trigger.**

The report blamed "pushing to `main`", and that was the natural reading — but it
was wrong, and worth recording why. `windows-installer.yml` has only ever been
triggered by tags since it was added in `bf64f43`:

```yaml
on:
  push:
    tags: ["v*"]
```

`git push origin main` runs `ci.yml` and nothing else. The actual path to the
release step was the second trigger:

```yaml
on:
  workflow_dispatch:
    inputs:
      publish:
        description: ...
        default: true        # ← on unless explicitly turned off
...
- name: Release
  if: startsWith(github.ref, 'refs/tags/v') || inputs.publish
  uses: softprops/action-gh-release@v2
```

A manual run (*Actions → Run workflow*) against `main` sets `github.ref` to
`refs/heads/main` and leaves `inputs.publish` at its `true` default, so
`|| inputs.publish` evaluated true and the step ran **with no tag**.
`softprops/action-gh-release` falls back to `github.ref` when `tag_name` is not
supplied, submitted `refs/heads/main` as a tag name, and the API answered
`Missing tag_name parameter`. The `startsWith(github.ref, 'refs/tags/v')` half of
the condition could never be true for a branch, so in practice the whole
condition was just "run a release, or not, depending on a checkbox".

Two further gaps were latent behind it:

- **No version guard.** The tag was never compared with `package.json`, so
  `git tag v9.9.9` on a `1.0.0` tree would have published a release labelled
  `9.9.9` containing an installer that reports itself as `1.0.0`.
- **Duplicated asset path.** The normalized installer path was written out
  independently in the artifact upload and in the release step, so a change to
  one could silently leave the other pointing at nothing.

**Investigation notes:** `git log --follow .github/workflows/windows-installer.yml`
confirmed the tag trigger was present from the initial commit; the failing
`ref=refs/heads/main` in the error is the giveaway that the run was a
`workflow_dispatch`, since a tag run would have reported `refs/tags/...`.

**Fix:**

- The release step now requires `github.ref_type == 'tag'`. A manual run builds
  and uploads the installer and stops there.
- `tag_name: ${{ github.ref_name }}` is passed explicitly, so the action never has
  to infer a tag. `github.ref_name` is `v1.0.0`; `github.ref` is not.
- The `publish` input is removed — the switch that could turn a branch run into a
  release no longer exists.
- `GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}` is set explicitly, so the step does
  not depend on the action's implicit default.
- Added a **tag/version guard** that fails the run when the tag and
  `package.json` disagree, before anything is built.
- The asset path is defined once as `INSTALLER_ASSET` and consumed by both the
  upload and the release; a new *List generated installers* step prints the
  bundle contents so a missing or renamed installer is visible in the log instead
  of only as a later upload error. The normalizer now also fails explicitly when
  the bundle directory or `.exe` is absent.
- `tests/integration/release-workflow.test.ts` (14 tests) locks the invariants in:
  no branch trigger, tag-only release, explicit `tag_name`, `contents: write`,
  built-in token only, generated notes, `fail_on_unmatched_files`, single asset
  path, the version guard, and that `ci.yml` can never publish. Each assertion was
  confirmed to fail when the corresponding defect is reintroduced.

`draft: true` is kept deliberately — the release is reviewed and published by a
human, which is the behaviour `docs/windows-installer.md` already documented.

**Affected files:** `.github/workflows/windows-installer.yml`,
`tests/integration/release-workflow.test.ts` (new), `docs/release-management.md`
(new), `docs/windows-installer.md`, `docs/CHANGELOG.md`, `docs/BUG_FIX_LOG.md`,
`docs/progress/MILESTONE_17.md`, `docs/ROADMAP.md`

**Commit:** `43f6f37`

---

### 2026-09-26 — "Sin Stock" never updated after selling a product out

**Symptom:** sell the last unit of a product, go back to the dashboard, and
*Necesita Atención → Sin Stock* still reads `0` (or the old number). The product
is genuinely out of stock; the tile only corrects itself after a full page
reload. Manual stock adjustments, receiving a purchase order, refunds, supplier
returns, inter-store transfers and data imports all showed the same staleness.

**Root cause: the invalidation list was written out by hand and never included
the stock counters.** The backend is correct — `commands/sales.rs` decrements
`products.stock_quantity` inside the checkout transaction and restores it on
refund — so the number in the database was right and the number on screen was
cached. The dashboard builds its attention list from the `inventory-stats` query:

```ts
const { data: inventoryStats } = useQuery({
  queryKey: ["inventory-stats"],
  queryFn: getDashboardStats,
})
```

and after a sale the POS invalidated `sales`, `pos-search`,
`global-product-search`, `daily-closeout`, `sales-summary` and
`dashboard-widgets` — everything except `inventory-stats`. Production runs a
5-minute `staleTime`, so the stale value was served without a refetch.

The same omission existed in the other five stock-moving flows, each with its
own hand-written subset:

| Flow | Invalidated | Missing |
| --- | --- | --- |
| Checkout (POS) | `sales`, `pos-search`, `global-product-search`, closeout, summary, widgets | `inventory-stats`, product rows |
| Refund (returns page, sale detail) | `sales`, closeout, summary, widgets | all stock views |
| Receive purchase order | *(no query client at all)* | all stock views |
| Supplier return | `purchase-returns` | all stock views |
| Stock adjustment, transfer | `inventory-movements`, `inventory-products` | every count |
| Import | `inventory-products`, `inventory-movements`, `inventory-dashboard` | every count |

Two dead keys were being invalidated along the way, so those calls did nothing:
`pos-search` has never been a query key (the product search uses
`global-product-search`), and `inventory-dashboard` is not one either — the real
key is `inventory-dashboard-stats`, so the import page never refreshed the
inventory KPIs despite appearing to.

**Fix:** the list now lives in one place, `src/hooks/use-stock-invalidation.ts`.
`useInvalidateStock()` invalidates every key that displays a stock level, and
all six flows call it on success. The keys are treated as *prefixes*, so
`["inventory-products"]` also covers the paginated `["inventory-products", page,
pageSize, search]` variants without listing them.

Covered by `tests/unit/components/stock-out-of-stock-refresh.test.tsx` (drives a
real checkout through the POS with a 5-minute `staleTime` and asserts the tile
appears) and `tests/integration/stock-invalidation-contract.test.ts`, which
fails if a stock-moving flow loses its invalidation, if `inventory-stats` leaves
the list again, or if the list contains a key no query actually uses.

**Affected files:** `src/hooks/use-stock-invalidation.ts` (new),
`src/hooks/index.ts`, `src/features/sales/pages/pos-page.tsx`,
`src/features/sales/pages/returns-page.tsx`,
`src/features/sales/pages/sale-detail-page.tsx`,
`src/features/purchases/pages/purchase-receipt-form-page.tsx`,
`src/features/purchases/pages/purchase-returns-page.tsx`,
`src/features/inventory/pages/inventory-movement-form-page.tsx`,
`src/features/inventory/pages/transfers-page.tsx`,
`src/features/inventory/pages/import-export-page.tsx`

**Commit:** `b6000f8`

---

### 2026-09-26 — "Nueva Devolución" listed no products and could not be saved

**Symptom:** *Compras → Devoluciones → Nueva Devolución*, pick a purchase order,
and the items table stays empty. Because there is nothing to fill in, **Crear
devolución** never enables, so the return cannot be recorded at all.

**Root cause: the line items were seeded from a query result that had not loaded
yet.** `handleSelectPo` built the rows from `poItems`, the react-query result of
`getPurchaseOrderItems(selectedPoId)`:

```tsx
function handleSelectPo(po: PurchaseOrder) {
  setSelectedPoId(po.id)          // state has not updated yet
  setReturnItems(
    poItems.map((item) => ({ ... quantity: 0 ... })),   // poItems is still []
  )
}
```

At that moment `selectedPoId` is still `null`, so the query is `disabled` and
`poItems` is the `[]` default. The seed therefore produced an empty list. Nothing
re-derived it when the query later resolved, because the rows were state rather
than a projection of the query. Both reported symptoms are the same line:

- no products listed, because `returnItems` was `[]`;
- the button disabled, because `[].every((i) => i.quantity === 0)` is `true` for
  an empty array — the guard was working correctly on an empty list.

**Fix:** the rows are now derived from the query and only the user's input is
held in state, which is the pattern already used by the receiving form
(`purchase-receipt-form-page.tsx`). `itemLines` is a `Record<productId, {quantity,
reason}>` of edits, and `returnItems` is a `useMemo` projection over `poItems`,
so the table appears whenever the items arrive and a refetch cannot discard
typed-in quantities. `handleSelectPo` only records the selection. An order with
no lines now says so instead of showing a blank table, and the button is also
held disabled while the items are still loading.

**Affected files:** `src/features/purchases/pages/purchase-returns-page.tsx`,
`src/i18n/locales/{es,en}/purchases.json` (`orderHasNoItems`)

**Commit:** `b6000f8`

---

### 2026-09-25 — "Crear Devolución" (and three other wrappers) failed to save

**Symptom:** open a purchase order, press **Crear Devolución**, fill the reason and
the lines, press save, and nothing is stored. Creating a purchase request from the
same module fails the same way, and saving a product compatibility entry fails too.

**Root cause: the TypeScript wrappers had drifted from the Rust signatures.** Every
command crosses the IPC boundary through a hand-written wrapper in
`src/lib/tauri.ts`, and the payload shape is not checked by anything. Tauri
deserialises the arguments into the command's own parameter list, so a payload
nested one level deeper than the command expects is rejected before the command
ever runs:

```
invalid args `supplierId` for command `create_purchase_return`
```

```ts
// before
export async function createPurchaseReturn(userId: number, input: {...}) {
  return invoke("create_purchase_return", { userId, input })
}
// after
export async function createPurchaseReturn(userId: number, input: {...}) {
  return invoke("create_purchase_return", { userId, poId, supplierId, reason, items })
}
```

`create_purchase_request` had the identical defect, and `deleteProductCompatibility`
invoked `delete_product_compatibility`, a command that does not exist — the backend
registers `delete_compatibility`.

**Investigation.** The component tests could not have caught this: they mock
`@/lib/tauri`, so the wrapper is stubbed out and only the page is under test. The
mocks were written to agree with the wrapper, so a wrong payload passed as a
correct one. The gap was found by reading the wrappers against the signatures after
the receiving fix, and the first finding was that a compile-time check was needed.

**Fix.** The three wrappers now send the flat, camelCase arguments their commands
declare, matching the shape every other wrapper in the file already used.

A **static contract test** now prevents the whole class of bug. It parses every
`#[tauri::command]` signature out of the Rust sources, parses every `invoke()` call
out of `src/lib/tauri.ts`, and fails when a wrapper invokes a command that does not
exist or omits a required argument. It covers the ~215 calls whose payload is
written inline. Three kinds of call cannot be checked that way and are pinned by
name so that adding one is a deliberate act: payloads that spread another object,
payloads forwarded as a bare expression (`invoke("create_category", data)`), and
Rust parameters whose wire name is ambiguous because they are bound but never read
(`_sale_price` in `create_product`/`update_product`, and the five `create_sale`
parameters the backend recomputes). The audit found no further mismatches.

**Also guarded: the return form.** A return against an order that has no supplier
was offered as a valid action. The button is now disabled with an explanation, and
`selectedOrderHasSupplier` decides it.

**Still open, needs a product decision.** `createProductCompatibility` sends
`vehicleBrand`/`vehicleModel`/`engine` as free text, but `create_compatibility`
takes `brand_id`/`model_id`/`engine_id`. The command name is wrong *and* the data
model does not match, so this needs a decision about whether the form should pick
from the vehicle catalogue or the backend should resolve names. It is listed in the
contract test's `KNOWN_BROKEN_COMMANDS` so it is not mistaken for a regression, and
it is deliberately **not** counted as fixed here. Tracked as M-14 in
`docs/KNOWN_ISSUES.md`.

**Commit:** `40b2a75`

---

### 2026-09-25 — The global profit percentage could not be found in Settings

**Symptom:** the app applies a default profit percentage to products that do not
carry their own, but the setting cannot be located in **Configuración**, and there
is no sign of it in Settings → Negocio.

**Root cause: not a missing feature — a missing label.** The whole mechanism was
already correct and remains untouched:

- `seed.rs` creates the row: `default_margin_percent`, category `business`,
  type `number`, validation `{"min":0,"max":90}`.
- `pricing::get_default_margin` reads it, falling back to `30.0`.
- `resolve_sale_price` uses a product's own margin when it has one, its manually
  edited price when it has one, and the global default otherwise.
- `persist_setting` re-prices every product that follows the default
  (`reprice_following_global_default`) whenever the setting is saved, and the
  settings page's **bulk** endpoint goes through that same helper, so saving from
  the UI does apply it.

What was missing was the name. `AdminSettingsPage` labelled each row with
`setting.key.replace(/_/g, " ")` and the category with a CSS `capitalize`, so the
page offered a tab reading **business** and a row reading **default margin
percent**, with the seeded English description underneath. Both strings are
developer-facing, which is why the setting looked absent rather than merely ugly.
Four categories (`performance`, `company`, `tax`, `notifications`) had no
translation at all and rendered as bare English words.

**Fix.** The page now resolves `settings.keys.<key>` and
`settings.keys.<key>.description` from the `admin` namespace, falling back to the
readable key and the row's own description so a setting nobody has translated still
renders. All **67** seeded settings and the four untranslated categories now have
names and descriptions in Spanish and English. The product form's margin hint points
at the place the value is changed.

**Verification.** Confirmed against a copy of the real database that the setting
exists (`default_margin_percent` = `30`, category `business`) and that the fallback
is reachable: `pricing::get_default_margin`, `resolve_sale_price` and
`reprice_following_global_default` all key off `profit_margin_pct IS NULL`, and the
product form already submits `null` when the field is left empty.

**Worth knowing.** In the real database **0 of the products have a NULL margin**:
the schema migration at `schema.rs:42` backfilled
`ROUND((sale_price / cost_price - 1) * 100, 1)` for every existing row, and every
product keeps its historical margin. That is correct — existing prices should not
move — but it means the global default only applies to products created from now on
with the field left empty. Nothing was re-priced, by design.

**Commit:** `40b2a75`

### 2026-09-25 — "Recibir Orden" showed an error instead of the receiving form

**Symptom:** send a purchase order to its supplier, press **Recibir Orden**, and the
receiving form never appears. A toast reports that the order could not be loaded,
and the page stays empty. The order is correctly `sent`, so the step before it
worked.

**Root cause: `get_purchase_order_items` read the wrong columns out of every
row.** The query joined the product table for its name and SKU:

```sql
SELECT poi.*, p.name as product_name, p.sku as product_sku
FROM purchase_order_items poi
LEFT JOIN products p ON poi.product_id = p.id
```

`purchase_order_items` has **13** columns, so `poi.*` occupies indices 0-12 and the
two joined values land at 13 and 14. The row mapper read `product_name` at index
**3** and every later field from there on, as if the join had added its columns
next to `product_id` rather than at the end. So each field was filled from the
wrong column:

| index | actual column | read as |
|---|---|---|
| 3 | `supplier_sku` | `product_name` |
| 4 | `quantity` | `product_sku` |
| 5 | `unit_cost` | `supplier_sku` |
| 6 | `discount` | `quantity` |
| 11 | `created_at` | `received_quantity` |
| 13 | `product_name` | `created_at` |

The command therefore failed on **every order that has any line at all**: the very
first read, `product_name`, pointed at `supplier_sku`, which is `NULL` for orders
created through the interface — `Invalid column type Null at index: 3, name:
supplier_sku`. Even with a non-NULL `supplier_sku` it could not have produced
usable data: `quantity` would have come from `discount` and `received_quantity`
from the `created_at` text, which cannot convert to `i64`.

The defect is old, but invisible: the only intended caller was never written. The
order detail page still carries the comment *"A real implementation would call
getPurchaseOrderItems and render them"*, so nothing had ever invoked the command.
Shipping the receiving form made it the first real caller, which is why the bug
surfaced at exactly this point in the workflow.

**Investigation.** The two halves were separated first. The database was copied
and `receive_purchase_order_inner` was run against the real rows for both `sent`
orders: both succeeded, created `REC-000001`/`REC-000002` and moved the orders to
`completed`, so the write path was sound. That left the read path. The page's
first call on mount is `getPurchaseOrderItems`, and a probe replaying its exact
`SELECT` alongside the mapper's exact `row.get(n)` calls printed the real column
layout next to the reads and showed the shift.

Note that the frontend could not have caught this: the test for the receiving form
mocks `getPurchaseOrderItems`, and the mock was written from the same wrong
assumption. The gap was only visible against the real command.

**Fix.** The `SELECT` now lists its columns explicitly, and `map_po_item_row` reads
every value **by column name** (`row.get("received_quantity")`), so the mapper can
no longer drift from the query when either side changes. The command delegates to a
new `get_po_items_inner`, which is directly testable.

**The same defect was in five more queries.** Auditing every `SELECT <alias>.*` in
the backend turned up six in this module, and all six were mis-mapped:

| query | base columns | joined values actually at | mapper read them at | effect |
|---|---|---|---|---|
| `purchase_order_items` | 13 | 13, 14 | 3, 4 | error (reported above) |
| `purchase_receipt_items` | 9 | 9, 10 | 4, 5 | error, on the page the form opens after a successful receipt |
| `purchase_request_items` | 8 | 8, 9 | 3, 4 | error |
| `purchase_return_items` | 7 | 7, 8 | 3, 4 | error |
| `product_cost_history` | 9 | 9-13 | 2-6 | error (five joins) |
| `supplier_products` | 12 | 12, 13, 14 | 10, 11, 12 | **no error, wrong data** |

`supplier_products` is the one that would have been hardest to notice: every value
from `product_name` onwards came from the wrong column but the *types* still lined
up, so the page rendered a timestamp as the product name, the product SKU as
`created_at`, and the brand name as `updated_at` — no error, just quietly wrong
data. All six now select explicit columns and read by name.

`sales.rs` has the same pattern in 16 further queries (sales, quotes, credit,
daily closings, cash register history). Those were left alone: they are a separate
module, and the sales and purchase mappers cannot be assumed consistent. For
example `sales.rs:526` reads the joined product values at 9 and 10, which is correct
for its 9 base columns, while `sales.rs:1613` reads `customer_name` at index 12
where `sales` has 16 base columns.

**Files:** `src-tauri/src/commands/purchases.rs`

**Tests:** `po_items_report_real_columns_not_shifted_ones`,
`receipt_items_report_real_columns_and_the_receipt_reads_back`, and
`every_shifted_join_query_in_purchases_is_aligned` assert the real values, not just
that the query runs. Reverting each mapper to its original positional form fails
them — for example the supplier-product assertion reports
`left: Some("2026-09-26 03:45:18"), right: Some("Widget")`.

---

### 2026-09-25 — "Enviar a Proveedor" did nothing, and a sent order could never be received

**Symptom:** approve a purchase order, press **Enviar a Proveedor**, and nothing
happens. The order stays *Aprobado* forever. Following the order from there was
impossible: there was nowhere to record the delivery, so an order could never
leave *Enviado*.

**Root cause: three defects in a row, on one path.**

**1. The transition the button performs was not allowed.** The order detail page
offers *Enviar a Proveedor* exactly when the order is `approved`, and sends
`update_purchase_order_status(id, "sent")`. The backend's transition table had no
`approved` arm at all, so the command answered `Invalid status transition from
'approved' to 'sent'`. The failure surfaced only as a toast, so from the user's
side the button did nothing.

The table had drifted from the interface: the page had grown an approval step
(*Borrador → Pendiente de Aprobación → Aprobado → Enviado*) and the table was
never extended to match. `approved` could also not be cancelled, and the only way
out of `approved` was nothing.

**2. The receive page did not exist.** *Recibir Orden* navigated to
`/purchases/receipts/new?poId=`, which was not a route, so the catch-all
redirected to `/dashboard`. The click looked like it did something — the app
simply changed page. `receive_purchase_order` only accepts an order that is
`sent` or `partially_received`, so with the order stuck in `approved` and no
receipt page, the workflow had no exit at either end.

**3. The pages and the backend disagreed on the name of the final status.** The
backend writes `completed` when every ordered unit is accounted for
(`receive_purchase_order` picks `completed` or `partially_received` itself), but
both the detail page and the orders list carried hand-written English maps with
`received` in that slot. So a finished order showed the raw string `completed` in
an otherwise translated interface, and the status filter offered a value that no
query ever returns instead of the one that does.

**Investigation.** The reported button maps to exactly one call,
`purchase-order-detail-page.tsx` → `update_purchase_order_status(..., "sent")`,
so the first thing checked was the transition table, which is where the arm was
missing. From there: the reachable routes were listed to find the second dead
end, and the statuses written by every query compared against the ones the pages
named. The documentation was checked too, and had drifted as well — it described
a `Draft → Sent → Confirmed → Received → Closed` flow with no approval step and
a `+ New Receipt` button on the receipts list that has never existed.

**How the workflow is meant to run.** `approved` is the gate: an order is signed
off, then sent, then received, and receiving is the only way to finish. The
transition table now covers every step the interface offers, and the two terminal
states — `completed`, `cancelled` — accept nothing further. `completed` and
`partially_received` are chosen by the backend from the lines actually received,
so they are not statuses a user picks.

**Fix.**

- `valid_status_transition` is now a named function with the lifecycle drawn
  above it, and gains the two missing `approved` arms: `→ sent` and
  `→ cancelled`. `update_purchase_order_status` is split into a thin command and
  an `_inner` that takes a connection, matching the pattern the two earlier
  purchase-order fixes in this file established.
- New `src/features/purchases/pages/purchase-receipt-form-page.tsx`, routed at
  `/purchases/receipts/new`. It loads the order and its lines, shows what is
  still **outstanding** — ordered minus already received minus already damaged,
  so a second delivery is counted against what is left and not against the
  original quantity — and pre-fills each line with it, making a complete
  delivery one click. Received and damaged are separate columns, and only
  `received − damaged` reaches stock. It refuses a line that claims more than is
  outstanding, refuses an empty receipt, requires a warehouse, and lands on the
  receipt it created.
- `src/features/purchases/purchase-order-status.ts` holds the canonical status
  list, its translation keys and its badge variants. Both pages read from it, so
  a status cannot be named one thing in a badge and another in a filter. The
  hardcoded English maps are gone, which also means the status column follows the
  interface language like the rest of the page.
- Seven new keys per locale for the receive page, inserted next to their
  neighbours rather than re-sorting the file.

**Tests.** 5 Rust tests, 15 frontend.

Rust, on a real database: an approved order reaches the supplier and stamps
`sent_at` (the timeline and the supplier KPIs read that column); approving records
the approver and the moment; an approved order cannot be received before it is
sent; receiving everything closes the order and the same order cannot be received
twice; and the transition table itself is asserted, every allowed step and ten
refused ones. Dropping the `approved → sent` arm fails 3 of the 5.

Frontend, in `tests/regression/bug-011-purchase-order-workflow.test.tsx`: the
route the button links to exists; lines are pre-filled with what is outstanding
and a partially received order is counted against the remainder; the submitted
payload carries the order, the signed-in user, the warehouse and every line, with
damaged units kept separate; over-receipt and empty receipts are refused; the
approved order's *Send to Supplier* calls the status command with `sent`; and
the status vocabulary is the one the backend writes, with every status translated.
Removing the route fails 1, restoring `received` in place of `completed` fails 2.

**Files.** `src-tauri/src/commands/purchases.rs`,
`src/features/purchases/purchase-order-status.ts` (new),
`src/features/purchases/pages/purchase-receipt-form-page.tsx` (new),
`src/features/purchases/pages/purchase-orders-page.tsx`,
`src/features/purchases/pages/purchase-order-detail-page.tsx`,
`src/features/purchases/index.ts`, `src/routes/index.tsx`,
`src/i18n/locales/{es,en}/purchases.json`,
`tests/regression/bug-011-purchase-order-workflow.test.tsx` (new),
`docs-site/purchases/receiving.md`, `docs-site/purchases/orders.md`.

Frontend 488 → **503**, Rust 156 → **161**.

---

### 2026-09-25 — A page header was hidden under the top bar, and the page called itself "Panel de Control"

**Symptom:** on *Inventario → Fabricantes* the page title was cut in half by the
bottom edge of the top bar — only the last four rows of "Fabricantes" were
visible, while the description, the *Agregar Fabricante* button and the table
rendered normally below it. The top bar itself read "Panel de Control".

**Root cause: two defects, one report.**

**1. The scroll container could report scrollable overflow on a page that fits.**
`main` is the scroll container of the content column, and its only child carried
`h-full` — `height: 100%`. A percentage height resolves against the containing
block, and the containing block's own height is a *flex item* height, resolved
from the free space of the column. Those two resolutions are not guaranteed to
agree, so the child can end up computed taller than the box `main` actually
scrolls. `main` then has scrollable overflow out of nothing, even though the page
content is only a few hundred pixels tall — and `overflow` clips at the padding
edge, so a scrolled short page shows its first line box sliced by the top of
`main`.

The screenshot is that state precisely. Measured off the image: `main` 927px
tall, its child 45px taller, `scrollTop` 45, `h1` line box at 35 relative to the
viewport where a correct layout puts it at 80, and *every* following element —
description, button, table borders, pagination — displaced upward by the same
45px. Nothing else in the app could produce that: a uniform shift of all page
content, with the clipping happening exactly at `main`'s top edge, is the
signature of a scroll offset and nothing else.

**2. The top bar's title came from a hand-written map of thirteen routes.**
`routeNameKeys` in `top-bar.tsx` fell back to `dashboard.title` for any path it
did not list. `/inventory/manufacturers` was not listed — nor were most of the
eleven child pages under *Inventario* — so the page announced itself as "Panel de
Control", the very label the user described the header as being hidden
underneath. The map had also drifted from the sidebar: it carried
`inventory.transfersTitle` where the sidebar says `inventory.storeTransfers`, and
listed `/customers`, `/vehicles`, `/reports` and `/employees`, which the sidebar
files under *CRM* and secondary navigation.

**Investigation, including what was ruled out.** The screenshot is 1920×1080 with
the window at (70, 69), so the webview is 1850×1011; the sidebar measures 256px
(`w-64`) and the top bar 56px (`h-14`) in screenshot pixels, which pins device
pixel ratio 1 and rules out a scaled or HiDPI capture. `dist/` was confirmed
stale (built 15:41, predating the `min-w-0` fix at 15:47) but that build only
explains *horizontal* clipping, and the app was running through Vite at
`localhost:5173`, so `dist/` was not what the screenshot rendered. The live app
was then measured in the same engine at the same size with a stubbed Tauri IPC,
and it reported `h1.top = 80`, `scrollTop = 0`, `scrollHeight === clientHeight`
— i.e. the faulty state did not reproduce on demand, which is expected of a
height-resolution disagreement and is why the invariant was removed rather than
the trigger chased.

**Fix.**

- `app-shell.tsx`: the child is now `min-h-full` instead of `h-full`, and `main`
  gains `min-h-0` with `overflow-y-auto overflow-x-hidden`. `min-h-full` cannot
  exceed its container, so a page shorter than `main` can no longer produce
  scrollable overflow at all; `min-h-0` lets the flex item shrink below its
  content so `main` is the only box that scrolls. Horizontal scrolling stays with
  the tables that need it, which scroll in their own container.
- `top-bar.tsx`: the hand-written map is gone. Titles are resolved from the
  sidebar's own navigation config — the single source of truth, so a page cannot
  drift from the menu again — matching the **longest** href prefix, so
  `/inventory/manufacturers/7/edit` reports "Fabricantes" and not "Inventario". A
  route with no nav entry falls back to its section's label rather than to the
  dashboard.
- `src/config/navigation.ts`: new module holding `navigation` /
  `secondaryNavigation` (moved verbatim out of `sidebar.tsx`, which now imports
  them) plus `resolveRouteNameKey`. Nothing about the menu itself changed.

**Tests.** `tests/regression/bug-010-page-header-clipped.test.ts`, 9 tests. The
layout half asserts the invariant against the source, since jsdom performs no
layout; reverting `min-h-full`/`min-h-0` fails 2 of them. The title half drives
the real resolver: nested paths, longest-prefix preference, the routes the old map
covered, trailing slashes, and the case that motivated the prefix rule —
`/inventory/manufacturers-archive` must *not* resolve through
`/inventory/manufacturers`. Frontend: 479 → **488**.

`bug-007-tab-bar-clipping.test.ts` asserted main's exact old className string.
Its intent — main shrinks and main is what scrolls — is unchanged, so the
assertion was widened to the invariant instead of the literal.

**Files.** `src/layouts/app-shell.tsx`, `src/layouts/top-bar.tsx`,
`src/layouts/sidebar.tsx`, `src/config/navigation.ts` (new),
`tests/regression/bug-010-page-header-clipped.test.ts` (new),
`tests/regression/bug-007-tab-bar-clipping.test.ts`.

**Commit:** `cff7588`

---

### 2026-09-25 — Picking a date left the calendar open with no way to close it

**Symptom:** in *Compras → Nueva orden de compra*, choosing a date in
*Entrega Esperada* left the calendar sitting on screen. Neither clicking again
nor pressing Enter dismissed it.

**Root cause: the calendar was not ours to close.** `DateField` rendered a native
`<input type="date">`. Its calendar is drawn by the webview, outside the DOM, and
the platform exposes `showPicker()` to *open* it with no counterpart to close it.
There was no code path that could have hidden it, so the field could only ever
be dismissed by whatever the webview chose to do. jsdom cannot show the symptom,
and no source-level assertion could catch it: the component was doing exactly
what it was written to do.

**Fix.** `DateField` now owns its calendar, built on the `Popover` primitive the
app already uses in `customer-search-field.tsx` and
`product-search-combobox.tsx`. Dismissal is now deterministic — the calendar
closes on:

- picking a day (the reported bug)
- `Enter`
- `Escape`
- a click outside
- clicking the field again

A new `Calendar` component renders the month grid with `date-fns` (already a
dependency; it was previously used only by the status bar). It follows the
selection when the value changes from outside, and month and weekday names
follow the active language.

**The value contract is unchanged: still `yyyy-MM-dd`.** Callers, the API and
the database see exactly what they saw before, and a hidden input keeps the
value in the DOM under its own `name` so native form posts still work. Nothing
downstream needed changing.

**Tests.** 9 new tests, mutation-tested rather than merely written:

- dropping the `setOpen(false)` from the select handler — the original bug —
  fails 4 of them;
- additionally dropping the `Enter` handler fails a 5th, which is the one that
  pins `Enter` specifically.

They drive the real component with the real i18next resources and assert the
popover is **absent from the document**, not merely hidden. The target day is
derived from the current month rather than hardcoded, so the suite does not start
failing on the 1st of a new month. Frontend: 470 → **479**.

**One test bug worth recording, because it would have shipped a false
pass.** The suite first located day cells by role plus accessible name. Once a
date is set, the *field itself* reads the same "15 de septiembre de 2026", so
the query matched two elements and the test failed for the wrong reason. Day
cells are now scoped with `within(getByRole("group"))`. Related: the tests
needed `ResizeObserver` and pointer-capture polyfills, which no test in the repo
had, because nothing had ever opened a Radix overlay under jsdom. They are in
`tests/helpers/setup.ts` now, for the next overlay component.

**Not changed:** five other forms still use a raw `<Input type="date">` and so
still get the native calendar — `crm-reminders-page.tsx`,
`crm-warranties-page.tsx`, `quote-form-page.tsx` and the two date-range inputs
in `report-filters.tsx`. `DateField` is now a drop-in for all of them; migrating
them was outside what was reported and is left as a deliberate follow-up.

**Files:** `src/components/ui/calendar.tsx` (new),
`src/components/forms/date-field.tsx`, `src/i18n/locales/{es,en}/common.json`,
`tests/regression/bug-009-date-picker-dismiss.test.tsx` (new),
`tests/helpers/render.tsx`, `tests/helpers/setup.ts`.

---

### 2026-09-25 — Saving a purchase order never persisted anything

**Symptom:** *Compras → Nueva orden de compra → Guardar* appeared to do nothing.
No error appeared, the save button stayed busy, and the form never left for the
order list. The same shape as the "Abrir Caja" hang fixed in BUG-005.

**Root cause: the same non-reentrant lock, in a module nobody had scanned.**

`DbState.conn` is an `Arc<Mutex<Connection>>` over `std::sync::Mutex`, which
cannot be locked twice by one thread. Both save commands took the lock and then
called a private helper that took it again:

- `create_purchase_order` finished with `get_po_by_id(&state, po_id)`
- `update_purchase_order` called `get_po_status(&state, id)` on its *first*
  statement, and `get_po_by_id(&state, id)` at the end
- `update_purchase_order_status`, `delete_purchase_order`,
  `create_purchase_request`, `update_purchase_request_status`,
  `receive_purchase_order`, `create_purchase_return` — same shape

So the whole purchasing module was deadlocked, not just order creation: **11
call sites across 9 commands.** Orders, purchase requests, returns and receiving
were all affected. Every one of them hung silently, because a blocked `lock()`
produces no error and no log — the Tauri `invoke` simply never resolved.

**Why this survived the BUG-005 fix, which is the part worth remembering.**

The structural guard added for BUG-005 passed, and it was reporting `0` findings
for `purchases.rs`. That zero was false, for two independent reasons:

1. **The guard was hardcoded to one file.** It read
   `src/commands/sales.rs` and nothing else, so the other five command modules
   were never scanned at all.
2. **Its callee set was keyed on the literal string `State<DbState>`.** The six
   helpers it needed to catch are declared `fn get_po_by_id(state: &State<DbState>,
   id: i64)` — private, and behind a `&`. They were also called as
   `get_po_by_id(&state, ...)`. Worse, `get_conn` itself is declared
   `State<'r, DbState>`, with a lifetime, so the literal never matched it either.
   The set was quietly missing exactly the functions that matter.

An earlier ad-hoc script scan in this session was worse still: it reported
`get_purchase_orders() -> get_conn()` and several hundred cross-file calls that
do not exist. **Its output was noise and was discarded.** Three of the four
scanners written for this bug were wrong, and the only one that could be trusted
was the Rust test — once it was generalized.

**Fix.** The 6 helpers became `*_inner(&rusqlite::Connection, ...)`, taking the
guard the caller already holds, matching the convention BUG-005 established.
`create_purchase_order` and `update_purchase_order` were also split into a thin
`#[tauri::command]` that takes the lock once plus an `_inner` that does the work,
so the save path itself became testable.

The guard was rewritten to scan **every** `src/commands/*.rs` file, and to key
re-locking functions off their **signature** containing `DbState` — which covers
`&State<DbState>`, `State<'r, DbState>`, public and private alike, and cannot be
fooled by a `use crate::db::DbState;` import. It also records *where* each guard
is acquired, so the one legitimate `get_conn` call is not mistaken for a
re-lock. `sales.rs` is clean; the 11 real findings were all in `purchases.rs`.

**Tests.** The generalized guard was mutation-tested: reintroducing a
state-taking `get_po_status` wrapper makes it fail with
`purchases.rs: update_purchase_order() calls get_po_status() while holding the
lock`, and it passes again once reverted. Four behavioural tests now drive the
real save path through `create_purchase_order_inner` against a temp database and
assert the order and its line items are genuinely stored, `po_number` advances
across saves, updating a draft replaces rather than appends line items, and a
non-draft order is refused. Rust: 152 → **156** passing under
`RUSTFLAGS="-D warnings"`.

**Lesson: a guard that reports zero findings has not been shown to work.** This
one had passed review and a mutation check while silently covering a single file
and matching the wrong signature shape. A structural test earns its keep only
once it has been caught failing on a real instance of the bug.

**Files:** `src-tauri/src/commands/purchases.rs` (6 helpers, 11 call sites, 2
commands split, 4 new tests), `src-tauri/src/commands/sales.rs` (guard
generalized to all command modules).

---

### 2026-09-25 — Tab bar on the sale detail page could be clipped out of view

**Symptom:** after the `{{count}}` fix, the tab names "Detalles", "Pagos" and
"Recibos" were still reported as not visible. The user described the space as
"reduced" or the bar as "pushed up and overlapping another component".

**First: a stale build explained part of it.** `dist/` was built at 11:14, hours
before that day's three fixes, and still contained the old `"{{count}} artículos"`
translation. Rebuilt and confirmed the string was gone. `dist/` is gitignored, so
it never showed up in `git status` - worth remembering when a fix appears not to
have landed.

**What was ruled out, and how.** The tabs are not missing, hidden or overlapped:

- Rendering the page with the real i18next resources and dumping the DOM shows
  four tabs with correct text: `Detalles | Pagos | Recibos | Reembolsar`.
- No `hidden`, `invisible`, `opacity-0` or `sr-only` anywhere in the page.
- No `absolute`, negative margin, `z-index`, `sticky` or `fixed` in the page, so
  nothing can overlap the bar. The `TopBar` is `sticky top-0 z-30` but sits in a
  non-scrolling `overflow-hidden` column, so it never moves.
- Theme contrast is adequate in both modes: `muted-foreground` `oklch(0.708)` on
  `muted` `oklch(0.269)`.
- `no-print` is applied to four elements here but defined nowhere, and there is no
  `@media print` outside `print-dialog.tsx` - it cannot hide anything.

**Root cause found.** A layout fault, which no DOM test can catch because jsdom
performs no layout. Two properties compose:

1. Every `TabsTrigger` has `whitespace-nowrap`, so the bar's min-content width is
   the sum of its labels and cannot shrink - roughly 500px for four tabs.
2. In `app-shell.tsx` the content column is a flex item of a row with
   `overflow-hidden`. A flex item defaults to `min-width: auto`, i.e. its
   min-content width, so without an explicit `min-w-0` the column refuses to
   shrink below that 500px, is pushed sideways, and the row clips it.

That matches the user's own guess that the space was reduced and the bar pushed
out of view.

**Fix:** `min-w-0` on the content column and on `main`, so the column can shrink
and `main`'s `overflow-auto` scrolls instead of the row clipping. `TabsList` gets
`max-w-full overflow-x-auto` so the bar scrolls horizontally rather than forcing
the page wider, and each trigger gets `shrink-0` so a shrinking trigger cannot
clip its own nowrap label. No page's appearance changes at normal widths.

**Regression test:** `tests/regression/bug-007-tab-bar-clipping.test.ts` asserts
the three class invariants against the source, since the property is about how
the classes compose rather than about any single rendered element. Verified by
reverting all three changes: 3 of 3 fail, and pass again once restored.

**Result:** 470 frontend tests across 61 files (was 467/60).

**Caveat, stated plainly:** this fix removes a mechanism that can clip the tab
bar, but the symptom was never reproduced locally, so it is not confirmed to be
the cause. If the bar is still missing after this, a screenshot is needed - the
code and the rendered DOM both say it is there.

---

### 2026-09-25 — Sale detail page rendered `{{count}} artículos` instead of the item count

**Symptom:** on *Ventas → venta individual*, a literal `{{count}}` appeared under
the tab bar, where the item count should be. Reported alongside the tab names
"Detalles", "Pagos" and "Recibos" being hidden.

**The tab names were never broken.** Rendering the page with the real i18next
resources and dumping the DOM showed the tabs present and correct:
`Detalles | Pagos | Reembolsar | ...`, and `sales.details`, `sales.payments`,
`sales.receipts` all resolve. The broken string sat immediately *below* the tab
bar, which is what made it look as though the tabs were at fault.

**Root cause:** `sales.items` was `"{{count}} artículos"`, and three call sites
invoked it with no interpolation argument:

- `sale-detail-page.tsx:201` - `t("sales.items")} ({items.length})`, so the page
  read `{{count}} artículos (1)`: a broken placeholder *and* a count appended
  separately.
- `sale-detail-page.tsx:415` - refund summary label.
- `quote-detail-page.tsx:124` - quote items heading.

i18next substitutes only the arguments it is given, so a missing `count` is not
replaced - the placeholder is emitted verbatim.

**Investigation, including two wrong turns worth recording.** The first scanner
built namespace-qualified keys from the JSON file *name* and reported six
offenders; re-running with the filename as the namespace produced a different
wrong answer of 320 missing keys, because i18next is configured with
`nsSeparator: "."` and resolves `commandPalette.placeholder` and
`admin.about.title` as namespace `common`/`admin` respectively. Both scans were
fiction. Only querying the real i18next settled it: `admin.about.title` resolves
to "Acerca de" and `commandPalette.placeholder` to "Escribe un comando o
busca...", so all 320 were false positives, while `inventory.previewTable` is
genuinely missing and renders as its own key.

**Fix:** every call site now passes `count`, and the translation was split so a
count-less call degrades cleanly instead of leaking a placeholder:

```json
"items":       "Artículos",
"items_one":   "{{count}} artículo",
"items_other": "{{count}} artículos"
```

Dropping the bare `{{count}}` string is deliberate: a future call site that
forgets `count` renders "Artículos" rather than `{{count}} artículos`. This also
fixes the agreement the old key could not express - `1 artículos` is now
`1 artículo`, via i18next pluralisation, which the project had not used before.

**Regression test:** `tests/regression/bug-006-i18n-placeholder-leak.test.tsx`
renders the page with real translations and asserts no `{{...}}` reaches the DOM,
that the tab names are present, and that the count agrees in number.

That guard could not be validated by reinstating the original bug, because the
fix removes the placeholder from the base key - restoring `count`-less calls now
renders "Artículos (1)", which is correct-by-design. So the guard was mutation
tested by putting a placeholder back into the base key instead; it fails with
`unresolved i18n placeholders rendered: {{count}}`, and the singular/plural
assertion covers the original regression.

**Result:** 467 frontend tests across 60 files (was 464/59).

**Also noticed, not fixed:** `no-print` is applied to four elements on this page
but is defined nowhere in the project and there is no `@media print` rule
outside `print-dialog.tsx`, so printing a sale still emits the action buttons and
the tab bar. Unrelated to the reported symptom, and left alone.

---

### 2026-09-25 — "Abrir Caja" never saved: the command deadlocked on the DB mutex

**Symptom:** after the amount field was fixed (below), opening *Ventas → Caja
Registradora → Abrir Caja* still did nothing. The dialog stayed open, the button
spun, no error, no log, no crash.

**Root cause:** `open_cash_register` took the database lock and then called a
helper that takes it again:

```rust
let conn = get_conn(&state)?;                          // guard now held
let existing = get_cash_register_status(state.clone())?; // locks again
```

`DbState.conn` is `Arc<Mutex<Connection>>` with **`std::sync::Mutex`**, which is
not reentrant. The second `lock()` blocks on a mutex the same thread already
holds, so the command never returned and the Tauri `invoke` never resolved.
Silent by construction: a deadlock produces no error to surface.

Reproduced the exact shape standalone (`get_conn` + a helper that locks again)
and confirmed the thread never returns.

**Investigation:** rather than stop at the reported symptom, scanned all 114
commands taking `State<DbState>` for functions that hold a `get_conn` guard and
call another such command. **Six commands across nine call sites deadlocked**,
and five had nothing to do with the cash register:

| Command | Called |
|---|---|
| `open_cash_register` | `get_cash_register_status` |
| `create_quote` | `get_quote` |
| `update_quote` | `get_quote` |
| `update_quote_status` | `get_quote` |
| `convert_quote_to_sale` | `get_quote`, `get_quote_items`, `process_checkout` |
| `close_daily_shift` | `get_daily_closeout` |
| `mark_receipt_printed` | `get_receipt` |

**Fix:** extracted a connection-scoped `*_inner(&Connection)` body for the five
pure-read helpers and left the Tauri command as a two-line wrapper that takes the
lock once and delegates, so every existing call site is unchanged. The nine
offending call sites now reuse the guard they already hold.
`convert_quote_to_sale` is the exception: `process_checkout` is a write that
acquires the lock itself and is far too large to refactor here, so it drops the
guard first with an explicit `drop(conn)` and re-acquires afterwards.

**Regression test:** `no_command_calls_a_relocking_command_while_holding_the_lock`
in `src-tauri/src/commands/sales.rs`. A behavioural test cannot cover this -
reproducing it needs a `tauri::State`, and a hung test process is
indistinguishable from a slow one - so it asserts the structural invariant
instead. Three defects of my own, each caught by checking rather than assuming:

1. It flagged `convert_quote_to_sale` even after the `drop(conn)` fix, because a
   *comment* naming `process_checkout` registered as a call to it. The scanner
   now strips comments, tracking string literals and escapes.
2. It reported zero guards under the name `""`, which made it flag every call
   site unconditionally: `rfind("let ") + 4` already skips past `"let "`, and I
   then skipped to the next space as well, consuming the variable name. The
   extraction is now asserted non-empty so a silent regression cannot recur.
3. Neither bug was visible until the test was run with the deadlock
   deliberately reintroduced, which is the only way to know a structural guard
   still bites. It now reports the offending command by name.

**Also hardened:** `openMutation` and `closeMutation` had no `onError`, so any
backend failure was completely invisible. They now surface
`notification.error(...)`, matching the POS pages.

**Result:** 152 Rust tests (was 151), 464 frontend tests across 59 files.

**Noticed, still not fixed:** `openCashRegister(1, ...)` hardcodes user id `1`
instead of the signed-in user, so a session is always attributed to that user.
Separate pre-existing issue.

---

### 2026-09-25 — "Abrir Caja": the initial amount field rejected every keystroke

**Symptom:** opening *Ventas → Caja Registradora → Abrir Caja* and trying to type
the opening balance did nothing. The field would not accept numbers. The same
field in *Cerrar Caja* was equally dead.

**Root cause:** the codebase has two different `onChange` contracts and they are
not interchangeable:

| Component | Contract |
|---|---|
| `SelectField`, `Combobox` | `onChange(value: string)` |
| `Input`, `TextField`, `TextareaField` | `onChange(event)` |

`TextField` (`src/components/forms/text-field.tsx`) extends
`React.InputHTMLAttributes<HTMLInputElement>` and spreads its props straight onto
a native `<input>`, so it delivers a **ChangeEvent**. The field was written as if
it delivered a value:

```tsx
<TextField type="number" value={openingBalance}
           onChange={(v) => setOpeningBalance(Number(v))} />
```

`Number(changeEvent)` is `NaN`. Every keystroke therefore stored `NaN`, and a
controlled `<input type="number">` whose value is `NaN` renders as an
unparseable/empty field — so the input looked frozen rather than erroring. The
failure was silent by construction: no console output, no thrown error, just a
box that would not take a number.

**Investigation:** traced the symptom from the page to the shared form
component, then read the two component contracts to establish which usages were
legitimate. Confirmed the frontend genuinely calls the sibling commands as
`invoke("test_device", { id })`-style payloads elsewhere, so parameter naming is
a live contract and could not be hand-waved. Rather than eyeball ~200 call sites,
scanned the source for `onChange={(v|val|value) =>` and resolved the enclosing
component for each hit: every `SelectField` usage was correct, and exactly **four
native inputs** were wrong — two in `cash-register-page.tsx` (open *and* close)
and two in `quote-form-page.tsx` (`taxRate`, `discountAmount`). The quote form
had the same dead tax-rate and discount fields, unreported until now.

**Fix:** read `e.target.value` in all four, using the codebase's established
`Number(e.target.value) || 0` form (the `|| 0` keeps an emptied field at 0
instead of `NaN`).

**Regression test:** `tests/regression/bug-004-input-onchange-contract.test.ts`
reads the source and fails on any native input whose handler consumes its
argument as a value. The existing regression tests reimplement the logic under
test, which structurally could not have caught this — the bug was in the wiring,
not the arithmetic.

The first version of that test was **vacuous and I caught it by mutation
testing**: it passed with the bug deliberately reintroduced. Two defects, both
in the scanner: it truncated the element at the first `>`, which is the arrow in
`onChange={(v) => ...}`, so the handler was never even seen; and the "is this an
event" predicate required a literal leading dot, so every correct
`setSearch(e.target.value)` was a false positive (188 of them). After fixing
brace-depth tracking and the predicate, the test reports exactly 1 offender with
the bug present and 0 with it fixed.

**Result:** 464 frontend tests across 59 files (was 461/58).

**Files:** `src/features/sales/pages/cash-register-page.tsx`,
`src/features/sales/pages/quote-form-page.tsx`,
`tests/regression/bug-004-input-onchange-contract.test.ts`

**Noticed, not fixed:** `openCashRegister(1, ...)` hardcodes user id `1` instead
of the signed-in user, so a session is always attributed to whoever that id is.
Separate pre-existing issue, left alone here.

---

### 2026-09-25 — Rust build became strict in CI and failed on 29 pre-existing warnings

**Symptom:** after fixing `npm ci`, the Windows workflow still failed, this time
at `cargo test`:

```
error: unused import: `init_database`
error: use of deprecated method `chrono::TimeZone::datetime_from_str`
error: function `resolve_effective_price` is never used
error: could not compile `inventory-gear` (lib) due to 26 previous errors
```

**Root cause:** none of this was caused by the new workflow. The action
`actions-rust-lang/setup-rust-toolchain@v1` gained an input:

```yaml
build-warnings:
  description: "Sets the build.warnings config via the CARGO_BUILD_WARNINGS variable."
  default: "deny"
```

The floating `@v1` tag now resolves to a version that exports
`CARGO_BUILD_WARNINGS=deny`, which is equivalent to `-D warnings`. So a long
standing pile of warnings became hard errors the moment a workflow ran. Verified
by reproducing locally: `RUSTFLAGS="-D warnings" cargo check` gives the same 26
errors, and the repo has no `.cargo/config.toml`, no `[lints]` table and no
`rust-toolchain` file, so the flag came entirely from the action.

**This was latent in `ci.yml` too**, which uses the same action — the main
Linux pipeline was one run away from failing the same way.

**Fix:** `build-warnings: "deny"` is now written explicitly in both workflows,
so the strictness is a recorded decision rather than an accident of a
third-party default, and all 29 warnings are fixed:

- **Real API deprecation** — `Utc.datetime_from_str` in a sales test replaced
  with `NaiveDateTime::parse_from_str(..).and_utc()`. The test still passes,
  proving identical behaviour.
- **A latent bug in `users.rs`** — a `locked_until` value was computed and never
  used; the actual query formats the interval inline. The dead copy also
  contained stray nested quotes (`"'datetime('now', '+1 hour')'"`), so it could
  never have worked had it been used. Removed.
- **A whole discarded query** in `admin/database.rs` — a `PRAGMA table_info`
  result bound to `page_est` and dropped. Removed.
- **Orphaned command inputs** — `PurchaseRequestInput` and
  `PurchaseReturnInput` were dead because `create_purchase_request` and
  `create_purchase_return` take their fields as individual parameters. Deleted.
  The `*ItemInput` structs they referenced are live command parameters and were
  kept — deleting the parents alone would have broken both commands.
- **A vestigial parameter** — `resolve_equiv_side_final` took a `&Connection` it
  never used; it resolves entirely from in-memory structures. Removed, along
  with its two call sites.
- **Unused command parameters kept for IPC safety** — `test_device`,
  `test_printer`, `get_inventory_fast_slow` and `get_sales_returns_summary` have
  parameters the logic ignores. These *cannot* be renamed to `_id`/`_days`: the
  frontend calls `invoke("test_device", { id })`, so the parameter name is the
  wire contract. Each now has `let _ = x;` with a comment saying so, instead of
  being silently renamed.
- **Dead stores in dynamic SQL** — the trailing `param_idx += 1` in
  `compatibility.rs`, `reminders.rs` and `warranty.rs` was never read.
- **Intentionally-unwired API annotated, not deleted** — `AppError`,
  `resolve_effective_price`, `seed_database`, `AppConfig::new`,
  `AppConfig::profile_file`, `add_timeline_entry`, `query_f64`, `query_i64` and
  three unimplemented `SalesReportFilter` fields are tested, intentional surface
  that no command calls yet. Deleting tested domain logic to silence a warning
  would be a regression, so each carries `#[allow(dead_code)]` and a reason.
- `PermissionInfo` and `init_database` are used only by tests, so they are now
  `#[cfg(test)]` rather than dead in the library build.

**A regression I introduced and the suite caught:** silencing the dead stores by
moving `param_idx += 1` *before* the placeholder — the obvious-looking fix —
broke `compatible_products_search_binds_after_every_other_filter`. `param_idx`
started at 1 with use-then-increment, so inverting the last block shifted its
placeholder to an index with no matching bound value. The fix was to delete the
manual counter in all three files and derive each placeholder from
`query_params.len() + 1`, which makes this whole off-by-one class impossible
rather than merely absent. This is the same bug class as the Products search
defect in `59ccbb4`, so it is worth noting that the regression tests earned their
keep: 151 tests pass with `-D warnings`.

**Files:** 15 Rust files, `.github/workflows/ci.yml`,
`.github/workflows/windows-installer.yml`

---

### 2026-09-25 — Windows CI: `npm ci` failed on the runner, no installer built

**Symptom:** the first run of the *Windows Installer* workflow failed at
`npm ci`, before any Rust was compiled:

```
npm error command failed
npm error command C:\Windows\system32\cmd.exe /d /s /c node-gyp rebuild
gyp ERR! find VS could not use PowerShell to find Visual Studio 2017 or newer
gyp ERR! find VS unknown version "undefined" found at
         "C:\Program Files\Microsoft Visual Studio\18\Enterprise"
npm error code 1
```

**Root cause:** two independent problems stacked.

1. `better-sqlite3` was falling back from its prebuilt binary to a **source
   build**. It is a `devDependency` used only by the local seed tooling
   (`database/seed/*.ts`, `scripts/database/*.mjs`); neither the Vite build nor
   the Rust backend needs it — the app's database is `rusqlite` inside
   `src-tauri`. The workflow was compiling a native module it never uses.
2. node-gyp then could not find a usable Visual Studio. The runner has VS 18
   (VS 2026) installed, and node-gyp 11.5.0 cannot parse that version — it also
   choked parsing PowerShell output
   (`RangeError [ERR_CHILD_PROCESS_STDIO_MAXBUFFERS]`) and concluded
   "unknown version". So even with a reason to compile native code, it could not
   have done so on this image.

The `npm warn cleanup ... EPERM` lines in the log are **not** the cause — that is
npm's best-effort removal of a partially written `node_modules` after the real
failure, and those same warnings are harmless on their own.

**Investigation:** confirmed `better-sqlite3` appears only in `devDependencies`
and is imported exclusively by `database/seed/` and `scripts/database/`. Grepped
`src-tauri/src` for anything that shells out to `node`/`tsx`: the only hit is
`commands/app.rs:56` (`run_seeds`), which is gated to debug builds and is not
exercised by any test. Then verified the fix empirically on Linux rather than
assuming it: `npm ci --ignore-scripts` followed by `npm run build` and the full
Vitest suite (461 tests, 58 files) both pass, and `npx tauri --version` still
resolves to `tauri-cli 2.11.4`.

**Fix:** `npm ci --ignore-scripts` in the Windows installer workflow, with a
comment recording why. No postinstall step is required on the packaging path —
esbuild, rolldown and the Tauri CLI all resolve from their platform-specific
optional dependencies.

**Note:** local development is unaffected and still uses a plain `npm ci`, since
the seed scripts genuinely do need the compiled `better-sqlite3`.

**Files:** `.github/workflows/windows-installer.yml`

---

### 2026-09-25 — Packaging for 1.0.0: five defects that only appear in a real install

Preparing the first formal release surfaced five problems that testing in dev
mode had hidden, because dev mode is not what ships. None of them reproduce with
`npm run tauri:dev`.

**1. `run_seeds` was reachable in production and could only ever fail**

- **Symptom:** a top-bar menu item, "Seed Demo Data", called a Tauri command
  that shells out to `npx tsx database/seed/run.ts`. On a normal Windows install
  there is no Node.js and no such script, so it failed with *"Seed failed: …
  Is Node.js installed?"* — a user-facing error about a developer tool.
- **Root cause:** the command was registered in `generate_handler!` and the menu
  item rendered unconditionally. It was a development utility that shipped.
- **Investigation:** read `commands/app.rs` (the `npx` shell-out) and
  `layouts/top-bar.tsx:31,155` (the menu entry, with raw `alert()` calls and
  English-only strings). Confirmed the supported in-app path is the demo catalog
  under *Inventario → Importar/Exportar* (`execute_demo_catalog`, pure Rust), so
  nothing is lost by hiding the developer command.
- **Fix:** the command returns a clear error when `cfg!(debug_assertions)` is
  false, pointing at the demo catalog; the menu item renders only under
  `import.meta.env.DEV`.
- **Files:** `src-tauri/src/commands/app.rs`, `src/layouts/top-bar.tsx`

**2. Startup failures panicked with no visible output**

- **Symptom:** `lib.rs::run()` did `.expect("Failed to initialize database")`
  *before* the Tauri builder. A packaged Windows binary is a GUI-subsystem app
  with no console, so the panic text went nowhere: the user saw a flash or an
  empty window, and support had nothing to go on.
- **Root cause:** database init ran outside the Tauri runtime, so there was no
  window or dialog to report through, and `expect` is the wrong tool for a
  recoverable user-facing condition.
- **Fix:** a new `startup` module opens the database inside the builder's
  `setup` hook (after the runtime exists, before the window shows). Failure now
  logs, shows a native message box naming the problem and the log path, and
  exits non-zero. The dialog is in Spanish, matching the app's UI.
- **Files:** `src-tauri/src/startup.rs` (new), `src-tauri/src/lib.rs`

**3. Production logs were silently discarded**

- **Symptom:** `env_logger::init()` writes to stderr. A GUI-subsystem Windows
  binary has nowhere to send it, so every diagnostic was lost — which is why
  defect 2 was undiagnosable in the field.
- **Root cause:** the default target is correct for a terminal app and useless
  for a windowed one.
- **Fix:** logs go to `<data dir>\logs\inventory-gear.log` (append, with simple
  5 MB rotation). stderr is kept in debug builds so `npm run tauri:dev` still
  shows output, and `RUST_LOG` still overrides the level so support can raise
  verbosity without a rebuild. Every write failure is swallowed deliberately: a
  full disk must not prevent the app from starting.
- **Files:** `src-tauri/src/startup.rs`

**4. Two tests failed depending on the developer's machine**

- **Symptom:** `config::tests::test_default_config` and
  `test_config_default_profile_db_file` failed locally. `AppConfig::default()`
  resolves the profile from the *real* data dir, so both tests asserted
  `default` regardless of which profile the machine happened to have selected.
- **Root cause:** tests asserted a machine-dependent value instead of an
  invariant.
- **Fix:** both now assert what is true regardless of machine state — the db
  path is the profile's own file inside the data dir. Replaced the deleted
  assertion with `test_db_path_is_never_inside_program_files`, which enforces a
  real packaging requirement: user data must never resolve under `Program Files`
  (not writable without elevation, and destroyed by reinstall).
- **Result:** 151 Rust tests pass, 0 failures (was 148 passing + 2 failing).
- **Files:** `src-tauri/src/config.rs`

**5. `tauri build --bundles nsis` exits 0 on Linux while producing nothing**

- **Symptom:** no error, no artifact, green run. The most dangerous possible
  packaging failure, because it looks like success.
- **Root cause:** NSIS requires Windows; the bundler skips the installer
  elsewhere without failing. Verified empirically: `--bundles nsis` exits 0 with
  no `bundle/` directory, and `--target x86_64-pc-windows-msvc` fails outright
  (MSVC linker and Windows SDK are Windows-only).
- **Fix:** `npm run tauri:build:windows` routes through
  `scripts/tauri-build-windows.mjs`, which exits 1 with an explanation and
  points at the CI workflow on any non-Windows host. The CI workflow
  independently fails if the `bundle\nsis` directory or the `.exe` is missing.
- **Files:** `scripts/tauri-build-windows.mjs` (new),
  `.github/workflows/windows-installer.yml` (new)

**Also fixed while packaging:** no `icon.ico` existed at all and the four PNGs
were flat single-colour squares, so the installer and shortcut would have had
no real icon. Generated a complete, valid multi-resolution icon set
(`scripts/icons/generate-icons.mjs`, placeholder artwork pending the real
logo). Added `npm run version:check` to prevent `Cargo.toml` drifting from
`package.json`, since `tauri.conf.json` reads the latter directly.

---

### 2026-09-25 — Audit: verified every other search in the app

**Context:** after fixing the Products-list search (`paginate`), every other
search was suspect — same bug class ("SQL that reads right but binds the wrong
thing"). Reviewed all 11 backend searches plus their frontend call sites.

**Result: no further defects.** All 11 are correct. What was wrong was my
*confidence*, not the code, so the value here is the 15 new tests that now
prove it and keep it true.

**Backend audit — 11 searches, all sound:**

| Command | Params | Verdict |
|---|---|---|
| `get_products` | `?1` reused ×5 + `LIMIT ?{n+1}` | fixed previously |
| `search_products_for_pos` | `?1` reused ×5, `LIMIT 50` literal | ok |
| `global_product_search` | `?1`..`?4` distinct (exact/prefix/contains/limit) | ok |
| `search_sales` | `?1` reused ×2, `LIMIT 20` literal | ok |
| `cross_reference_search` | `?1` exact + `?2` LIKE, ×2 statements | ok |
| `get_customers` | `?1` reused ×3 | ok |
| `get_vehicle_brands` / `get_vehicle_engines` | `?1` | ok |
| `get_vehicle_models` | `?1` brand, `?2` search | ok |
| `search_compatible_products` | up to `?6`; `year` correctly claims **two** indices | ok |
| `get_purchase_orders` | 7 filters, each claiming `len()+1` | ok |

The `?N` literals in `LIMIT` clauses are what keep the POS/sales/cross-ref
searches safe — a literal cannot be bound, so it cannot steal `?1`.

**Frontend audit:** all 10 `src/lib/tauri.ts` wrappers forward their search arg;
every `useQuery` key includes the debounced search term; `sales-page` and
`use-product-search` gate with `enabled`; `crm-compatibility-page` passes
`search` in the correct positional slot. No query key omits its search term.

**Tests added** — `src-tauri/src/commands/search_tests.rs`, 15 tests:
- A parameter-index invariant test asserting the highest `?N` in each search
  statement equals the number of bound values — the exact invariant the original
  bug violated.
- The real schema (`db::schema::create_tables`) seeded in memory. The 6
  `DB_STATE`-backed commands are invoked **as real functions**; the 5 behind
  `State<DbState>` (whose SQL was extracted to `pub(crate)` consts so there is no
  duplicated SQL to drift) are executed through those consts.
- `purchase_order_filter` — its condition builder was extracted from the command
  into a pure function and is tested across all 9 filter subsets the UI can send.
- `compatible_products_search_binds_after_every_other_filter` — pins the risky
  case where `search` lands on `?6` behind four other filters.
- `products_search_matches_each_searched_column` — name, sku, barcode,
  oem_number, internal_code each confirmed individually.

**Tests proven to catch the original bugs (mutation-checked):** reinstating
`COUNT` without the `WHERE`, and separately reinstating `LIMIT ?1`, each makes
exactly the 3 `paginate` tests fail and nothing else. An early version of the
suite *cascaded* 8 failures from 1 bug, because a panic while holding the shared
`Mutex` poisoned it and the commands turn a poisoned lock into an `Err`; the
helpers now release the connection before failing, so failures stay independent.

**Observations (not changed — flagged for a decision):**
1. The product **list** has no `is_active` filter, while the POS search does
   (`AND p.is_active = 1`). A discontinued product is therefore findable in
   Inventory → Products but not sellable at the POS. Pinned by
   `products_search_paginates_and_surfaces_inactive_items` so changing it is
   deliberate.
2. `crm-vehicles-page` filters brands/models **client-side** and calls
   `getVehicleBrands()` / `getVehicleModels(brandId)` without `search`, so the
   backend `search` parameter is unused from that page. Search works; it just
   never exercises the server filter.
3. `purchase-orders-page` has no debounce, so it fires a query per keystroke
   (every other search page debounces). Performance, not correctness.

**Files:** `src-tauri/src/commands/{search_tests.rs,mod.rs,inventory.rs,sales.rs,purchases.rs}`

**Verification:** `cargo test` 148 pass (was 133); the 2 pre-existing
`config.rs` failures unchanged.

---

### 2026-09-25 — Product list search returned an error (paginate: COUNT missing WHERE, LIMIT stole the filter parameter)

**Symptom:**
- On **Inventory → Products**, typing in the list search produced no results —
  the table went to its error/empty state instead of filtering. Unfiltered
  loading worked fine.

**Investigation:**
1. Read `products-page.tsx`: `onSearch={setSearch}` → `getProducts(page, pageSize,
   search || undefined)`, debounced 300 ms inside `DataTable`. Looked correct.
2. Wrote a scratch test rendering `ProductsPage` with `getProducts` mocked to
   filter in memory. **Search worked** — so the React wiring, the debounce and
   the wrapper were all fine; the defect had to be in the real SQL path that the
   mock bypassed.
3. Read `get_products` (`commands/inventory.rs:638`): the WHERE clause reuses
   `?1` across five `LIKE`s and hands one param to `paginate`.
4. Read `paginate` (`:187`) and found two defects, then confirmed the first with
   an in-memory SQLite probe that ran the exact `get_products` shape.

**Root cause:**
- `paginate` built the count query as `SELECT COUNT(*) FROM {table}` — **without**
  the `where_clause` — while still binding the caller's filter parameters to it.
  SQLite rejects that outright:
  `Wrong number of parameters passed to query. Got 1, needed 0`.
  Any search term therefore hard-failed the whole command.
- `paginate` also appended `LIMIT ?1 OFFSET ?2` to the data query. SQLite numbers
  parameters by *first appearance across the whole statement*, and the caller's
  WHERE already used `?1`, so `LIMIT` would have been handed the `LIKE` pattern
  (coerced to `0` → zero rows). Latent behind the first bug, but wrong.
- Consequently `total`/`total_pages` would have described the **unfiltered**
  table, so the row counter would have been wrong even once rows appeared.

**Fix:**
- `src-tauri/src/commands/inventory.rs` — `paginate` now:
  - counts with the same `where_clause`
    (`SELECT COUNT(*) FROM {table} {where_clause}`), so `total`/`total_pages`
    reflect the filter;
  - numbers `LIMIT`/`OFFSET` as `?{filter_params+1}` / `?{filter_params+2}`, so
    they can never collide with the caller's `?1..?N`;
  - documents the contract for callers on the function's doc comment.
- No frontend change was needed.

**Affected files:**
- `src-tauri/src/commands/inventory.rs`

**Commit:** (see `docs/progress/MILESTONE_16.md`)

**Tests added** (`inventory::tests`, 6): search returns matching rows; `total`
reflects the filter; `total_pages` narrows; a multi-parameter filter keeps its
`?1` (the LIMIT-collision case); no filter returns everything; page 2 returns
the remainder.

**Verification:** `cargo test` 133 pass (was 127); `npm run typecheck` clean;
`npm run lint` 0 errors; `npm test` 58 files / 461 tests pass. The 2
`config.rs` failures remain the pre-existing environment-dependent ones.

---

### 2026-09-25 — Product picker showed no products in the Equivalents tab

**Symptom:**
- In Product 360° → **Equivalents** tab, clicking **+ Add** ("Agregar
  equivalente") opened a panel whose product search never displayed any
  product. The panel showed only a bare search input; nothing appeared until
  text was typed, and searching for a product's own name produced an empty box
  with no message.

**Investigation:**
1. Grepped for the dialog wording ("relacionado"/"related"); no such feature
   existed, so the report was narrowed to the newest product-picker dialog —
   the Equivalents add panel introduced in `616a168`.
2. Confirmed the backend search was healthy: `get_products`
   (`commands/inventory.rs:638`) matches name/sku/barcode/oem_number/internal_code,
   and the wrapper call `getProducts(page, pageSize, search)` is byte-for-byte the
   same convention that `products-page.tsx` uses successfully.
3. Wrote a scratch test that clicked **+ Add** and typed into the box: results
   *did* render. So the IPC/backend was fine.
4. A second scratch test asserted the state on open: `getProducts` was **never
   called** when the panel opened, and no list container, hint, or empty-state
   message existed in the DOM.
5. Re-read the component and found two independent defects in the picker.

**Root cause:**
- The results block was gated behind `{pickQuery.trim().length > 0 && ...}` and
  the query used `enabled: showAdd && pickQuery.trim().length > 0`, so nothing
  was fetched or rendered until the user typed — the panel opened looking
  broken/empty.
- The self-reference filter ran *after* the emptiness check
  (`.filter((p) => p.id !== productId)` applied to a list whose length had
  already been tested), so a search matching only the current product rendered
  a blank container with no message.
- Secondary: the input was undebounced (a query per keystroke) and
  already-linked products were still offered, which would produce a
  duplicate-pair error from the backend.

**Fix:**
- `src/features/inventory/components/product-equivalents-tab.tsx`
  - Query is now `enabled: showAdd` and passes `debouncedPick || undefined`,
    so the catalog loads on open and the list is never an empty box (mirrors the
    POS search, which uses `queryAllWhenEmpty: true`).
  - Added a 250 ms debounce on the search term.
  - Filtering (self + already-linked) now happens *before* the empty check, so
    a fully-filtered result shows a message instead of a blank area.
  - Added `data-testid="product-equiv-picker"` for scoped assertions.
- New i18n key `inventory.equivalents.noProductsToLink` (es/en).
- `tests/unit/components/product-360-tabs.test.tsx`: 4 new cases covering
  "lists products on open without typing", the hint when there is nothing to
  link, hiding already-linked products, and the debounced search term.

**Affected files:**
- `src/features/inventory/components/product-equivalents-tab.tsx`
- `src/i18n/locales/es/inventory.json`
- `src/i18n/locales/en/inventory.json`
- `tests/unit/components/product-360-tabs.test.tsx`

**Commit:** (see `docs/progress/MILESTONE_16.md`)

**Verification:** `npm run typecheck` clean; `npm run lint` 0 errors; `npm test`
58 files / 461 tests pass.

---

### 2026-09-24 — Pricing feature compile/runtime issues fixed (seed deref, reprice return type, demo workbook corruption)

**Symptom:**
- `cargo test --lib` failed to compile after adding pricing fields: a deref of
  a `&f64` price in the seed's implied-margin call, and a mismatched return
  type on `reprice_following_global_default`.
- An early regeneration of the demo workbook shifted the new pricing columns,
  producing a file that would import corrupt values.

**Investigation:**
1. `seed.rs:743` called `implied_margin_pct(cost, price)` where `price` was
   already `&f64` → borrow/deref compile error.
2. `reprice_following_global_default` was declared `Result<i64, String>` but
   returned a `rows_affected` count → type error.
3. First demo-workbook regeneration used `ci >= 14 → ci + 2` before the index
   shift was fully applied, duplicating a column; the corrupted file was
   detected by dumping the parsed rows, restored with
   `git checkout -- docs-site/public/samples/...` and regenerated with the
   corrected mapping (`ci >= 14 → ci`, since the two new columns were inserted
   at 14/15).

**Root cause:**
- Incorrect deref/return-type in new pricing code; column-index arithmetic bug
  when regenerating the sample workbook with the two new columns.

**Fix:**
- `*price` deref in `seed.rs`; `Result<usize, String>` return type.
- Re-ran the generation with correct indices, verified the workbook parses
  (19-row demo test green), removed the temporary generator binaries.

**Files:** `src-tauri/src/db/seed.rs`, `src-tauri/src/commands/admin/settings.rs`,
`docs-site/public/samples/inventory-gear-product-import-example.xlsx`.
**Commit:** `40a77d0`

---

### 2026-09-24 — Sales dashboard KPIs (Ingresos de Hoy, Transacciones, Pedido Promedio, Ventas del Mes) did not update after creating a sale, and used wrong date windows

**Symptom:**
- After completing a sale in POS, returning to Ventas showed the sales table with
  the new invoice but the four KPI cards stayed at their previous values (e.g.
  `$0.00` / `0`).
- KPIs frequently disagreed with the table and the Daily Closeout, and
  "Ventas del Mes" did not match the calendar month.

**Investigation:**
1. Traced the frontend flow: `pos-page.tsx` checkout `onSuccess` invalidated
   `["sales"]`, `["pos-search"]`, `["daily-closeout"]` but **not
   `["sales-summary"]`** (the KPI query key) nor `["dashboard-widgets"]`. The
   global `queryClient` uses `staleTime: 5min`, so the summary cache was still
   considered fresh when the user returned to Ventas → React Query skipped the
   refetch; only the table refreshed (because `["sales"]` was invalidated).
2. Checked all sale-mutating paths and found the same gap: `quote-detail-page`
   (convert quote → sale), `returns-page` (refund), `sale-detail-page` (refund).
3. Audited the backend summary. `get_sales_summary` compared the **local**
   `today_date()` against `date(created_at)` (a UTC date). On a UTC-4 machine
   (Bolivia) the window for "today" was off by up to ~20h at the boundaries.
4. `revenueMonth`/`totalSalesMonth` used `datetime('now', '-30 days')` — a
   rolling 30-day window, not the calendar month.

**Root cause:**
- Missing React Query cache invalidation for the `["sales-summary"]` /
  `["dashboard-widgets"]` query keys after every sale mutation.
- `get_sales_summary` used local-vs-UTC date comparison for the "today" window
  and a rolling window instead of the calendar month for "Ventas del Mes".

**Fix:**
- Rust (`src-tauri/src/commands/sales.rs`):
  - Added `utc_bounds_for_local_day`, `utc_bounds_for_local_month`, and
    `local_day_start_utc` helpers (chrono) that translate the **local calendar
    day / month** containing `now` into UTC ranges (`created_at` is stored as
    UTC). Today = local day, Month = local calendar month.
  - Extracted the computation into a pure `sales_summary_for(conn, now)`
    (injectable clock), called by the `get_sales_summary` command with
    `chrono::Local::now()`.
  - Week (rolling 7 days) and top products (rolling 30 days) kept as rolling
    windows — only today/month were corrected. Existing accounting rule kept:
    sales with `payment_status = 'refunded'` are excluded from revenue/transaction
    totals; pending/partial still count.
- Frontend (`src/features/sales/pages/…`):
  - `pos-page.tsx` onSuccess now also invalidates `["sales-summary"]` and
    `["dashboard-widgets"]`.
  - `sale-detail-page.tsx` and `returns-page.tsx` refund onSuccess likewise +
    `["sales-summary"]` / `["dashboard-widgets"]`.
  - `quote-detail-page.tsx` convert-to-sale onSuccess likewise +
    `["daily-closeout"]`, `["sales-summary"]`, `["dashboard-widgets"]`.

**Tests:**
- Rust: 9 new `#[cfg(test)]` tests in `sales.rs` (temp DB with the real schema):
  empty DB → zero summary; same-day 106+90 → 196/2/avg 98; sequential
  accumulate; refunded excluded; partial counted; previous local day excluded;
  same-month/other-day counts month not today; previous month excluded; day
  bounds contiguous/ordered. `cargo test --lib`: 94 passed, 2 failed (only the
  pre-existing env-dependent profile.json config tests, see `KNOWN_ISSUES.md`).
- Frontend: `tests/unit/components/pos-page.test.tsx` — new test asserts checkout
  invalidates `["sales-summary"]`, `["dashboard-widgets"]`, `["sales"]` via an
  `invalidateQueries` spy; new `tests/unit/components/sales-kpi-refresh.test.tsx`
  — full render workflow (Sales → POS → checkout $100 → back to Sales) with a
  production-like `QueryClient` (`staleTime`/`gcTime` 5 min) reproducing the stale
  cache, asserting the table + all four KPIs update from persisted data.
- Manual alive check: inserted sales (today 100+50, same-month 25, previous-month
  40, refunded 200) into a throwaway copy of the live DB and ran the exact
  `sales_summary_for` SQL — today=2/$150, month=3/$175, refunded/previous month
  excluded, local-day UTC boundary = `04:00` for UTC-4.

**Affected files:**
- `src-tauri/src/commands/sales.rs`
- `src/features/sales/pages/pos-page.tsx`
- `src/features/sales/pages/sale-detail-page.tsx`
- `src/features/sales/pages/returns-page.tsx`
- `src/features/sales/pages/quote-detail-page.tsx`
- `tests/helpers/render.tsx` (accepts `queryClient`, exports `createTestQueryClient`)
- `tests/unit/components/pos-page.test.tsx`, `tests/unit/components/sales-kpi-refresh.test.tsx` (new)

**Commit:** 9f02059

---

### 2026-09-20 — `npm run typecheck` was a no-op (compiled 0 files) and hid 158 type errors

**Symptom:**
- `npm run typecheck` (`tsc --noEmit`) always exited 0 — even after edits that
  introduced obvious type breakage (e.g. an undefined `setActiveTab` that never
  crashed builds).
- `npm run build` (`tsc -b && vite build`) **did** typecheck correctly, so the
  app still shipped — but the dedicated typecheck gate and `npm run verify`
  gave false confidence.

**Investigation:**
- The root `tsconfig.json` is a solution file: `{ "files": [], "references":
  ["tsconfig.app.json", "tsconfig.node.json"] }`.
- `tsc --noEmit` / `tsc -p tsconfig.json` runs in *non-build* mode and follows
  `files` + `include` of that config only → with `files: []` it compiled **0
  files**. Verified with `tsc --noEmit -p tsconfig.json --listFilesOnly`
  (count 0) vs `-p tsconfig.app.json` (976 files). Build mode (`-b`) is what
  follows project references.
- Because of this, every earlier "typecheck passes" claim (including lines
  written by localization subagents over the last sessions) was unverified.

**Fix:**
- `package.json`: `"typecheck": "tsc --noEmit"` → `"typecheck": "tsc -b"`
  (matches the `build` script; `tsconfig.app.json`/`node.json` are both
  `noEmit: true` so `-b` only typechecks).
- Fixed all **158 latent type errors** that the real gate then surfaced:
  unused imports (most from i18n edits leaving dead `lucide-react`/component
  imports), possibly-null `dashboard`/indexed-access guards
  (`noUncheckedIndexedAccess`), report tables needing
  `as unknown as Record<string, unknown>[]` casts, `TableColumn<T>[]` column
  alignment in sales pages, renamed/absent `@/types` exports
  (`InventorySupplier`, `Warehouse`, `SupplierPerformanceReport` →
  `SupplierPerformance`), `CompatibilityEntry` `brandName`/`modelName`,
  a Checkbox `id` prop (added `id?: string` to `ui/checkbox.tsx`), and unused
  `DailyCloseout` `date` (removed; the type has no date field). No runtime
  behavior changed.

**Affected:** `package.json`, plus ~30 feature page/component files and
`src/types`, `src/lib/*`, `src/hooks/*`, `src/layouts/*`.

**Commit:** `TBD`

---

### 2026-09-20 — Spanish locale leaked raw keys, missing strings, and English fallbacks across the app

**Symptom:**
- UI rendered raw keys (e.g. `common.save`, `reports.noData`) and hardcoded
  English labels in the Spanish locale; `t('key', 'english')` fallbacks and
  EN-only keys meant English leaked into es.
- Affected shared components (comboboxes, dialog, table placeholders, print
  templates), help page, CRM, Admin, Sales/customers, Purchases and Reports
  pages.

**Investigation:**
- The app lazily redirects `t("ns.key")` to a namespace only when the first
  segment is a *registered* namespace; with `nsSeparator === keySeparator ===
  "."`, missing keys render raw (no `parseMissingKeyHandler`). Many pages
  predated i18n or were added with literal English strings; audits found
  hundreds of hardcoded text nodes plus ~600 keys missing from
  `es`/`en`.

**Fix:**
- Wrote a project-aware audit (`audit-i18n.mjs`): parses the configured
  namespace list + resolvable-key set, walks the source for `t()` calls and
  text attributes, and reports missing-ES / missing-EN / EN-only / fallback
  calls. Drove totals to 0.
- Added ~1,250 keys across 16 namespaces (es+en), converted every shared
  component, help, print template, CRM, Admin, Sales, Purchases, Reports and
  inventory tab page to `t()`, and documented flat-key conventions (see
  `docs/I18N.md`).

**Affected:** `src/i18n/locales/{es,en}/*.json`, ~40 page/component files,
`tests/unit/components/product-search-combobox.test.tsx` (added
`setupI18n("en")`).

**Commit:** `TBD`

---

### 2026-09-20 — Rust config tests fail on machines whose app-data dir already holds a `profile.json`

**Symptom:**
- `npm run test:rust` (cargo test) failed 2 tests:
  `config::tests::test_config_default_profile_db_file` and
  `config::tests::test_default_config` — `AppConfig::default()` returned
  `single-store` / `inventory-gear-single.db` instead of the `default` profile
  `inventory_gear.db`.

**Investigation:**
- Dev machine's real data dir (`~/.local/share/inventory-gear/profile.json`)
  contains `{"profile":"single-store"}` (set via `npm run db:single-store` /
  the Settings developer tools).
- `AppConfig::default()` reads the real data dir unless the
  `IG_DATABASE_PROFILE` env var overrides it
  (`src-tauri/src/config.rs:11`). The two failing tests assumed a clean data
  dir and are **environment-dependent**, not caused by any frontend change
  (this session touched no `src-tauri` code; `git status` confirmed).
  The suite is otherwise 85/87 passing.

**Fix:**
- None applied (by design — Rust code was out of scope). Affected developers
  should run with a clean data dir or `IG_DATABASE_PROFILE=default`; a
  fixture/`temp_dir` rewrite for `AppConfig::default()` is a future task. See
  `docs/KNOWN_ISSUES.md`.

**Commit:** `TBD`

---

### 2026-09-18 — Flaky Rust config test: `test_read_active_profile_no_file_falls_back_to_default` intermittently failed

**Symptom:**
- `cargo test --lib` occasionally failed with
  `read_active_profile(...) == "multi-store"` instead of `"default"`.
- Non-deterministic: the same suite passed on earlier runs and failed later.

**Investigation:**
- `src-tauri/src/config.rs` `temp_dir()` built one path per process
  (`inventory-gear-config-<pid>`) and tests ran **in parallel**.
- `test_write_and_read_profile_roundtrip` wrote `{"profile":"multi-store"}`
  into that shared dir while `test_read_active_profile_no_file...` was reading
  it, so the "no file" test saw another test's `profile.json`.
- `test_env_var_overrides_file` additionally mutated the process-wide
  `IG_DATABASE_PROFILE` env var (cleaned up after itself, but also racy).
- First surfaced when `npm run verify` invoked `cargo test` and the full suite
  ran simultaneously.

**Fix:**
- `temp_dir()` now appends a per-call atomic counter
  (`AtomicU64`) so every test uses an isolated directory; no two tests share
  state. Verified deterministic by running the config suite 3×.

**Affected:** `src-tauri/src/config.rs` (test helper only). Frontend unchanged.

**Commit:** `TBD`

---

### 2026-08-13 — Print feature: `usePrint()` crash, A4 paper width misreport, and missing sales locale keys

**Symptom:**
1. Clicking Print on the sale-detail, closeout, or quote pages threw
   `TypeError: print is not a function` (window never opened).
2. `paperWidth("A4")` returned `80mm` instead of `210mm` (A4 documents were
   sized as thermal).
3. The receipt print document title rendered the raw key `receipt` (lowercase)
   instead of a translated label.

**Investigation:**
- `src/hooks/use-print.ts` returned `{ print: fn }` but all three call sites
  (`sale-detail-page.tsx:108`, `closeout-page.tsx:68`, `quote-detail-page.tsx`)
  destructure-free `const print = usePrint()` then invoke `print(document)` —
  so `print` was an object, not a function. This was only surfaced when page
  tests started exercising the print flow.
- `src/lib/print/config.ts` `normalizePaperSize` uppercases `A4` but
  `paperWidth`'s switch had a lowercase `case "a4":`, so the `A4` input fell
  through to the `default` (80mm).
- `t("sales.receipt")` (plus `receiptNumber`, `receiptType`, `printedAt`,
  `receiptPrinted`, `noReceipts`, `details`, `notes`, `payments`, `method`,
  `reference`, `change`, `refundReasonPlaceholder`) were not defined in
  `en|es/sales.json`, so i18n fell back to raw keys in the print dialog and the
  sale-detail page.

**Fix:**
1. `usePrint()` now returns the open function directly (`src/hooks/use-print.ts`),
   matching the call sites; verified by the sale-detail/closeout page tests.
2. `paperWidth` case label corrected to `"A4"` (`src/lib/print/config.ts`).
3. Added the missing `sales.*` keys to `src/i18n/locales/{en,es}/sales.json`.

**Commit:** `6142477`

**Files:** `src/hooks/use-print.ts`, `src/lib/print/config.ts`,
`src/i18n/locales/en/sales.json`, `src/i18n/locales/es/sales.json`

---

### 2026-08-13 — Backups were never actually created; restore/verify did not exist

**Symptom:** `create_backup` only inserted a row into `backup_history` with a fake checksum (`pending_<timestamp>`) and an estimated size — **no backup file was ever written**. `delete_backup` only removed the DB record, leaving orphan files on disk. There was no `restore_backup` command at all (the frontend called nothing), no validation of files (corrupt/empty/missing files were indistinguishable), and the restore UI's Restore button was a disabled placeholder.

**Investigation:**
- `src-tauri/src/commands/admin/backups.rs` computed `checksum = format!("pending_{}", ...)` and `file_size` as a constant/estimate; nothing wrote to disk.
- `delete_backup` never touched the filesystem.
- No restore command existed in `lib.rs` or the command module; `verify_backup` was a stub.
- rusqlite 0.31 exposes the SQLite online backup API via `rusqlite::backup::Backup::new(from: &Connection, to: &mut Connection)` + `run_to_completion(...)`, but only when the `backup` feature is enabled — it was not in `Cargo.toml`.
- No checksum crate was present; `DbState` had no knowledge of the database path, so a real file location could not be resolved.

**Root Cause:** The backup feature was implemented as a data-model placeholder (history row only) without a filesystem artifact, an integrity check, or a restore path. Any user relying on it would have discovered their "backups" were empty rows.

**Fix:**
1. Real file backup: `write_backup` uses the rusqlite backup API to a temp file, then atomically renames; `checksum_file` streams SHA-256 (`sha2` added to Cargo.toml); real `file_size` recorded; failures recorded with status `failed` + error in `notes` and the partial temp file removed.
2. New `verify_backup` command (by `backup_id` or `file_path`) returning `BackupValidation` (SQLite header, `PRAGMA quick_check`, checksum match vs history).
3. New `restore_backup` command: validate-then-restore into the live connection, post-restore integrity check, `restore_history` success/failure record with `error_message`.
4. `delete_backup` now removes the physical file and records `created_by`.
5. `DbState` gained `db_path` so backups resolve next to the database file (`<db dir>/backups`).
6. Frontend: admin-backups-page + admin-restore-page rewritten (verify action, validate-gated restore, confirm dialogs, notifications); `tauri.ts` wrappers `verifyBackup`/`restoreBackup`; mock synced.

**Commit:** `8cfc9fb`

**Files:** `src-tauri/src/commands/admin/backups.rs`, `src-tauri/src/db/connection.rs`, `src-tauri/src/lib.rs`, `src-tauri/Cargo.toml`, `src/lib/tauri.ts`, `src/types/index.ts`, `src/features/admin/pages/admin-backups-page.tsx`, `src/features/admin/pages/admin-restore-page.tsx`, `src/i18n/locales/{en,es}/admin.json`, `scripts/screenshots/helpers/invoke-mock.ts`

---

**Symptom:** In the admin settings editor (`/admin/settings`), any setting with `options` (e.g. `language`, `barcode_format`, `backup_destination`, `business_type`) rendered as a `<select>` with exactly one broken `<option>` whose label looked like `{ options: ["es","en"] }` — the raw JSON string. Selecting the seeded value was impossible because the value string did not match any real option.

**Investigation:**
- The seeder stores `options` as a JSON string, either `["a","b"]` or `{"options":["a","b"]}` (`src-tauri/src/db/seed.rs` `seed_application_settings`).
- The page rendered options with `setting.options.split(",").map(o => o.trim())` (`src/features/admin/pages/admin-settings-page.tsx:70`), which does not parse JSON — it produced one token equal to the entire JSON blob.
- The Rust backend already stored a `validation` column (min/max/length) but neither the backend (`update_app_setting(s)`) nor the page ever enforced it, so an admin could save `tax_rate = -5` or `150` and the value would persist.

**Root Cause:** Frontend option parsing assumed a comma-separated string that the seeder never produced; and value validation was entirely absent on both the Rust write path and the admin UI.

**Fix:**
1. Added a shared `parseSettingOptions` util (`src/lib/settings-utils.ts`) that handles JSON arrays, `{"options":[...]}` objects, and comma-separated fallback; the page now uses it.
2. Added Rust-side validation (`validate_value` in `src-tauri/src/commands/admin/settings.rs`) enforced on `update_app_setting` and `update_app_settings_bulk` (number parse, boolean true/false, allowed-options membership, min/max and length constraints), with full pre-validation so an invalid value never causes a partial bulk write.
3. Added client-side validation with inline error messages; the Save button is disabled while any value is invalid.
4. Added seed `validation` metadata to numeric/length-constrained settings.

**Commit:** `09e723b`

**Files:** `src/features/admin/pages/admin-settings-page.tsx`, `src/lib/settings-utils.ts`, `src-tauri/src/commands/admin/settings.rs`, `src-tauri/src/db/seed.rs`

---

### 2026-07-29 — Reports page crashes with `v.toLocaleString` error; charts and table render empty

**Symptom:** Navigation to the Reports (dashboard) page threw a runtime error `v.toLocaleString` where `v` is undefined. Stack: `fmt@reports-page.tsx:36`. All charts (revenue, sales, etc.) rendered as empty skeletons with "No data". The top-customers table showed hyphens for all columns.

**Investigation:**
- `fmt()` called `v.toLocaleString()` without null guard — if `v` is `null`/`undefined`, it throws.
- The `ReportTable` columns used wrong property names (`header`/`accessorKey`/`cell` instead of `key`/`label`/`renderCell`). The `Column` interface expects `key` + `label` + optional `format`/`renderCell`. Because `col.key` was `undefined`, `row[undefined]` resolved to `undefined`, and `formatValue` returned `"-"` — no crash, but no data either.
- Chart components (`AreaChartCard`, `BarChartCard`, `LineChartCard`, `PieChartCard`, `StackedBarChartCard`) were called without the required `dataKeys` (or `dataKey`/`nameKey`) props. These props define which fields map to axes. Without them, recharts renders nothing.
- `BarChartCard` had an unsupported `horizontal` boolean prop that TypeScript rejected at strict mode.

**Root Cause:** The `reports-page.tsx` was written against a different API than the actual `report-charts.tsx` and `report-table.tsx` components expose. Chart components require `dataKeys`/`dataKey`/`nameKey` props that were never provided; `ReportTable.Column` uses `key`/`label`/`renderCell` but the code used `header`/`accessorKey`/`cell`.

**Fix:**
1. Added `dataKeys` (or `dataKey`/`nameKey` for pie charts) to all 10 chart component calls, mapping the correct data fields for each chart type.
2. Changed `ReportTable` column definitions to use `key`/`label`/`renderCell` matching the `Column` interface.
3. Added null guard to `fmt()`: `v == null ? "$0.00" : v.toLocaleString(...)`.
4. Removed unsupported `horizontal` prop from `BarChartCard`.
5. Added `as unknown as Record<string, unknown>[]` casts to match component prop types (consistent with other report pages).
6. Removed unused `Users` import flagged by TypeScript.

**Commit:** `d0bf1b8`

**Files:** `src/features/reports/pages/reports-page.tsx`

---

### 2026-07-29 — All listing pages show "No hay datos" (inventory, sales, purchases, CRM, reports, admin)

**Symptom:** Every listing page across the entire app (inventory: brands, suppliers, products, categories, warehouses, storage locations; plus sales, purchases, CRM, reports, admin pages) renders "No hay datos" (empty state) despite database containing data. DataTable shows header labels but every cell value is undefined. Some pages appear to partially work (e.g., "New Sale" shows product names) but numeric fields are blank.

**Investigation:**
- All Rust structs throughout every module (`inventory.rs`, `sales.rs`, `purchases.rs`, `customers.rs`, `vehicles.rs`, `crm.rs`, `auth.rs`, `reports/*.rs`, `admin/*.rs`, etc.) derived `Serialize` without `#[serde(rename_all = "camelCase")]`.
- Serde serialized field names as-is (Rust convention: `snake_case`): `is_active`, `cost_price`, `stock_quantity`, `created_at`, `company_name`, `page_size`.
- The frontend TypeScript interfaces all use `camelCase`: `isActive`, `costPrice`, `stockQuantity`, `createdAt`, `companyName`, `pageSize`.
- The DataTable's `accessorKey` and cell renderers access `row["isActive"]` → `undefined` because the actual JavaScript key is `is_active`.
- "New Sale" partially worked because `ProductForPos` fields `id`, `name`, `sku`, `barcode`, `unit` happen to be identical in both conventions — those rendered, but `salePrice`, `stockQuantity` etc. were undefined.

**Root Cause:** A systematic `snake_case` vs `camelCase` mismatch: all ~100+ Rust structs across 34 files in the `commands/` directory lacked `#[serde(rename_all = "camelCase")]`. The frontend TypeScript interfaces consistently use camelCase, but serde serialized with snake_case.

**Fix:**
1. Added `#[serde(rename_all = "camelCase")]` to every struct deriving `Serialize` or `Deserialize` across all 34 files in `src-tauri/src/commands/` (including all subdirectories: `reports/`, `admin/`). Each mismatch that previously produced `undefined` now correctly maps to the expected camelCase key.
2. Changed `DbState.conn` from `Mutex<Connection>` to `Arc<Mutex<Connection>>` so the same DB connection can be shared between the global `DB_STATE` (used by reports) and Tauri's managed state (used by inventory commands). Added `.manage(tauri_state)` to the Tauri builder in `lib.rs`.

**Commit:** `d0bf1b8`

**Files:**
- `src-tauri/src/commands/` — 34 files (all structs gained `#[serde(rename_all = "camelCase")]`)
- `src-tauri/src/db/connection.rs` — `DbState.conn` changed to `Arc<Mutex<Connection>>`
- `src-tauri/src/lib.rs` — added `.manage(tauri_state)` call

---

### 2026-07-29 — `compatibility.seed.ts` uses wrong column names

**Symptom:** Seed failed with `SqliteError: table product_vehicle_compatibility has no column named vehicle_brand`.

**Root Cause:** The `product_vehicle_compatibility` table was rewritten in a schema migration to use foreign-key integer columns (`brand_id`, `model_id`, `engine_id`) instead of the original string columns (`vehicle_brand`, `vehicle_model`, `engine`). The seed file was never updated.

**Fix:** Rewrote `compatibility.seed.ts` to look up FK IDs (lookup `vehicle_brands`, `vehicle_models`, `vehicle_engines` by name) and insert the resolved IDs. Also updated the engine strings in the COMPAT data array to match exact `vehicle_engines.name` values.

**Commit:** `b5ea0cb`

**Files:** `database/seed/compatibility.seed.ts`

---

### 2026-07-29 — `products.seed.ts` deletes all data on re-run

**Symptom:** Re-running the products seed deleted all existing products (and dependents: sales, quotes, movements) and re-inserted from scratch, breaking sales references.

**Root Cause:** The seed used a brute-force approach: `DELETE FROM` on all dependent tables + `DELETE FROM products`, then re-inserted all 129 products. This made re-seeding destructive.

**Fix:** Changed to additive mode — checks if a product already exists by name before inserting. Only inserts missing products. Never deletes.

**Commit:** `b5ea0cb`

**Files:** `database/seed/products.seed.ts`

---

### 2026-07-29 — `customers.seed.ts` bulk-skipped or overwrote customers

**Symptom:** Customer seed used `exists()` check on the whole table — if any customers existed, the entire seed was skipped. When customer count was increased from 150 to 200, existing databases kept the old 150.

**Root Cause:** The `exists()` helper checks if the table has any records. If a Rust seed had created 6 customers, the TypeScript customer seed would skip entirely.

**Fix:** Changed to check by email (unique) — only inserts customers whose email doesn't already exist. Count-based threshold (≥200) as a fast-path guard.

**Commit:** `b5ea0cb`

**Files:** `database/seed/customers.seed.ts`

---

### 2026-07-29 — Duplicate `getProductCompatibility` function

**Symptom:** TypeScript compilation error: `Cannot redeclare exported variable 'getProductCompatibility'` and `Duplicate function implementation`.

**Root Cause:** Two identical `getProductCompatibility` functions existed in `src/lib/tauri.ts` — one at ~line 477 and another later in the file. Likely a merge artifact.

**Fix:** Removed the first occurrence (kept the one in the correct section).

**Commit:** `b5ea0cb`

**Files:** `src/lib/tauri.ts`

---

### 2026-07-29 — `Skeleton` imported from `lucide-react`

**Symptom:** TypeScript compilation error: `lucide-react` does not export `Skeleton`.

**Root Cause:** In `reports-customers-page.tsx`, `Skeleton as SkeletonIcon` was imported from `lucide-react`. `Skeleton` is a custom UI component, not a Lucide icon.

**Fix:** Removed the erroneous import. The correct `Skeleton` component (from `@/components/ui/skeleton`) was already imported separately.

**Commit:** `b5ea0cb`

**Files:** `src/features/reports/pages/reports-customers-page.tsx`

---

### 2026-07-29 — `VehiclesPage` component name mismatch

**Symptom:** TypeScript compilation error: `Cannot find name 'VehiclesPage'`.

**Root Cause:** In `src/routes/index.tsx:137`, the route element referenced `<VehiclesPage />` but the component was exported as `CrmVehiclesPage` (from `src/features/crm/pages/vehicles-page.tsx`).

**Fix:** Changed the route to use `<CrmVehiclesPage />`.

**Commit:** `b5ea0cb`

**Files:** `src/routes/index.tsx`
