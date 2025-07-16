import type { AttachmentsModel } from "@follow/database/schemas/types"
import { atom, useAtom } from "jotai"
import { useCallback, useEffect } from "react"
import TrackPlayer, { State, useActiveTrack, usePlaybackState } from "react-native-track-player"

import { PlayerRegistered } from "../initialize/player"
import { toast } from "./toast"

const LOADING_SUFFIX = "_loading"

export function usePlayingUrl() {
  const activeTrack = useActiveTrack()
  const playerState = usePlaybackState()
  const isPlaying = !!activeTrack?.url && playerState.state === State.Playing
  const isLoading = playerState.state === State.Buffering || playerState.state === State.Loading
  return isPlaying ? activeTrack?.url : isLoading ? `${activeTrack?.url}${LOADING_SUFFIX}` : null
}

export function getAttachmentState(playingUrl?: string, attachment?: AttachmentsModel) {
  if (!playingUrl || !attachment || !attachment.mime_type?.startsWith("audio/")) {
    return null
  }
  const isPlaying = attachment.url === playingUrl
  const isLoading = playingUrl === `${attachment.url}${LOADING_SUFFIX}`
  return isPlaying ? "playing" : isLoading ? "loading" : null
}

class Player {
  async play(newTrack?: {
    url: string
    title?: string | null
    artist?: string | null
    artwork?: string | null
  }) {
    if (!PlayerRegistered) {
      toast.error("Player is not registered. Please wait for the app to initialize.")
    }
    if (newTrack) {
      const activeTrack = await TrackPlayer.getActiveTrack()
      if (activeTrack?.url !== newTrack.url) {
        const { url, title, artist, artwork } = newTrack

        await TrackPlayer.load({
          url,
          title: title ?? "Unknown Title",
          artist: artist ?? "Unknown Artist",
          artwork: artwork ?? undefined,
        })
      }
    }

    await TrackPlayer.play()
  }

  async pause() {
    await TrackPlayer.pause()
  }

  async reset() {
    await TrackPlayer.reset()
  }

  async seekBy(offset: number) {
    await TrackPlayer.seekBy(offset)
  }

  async seekTo(position: number) {
    await TrackPlayer.seekTo(position)
  }
}

export const player = new Player()

export { useActiveTrack, useIsPlaying, useProgress } from "react-native-track-player"

export const allowedRate = [0.75, 1, 1.25, 1.5, 1.75, 2]
export type Rate = (typeof allowedRate)[number]

const rateAtom = atom<Rate>(1)

export function useRate() {
  const [rate, setRate] = useAtom(rateAtom)

  useEffect(() => {
    async function getRate() {
      const rate = await TrackPlayer.getRate()
      if (allowedRate.includes(rate)) {
        setRate(rate as Rate)
      } else {
        setRate(1)
      }
    }

    getRate()
  }, [setRate])

  const setRateAndSave = useCallback(
    async (rate: Rate) => {
      if (allowedRate.includes(rate)) {
        await TrackPlayer.setRate(rate)
        setRate(rate)
      }
    },
    [setRate],
  )

  return [rate, setRateAndSave] as const
}
