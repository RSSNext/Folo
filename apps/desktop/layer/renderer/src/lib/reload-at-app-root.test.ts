import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const constants = vi.hoisted(() => ({ IN_ELECTRON: false }))

vi.mock("@follow/shared/constants", () => constants)

const { reloadAtAppRoot } = await import("./reload-at-app-root")

describe("reloadAtAppRoot", () => {
  let reload: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    reload = vi.spyOn(window.location, "reload").mockImplementation(() => {})
  })

  afterEach(() => {
    reload.mockRestore()
    constants.IN_ELECTRON = false
    window.history.replaceState(null, "", "/")
  })

  it("leaves the entry the account before had open for the start page", () => {
    window.history.replaceState(null, "", "/timeline/articles/feed-a/entry-a?view=0")

    reloadAtAppRoot()

    expect(window.location.pathname).toBe("/")
    expect(window.location.search).toBe("")
    expect(reload).toHaveBeenCalledOnce()
  })

  it("keeps the page of the desktop app and only resets the route in its hash", () => {
    constants.IN_ELECTRON = true
    window.history.replaceState(null, "", "/index.html#/timeline/articles/feed-a/entry-a")

    reloadAtAppRoot()

    expect(window.location.pathname).toBe("/index.html")
    expect(window.location.hash).toBe("#/")
    expect(reload).toHaveBeenCalledOnce()
  })
})
