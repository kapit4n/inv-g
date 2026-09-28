import { describe, it, expect, vi, beforeEach } from "vitest"

/**
 * Runtime contract for every IPC wrapper in `src/lib/tauri.ts`.
 *
 * ## Why this file exists
 *
 * `src/lib/tauri.ts` is 334 one-line `invoke()` wrappers — one per Rust
 * command — and it held 11% of the functions in this project at 0% coverage.
 * That was not an accident of the test suite: every other test in the repo
 * mocks `@/lib/tauri` wholesale, so the wrappers are never executed. The one
 * module every test deliberately replaces is the one module no test runs.
 *
 * That blind spot already cost us three production bugs (BUG-012). A wrapper
 * whose argument names had drifted from the Rust signature still satisfied
 * every component test, because the mock agreed with whatever the wrapper
 * happened to send. The failure only appeared when Tauri rejected the call
 * against a real signature.
 *
 * `tauri-command-argument-contract.test.ts` covers the *argument names* by
 * parsing both sides as text. This file covers the *runtime behaviour* that a
 * text comparison cannot see: that each wrapper issues exactly one command,
 * names it correctly, forwards only the arguments it was given, returns the
 * command result untouched, and does not swallow a rejection. A wrapper that
 * wrapped its `invoke` in a `try/catch` returning `null` would pass the static
 * check and fail here.
 */

const invokeMock = vi.hoisted(() => vi.fn())
vi.mock("@tauri-apps/api/core", () => ({ invoke: invokeMock }))

/**
 * `tests/helpers/setup.ts` registers a global `vi.mock("@/lib/tauri")` for the
 * whole suite, which is what every other test wants and what keeps the real
 * module at 0% coverage: the suite replaces the module under test before the
 * test file is even collected. `importActual` is the only way to get the real
 * wrappers here, and it is the reason this file has to exist in this form.
 */
const tauri = await vi.importActual<typeof import("@/lib/tauri")>("@/lib/tauri")

/**
 * Wrappers whose Rust command name is not the snake_case of the TS name.
 * Every one of these was checked against the Rust handler; keep this list
 * short and justify each entry. A new entry here is a review event.
 */
const COMMAND_NAME_EXCEPTIONS: Record<string, string> = {
  // Rust: commands/compatibility.rs::delete_compatibility
  deleteProductCompatibility: "delete_compatibility",
}

const RETURN_SENTINEL = { __sentinel: "resolved" }
const REJECTION = new Error("command failed")

function toSnakeCase(name: string): string {
  return name.replace(/(?<!^)(?=[A-Z])/g, "_").toLowerCase()
}

/**
 * Arguments are sent as self-returning proxies. The leaf walk below only
 * descends into plain objects and arrays, so a proxy is always terminal and
 * keeps its reference identity — which is what makes the provenance check
 * exact.
 *
 * The proxy is required rather than a plain object for two reasons: a plain
 * object gets recursed into (unwrapping it to its own values), and a class
 * instance or plain object loses its identity when a wrapper *spreads* it
 * (`{ id, ...params }` copies own properties, so the sentinel would arrive as
 * its parts). Reporting no own keys makes a spread contribute nothing while
 * property access still yields the sentinel itself.
 */
function createSentinel(_index: number): unknown {
  const ref: { current?: unknown } = {}
  // Arrow function, not `function`: a function target carries non-configurable
  // own keys (`prototype`, `name`) that a proxy's `ownKeys` trap is obliged to
  // report, which would defeat the spread behaviour described above.
  const target = () => {}
  ref.current = new Proxy(target, {
    get: (_target, property) => {
      // Keep the sentinel out of thenable, coercion and inspection protocols.
      // Returning the proxy for `then` would make it awaitable and hang the
      // test; returning it for `toString`/`toStringTag` would send the test
      // reporter's printer into infinite recursion.
      if (
        property === "then" ||
        property === "toString" ||
        property === "valueOf" ||
        property === "constructor" ||
        property === Symbol.toPrimitive ||
        property === Symbol.toStringTag
      ) {
        return undefined
      }
      return ref.current
    },
    has: () => true,
    ownKeys: () => [],
    getOwnPropertyDescriptor: () => undefined,
  })
  return ref.current
}

function isPlainContainer(value: unknown): value is Record<string, unknown> | unknown[] {
  if (value === null || typeof value !== "object") return false
  if (Array.isArray(value)) return true
  return Object.getPrototypeOf(value) === Object.prototype
}

const wrappers = Object.entries(tauri).filter(
  (entry): entry is [string, (...args: unknown[]) => Promise<unknown>] => typeof entry[1] === "function",
)

describe("src/lib/tauri.ts IPC contract", () => {
  it("exposes only wrapper functions", () => {
    const nonFunctions = Object.entries(tauri).filter(([, value]) => typeof value !== "function")
    expect(nonFunctions).toEqual([])
    expect(wrappers.length).toBe(338)
  })

  it("derives every command name mechanically, except reviewed exceptions", () => {
    // Guards the exception list itself: if a wrapper is renamed, the expected
    // command changes with it and the list must be revisited rather than
    // silently growing.
    for (const name of Object.keys(COMMAND_NAME_EXCEPTIONS)) {
      expect(tauri).toHaveProperty(name)
    }
  })

  beforeEach(() => {
    invokeMock.mockReset()
  })

  describe.each(wrappers)("%s", (name, wrapper) => {
    const expectedCommand = COMMAND_NAME_EXCEPTIONS[name] ?? toSnakeCase(name)
    // Self-returning proxy sentinels keep reference identity through both
    // nesting and spreading, so the check below stays exact.
    const sent = Array.from({ length: wrapper.length }, (_, i) => createSentinel(i))

    it("issues exactly one correctly named command", async () => {
      invokeMock.mockResolvedValue(RETURN_SENTINEL)

      const result = await wrapper(...sent)

      expect(invokeMock).toHaveBeenCalledTimes(1)
      const [command, payload] = invokeMock.mock.calls[0] as [string, unknown]

      // Tauri matches the command against the Rust `invoke_handler` list, so a
      // camelCase or otherwise malformed name fails at runtime, not compile time.
      expect(command).toMatch(/^[a-z][a-z0-9_]*$/)
      expect(command).toBe(expectedCommand)

      if (sent.length === 0) {
        expect(payload).toBeUndefined()
      } else if (isPlainContainer(payload)) {
        // Tauri serialises the payload into a serde struct on the Rust side, so
        // every key must be a plain identifier. A key that is not would be
        // rejected at the boundary.
        for (const key of Object.keys(payload)) {
          expect(key).toMatch(/^[A-Za-z_$][\w$]*$/)
        }
      } else {
        // Otherwise the wrapper forwarded a parameter as-is (`params || {}`).
        // Anything invented here would be data the caller never supplied.
        // Compared as a boolean so a failure does not try to serialise a proxy.
        expect(sent.includes(payload as never)).toBe(true)
      }

      // The wrapper must be a pass-through, not a re-interpretation of the result.
      expect(result).toBe(RETURN_SENTINEL)
    })

    it("propagates a rejected command instead of swallowing it", async () => {
      invokeMock.mockRejectedValue(REJECTION)

      await expect(wrapper(...sent)).rejects.toThrow("command failed")
    })
  })
})
