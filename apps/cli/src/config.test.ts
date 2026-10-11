import { mkdir, mkdtemp, readFile, stat, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"

import { join } from "pathe"
import { beforeEach, describe, expect, it, vi } from "vitest"

describe("config", () => {
  let home: string

  beforeEach(async () => {
    vi.resetModules()
    home = await mkdtemp(join(tmpdir(), "folo-cli-config-"))
    vi.stubEnv("HOME", home)
    vi.stubEnv("USERPROFILE", home)
  })

  it("writes the token so that only the user can read it", async () => {
    const { updateConfig } = await import("./config")

    await updateConfig({ token: "secret", apiUrl: "https://api.folo.is" })

    const configPath = join(home, ".folo", "config.json")
    expect(JSON.parse(await readFile(configPath, "utf8"))).toEqual({
      token: "secret",
      apiUrl: "https://api.folo.is",
    })
    if (process.platform !== "win32") {
      expect((await stat(configPath)).mode & 0o777).toBe(0o600)
      expect((await stat(join(home, ".folo"))).mode & 0o777).toBe(0o700)
    }
  })

  it("treats a damaged config as empty so that login can repair it", async () => {
    await mkdir(join(home, ".folo"))
    await writeFile(join(home, ".folo", "config.json"), '{"token": "sec')
    const { readConfig, updateConfig } = await import("./config")
    vi.spyOn(console, "error").mockImplementation(() => {})

    await expect(readConfig()).resolves.toEqual({})
    await expect(updateConfig({ token: "new" })).resolves.toEqual({ token: "new" })
  })
})
