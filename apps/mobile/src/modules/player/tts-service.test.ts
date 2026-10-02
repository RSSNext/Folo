import assert from "node:assert/strict"

import { describe, it, vi } from "vitest"

vi.mock("expo/fetch", () => ({ fetch: vi.fn() }))
vi.mock("expo-file-system", () => ({ Directory: vi.fn(), File: vi.fn(), Paths: {} }))
vi.mock("@/src/lib/network-activity", () => ({ trackFetch: <T>(fetch: T) => fetch }))

const createCacheDirectory = (names: string[], { failing }: { failing?: string } = {}) => {
  const deleted: string[] = []
  return {
    deleted,
    directory: {
      exists: true,
      list: () =>
        names.map((name) => ({
          delete: () => {
            if (name === failing) {
              throw new Error("Permission denied")
            }
            deleted.push(name)
          },
          name,
        })),
    },
  }
}

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

  it("deletes every cached TTS file except the one the native player holds", async () => {
    const { pruneTtsCache } = await import("./tts-service")
    const cache = createCacheDirectory([
      "entry-1-100.mp3",
      "entry-2-200.mp3",
      "entry-3-300.mp3",
      "entry-4-400.mp3",
    ])

    // The kept file is matched by name, whatever way its URI is spelled
    pruneTtsCache("file:///private/var/mobile/Library/Caches/tts/entry-2-200.mp3", cache.directory)
    assert.deepEqual(cache.deleted, ["entry-1-100.mp3", "entry-3-300.mp3", "entry-4-400.mp3"])

    const failing = createCacheDirectory(["entry-1-100.mp3", "entry-2-200.mp3"], {
      failing: "entry-1-100.mp3",
    })
    pruneTtsCache(null, failing.directory)
    assert.deepEqual(failing.deleted, ["entry-2-200.mp3"])

    pruneTtsCache(null, {
      exists: false,
      list: () => {
        throw new Error("The directory does not exist")
      },
    })
  })
})
