import { cn } from "@follow/utils"
import { useCallback } from "react"
import { StyleSheet, View } from "react-native"

import { ThemedBlurView } from "@/src/components/common/ThemedBlurView"
import { PlatformActivityIndicator } from "@/src/components/ui/loading/PlatformActivityIndicator"
import { PauseCuteFiIcon } from "@/src/icons/pause_cute_fi"
import { PlayCuteFiIcon } from "@/src/icons/play_cute_fi"
import type { SimpleMediaState } from "@/src/lib/player"

import { NativePressable } from "../pressable/NativePressable"

interface PlayerActionProps {
  /**
   * This is the state of the media instead of the play button.
   *
   * When the media is paused, the play button should be shown.
   */
  mediaState: SimpleMediaState
  onPress: () => void
  className?: string
  iconSize?: number
  buttonClassName?: string
}

export function PlayerAction({
  mediaState,
  onPress,
  className = "",
  iconSize = 24,
  buttonClassName = "",
}: PlayerActionProps) {
  const handlePressPlay = useCallback(() => {
    onPress()
  }, [onPress])

  let playButtonIcon = <PlayCuteFiIcon color="white" width={iconSize} height={iconSize} />
  switch (mediaState) {
    case "playing": {
      playButtonIcon = <PauseCuteFiIcon color="white" width={iconSize} height={iconSize} />
      break
    }
    case "loading": {
      playButtonIcon = <PlatformActivityIndicator />
      break
    }
  }

  return (
    <NativePressable
      className={cn("absolute inset-0 flex items-center justify-center", className)}
      onPress={handlePressPlay}
    >
      <View className={cn("overflow-hidden rounded-full p-2", buttonClassName)}>
        <ThemedBlurView
          style={StyleSheet.absoluteFillObject}
          intensity={30}
          experimentalBlurMethod="none"
        />
        {playButtonIcon}
      </View>
    </NativePressable>
  )
}
