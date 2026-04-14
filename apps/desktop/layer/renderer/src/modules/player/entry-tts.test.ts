import { defaultGeneralSettings } from "@follow/shared/settings/defaults"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { playEntryTts } from "./entry-tts"

const {
  getEntryMock,
  getGeneralSettingsMock,
  getReadabilityStatusMock,
  legacyTtsMock,
  mountMock,
  toastFetchErrorMock,
} = vi.hoisted(() => ({
  getEntryMock: vi.fn(),
  getGeneralSettingsMock: vi.fn(),
  getReadabilityStatusMock: vi.fn(),
  legacyTtsMock: vi.fn(),
  mountMock: vi.fn(),
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
    mount: mountMock,
  },
  getAudioPlayerAtomValue: vi.fn(() => ({})),
  setAudioPlayerAtomValue: vi.fn(),
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
})
