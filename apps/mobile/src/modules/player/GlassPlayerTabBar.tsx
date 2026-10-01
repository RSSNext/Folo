import { clsx } from "@follow/utils"
import { GlassView } from "expo-glass-effect"
import { Pressable, StyleSheet, View } from "react-native"

import { Image } from "@/src/components/ui/image/Image"
import { Text } from "@/src/components/ui/typography/Text"
import { useNavigation } from "@/src/lib/navigation/hooks"
import { useActivePlayable } from "@/src/lib/player"
import { PlayerScreen } from "@/src/screens/PlayerScreen"
import { usePrefetchImageColors } from "@/src/store/image/hooks"

import { PlayPauseButton, SeekButton, StopButton } from "./control"
import { useShouldShowPlayerBar } from "./hooks"

export function GlassPlayerTabBar({ className }: { className?: string }) {
  const activePlayable = useActivePlayable()
  const isVisible = useShouldShowPlayerBar()

  usePrefetchImageColors(activePlayable?.artwork ?? undefined)
  const navigation = useNavigation()

  if (!isVisible) return null

  return (
    <View className={clsx("mx-6", className)}>
      <View className="my-6 h-[56px] flex-1">
        <GlassView style={styles.glass} glassEffectStyle="regular" />
        <View className="flex-row items-center gap-4 overflow-hidden rounded-2xl p-2 px-3">
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
              className="size-12 rounded-full"
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
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  glass: {
    borderRadius: 99,
    ...StyleSheet.absoluteFill,
  },
})
