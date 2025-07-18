import { cn } from "@follow/utils"
import { useCallback } from "react"
import { StyleSheet, View } from "react-native"

import { ThemedBlurView } from "@/src/components/common/ThemedBlurView"
import { PlatformActivityIndicator } from "@/src/components/ui/loading/PlatformActivityIndicator"
import { PauseCuteFiIcon } from "@/src/icons/pause_cute_fi"
import { PlayCuteFiIcon } from "@/src/icons/play_cute_fi"

import { NativePressable } from "../pressable/NativePressable"

interface PlayerActionProps {
  isPlaying: boolean
  isLoading?: boolean
  onPress: () => void
  className?: string
  iconSize?: number
  buttonClassName?: string
}

export function PlayerAction({
  isPlaying,
  isLoading = false,
  onPress,
  className = "",
  iconSize = 24,
  buttonClassName = "",
}: PlayerActionProps) {
  const handlePressPlay = useCallback(() => {
    onPress()
  }, [onPress])

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
        {isPlaying ? (
          <PauseCuteFiIcon color="white" width={iconSize} height={iconSize} />
        ) : isLoading ? (
          <PlatformActivityIndicator />
        ) : (
          <PlayCuteFiIcon color="white" width={iconSize} height={iconSize} />
        )}
      </View>
    </NativePressable>
  )
}
