import { beforeEach, describe, expect, it, vi } from "vitest"

import { applyScheduledLocalDataReset, scheduleLocalDataReset } from "./local-data-reset"

const mocks = vi.hoisted(() => ({
  storage: new Map<string, string>(),
  files: new Set<string>(),
  failingDelete: null as string | null,
}))

vi.mock("@follow/database/constant", () => ({ SQLITE_DB_NAME: "follow.db" }))

vi.mock("expo-sqlite/kv-store", () => ({
  default: {
    getItemSync: (key: string) => mocks.storage.get(key) ?? null,
    setItemSync: (key: string, value: string) => {
      mocks.storage.set(key, value)
    },
    removeItemSync: (key: string) => mocks.storage.delete(key),
  },
}))

vi.mock("expo-file-system", () => ({
  Paths: { document: "file:///documents" },
  File: class {
    path: string
    constructor(...parts: string[]) {
      this.path = parts.join("/")
    }

    get exists() {
      return mocks.files.has(this.path)
    }

    delete() {
      if (this.path === mocks.failingDelete) throw new Error("I/O error")
      mocks.files.delete(this.path)
    }
  },
}))

const databaseFile = (name: string) => `file:///documents/SQLite/${name}`

describe("local data reset", () => {
  beforeEach(() => {
    mocks.storage.clear()
    mocks.files.clear()
    mocks.failingDelete = null
    for (const name of ["follow.db", "follow.db-wal", "follow.db-shm"]) {
      mocks.files.add(databaseFile(name))
    }
    mocks.files.add(databaseFile("other.db"))
  })

  it("leaves the database alone until a reset is scheduled", () => {
    applyScheduledLocalDataReset()

    expect(mocks.files.has(databaseFile("follow.db"))).toBe(true)
  })

  it("deletes the database and the files SQLite keeps next to it at the next launch", () => {
    scheduleLocalDataReset()
    // Scheduling deletes nothing, so the running app can still write until it reloads
    expect(mocks.files.has(databaseFile("follow.db"))).toBe(true)

    applyScheduledLocalDataReset()

    expect([...mocks.files]).toEqual([databaseFile("other.db")])
  })

  it("resets once", () => {
    scheduleLocalDataReset()
    applyScheduledLocalDataReset()
    mocks.files.add(databaseFile("follow.db"))

    applyScheduledLocalDataReset()

    expect(mocks.files.has(databaseFile("follow.db"))).toBe(true)
  })

  it("tries again at the next launch when the database could not be deleted", () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    scheduleLocalDataReset()
    mocks.failingDelete = databaseFile("follow.db")

    expect(() => applyScheduledLocalDataReset()).not.toThrow()
    expect(mocks.files.has(databaseFile("follow.db"))).toBe(true)

    mocks.failingDelete = null
    applyScheduledLocalDataReset()

    expect(mocks.files.has(databaseFile("follow.db"))).toBe(false)
  })
})
