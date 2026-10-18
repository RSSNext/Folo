import { describe, expect, it } from "vitest"

import { reportAbortsAsAbortError } from "./abort-error"

describe("reportAbortsAsAbortError", () => {
  it("rejects an aborted request with the standard AbortError", async () => {
    const controller = new AbortController()
    const request = reportAbortsAsAbortError(async () => {
      controller.abort()
      throw new Error("fetch failed: java.io.IOException: Canceled")
    })

    const error = await request("https://api.example.test", { signal: controller.signal }).catch(
      (error_: unknown) => error_,
    )

    expect(error).toBeInstanceOf(DOMException)
    expect((error as DOMException).name).toBe("AbortError")
  })

  it("keeps any other failure", async () => {
    const failure = new Error("fetch failed: java.net.ConnectException: Failed to connect")
    const request = reportAbortsAsAbortError(async () => {
      throw failure
    })

    await expect(
      request("https://api.example.test", { signal: new AbortController().signal }),
    ).rejects.toBe(failure)
    await expect(request("https://api.example.test")).rejects.toBe(failure)
  })

  it("passes the response through", async () => {
    const request = reportAbortsAsAbortError(async (input: string) => `response of ${input}`)

    await expect(request("https://api.example.test")).resolves.toBe(
      "response of https://api.example.test",
    )
  })
})
