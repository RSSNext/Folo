import type { MediaItem } from "@rntp/player"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => {
  const state = {
    registered: true,
    activeItem: null as MediaItem | null,
    nativePlaying: false,
    playbackState: "idle",
  }
  const sequence: string[] = []
  return {
    state,
    sequence,
    native: {
      getActiveMediaItem: vi.fn(() => state.activeItem),
      getPlaybackState: vi.fn(() => state.playbackState),
      isPlaying: vi.fn(() => state.nativePlaying),
      setMediaItem: vi.fn((item: MediaItem) => {
        state.activeItem = item
        sequence.push("load")
      }),
      play: vi.fn(() => {
        sequence.push("play")
      }),
      pause: vi.fn(() => {
        state.nativePlaying = false
      }),
      clear: vi.fn(() => {
        state.activeItem = null
        state.nativePlaying = false
      }),
      setupPlayer: vi.fn(),
      destroy: vi.fn(),
    },
    toastError: vi.fn(),
  }
})

vi.mock("@rntp/player", () => ({
  default: mocks.native,
  PlaybackState: {
    Idle: "idle",
    Ready: "ready",
    Buffering: "buffering",
    Ended: "ended",
    Error: "error",
  },
  useActiveMediaItem: vi.fn(),
  useIsPlaying: vi.fn(),
  usePlaybackState: vi.fn(),
  useProgress: vi.fn(),
}))

vi.mock("@follow/utils", async () => {
  const { createStore } = await import("jotai/vanilla")
  return { jotaiStore: createStore() }
})

vi.mock("../initialize/player", () => ({
  get PlayerRegistered() {
    return mocks.state.registered
  },
}))

vi.mock("../modules/player/tts-stream-controller", () => ({
  ttsStreamController: {},
}))

vi.mock("./toast", () => ({
  toast: { error: mocks.toastError },
}))

vi.mock("i18next", () => ({
  t: (key: string) => key,
}))

describe("player", () => {
  let player: (typeof import("./player"))["player"]

  beforeEach(async () => {
    vi.resetModules()
    vi.clearAllMocks()
    mocks.state.registered = true
    mocks.state.activeItem = null
    mocks.state.nativePlaying = false
    mocks.state.playbackState = "idle"
    mocks.sequence.length = 0
    const playerModule = await import("./player")
    player = playerModule.player
  })

  it("loads a new media item with V5 artwork metadata before starting playback", async () => {
    mocks.state.activeItem = { url: "https://example.com/previous.mp3" }

    await player.play({
      url: "https://example.com/podcast.mp3",
      title: "Podcast Episode",
      artist: "Podcast Author",
      artwork: "https://example.com/cover.jpg",
    })

    expect(mocks.native.setMediaItem).toHaveBeenCalledWith({
      mediaId: "https://example.com/podcast.mp3",
      url: "https://example.com/podcast.mp3",
      title: "Podcast Episode",
      artist: "Podcast Author",
      artworkUrl: "https://example.com/cover.jpg",
    })
    expect(mocks.sequence).toEqual(["load", "play"])
  })

  it("supplies display defaults when media metadata is missing", async () => {
    await player.play({
      url: "https://example.com/audio.mp3",
      title: null,
      artist: null,
      artwork: null,
    })

    expect(mocks.native.setMediaItem).toHaveBeenCalledWith({
      mediaId: "https://example.com/audio.mp3",
      url: "https://example.com/audio.mp3",
      title: "player.unknown_title",
      artist: "player.unknown_artist",
      artworkUrl: undefined,
    })
  })

  it("resumes the active URL without replacing its queue item or resetting progress", async () => {
    mocks.state.activeItem = {
      mediaId: "https://example.com/audio.mp3",
      url: "https://example.com/audio.mp3",
    }

    await player.play({ url: "https://example.com/audio.mp3" })

    expect(mocks.native.setMediaItem).not.toHaveBeenCalled()
    expect(mocks.sequence).toEqual(["play"])
  })

  it("resumes a local file when iOS returns its URL as a decoded filesystem path", async () => {
    const url = "file:///var/mobile/Library/Caches/tts/entry%201.mp3"
    await player.play({ url })

    expect(mocks.native.setMediaItem).toHaveBeenCalledWith(
      expect.objectContaining({ mediaId: url }),
    )

    mocks.state.activeItem = {
      mediaId: url,
      url: "/var/mobile/Library/Caches/tts/entry 1.mp3",
    }
    mocks.native.setMediaItem.mockClear()
    mocks.sequence.length = 0

    await player.play({ url })

    expect(mocks.native.setMediaItem).not.toHaveBeenCalled()
    expect(mocks.sequence).toEqual(["play"])
  })

  it("pauses and clears media without destroying the initialized player", async () => {
    const track = { url: "https://example.com/audio.mp3" }
    await player.play(track)

    await player.pause()

    expect(mocks.native.pause).toHaveBeenCalledOnce()
    expect(mocks.state.activeItem?.url).toBe(track.url)

    await player.reset()

    expect(mocks.native.clear).toHaveBeenCalledOnce()
    expect(mocks.state.activeItem).toBeNull()
    expect(mocks.native.destroy).not.toHaveBeenCalled()
    expect(mocks.native.setupPlayer).not.toHaveBeenCalled()

    await player.play(track)

    expect(mocks.native.setMediaItem).toHaveBeenCalledTimes(2)
    expect(mocks.native.play).toHaveBeenCalledTimes(2)
    expect(mocks.toastError).not.toHaveBeenCalled()
  })

  it("keeps buffering pausable and distinguishes explicit pause from pending playback", async () => {
    mocks.state.playbackState = "buffering"
    expect(player.isPlaying()).toBe(true)

    await player.pause()
    expect(player.isPlaying()).toBe(false)

    await player.play()
    expect(player.isPlaying()).toBe(true)

    mocks.state.playbackState = "ready"
    mocks.state.nativePlaying = true
    expect(player.isPlaying()).toBe(true)

    await player.pause()
    expect(player.isPlaying()).toBe(false)
  })

  it("shows an initialization error without calling native APIs before registration", async () => {
    mocks.state.registered = false

    await player.play({ url: "https://example.com/audio.mp3" })

    expect(mocks.toastError).toHaveBeenCalledOnce()
    for (const nativeMethod of Object.values(mocks.native)) {
      expect(nativeMethod).not.toHaveBeenCalled()
    }
  })
})
