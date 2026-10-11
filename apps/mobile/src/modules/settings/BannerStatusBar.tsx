import { StatusBar } from "expo-status-bar"
import { useState } from "react"
import type { SharedValue } from "react-native-reanimated"
import { runOnJS, useAnimatedReaction } from "react-native-reanimated"

/**
 * The status bar sits on the user banner until the header fades in, so its text follows the
 * banner colors, or it is dark on dark.
 */
export const BannerStatusBar = ({
  gradientLight,
  scrollY,
  enabled = true,
}: {
  gradientLight: boolean
  scrollY: SharedValue<number>
  enabled?: boolean
}) => {
  const [isOverBanner, setIsOverBanner] = useState(true)
  useAnimatedReaction(
    () => scrollY.value < 50,
    (current, previous) => {
      if (current !== previous) runOnJS(setIsOverBanner)(current)
    },
  )
  if (!enabled || !isOverBanner) return null
  return <StatusBar animated style={gradientLight ? "dark" : "light"} />
}
