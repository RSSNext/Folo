import assert from "node:assert/strict"
import { describe, it } from "node:test"

describe("mobile tts service", () => {
  it("extracts normalized plain text from entry content", async () => {
    const { getEntryTtsText } = await import("./tts-core")

    assert.equal(
      getEntryTtsText({
        title: "  Hello   world  ",
        content: "<p>Line 1</p><p>Line 2</p>",
        description: "",
        readabilityContent: "",
      }),
      "Hello world\n\nLine 1\n\nLine 2",
    )
  })

  it("posts the normalized text to the TTS service and writes the returned bytes to cache", async () => {
    const calls: {
      create?: unknown
      request?: {
        body?: string
        headers?: Record<string, string>
        method?: string
      }
      written?: Uint8Array
    } = {}

    const { requestTtsBytes } = await import("./tts-core")

    const bytes = await requestTtsBytes({
      fetch: async (_input, init) => {
        calls.request = {
          body: typeof init?.body === "string" ? init.body : undefined,
          headers: init?.headers as Record<string, string>,
          method: init?.method,
        }

        return {
          ok: true,
          bytes: async () => new Uint8Array([1, 2, 3]),
        } as Response & { bytes: () => Promise<Uint8Array> }
      },
      text: " Hello   world ",
      voice: "en-US-AvaMultilingualNeural",
    })

    assert.deepEqual(calls.request, {
      body: JSON.stringify({
        text: "Hello world",
        voice: "en-US-AvaMultilingualNeural",
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    })
    assert.deepEqual(bytes, new Uint8Array([1, 2, 3]))
  })
})
