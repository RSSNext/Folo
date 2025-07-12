import { FeedViewType } from "@follow/constants"
import { useEvent } from "expo"
import type { VideoSource } from "expo-video"
import { useVideoPlayer, VideoView } from "expo-video"
import { useCallback, useRef, useState } from "react"
import { View } from "react-native"

import { isIOS } from "@/src/lib/platform"

import { PlayerAction } from "./PlayerAction"

export function VideoPlayer({
  source,
  placeholder,
  width,
  height,
  view,
}: {
  source: VideoSource
  placeholder?: React.ReactNode
  width?: number
  height?: number
  view: FeedViewType
}) {
  const [isFullScreen, setIsFullScreen] = useState(false)
  const videoViewRef = useRef<null | VideoView>(null)
  const player = useVideoPlayer(source, (player) => {
    player.loop = true
    player.muted = true
    // player.play()
  })
  const { status } = useEvent(player, "statusChange", { status: player.status })

  const handlePressPlay = useCallback(() => {
    if (!videoViewRef.current) {
      console.warn("VideoView ref is not set")
      return
    }
    setIsFullScreen(true)
    // Ensure the nativeControls is ready before entering fullscreen for Android
    setTimeout(() => {
      videoViewRef.current?.enterFullscreen()
      player.muted = false
      player.play()
    }, 0)
  }, [player])

  return (
    <View className="flex flex-1">
      <VideoView
        ref={videoViewRef}
        style={{
          width: view === FeedViewType.Pictures ? width : "100%",
          height: view === FeedViewType.Pictures ? height : undefined,
          aspectRatio: width && height ? width / height : 1,
        }}
        contentFit={isFullScreen ? "contain" : "cover"}
        player={player}
        allowsFullscreen
        allowsPictureInPicture
        // The Android native controls will be shown when the video is paused
        nativeControls={isIOS || isFullScreen}
        accessible={false}
        onFullscreenEnter={() => {
          setIsFullScreen(true)
        }}
        onFullscreenExit={() => {
          setIsFullScreen(false)
          player.muted = true
          player.pause()
        }}
      />
      {status !== "readyToPlay" && <View className="absolute inset-0">{placeholder}</View>}
      <PlayerAction
        iconSize={32}
        isPlaying={false}
        isLoading={status !== "readyToPlay"}
        onPress={handlePressPlay}
      />
    </View>
  )
}
