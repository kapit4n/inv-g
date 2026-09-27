import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, waitFor, act } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import { useCrud } from "@/hooks/use-crud"
import type { CrudService } from "@/services/crud.service"
import type { CrudEntity } from "@/types/crud"

/**
 * `useCrud` is the shared engine behind every list screen in the app: it wires
 * a paginated query to a service and adds the create/update/delete/archive
 * mutations plus the delete-confirmation state machine.
 *
 * Two things are worth pinning down here, because a mistake in either is
 * invisible on screen until real data is at stake:
 *
 * 1. Every mutation must invalidate the list query, or the screen keeps
 *    showing pre-save state and the shopkeeper believes a save failed.
 * 2. A successful delete must clear the confirmation state. If it does not, the
 *    dialog reopens on the next click with a stale id, and the next delete
 *    removes a different row than the one on screen.
 */

interface Widget extends CrudEntity {
  name: string
}

const notify = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }

vi.mock("@/hooks/use-notification", () => ({
  useNotification: () => ({
    notifications: [],
    unreadCount: 0,
    success: notify.success,
    error: notify.error,
    warning: notify.warning,
    info: notify.info,
    remove: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    clearAll: vi.fn(),
  }),
}))

function makeService(over: Partial<Record<keyof CrudService<Widget>, unknown>> = {}) {
  return {
    paginate: vi.fn().mockResolvedValue({ data: [], total: 0 }),
    findById: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue({ id: 1, name: "new" }),
    update: vi.fn().mockResolvedValue({ id: 1, name: "updated" }),
    delete: vi.fn().mockResolvedValue(undefined),
    archive: vi.fn().mockResolvedValue(undefined),
    restore: vi.fn().mockResolvedValue(undefined),
    ...over,
  } as unknown as CrudService<Widget> & Record<string, ReturnType<typeof vi.fn>>
}

function wrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}

function renderCrud(
  service: ReturnType<typeof makeService>,
  options: Partial<Parameters<typeof useCrud<Widget>>[0]> = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  const invalidate = vi.spyOn(queryClient, "invalidateQueries")

  const view = renderHook(
    (props: Partial<Parameters<typeof useCrud<Widget>>[0]>) =>
      useCrud<Widget>({
        service,
        queryKey: "widgets",
        page: 1,
        pageSize: 20,
        ...props,
      }),
    { wrapper: wrapper(queryClient), initialProps: options },
  )

  return { ...view, queryClient, invalidate }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("useCrud: loading the list", () => {
  it("starts empty and loading, then exposes the page of records", async () => {
    const service = makeService({
      paginate: vi.fn().mockResolvedValue({
        data: [
          { id: 1, name: "Brake Pad" },
          { id: 2, name: "Oil Filter" },
        ],
        total: 2,
      }),
    })
    const { result } = renderCrud(service)

    expect(result.current.loading).toBe(true)
    expect(result.current.data).toEqual([])
    expect(result.current.total).toBe(0)

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toHaveLength(2)
    expect(result.current.total).toBe(2)
  })

  it("passes pagination, sort, filters and a wrapped search to the service", async () => {
    const service = makeService()
    renderCrud(service, {
      page: 3,
      pageSize: 50,
      sort: { field: "name", direction: "asc" },
      filters: [{ field: "name", operator: "contains", value: "pad" }],
      search: "brake",
    })

    await waitFor(() => expect(service.paginate).toHaveBeenCalled())
    expect(service.paginate).toHaveBeenCalledWith(
      { page: 3, pageSize: 50 },
      { field: "name", direction: "asc" },
      [{ field: "name", operator: "contains", value: "pad" }],
      { query: "brake" },
    )
  })

  it("omits the search argument entirely when there is no search term", async () => {
    // An empty-string search must not become `{ query: "" }`, which a backend
    // would treat as a filter for rows containing nothing.
    const service = makeService()
    renderCrud(service, { search: "" })

    await waitFor(() => expect(service.paginate).toHaveBeenCalled())
    expect(service.paginate).toHaveBeenCalledWith({ page: 1, pageSize: 20 }, undefined, undefined, undefined)
  })

  it("surfaces a failed load as a message and keeps the list empty", async () => {
    const service = makeService({ paginate: vi.fn().mockRejectedValue(new Error("Database is locked")) })
    const { result } = renderCrud(service)

    await waitFor(() => expect(result.current.error).toBe("Database is locked"))
    expect(result.current.data).toEqual([])
    expect(result.current.loading).toBe(false)
  })

  it("reports no error for a non-Error rejection", async () => {
    const service = makeService({ paginate: vi.fn().mockRejectedValue("plain string") })
    const { result } = renderCrud(service)

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBeNull()
  })
})

describe("useCrud: mutations", () => {
  it("creates through the service, refreshes the list and confirms to the user", async () => {
    const service = makeService()
    const { result, invalidate } = renderCrud(service)
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.create({ name: "Gasket" })
    })

    expect(service.create).toHaveBeenCalledWith({ name: "Gasket" })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["widgets"] })
    expect(notify.success).toHaveBeenCalledWith("Creado", "El registro se creó correctamente")
  })

  it("updates through the service with the id and the changed fields", async () => {
    const service = makeService()
    const { result, invalidate } = renderCrud(service)
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.update({ id: 7, data: { name: "Renamed" } })
    })

    expect(service.update).toHaveBeenCalledWith(7, { name: "Renamed" })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["widgets"] })
    expect(notify.success).toHaveBeenCalledWith("Actualizado", "El registro se actualizó correctamente")
  })

  it("reports a failed save and does not claim success", async () => {
    const service = makeService({ create: vi.fn().mockRejectedValue(new Error("UNIQUE constraint failed")) })
    const { result } = renderCrud(service)
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.create({ name: "Dupe" }).catch(() => undefined)
    })

    expect(notify.error).toHaveBeenCalledWith("Error", expect.stringContaining("UNIQUE constraint failed"))
    expect(notify.success).not.toHaveBeenCalled()
  })

  it("archives and restores by id", async () => {
    const service = makeService()
    const { result } = renderCrud(service)
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      result.current.handleArchive(4)
    })
    await waitFor(() => expect(service.archive).toHaveBeenCalledWith(4))
    expect(notify.success).toHaveBeenCalledWith("Archivado", "El registro se archivó correctamente")

    await act(async () => {
      result.current.handleRestore(4)
    })
    await waitFor(() => expect(service.restore).toHaveBeenCalledWith(4))
    expect(notify.success).toHaveBeenCalledWith("Restaurado", "El registro se restauró correctamente")
  })
})

describe("useCrud: delete confirmation", () => {
  it("opens the dialog against the id it was given", async () => {
    const service = makeService()
    const { result } = renderCrud(service)
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.deleteDialogOpen).toBe(false)
    expect(result.current.selectedId).toBeNull()

    act(() => {
      result.current.confirmDelete(42)
    })

    expect(result.current.deleteDialogOpen).toBe(true)
    expect(result.current.selectedId).toBe(42)
    expect(service.delete).not.toHaveBeenCalled()
  })

  it("deletes the selected record only once the user confirms", async () => {
    const service = makeService()
    const { result } = renderCrud(service)
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => {
      result.current.confirmDelete(42)
    })
    await act(async () => {
      await result.current.handleDelete()
    })

    await waitFor(() => expect(service.delete).toHaveBeenCalledWith(42))
  })

  it("closes the dialog and forgets the selection after a successful delete", async () => {
    // Leaving `selectedId` set would let a later confirm-less delete hit the
    // previous row.
    const service = makeService()
    const { result } = renderCrud(service)
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => {
      result.current.confirmDelete(42)
    })
    await act(async () => {
      await result.current.handleDelete()
    })

    await waitFor(() => expect(result.current.deleteDialogOpen).toBe(false))
    expect(result.current.selectedId).toBeNull()
  })

  it("keeps the dialog open when the delete fails, so the user can retry", async () => {
    const service = makeService({ delete: vi.fn().mockRejectedValue(new Error("still referenced")) })
    const { result } = renderCrud(service)
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => {
      result.current.confirmDelete(42)
    })
    // `handleDelete` fires the mutation without awaiting it, so the rejection
    // surfaces through the notification rather than through a return value.
    await act(async () => {
      result.current.handleDelete()
    })

    await waitFor(() => expect(notify.error).toHaveBeenCalled())
    expect(result.current.deleteDialogOpen).toBe(true)
    expect(result.current.selectedId).toBe(42)
  })

  it("does nothing when delete is confirmed with no record selected", async () => {
    const service = makeService()
    const { result } = renderCrud(service)
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.handleDelete()
    })

    expect(service.delete).not.toHaveBeenCalled()
  })

  it("can be dismissed without deleting", async () => {
    const service = makeService()
    const { result } = renderCrud(service)
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => {
      result.current.confirmDelete(42)
    })
    act(() => {
      result.current.setDeleteDialogOpen(false)
    })

    expect(result.current.deleteDialogOpen).toBe(false)
    expect(service.delete).not.toHaveBeenCalled()
  })
})

describe("useCrud: detail and selection state", () => {
  it("fetches a single record by id", async () => {
    const service = makeService({ findById: vi.fn().mockResolvedValue({ id: 9, name: "Caliper" }) })
    const { result } = renderCrud(service)
    await waitFor(() => expect(result.current.loading).toBe(false))

    const detail = renderHook(() => result.current.findById(9), {
      wrapper: wrapper(new QueryClient({ defaultOptions: { queries: { retry: false } } })),
    })

    await waitFor(() => expect(detail.result.current.data).toEqual({ id: 9, name: "Caliper" }))
    expect(service.findById).toHaveBeenCalledWith(9)
  })

  it("holds the entity a row was selected into, for a side panel or dialog", async () => {
    const service = makeService()
    const { result } = renderCrud(service)
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.selectedEntity).toBeNull()
    act(() => {
      result.current.setSelectedEntity({ id: 3, name: "Rotor" })
    })
    expect(result.current.selectedEntity).toEqual({ id: 3, name: "Rotor" })
  })
})
