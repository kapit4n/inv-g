import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { resolveRouteNameKey } from "@/config/navigation"

/**
 * BUG-010: the page header of some pages was reported as hidden underneath the
 * top bar, and the top bar labelled them "Panel de Control".
 *
 * Two independent defects, one report.
 *
 * 1. `main` is the scroll container of the content column and its only child
 *    carried `h-full`, i.e. `height: 100%`. A percentage height resolves
 *    against the containing block, and a flex item's height is itself resolved
 *    from the free space of the column, so the child's height can end up
 *    computed against a different box than the one `main` actually scrolls.
 *    When the child is the taller of the two, `main` acquires scrollable
 *    overflow out of nothing on a page whose content is only a few hundred
 *    pixels tall. A short page then reports a non-zero `scrollTop`, and
 *    because `overflow` clips at the padding edge the first line box of the
 *    page - the `h1` - is cut in half by the top of `main`.
 *
 *    The screenshot is that state exactly: `main` 45px shorter than its
 *    scrollHeight, `h1` at 80-45 = 35 relative to the viewport instead of 80,
 *    every following element shifted up by the same 45px, and the description,
 *    the action button and the table all intact below the clipped title.
 *
 *    `min-h-full` cannot exceed the container, so a page shorter than `main`
 *    can never produce scrollable overflow, and `min-h-0` lets the flex item
 *    shrink below its content so `main` is the only box that scrolls.
 *
 * 2. The top bar resolved its title from a hand-written map of thirteen routes
 *    and fell back to `dashboard.title` for anything missing.
 *    `/inventory/manufacturers` was missing, so the page announced itself as
 *    "Panel de Control" - the label the user described the header as being
 *    hidden underneath.
 *
 * The layout part is asserted against the source, because jsdom performs no
 * layout. The title part is a pure function and is asserted directly.
 */

function source(...parts: string[]): string {
  return readFileSync(join(process.cwd(), ...parts), "utf8")
}

const shell = source("src", "layouts", "app-shell.tsx")

describe("BUG-010 page header clipped by the top of main", () => {
  it("does not give the scroll container a percentage-height child", () => {
    const main = shell.slice(shell.indexOf("<main"), shell.indexOf("</main>"))
    expect(main, "app-shell must still render a <main>").not.toBe("")

    // `h-full` is `height: 100%`: the coupling that let the child become
    // taller than the box it lives in.
    expect(main).not.toMatch(/(^|["\s])h-full(["\s])/)
    expect(main).toMatch(/min-h-full/)
  })

  it("lets main shrink below its content so it is the only scroll container", () => {
    const main = shell.slice(shell.indexOf("<main"), shell.indexOf("</main>"))
    expect(main).toMatch(/min-h-0/)
    expect(main).toMatch(/overflow-y-auto/)
    expect(main).toMatch(/flex-1/)
  })

  it("keeps the page padding and the outlet", () => {
    const main = shell.slice(shell.indexOf("<main"), shell.indexOf("</main>"))
    expect(main).toMatch(/p-6/)
    expect(main).toMatch(/<Outlet \/>/)
  })
})

describe("BUG-010 top bar title", () => {
  it("titles a nested inventory page instead of the dashboard", () => {
    expect(resolveRouteNameKey("/inventory/manufacturers")).toBe("inventory.manufacturers")
    expect(resolveRouteNameKey("/inventory/manufacturers/7/edit")).toBe("inventory.manufacturers")
    expect(resolveRouteNameKey("/inventory/manufacturers/new")).toBe("inventory.manufacturers")
  })

  it("prefers the most specific nav entry", () => {
    expect(resolveRouteNameKey("/inventory")).toBe("inventory.title")
    expect(resolveRouteNameKey("/inventory/products/12")).toBe("inventory.products")
    expect(resolveRouteNameKey("/sales/quotes/3")).toBe("sales.quotes")
  })

  it("keeps working for the routes the old map covered", () => {
    expect(resolveRouteNameKey("/dashboard")).toBe("dashboard.title")
    expect(resolveRouteNameKey("/purchases/orders")).toBe("purchases.orders")
    expect(resolveRouteNameKey("/settings")).toBe("settings.title")
    expect(resolveRouteNameKey("/help")).toBe("help.title")
    expect(resolveRouteNameKey("/warehouse")).toBe("warehouse.title")
  })

  it("ignores trailing slashes and does not match a sibling by prefix", () => {
    expect(resolveRouteNameKey("/inventory/manufacturers/")).toBe("inventory.manufacturers")
    // `/inventory/warehouses-legacy` must not resolve through `/inventory/warehouses`.
    expect(resolveRouteNameKey("/inventory/manufacturers-archive")).toBe("inventory.title")
  })

  it("returns null for a route with no nav entry so the caller can fall back by section", () => {
    expect(resolveRouteNameKey("/")).toBeNull()
    expect(resolveRouteNameKey("/not-a-section")).toBeNull()
  })

  it("no longer carries the hand-written route map", () => {
    const topBar = source("src", "layouts", "top-bar.tsx")
    expect(topBar).not.toContain("routeNameKeys")
    expect(topBar).toContain("resolveRouteNameKey")
  })
})
