import { describe, it, expect, vi, beforeEach } from "vitest"
import { useState } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { render, screen, userEvent, waitFor, within } from "@tests/helpers/render"
import { setupI18n } from "@/i18n"
import { DateField } from "@/components/forms/date-field"

/**
 * BUG-009: picking a date left the calendar on screen, and neither a further
 * click nor Enter dismissed it.
 *
 * The field was a native `<input type="date">`. Its calendar is drawn by the
 * webview rather than by the DOM, and the platform exposes `showPicker()` to
 * open it but no counterpart to close it - so no code path could have hidden
 * it. The field now owns its calendar, which makes dismissal deterministic.
 *
 * These tests drive the real component with the real i18next resources and
 * assert the popover is actually gone from the document, not merely hidden.
 *
 * The target day is derived from the current month rather than hardcoded, so
 * this does not start failing on the 1st of a new month.
 */

setupI18n()

/** Day 15 of the current month: always present, and the calendar opens on now. */
function targetDay() {
  const day = new Date()
  day.setDate(15)
  return {
    iso: format(day, "yyyy-MM-dd"),
    label: format(day, "d 'de' MMMM 'de' yyyy", { locale: es }),
  }
}

/** Located by id, not by text: the accessible name changes once a date is set. */
function trigger(): HTMLElement {
  const el = document.getElementById("expectedDeliveryDate")
  if (!el) throw new Error("the date field trigger is not in the document")
  return el
}

function Harness({ onValue }: { onValue?: (value: string) => void }) {
  const [value, setValue] = useState("")
  return (
    <DateField
      label="Entrega Esperada"
      name="expectedDeliveryDate"
      value={value}
      onChange={(event) => {
        setValue(event.target.value)
        onValue?.(event.target.value)
      }}
    />
  )
}

/**
 * A day cell, scoped to the calendar.
 *
 * Scoping is required: once a date is set the field's own trigger reads the same
 * "15 de septiembre de 2026", so an unscoped role+name query matches two
 * elements and the test fails for the wrong reason.
 */
function dayCell(label: string) {
  return within(screen.getByRole("group")).getByRole("button", { name: label })
}

const calendarClosed = () =>
  waitFor(() => {
    expect(screen.queryByRole("group")).not.toBeInTheDocument()
  })

describe("BUG-009: the date calendar must dismiss", () => {
  let user: ReturnType<typeof userEvent.setup>
  let onValue: ReturnType<typeof vi.fn>

  beforeEach(() => {
    user = userEvent.setup()
    onValue = vi.fn()
  })

  async function openCalendar() {
    await user.click(trigger())
    await screen.findByRole("group")
  }

  it("closes as soon as a date is picked", async () => {
    render(<Harness onValue={onValue} />)
    await openCalendar()

    await user.click(dayCell(targetDay().label))

    await calendarClosed()
    expect(onValue).toHaveBeenCalledWith(targetDay().iso)
  })

  it("closes when Enter is pressed with the calendar open", async () => {
    render(<Harness />)
    await openCalendar()

    await user.keyboard("{Enter}")

    await calendarClosed()
  })

  it("closes on Escape", async () => {
    render(<Harness />)
    await openCalendar()

    await user.keyboard("{Escape}")

    await calendarClosed()
  })

  it("closes on a click outside", async () => {
    render(
      <div>
        <Harness />
        <button type="button">elsewhere</button>
      </div>
    )
    await openCalendar()

    await user.click(screen.getByRole("button", { name: "elsewhere" }))

    await calendarClosed()
  })

  it("closes when the field is clicked again", async () => {
    render(<Harness />)
    await openCalendar()

    await user.click(trigger())

    await calendarClosed()
  })

  it("emits yyyy-MM-dd, the shape the API and the database expect", async () => {
    render(<Harness onValue={onValue} />)
    await openCalendar()

    await user.click(dayCell(targetDay().label))

    expect(onValue).toHaveBeenCalledWith(targetDay().iso)
    // And it stays in the DOM under its own name, for native form posts.
    const hidden = document.querySelector<HTMLInputElement>('input[name="expectedDeliveryDate"]')
    expect(hidden).not.toBeNull()
    expect(hidden?.value).toBe(targetDay().iso)
  })

  it("shows the chosen date on the field and keeps it across a reopen", async () => {
    render(<Harness />)
    await openCalendar()
    await user.click(dayCell(targetDay().label))
    await calendarClosed()

    expect(trigger()).toHaveTextContent(targetDay().label)

    await openCalendar()
    expect(dayCell(targetDay().label)).toHaveAttribute(
      "aria-pressed",
      "true"
    )
  })

  it("can clear a date that was already set", async () => {
    render(<Harness onValue={onValue} />)
    await openCalendar()
    await user.click(dayCell(targetDay().label))
    await calendarClosed()

    await openCalendar()
    await user.click(screen.getByRole("button", { name: /quitar fecha/i }))

    expect(onValue).toHaveBeenLastCalledWith("")
    await calendarClosed()
  })

  it("navigates months without losing the selection", async () => {
    render(<Harness onValue={onValue} />)
    await openCalendar()
    await user.click(screen.getByRole("button", { name: /mes siguiente/i }))

    // The next month is rendered and the field still reads what was chosen.
    expect(screen.getByRole("group")).toBeInTheDocument()
    expect(trigger()).toHaveTextContent(/seleccionar fecha/i)

    // The popover stayed open across the month change, so navigate back without
    // re-opening it - a second click on the field would toggle it shut.
    await user.click(screen.getByRole("button", { name: /mes anterior/i }))
    await user.click(dayCell(targetDay().label))
    await calendarClosed()

    expect(onValue).toHaveBeenLastCalledWith(targetDay().iso)
  })
})
