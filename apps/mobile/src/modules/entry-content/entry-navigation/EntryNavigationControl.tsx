import { cn } from "@follow/utils"
import { GlassView } from "expo-glass-effect"
import type { PropsWithChildren } from "react"
import { useTranslation } from "react-i18next"
import { Pressable, StyleSheet, View } from "react-native"
import type { SharedValue } from "react-native-reanimated"
import Animated, { useAnimatedStyle } from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useColor } from "react-native-uikit-colors"

import { ThemedBlurView } from "@/src/components/common/ThemedBlurView"
import { UpCuteReIcon } from "@/src/icons/up_cute_re"
import { isAndroid, isIos26 } from "@/src/lib/platform"
import { useFloatingPlayerBarInset } from "@/src/modules/player/hooks"

import type { EntryNavigationDirection } from "./adjacent-entries"
import {
  ENTRY_NAVIGATION_CONTROL_HEIGHT as CONTROL_HEIGHT,
  ENTRY_NAVIGATION_CONTROL_SPACING as CONTROL_SPACING,
} from "./constants"

/** How far below its place the control slides to be out of view, past its shadow */
const HIDDEN_EXTRA_OFFSET = 24

/**
 * Previous and next buttons floating at the bottom of the reader, so the entries of a list can
 * be read in turn without going back to it or scrolling to the end of each one.
 */
export const EntryNavigationControl = ({
  canGoPrevious,
  canGoNext,
  bottomInset,
  onNavigate,
  barsHiddenProgress,
  pullingUpProgress,
}: {
  canGoPrevious: boolean
  canGoNext: boolean
  /** Space below the control, when it is not the screen edge and the floating player bar */
  bottomInset?: number
  onNavigate: (direction: EntryNavigationDirection) => void
  /** The header's auto hide while scrolling, which the control follows */
  barsHiddenProgress: SharedValue<number>
  /** Pulling up past the end of the content, whose indicator shows where the control floats */
  pullingUpProgress: SharedValue<number>
}) => {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  // Above the floating player bar, which pushed screens show at the bottom while playing
  const floatingPlayerBarInset = useFloatingPlayerBarInset()
  const bottom =
    (bottomInset ?? Math.max(insets.bottom, CONTROL_SPACING) + floatingPlayerBarInset) +
    CONTROL_SPACING
  const hiddenOffset = bottom + CONTROL_HEIGHT + HIDDEN_EXTRA_OFFSET

  // Slides instead of fading: glass and blur effects don't render under a parent with opacity
  // below 1
  const slideStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: hiddenOffset * Math.max(barsHiddenProgress.value, pullingUpProgress.value),
      },
    ],
  }))

  if (!canGoPrevious && !canGoNext) return null

  return (
    <Animated.View
      pointerEvents="box-none"
      className="absolute inset-x-0 items-center"
      style={[{ bottom }, slideStyle]}
    >
      <ControlSurface>
        <NavigationButton
          label={t("entry.previous_entry")}
          disabled={!canGoPrevious}
          onPress={() => onNavigate("previous")}
          testID="entry-navigation-previous"
        />
        <NavigationButton
          label={t("entry.next_entry")}
          disabled={!canGoNext}
          onPress={() => onNavigate("next")}
          testID="entry-navigation-next"
          pointsDown
        />
      </ControlSurface>
    </Animated.View>
  )
}

const NavigationButton = ({
  label,
  disabled,
  onPress,
  testID,
  pointsDown,
}: {
  label: string
  disabled: boolean
  onPress: () => void
  testID: string
  pointsDown?: boolean
}) => {
  const labelColor = useColor("label")
  const disabledColor = useColor("tertiaryLabel")
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      className="items-center justify-center active:opacity-50"
      style={buttonStyle}
    >
      <View className={cn(pointsDown && "rotate-180")}>
        <UpCuteReIcon width={22} height={22} color={disabled ? disabledColor : labelColor} />
      </View>
    </Pressable>
  )
}

const surfaceClassName = "flex-row items-center rounded-full px-1"
const surfaceStyle = { height: CONTROL_HEIGHT }
const buttonStyle = { width: CONTROL_HEIGHT + 4, height: CONTROL_HEIGHT }
const glassStyle = { ...StyleSheet.absoluteFill, borderRadius: CONTROL_HEIGHT / 2 }

// Liquid glass where available, like the floating player bar, a blur on older iOS versions and
// an elevated surface on Android
const ControlSurface = ({ children }: PropsWithChildren) => {
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
