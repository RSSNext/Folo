import { usePrefetchImageColors } from "@follow/store/image/hooks"
import { cn } from "@follow/utils"
import { useAtomValue } from "jotai"
import { use, useEffect } from "react"
import { Pressable, Text, View } from "react-native"
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"

import { Image } from "@/src/components/ui/image/Image"
import { BottomTabContext } from "@/src/lib/navigation/bottom-tab/BottomTabContext"
import { useNavigation } from "@/src/lib/navigation/hooks"
import { useActiveTrack } from "@/src/lib/player"
import { PlayerScreen } from "@/src/screens/PlayerScreen"

import { PlayPauseButton, SeekButton } from "./control"

const allowedTabIdentifiers = new Set(["IndexTabScreen", "SubscriptionsTabScreen"])

export function PlayerTabBar({ className }: { className?: string }) {
  const activeTrack = useActiveTrack()
  const tabRootCtx = use(BottomTabContext)
  const tabScreens = useAtomValue(tabRootCtx.tabScreensAtom)
  const currentIndex = useAtomValue(tabRootCtx.currentIndexAtom)
  const currentTabProps = tabScreens.find((tabScreen) => tabScreen.tabScreenIndex === currentIndex)
  const identifier = currentTabProps?.identifier

  const isVisible = !!activeTrack && identifier && allowedTabIdentifiers.has(identifier)
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

  usePrefetchImageColors(activeTrack?.artwork)
  const navigation = useNavigation()

  return (
    <Animated.View
      style={animatedStyle}
      className={cn("border-opaque-separator/50 border-b-hairline px-2", className)}
    >
      <Pressable
        onPress={() => {
          navigation.presentControllerView(PlayerScreen, void 0, "transparentModal")
        }}
      >
        <View className="flex flex-row items-center gap-4 overflow-hidden rounded-2xl p-2">
          <Image source={{ uri: activeTrack?.artwork ?? "" }} className="size-12 rounded-lg" />
          <View className="flex-1 overflow-hidden">
            <Text className="text-label text-lg font-semibold" numberOfLines={1}>
              {activeTrack?.title ?? ""}
            </Text>
          </View>
          <View className="mr-2 flex flex-row gap-4">
            <PlayPauseButton />
            <SeekButton />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  )
}
