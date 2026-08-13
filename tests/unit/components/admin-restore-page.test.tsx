import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, fireEvent, waitFor } from "@tests/helpers/render"
import { setupI18n } from "@/i18n"
import { AdminRestorePage } from "@/features/admin/pages/admin-restore-page"
import { getRestoreHistory, getBackupHistory, verifyBackup, restoreBackup } from "@/lib/tauri"
import type { BackupRecord, RestoreRecord } from "@/types"

const backups: BackupRecord[] = [
  { id: 1, fileName: "inventory_gear_20260813_100000.db", filePath: "/data/backups/inventory_gear_20260813_100000.db", fileSize: 123456, backupType: "manual", compression: "none", encryption: "none", status: "completed", checksum: "abc123", createdBy: 1, createdByName: "Administrador", createdAt: "2026-08-13T10:00:00Z" },
  { id: 2, fileName: "inventory_gear_20260812_100000.db", filePath: "/data/backups/inventory_gear_20260812_100000.db", fileSize: 512, backupType: "manual", compression: "none", encryption: "none", status: "failed", notes: "Backup failed: disk full", createdBy: 1, createdByName: "Administrador", createdAt: "2026-08-12T10:00:00Z" },
]

const history: RestoreRecord[] = [
  { id: 1, backupId: 1, fileName: "inventory_gear_20260701_100000.db", filePath: "/data/backups/inventory_gear_20260701_100000.db", restoreType: "complete", status: "completed", tablesRestored: "all", createdBy: 1, createdByName: "Administrador", createdAt: "2026-07-01T11:00:00Z" },
  { id: 2, backupId: 2, fileName: "inventory_gear_20260601_100000.db", filePath: "/data/backups/inventory_gear_20260601_100000.db", restoreType: "complete", status: "failed", errorMessage: "Integrity check failed after restore", createdBy: 1, createdByName: "Administrador", createdAt: "2026-06-01T11:00:00Z" },
]

const validValidation = {
  fileName: "inventory_gear_20260813_100000.db",
  filePath: "/data/backups/inventory_gear_20260813_100000.db",
  fileSize: 123456,
  valid: true,
  sqliteValid: true,
  integrityOk: true,
  checksum: "abc123",
  checksumMatch: true,
  message: "Backup is valid",
}

vi.mock("@/lib/tauri", () => ({
  getRestoreHistory: vi.fn(),
  getBackupHistory: vi.fn(),
  verifyBackup: vi.fn(),
  restoreBackup: vi.fn(),
}))

setupI18n("en")

describe("AdminRestorePage", () => {
  beforeEach(() => {
    vi.mocked(getRestoreHistory).mockReset()
    vi.mocked(getBackupHistory).mockReset()
    vi.mocked(verifyBackup).mockReset()
    vi.mocked(restoreBackup).mockReset()

    vi.mocked(getRestoreHistory).mockResolvedValue(history)
    vi.mocked(getBackupHistory).mockResolvedValue(backups)
    vi.mocked(verifyBackup).mockResolvedValue(validValidation)
    vi.mocked(restoreBackup).mockResolvedValue({ id: 9, backupId: 1, fileName: backups[0].fileName, filePath: backups[0].filePath, restoreType: "complete", status: "completed", tablesRestored: "all", createdBy: 1, createdAt: "2026-08-13T11:00:00Z" })
  })

  it("renders restore history with failed entries and error messages", async () => {
    render(<AdminRestorePage />)
    expect(await screen.findByText("inventory_gear_20260701_100000.db")).toBeDefined()
    expect(screen.getByText("Integrity check failed after restore")).toBeDefined()
    expect(screen.getAllByText("Completed").length).toBeGreaterThan(0)
  })

  it("only offers completed backups for selection", async () => {
    render(<AdminRestorePage />)
    await screen.findByText("inventory_gear_20260701_100000.db")
    const select = screen.getByRole("combobox") as HTMLSelectElement
    const options = Array.from(select.options).map((o) => o.value)
    expect(options).toEqual(["", "1"])
  })

  it("keeps the restore button disabled until the backup is validated", async () => {
    render(<AdminRestorePage />)
    await screen.findByText("inventory_gear_20260701_100000.db")

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "1" } })
    const restoreButton = await screen.findByRole("button", { name: /Complete Restore/ })
    expect(restoreButton).toBeDisabled()

    fireEvent.click(screen.getByRole("button", { name: /Validate Backup/ }))
    await waitFor(() => expect(verifyBackup).toHaveBeenCalledWith(1))
    await waitFor(() => expect(screen.getByRole("button", { name: /Complete Restore/ })).not.toBeDisabled())
  })

  it("restores the selected backup after confirmation", async () => {
    render(<AdminRestorePage />)
    await screen.findByText("inventory_gear_20260701_100000.db")

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "1" } })
    fireEvent.click(await screen.findByRole("button", { name: /Validate Backup/ }))
    await waitFor(() => expect(restoreBackup).not.toHaveBeenCalled())

    fireEvent.click(screen.getByRole("button", { name: /Complete Restore/ }))
    expect(await screen.findByText("Restore Confirmation")).toBeDefined()
    fireEvent.click(screen.getByRole("button", { name: "Restore" }))
    await waitFor(() => {
      expect(restoreBackup).toHaveBeenCalledWith({ backupId: 1, restoreType: "complete", createdBy: 1 })
    })
  })

  it("blocks restore when validation fails", async () => {
    vi.mocked(verifyBackup).mockResolvedValue({
      ...validValidation,
      valid: false,
      integrityOk: false,
      message: "Backup is invalid: integrity check failed",
    })
    render(<AdminRestorePage />)
    await screen.findByText("inventory_gear_20260701_100000.db")

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "1" } })
    fireEvent.click(await screen.findByRole("button", { name: /Validate Backup/ }))
    await screen.findByText(/Backup is invalid/)

    expect(screen.getByRole("button", { name: /Complete Restore/ })).toBeDisabled()
    expect(restoreBackup).not.toHaveBeenCalled()
  })
})
