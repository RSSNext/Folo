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
}: {
  source: VideoSource
  placeholder?: React.ReactNode
  width?: number
  height?: number
}) {
  const [isFullScreen, setIsFullScreen] = useState(false)
  const viewViewRef = useRef<null | VideoView>(null)
  const player = useVideoPlayer(source, (player) => {
    player.loop = true
    player.muted = true
    player.play()
  })
  const { status } = useEvent(player, "statusChange", { status: player.status })
  return (
    <NativePressable
      onPress={() => {
        viewViewRef.current?.enterFullscreen()
        player.muted = false
      }}
    >
      <VideoView
        ref={viewViewRef}
        style={{
          width: "100%",
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
