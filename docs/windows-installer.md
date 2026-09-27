# Windows Installer (NSIS)

How Inventory Gear is packaged as a Windows installer, how to build it, and what
it does to the user's machine.

- **Bundler:** NSIS, via Tauri v2 (`src-tauri/tauri.conf.json`)
- **Artifact name:** `InventoryGear-<version>-setup.exe`
- **Install mode:** per-user (`currentUser`) — no administrator rights required
- **Automation:** `.github/workflows/windows-installer.yml` (recommended)

---

## ⚠️ The installer can only be built on Windows

This is the single most important thing to know about this pipeline:

```bash
# On Linux or macOS:
npx tauri build --bundles nsis
# → exits 0
# → prints "Finished release profile"
# → produces NO installer and NO error
```

`tauri build --bundles nsis` is a **silent no-op off Windows**: the Rust app
compiles fine, the bundler skips the installer, and the command still reports
success. A green build on Linux does *not* mean an installer exists.

Cross-compiling does not help either — `x86_64-pc-windows-msvc` requires the MSVC
linker and Windows SDK, which are Windows-only.

To make this failure loud, `npm run tauri:build:windows` runs through
`scripts/tauri-build-windows.mjs`, which **exits 1 with an explanation** on any
non-Windows host instead of pretending to succeed.

**Supported ways to get an installer:**

| Method | Command | Notes |
| --- | --- | --- |
| GitHub Actions (recommended) | `git push origin v1.0.0` | Builds on `windows-latest`, opens a draft release |
| GitHub Actions (build only) | Actions → *Windows Installer* → *Run workflow* | Same build, no release — the installer lands in the run's *Artifacts* |
| Local Windows | `npm run tauri:build:windows` | Requires Rust + Visual Studio Build Tools + WebView2 |
| Local dev (not an installer) | `npm run tauri:build` | Builds the plain executable, no installer |

---

## Building

### Via CI (recommended)

1. Commit your changes.
2. Trigger the workflow:
   - **Release:** `git tag v1.0.0 && git push origin v1.0.0` — only a tag creates a
     release
   - **Build only:** GitHub → *Actions* → *Windows Installer* → *Run workflow* —
     builds and uploads the artifact, creates no release
3. Download `InventoryGear-<version>-windows-installer` from the run's
   *Artifacts*, or grab the `.exe` from the draft GitHub Release.

The tag must match the app version or the run fails on purpose. The full release
process, including how to recover from a failed run, is in
[Release Management](./release-management.md).

It **fails the build if the NSIS bundle directory or the `.exe` is missing** — so a
"successful" CI run always has a real installer behind it.

The installer workflow deliberately does **not** run the quality gate. Typecheck,
lint, Vitest and `cargo test` all live in the `CI` workflow, which runs on every
push and pull request, and the installer workflow used to repeat all four. A
release therefore ships a commit that CI has already checked. Because `CI`
triggers on branches rather than tags, cut tags from a commit that is already
green on `main` — a tag on an untested commit produces an installer with no CI
behind it. `npm run build` still runs as part of `tauri build` (via
`beforeBuildCommand`), so the frontend is still typechecked and built on the way
to the installer; what is gone is the duplicate pass, not the check.

### Locally on Windows

Prerequisites: Node.js 22, the Rust stable toolchain, and Visual Studio Build
Tools with the *Desktop development with C++* workload (MSVC + Windows SDK).

```powershell
npm ci
npm run tauri:build:windows
```

Output: `src-tauri\target\release\bundle\nsis\`

The bundler names the file from `productName` + version; CI renames it to the
stable `InventoryGear-<version>-setup.exe` form. Locally you get the bundler's
name — same installer, different file name.

---

## Version management

`package.json` is the **single source of truth**:

| File | Version |
| --- | --- |
| `package.json` | **authoritative** |
| `src-tauri/tauri.conf.json` | `"version": "../package.json"` — reads the above |
| `src-tauri/Cargo.toml` | must match (Cargo cannot read `package.json`) |

```bash
npm run version:check            # fails if anything drifted (part of verify)
npm run version:sync             # rewrite Cargo.toml from package.json
npm run version:set 1.0.1        # set both atomically
```

`tauri.conf.json` deliberately points at `package.json` so the installer is
always named from the app's real version. The one file that can drift is
`Cargo.toml`, which is why `version:check` exists and runs in CI.

---

## What the installer does

### Install location

`installMode: "currentUser"` installs to:

```
C:\Users\<usuario>\AppData\Local\Inventory Gear\
```

Under *Program Files* it would need elevation, and — more importantly —
`Program Files` is not writable by a standard user. Our data must be writable,
so per-user install is also the safest choice. (`perMachine` would install to
`C:\Program Files\Inventory Gear`.)

### Where your data lives

**The database is never inside the install directory.** It lives in a separate
per-user data folder:

```
C:\Users\<usuario>\AppData\Local\inventory-gear\
├── inventory_gear.db          # default profile
├── inventory-gear-single.db   # other profiles
├── inventory-gear-multi.db
├── inventory-gear-empty.db
├── profile.json               # active profile
└── logs\
    └── inventory-gear.log     # runtime log
```

Note the near-identical names: the **install** folder is `Inventory Gear`
(spaces, capital G) and the **data** folder is `inventory-gear` (hyphen). They
are different folders. This separation is what makes upgrades and uninstalls
safe.

Because the data folder is outside `$INSTDIR`, **uninstalling does not delete
your data** — the database survives. There is a test asserting the database can
never resolve under `Program Files`
(`config::tests::test_db_path_is_never_inside_program_files`).

### On upgrade

Re-running a newer installer over an existing install:

- replaces the application files in place
- **keeps** the database and the active profile
- re-runs migrations, which are idempotent and version-guarded

Seeding only runs when the `users` table is empty, so an upgrade never
overwrites real data with demo data. A normal upgrade is fully unattended.

### On uninstall

Removes the application files, the Start-menu and desktop shortcuts, and the
registry entries. Your database and logs **remain** in
`AppData\Local\inventory-gear` for reinstall. Delete that folder manually to
erase all data.

### WebView2

`webviewInstallMode: { type: "embedBootstrapper", silent: true }` bundles the
WebView2 runtime installer and runs it during setup. Windows 11 and current
Windows 10 already have WebView2, so this is normally a no-op; it is there to
cover Windows 10 LTSC and other images that ship without it.

### Language

`languages: ["Spanish", "English"]` with `displayLanguageSelector: true`, so the
installer shows a language picker at install time. This is the NSIS
installer's language, independent of the app's own UI language.

---

## Application icon

The icon set in `src-tauri/icons/` is a **generated placeholder**, not final
brand artwork. It is a flat indigo rounded square with an inventory-box glyph, in
the correct sizes and formats, so packaging works end to end today.

```bash
npm run icons:generate    # regenerates every icon from scripts/icons/generate-icons.mjs
```

To swap in the real logo, replace the source art and re-run the generator (or
drop in your own files). Required files:

| File | Size | Used by |
| --- | --- | --- |
| `icon.ico` | 16/24/32/48/64/128/256 | **NSIS installer + Windows shortcut/taskbar** |
| `32x32.png` | 32×32 | Windows tray / taskbar |
| `128x128.png` | 128×128 | Default app icon |
| `128x128@2x.png` | 256×256 | HiDPI |
| `icon.png` | 512×512 | Source, docs |
| `Square150x150Logo.png` | 150×150 | Windows Start tile |
| `Square44x44Logo.png` | 44×44 | Windows taskbar |
| `StoreLogo.png` | 50×50 | Microsoft Store |

`icon.ico` must be a real multi-resolution `.ico`; a single-image `.ico` or a
PNG with the wrong extension produces a valid-looking but broken installer icon.

---

## Code signing

**Release builds are currently unsigned.** Windows SmartScreen will show
*"Windows protected your PC"* on first run, and some corporate antivirus
software may block the file outright. This is expected and is a trust
reputation issue, not a broken build.

To sign once you have a code-signing certificate, add to
`src-tauri/tauri.conf.json`:

```json
"bundle": {
  "windows": {
    "signCommand": "signtool sign /f %1 /p $env:CERT_PASSWORD /fd SHA256 /tr http://timestamp.digicert.com %1"
  }
}
```

Signing runs on Windows only. Certificate handling belongs in GitHub Actions
secrets, never in the config file.

---

## Troubleshooting

**The CI build fails with "No NSIS bundle directory".**
The Rust build succeeded but produced no installer. Check the `Build NSIS
installer` step's output for a bundler error. A common cause is a missing WebView2
or NSIS dependency on a custom runner image.

**Windows Defender quarantines the build or the installer fails.**
Defender frequently flags freshly built, unsigned Rust binaries, and can corrupt
or stall the NSIS build — the result is an installer that installs but crashes on
start. The workflow excludes `src-tauri/target` and `node_modules` from Defender
for this reason. On a local machine, add a Defender exclusion for
`src-tauri\target` before building.

**The app opens and immediately closes, or shows a startup error dialog.**
Read `%LOCALAPPDATA%\inventory-gear\logs\inventory-gear.log`. Startup failures
are reported in a dialog that names the problem and points at this file. The
log exists because packaged Windows builds have no console — `env_logger`'s
default stderr output would be discarded.

**"Is Node.js installed?" error from the Seed menu.**
That command is development-only and is no longer reachable in a release build.
It shelled out to `npx`, which does not exist on a normal install. Use
*Inventario → Importar/Exportar → Catálogo de demostración*, which is pure Rust.

**Wrong version in the installer name.**
Run `npm run version:check`. `Cargo.toml` and `package.json` must agree.

---

## Pre-configured users

`installer-config.json` decides which accounts an installation ships with. It is
read **once**, on the machine's first launch, to seed the `users` table; after
that the file is ignored and the database is the only source of truth.

The file is bundled with the installer, so it lands next to the executable. It is
found in this order:

1. `IG_INSTALLER_CONFIG` — an explicit path, for testing a configuration without
   rebuilding
2. Beside the executable — the bundled copy
3. The repository root — so `tauri dev` and a fresh clone behave the same

### Preparing a release

```bash
npm run installer-config:init                       # create the file
npm run installer-config:add maria maria@tienda.bo 'Mariposa123' owner 'María Flores'
npm run installer-config:add luis  luis@tienda.bo  'Luis2026x'
npm run installer-config:quick-login cashier on
npm run installer-config:list
npm run installer-config:validate                   # run this before tagging
```

`role` defaults to `owner`, and `passwordChangeRequired` is on for every user
added this way, because a password written in a config file is a shared password
until the person it belongs to replaces it. `validate` applies the same rules as
the backend — length, uniqueness, known role names — so a typo fails at your
terminal instead of on a customer's first launch.

### The shape of the file

```json
{
  "users": [
    {
      "username": "maria",
      "email": "maria@tienda.bo",
      "fullName": "María Flores",
      "password": "Mariposa123",
      "role": "owner",
      "passwordChangeRequired": true,
      "active": true
    }
  ],
  "quickLoginRoles": ["cashier"]
}
```

`role` must match a `roles.name` exactly — `owner`, `administrator`, `cashier`,
`warehouse`, `purchasing`, `viewer`. An unknown name fails the seed rather than
creating a user with no role and no permissions.

`password` is hashed with bcrypt on the way in. A value that already starts with
`$2` is stored as-is, so a pre-hashed password can be used.

### Forced password change

Every configured user is flagged `passwordChangeRequired` and cannot reach the
app until they replace it. The app shows a change-password form **in place of**
the whole interface, so there is no URL, back button or deep link that gets past
it — signing out is the only exit. The flag is returned by every login path and
re-read when a stored session is restored, so it applies on a later launch too,
not only the first.

Changing a password requires the current one even though the session is already
valid, so a token found on a machine is not enough to take the account over. It
also signs out that user's other sessions and resets the failed-attempt counter.

### Quick login by role

`quickLoginRoles` lists the roles that may sign in from the login screen by
tapping a role button, with no password. Everything not listed is refused by the
backend, so a missing entry means off rather than on.

- The flag lives on `roles.quick_login_enabled` and defaults to `0`, so a database
  that predates the column gains no new way in.
- **`owner` is refused.** An owner password is the last control on the data;
  handing it away from a role alone is not a trade most installations want.
  Owners use the normal form.
- The login screen hides the panel entirely when no role is enabled, and shows
  only the roles the backend will accept.
- Changing this later is an administrative action, not a config re-read: editing
  the file after first launch will not re-open access that was closed.

### ⚠️ The config file is plaintext

`installer-config.json` holds the passwords a machine ships with, and bcrypt does
not help here — the file is the plaintext, and the app has to be able to create
those accounts without knowing anything else. It is committed so that a release
built by GitHub Actions picks it up.

Two consequences worth deciding deliberately:

- Anyone with read access to the repository can read those passwords. That is
  acceptable only if every configured user is forced to change the password on
  first login, which is the default. If you would rather not commit them, remove
  the file from version control and build the installer locally, where the
  backend will still find it beside the executable.
- The passwords end up in the repository's history even after they are changed in
  the running application. Rotating a password at runtime does not rewrite git.

---

## Default password warning

With no `installer-config.json`, the first launch seeds demo data including **6
user accounts whose password is `123456`**, two of which are administrative. This
is intended for evaluation, not production use.

The startup log now says so explicitly when it happens, because the only other
signal was a login screen offering known credentials.

These accounts are flagged `passwordChangeRequired` as well, so the app forces a
change before they can be used — but the password is still in the source code, so
treat it as public. The seed itself is safe and idempotent: it only populates an
empty `users` table, and never touches one that already has users.

---

## Release checklist

- [ ] `npm run verify` green (typecheck, lint, Vitest, version sync, cargo test)
- [ ] `npm run version:set <version>` — bumps `package.json` + `Cargo.toml`
- [ ] Final icon artwork replaces the placeholder (`npm run icons:generate`)
- [ ] `npm run installer-config:validate` — the accounts this installer ships with
- [ ] Every configured user is `passwordChangeRequired` (the default)
- [ ] `git tag v<version> && git push origin v<version>` → CI builds the installer
- [ ] Download the artifact and **test on a clean Windows machine** (see below)
- [ ] Test upgrade over a previous version with real data present
- [ ] Test uninstall, then confirm data is still in `AppData\Local\inventory-gear`
- [ ] Review the draft GitHub Release and publish it
- [ ] Update `docs/CHANGELOG.md`

### Clean-machine test

The CI runner proves the installer *builds*. It does not prove it *works* for a
user. Before shipping, on a clean Windows VM or spare machine:

1. Install, choosing Spanish — confirm the language selector appears
2. Launch, log in, confirm the app starts
3. Create a product, sell something, then close and relaunch — confirm it persisted
4. Install the next build over it — confirm data and preferences survived
5. Uninstall — confirm the app is gone and the data folder still has your `.db`
6. Reinstall — confirm your data is still there
7. Check `AppData\Local\inventory-gear\logs\inventory-gear.log` for errors

---

## Related

- `src-tauri/tauri.conf.json` — bundle and NSIS configuration
- `scripts/tauri-build-windows.mjs` — non-Windows host guard
- `scripts/version.mjs` — version single-source-of-truth enforcement
- `scripts/icons/generate-icons.mjs` — icon generator
- `.github/workflows/windows-installer.yml` — the build pipeline
- `docs/release-management.md` — tags, releases, and recovery
- `docs/DEPLOYMENT.md` — general deployment notes
