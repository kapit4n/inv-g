import { describe, it, expect } from "vitest"
import { render, screen, fireEvent } from "@tests/helpers/render"
import { EmptyState } from "@/components/empty-state"

describe("EmptyState", () => {
  it("renders title and description", () => {
    render(<EmptyState title="No data" description="No records found" />)
    expect(screen.getByText("No data")).toBeDefined()
    expect(screen.getByText("No records found")).toBeDefined()
  })

  it("renders action button when actionLabel and onAction provided", () => {
    render(<EmptyState title="Empty" description="No items" actionLabel="Create" onAction={() => {}} />)
    expect(screen.getByText("Create")).toBeDefined()
  })

  it("calls onAction when clicked", () => {
    let clicked = false
    render(<EmptyState title="Empty" description="No items" actionLabel="Go" onAction={() => { clicked = true }} />)
    fireEvent.click(screen.getByText("Go"))
    expect(clicked).toBe(true)
  })
})
