import { mkdtemp, readFile, stat } from "node:fs/promises"
import { tmpdir } from "node:os"

import { join } from "pathe"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { resolveCliSessionToken } from "./cli-login-token"

vi.mock("electron", () => ({ net: { fetch: vi.fn() } }))
vi.mock("@follow/shared/env.desktop", () => ({
  env: { VITE_API_URL: "https://api.folo.is", VITE_WEB_URL: "https://app.folo.is" },
}))
vi.mock("@pkg", () => ({ default: { version: "0.0.0" } }))
vi.mock("~/manager/window", () => ({ WindowManager: { getMainWindow: () => null } }))
vi.mock("./store", () => ({ store: { get: vi.fn(), set: vi.fn() } }))
vi.mock("../logger", () => ({ logger: { info: vi.fn(), error: vi.fn() } }))

describe("resolveCliSessionToken", () => {
  it("prefers the desktop session cookie token", () => {
    expect(
      resolveCliSessionToken({
        preferredToken: "one-time-token",
        cookieToken: "session-token",
      }),
    ).toBe("session-token")
  })

  it("falls back to the preferred token when no cookie token exists", () => {
    expect(
      resolveCliSessionToken({
        preferredToken: "session-token",
      }),
    ).toBe("session-token")
  })

  it("returns undefined when neither token is available", () => {
    expect(resolveCliSessionToken({})).toBeUndefined()
  })
})

describe("syncSessionToCliConfig", () => {
  let home: string

  beforeEach(async () => {
    vi.resetModules()
    home = await mkdtemp(join(tmpdir(), "folo-cli-"))
    vi.stubEnv("HOME", home)
    vi.stubEnv("USERPROFILE", home)
    // Build-time define read by the shared constants
    vi.stubGlobal("ELECTRON", true)
  })

  it("writes the decoded token for the CLI, readable only by the user", async () => {
    const { syncSessionToCliConfig } = await import("./cli-session-sync")

    await syncSessionToCliConfig("abc%3Ddef")

    const configPath = join(home, ".folo", "config.json")
    expect(JSON.parse(await readFile(configPath, "utf8"))).toEqual({
      token: "abc=def",
      apiUrl: "https://api.folo.is",
    })
    if (process.platform !== "win32") {
      expect((await stat(configPath)).mode & 0o777).toBe(0o600)
      expect((await stat(join(home, ".folo"))).mode & 0o777).toBe(0o700)
    }
  })

  it("leaves the config alone for the same token and clears it on sign-out", async () => {
    const { syncSessionToCliConfig } = await import("./cli-session-sync")
    const configPath = join(home, ".folo", "config.json")

    await syncSessionToCliConfig("abc=def")
    const { mtimeMs } = await stat(configPath)
    await new Promise((resolve) => setTimeout(resolve, 20))
    await syncSessionToCliConfig("abc%3Ddef")
    expect((await stat(configPath)).mtimeMs).toBe(mtimeMs)

    await syncSessionToCliConfig()
    expect(JSON.parse(await readFile(configPath, "utf8"))).toEqual({
      apiUrl: "https://api.folo.is",
    })
  })
})
