import { cn } from "@follow/utils"
import MaskedView from "@react-native-masked-view/masked-view"
import * as Haptics from "expo-haptics"
import { LinearGradient } from "expo-linear-gradient"
import type { FC, ReactNode } from "react"
import * as React from "react"
import type { LayoutChangeEvent } from "react-native"
import {
  Clipboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useColor } from "react-native-uikit-colors"

import { AiCuteReIcon } from "@/src/icons/ai_cute_re"
import { CloseCuteReIcon } from "@/src/icons/close_cute_re"
import { CopyCuteReIcon } from "@/src/icons/copy_cute_re"
import { isAndroid, isIOS } from "@/src/lib/platform"

export const AISummary: FC<{
  className?: string
  summary?: string | ReactNode
  pending?: boolean
  rawSummaryForCopy?: string
  error?: string
  onRetry?: () => void
}> = ({ className, summary, pending = false, rawSummaryForCopy, error, onRetry }) => {
  const opacity = useSharedValue(0.3)
  const height = useSharedValue(0)
  const [isSheetOpen, setSheetOpen] = React.useState(false)

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
      dampingRatio: 2,
      stiffness: 90,
      overshootClamping: true,
      restDisplacementThreshold: 0.01,
      restSpeedThreshold: 0.01,
      duration: 200,
    })
  }

  const purpleColor = useColor("purple")

  // Check if summary is a React element or string
  const isReactElement = React.isValidElement(summary)
  const summaryText = typeof summary === "string" ? summary : ""
  const summaryTextForSheet = rawSummaryForCopy || summaryText

  if (pending || (!summary && !error)) return null

  const mainContent = (
    <Animated.View
      className={cn(
        "border-opaque-separator/50 mx-4 my-2 rounded-xl",
        isReactElement ? "px-4 pt-4" : "p-4",
        // Opacity modifier style incorrectly applied in Android
        isAndroid ? "bg-secondary-system-background" : "bg-secondary-system-background/30",
        className,
      )}
      style={styles.card}
    >
      <View className="mb-2 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
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
        {summaryTextForSheet && (
          <TouchableOpacity
            onPress={() => setSheetOpen(true)}
            className="bg-quaternary-system-fill rounded-full p-1.5 active:opacity-70"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <CopyCuteReIcon width={14} height={14} color={purpleColor} />
          </TouchableOpacity>
        )}
      </View>
      <Animated.View style={animatedContentStyle}>
        <View style={{ height: contentHeight }}>
          {error ? (
            <View className="mt-3">
              <View className="flex-row items-center gap-2">
                <Text className="text-red flex-1 text-[14px] leading-[20px]">{error}</Text>
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
          ) : isReactElement ? (
            <View className="mt-2">{summary}</View>
          ) : (
            <TextInput
              readOnly
              multiline
              className="text-label text-[14px] leading-[22px]"
              value={summaryText?.trim()}
            />
          )}
        </View>
      </Animated.View>

      <View className="absolute w-full opacity-0">
        <View onLayout={measureContent}>
          {error ? (
            <View className="mt-3">
              <View className="flex-row items-center gap-2">
                <Text className="text-red flex-1 text-[14px] leading-[20px]">{error}</Text>
              </View>
              {onRetry && (
                <View className="bg-quaternary-system-fill mt-3 self-start rounded-full px-4 py-2">
                  <Text className="text-label text-[14px] font-medium">Retry</Text>
                </View>
              )}
            </View>
          ) : isReactElement ? (
            <View className="mt-2">{summary}</View>
          ) : (
            <Text className="text-label mt-2 text-[14px] leading-[22px]" selectable>
              {summaryText?.trim()}
            </Text>
          )}
        </View>
      </View>
    </Animated.View>
  )

  return (
    <>
      <Pressable onLongPress={summaryTextForSheet ? () => setSheetOpen(true) : undefined}>
        {mainContent}
      </Pressable>
      <SelectableTextSheet
        visible={isSheetOpen}
        onClose={() => setSheetOpen(false)}
        text={rawSummaryForCopy || summaryText}
      />
    </>
  )
}

const SelectableTextSheet: FC<{
  visible: boolean
  onClose: () => void
  text: string
}> = ({ visible, onClose, text }) => {
  const insets = useSafeAreaInsets()
  const translateY = useSharedValue(500)
  const [isRendered, setIsRendered] = React.useState(visible)

  const textColor = useColor("label")

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }))

  React.useEffect(() => {
    if (visible) {
      setIsRendered(true)
      translateY.value = withSpring(0, {
        damping: 20,
        stiffness: 150,
        overshootClamping: true,
      })
    } else {
      if (isRendered) {
        translateY.value = withTiming(800, { duration: 250 })
        setTimeout(() => {
          setIsRendered(false)
        }, 250)
      }
    }
  }, [visible, isRendered, translateY])

  if (!isRendered) {
    return null
  }

  const handleClose = () => {
    onClose()
  }

  const handleCopyAll = () => {
    Clipboard.setString(text)
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    handleClose()
  }

  return (
    // Wrap in a View to avoid rendering issues with Modal on Android
    <View>
      <Modal
        transparent
        visible={isRendered}
        onRequestClose={handleClose}
        animationType="fade"
        statusBarTranslucent
        navigationBarTranslucent
      >
        <Pressable onPress={handleClose} style={StyleSheet.absoluteFill}>
          <View className="bg-black/40" style={StyleSheet.absoluteFill} />
        </Pressable>
        <Animated.View
          className="bg-system-background absolute inset-x-0 bottom-0 max-h-[70%] overflow-hidden rounded-t-2xl border-t-zinc-200 p-4 dark:border-t-zinc-800"
          style={[{ paddingBottom: insets.bottom + 10 }, sheetAnimatedStyle]}
        >
          <View className="mb-4 flex-row items-center justify-between">
            <TouchableOpacity
              onPress={handleCopyAll}
              className="rounded-full bg-zinc-100 p-2 active:opacity-80 dark:bg-zinc-800"
            >
              <CopyCuteReIcon width={18} height={18} color={textColor} />
            </TouchableOpacity>
            <Text className="text-label text-lg font-semibold">AI Summary</Text>
            <TouchableOpacity
              onPress={handleClose}
              className="rounded-full bg-zinc-100 p-2 active:opacity-80 dark:bg-zinc-800"
            >
              <CloseCuteReIcon width={18} height={18} color={textColor} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <SelectableText className="text-label text-base leading-6">{text}</SelectableText>
          </ScrollView>
        </Animated.View>
      </Modal>
    </View>
  )
}

/**
 * A component that allows text selection on both iOS and Android.
 *
 * https://stackoverflow.com/a/78267868
 */
function SelectableText({ className, children }: { className?: string; children: ReactNode }) {
  if (isIOS) {
    return (
      <TextInput multiline editable={false} className={className}>
        {children}
      </TextInput>
    )
  } else {
    return (
      <Text selectable className={className}>
        {children}
      </Text>
    )
  }
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 0.5,
    elevation: 2,
  },
  sheetContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: "70%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    overflow: "hidden",
  },
  sheetHeader: {
    alignItems: "center",
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  textScrollView: {
    marginVertical: 15,
  },
  selectableText: {
    fontSize: 16,
    lineHeight: 24,
  },
})
