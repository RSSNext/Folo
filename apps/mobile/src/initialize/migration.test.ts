// @vitest-environment happy-dom
import { act, createElement } from "react"
import { createRoot } from "react-dom/client"
import { afterEach, expect, test, vi } from "vitest"

const { migrateDB } = vi.hoisted(() => ({ migrateDB: vi.fn() }))
vi.mock("@follow/database/db", () => ({ migrateDB }))

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.resetModules()
})

test("updates mounted migration subscribers when the database finishes after first render", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true)
  let resolveMigration!: () => void
  migrateDB.mockReturnValue(new Promise<void>((resolve) => (resolveMigration = resolve)))
  const { migrateDatabase, useDatabaseMigration } = await import("./migration")
  const Status = () =>
    createElement("p", null, useDatabaseMigration().success ? "ready" : "waiting")
  const container = document.createElement("div")
  const root = createRoot(container)

  try {
    await act(async () =>
      root.render(createElement("div", null, createElement(Status), createElement(Status))),
    )
    expect(container.textContent).toBe("waitingwaiting")

    const migration = migrateDatabase()
    await act(async () => {
      resolveMigration()
      await migration
    })
    expect(container.textContent).toBe("readyready")

    // A consumer mounting after initialization must immediately see completion.
    await act(async () => root.render(createElement(Status)))
    expect(container.textContent).toBe("ready")
  } finally {
    await act(async () => root.unmount())
  }
})

test("replaces the pending snapshot when migration fails so the recovery UI can render", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true)
  const failure = new Error("test migration failure")
  let rejectMigration!: (error: Error) => void
  migrateDB.mockReturnValue(new Promise<void>((_resolve, reject) => (rejectMigration = reject)))
  vi.spyOn(console, "error").mockImplementation(() => {})
  const { migrateDatabase, useDatabaseMigration } = await import("./migration")
  const Status = () => createElement("p", null, useDatabaseMigration().error?.message ?? "waiting")
  const container = document.createElement("div")
  const root = createRoot(container)

  try {
    await act(async () => root.render(createElement(Status)))
    expect(container.textContent).toBe("waiting")
    const migration = migrateDatabase()
    await act(async () => {
      rejectMigration(failure)
      await migration
    })
    expect(container.textContent).toBe(failure.message)
  } finally {
    await act(async () => root.unmount())
  }
})

test("unmounting one migration consumer keeps the remaining subscriber active", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true)
  let resolveMigration!: () => void
  migrateDB.mockReturnValue(new Promise<void>((resolve) => (resolveMigration = resolve)))
  const { migrateDatabase, useDatabaseMigration } = await import("./migration")
  const Status = () =>
    createElement("p", null, useDatabaseMigration().success ? "ready" : "waiting")
  const container = document.createElement("div")
  const root = createRoot(container)

  try {
    await act(async () =>
      root.render(
        createElement(
          "div",
          null,
          createElement(Status, { key: "a" }),
          createElement(Status, { key: "b" }),
        ),
      ),
    )
    await act(async () =>
      root.render(createElement("div", null, createElement(Status, { key: "b" }))),
    )
    expect(container.textContent).toBe("waiting")
    const migration = migrateDatabase()
    await act(async () => {
      resolveMigration()
      await migration
    })
    expect(container.textContent).toBe("ready")
  } finally {
    await act(async () => root.unmount())
  }
})
