import { AppState, Platform } from "react-native"
import TrackPlayer, { Capability, Event } from "react-native-track-player"

export let PlayerRegistered = false

function waitForForeground(): Promise<void> {
  if (AppState.currentState === "active") return Promise.resolve()
  return new Promise((resolve) => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        sub.remove()
        resolve()
      }
    })
  })
}

export async function initializePlayer() {
  TrackPlayer.registerPlaybackService(() => async () => {
    TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play())
    TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause())
    TrackPlayer.addEventListener(Event.RemoteStop, () => TrackPlayer.stop())
    TrackPlayer.addEventListener(Event.RemoteNext, () => TrackPlayer.skipToNext())
    TrackPlayer.addEventListener(Event.RemotePrevious, () => TrackPlayer.skipToPrevious())
    TrackPlayer.addEventListener(Event.RemoteSeek, ({ position }) => TrackPlayer.seekTo(position))
  })

  // On Android, setupPlayer must be called in the foreground to avoid
  // ForegroundServiceStartNotAllowedException
  if (Platform.OS === "android") {
    await waitForForeground()
  }

  const setup = async (retry = 10) => {
    if (retry <= 0) {
      console.error("Failed to setup player after multiple attempts")
      return
    }
    try {
      await TrackPlayer.setupPlayer()
      PlayerRegistered = true
    } catch (_err) {
      const err = _err as Error & { code?: string }
      console.error("Failed to setup player:", "Code:", err.code, err.message)

      if (err.code === "android_cannot_setup_player_in_background") {
        await waitForForeground()
        await setup(retry - 1)
      }
    }
  }

  await setup()

  if (!PlayerRegistered) return

  await TrackPlayer.updateOptions({
    capabilities: [
      Capability.Play,
      Capability.Pause,
      Capability.SkipToNext,
      Capability.SkipToPrevious,
      Capability.Stop,
      Capability.SeekTo,
    ],
    compactCapabilities: [Capability.Play, Capability.Pause],
  })
}
