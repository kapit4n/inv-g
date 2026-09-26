import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

/**
 * The Windows release pipeline.
 *
 * It once created a GitHub Release from a manual run on `main`, and failed with
 * `400 {"message":"Missing tag_name parameter"}` /
 * `Unexpected error fetching GitHub release for tag refs/heads/main`: the release
 * step was reachable without a tag, and `softprops/action-gh-release` fell back to
 * `github.ref` (`refs/heads/main`) when no `tag_name` was given.
 *
 * A regression here is invisible until someone tries to publish, and the failure
 * mode is a confusing HTTP 400 rather than an obvious mistake, so the invariants
 * are asserted here instead. Parsed by hand rather than with a YAML library: the
 * repo has no YAML dependency, and this only needs a handful of fields.
 */

const ROOT = join(__dirname, "../..")
const read = (p: string) => readFileSync(join(ROOT, p), "utf8")

const RELEASE_WORKFLOW = ".github/workflows/windows-installer.yml"
const CI_WORKFLOW = ".github/workflows/ci.yml"

/** The `on:` block, up to the first key at column 0. */
function triggerBlock(source: string): string {
  const lines = source.split("\n")
  const start = lines.findIndex((l) => /^on:\s*$/.test(l))
  expect(start, "'on:' block not found").toBeGreaterThan(-1)
  const body: string[] = []
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i]
    if (line.trim() !== "" && !/^\s/.test(line)) break
    body.push(line)
  }
  return body.join("\n")
}

/** The body of the step named `name`, up to the next step or key at its indent. */
function stepBody(source: string, name: string): string {
  const lines = source.split("\n")
  const start = lines.findIndex((l) => l.trim() === `- name: ${name}`)
  expect(start, `step "${name}" not found`).toBeGreaterThan(-1)
  const indent = (lines[start].match(/^ */) as RegExpMatchArray)[0].length
  const body: string[] = []
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i]
    if (line.trim() === "") {
      body.push(line)
      continue
    }
    if ((line.match(/^ */) as RegExpMatchArray)[0].length <= indent) break
    body.push(line)
  }
  return body.join("\n")
}

const source = read(RELEASE_WORKFLOW)
const triggers = triggerBlock(source)
const release = stepBody(source, "Release")

describe("windows installer release workflow", () => {
  it("is triggered by version tags, not by branch pushes", () => {
    expect(triggers).toMatch(/^\s*tags:\s*\["v\*"\]/m)
    // A branch trigger here is what let a `main` push reach the release step.
    expect(triggers).not.toMatch(/branches:/)
  })

  it("keeps a manual run for building without releasing", () => {
    expect(triggers).toMatch(/^\s*workflow_dispatch:/m)
    // The old `publish` input defaulted to true, which is how a manual run on a
    // branch created (and failed to create) a release.
    expect(source).not.toMatch(/inputs\.publish/)
    expect(triggers).not.toMatch(/inputs:/)
  })

  it("only releases for a tag", () => {
    expect(release).toMatch(/if:\s*github\.ref_type\s*==\s*'tag'/)
  })

  it("passes the triggering tag explicitly", () => {
    // Without this the action defaults to `github.ref`, which is
    // `refs/heads/main` for a non-tag run — the reported 400.
    expect(release).toMatch(/tag_name:\s*\$\{\{\s*github\.ref_name\s*\}\}/)
    // `github.ref` would carry the `refs/tags/` prefix.
    expect(release).not.toMatch(/tag_name:.*github\.ref\s*\}\}/)
  })

  it("has permission to create a release", () => {
    expect(source).toMatch(/^permissions:\s*$/m)
    expect(source).toMatch(/^\s{2}contents:\s*write\s*$/m)
  })

  it("uses the built-in token, not a personal access token", () => {
    expect(release).toMatch(/GITHUB_TOKEN:\s*\$\{\{\s*secrets\.GITHUB_TOKEN\s*\}\}/)
    const secrets = [...source.matchAll(/secrets\.([A-Z_]+)/g)].map((m) => m[1])
    expect([...new Set(secrets)]).toEqual(["GITHUB_TOKEN"])
  })

  it("enables generated release notes and fails if the installer is missing", () => {
    expect(release).toMatch(/generate_release_notes:\s*true/)
    expect(release).toMatch(/fail_on_unmatched_files:\s*true/)
  })

  it("uploads the installer the build actually produced", () => {
    const upload = stepBody(source, "Upload installer artifact")
    // One path, defined once, so the artifact and the release cannot diverge.
    expect(upload).toMatch(/path:\s*\$\{\{\s*env\.INSTALLER_ASSET\s*\}\}/)
    expect(release).toMatch(/files:\s*\$\{\{\s*env\.INSTALLER_ASSET\s*\}\}/)
    expect(upload).toMatch(/if-no-files-found:\s*error/)
    // The normalized asset path lives in exactly one place.
    expect(source.match(/bundle\/nsis\/InventoryGear-/g)).toHaveLength(1)
  })

  it("fails loudly when the bundler produced no installer", () => {
    const normalize = stepBody(source, "Normalize installer name")
    expect(normalize).toMatch(/No NSIS bundle directory/)
    expect(normalize).toMatch(/No \.exe found/)
    // `tauri build --bundles nsis` exits 0 off Windows without producing anything.
    expect(source).toMatch(/tauri build --bundles nsis/)
  })

  it("refuses to release a tag that does not match the app version", () => {
    const guard = stepBody(source, "Verify tag matches app version")
    expect(guard).toMatch(/if:\s*github\.ref_type\s*==\s*'tag'/)
    // Strips the `v`, so v1.2.3 is compared against package.json's `1.2.3`.
    expect(guard).toMatch(/GITHUB_REF_NAME#v/)
    expect(guard).toMatch(/exit 1/)
  })

  it("keeps the quality gate in front of the installer", () => {
    for (const step of ["Verify version sync", "TypeScript check", "Lint", "Frontend tests", "Rust tests"]) {
      expect(stepBody(source, step), `missing step: ${step}`).not.toBe("")
    }
  })

  it("does not let the CI workflow publish anything", () => {
    const ci = read(CI_WORKFLOW)
    expect(ci).not.toMatch(/action-gh-release/)
    expect(ci).not.toMatch(/softprops/)
  })
})

describe("release version sources", () => {
  const pkg = JSON.parse(read("package.json"))
  const cargo = read("src-tauri/Cargo.toml")
  const tauriConf = JSON.parse(read("src-tauri/tauri.conf.json"))

  it("takes the version from package.json, which the installer name follows", () => {
    expect(pkg.version).toMatch(/^\d+\.\d+\.\d+$/)
    // tauri.conf.json reads package.json rather than repeating the number.
    expect(tauriConf.version).toBe("../package.json")
    const cargoVersion = cargo.match(/^version\s*=\s*"([^"]+)"/m)?.[1]
    expect(cargoVersion).toBe(pkg.version)
  })

  it("names the installer after that same version", () => {
    expect(source).toContain('"INSTALLER_ASSET=src-tauri/target/release/bundle/nsis/InventoryGear-$version-setup.exe"')
    expect(source).toContain("(Get-Content package.json -Raw | ConvertFrom-Json).version")
  })
})
