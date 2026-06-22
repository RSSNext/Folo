import { defaultGeneralSettings } from "@follow/shared/settings/defaults"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { playEntryTts } from "./entry-tts"

const {
  audioElementMock,
  getEntryMock,
  getGeneralSettingsMock,
  getAudioPlayerAtomValueMock,
  getReadabilityStatusMock,
  legacyTtsMock,
  mountMock,
  setAudioPlayerAtomValueMock,
  toastFetchErrorMock,
} = vi.hoisted(() => ({
  audioElementMock: {
    addEventListener: vi.fn(),
    currentTime: 0,
    load: vi.fn(),
    pause: vi.fn(),
    play: vi.fn(() => Promise.resolve()),
    removeEventListener: vi.fn(),
    src: "",
    srcObject: null as MediaStream | null,
  },
  getEntryMock: vi.fn(),
  getGeneralSettingsMock: vi.fn(),
  getAudioPlayerAtomValueMock: vi.fn(() => ({})),
  getReadabilityStatusMock: vi.fn(),
  legacyTtsMock: vi.fn(),
  mountMock: vi.fn(),
  setAudioPlayerAtomValueMock: vi.fn(),
  toastFetchErrorMock: vi.fn(),
}))

vi.mock("@follow/store/entry/getter", () => ({
  getEntry: getEntryMock,
}))

vi.mock("~/atoms/readability", () => ({
  ReadabilityStatus: {
    INITIAL: 1,
    WAITING: 2,
    SUCCESS: 3,
    FAILURE: 4,
  },
  getReadabilityStatus: getReadabilityStatusMock,
}))

vi.mock("~/atoms/settings/general", () => ({
  getGeneralSettings: getGeneralSettingsMock,
}))

vi.mock("~/atoms/player", () => ({
  AudioPlayer: {
    audio: audioElementMock,
    mount: mountMock,
  },
  getAudioPlayerAtomValue: getAudioPlayerAtomValueMock,
  setAudioPlayerAtomValue: setAudioPlayerAtomValueMock,
}))

vi.mock("~/lib/api-client", () => ({
  followClient: {
    api: {
      ai: {
        tts: legacyTtsMock,
      },
    },
  },
}))

vi.mock("~/lib/error-parser", () => ({
  toastFetchError: toastFetchErrorMock,
}))

describe("entry tts", () => {
  const fetchMock = vi.fn<typeof fetch>()
  const createObjectURLMock = vi.fn(() => "blob:tts-audio")
  const revokeObjectURLMock = vi.fn()

  const createAudioBufferMock = (duration: number, sampleRate = 1000) =>
    ({
      copyFromChannel: (destination: Float32Array) => {
        destination.fill(0)
      },
      copyToChannel: vi.fn(),
      duration,
      length: Math.round(duration * sampleRate),
      numberOfChannels: 1,
      sampleRate,
    }) as unknown as AudioBuffer

  const waitForExpectation = async (assertion: () => void) => {
    const deadline = Date.now() + 1000
    let lastError: unknown

    while (Date.now() < deadline) {
      try {
        assertion()
        return
      } catch (error) {
        lastError = error
        await new Promise((resolve) => setTimeout(resolve, 0))
      }
    }

    throw lastError
  }

  const createStreamingResponse = () =>
    new Response(
      new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new Uint8Array([1, 2, 3]))
          controller.close()
        },
      }),
      {
        headers: {
          "content-type": "audio/mpeg",
        },
        status: 200,
      },
    )

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock)
    vi.stubGlobal(
      "URL",
      Object.assign(URL, {
        createObjectURL: createObjectURLMock,
        revokeObjectURL: revokeObjectURLMock,
      }),
    )

    getEntryMock.mockReturnValue({
      id: "entry-1",
      title: "",
      content: "Hello world",
      readabilityContent: "",
      description: "",
    })
    getGeneralSettingsMock.mockReturnValue({
      voice: "en-US-AvaMultilingualNeural",
    })
    getAudioPlayerAtomValueMock.mockReturnValue({})
    getReadabilityStatusMock.mockReturnValue({})
    fetchMock.mockResolvedValue(
      new Response(new Blob(["audio"], { type: "audio/mpeg" }), {
        headers: {
          "content-type": "audio/mpeg",
        },
        status: 200,
      }),
    )
    legacyTtsMock.mockRejectedValue(new Error("legacy api should not be used"))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it("requests entry tts from the new service", async () => {
    await playEntryTts("entry-1", { toastTitle: "Play TTS" })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith(
      "https://tts.folo.is/tts",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: expect.any(AbortSignal),
      }),
    )

    const requestInit = fetchMock.mock.calls[0]?.[1]
    expect(requestInit).toBeDefined()
    expect(JSON.parse(String(requestInit?.body))).toEqual({
      text: "Hello world",
      voice: "en-US-AvaMultilingualNeural",
    })

    expect(legacyTtsMock).not.toHaveBeenCalled()
    expect(mountMock).toHaveBeenCalledWith({
      currentTime: 0,
      entryId: "entry-1",
      src: "blob:tts-audio",
      type: "audio",
    })
  })

  it("uses the new default voice", () => {
    expect(defaultGeneralSettings.voice).toBe("en-US-AvaMultilingualNeural")
  })

  it("schedules decoded stream chunks from the current audio context time", async () => {
    const sourceStartTimes: number[] = []
    const audioContexts: Array<{ currentTime: number }> = []

    class FakeAudioContext {
      currentTime = 0

      constructor() {
        audioContexts.push(this)
      }

      close = vi.fn(() => Promise.resolve())
      createBuffer = (_channels: number, frameCount: number, sampleRate: number) =>
        createAudioBufferMock(frameCount / sampleRate, sampleRate)
      createBufferSource = () => ({
        buffer: null as AudioBuffer | null,
        connect: vi.fn(),
        start: vi.fn((time: number) => {
          sourceStartTimes.push(time)
        }),
      })
      createMediaStreamDestination = () => ({
        stream: {} as MediaStream,
      })
      decodeAudioData = vi.fn(async () => {
        this.currentTime = 3
        return createAudioBufferMock(1)
      })
      resume = vi.fn(() => Promise.resolve())
      suspend = vi.fn(() => Promise.resolve())
    }

    vi.stubGlobal("window", {
      ...window,
      AudioContext: FakeAudioContext,
      clearInterval: globalThis.clearInterval,
      setInterval: globalThis.setInterval,
      setTimeout: (handler: TimerHandler, timeout?: number, ...args: unknown[]) => {
        audioContexts[0]!.currentTime = 10
        return globalThis.setTimeout(handler, timeout, ...args)
      },
    })
    fetchMock.mockResolvedValue(createStreamingResponse())

    await playEntryTts("entry-1", { toastTitle: "Play TTS" })

    await waitForExpectation(() => {
      expect(sourceStartTimes).toHaveLength(1)
    })
    expect(sourceStartTimes[0]).toBeGreaterThanOrEqual(3)
  })
})
