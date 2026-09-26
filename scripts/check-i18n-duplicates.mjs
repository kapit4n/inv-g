/**
 * NOTE: no shebang, on purpose.
 *
 * This file is both a CLI entry (`node scripts/check-i18n-duplicates.mjs`, which
 * needs no shebang) and an imported module (the tests import `checkLocale` and
 * `main`). When the test runner decides to transform this file through
 * Vite/Rolldown's SSR path instead of loading it natively, it hoists the `node:`
 * imports to the top of the output and leaves the shebang behind mid-file, and
 * the result no longer parses:
 *
 *   RolldownError: Parse failure: Invalid Character `!`
 *   1: ... const dirname = ...;#!/usr/bin/env node
 *
 * Whether that path is taken is a loader detail, so the file is invalid for
 * some runners and fine for others -- the worst kind of failure to chase. Keep
 * the shebang out.
 */
/**
 * Fails when a translation file declares the same key twice.
 *
 * `JSON.parse()` silently keeps the LAST duplicate and discards the earlier
 * one, so a re-declared key is invisible: the UI renders whatever the later
 * block happened to say. That is how the CRM section ended up labelled
 * "Titulo" -- a note-field label near the bottom of `crm.json` re-declared the
 * top-level `title` key.
 *
 *   node scripts/check-i18n-duplicates.mjs          # report, exit 1 if any
 *   node scripts/check-i18n-duplicates.mjs --quiet  # failures only
 *
 * Keys are tracked by full path, so `product360.tabs.pricing` and a top-level
 * `pricing` are correctly treated as different keys.
 */
import { readdirSync, readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const LOCALES_DIR = join(ROOT, "src/i18n/locales")

/**
 * Reports every key path declared more than once, with the line of each
 * declaration.
 *
 * A real JSON parser cannot be used: `JSON.parse` resolves duplicates before
 * we can see them, which is the whole problem. So the raw text is walked with
 * an explicit frame stack. Each frame records the dotted prefix that applies to
 * the keys declared directly inside it, which is what makes nested paths
 * reliable: `commandPalette.actions` and a top-level `actions` are different
 * keys and must not be reported.
 *
 * @param {string} text
 * @returns {{ key: string, declarations: { line: number }[] }[]}
 */
export function findDuplicateKeys(text) {
  /** @type {Map<string, number[]>} */
  const found = new Map()
  /** @type {{ prefix: string, isArray: boolean, index: number }[]} */
  const frames = [{ prefix: "", isArray: false, index: 0 }]
  let i = 0
  /** Key whose value is the container we are about to enter. */
  let pendingKey = null

  const lineAt = (index) => {
    let line = 1
    for (let n = 0; n < index; n++) if (text[n] === "\n") line++
    return line
  }

  const readString = () => {
    let j = i + 1
    let value = ""
    while (j < text.length) {
      if (text[j] === "\\") {
        value += text[j] + text[j + 1]
        j += 2
        continue
      }
      if (text[j] === '"') break
      value += text[j]
      j++
    }
    i = j + 1
    return value
  }

  const currentFrame = () => frames[frames.length - 1]

  while (i < text.length) {
    const char = text[i]

    if (char === '"') {
      const start = i
      const value = readString()
      if (pendingKey !== null) {
        // A string used as a value, not as a key.
        pendingKey = null
        continue
      }

      let k = i
      while (k < text.length && /\s/.test(text[k])) k++
      if (text[k] !== ":") continue

      const prefix = currentFrame().prefix
      const full = prefix ? `${prefix}.${value}` : value
      const line = lineAt(start)
      const lines = found.get(full)
      if (lines) lines.push(line)
      else found.set(full, [line])

      // A container value keeps this key as the prefix of everything inside it.
      let m = k + 1
      while (m < text.length && /\s/.test(text[m])) m++
      pendingKey = text[m] === "{" || text[m] === "[" ? full : null
      i = k + 1
      continue
    }

    if (char === "{" || char === "[") {
      // Elements of an array are separate scopes, so each one needs its own
      // prefix: `[{ "a": 1 }, { "a": 2 }]` declares `a` twice but is valid.
      const parent = currentFrame()
      let prefix = pendingKey ?? ""
      if (char === "[" && parent.isArray) {
        prefix = parent.prefix
      } else if (char === "{" && parent.isArray) {
        prefix = parent.prefix ? `${parent.prefix}[${parent.index}]` : `[${parent.index}]`
        parent.index++
      }
      frames.push({ prefix, isArray: char === "[", index: 0 })
      pendingKey = null

      i++
      continue
    }

    if (char === "}" || char === "]") {
      if (frames.length > 1) frames.pop()
      pendingKey = null
      i++
      continue
    }

    if (char === ",") {
      pendingKey = null
      i++
      continue
    }

    if (char === ":") {
      // The next string is this key's value.
      i++
      continue
    }

    i++
  }

  const duplicates = []
  for (const [key, declarations] of found) {
    if (declarations.length > 1) duplicates.push({ key, declarations })
  }
  return duplicates
}

/** Reads the literal that follows a key on a given line, for a readable report. */
function valueAt(text, line) {
  const raw = text.split("\n")[line - 1] ?? ""
  const match = raw.match(/:\s*(.+?),?\s*$/)
  return match ? match[1] : "?"
}

export function auditLocaleDirectory(dir = LOCALES_DIR) {
  const problems = []
  for (const locale of readdirSync(dir).sort()) {
    for (const file of readdirSync(join(dir, locale)).sort()) {
      if (!file.endsWith(".json")) continue
      const text = readFileSync(join(dir, locale, file), "utf8")
      const duplicates = findDuplicateKeys(text)
      if (duplicates.length) problems.push({ locale, file, text, duplicates })
    }
  }
  return problems
}

function main() {
  const quiet = process.argv.includes("--quiet")
  const problems = auditLocaleDirectory()
  let total = 0

  for (const { locale, file, text, duplicates } of problems) {
    total += duplicates.length
    if (!quiet) console.log(`\n${locale}/${file}`)
    for (const { key, declarations } of duplicates) {
      const shown = declarations.map((line) => `L${line}=${valueAt(text, line)}`).join("  |  ")
      console.log(`  ${key.padEnd(30)} ${shown}`)
    }
  }

  if (total > 0) {
    console.error(
      `\n${total} duplicate translation key(s). JSON.parse keeps only the last, so the ` +
        `earlier value is silently discarded.`,
    )
    process.exit(1)
  }
  if (!quiet) console.log("No duplicate translation keys.")
}

if (process.argv[1]?.endsWith("check-i18n-duplicates.mjs")) main()
