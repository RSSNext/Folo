import { FeedViewType } from "@follow/constants"
import { useEvent } from "expo"
import type { VideoSource } from "expo-video"
import { useVideoPlayer, VideoView } from "expo-video"
import { useCallback, useMemo, useRef, useState } from "react"
import type { ViewStyle } from "react-native"
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
      try {
        videoViewRef.current?.enterFullscreen()
        player.muted = false
        player.play()
      } catch (e) {
        console.warn("VideoPlayer fullscreen failed:", e)
      }
    }, 0)
  }, [player])
  const videoStyle = useMemo<ViewStyle>(
    () => ({
      width: view === FeedViewType.Pictures ? width : "100%",
      height: view === FeedViewType.Pictures ? height : undefined,
      aspectRatio: width && height ? width / height : 1,
    }),
    [height, view, width],
  )

  return (
    <View className="flex flex-1">
      <VideoView
        ref={videoViewRef}
        style={videoStyle}
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
          try {
            player.muted = true
            player.pause()
          } catch (e) {
            console.warn("VideoPlayer pause failed:", e)
          }
        }}
      />
      {status !== "readyToPlay" && <View className="absolute inset-0">{placeholder}</View>}
      <PlayerAction
        iconSize={32}
        mediaState={status === "readyToPlay" ? "paused" : "loading"}
        onPress={handlePressPlay}
      />
    </View>
  )
}
