import { useState, useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { CrudEntity, PaginatedResult, SortRequest, FilterRequest } from "@/types/crud"
import type { CrudService } from "@/services/crud.service"
import { useNotification } from "@/hooks/use-notification"

interface UseCrudOptions<T extends CrudEntity> {
  service: CrudService<T>
  queryKey: string
  page: number
  pageSize: number
  sort?: SortRequest
  search?: string
  filters?: FilterRequest[]
}

export function useCrud<T extends CrudEntity>({
  service,
  queryKey,
  page,
  pageSize,
  sort,
  search,
  filters,
}: UseCrudOptions<T>) {
  const queryClient = useQueryClient()
  const notification = useNotification()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<number | string | null>(null)
  const [selectedEntity, setSelectedEntity] = useState<T | null>(null)

  const paginatedQuery = useQuery<PaginatedResult<T>>({
    queryKey: [queryKey, page, pageSize, sort, search, filters],
    queryFn: () =>
      service.paginate(
        { page, pageSize },
        sort,
        filters,
        search ? { query: search } : undefined
      ),
  })

  const findByIdQuery = (id: number | string) =>
    useQuery({
      queryKey: [queryKey, "detail", id],
      queryFn: () => service.findById(id),
      enabled: !!id,
    })

  const createMutation = useMutation({
    mutationFn: (data: Partial<T>) => service.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] })
      notification.success("Creado", "El registro se creó correctamente")
    },
    onError: (error) => {
      notification.error("Error", `Error al crear: ${error}`)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: Partial<T> }) =>
      service.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] })
      notification.success("Actualizado", "El registro se actualizó correctamente")
    },
    onError: (error) => {
      notification.error("Error", `Error al actualizar: ${error}`)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number | string) => service.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] })
      notification.success("Eliminado", "El registro se eliminó correctamente")
      setDeleteDialogOpen(false)
      setSelectedId(null)
    },
    onError: (error) => {
      notification.error("Error", `Error al eliminar: ${error}`)
    },
  })

  const archiveMutation = useMutation({
    mutationFn: (id: number | string) => service.archive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] })
      notification.success("Archivado", "El registro se archivó correctamente")
    },
    onError: (error) => {
      notification.error("Error", `Error al archivar: ${error}`)
    },
  })

  const restoreMutation = useMutation({
    mutationFn: (id: number | string) => service.restore(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] })
      notification.success("Restaurado", "El registro se restauró correctamente")
    },
    onError: (error) => {
      notification.error("Error", `Error al restaurar: ${error}`)
    },
  })

  const confirmDelete = useCallback((id: number | string) => {
    setSelectedId(id)
    setDeleteDialogOpen(true)
  }, [])

  const handleDelete = useCallback(() => {
    if (selectedId !== null) {
      deleteMutation.mutate(selectedId)
    }
  }, [selectedId, deleteMutation])

  const handleArchive = useCallback((id: number | string) => {
    archiveMutation.mutate(id)
  }, [archiveMutation])

  const handleRestore = useCallback((id: number | string) => {
    restoreMutation.mutate(id)
  }, [restoreMutation])

  return {
    data: paginatedQuery.data?.data ?? [],
    total: paginatedQuery.data?.total ?? 0,
    loading: paginatedQuery.isLoading,
    error: paginatedQuery.error instanceof Error ? paginatedQuery.error.message : null,
    refetch: paginatedQuery.refetch,
    findById: findByIdQuery,
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    confirmDelete,
    handleDelete,
    handleArchive,
    handleRestore,
    deleteDialogOpen,
    setDeleteDialogOpen,
    selectedId,
    selectedEntity,
    setSelectedEntity,
    creating: createMutation.isPending,
    updating: updateMutation.isPending,
    deleting: deleteMutation.isPending,
  }
}
