import { clsx } from "@follow/utils"
import { GlassView } from "expo-glass-effect"
import { useAtomValue } from "jotai"
import { use } from "react"
import { Pressable, StyleSheet, View } from "react-native"

import { Image } from "@/src/components/ui/image/Image"
import { Text } from "@/src/components/ui/typography/Text"
import { BottomTabContext } from "@/src/lib/navigation/bottom-tab/BottomTabContext"
import { useNavigation } from "@/src/lib/navigation/hooks"
import { useActivePlayable } from "@/src/lib/player"
import { PlayerScreen } from "@/src/screens/PlayerScreen"
import { usePrefetchImageColors } from "@/src/store/image/hooks"

import { PlayPauseButton, SeekButton } from "./control"

const allowedTabIdentifiers = new Set(["IndexTabScreen", "SubscriptionsTabScreen"])
export function GlassPlayerTabBar({ className }: { className?: string }) {
  const activePlayable = useActivePlayable()
  const tabRootCtx = use(BottomTabContext)
  const tabScreens = useAtomValue(tabRootCtx.tabScreensAtom)
  const currentIndex = useAtomValue(tabRootCtx.currentIndexAtom)
  const currentTabProps = tabScreens.find((tabScreen) => tabScreen.tabScreenIndex === currentIndex)
  const identifier = currentTabProps?.identifier
  const isVisible = !!activePlayable && identifier && allowedTabIdentifiers.has(identifier)

  usePrefetchImageColors(activePlayable?.artwork ?? undefined)
  const navigation = useNavigation()

  if (!isVisible) return null

  return (
    <View className={clsx("mx-6", className)}>
      <View className="my-6 h-[56px] flex-1">
        <GlassView style={styles.glass} glassEffectStyle="regular" />
        <Pressable
          testID="player-tab-bar"
          onPress={() => {
            navigation.presentControllerView(PlayerScreen, void 0, "transparentModal")
          }}
        >
          <View className="flex flex-row items-center gap-4 overflow-hidden rounded-2xl p-2 px-3">
            <Image
              source={{
                uri: activePlayable?.artwork ?? "",
              }}
              className="size-12 rounded-full"
            />
            <View className="flex-1 overflow-hidden">
              <Text className="text-lg font-semibold text-label" numberOfLines={1}>
                {activePlayable?.title ?? ""}
              </Text>
            </View>
            <View className="mr-2 flex flex-row gap-4">
              <PlayPauseButton />
              <SeekButton />
            </View>
          </View>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  glass: {
    borderRadius: 99,
    ...StyleSheet.absoluteFillObject,
  },
})
