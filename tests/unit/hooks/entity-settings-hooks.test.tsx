import { describe, it, expect, vi } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"
import { useEntity } from "@/hooks/use-entity"
import { useSettings, useSetting, useTheme } from "@/hooks/use-settings"
import { getSettings, updateSetting } from "@/lib/tauri"
import type { CrudEntity } from "@/types/crud"

/**
 * `useEntity` owns a form's dirty state and its save/delete lifecycle. The
 * behaviour that matters is what happens around a *failing* save: the form must
 * stay dirty so the shopkeeper's unsaved edits are not silently discarded, and
 * the in-flight flag must always come back down.
 */

interface Part extends CrudEntity {
  sku: string
  name: string
  price: number
}

const existing: Part = { id: 7, sku: "BRK-001", name: "Brake Pad Set", price: 45.5 }

describe("useEntity: form state", () => {
  it("starts empty when there is no initial record", () => {
    const { result } = renderHook(() => useEntity<Part>())
    expect(result.current.formData).toEqual({})
    expect(result.current.dirty).toBe(false)
  })

  it("seeds the form from an initial record without marking it dirty", () => {
    // A freshly opened edit form is not dirty; otherwise every form would warn
    // about unsaved changes the moment it opened.
    const { result } = renderHook(() => useEntity<Part>({ initialData: existing }))
    expect(result.current.formData).toEqual(existing)
    expect(result.current.dirty).toBe(false)
  })

  it("merges a single field and marks the form dirty", () => {
    const { result } = renderHook(() => useEntity<Part>({ initialData: existing }))

    act(() => {
      result.current.setField("price", 49.99)
    })

    expect(result.current.formData).toEqual({ ...existing, price: 49.99 })
    expect(result.current.dirty).toBe(true)
  })

  it("merges several fields at once", () => {
    const { result } = renderHook(() => useEntity<Part>({ initialData: existing }))

    act(() => {
      result.current.setFields({ name: "Ceramic Pads", sku: "BRK-002" })
    })

    expect(result.current.formData).toMatchObject({ name: "Ceramic Pads", sku: "BRK-002", price: 45.5 })
    expect(result.current.dirty).toBe(true)
  })

  it("restores the initial record and clears the dirty flag on reset", () => {
    const { result } = renderHook(() => useEntity<Part>({ initialData: existing }))

    act(() => {
      result.current.setField("name", "Typo")
    })
    act(() => {
      result.current.reset()
    })

    expect(result.current.formData).toEqual(existing)
    expect(result.current.dirty).toBe(false)
  })

  it("resets to an empty form when the record is new", () => {
    const { result } = renderHook(() => useEntity<Part>())
    act(() => {
      result.current.setField("sku", "TMP")
    })
    act(() => {
      result.current.reset()
    })
    expect(result.current.formData).toEqual({})
  })
})

describe("useEntity: saving", () => {
  it("saves the current form and clears the dirty flag", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => useEntity<Part>({ initialData: existing, onSave }))

    act(() => {
      result.current.setField("price", 49.99)
    })
    await act(async () => {
      await result.current.save()
    })

    expect(onSave).toHaveBeenCalledWith({ ...existing, price: 49.99 })
    await waitFor(() => expect(result.current.dirty).toBe(false))
    expect(result.current.saving).toBe(false)
  })

  it("raises the saving flag while the write is in flight", async () => {
    let release: () => void = () => {}
    const onSave = vi.fn().mockImplementation(() => new Promise<void>((resolve) => { release = resolve }))
    const { result } = renderHook(() => useEntity<Part>({ initialData: existing, onSave }))

    let pending: Promise<void> | undefined
    act(() => {
      pending = result.current.save()
    })
    await waitFor(() => expect(result.current.saving).toBe(true))

    await act(async () => {
      release()
      await pending
    })
    expect(result.current.saving).toBe(false)
  })

  it("keeps the form dirty when the save fails, so the edits are not lost", async () => {
    // The important assertion in this file: a failed save must not look like a
    // successful one, or the shopkeeper navigates away believing it persisted.
    const onSave = vi.fn().mockRejectedValue(new Error("disk full"))
    const { result } = renderHook(() => useEntity<Part>({ initialData: existing, onSave }))

    act(() => {
      result.current.setField("price", 49.99)
    })
    await act(async () => {
      await result.current.save().catch(() => undefined)
    })

    await waitFor(() => expect(result.current.saving).toBe(false))
    expect(result.current.dirty).toBe(true)
    expect(result.current.formData.price).toBe(49.99)
  })

  it("does nothing when no save handler was supplied", async () => {
    const { result } = renderHook(() => useEntity<Part>({ initialData: existing }))

    act(() => {
      result.current.setField("price", 1)
    })
    await act(async () => {
      await result.current.save()
    })

    // No handler means the form is not wired for persistence; the dirty flag
    // must survive rather than be cleared by a no-op.
    expect(result.current.dirty).toBe(true)
  })
})

describe("useEntity: deleting", () => {
  it("deletes by the record's id", async () => {
    const onDelete = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => useEntity<Part>({ initialData: existing, onDelete }))

    await act(async () => {
      await result.current.delete()
    })

    expect(onDelete).toHaveBeenCalledWith(7)
    expect(result.current.deleting).toBe(false)
  })

  it("raises the deleting flag while the delete is in flight", async () => {
    let release: () => void = () => {}
    const onDelete = vi.fn().mockImplementation(() => new Promise<void>((resolve) => { release = resolve }))
    const { result } = renderHook(() => useEntity<Part>({ initialData: existing, onDelete }))

    let pending: Promise<void> | undefined
    act(() => {
      pending = result.current.delete()
    })
    await waitFor(() => expect(result.current.deleting).toBe(true))

    await act(async () => {
      release()
      await pending
    })
    expect(result.current.deleting).toBe(false)
  })

  it("does not delete a record that has never been saved", async () => {
    // A new form has no id; calling delete on it would hit the backend with
    // `undefined`.
    const onDelete = vi.fn()
    const { result } = renderHook(() => useEntity<Part>({ onDelete }))

    act(() => {
      result.current.setField("sku", "NEW-001")
    })
    await act(async () => {
      await result.current.delete()
    })

    expect(onDelete).not.toHaveBeenCalled()
    expect(result.current.deleting).toBe(false)
  })

  it("does nothing when no delete handler was supplied", async () => {
    const { result } = renderHook(() => useEntity<Part>({ initialData: existing }))

    await act(async () => {
      await result.current.delete()
    })
    expect(result.current.deleting).toBe(false)
  })

  it("lowers the deleting flag even when the delete fails", async () => {
    const onDelete = vi.fn().mockRejectedValue(new Error("referenced by a sale"))
    const { result } = renderHook(() => useEntity<Part>({ initialData: existing, onDelete }))

    await act(async () => {
      await result.current.delete().catch(() => undefined)
    })
    expect(result.current.deleting).toBe(false)
  })
})

describe("useSettings (currently unused by the app)", () => {
  // The app reads and writes settings through the Zustand stores
  // (`useSettingsStore`, `useAppSettingsStore`). Nothing imports these three
  // hooks. They are exercised here so the module is not an untested blind spot
  // if it is ever adopted — and so the limitations below are on the record.

  const rows = [
    { id: 1, key: "theme", value: "dark", category: "general" },
    { id: 2, key: "currency", value: "USD", category: "general" },
  ]

  it("loads the settings on mount and reports loading", async () => {
    vi.mocked(getSettings).mockResolvedValueOnce(rows as never)

    const { result } = renderHook(() => useSettings())
    expect(result.current.loading).toBe(true)

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.settings).toHaveLength(2)
  })

  it("still leaves loading when the load fails", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {})
    vi.mocked(getSettings).mockRejectedValueOnce(new Error("locked"))

    const { result } = renderHook(() => useSettings())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.settings).toEqual([])
    error.mockRestore()
  })

  it("reads a value by key and returns undefined for an unknown one", async () => {
    vi.mocked(getSettings).mockResolvedValueOnce(rows as never)
    const { result } = renderHook(() => useSettings())
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.getValue("theme")).toBe("dark")
    expect(result.current.getValue("missing")).toBeUndefined()
  })

  it("persists a change and mirrors it into local state", async () => {
    vi.mocked(getSettings).mockResolvedValueOnce(rows as never)
    const { result } = renderHook(() => useSettings())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.updateValue("theme", "light")
    })

    expect(updateSetting).toHaveBeenCalledWith("theme", "light")
    expect(result.current.getValue("theme")).toBe("light")
    expect(result.current.getValue("currency")).toBe("USD")
  })

  it("does not add a key that was absent from the loaded list", async () => {
    // Documented limitation: `updateValue` maps over the existing rows, so a
    // setting first written through this hook never appears locally and reads
    // back as undefined until a reload. The same upsert gap was fixed in the
    // settings store; this hook still has it.
    vi.mocked(getSettings).mockResolvedValueOnce(rows as never)
    const { result } = renderHook(() => useSettings())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.updateValue("brand-new", "1")
    })

    expect(updateSetting).toHaveBeenCalledWith("brand-new", "1")
    expect(result.current.getValue("brand-new")).toBeUndefined()
  })
})

describe("useSetting / useTheme", () => {
  it("narrows the full settings list to a single key", async () => {
    vi.mocked(getSettings).mockResolvedValueOnce([
      { id: 1, key: "theme", value: "dark", category: "general" },
    ] as never)

    const { result } = renderHook(() => useSetting("theme"))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.value).toBe("dark")
  })

  it("reports an undefined value for a key that is not set", async () => {
    vi.mocked(getSettings).mockResolvedValueOnce([] as never)
    const { result } = renderHook(() => useSetting("absent"))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.value).toBeUndefined()
  })

  it("falls back to the system theme when none is stored", async () => {
    vi.mocked(getSettings).mockResolvedValueOnce([] as never)
    const { result } = renderHook(() => useTheme())
    await waitFor(() => expect(result.current.theme).toBe("system"))
  })

  it("writes the chosen theme through to the backend", async () => {
    vi.mocked(getSettings).mockResolvedValueOnce([
      { id: 1, key: "theme", value: "system", category: "general" },
    ] as never)

    const { result } = renderHook(() => useTheme())
    await waitFor(() => expect(result.current.theme).toBe("system"))

    await act(async () => {
      await result.current.setTheme("dark")
    })
    expect(updateSetting).toHaveBeenCalledWith("theme", "dark")
  })
})
