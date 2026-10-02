import { cn } from "@follow/utils"
import { useEffect } from "react"
import { Pressable, View } from "react-native"
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"

import { Image } from "@/src/components/ui/image/Image"
import { Text } from "@/src/components/ui/typography/Text"
import { useNavigation } from "@/src/lib/navigation/hooks"
import { useActivePlayable } from "@/src/lib/player"
import { PlayerScreen } from "@/src/screens/PlayerScreen"
import { usePrefetchImageColors } from "@/src/store/image/hooks"

import { PlayPauseButton, SeekButton, StopButton } from "./control"
import { useShouldShowPlayerBar } from "./hooks"

export function PlayerTabBar({ className }: { className?: string }) {
  const activePlayable = useActivePlayable()
  const isVisible = useShouldShowPlayerBar()
  const isVisibleSV = useSharedValue(isVisible ? 1 : 0)
  useEffect(() => {
    isVisibleSV.value = withTiming(isVisible ? 1 : 0)
  }, [isVisible, isVisibleSV])
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: isVisibleSV.value,
      height: interpolate(isVisibleSV.value, [0, 1], [0, 56]),
      overflow: "hidden",
    }
  })
  usePrefetchImageColors(activePlayable?.artwork ?? undefined)
  const navigation = useNavigation()
  return (
    <Animated.View
      style={animatedStyle}
      className={cn("border-b-hairline border-opaque-separator/50 px-2", className)}
    >
      <View className="flex-row items-center gap-4 overflow-hidden rounded-2xl p-2">
        <Pressable
          testID="player-tab-bar"
          className="flex-1 flex-row items-center gap-3"
          onPress={() => {
            navigation.presentControllerView(PlayerScreen, void 0, "transparentModal")
          }}
        >
          <Image
            source={{
              uri: activePlayable?.artwork ?? "",
            }}
            className="size-12 rounded-lg"
          />
          <View className="flex-1 overflow-hidden">
            <Text className="text-lg font-semibold text-label" numberOfLines={1}>
              {activePlayable?.title ?? ""}
            </Text>
          </View>
        </Pressable>
        <View className="mr-2 flex-row items-center gap-4">
          <PlayPauseButton />
          <SeekButton />
          <StopButton />
        </View>
      </View>
    </Animated.View>
  )
}
