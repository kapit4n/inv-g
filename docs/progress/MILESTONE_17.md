# Milestone 17 — Windows Installer & 1.0.0 Release Packaging

**Date:** 2026-09-25
**Status:** ✅ Complete
**Scope:** Produce a reproducible, production-safe Windows installer for the
first formal release, and fix the defects that only appear once the app is
packaged rather than run from source.

---

## Summary

Inventory Gear could be run from source, but it could not be *shipped*. There
was no `icon.ico`, the bundle configuration was incomplete, the version was
still `0.1.0`, and — most seriously — three defects only exist in a packaged
build and would have reached users on day one.

This milestone makes the app installable and install-safe.

---

## Deliverables

### Packaging

- **Complete NSIS configuration** (`src-tauri/tauri.conf.json`): per-user
  install mode, LZMA compression, Spanish + English installer languages with a
  language selector, embedded WebView2 bootstrapper, Start-menu folder.
- **Version single source of truth** — `tauri.conf.json` reads
  `../package.json`; `Cargo.toml` is the only file that can drift, so
  `npm run version:check` (wired into `verify` and CI) catches it.
- **Version 1.0.0** across `package.json` and `Cargo.toml`.
- **Full icon set** including a valid multi-resolution `icon.ico`
  (16/24/32/48/64/128/256) — previously absent entirely.
- **`npm run tauri:build:windows`** with a host guard that turns the silent
  NSIS no-op on non-Windows into a loud, explanatory failure.
- **`.github/workflows/windows-installer.yml`** — builds on `windows-latest`,
  runs the full quality gate, renames the artifact to
  `InventoryGear-<version>-setup.exe`, uploads it, and can publish a draft
  GitHub Release on a `v*` tag.

### Production hardening

- **Startup no longer panics** — database init moved into the Tauri `setup`
  hook; failures surface in a native Spanish dialog pointing at the log file,
  then exit non-zero.
- **Production logging** — `env_logger` writes to
  `%LOCALAPPDATA%\inventory-gear\logs\inventory-gear.log` with rotation, instead
  of being discarded by the absence of a console.
- **`run_seeds` removed from the release surface** — the `npx`-based developer
  command is refused in release builds and its menu item is hidden in production.

### Tests

- Rewrote 2 machine-dependent config tests as machine-independent invariant
  tests, and added `test_db_path_is_never_inside_program_files` to enforce the
  "data never under Program Files" packaging rule.
- **Rust: 151 passing, 0 failures** (was 148 passing / 2 failing).
- **Frontend: 461 passing across 58 files** (unchanged).

### Documentation

- **`docs/windows-installer.md`** — the full installer reference: the
  Windows-only constraint, build paths, install/data locations, upgrade and
  uninstall semantics, icon replacement, code signing, troubleshooting, and a
  release checklist.
- `docs/BUG_FIX_LOG.md` entry for the five packaging defects.
- `docs/CHANGELOG.md` entry.
- `build:tauri` references updated to `tauri:build` across README and docs.

---

## Files created

| File | Purpose |
| --- | --- |
| `docs/windows-installer.md` | Installer reference and release checklist |
| `src-tauri/src/startup.rs` | Production logging, DB bootstrap, fatal-error dialog |
| `scripts/tauri-build-windows.mjs` | Non-Windows host guard for installer builds |
| `scripts/version.mjs` | Version single-source-of-truth check/sync/set |
| `scripts/icons/generate-icons.mjs` | Zero-dependency PNG + ICO generator |
| `.github/workflows/windows-installer.yml` | Windows build pipeline |
| `src-tauri/icons/icon.ico` | Multi-resolution Windows icon |

## Files modified

| File | Change |
| --- | --- |
| `src-tauri/tauri.conf.json` | Bundle identity, icons, NSIS + WebView2 config |
| `package.json` | Version 1.0.0; build/verify/icon/version scripts |
| `src-tauri/Cargo.toml` | Version 1.0.0 |
| `src-tauri/src/lib.rs` | `setup`-hook startup, no `.expect()` |
| `src-tauri/src/commands/app.rs` | `run_seeds` gated to debug builds |
| `src-tauri/src/config.rs` | Hermetic tests + Program Files assertion |
| `src/layouts/top-bar.tsx` | Seed item hidden in production |
| `src-tauri/icons/*` | Regenerated icon set |
| `README.md`, `docs/SETUP.md`, `docs/DEPLOYMENT.md`, `docs-site/developer/development.md`, `docs/development/SETUP.md` | `build:tauri` → `tauri:build` |

---

## Key decisions

| Decision | Rationale |
| --- | --- |
| `installMode: currentUser` | No elevation needed; `Program Files` is not user-writable, and our data must be |
| Build on `windows-latest` | NSIS, MSVC and signing are Windows-only; verified Linux silently produces nothing |
| `webviewInstallMode: embedBootstrapper` | Covers Windows 10 LTSC and images without WebView2; a no-op on normal Windows 11 |
| Version from `package.json` | The installer name must track the real app version; one source, no drift |
| `run_seeds` hidden, not deleted | Still needed by developers; production can never reach it |
| Log to file, keep stderr in debug | Packaged Windows builds have no console, so stderr is discarded there |

---

## Known issues / follow-ups

1. **The icon is placeholder artwork.** The generator produces correct
   sizes/formats, but the final Inventory Gear logo does not exist yet. Re-run
   `npm run icons:generate` with the real art.
2. **The installer is unsigned.** SmartScreen will warn on first run. Signing
   is Windows-only and needs a certificate; the config hook and instructions are
   in `docs/windows-installer.md#code-signing`.
3. **The `.exe` has not been run on Windows.** CI proves the installer *builds*
   and that a real `.exe` exists, but the clean-machine install / upgrade /
   uninstall walkthrough in the release checklist still has to be executed by a
   human on Windows.
4. **Seeded accounts share the password `123456`.** Deliberate — demo data only,
   and seeding is guarded so it cannot overwrite real data. Must be addressed
   before a real store deployment.
5. **No auto-updater.** Updates are manual via a new installer. Out of scope for
   1.0.0.
6. **Unused `shell` plugin (pre-existing finding, not changed).** The plugin is
   registered in `lib.rs` and the `default` capability grants
   `shell:allow-open`, but no file in `src/` or `tests/` imports
   `@tauri-apps/plugin-shell`. That permission is *not* arbitrary command
   execution — it only hands a URL or path to the OS default handler — so the
   risk is low, but it is unused attack surface and could be removed along with
   the plugin registration. Left untouched here to keep this milestone scoped to
   packaging.
