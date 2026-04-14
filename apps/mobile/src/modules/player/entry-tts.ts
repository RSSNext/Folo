import { getEntry } from "@follow/store/entry/getter"
import { getFeedById } from "@follow/store/feed/getter"
import TrackPlayer, { State } from "react-native-track-player"

import { getGeneralSettings } from "@/src/atoms/settings/general"
import { toastFetchError } from "@/src/lib/error-parser"
import { player } from "@/src/lib/player"

import { getEntryTtsText, requestTtsFile } from "./tts-service"
import { ttsStreamController } from "./tts-stream-controller"

let activeTtsEntryId: string | null = null
let activeTtsTrackUrl: string | null = null

const isSameEntryTtsTrack = async (entryId: string) => {
  if (ttsStreamController.canToggleEntry(entryId)) {
    return true
  }

  if (!activeTtsEntryId || !activeTtsTrackUrl || activeTtsEntryId !== entryId) {
    return false
  }

  const activeTrack = await TrackPlayer.getActiveTrack()
  return activeTrack?.url === activeTtsTrackUrl
}

const toggleCurrentTtsPlayback = async () => {
  if (activeTtsEntryId && ttsStreamController.canToggleEntry(activeTtsEntryId)) {
    await ttsStreamController.toggle(activeTtsEntryId)
    return
  }

  const { state } = await TrackPlayer.getPlaybackState()

  if ([State.Playing, State.Buffering, State.Loading].includes(state)) {
    await TrackPlayer.pause()
    return
  }

  await TrackPlayer.play()
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
  try {
    if (await isSameEntryTtsTrack(entryId)) {
      await toggleCurrentTtsPlayback()
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
    const feed = getFeedById(entry.feedId)
    try {
      await ttsStreamController.play({
        artwork: entry.media?.find((media) => media.type === "photo")?.url ?? null,
        artist: feed?.title ?? "Folo",
        entryId,
        text,
        title: entry.title || toastTitle,
        voice,
      })

      activeTtsEntryId = entryId
      activeTtsTrackUrl = null
      return
    } catch {
      // Fall back to the buffered native player when the streaming WebView is not ready.
    }

    const trackUrl = await requestTtsFile({
      cacheKey: entryId,
      text,
      voice,
    })

    await player.play({
      artwork: entry.media?.find((media) => media.type === "photo")?.url ?? undefined,
      artist: feed?.title ?? "Folo",
      title: entry.title || toastTitle,
      url: trackUrl,
    })

    activeTtsEntryId = entryId
    activeTtsTrackUrl = trackUrl
  } catch (error) {
    toastFetchError(error as Error, { title: toastTitle })
  }
}
