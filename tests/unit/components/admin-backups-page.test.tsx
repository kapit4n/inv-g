import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, fireEvent, waitFor } from "@tests/helpers/render"
import { setupI18n } from "@/i18n"
import { AdminBackupsPage } from "@/features/admin/pages/admin-backups-page"
import { NotificationCenter } from "@/components/notification-center"
import { getBackupHistory, getBackupStats, createBackup, deleteBackup, verifyBackup, restoreBackup } from "@/lib/tauri"
import type { BackupRecord } from "@/types"

const backups: BackupRecord[] = [
  { id: 1, fileName: "inventory_gear_20260813_100000.db", filePath: "/data/backups/inventory_gear_20260813_100000.db", fileSize: 123456, backupType: "manual", compression: "none", encryption: "none", status: "completed", checksum: "abc123", createdBy: 1, createdByName: "Administrador", createdAt: "2026-08-13T10:00:00Z" },
  { id: 2, fileName: "inventory_gear_20260812_100000.db", filePath: "/data/backups/inventory_gear_20260812_100000.db", fileSize: 512, backupType: "manual", compression: "none", encryption: "none", status: "failed", notes: "Backup failed: disk full", createdBy: 1, createdByName: "Administrador", createdAt: "2026-08-12T10:00:00Z" },
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
  getBackupHistory: vi.fn(),
  getBackupStats: vi.fn(),
  createBackup: vi.fn(),
  deleteBackup: vi.fn(),
  verifyBackup: vi.fn(),
  restoreBackup: vi.fn(),
}))

setupI18n("en")

describe("AdminBackupsPage", () => {
  beforeEach(() => {
    vi.mocked(getBackupHistory).mockReset()
    vi.mocked(getBackupStats).mockReset()
    vi.mocked(createBackup).mockReset()
    vi.mocked(deleteBackup).mockReset()
    vi.mocked(verifyBackup).mockReset()
    vi.mocked(restoreBackup).mockReset()

    vi.mocked(getBackupHistory).mockResolvedValue(backups)
    vi.mocked(getBackupStats).mockResolvedValue({ total_backups: 2, total_size_bytes: 123968, total_size_mb: "0.12", last_backup: "2026-08-13T10:00:00Z" })
    vi.mocked(createBackup).mockResolvedValue(backups[0])
    vi.mocked(deleteBackup).mockResolvedValue(undefined)
    vi.mocked(verifyBackup).mockResolvedValue(validValidation)
    vi.mocked(restoreBackup).mockResolvedValue({ id: 9, backupId: 1, fileName: backups[0].fileName, filePath: backups[0].filePath, restoreType: "complete", status: "completed", tablesRestored: "all", createdBy: 1, createdAt: "2026-08-13T11:00:00Z" })
  })

  it("loads and renders backup rows with status badges", async () => {
    render(<AdminBackupsPage />)
    expect(await screen.findByText("inventory_gear_20260813_100000.db")).toBeDefined()
    expect(screen.getByText("inventory_gear_20260812_100000.db")).toBeDefined()
    expect(screen.getAllByText("Completed").length).toBeGreaterThan(0)
    expect(screen.getByText("Failed")).toBeDefined()
  })

  it("creates a manual backup and reloads the list", async () => {
    render(<AdminBackupsPage />)
    await screen.findByText("inventory_gear_20260813_100000.db")
    fireEvent.click(screen.getByText("Create Backup"))
    await waitFor(() => {
      expect(createBackup).toHaveBeenCalledWith("manual", "Manual backup", 1)
    })
  })

  it("verifies a backup and reports success", async () => {
    render(<>
      <AdminBackupsPage />
      <NotificationCenter />
    </>)
    await screen.findByText("inventory_gear_20260813_100000.db")
    fireEvent.click(screen.getAllByTitle("Verify Backup")[0])
    await waitFor(() => expect(verifyBackup).toHaveBeenCalledWith(1))
    expect(await screen.findByText(/Backup is valid and intact/)).toBeDefined()
  })

  it("reports a failed verification with the backend message", async () => {
    vi.mocked(verifyBackup).mockResolvedValue({
      ...validValidation,
      valid: false,
      integrityOk: false,
      checksumMatch: false,
      message: "Backup is invalid: checksum mismatch (file has been modified)",
    })
    render(<>
      <AdminBackupsPage />
      <NotificationCenter />
    </>)
    await screen.findByText("inventory_gear_20260813_100000.db")
    fireEvent.click(screen.getAllByTitle("Verify Backup")[0])
    expect(await screen.findByText(/Backup validation failed/)).toBeDefined()
  })

  it("requires confirmation before restoring and restores only completed backups", async () => {
    render(<AdminBackupsPage />)
    await screen.findByText("inventory_gear_20260813_100000.db")

    fireEvent.click(screen.getAllByTitle("Restore")[0])
    expect(await screen.findByText("Restore Confirmation")).toBeDefined()
    expect(restoreBackup).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole("button", { name: "Restore" }))
    await waitFor(() => {
      expect(restoreBackup).toHaveBeenCalledWith({ backupId: 1, restoreType: "complete", createdBy: 1 })
    })
  })

  it("does not allow restoring a failed backup", async () => {
    render(<AdminBackupsPage />)
    await screen.findByText("inventory_gear_20260813_100000.db")
    const restoreButtons = screen.getAllByTitle("Restore")
    expect(restoreButtons[0]).not.toBeDisabled()
    expect(restoreButtons[1]).toBeDisabled()
  })

  it("requires confirmation before deleting a backup", async () => {
    render(<AdminBackupsPage />)
    await screen.findByText("inventory_gear_20260813_100000.db")
    fireEvent.click(screen.getAllByTitle("Delete Backup")[0])
    expect(await screen.findByText("Delete Backup")).toBeDefined()
    expect(deleteBackup).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole("button", { name: "Delete" }))
    await waitFor(() => {
      expect(deleteBackup).toHaveBeenCalledWith(1, 1)
    })
  })
})
