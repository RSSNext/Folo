import { useVideoPlayer, VideoView } from "expo-video"
import { useRef, useState } from "react"

import { NativePressable } from "@/src/components/ui/pressable/NativePressable"

export function VideoPlayer({
  source,
  width,
  height,
}: {
  source: string
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
    </NativePressable>
  )
}
