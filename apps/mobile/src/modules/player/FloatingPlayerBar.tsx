import { cn } from "@follow/utils"
import { Portal } from "@gorhom/portal"
import { GlassView } from "expo-glass-effect"
import { useAtomValue } from "jotai"
import type { PropsWithChildren } from "react"
import { use } from "react"
import { Pressable, StyleSheet, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { ThemedBlurView } from "@/src/components/common/ThemedBlurView"
import { Image } from "@/src/components/ui/image/Image"
import { useLightbox } from "@/src/components/ui/lightbox/lightboxState"
import { Text } from "@/src/components/ui/typography/Text"
import { BottomTabContext } from "@/src/lib/navigation/bottom-tab/BottomTabContext"
import { ChainNavigationContext } from "@/src/lib/navigation/ChainNavigationContext"
import { useNavigation } from "@/src/lib/navigation/hooks"
import { NavigationInstanceContext } from "@/src/lib/navigation/NavigationInstanceContext"
import { isAndroid, isIos26 } from "@/src/lib/platform"
import { useActivePlayable } from "@/src/lib/player"
import { PlayerScreen } from "@/src/screens/PlayerScreen"
import { usePrefetchImageColors } from "@/src/store/image/hooks"

import { PlayPauseButton, SeekButton, StopButton } from "./control"
import {
  FLOATING_PLAYER_BAR_HEIGHT,
  FLOATING_PLAYER_BAR_SPACING,
  isRootStackPushedScreenOnTop,
} from "./floating-player-bar"
import { useShouldShowPlayerBar } from "./hooks"

/**
 * Player bar for screens pushed over the JS tab bar, which hide the tab bar and its player bar.
 * It lives in the root portal so it stays in place while screens are pushed and popped.
 */
export function FloatingPlayerBar() {
  const insets = useSafeAreaInsets()
  const bottomTabContext = use(BottomTabContext)
  const chainNavigationContext = use(ChainNavigationContext)
  const navigation = useNavigation()

  // The root portal host is outside of these providers
  return (
    <Portal>
      <BottomTabContext value={bottomTabContext}>
        <ChainNavigationContext value={chainNavigationContext}>
          <NavigationInstanceContext value={navigation}>
            <FloatingPlayerBarContent bottomInset={insets.bottom} />
          </NavigationInstanceContext>
        </ChainNavigationContext>
      </BottomTabContext>
    </Portal>
  )
}

function FloatingPlayerBarContent({ bottomInset }: { bottomInset: number }) {
  const showPlayerBar = useShouldShowPlayerBar()
  const { routesAtom } = use(ChainNavigationContext)
  const routes = useAtomValue(routesAtom)
  // The lightbox is drawn below the root portal host, so the bar would cover it
  const { activeLightbox } = useLightbox()
  const activePlayable = useActivePlayable()
  usePrefetchImageColors(activePlayable?.artwork ?? undefined)
  const navigation = useNavigation()

  if (!showPlayerBar || !isRootStackPushedScreenOnTop(routes) || activeLightbox) {
    return null
  }

  // No fade in or out: glass and blur effects don't render under a parent with opacity below 1
  return (
    <View
      pointerEvents="box-none"
      className="absolute inset-x-0 px-4"
      style={{ bottom: bottomInset + FLOATING_PLAYER_BAR_SPACING }}
    >
      <PlayerBarSurface>
        <Pressable
          testID="floating-player-bar"
          className="flex-1 flex-row items-center gap-3"
          onPress={() => {
            navigation.presentControllerView(PlayerScreen, void 0, "transparentModal")
          }}
        >
          <Image
            source={{
              uri: activePlayable?.artwork ?? "",
            }}
            className="size-10 rounded-full"
          />
          <View className="flex-1 overflow-hidden">
            <Text className="text-base font-semibold text-label" numberOfLines={1}>
              {activePlayable?.title ?? ""}
            </Text>
          </View>
        </Pressable>
        <View className="flex-row items-center gap-4">
          <PlayPauseButton />
          <SeekButton />
          <StopButton />
        </View>
      </PlayerBarSurface>
    </View>
  )
}

const surfaceClassName =
  "w-full max-w-[680px] flex-row items-center gap-3 self-center rounded-full pl-2 pr-4"
const surfaceStyle = { height: FLOATING_PLAYER_BAR_HEIGHT }
const glassStyle = { ...StyleSheet.absoluteFill, borderRadius: FLOATING_PLAYER_BAR_HEIGHT / 2 }

// Liquid glass like the iPhone player bar where available, a blur on older iOS versions and an
// elevated surface on Android
function PlayerBarSurface({ children }: PropsWithChildren) {
  if (isAndroid) {
    return (
      <View
        className={cn(surfaceClassName, "bg-secondary-system-grouped-background shadow-lg")}
        style={surfaceStyle}
      >
        {children}
      </View>
    )
  }

  if (isIos26) {
    return (
      <View className={surfaceClassName} style={surfaceStyle}>
        <GlassView style={glassStyle} glassEffectStyle="regular" />
        {children}
      </View>
    )
  }

  return (
    <View
      className={cn(surfaceClassName, "border-hairline overflow-hidden border-opaque-separator/50")}
      style={surfaceStyle}
    >
      <ThemedBlurView style={StyleSheet.absoluteFill} />
      {children}
    </View>
  )
}
