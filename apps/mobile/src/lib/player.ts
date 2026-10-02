import { jotaiStore } from "@follow/utils"
import TrackPlayer, {
  PlaybackState,
  useActiveMediaItem,
  useIsPlaying as useNativeIsPlaying,
  usePlaybackState,
} from "@rntp/player"
import { t } from "i18next"
import { atom, useAtom } from "jotai"
import { useCallback, useEffect, useSyncExternalStore } from "react"

import { PlayerRegistered } from "../initialize/player"
import { ttsStreamController } from "../modules/player/tts-stream-controller"
import { toast } from "./toast"

export type SimpleMediaState = "playing" | "paused" | "loading"

const pausedByUserAtom = atom(false)

function usePlaybackStatus() {
  const playing = useNativeIsPlaying()
  const playbackState = usePlaybackState()
  const [pausedByUser, setPausedByUser] = useAtom(pausedByUserAtom)

  useEffect(() => {
    if (playing) setPausedByUser(false)
  }, [playing, setPausedByUser])

  // V5 reports actual audio output, so buffering must remain separately pausable.
  const buffering = playbackState === PlaybackState.Buffering && !pausedByUser
  return { playing: playing || buffering, buffering }
}

export function useIsPlaying() {
  return usePlaybackStatus().playing
}

export function useAudioPlayState(audioUrl?: string): SimpleMediaState {
  const { playing, buffering } = usePlaybackStatus()
  const activeTrack = useActiveMediaItem()
  const playingMediaId = activeTrack?.mediaId

  const isCurrentTrack = !audioUrl || playingMediaId === audioUrl
  if (!playingMediaId || !isCurrentTrack) {
    // By default the audio should be in "paused" state
    return "paused"
  }

  if (buffering) {
    return "loading"
  }
  return playing ? "playing" : "paused"
}

class Player {
  isPlaying() {
    return (
      TrackPlayer.isPlaying() ||
      (TrackPlayer.getPlaybackState() === PlaybackState.Buffering &&
        !jotaiStore.get(pausedByUserAtom))
    )
  }

  async play(newTrack?: {
    url: string
    title?: string | null
    artist?: string | null
    artwork?: string | null
  }) {
    if (!PlayerRegistered) {
      toast.error(t("player.not_ready"))
      return
    }
    if (newTrack) {
      const activeTrack = TrackPlayer.getActiveMediaItem()
      if (activeTrack?.mediaId !== newTrack.url) {
        const { url, title, artist, artwork } = newTrack

        // Keep identity stable when native playback normalizes local file URLs.
        TrackPlayer.setMediaItem({
          mediaId: url,
          url,
          title: title ?? t("player.unknown_title"),
          artist: artist ?? t("player.unknown_artist"),
          artworkUrl: artwork ?? undefined,
        })
      }
    }

    TrackPlayer.play()
    jotaiStore.set(pausedByUserAtom, false)
  }

  async pause() {
    TrackPlayer.pause()
    jotaiStore.set(pausedByUserAtom, true)
  }

  async reset() {
    TrackPlayer.clear()
    jotaiStore.set(pausedByUserAtom, true)
  }

  async seekBy(offset: number) {
    TrackPlayer.seekBy(offset)
  }

  async seekTo(position: number) {
    TrackPlayer.seekTo(position)
  }
}

export const player = new Player()

export { useProgress } from "@rntp/player"

export interface ActivePlayable {
  artwork?: string | null
  artist?: string | null
  entryId?: string | null
  kind: "track-player" | "tts-stream"
  title: string
}

export function useTtsStreamPlayback() {
  return useSyncExternalStore(ttsStreamController.subscribe, ttsStreamController.getState)
}

export function useActivePlayable(): ActivePlayable | null {
  const activeTrack = useActiveMediaItem()
  const ttsStream = useTtsStreamPlayback()

  if (ttsStream.entryId) {
    return {
      artwork: ttsStream.artwork,
      artist: ttsStream.artist,
      entryId: ttsStream.entryId,
      kind: "tts-stream",
      title: ttsStream.title ?? "TTS",
    }
  }

  if (!activeTrack) {
    return null
  }

  return {
    artwork: typeof activeTrack.artworkUrl === "string" ? activeTrack.artworkUrl : undefined,
    artist: activeTrack.artist,
    entryId: null,
    kind: "track-player",
    title: activeTrack.title ?? t("player.unknown_title"),
  }
}

export const allowedRate = [0.75, 1, 1.25, 1.5, 1.75, 2]
export type Rate = (typeof allowedRate)[number]

const rateAtom = atom<Rate>(1)

export function useRate() {
  const [rate, setRate] = useAtom(rateAtom)

  useEffect(() => {
    function getRate() {
      const rate = TrackPlayer.getPlaybackSpeed()
      if (allowedRate.includes(rate)) {
        setRate(rate as Rate)
      } else {
        setRate(1)
      }
    }

    getRate()
  }, [setRate])

  const setRateAndSave = useCallback(
    (rate: Rate) => {
      if (allowedRate.includes(rate)) {
        TrackPlayer.setPlaybackSpeed(rate)
        setRate(rate)
      }
    },
    [setRate],
  )

  return [rate, setRateAndSave] as const
}
