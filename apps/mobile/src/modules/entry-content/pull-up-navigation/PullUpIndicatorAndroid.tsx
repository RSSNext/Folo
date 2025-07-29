import { cn } from "@follow/utils"
import { useTranslation } from "react-i18next"
import { View } from "react-native"
import Animated, { useAnimatedStyle, withTiming } from "react-native-reanimated"
import { useColor } from "react-native-uikit-colors"

import { Text } from "@/src/components/ui/typography/Text"
import { ArrowLeftCuteReIcon } from "@/src/icons/arrow_left_cute_re"

import type { UsePullUpToNextReturn } from "./types"

/**
 * Component that handles pulling up to navigate to the next unread entry for Android
 */
export const PullUpIndicatorAndroid: UsePullUpToNextReturn["EntryPullUpToNext"] = ({
  active,
  hide = false,
  translateY,
}) => {
  const { t } = useTranslation()
  const textColor = useColor("secondaryLabel")
  const iconColor = useColor("label")

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -translateY.value }],
    // paddingBottom: insets.bottom,
    opacity: withTiming(hide ? 0 : 1, { duration: 100 }),
  }))

  return (
    <Animated.View
      className="bottom-0 flex w-full flex-row items-center justify-center gap-2 pt-16"
      style={animatedStyle}
    >
      <View
        className={cn(
          "flex flex-row items-center gap-2 transition-all duration-200",
          active ? "opacity-50" : "opacity-80",
        )}
      >
        <View
          className={cn(
            "rotate-90 transition-all duration-200",
            active ? "opacity-0" : "opacity-100",
          )}
        >
          <ArrowLeftCuteReIcon width={16} height={16} color={iconColor} />
        </View>
        <Text style={{ color: textColor }}>
          {active ? t("entry.release_to_next_entry") : t("entry.pull_up_to_next_entry")}
        </Text>
      </View>
    </Animated.View>
  )
}
