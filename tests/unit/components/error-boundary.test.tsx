import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@tests/helpers/render"
import { ErrorBoundary } from "@/components/error-boundary"

const ThrowError = () => { throw new Error("test error") }

describe("ErrorBoundary", () => {
  it("renders children when no error", () => {
    render(<ErrorBoundary><div>ok</div></ErrorBoundary>)
    expect(screen.getByText("ok")).toBeDefined()
  })

  it("renders fallback on error", () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    render(<ErrorBoundary><ThrowError /></ErrorBoundary>)
    expect(screen.getByText("Algo salió mal")).toBeDefined()
    expect(screen.getByText("Reintentar")).toBeDefined()
    vi.restoreAllMocks()
  })

  it("renders custom fallback when provided", () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    render(<ErrorBoundary fallback={<div>Custom error UI</div>}><ThrowError /></ErrorBoundary>)
    expect(screen.getByText("Custom error UI")).toBeDefined()
    vi.restoreAllMocks()
  })
})
