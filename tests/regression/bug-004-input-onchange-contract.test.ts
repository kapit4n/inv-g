import { describe, it, expect } from "vitest"
import { readFileSync, globSync } from "node:fs"
import { join } from "node:path"

/**
 * BUG-004: "Abrir Caja" (and the quote form) had inputs that rejected every
 * keystroke.
 *
 * The codebase has two different `onChange` contracts, and they are not
 * interchangeable:
 *
 *   - `SelectField` / `Combobox`  ->  onChange(value: string)
 *   - `Input` / `TextField` / `TextareaField`  ->  onChange(event)
 *
 * `TextField` extends `React.InputHTMLAttributes<HTMLInputElement>` and spreads
 * straight onto a native `<input>`, so its handler receives a ChangeEvent. The
 * broken code did:
 *
 *     <TextField type="number" value={openingBalance}
 *                onChange={(v) => setOpeningBalance(Number(v))} />
 *
 * `Number(someChangeEvent)` is `NaN`, so every keystroke stored `NaN` and the
 * controlled `value` reverted to an unparseable state. The field silently ate
 * all input.
 *
 * A unit test that reimplemented the number parsing would not have caught this:
 * the bug is in the *wiring*, not the arithmetic. So this test reads the source
 * and enforces the two contracts structurally.
 */

const SRC = join(process.cwd(), "src")

/** Components that forward a native DOM event to onChange. */
const EVENT_ONCHANGE = ["Input", "TextField", "TextareaField"]
/** Components that hand the *value* to onChange (Radix Select & friends). */
const VALUE_ONCHANGE = ["SelectField", "Combobox", "Select"]

interface Offender {
  file: string
  line: number
  code: string
}

/**
 * End offset of the opening tag that starts at `start`, or -1.
 *
 * Tracks brace depth so that the `>` of an arrow function inside
 * `onChange={(v) => ...}` is not mistaken for the end of the tag — that mistake
 * silently truncates the element before the handler is ever seen.
 */
function openingTagEnd(text: string, start: number): number {
  let depth = 0
  for (let k = start; k < text.length; k++) {
    const ch = text[k]
    if (ch === "{") depth++
    else if (ch === "}") depth--
    else if (ch === ">" && depth === 0) return k
  }
  return -1
}

function findMismatchedHandlers(): Offender[] {
  const offenders: Offender[] = []
  const tagPattern = /<(Input|TextField|TextareaField|SelectField|Combobox|Select)\b/g

  for (const rel of globSync("**/*.tsx", { cwd: SRC })) {
    const text = readFileSync(join(SRC, rel), "utf8")
    const file = rel.split("\\").join("/")

    for (const m of text.matchAll(tagPattern)) {
      const component = m[1]
      if (!EVENT_ONCHANGE.includes(component)) continue

      const end = openingTagEnd(text, m.index)
      if (end === -1) continue
      const tag = text.slice(m.index, end)

      const handler = /onChange=\{\(\s*([A-Za-z_]\w*)\s*\)\s*=>([\s\S]*?)(?=\}\s*[,\s/>]|\}\s*$)/.exec(tag)
      if (!handler) continue

      const [, param, body] = handler
      // Reading `.target`/`.currentTarget` means the author treated it as an event.
      if (new RegExp(`\\b${param}\\s*\\.\\s*(target|currentTarget)\\b`).test(body)) continue
      // The parameter must genuinely be used as a value.
      if (!new RegExp(`\\b${param}\\b`).test(body)) continue

      offenders.push({
        file,
        line: text.slice(0, m.index).split("\n").length,
        code: handler[0].replace(/\s+/g, " ").trim(),
      })
    }
  }

  return offenders
}

describe("BUG-004: onChange contract mismatch on native inputs", () => {
  const offenders = findMismatchedHandlers()

  it("no input treats its onChange event as a value", () => {
    if (offenders.length > 0) {
      const report = offenders.map((o) => `  ${o.file}:${o.line}  ${o.code}`).join("\n")
      throw new Error(
        `Found ${offenders.length} input(s) whose onChange consumes the argument as a ` +
          `value. Input/TextField/TextareaField forward a ChangeEvent, so this yields NaN ` +
          `and the field silently rejects all input:\n${report}\n\n` +
          `Use onChange={(e) => setX(Number(e.target.value) || 0)}. ` +
          `SelectField and Combobox do take a value, so those are allowed.`
      )
    }
    expect(offenders).toHaveLength(0)
  })

  it("recognises the two distinct contracts", () => {
    // Guards the guard: if the component lists were wrong the scan would either
    // pass vacuously or start flagging SelectField.
    expect(EVENT_ONCHANGE).toContain("TextField")
    expect(VALUE_ONCHANGE).toContain("SelectField")
    expect(EVENT_ONCHANGE).not.toContain("SelectField")
  })

  it("reproduces the failure: coercing an event to a number yields NaN", () => {
    // The exact expression from the bug, on the exact object React passes.
    const event = { target: { value: "150" } } as unknown as React.ChangeEvent<HTMLInputElement>

    expect(Number(event as unknown as string)).toBeNaN()
    expect(Number(event.target.value)).toBe(150)
  })
})
