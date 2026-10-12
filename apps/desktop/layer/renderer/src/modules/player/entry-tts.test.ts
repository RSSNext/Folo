import { defaultGeneralSettings } from "@follow/shared/settings/defaults"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { playEntryTts, toggleEntryTts } from "./entry-tts"

const {
  audioElementMock,
  getEntryMock,
  getGeneralSettingsMock,
  getAudioPlayerAtomValueMock,
  getReadabilityStatusMock,
  legacyTtsMock,
  mountMock,
  setAudioPlayerAtomValueMock,
  setExternalSourceTeardownMock,
  toastFetchErrorMock,
  togglePlayAndPauseMock,
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
  setExternalSourceTeardownMock: vi.fn(),
  toastFetchErrorMock: vi.fn(),
  togglePlayAndPauseMock: vi.fn(),
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
    setExternalSourceTeardown: setExternalSourceTeardownMock,
    togglePlayAndPause: togglePlayAndPauseMock,
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
      type: "tts",
    })
    // Another audio source mounting afterwards stops the TTS
    expect(setExternalSourceTeardownMock).toHaveBeenLastCalledWith(expect.any(Function))
  })

  it("uses the new default voice", () => {
    expect(defaultGeneralSettings.voice).toBe("en-US-AvaMultilingualNeural")
  })

  const stubStreamingAudioContext = () => {
    const sourceStartTimes: number[] = []
    const audioContexts: Array<{ currentTime: number }> = []
    const closeAudioContextMock = vi.fn(() => Promise.resolve())

    class FakeAudioContext {
      currentTime = 0

      constructor() {
        audioContexts.push(this)
      }

      close = closeAudioContextMock
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
        audioContexts.at(-1)!.currentTime = 10
        return globalThis.setTimeout(handler, timeout, ...args)
      },
    })
    fetchMock.mockImplementation(async () => createStreamingResponse())

    return { closeAudioContextMock, sourceStartTimes }
  }

  it("schedules decoded stream chunks from the current audio context time", async () => {
    const { closeAudioContextMock, sourceStartTimes } = stubStreamingAudioContext()

    await playEntryTts("entry-1", { toastTitle: "Play TTS" })

    await waitForExpectation(() => {
      expect(sourceStartTimes).toHaveLength(1)
    })
    expect(sourceStartTimes[0]).toBeGreaterThanOrEqual(3)

    // playEntryTts starts playback without awaiting its background stream loop.
    // Let that loop release its timers before afterEach restores the DOM globals.
    await waitForExpectation(() => {
      expect(closeAudioContextMock).toHaveBeenCalledTimes(1)
    })
    expect(audioElementMock.srcObject).toBeNull()
  })

  it("plays once the first stream chunk is decoded, but keeps a pause made while loading", async () => {
    const { closeAudioContextMock } = stubStreamingAudioContext()
    getAudioPlayerAtomValueMock.mockReturnValue({ entryId: "entry-1", status: "loading" })

    await playEntryTts("entry-1", { toastTitle: "Play TTS" })
    await waitForExpectation(() => {
      expect(closeAudioContextMock).toHaveBeenCalledTimes(1)
    })
    const scheduledStatuses = () =>
      setAudioPlayerAtomValueMock.mock.calls
        .map(([value]) => value)
        .filter((value) => value.duration === 1 && value.currentTime === undefined)
        .map((value) => value.status)
    expect(scheduledStatuses()).toEqual(["playing"])

    setAudioPlayerAtomValueMock.mockClear()
    getAudioPlayerAtomValueMock.mockReturnValue({ entryId: "entry-1", status: "paused" })

    await playEntryTts("entry-1", { toastTitle: "Play TTS" })
    await waitForExpectation(() => {
      expect(closeAudioContextMock).toHaveBeenCalledTimes(2)
    })
    expect(scheduledStatuses()).toEqual(["paused"])
  })

  it("pauses and resumes the mounted entry tts without a new request", async () => {
    await playEntryTts("entry-1", { toastTitle: "Play TTS" })
    getAudioPlayerAtomValueMock.mockReturnValue({ entryId: "entry-1" })

    await toggleEntryTts("entry-1", { toastTitle: "Play TTS" })

    expect(togglePlayAndPauseMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("requests the entry tts again after the player released it", async () => {
    await playEntryTts("entry-1", { toastTitle: "Play TTS" })
    getAudioPlayerAtomValueMock.mockReturnValue({ entryId: "entry-1" })

    // Closing the player runs the teardown TTS registered for its source
    const teardown = setExternalSourceTeardownMock.mock.lastCall?.[0] as () => void
    teardown()
    expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:tts-audio")

    fetchMock.mockResolvedValue(new Response(new Blob(["audio"]), { status: 200 }))
    await toggleEntryTts("entry-1", { toastTitle: "Play TTS" })

    expect(togglePlayAndPauseMock).not.toHaveBeenCalled()
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(mountMock).toHaveBeenCalledTimes(2)
  })

  it("requests the entry tts again after its stream finished", async () => {
    const { closeAudioContextMock } = stubStreamingAudioContext()

    await playEntryTts("entry-1", { toastTitle: "Play TTS" })
    await waitForExpectation(() => {
      expect(closeAudioContextMock).toHaveBeenCalledTimes(1)
    })
    getAudioPlayerAtomValueMock.mockReturnValue({ entryId: "entry-1" })

    await toggleEntryTts("entry-1", { toastTitle: "Play TTS" })

    expect(togglePlayAndPauseMock).not.toHaveBeenCalled()
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(mountMock).toHaveBeenLastCalledWith({
      currentTime: 0,
      entryId: "entry-1",
      src: "about:blank",
      type: "tts",
    })
    await waitForExpectation(() => {
      expect(closeAudioContextMock).toHaveBeenCalledTimes(2)
    })
  })
})
