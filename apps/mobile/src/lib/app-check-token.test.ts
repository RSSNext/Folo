import { describe, expect, it, vi } from "vitest"

import { getAppCheckTokenWhenReady } from "./app-check-token"

describe("App Check provider initialization", () => {
  it("waits for v26 native setup before using a limited-use token", async () => {
    const token = { token: "limited-use-token" }
    const read = vi
      .fn<() => Promise<typeof token>>()
      .mockRejectedValueOnce({ code: "appCheck/provider-not-ready" })
      .mockRejectedValueOnce({ code: "appCheck/provider-not-ready" })
      .mockResolvedValue(token)
    const wait = vi.fn(async () => {})

    await expect(getAppCheckTokenWhenReady(read, wait)).resolves.toBe(token)
    expect(wait.mock.calls).toEqual([[25], [50]])
    expect(read).toHaveBeenCalledTimes(3)
  })

  it("bounds retries when initialization never completes", async () => {
    const error = { code: "appCheck/provider-not-ready" }
    const read = vi.fn().mockRejectedValue(error)
    const wait = vi.fn(async () => {})

    await expect(getAppCheckTokenWhenReady(read, wait)).rejects.toBe(error)
    expect(read).toHaveBeenCalledTimes(5)
    expect(wait).toHaveBeenCalledTimes(4)
  })

  it("preserves attestation failures without retrying or manufacturing a token", async () => {
    const error = { code: "appCheck/token-error" }
    const read = vi.fn().mockRejectedValue(error)
    const wait = vi.fn(async () => {})

    await expect(getAppCheckTokenWhenReady(read, wait)).rejects.toBe(error)
    expect(read).toHaveBeenCalledTimes(1)
    expect(wait).not.toHaveBeenCalled()
  })
})
