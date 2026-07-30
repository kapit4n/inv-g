import { describe, it, expect } from "vitest"
import { render, screen } from "@tests/helpers/render"
import { StatCard } from "@/components/stat-card"

describe("StatCard", () => {
  it("renders title and value", () => {
    render(<StatCard title="Revenue" value="$1,000" icon={<div data-testid="icon" />} />)
    expect(screen.getByText("Revenue")).toBeDefined()
    expect(screen.getByText("$1,000")).toBeDefined()
  })

  it("renders description when provided", () => {
    render(<StatCard title="Sales" value="50" description="vs last month" icon={<div />} />)
    expect(screen.getByText("vs last month")).toBeDefined()
  })

  it("renders icon", () => {
    render(<StatCard title="Test" value="1" icon={<div data-testid="custom-icon" />} />)
    expect(screen.getByTestId("custom-icon")).toBeDefined()
  })

  it("renders trend value when provided", () => {
    render(<StatCard title="Test" value="1" icon={<div />} trend="up" trendValue="15%" />)
    expect(screen.getByText("15%")).toBeDefined()
  })

  it("renders trend down indicator", () => {
    render(<StatCard title="Test" value="1" icon={<div />} trend="down" trendValue="5%" />)
    expect(screen.getByText("5%")).toBeDefined()
  })

  it("renders without error with custom className", () => {
    render(<StatCard title="Test" value="1" icon={<div />} className="custom-class" />)
    expect(screen.getByText("Test")).toBeDefined()
  })
})
