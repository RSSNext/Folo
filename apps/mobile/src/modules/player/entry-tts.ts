import { getEntry } from "@follow/store/entry/getter"
import TrackPlayer from "@rntp/player"

import { getGeneralSettings } from "@/src/atoms/settings/general"
import { PlayerRegistered } from "@/src/initialize/player"
import { toastFetchError } from "@/src/lib/error-parser"
import { player } from "@/src/lib/player"
import { getPreferredFeedTitle } from "@/src/modules/feed/feed-title"

import { getEntryTtsText, pruneTtsCache, requestTtsFile } from "./tts-service"
import { ttsStreamController, TtsStreamInterruptedError } from "./tts-stream-controller"

interface PendingTtsRequest {
  controller: AbortController
  // Native playback was already playing or starting when TTS was requested
  overNativePlayback: boolean
}

let activeTtsEntryId: string | null = null
let activeTtsTrackUrl: string | null = null
// The request that is still loading, aborted when a newer request, a stop or native playback
// replaces it
let pendingTtsRequest: PendingTtsRequest | null = null

const isSameEntryTtsTrack = async (entryId: string) => {
  if (ttsStreamController.canToggleEntry(entryId)) {
    return true
  }

  if (!activeTtsEntryId || !activeTtsTrackUrl || activeTtsEntryId !== entryId) {
    return false
  }

  const activeTrack = TrackPlayer.getActiveMediaItem()
  return activeTrack?.mediaId === activeTtsTrackUrl
}

const toggleEntryTtsPlayback = async (entryId: string) => {
  if (ttsStreamController.canToggleEntry(entryId)) {
    await ttsStreamController.toggle(entryId)
    return
  }

  if (player.isPlaying()) {
    await player.pause()
    return
  }

  await player.play()
}

/** Stops the TTS stream and cancels a loading TTS request, including its fallback download. */
export const stopEntryTts = async () => {
  pendingTtsRequest?.controller.abort()
  pendingTtsRequest = null

  if (ttsStreamController.getState().entryId) {
    await ttsStreamController.stop()
  }
}

/**
 * Native playback (a podcast, the lock screen) took over the speaker, so TTS stops. A TTS request
 * made while that playback was already starting is the newer one, so its stream pauses native
 * playback instead.
 */
export const handleNativePlaybackStarted = async () => {
  if (pendingTtsRequest?.overNativePlayback) {
    return
  }

  await stopEntryTts()
}

/** Deletes the cached TTS files, except the one the native player holds. */
export const pruneUnusedTtsFiles = () => {
  // Until it is set up in this runtime, the native player can't tell which file it still plays,
  // e.g. an Android playback service that outlived the previous runtime
  if (!PlayerRegistered) {
    return
  }

  let activeItem: ReturnType<typeof TrackPlayer.getActiveMediaItem>
  try {
    activeItem = TrackPlayer.getActiveMediaItem()
  } catch {
    return
  }

  pruneTtsCache(activeItem?.mediaId)
}

export const playEntryTts = async (
  entryId: string,
  {
    preferReadability = false,
    toastTitle,
  }: {
    preferReadability?: boolean
    toastTitle: string
  },
) => {
  pendingTtsRequest?.controller.abort()
  const request: PendingTtsRequest = {
    controller: new AbortController(),
    overNativePlayback: player.isPlaying(),
  }
  pendingTtsRequest = request
  const { signal } = request.controller

  try {
    if (await isSameEntryTtsTrack(entryId)) {
      await toggleEntryTtsPlayback(entryId)
      return
    }

    const entry = getEntry(entryId)
    if (!entry) {
      throw new Error("Entry not found")
    }

    const text = getEntryTtsText(entry, { preferReadability })
    if (!text) {
      throw new Error("No content available for TTS")
    }

    const { voice } = getGeneralSettings()
    const artist = getPreferredFeedTitle(entry.feedId) ?? "Folo"
    try {
      await ttsStreamController.play({
        artwork: entry.media?.find((media) => media.type === "photo")?.url ?? null,
        artist,
        entryId,
        text,
        title: entry.title || toastTitle,
        voice,
      })

      // The stream is what plays now, so don't let the native player play over it
      activeTtsEntryId = entryId
      activeTtsTrackUrl = null
      if (player.isPlaying()) {
        await player.pause()
      }
      return
    } catch (error) {
      // A newer request or a stop replaced this one, so it must not fall back and play later
      if (signal.aborted || error instanceof TtsStreamInterruptedError) {
        return
      }
      // Otherwise fall back to the buffered native player, e.g. when the WebView is not ready
    }

    // Runs before the download, so the new file can't be mistaken for an unused one
    pruneUnusedTtsFiles()
    const trackUrl = await requestTtsFile({
      cacheKey: entryId,
      signal,
      text,
      voice,
    })
    // The whole file can take minutes to download, long enough for a newer request or a stop
    if (signal.aborted) {
      return
    }

    await player.play({
      artwork: entry.media?.find((media) => media.type === "photo")?.url ?? undefined,
      artist,
      title: entry.title || toastTitle,
      url: trackUrl,
    })

    activeTtsEntryId = entryId
    activeTtsTrackUrl = trackUrl
  } catch (error) {
    if (signal.aborted) {
      return
    }

    toastFetchError(error as Error, { title: toastTitle })
  } finally {
    if (pendingTtsRequest === request) {
      pendingTtsRequest = null
    }
  }
}
