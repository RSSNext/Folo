import { beforeAll, describe, expect, it, vi } from "vitest"

let resolveVideoUrlForMobileOpen: typeof import("./video-url").resolveVideoUrlForMobileOpen

beforeAll(async () => {
  vi.stubGlobal("ELECTRON", false)
  ;({ resolveVideoUrlForMobileOpen } = await import("./video-url"))
})

describe("resolveVideoUrlForMobileOpen", () => {
  it("keeps YouTube watch URLs unchanged for mobile browser opens", () => {
    const url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"

    expect(resolveVideoUrlForMobileOpen(url)).toBe(url)
  })

  it("keeps YouTube shorts URLs unchanged for mobile browser opens", () => {
    const url = "https://www.youtube.com/shorts/dQw4w9WgXcQ"

    expect(resolveVideoUrlForMobileOpen(url)).toBe(url)
  })

  it("still transforms Bilibili links into the player URL", () => {
    const url = "https://www.bilibili.com/video/BV1xx411c7mD"
    const resolved = resolveVideoUrlForMobileOpen(url)

    expect(resolved).toContain("https://www.bilibili.com/blackboard/newplayer.html?")
    expect(resolved).toContain("bvid=BV1xx411c7mD")
  })

  it("falls back to the original URL when no transform is available", () => {
    const url = "https://example.com/post/1"

    expect(resolveVideoUrlForMobileOpen(url)).toBe(url)
  })
})
