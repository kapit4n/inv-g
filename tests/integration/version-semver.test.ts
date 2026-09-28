import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { execFileSync } from "node:child_process"
import { mkdtempSync, mkdirSync, cpSync, rmSync, writeFileSync, readFileSync, existsSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

/**
 * The version system had no tests at all, which is why a two-character regex
 * could reject every prerelease without anything failing.
 *
 * `scripts/version.mjs` is a CLI over the real repository files, so these tests
 * run it as a subprocess against a temporary copy of the project. That keeps two
 * properties worth having:
 *
 *  - the exit codes and `::error::` messages the release workflow depends on are
 *    exercised as the workflow sees them, not through an internal API;
 *  - a failing test can never leave the developer's own package.json edited.
 */

const ROOT = join(__dirname, "../..")
const SCRIPT = join(ROOT, "scripts/version.mjs")

/** Versions `version:set` must accept, including every prerelease channel. */
const ACCEPTED = [
  "1.0.0",
  "1.0.1",
  "2.5.10",
  "1.0.0-alpha.1",
  "1.0.0-alpha.2",
  "1.0.0-beta.1",
  "1.0.0-beta.2",
  "1.0.0-rc.1",
  "1.0.0-alpha",
  "1.0.0-0.3.7",
  "1.0.0-x.7.z.92",
  "1.0.0+build.5",
  "1.0.0-rc.1+build.5",
]

/** Versions that must still be refused — validation is not loosened to fit. */
const REJECTED = [
  "1",
  "1.0",
  "1.0.0.1",
  "foo",
  "1.0-alpha",
  "",
  "v1.0.0",
  "1.0.0-",
  "1.0.0-alpha..1",
  "01.0.0",
  "1.00.0",
  "1.0.0 ",
  " 1.0.0",
  "1.0.0-alpha.1!",
  "latest",
]

let sandbox: string

function makeSandbox() {
  // Only the files the script touches, so the copy stays cheap.
  sandbox = mkdtempSync(join(tmpdir(), "version-mjs-"))
  cpSync(join(ROOT, "package.json"), join(sandbox, "package.json"))
  cpSync(join(ROOT, "package-lock.json"), join(sandbox, "package-lock.json"))
  // The script resolves ROOT from its own location, so it must keep its place in
  // scripts/ inside the sandbox.
  mkdirSync(join(sandbox, "scripts"), { recursive: true })
  cpSync(join(ROOT, "scripts/version.mjs"), join(sandbox, "scripts/version.mjs"))
  cpSync(join(ROOT, "src-tauri"), join(sandbox, "src-tauri"), {
    recursive: true,
    filter: (src) => !src.includes("/target"),
  })
  return sandbox
}

/** Runs the CLI in the sandbox. Returns { code, stdout, stderr }. */
function run(...args: string[]) {
  try {
    const stdout = execFileSync("node", [join(sandbox, "scripts/version.mjs"), ...args], {
      cwd: sandbox,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    })
    return { code: 0, stdout, stderr: "" }
  } catch (err) {
    const e = err as { status?: number; stdout?: string; stderr?: string }
    return { code: e.status ?? 1, stdout: e.stdout ?? "", stderr: e.stderr ?? "" }
  }
}

function sandboxFile(path: string) {
  return JSON.parse(readFileSync(join(sandbox, path), "utf8"))
}

function sandboxText(path: string) {
  return readFileSync(join(sandbox, path), "utf8")
}

/**
 * Rewrites a sandbox file with CRLF endings, the way `core.autocrlf=true` leaves
 * every text file on a Windows checkout.
 */
function crlf(path: string) {
  const abs = join(sandbox, path)
  writeFileSync(abs, readFileSync(abs, "utf8").replace(/\r?\n/g, "\r\n"))
}

beforeEach(() => {
  makeSandbox()
})

afterEach(() => {
  if (sandbox) rmSync(sandbox, { recursive: true, force: true })
})

describe("version:set accepts Semantic Versions", () => {
  it.each(ACCEPTED)("accepts %s", (version) => {
    const result = run("set", version)
    expect(result.stderr).toBe("")
    expect(result.code).toBe(0)
    expect(sandboxFile("package.json").version).toBe(version)
  })

  it.each(REJECTED)("rejects %j", (version) => {
    const before = sandboxText("package.json")
    const result = run("set", version)

    expect(result.code).toBe(1)
    // Nothing may be written when the input is invalid.
    expect(sandboxText("package.json")).toBe(before)
  })

  it("rejects a missing argument", () => {
    expect(run("set").code).toBe(1)
  })

  it("points at the bare version when given a tag", () => {
    const result = run("set", "v1.0.0")
    expect(result.code).toBe(1)
    expect(result.stderr).toContain('Did you mean "1.0.0"')
  })

  it("names the accepted format when rejecting", () => {
    const result = run("set", "nope")
    expect(result.stderr).toContain("not a valid Semantic Version")
    expect(result.stderr).toContain("1.0.0-alpha.1")
  })
})

describe("version:set propagates to every version location", () => {
  const VERSION = "1.0.0-alpha.2"

  it("writes the version everywhere the project needs it", () => {
    expect(run("set", VERSION).code).toBe(0)

    expect(sandboxFile("package.json").version).toBe(VERSION)
    expect(sandboxFile("package-lock.json").version).toBe(VERSION)
    expect(sandboxFile("package-lock.json").packages[""].version).toBe(VERSION)
    expect(sandboxText("src-tauri/Cargo.toml")).toMatch(
      new RegExp(`^version = "${VERSION.replace(/\./g, "\\.")}"`, "m")
    )
    expect(sandboxText("src-tauri/Cargo.lock")).toContain(
      `name = "inventory-gear"\nversion = "${VERSION}"`
    )
  })

  it("leaves tauri.conf.json pointing at package.json", () => {
    run("set", VERSION)
    // It must keep reading package.json, never gain a hardcoded copy.
    expect(sandboxFile("src-tauri/tauri.conf.json").version).toBe("../package.json")
  })

  it("leaves other packages in Cargo.lock alone", () => {
    const before = sandboxText("src-tauri/Cargo.lock")
    // A version distinct from whatever the checkout currently holds, so the
    // comparison below always has exactly one difference to look at.
    const target = "9.9.9-rc.1"
    run("set", target)
    const after = sandboxText("src-tauri/Cargo.lock")

    // Every dependency keeps its own version; only inventory-gear changes.
    const versionsBefore = [...before.matchAll(/version = "([^"]+)"/g)].map((m) => m[1])
    const versionsAfter = [...after.matchAll(/version = "([^"]+)"/g)].map((m) => m[1])
    expect(versionsAfter).toHaveLength(versionsBefore.length)
    expect(versionsAfter.filter((v, i) => v !== versionsBefore[i])).toEqual([target])
  })

  it("reaches a state where check passes", () => {
    run("set", VERSION)
    const result = run("check")
    expect(result.code).toBe(0)
    expect(result.stdout).toContain(VERSION)
  })

  it("reaches a state where check passes for every accepted version", () => {
    for (const version of ACCEPTED) {
      expect(run("set", version).code, `set ${version}`).toBe(0)
      expect(run("check").code, `check ${version}`).toBe(0)
    }
  })
})

describe("version:check detects drift", () => {
  it("passes on the untouched project files", () => {
    // The real repository must be self-consistent, or `npm run verify` is broken.
    const result = (() => {
      try {
        return { code: 0, stdout: execFileSync("node", [SCRIPT, "check"], { encoding: "utf8" }), stderr: "" }
      } catch (err) {
        const e = err as { status?: number; stdout?: string; stderr?: string }
        return { code: e.status ?? 1, stdout: e.stdout ?? "", stderr: e.stderr ?? "" }
      }
    })()
    expect(result.stderr + result.stdout).not.toContain("mismatch")
    expect(result.code).toBe(0)
  })

  it("catches a Cargo.toml that was edited by hand", () => {
    const path = join(sandbox, "src-tauri/Cargo.toml")
    writeFileSync(path, sandboxText("src-tauri/Cargo.toml").replace(/^version = "[^"]+"/m, 'version = "9.9.9"'))
    const result = run("check")
    expect(result.code).toBe(1)
    expect(result.stderr).toContain("Cargo.toml")
  })

  it("catches a Cargo.lock left behind by a version bump", () => {
    const path = join(sandbox, "src-tauri/Cargo.lock")
    writeFileSync(
      path,
      sandboxText("src-tauri/Cargo.lock").replace(
        /(name = "inventory-gear"\nversion = ")[^"]+(")/,
        "$19.9.9$2"
      )
    )
    const result = run("check")
    expect(result.code).toBe(1)
    expect(result.stderr).toContain("Cargo.lock")
  })

  it("catches a package-lock.json that npm left behind", () => {
    const lock = sandboxFile("package-lock.json")
    lock.version = "9.9.9"
    writeFileSync(join(sandbox, "package-lock.json"), JSON.stringify(lock, null, 2) + "\n")
    const result = run("check")
    expect(result.code).toBe(1)
    expect(result.stderr).toContain("package-lock.json")
  })

  it("catches a tauri.conf.json that hardcoded a version", () => {
    const conf = sandboxFile("src-tauri/tauri.conf.json")
    conf.version = "1.0.0"
    writeFileSync(join(sandbox, "src-tauri/tauri.conf.json"), JSON.stringify(conf, null, 2) + "\n")
    const result = run("check")
    expect(result.code).toBe(1)
    expect(result.stderr).toContain("single source of truth")
  })

  it("refuses a package.json version that is not semver", () => {
    const pkg = sandboxFile("package.json")
    pkg.version = "1.0"
    writeFileSync(join(sandbox, "package.json"), JSON.stringify(pkg, null, 2) + "\n")
    const result = run("check")
    expect(result.code).toBe(1)
    expect(result.stderr).toContain("not a valid Semantic Version")
  })
})

describe("version:sync", () => {
  it("repairs drift from package.json without changing the source of truth", () => {
    const path = join(sandbox, "src-tauri/Cargo.toml")
    writeFileSync(path, sandboxText("src-tauri/Cargo.toml").replace(/^version = "[^"]+"/m, 'version = "0.0.1"'))
    expect(run("check").code).toBe(1)

    expect(run("sync").code).toBe(0)
    expect(run("check").code).toBe(0)
    expect(sandboxFile("package.json").version).not.toBe("0.0.1")
  })

  it("propagates a prerelease already present in package.json", () => {
    const pkg = sandboxFile("package.json")
    pkg.version = "2.0.0-rc.1"
    writeFileSync(join(sandbox, "package.json"), JSON.stringify(pkg, null, 2) + "\n")

    expect(run("sync").code).toBe(0)
    expect(run("check").code).toBe(0)
    expect(sandboxText("src-tauri/Cargo.toml")).toContain('version = "2.0.0-rc.1"')
  })
})

/**
 * The version script matched Cargo.lock with `\n` in the pattern, so on a Windows
 * checkout — `core.autocrlf=true`, the Git for Windows default, and what the
 * windows-latest runner uses — the match failed and the lockfile version read as
 * "undefined". The installer workflow failed on a version that was correct, and
 * only on the runner: the same commit checked clean on Linux and macOS.
 */
describe("CRLF checkouts", () => {
  const VERSION_FILES = [
    "package.json",
    "package-lock.json",
    "src-tauri/Cargo.toml",
    "src-tauri/Cargo.lock",
    "src-tauri/tauri.conf.json",
  ] as const

  it("passes version:check on a CRLF Cargo.lock", () => {
    crlf("src-tauri/Cargo.lock")
    const { code, stderr } = run("check")

    expect(stderr).not.toContain("undefined")
    expect(code).toBe(0)
  })

  it("passes version:check when every version file has CRLF endings", () => {
    for (const f of VERSION_FILES) crlf(f)
    const { code, stderr } = run("check")

    expect(stderr).not.toContain("undefined")
    expect(code).toBe(0)
  })

  it("still catches a Cargo.lock left behind by a version bump", () => {
    // Normalising the line endings must not blind the check: drift in a CRLF
    // lockfile has to be reported as the version it disagrees with, not as
    // "undefined", or the fix would trade a loud failure for a silent pass.
    const pkg = sandboxFile("package.json")
    pkg.version = "9.9.9-rc.1"
    writeFileSync(join(sandbox, "package.json"), JSON.stringify(pkg, null, 2) + "\n")
    crlf("src-tauri/Cargo.lock")

    // The sandbox mirrors the real checkout, whose version can drift between
    // releases; the reported mismatch has to name that live version.
    const cargoVersion = sandboxText("src-tauri/Cargo.toml").match(/^version\s*=\s*"([^"]+)"/m)![1]

    const { code, stderr } = run("check")

    expect(code).toBe(1)
    expect(stderr).toContain("src-tauri/Cargo.lock")
    expect(stderr).toContain(`"${cargoVersion}" != package.json "9.9.9-rc.1"`)
    expect(stderr).not.toContain("undefined")
  })

  it("still catches a hand-edited CRLF Cargo.toml", () => {
    const toml = sandboxText("src-tauri/Cargo.toml").replace(/^version\s*=\s*"[^"]+"/m, 'version = "0.0.1"')
    writeFileSync(join(sandbox, "src-tauri/Cargo.toml"), toml.replace(/\n/g, "\r\n"))

    const { code, stderr } = run("check")

    expect(code).toBe(1)
    expect(stderr).toContain("src-tauri/Cargo.toml")
  })

  it("sync rewrites a CRLF Cargo.lock instead of silently doing nothing", () => {
    // The old `replace` assumed LF, so on a CRLF checkout it matched nothing and
    // still exited 0, printing that the version had been propagated.
    crlf("src-tauri/Cargo.lock")
    const { code } = run("sync")

    expect(code).toBe(0)
    expect(sandboxText("src-tauri/Cargo.lock")).toContain(
      `name = "inventory-gear"\nversion = "${sandboxFile("package.json").version}"`
    )
  })

  it("sync leaves the files it writes with the LF endings .gitattributes requires", () => {
    for (const f of VERSION_FILES) crlf(f)
    run("sync")

    // tauri.conf.json is excluded on purpose: it points at package.json and must
    // never be rewritten, so sync is not allowed to normalise it either.
    for (const f of VERSION_FILES.filter((f) => f !== "src-tauri/tauri.conf.json")) {
      const text = sandboxText(f)
      expect(text.includes("\r\n"), `${f} kept CRLF`).toBe(false)
      expect(text.endsWith("\n"), `${f} lost its trailing newline`).toBe(true)
    }
  })

  it("sync does not touch tauri.conf.json, not even to normalise it", () => {
    crlf("src-tauri/tauri.conf.json")
    const before = sandboxText("src-tauri/tauri.conf.json")
    run("sync")

    expect(sandboxText("src-tauri/tauri.conf.json")).toBe(before)
  })

  it("round-trips: set, then check, on a fully CRLF sandbox", () => {
    for (const f of VERSION_FILES) crlf(f)
    expect(run("set", "2.0.0-beta.1").code).toBe(0)

    const { code, stderr } = run("check")

    expect(stderr).toBe("")
    expect(code).toBe(0)
  })
})

describe("release tag validation", () => {
  /** Sets the app version, then asks whether a tag is releasable. */
  function tagCheck(appVersion: string, tag: string) {
    run("set", appVersion)
    return run("tag", tag)
  }

  it("accepts tag v1.0.0-alpha.2 for app version 1.0.0-alpha.2", () => {
    const result = tagCheck("1.0.0-alpha.2", "v1.0.0-alpha.2")
    expect(result.code).toBe(0)
    expect(result.stdout).toContain("matches app version 1.0.0-alpha.2")
  })

  it("accepts tag v1.0.0 for app version 1.0.0", () => {
    const result = tagCheck("1.0.0", "v1.0.0")
    expect(result.code).toBe(0)
    expect(result.stdout).toContain("matches app version 1.0.0")
  })

  it("treats a tag with and without the leading v as equivalent", () => {
    expect(tagCheck("1.0.0-beta.1", "v1.0.0-beta.1").code).toBe(0)
    expect(tagCheck("1.0.0-beta.1", "1.0.0-beta.1").code).toBe(0)
  })

  it.each(["1.0.0-alpha.1", "1.0.0-alpha.2", "1.0.0-beta.1", "1.0.0-rc.1"])(
    "accepts prerelease tag v%s",
    (version) => {
      expect(tagCheck(version, `v${version}`).code).toBe(0)
    }
  )

  it("rejects a tag that disagrees with the app version", () => {
    const result = tagCheck("1.0.0", "v1.0.1")
    expect(result.code).toBe(1)
    expect(result.stderr).toContain("::error::")
    expect(result.stderr).toContain("does not match the app version 1.0.0")
  })

  it("rejects a stable tag against a prerelease app version", () => {
    // The exact case that would mislabel a release.
    const result = tagCheck("1.0.0-alpha.2", "v1.0.0")
    expect(result.code).toBe(1)
    expect(result.stderr).toContain("does not match")
  })

  it("rejects a prerelease tag against a stable app version", () => {
    const result = tagCheck("1.0.0", "v1.0.0-rc.1")
    expect(result.code).toBe(1)
  })

  it("does not treat 1.0.0-alpha.2 and 1.0.0-alpha.10 as equal", () => {
    expect(tagCheck("1.0.0-alpha.2", "v1.0.0-alpha.10").code).toBe(1)
  })

  it("tells the user which version:set to run", () => {
    const result = tagCheck("1.0.0", "v2.0.0-rc.1")
    expect(result.stderr).toContain("npm run version:set 2.0.0-rc.1")
  })

  it.each(["refs/tags/v1.0.0", "release-1.0.0", "v", "vv1.0.0", "1.0", "not-a-tag"])(
    "rejects malformed tag %j",
    (tag) => {
      const result = tagCheck("1.0.0", tag)
      expect(result.code).toBe(1)
      expect(result.stderr).toContain("not a valid release tag")
    }
  )
})

describe("the version script exists where the docs say it does", () => {
  it("is wired to the npm scripts the release process documents", () => {
    const scripts = sandboxFile("package.json").scripts
    expect(scripts["version:check"]).toContain("version.mjs check")
    expect(scripts["version:sync"]).toContain("version.mjs sync")
    expect(scripts["version:set"]).toContain("version.mjs set")
    expect(scripts["version:tag"]).toContain("version.mjs tag")
  })

  it("is part of the quality gate", () => {
    expect(sandboxFile("package.json").scripts.verify).toContain("version:check")
  })

  it("lives at the path the workflow calls", () => {
    expect(existsSync(join(ROOT, "scripts/version.mjs"))).toBe(true)
  })
})
