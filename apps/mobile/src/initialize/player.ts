import { sleep } from "@follow/utils"
import TrackPlayer, { Capability, Event } from "react-native-track-player"

export let PlayerRegistered = false

export async function initializePlayer() {
  TrackPlayer.registerPlaybackService(() => async () => {
    TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play())
    TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause())
    TrackPlayer.addEventListener(Event.RemoteStop, () => TrackPlayer.stop())
    TrackPlayer.addEventListener(Event.RemoteNext, () => TrackPlayer.skipToNext())
    TrackPlayer.addEventListener(Event.RemotePrevious, () => TrackPlayer.skipToPrevious())
    TrackPlayer.addEventListener(Event.RemoteSeek, ({ position }) => TrackPlayer.seekTo(position))
  })

  const setup = async (retry = 60) => {
    if (retry <= 0) {
      console.error("Failed to setup player after multiple attempts")
    }
    try {
      await TrackPlayer.setupPlayer()
      PlayerRegistered = true
    } catch (_err) {
      const err = _err as Error & { code?: string }
      console.error("Failed to setup player:", "Code:", err.code, err.message)

      // `setupPlayer` must be called when app is in the foreground, otherwise,
      // an `'android_cannot_setup_player_in_background'` error will be thrown.
      // Learn more: https://rntp.dev/docs/api/functions/lifecycle#setupplayeroptions-playeroptions
      if (err.code === "android_cannot_setup_player_in_background") {
        // Timeouts will only execute when the app is in the foreground. If
        // it somehow executes in the background, the promise will be rejected
        // and we'll try this again.
        await sleep(1000)
        await setup(retry - 1)
      }
    }
  }

  await setup()

  await TrackPlayer.updateOptions({
    // Media controls capabilities
    capabilities: [
      Capability.Play,
      Capability.Pause,
      Capability.SkipToNext,
      Capability.SkipToPrevious,
      Capability.Stop,
      Capability.SeekTo,
    ],

    // Capabilities that will show up when the notification is in the compact form on Android
    compactCapabilities: [Capability.Play, Capability.Pause],
  })
}
