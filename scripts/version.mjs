#!/usr/bin/env node
/**
 * Single source of truth for the Inventory Gear version.
 *
 *   package.json  ── authoritative ──┐
 *   package-lock.json  ── derived ───┤
 *   tauri.conf.json (version: "../package.json", so it *reads* the above)
 *   Cargo.toml    ── derived ───────┤
 *   Cargo.lock    ── derived ───────┘
 *
 * `tauri.conf.json` points its `version` at `../package.json`, so Tauri picks up
 * the version automatically and the installer is named from it. Cargo and npm
 * cannot do the same, so those are the files that can silently drift —
 * `npm run version:check` (part of `npm run verify`) fails the build if they do.
 *
 * Full Semantic Versioning 2.0.0 is accepted, prereleases included:
 *
 *   1.0.0            1.0.0-alpha.1     1.0.0-beta.1     1.0.0-rc.1
 *   1.0.1            1.0.0-alpha.2     1.0.0-beta.2     1.0.0-rc.1
 *   2.5.10           1.0.0-rc.1        1.0.0+build.5
 *
 * Tauri parses this field with `semver::Version::from_str` (tauri-utils
 * `config.rs`), which accepts prereleases, so `1.0.0-alpha.2` is a valid app
 * version and is what the installer is named from.
 *
 *   node scripts/version.mjs check              # exit 1 on drift
 *   node scripts/version.mjs sync               # write the derived files from package.json
 *   node scripts/version.mjs set 1.2.3          # also 1.2.3-rc.1
 *   node scripts/version.mjs tag v1.2.3-rc.1     # exit 1 if the tag != package.json
 */

import { readFileSync, writeFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const read = (p) => readFileSync(join(ROOT, p), "utf8")
const write = (p, contents) => writeFileSync(join(ROOT, p), contents)

/**
 * The official SemVer 2.0.0 grammar.
 *
 * Deliberately not a loose `^\d+\.\d+\.\d+$`: that rejected every prerelease, and
 * loosening it to `\d+\.\d+\.\d+.*` would also accept `1.0.0.1` and `1.0.0-oops`.
 * This is the canonical expression, so `1`, `1.0`, `1.0.0.1`, `foo`, `1.0-alpha`
 * and `01.0.0` are all still refused.
 */
const SEMVER =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/

const isSemver = (v) => typeof v === "string" && SEMVER.test(v)

/**
 * Strips the leading `v` that release tags carry: `v1.0.0-rc.1` -> `1.0.0-rc.1`.
 *
 * Not exported: this module reads the project files and exits the process on
 * import, so it is only ever run as a CLI. The tests drive it as a subprocess
 * instead, which is also how the release workflow uses it.
 */
function normalizeTag(tag) {
  const stripped = typeof tag === "string" && tag.startsWith("v") ? tag.slice(1) : tag
  return isSemver(stripped) ? stripped : null
}

const pkg = JSON.parse(read("package.json"))
const cargo = read("src-tauri/Cargo.toml")
const conf = JSON.parse(read("src-tauri/tauri.conf.json"))
const cargoLock = read("src-tauri/Cargo.lock")
const npmLock = JSON.parse(read("package-lock.json"))

const cargoVersion = cargo.match(/^version\s*=\s*"([^"]+)"/m)?.[1]
const cargoLockVersion = cargoLock.match(/name = "inventory-gear"\nversion = "([^"]+)"/)?.[1]
const problems = []

if (!isSemver(pkg.version)) {
  problems.push(`package.json: "${pkg.version}" is not a valid Semantic Version`)
}
if (conf.version !== "../package.json") {
  problems.push(
    `tauri.conf.json: version is "${conf.version}" but must be "../package.json" ` +
      `so package.json stays the single source of truth`
  )
}
if (cargoVersion !== pkg.version) {
  problems.push(`src-tauri/Cargo.toml: version "${cargoVersion}" != package.json "${pkg.version}"`)
}
if (cargoLockVersion !== pkg.version) {
  problems.push(
    `src-tauri/Cargo.lock: inventory-gear version "${cargoLockVersion}" != package.json "${pkg.version}" ` +
      `(cargo rewrites this on the next build, which would dirty the tree)`
  )
}
if (npmLock.version !== pkg.version) {
  problems.push(`package-lock.json: version "${npmLock.version}" != package.json "${pkg.version}"`)
}
if (npmLock.packages?.[""]?.version !== pkg.version) {
  problems.push(
    `package-lock.json: packages[""].version "${npmLock.packages?.[""]?.version}" != package.json "${pkg.version}"`
  )
}

const cmd = process.argv[2] ?? "check"

if (cmd === "check") {
  if (problems.length) {
    console.error("Version mismatch:\n" + problems.map((p) => "  - " + p).join("\n"))
    console.error("\nFix with: npm run version:sync")
    process.exit(1)
  }
  console.log(
    `version in sync: ${pkg.version} ` +
      `(package.json → tauri.conf.json → package-lock.json → Cargo.toml → Cargo.lock)`
  )
  process.exit(0)
}

/**
 * Rewrites every derived file from `pkg.version`. `tauri.conf.json` is not
 * touched: it points at package.json and must keep doing so.
 */
function propagate(version) {
  const p = JSON.parse(read("package.json"))
  p.version = version
  write("package.json", JSON.stringify(p, null, 2) + "\n")

  write(
    "src-tauri/Cargo.toml",
    read("src-tauri/Cargo.toml").replace(/^version\s*=\s*"[^"]+"/m, `version = "${version}"`)
  )

  // Only this crate's entry; every other [[package]] in the lock is a dependency
  // whose version belongs to its own upstream release.
  write(
    "src-tauri/Cargo.lock",
    read("src-tauri/Cargo.lock").replace(
      /(name = "inventory-gear"\nversion = ")[^"]+(")/,
      `$1${version}$2`
    )
  )

  const lock = JSON.parse(read("package-lock.json"))
  lock.version = version
  if (lock.packages?.[""]) lock.packages[""].version = version
  write("package-lock.json", JSON.stringify(lock, null, 2) + "\n")
}

if (cmd === "sync") {
  propagate(pkg.version)
  console.log(`derived files → ${pkg.version} (package.json → tauri.conf.json → package-lock.json → Cargo.toml → Cargo.lock)`)
  process.exit(0)
}

if (cmd === "set") {
  const v = process.argv[3]
  if (!isSemver(v)) {
    console.error(`"${v ?? ""}" is not a valid Semantic Version.`)
    console.error("")
    console.error("Expected MAJOR.MINOR.PATCH with an optional prerelease, for example:")
    console.error("  1.0.0            1.0.1            2.5.10")
    console.error("  1.0.0-alpha.1    1.0.0-beta.1     1.0.0-rc.1")
    if (typeof v === "string" && v.startsWith("v")) {
      console.error("")
      console.error(`Did you mean "${v.slice(1)}"? The leading "v" belongs to the git tag, not the version.`)
    }
    console.error("")
    console.error("Usage: node scripts/version.mjs set <MAJOR.MINOR.PATCH[-PRERELEASE]>")
    process.exit(1)
  }
  propagate(v)
  console.log(
    `version set to ${v} in package.json, package-lock.json, Cargo.toml and Cargo.lock ` +
      `(tauri.conf.json reads package.json)`
  )
  process.exit(0)
}

if (cmd === "tag") {
  // Used by the release workflow so tag validation and `version:set` can never
  // disagree about what a version is.
  const raw = process.argv[3] ?? ""
  const tagVersion = normalizeTag(raw)
  if (!tagVersion) {
    console.error(`::error::"${raw}" is not a valid release tag. Expected v<MAJOR.MINOR.PATCH[-PRERELEASE]>.`)
    process.exit(1)
  }
  if (tagVersion !== pkg.version) {
    console.error(`::error::Tag ${raw} does not match the app version ${pkg.version}.`)
    console.error(`Run 'npm run version:set ${tagVersion}' and commit before tagging.`)
    process.exit(1)
  }
  console.log(`Tag ${raw} matches app version ${pkg.version}`)
  process.exit(0)
}

console.error("Usage: node scripts/version.mjs <check|sync|set VERSION|tag GIT_TAG>")
process.exit(1)
