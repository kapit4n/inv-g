#!/usr/bin/env node
/**
 * Cut the next alpha release: bump the version, verify the derived files,
 * commit, tag and push — the whole sequence from a clean tree.
 *
 *   node scripts/release-alpha.mjs               # 1.0.0-alpha.3 -> 1.0.0-alpha.4
 *   node scripts/release-alpha.mjs --dry-run     # stop after version:set / check
 *   RELEASE_BRANCH=main node scripts/release-alpha.mjs
 *
 * The release requires a completely clean working tree. A dirty tree would
 * sweep unreleased work into the release commit, so the script refuses to run
 * instead of `git add .` over whatever is outstanding.
 *
 * The push target defaults to the current branch (the guide's `main` is only
 * right when a release is cut from `main`); override with RELEASE_BRANCH.
 *
 * Sequence (mirrors the release guide):
 *   git status (must be clean)
 *   npm run version:set <next-alpha>
 *   npm run version:check
 *   git status / git diff (review)
 *   git add . && git commit -m "chore: release <next-alpha>"
 *   git tag v<next-alpha>
 *   git push origin <branch> && git push origin v<next-alpha>
 */

import { execFileSync } from "node:child_process"
import { readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")

const C = {
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
}

const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"))
const currentVersion = pkg.version

/** Matches 1.0.0-alpha.N exactly. */
const ALPHA_RE = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)-alpha\.(0|[1-9]\d*)$/

function nextAlpha(version) {
  const m = ALPHA_RE.exec(version)
  if (!m) {
    return null
  }
  const [major, minor, patch, n] = m.slice(1)
  return `${major}.${minor}.${patch}-alpha.${Number(n) + 1}`
}

function run(cmd, args, opts = {}) {
  const result = execFileSync(cmd, args, {
    cwd: ROOT,
    stdio: opts.silent ? "pipe" : "inherit",
    encoding: "utf8",
  })
  return result
}

function git(args, { silent = false } = {}) {
  if (silent) {
    return execFileSync("git", args, { cwd: ROOT, stdio: ["ignore", "pipe", "ignore"], encoding: "utf8" })
  }
  run("git", args)
  return ""
}

const dryRun = process.argv.includes("--dry-run")
if (!dryRun && process.argv.length > 2 && process.argv[2] !== "--dry-run") {
  console.error(`Unknown argument: ${process.argv[2]}`)
  console.error("Usage: node scripts/release-alpha.mjs [--dry-run]")
  process.exit(1)
}

const next = nextAlpha(currentVersion)

console.log(`Current version:  ${C.bold(currentVersion)}`)
if (!next) {
  console.error(
    C.red(`Expected a 1.0.0-alpha.N version in package.json, found "${currentVersion}".\n` +
      `Run \`npm run version:set <version>\` for the first alpha instead of a release script.`)
  )
  process.exit(1)
}
console.log(`Next alpha:       ${C.bold(next)}`)
console.log(`Push target:      ${C.bold(process.env.RELEASE_BRANCH ?? "current branch")}`)

// ── Step 0: must start from a clean tree ──────────────────────────────────────
console.log(C.dim("\n[1/8] checking the working tree is clean…"))
const dirty = git(["status", "--porcelain"], { silent: true }).trim()
if (dirty) {
  console.error(C.red("The working tree is not clean. A release commits exactly the version bump,"))
  console.error(C.red("so nothing may be staged, modified or untracked before it runs."))
  console.error(C.dim("\nOutstanding changes:"))
  for (const line of dirty.split("\n")) console.error(C.dim("  " + line))
  console.error("\nCommit, stash or revert them, then re-run the script.")
  process.exit(1)
}
console.log("  clean.")

// ── Step 1: bump the version ──────────────────────────────────────────────────
console.log(C.dim(`\n[2/8] npm run version:set ${next}…`))
run("npm", ["run", "version:set", next])

// ── Step 2: verify every derived file agrees ─────────────────────────────────
console.log(C.dim("\n[3/8] npm run version:check…"))
run("npm", ["run", "version:check"])

// ── Step 3: review what the bump touched ──────────────────────────────────────
console.log(C.dim("\n[4/8] changes to be released:"))
console.log(git(["status", "--short"], { silent: true }).trim() || "(none)")
console.log(git(["diff", "--stat"], { silent: true }).trim())

if (dryRun) {
  console.log(C.yellow("\n--dry-run: restoring the version bump so the tree stays clean."))
  // The tree was clean when the script started, so discarding the bump is safe.
  run("git", ["checkout", "--", "."])
  console.log(git(["status", "--porcelain"], { silent: true }).trim() || "  tree clean.")
  console.log("Nothing was committed; run without --dry-run to release.")
  process.exit(0)
}

// ── Step 4: commit the bump ───────────────────────────────────────────────────
console.log(C.dim(`\n[5/8] git add -A && git commit -m "chore: release ${next}"…`))
git(["add", "-A"])
git(["commit", "-m", `chore: release ${next}`])
console.log(git(["status", "--short"], { silent: true }).trim() || "  tree clean after commit.")

// ── Step 5: tag ───────────────────────────────────────────────────────────────
const tag = `v${next}`
console.log(C.dim(`\n[6/8] git tag ${tag}…`))
const existing = git(["rev-parse", "-q", "--verify", `refs/tags/${tag}`], { silent: true }).trim()
if (existing) {
  console.error(C.red(`Tag ${tag} already exists at ${existing}. The release is committed but not tagged.`))
  console.error(C.red("Resolve manually: delete the tag or use the existing one, then `git push` the rest."))
  process.exit(1)
}
git(["tag", tag])
console.log(`  tagged ${tag}.`)

// ── Step 6: push branch + tag ─────────────────────────────────────────────────
console.log(C.dim("\n[7/8] pushing branch…"))
const branch = process.env.RELEASE_BRANCH ?? git(["rev-parse", "--abbrev-ref", "HEAD"], { silent: true }).trim()
run("git", ["push", "origin", branch])

console.log(C.dim("\n[8/8] pushing tag…"))
run("git", ["push", "origin", tag])

console.log(`\n${C.green("Released")} ${C.bold(next)} on ${branch} with tag ${C.bold(tag)}.`)