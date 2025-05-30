import { FeedViewType } from "@follow/constants"
import { useEvent } from "expo"
import type { VideoSource } from "expo-video"
import { useVideoPlayer, VideoView } from "expo-video"
import { useRef, useState } from "react"
import { View } from "react-native"

import { NativePressable } from "@/src/components/ui/pressable/NativePressable"

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
    player.play()
  })
  const { status } = useEvent(player, "statusChange", { status: player.status })
  return (
    <NativePressable
      onPress={() => {
        if (!videoViewRef.current) {
          console.warn("VideoView ref is not set")
          return
        }
        videoViewRef.current?.enterFullscreen()
        player.muted = false
      }}
    >
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
        nativeControls={isFullScreen}
        onFullscreenEnter={() => {
          setIsFullScreen(true)
        }}
        onFullscreenExit={() => {
          setIsFullScreen(false)
          player.muted = true
        }}
      />
      {status !== "readyToPlay" && <View className="absolute inset-0">{placeholder}</View>}
    </NativePressable>
  )
}
