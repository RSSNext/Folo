import { cn } from "@follow/utils"
import { LinearGradient } from "expo-linear-gradient"
import { use, useEffect, useMemo } from "react"
import { StyleSheet, useWindowDimensions, View } from "react-native"
import Reanimated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { SheetScreen } from "react-native-sheet-transitions"

import { Text } from "@/src/components/ui/typography/Text"
import { useNavigation } from "@/src/lib/navigation/hooks"
import { ScreenItemContext } from "@/src/lib/navigation/ScreenItemContext"

import { gentleSpringPreset } from "../constants/spring"
import type { NavigationControllerView } from "../lib/navigation/types"
import type { ActivePlayable } from "../lib/player"
import { useActivePlayable, useIsPlaying, useTtsStreamPlayback } from "../lib/player"
import { PlayerScreenContext, usePlayerScreenContext } from "../modules/player/context"
import { ControlGroup, ProgressBar, VolumeBar } from "../modules/player/control"
import { useCoverGradient } from "../modules/player/hooks"
import { PlayerArtwork } from "../modules/player/PlayerArtwork"
import { usePrefetchImageColors } from "../store/image/hooks"

function CoverArt({ playable }: { playable: ActivePlayable }) {
  // The cover is 87% of the screen wide
  const coverSize = Math.round(useWindowDimensions().width * 0.87)
  const scale = useSharedValue(1)
  const ttsStream = useTtsStreamPlayback()
  const playing = useIsPlaying()
  const isPlaying = ttsStream.entryId ? ttsStream.status === "playing" : playing
  useEffect(() => {
    cancelAnimation(scale)
    scale.value = withSpring(isPlaying ? 1 : 0.7, gentleSpringPreset)
  }, [isPlaying, scale])
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: scale.value,
        },
      ],
    }
  })
  return (
    <Reanimated.View className="mx-auto my-12 aspect-square w-[87%] shadow" style={[animatedStyle]}>
      <PlayerArtwork playable={playable} size={coverSize} className="size-full rounded-lg" />
    </Reanimated.View>
  )
}
export const PlayerScreen: NavigationControllerView = () => {
  const insets = useSafeAreaInsets()
  const contentStyle = useMemo(
    () => ({ paddingTop: insets.top, paddingBottom: insets.bottom }),
    [insets.top, insets.bottom],
  )
  const activePlayable = useActivePlayable()
  usePrefetchImageColors(activePlayable?.artwork ?? undefined)
  const { gradientColors, isGradientLight } = useCoverGradient(activePlayable?.artwork ?? undefined)
  const playerScreenContextValue = useMemo(
    () => ({
      isBackgroundLight: isGradientLight,
    }),
    [isGradientLight],
  )
  const navigation = useNavigation()
  // Once playback ends there is nothing to show, and the empty transparent modal would keep
  // covering the app. The delay rides out the gap between two tracks.
  const hasActivePlayable = !!activePlayable
  const { screenId } = use(ScreenItemContext)
  useEffect(() => {
    if (hasActivePlayable) return
    const timer = setTimeout(() => navigation.__internal_dismiss(screenId), 300)
    return () => clearTimeout(timer)
  }, [hasActivePlayable, navigation, screenId])
  if (!activePlayable) {
    return null
  }
  return (
    <SheetScreen onClose={() => navigation.dismiss()}>
      <PlayerScreenContext value={playerScreenContextValue}>
        <LinearGradient
          style={StyleSheet.absoluteFill}
          colors={gradientColors}
          start={{
            x: 0,
            y: 0,
          }}
          end={{
            x: 1,
            y: 0,
          }}
        />
        <View className="flex-1" style={contentStyle}>
          <View className="flex-1">
            <DismissIndicator />
            <CoverArt playable={activePlayable} />
            <View className="mx-10 flex-1">
              <Text
                className={cn(
                  "text-xl font-bold opacity-90",
                  isGradientLight ? "text-black" : "text-white",
                )}
                numberOfLines={1}
              >
                {activePlayable.title}
              </Text>
              <Text
                className={cn(
                  "mt-2 text-xl font-semibold opacity-60",
                  isGradientLight ? "text-black" : "text-white",
                )}
                numberOfLines={1}
              >
                {activePlayable.artist}
              </Text>
              <ProgressBar />
              <ControlGroup />
              <View className="flex-1" />
              <VolumeBar />
            </View>
          </View>
        </View>
      </PlayerScreenContext>
    </SheetScreen>
  )
}
PlayerScreen.transparent = true
function DismissIndicator() {
  const { isBackgroundLight } = usePlayerScreenContext()
  return (
    <View className="absolute inset-x-0 top-2 flex items-center justify-center">
      <View
        className={cn(
          "h-[5] w-[40] rounded-full",
          isBackgroundLight ? "bg-black/60" : "bg-white/60",
        )}
      />
    </View>
  )
}
