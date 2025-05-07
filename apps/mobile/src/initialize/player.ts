import TrackPlayer, { Capability, Event } from "react-native-track-player"

export async function initializePlayer() {
  TrackPlayer.registerPlaybackService(() => async () => {
    TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play())
    TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause())
    TrackPlayer.addEventListener(Event.RemoteStop, () => TrackPlayer.stop())
    TrackPlayer.addEventListener(Event.RemoteNext, () => TrackPlayer.skipToNext())
    TrackPlayer.addEventListener(Event.RemotePrevious, () => TrackPlayer.skipToPrevious())
    TrackPlayer.addEventListener(Event.RemoteSeek, ({ position }) => TrackPlayer.seekTo(position))
  })

  await TrackPlayer.setupPlayer()

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
