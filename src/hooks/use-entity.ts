import { useState, useCallback } from "react"
import type { CrudEntity } from "@/types/crud"

interface UseEntityOptions<T extends CrudEntity> {
  initialData?: T
  onSave?: (data: Partial<T>) => Promise<void>
  onDelete?: (id: number | string) => Promise<void>
}

export function useEntity<T extends CrudEntity>(options: UseEntityOptions<T> = {}) {
  const { initialData, onSave, onDelete } = options
  const [formData, setFormData] = useState<Partial<T>>(initialData ?? {})
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const setField = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setDirty(true)
  }, [])

  const setFields = useCallback((data: Partial<T>) => {
    setFormData((prev) => ({ ...prev, ...data }))
    setDirty(true)
  }, [])

  const reset = useCallback(() => {
    setFormData(initialData ?? {})
    setDirty(false)
  }, [initialData])

  const save = useCallback(async () => {
    if (!onSave) return
    setSaving(true)
    try {
      await onSave(formData)
      setDirty(false)
    } finally {
      setSaving(false)
    }
  }, [onSave, formData])

  const deleteEntity = useCallback(async () => {
    if (!onDelete || !formData.id) return
    setDeleting(true)
    try {
      await onDelete(formData.id)
    } finally {
      setDeleting(false)
    }
  }, [onDelete, formData.id])

  return {
    formData,
    setField,
    setFields,
    reset,
    save,
    delete: deleteEntity,
    dirty,
    saving,
    deleting,
  }
}
