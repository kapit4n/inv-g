import { describe, it, expect, beforeEach } from "vitest"
import { useDialogStore } from "@/stores/dialog.store"

describe("DialogStore", () => {
  beforeEach(() => {
    useDialogStore.setState({ config: { open: false, title: "", type: "info" } })
  })

  it("initializes closed", () => {
    const state = useDialogStore.getState()
    expect(state.config.open).toBe(false)
  })

  it("openConfirm sets type and opens", () => {
    useDialogStore.getState().openConfirm({ title: "Confirm?", description: "Are you sure?" })
    const { config } = useDialogStore.getState()
    expect(config.open).toBe(true)
    expect(config.type).toBe("confirm")
    expect(config.title).toBe("Confirm?")
    expect(config.description).toBe("Are you sure?")
  })

  it("openDelete sets type delete", () => {
    useDialogStore.getState().openDelete({ title: "Delete?" })
    expect(useDialogStore.getState().config.type).toBe("delete")
  })

  it("openWarning sets type warning", () => {
    useDialogStore.getState().openWarning({ title: "Warning" })
    expect(useDialogStore.getState().config.type).toBe("warning")
  })

  it("openInfo sets type info", () => {
    useDialogStore.getState().openInfo({ title: "Info" })
    expect(useDialogStore.getState().config.type).toBe("info")
  })

  it("openGeneric sets type generic", () => {
    useDialogStore.getState().openGeneric({ title: "Generic" })
    expect(useDialogStore.getState().config.type).toBe("generic")
  })

  it("close resets config to default", () => {
    useDialogStore.getState().openConfirm({ title: "Test" })
    useDialogStore.getState().close()
    const state = useDialogStore.getState()
    expect(state.config.open).toBe(false)
    expect(state.config.title).toBe("")
  })
})
