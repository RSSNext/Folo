import type { MediaItem } from "@rntp/player"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  activeItem: null as MediaItem | null,
  nativePlaying: false,
  fileUrl: "file:///var/mobile/Library/Caches/tts/entry-1.mp3",
  requestTtsFile: vi.fn(),
  play: vi.fn(async () => {}),
  pause: vi.fn(async () => {}),
  playerRegistered: true,
  pruneTtsCache: vi.fn(),
  streamEntryId: null as string | null,
  streamPlay: vi.fn<() => Promise<void>>(async () => {
    throw new Error("TTS streaming player is not ready")
  }),
  streamStop: vi.fn(async () => {}),
  toastFetchError: vi.fn(),
}))

vi.mock("@follow/store/entry/getter", () => ({
  getEntry: () => ({ feedId: "feed-1", title: "Article", media: [] }),
}))

vi.mock("@/src/modules/feed/feed-title", () => ({
  getPreferredFeedTitle: () => "Custom Feed",
}))

vi.mock("@rntp/player", () => ({
  default: { getActiveMediaItem: () => mocks.activeItem },
}))

vi.mock("@/src/atoms/settings/general", () => ({
  getGeneralSettings: () => ({ voice: "en-US-AvaMultilingualNeural" }),
}))

vi.mock("@/src/initialize/player", () => ({
  get PlayerRegistered() {
    return mocks.playerRegistered
  },
}))

vi.mock("@/src/lib/error-parser", () => ({
  toastFetchError: mocks.toastFetchError,
}))

vi.mock("@/src/lib/player", () => ({
  player: {
    isPlaying: () => mocks.nativePlaying,
    play: mocks.play,
    pause: mocks.pause,
  },
}))

vi.mock("./tts-service", () => ({
  getEntryTtsText: () => "Article text",
  pruneTtsCache: mocks.pruneTtsCache,
  requestTtsFile: mocks.requestTtsFile,
}))

vi.mock("./tts-stream-controller", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./tts-stream-controller")>()),
  ttsStreamController: {
    canToggleEntry: () => false,
    getState: () => ({ entryId: mocks.streamEntryId }),
    play: mocks.streamPlay,
    stop: mocks.streamStop,
  },
}))

/** A fallback download that only finishes when told to, or fails once its signal aborts. */
const holdFallbackDownload = ({ failOnAbort }: { failOnAbort: boolean }) => {
  let finish!: (url: string) => void
  mocks.requestTtsFile.mockImplementationOnce(
    ({ signal }: { signal: AbortSignal }) =>
      new Promise<string>((resolve, reject) => {
        finish = resolve
        if (failOnAbort) {
          signal.addEventListener("abort", () => reject(new Error("The operation was aborted.")))
        }
      }),
  )

  return {
    finish: (url: string) => finish(url),
    signal: async () => {
      await vi.waitFor(() => expect(mocks.requestTtsFile).toHaveBeenCalled())
      const [{ signal }] = mocks.requestTtsFile.mock.lastCall as [{ signal: AbortSignal }]
      return signal
    },
  }
}

describe("playEntryTts", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    mocks.activeItem = null
    mocks.nativePlaying = false
    mocks.playerRegistered = true
    mocks.streamEntryId = null
    mocks.requestTtsFile.mockResolvedValue(mocks.fileUrl)
  })

  it("toggles a cached TTS file using its stable ID after iOS normalizes the URL", async () => {
    const { playEntryTts } = await import("./entry-tts")
    const options = { toastTitle: "Read article" }

    await playEntryTts("entry-1", options)

    expect(mocks.requestTtsFile).toHaveBeenCalledOnce()
    expect(mocks.play).toHaveBeenCalledWith(
      expect.objectContaining({ url: mocks.fileUrl, artist: "Custom Feed" }),
    )

    mocks.activeItem = {
      mediaId: mocks.fileUrl,
      url: "/var/mobile/Library/Caches/tts/entry-1.mp3",
    }
    mocks.nativePlaying = true

    await playEntryTts("entry-1", options)

    expect(mocks.pause).toHaveBeenCalledOnce()
    expect(mocks.requestTtsFile).toHaveBeenCalledOnce()
    expect(mocks.streamPlay).toHaveBeenCalledOnce()

    mocks.nativePlaying = false
    await playEntryTts("entry-1", options)

    expect(mocks.play).toHaveBeenLastCalledWith()
    expect(mocks.play).toHaveBeenCalledTimes(2)
    expect(mocks.requestTtsFile).toHaveBeenCalledOnce()
    expect(mocks.toastFetchError).not.toHaveBeenCalled()
  })

  it("never plays a fallback download that finishes after a retry started streaming", async () => {
    const { playEntryTts } = await import("./entry-tts")
    const options = { toastTitle: "Read article" }

    // The stream times out, so the first request downloads the whole file instead
    mocks.streamPlay.mockRejectedValueOnce(new Error("TTS streaming did not start in time"))
    const download = holdFallbackDownload({ failOnAbort: false })
    const firstRequest = playEntryTts("entry-1", options)
    const fallbackSignal = await download.signal()

    mocks.streamPlay.mockResolvedValueOnce(undefined)
    await playEntryTts("entry-1", options)
    expect(fallbackSignal.aborted).toBe(true)

    download.finish(mocks.fileUrl)
    await firstRequest

    expect(mocks.streamPlay).toHaveBeenCalledTimes(2)
    expect(mocks.play).not.toHaveBeenCalled()
    expect(mocks.toastFetchError).not.toHaveBeenCalled()
  })

  it("cancels the fallback download of a replaced request without an error toast", async () => {
    const { playEntryTts } = await import("./entry-tts")
    const options = { toastTitle: "Read article" }

    const download = holdFallbackDownload({ failOnAbort: true })
    const firstRequest = playEntryTts("entry-1", options)
    const fallbackSignal = await download.signal()

    mocks.streamPlay.mockResolvedValueOnce(undefined)
    await playEntryTts("entry-2", options)
    await firstRequest

    expect(fallbackSignal.aborted).toBe(true)
    expect(mocks.play).not.toHaveBeenCalled()
    expect(mocks.toastFetchError).not.toHaveBeenCalled()
  })

  it("does not fall back when a stop or a newer request interrupts the stream", async () => {
    const { playEntryTts } = await import("./entry-tts")
    const { TtsStreamInterruptedError } = await import("./tts-stream-controller")

    mocks.streamPlay.mockRejectedValueOnce(new TtsStreamInterruptedError())
    await playEntryTts("entry-1", { toastTitle: "Read article" })

    expect(mocks.requestTtsFile).not.toHaveBeenCalled()
    expect(mocks.play).not.toHaveBeenCalled()
    expect(mocks.toastFetchError).not.toHaveBeenCalled()
  })

  it("cancels a fallback download that is still running when TTS is stopped", async () => {
    const { playEntryTts, stopEntryTts } = await import("./entry-tts")

    const download = holdFallbackDownload({ failOnAbort: true })
    const request = playEntryTts("entry-1", { toastTitle: "Read article" })
    const fallbackSignal = await download.signal()

    await stopEntryTts()
    await request

    expect(fallbackSignal.aborted).toBe(true)
    expect(mocks.streamStop).not.toHaveBeenCalled()
    expect(mocks.play).not.toHaveBeenCalled()
    expect(mocks.toastFetchError).not.toHaveBeenCalled()
  })

  it("pauses the native player once the stream starts", async () => {
    const { playEntryTts } = await import("./entry-tts")
    mocks.nativePlaying = true

    mocks.streamPlay.mockResolvedValueOnce(undefined)
    await playEntryTts("entry-1", { toastTitle: "Read article" })

    expect(mocks.pause).toHaveBeenCalledOnce()
    expect(mocks.requestTtsFile).not.toHaveBeenCalled()
  })

  it("stops the stream when native playback starts, e.g. a podcast or the lock screen", async () => {
    const { handleNativePlaybackStarted } = await import("./entry-tts")
    mocks.streamEntryId = "entry-1"

    await handleNativePlaybackStarted()

    expect(mocks.streamStop).toHaveBeenCalledOnce()
  })

  it("cancels a loading request when native playback starts after it", async () => {
    const { handleNativePlaybackStarted, playEntryTts } = await import("./entry-tts")

    const download = holdFallbackDownload({ failOnAbort: true })
    const request = playEntryTts("entry-1", { toastTitle: "Read article" })
    const fallbackSignal = await download.signal()

    await handleNativePlaybackStarted()
    await request

    expect(fallbackSignal.aborted).toBe(true)
    expect(mocks.play).not.toHaveBeenCalled()
    expect(mocks.toastFetchError).not.toHaveBeenCalled()
  })

  it("keeps a request made while native playback was already starting", async () => {
    const { handleNativePlaybackStarted, playEntryTts } = await import("./entry-tts")
    // A podcast was tapped and is still buffering when TTS is requested
    mocks.nativePlaying = true

    let startStream!: () => void
    mocks.streamPlay.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          startStream = resolve
        }),
    )
    const request = playEntryTts("entry-1", { toastTitle: "Read article" })
    await vi.waitFor(() => expect(mocks.streamPlay).toHaveBeenCalledOnce())
    mocks.streamEntryId = "entry-1"

    await handleNativePlaybackStarted()
    expect(mocks.streamStop).not.toHaveBeenCalled()

    startStream()
    await request
    expect(mocks.pause).toHaveBeenCalledOnce()
  })

  it("deletes the unused TTS files before downloading a fallback", async () => {
    const { playEntryTts } = await import("./entry-tts")
    mocks.activeItem = { mediaId: "file:///var/mobile/Library/Caches/tts/entry-0.mp3", url: "" }

    await playEntryTts("entry-1", { toastTitle: "Read article" })

    expect(mocks.pruneTtsCache).toHaveBeenCalledWith(
      "file:///var/mobile/Library/Caches/tts/entry-0.mp3",
    )
    expect(mocks.pruneTtsCache.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.requestTtsFile.mock.invocationCallOrder[0]!,
    )
  })

  it("keeps the TTS files until the native player is set up", async () => {
    const { pruneUnusedTtsFiles } = await import("./entry-tts")
    mocks.playerRegistered = false

    pruneUnusedTtsFiles()

    expect(mocks.pruneTtsCache).not.toHaveBeenCalled()
  })
})
