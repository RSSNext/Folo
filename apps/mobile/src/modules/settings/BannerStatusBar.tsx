import { StatusBar } from "expo-status-bar"
import { useAtomValue } from "jotai"
import { selectAtom } from "jotai/utils"
import { use, useMemo, useState } from "react"
import type { SharedValue } from "react-native-reanimated"
import { runOnJS, useAnimatedReaction } from "react-native-reanimated"

import { Navigation } from "@/src/lib/navigation/Navigation"
import { ScreenItemContext } from "@/src/lib/navigation/ScreenItemContext"

// Whether no other screen is pushed or presented over the screen this renders in
const useIsTopScreen = () => {
  const { screenId } = use(ScreenItemContext)
  return useAtomValue(
    useMemo(
      () =>
        selectAtom(Navigation.rootNavigation.__dangerous_getCtxValue().routesAtom, (routes) =>
          // The root and the tab screens are no routes; they are on top while nothing else is
          routes.some((route) => route.id === screenId)
            ? routes.at(-1)?.id === screenId
            : routes.length === 0,
        ),
      [screenId],
    ),
  )
}

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
  const isTopScreen = useIsTopScreen()
  const [isOverBanner, setIsOverBanner] = useState(true)
  useAnimatedReaction(
    () => scrollY.value < 50,
    (current, previous) => {
      if (current !== previous) runOnJS(setIsOverBanner)(current)
    },
  )
  if (!enabled || !isTopScreen || !isOverBanner) return null
  return <StatusBar animated style={gradientLight ? "dark" : "light"} />
}
