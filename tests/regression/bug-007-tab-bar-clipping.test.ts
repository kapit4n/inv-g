import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

/**
 * BUG-007: the tab names on the sale detail page were reported as invisible.
 *
 * The tabs are present in the DOM with correct labels and no `hidden`,
 * `invisible` or `opacity-0` class, so this is a layout problem rather than a
 * rendering one - which no DOM test can catch, because jsdom performs no layout.
 *
 * Two properties combine to clip the bar:
 *
 * 1. Every `TabsTrigger` carries `whitespace-nowrap`, so the bar's min-content
 *    width is the sum of the labels and cannot shrink. With four tabs
 *    (Detalles, Pagos, Recibos, Reembolsar) that is roughly 500px of
 *    non-negotiable width.
 * 2. In `app-shell.tsx` the content column is a flex item of a row that has
 *    `overflow-hidden`. A flex item's default `min-width: auto` is its
 *    min-content width, so without an explicit `min-w-0` the column refuses to
 *    shrink below that 500px, gets pushed sideways, and the row clips it.
 *
 * The user reported the space looking reduced and the bar pushed out of view,
 * which matches the second mechanism.
 *
 * These are asserted against the source because the invariant is about how the
 * classes compose, not about any one rendered element.
 */

function source(...parts: string[]): string {
  return readFileSync(join(process.cwd(), ...parts), "utf8")
}

const tabs = source("src", "components", "ui", "tabs.tsx")
const shell = source("src", "layouts", "app-shell.tsx")

/** The `className` string of a named forwardRef component in `src`. */
function classNamesOf(src: string, component: string): string {
  const decl = src.indexOf(`const ${component} = React.forwardRef`)
  expect(decl, `${component} must be a forwardRef component`).toBeGreaterThan(-1)
  const at = src.indexOf('>(({ className', decl)
  expect(at, `${component} must forward a className prop`).toBeGreaterThan(-1)

  // `at` points at the destructured parameter list. Step past the arrow to the
  // JSX, then anchor on `className={cn(` so the slice covers the class strings
  // rather than an earlier `ref={ref}` brace.
  const arrow = src.indexOf("=> (", at)
  expect(arrow, `${component} must render JSX from a forwardRef`).toBeGreaterThan(-1)
  const cn = src.indexOf("className={cn(", arrow)
  expect(cn, `${component} must merge classes with cn()`).toBeGreaterThan(-1)
  const open = src.indexOf("{", cn)
  let depth = 0
  for (let i = open; i < src.length; i++) {
    if (src[i] === "{") depth++
    else if (src[i] === "}") {
      depth--
      if (depth === 0) return src.slice(open, i)
    }
  }
  throw new Error(`unbalanced braces in ${component}`)
}

describe("BUG-007: the tab bar cannot be clipped by its own min-content width", () => {
  it("lets the tab list scroll instead of forcing the page wider", () => {
    const list = classNamesOf(tabs, "TabsList")
    expect(list).toContain("max-w-full")
    expect(list).toMatch(/overflow-x-auto/)
  })

  it("keeps every trigger at its full label width", () => {
    // If a trigger could shrink, its `whitespace-nowrap` text would overflow the
    // trigger box and be clipped even though the bar itself scrolls.
    const trigger = classNamesOf(tabs, "TabsTrigger")
    expect(trigger).toContain("whitespace-nowrap")
    expect(trigger).toContain("shrink-0")
  })

  it("lets the content column shrink below its min-content width", () => {
    // `flex-1` alone leaves `min-width: auto`, so a wide descendant pushes the
    // column out of the `overflow-hidden` row instead of scrolling inside it.
    expect(shell).toMatch(/"flex min-w-0 flex-1 flex-col overflow-hidden[^"]*"/)
    expect(shell).toMatch(/<main className="[^"]*min-w-0[^"]*"[^>]*>/)
    // ...and main is what scrolls, so the column keeps its `overflow-hidden`.
    expect(shell).toMatch(/<main className="[^"]*flex-1[^"]*"[^>]*>/)
  })
})
