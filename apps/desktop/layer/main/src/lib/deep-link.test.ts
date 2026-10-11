import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@follow/shared/constants", () => ({
  APP_PROTOCOL: "folo",
  LEGACY_APP_PROTOCOL: "follow",
}))

describe("deep link queue", () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it("holds links until the renderer is ready, then opens them in order", async () => {
    const { openDeepLink, setDeepLinkHandler, setRendererReady } = await import("./deep-link")
    const handler = vi.fn()

    openDeepLink("folo://add?id=1")
    setDeepLinkHandler(handler)
    openDeepLink("folo://add?id=2")
    expect(handler).not.toHaveBeenCalled()

    setRendererReady(true)
    expect(handler.mock.calls).toEqual([["folo://add?id=1"], ["folo://add?id=2"]])

    openDeepLink("folo://add?id=3")
    expect(handler).toHaveBeenLastCalledWith("folo://add?id=3")
  })

  it("holds links again while the renderer reloads", async () => {
    const { openDeepLink, setDeepLinkHandler, setRendererReady } = await import("./deep-link")
    const handler = vi.fn()
    setDeepLinkHandler(handler)
    setRendererReady(true)

    setRendererReady(false)
    openDeepLink("folo://feed?id=1")
    expect(handler).not.toHaveBeenCalled()

    setRendererReady(true)
    expect(handler).toHaveBeenCalledWith("folo://feed?id=1")
  })

  it("recognizes both app protocols among launch arguments", async () => {
    const { isDeepLink } = await import("./deep-link")

    expect(isDeepLink("folo://add?id=1")).toBe(true)
    expect(isDeepLink("follow://add?id=1")).toBe(true)
    expect(isDeepLink("--start-in-tray")).toBe(false)
    expect(isDeepLink("/Applications/Folo.app")).toBe(false)
  })
})
