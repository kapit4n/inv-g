#!/usr/bin/env node
/**
 * Guards `npm run tauri:build:windows` against the one failure mode that is
 * easy to miss and expensive to ship.
 *
 * On a non-Windows host, `tauri build --bundles nsis` **exits 0 and produces
 * nothing at all** — no installer, no error, no non-empty bundle directory. It
 * looks like a successful build. Verified on this repo's Linux host:
 *
 *     $ npx tauri build --bundles nsis
 *       Finished `release` profile ... Built application at: .../inventory-gear
 *     $ echo $?
 *       0
 *     $ ls src-tauri/target/release/bundle
 *       No such file or directory
 *
 * Cross-compiling to `x86_64-pc-windows-msvc` does not help: the MSVC linker
 * and Windows SDK are Windows-only.
 *
 * So this script refuses to pretend, and points at the supported alternative:
 * the `windows-installer.yml` GitHub Actions workflow, which builds the NSIS
 * bundle on a real Windows runner.
 */

import { spawnSync } from "node:child_process"
import { existsSync, readdirSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")

export function isWindows() {
  return process.platform === "win32"
}

export function assertWindowsHost(command) {
  if (isWindows()) return true

  const bundleDir = join(ROOT, "src-tauri", "target", "release", "bundle")
  const produced =
    existsSync(bundleDir) && readdirSync(bundleDir).some((d) => d.startsWith("nsis"))

  console.error("")
  console.error("  ERROR: the Windows installer can only be built on Windows.")
  console.error("")
  console.error(`  Host: ${process.platform} (${process.arch})`)
  console.error(`  Command: ${command}`)
  console.error("")
  if (produced) {
    console.error("  An NSIS bundle already exists from an earlier build; it was NOT rebuilt.")
  } else {
    console.error("  No installer was produced. Note that `tauri build --bundles nsis` on a")
    console.error("  non-Windows host exits 0 and silently produces nothing, so a green run")
    console.error("  here does not mean an installer exists.")
  }
  console.error("")
  console.error("  Build it on Windows:      npm run tauri:build:windows")
  console.error("  Or use CI (recommended):  push a v1.0.0 tag, or run the")
  console.error("                           'Windows Installer' workflow manually.")
  console.error("                           See docs/windows-installer.md")
  console.error("")
  process.exit(1)
}

// Run directly (not imported by the version-sync helper).
if (process.argv[1] && process.argv[1].endsWith("tauri-build-windows.mjs")) {
  const passthrough = process.argv.slice(2)
  const cmd = `tauri build --bundles nsis${passthrough.length ? " " + passthrough.join(" ") : ""}`

  if (assertWindowsHost(cmd) === true) {
    const res = spawnSync("npx", ["tauri", "build", "--bundles", "nsis", ...passthrough], {
      stdio: "inherit",
      cwd: ROOT,
    })
    process.exit(res.status ?? 1)
  }
}
