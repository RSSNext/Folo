import { cn } from "@follow/utils"
import MaskedView from "@react-native-masked-view/masked-view"
import { LinearGradient } from "expo-linear-gradient"
import type { FC } from "react"
import * as React from "react"
import type { LayoutChangeEvent } from "react-native"
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native"
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated"
import { useColor } from "react-native-uikit-colors"

import { AiCuteReIcon } from "@/src/icons/ai_cute_re"

export const AISummary: FC<{
  className?: string
  summary: string
  pending?: boolean
  error?: string
  onRetry?: () => void
}> = ({ className, summary, pending = false, error, onRetry }) => {
  const opacity = useSharedValue(0.3)
  const height = useSharedValue(0)

  React.useEffect(() => {
    if (pending) {
      opacity.value = withRepeat(
        withSequence(withTiming(1, { duration: 800 }), withTiming(0.3, { duration: 800 })),
        -1,
      )
    }
  }, [opacity, pending])

  const animatedContentStyle = useAnimatedStyle(() => ({
    height: height.value,
    opacity: height.value === 0 ? 0 : withTiming(1, { duration: 200 }),
    overflow: "hidden",
  }))

  const [contentHeight, setContentHeight] = React.useState(0)

  const measureContent = (event: LayoutChangeEvent) => {
    setContentHeight(event.nativeEvent.layout.height + 10)
    height.value = withSpring(event.nativeEvent.layout.height + 10, {
      damping: 20,
      stiffness: 90,
      mass: 1,
      overshootClamping: true,
      restDisplacementThreshold: 0.01,
      restSpeedThreshold: 0.01,
    })
  }

  const purpleColor = useColor("purple")

  if (pending) return null
  return (
    <Animated.View
      className={cn(
        "border-opaque-separator/50 mx-4 my-2 rounded-xl p-4",
        "bg-secondary-system-background/30",
        className,
      )}
      style={styles.card}
    >
      <View className="mb-2 flex-row items-center gap-2">
        <AiCuteReIcon height={16} width={16} color={purpleColor} />
        <MaskedView
          maskElement={
            <View className="bg-transparent">
              <Text className="text-[15px] font-semibold">AI Summary</Text>
            </View>
          }
        >
          <LinearGradient colors={["#9333ea", "#2563eb"]} start={[0, 0]} end={[1, 0]}>
            <Text className="text-[15px] font-semibold text-transparent">AI Summary</Text>
          </LinearGradient>
        </MaskedView>
      </View>
      <Animated.View style={animatedContentStyle}>
        <View style={{ height: contentHeight }}>
          {error ? (
            <View className="mt-3">
              <View className="flex-row items-center gap-2">
                <Text className="text-red flex-1 text-[15px] leading-[20px]">{error}</Text>
              </View>
              {onRetry && (
                <Pressable
                  onPress={onRetry}
                  className="bg-quaternary-system-fill mt-3 self-start rounded-full px-4 py-2"
                >
                  <Text className="text-label text-[14px] font-medium">Retry</Text>
                </Pressable>
              )}
            </View>
          ) : (
            <TextInput
              readOnly
              multiline
              className="text-label text-[15px] leading-[22px]"
              value={summary.trim()}
            />
          )}
        </View>
      </Animated.View>

      <View className="absolute opacity-0" pointerEvents="none">
        <View onLayout={measureContent}>
          {error ? (
            <View className="mt-3">
              <View className="flex-row items-center gap-2">
                <Text className="text-red flex-1 text-[15px] leading-[20px]">{error}</Text>
              </View>
              {onRetry && (
                <View className="bg-quaternary-system-fill mt-3 self-start rounded-full px-4 py-2">
                  <Text className="text-label text-[14px] font-medium">Retry</Text>
                </View>
              )}
            </View>
          ) : (
            <Text className="text-label mt-2 text-[14px] leading-[22px]">{summary.trim()}</Text>
          )}
        </View>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 0.5,
    elevation: 2,
  },
})
