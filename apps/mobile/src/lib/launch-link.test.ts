import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  initialUrl: null as string | null,
  kv: new Map<string, string>(),
}))

vi.mock("expo-linking", () => ({
  getInitialURL: async () => mocks.initialUrl,
}))

vi.mock("./kv", () => ({
  kv: {
    getSync: (key: string) => mocks.kv.get(key) ?? null,
    setSync: (key: string, value: string) => void mocks.kv.set(key, value),
    delete: async (key: string) => void mocks.kv.delete(key),
  },
}))

const { getUnhandledLaunchLink, rememberHandledLaunchLink } = await import("./launch-link")

describe("launch link across reloads in place", () => {
  beforeEach(() => {
    mocks.initialUrl = null
    mocks.kv.clear()
  })

  it("opens the link that launched the app", async () => {
    mocks.initialUrl = "folo://add?id=1337591707432128512"

    await expect(getUnhandledLaunchLink()).resolves.toBe("folo://add?id=1337591707432128512")
  })

  it("skips it after the app reloaded its JS, as signing out does", async () => {
    mocks.initialUrl = "folo://add?id=1337591707432128512"
    await rememberHandledLaunchLink()

    // The process, and so its launch link, stays the same across the reload
    await expect(getUnhandledLaunchLink()).resolves.toBeNull()
  })

  it("skips it after every reload of the same process", async () => {
    mocks.initialUrl = "folo://list?id=1337626451536515072"
    await rememberHandledLaunchLink()
    await expect(getUnhandledLaunchLink()).resolves.toBeNull()

    await rememberHandledLaunchLink()
    await expect(getUnhandledLaunchLink()).resolves.toBeNull()
  })

  it("opens the same link when it launches the app again later", async () => {
    mocks.initialUrl = "folo://add?id=1337591707432128512"
    await rememberHandledLaunchLink()
    await getUnhandledLaunchLink()

    // A new process launched by the link once more, without a reload in between
    await expect(getUnhandledLaunchLink()).resolves.toBe("folo://add?id=1337591707432128512")
  })

  it("opens another link that launched the app", async () => {
    mocks.initialUrl = "folo://add?id=1"
    await rememberHandledLaunchLink()

    mocks.initialUrl = "folo://add?id=2"
    await expect(getUnhandledLaunchLink()).resolves.toBe("folo://add?id=2")
  })
})
